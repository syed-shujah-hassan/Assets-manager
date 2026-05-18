import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { fetchRequestById, updateRequestStatus, EmergencyRequest, fetchRequestLocations, updateResponderLiveLocation, RequestLocations, updateResponderLocation } from '@/lib/api';
import { buildGoogleDirectionsUrl } from '@/lib/mapsDirections';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';

function getStatusColor(status: string) {
  switch (status) {
    case 'Pending': return { bg: Colors.warningLight, text: Colors.warning };
    case 'Assigned': return { bg: Colors.infoLight, text: Colors.info };
    case 'En Route': return { bg: Colors.infoLight, text: Colors.info };
    case 'Arrived': return { bg: 'rgba(13,148,136,0.1)', text: Colors.teal };
    case 'Resolved': return { bg: Colors.successLight, text: Colors.success };
    case 'Cancelled': return { bg: Colors.dangerLight, text: Colors.danger };
    default: return { bg: Colors.background, text: Colors.textSecondary };
  }
}

export default function ResponderRequestDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [request, setRequest] = useState<EmergencyRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [locations, setLocations] = useState<RequestLocations | null>(null);
  const lastSentAtRef = useRef<number>(0);

  const isInProgress = !!request && (request.status === 'Assigned' || request.status === 'En Route' || request.status === 'Arrived');

  const isAssignedToMe = !!request && request.status !== 'Pending' && request.responderId;

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchRequestById(id || '');
        setRequest(data || null);
        if (data && (data.status === 'En Route' || data.status === 'Arrived')) setNavigating(true);
      } catch (e) {} finally { setLoading(false); }
    })();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchRequestLocations(id);
        if (!cancelled) setLocations(data);
      } catch {
        // ignore
      }
    };

    load();
    const interval = setInterval(load, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id]);

  useEffect(() => {
    if (!id || !request || !isInProgress || !navigating) return;

    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000,
            distanceInterval: 25,
          },
          async (pos) => {
            if (cancelled) return;
            const now = Date.now();
            if (now - lastSentAtRef.current < 8000) return;
            lastSentAtRef.current = now;

            const payload = {
              coordinates: { lat: pos.coords.latitude, lng: pos.coords.longitude },
              accuracy: pos.coords.accuracy ?? undefined,
              at: new Date(pos.timestamp).toISOString(),
            };

            try {
              await updateResponderLiveLocation(id, {
                responderId: request.responderId,
                ...payload,
              });
            } catch {
              // ignore
            }

            if (request.responderId) {
              try {
                await updateResponderLocation(request.responderId, payload);
              } catch {
                // ignore
              }
            }
          }
        );
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
      try {
        subscription?.remove();
      } catch {
        // ignore
      }
    };
  }, [id, request?.status, navigating]);

  const handleStatusUpdate = async (status: EmergencyRequest['status']) => {
    if (!request) return;
    setUpdating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const updated = await updateRequestStatus(request.id, status);
      setRequest(updated);
      if (status === 'En Route') setNavigating(true);
      if (status === 'Arrived' || status === 'Resolved' || status === 'Cancelled') setNavigating(false);
      if (status === 'Resolved') {
        Alert.alert('Resolved', 'This request has been marked as resolved.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };


  if (loading) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator size="large" color={Colors.teal} />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.loadingState}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.emptyText}>Request not found</Text>
      </View>
    );
  }

  const color = getStatusColor(request.status);

  const incidentLat = request.coordinates?.lat;
  const incidentLng = request.coordinates?.lng;
  const citizenLiveLat = locations?.citizenLive?.coordinates?.lat;
  const citizenLiveLng = locations?.citizenLive?.coordinates?.lng;

  const openGoogleMapsTo = async (lat: number, lng: number) => {
    const destination = { lat, lng };
    let url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}&travelmode=driving`;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        url = buildGoogleDirectionsUrl(
          { lat: pos.coords.latitude, lng: pos.coords.longitude },
          destination
        );
      }
    } catch {
      // destination-only fallback
    }
    const can = await Linking.canOpenURL(url);
    if (!can) {
      Alert.alert('Unable to open Maps', 'Google Maps is not available on this device.');
      return;
    }
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.statusCard}>
        <View style={[styles.statusBadge, { backgroundColor: color.bg }]}>
          <Text style={[styles.statusText, { color: color.text }]}>{request.status}</Text>
        </View>
        <Text style={styles.requestId}>{request.id}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Description</Text>
        <Text style={styles.descText}>{request.description}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Photo Evidence</Text>
        <View style={styles.photoPlaceholder}>
          <Ionicons name="image-outline" size={32} color={Colors.textMuted} />
          <Text style={styles.photoText}>{request.photoUri ? 'Photo attached' : 'No photo available'}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Location</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={18} color={Colors.teal} />
          <Text style={styles.locationText}>{request.location}</Text>
        </View>
        <Text style={styles.coordsText}>{request.coordinates.lat}, {request.coordinates.lng}</Text>
        <View style={styles.navRow}>
          <Pressable
            style={({ pressed }) => [styles.navBtn, { backgroundColor: Colors.info }, pressed && { opacity: 0.9 }]}
            onPress={() => {
              router.push({
                pathname: '/responder/track-request',
                params: {
                  id: request.id,
                  lat: String(request.coordinates.lat),
                  lng: String(request.coordinates.lng),
                },
              });
            }}
          >
            <Ionicons name="map" size={18} color={Colors.white} />
            <Text style={styles.navBtnText}>Open Live Map</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.9 }]}
            onPress={() => {
              if (typeof incidentLat !== 'number' || typeof incidentLng !== 'number') {
                Alert.alert('Missing location', 'Incident coordinates are not available for this request.');
                return;
              }
              openGoogleMapsTo(incidentLat, incidentLng);
            }}
          >
            <Ionicons name="navigate" size={18} color={Colors.white} />
            <Text style={styles.navBtnText}>Navigate to Incident</Text>
          </Pressable>
          {typeof citizenLiveLat === 'number' && typeof citizenLiveLng === 'number' && (
            <Pressable
              style={({ pressed }) => [styles.navBtn, { backgroundColor: Colors.navy }, pressed && { opacity: 0.9 }]}
              onPress={() => openGoogleMapsTo(citizenLiveLat, citizenLiveLng)}
            >
              <Ionicons name="person" size={18} color={Colors.white} />
              <Text style={styles.navBtnText}>Navigate to Citizen</Text>
            </Pressable>
          )}
        </View>
        {request.distance && (
          <View style={styles.distanceRow}>
            <Ionicons name="navigate" size={14} color={Colors.navy} />
            <Text style={styles.distanceText}>{request.distance} away</Text>
          </View>
        )}
      </View>

      {(typeof citizenLiveLat === 'number' && typeof citizenLiveLng === 'number') && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Citizen Live Location</Text>
          <Text style={styles.coordsText}>{citizenLiveLat}, {citizenLiveLng}</Text>
          <Text style={styles.liveHint}>Live location updates while citizen app is open.</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Reported By</Text>
        <View style={styles.userRow}>
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={20} color={Colors.white} />
          </View>
          <View>
            <Text style={styles.userName}>{request.userName}</Text>
            <Text style={styles.userDate}>{new Date(request.createdAt).toLocaleString()}</Text>
            {request.userPhone && (
              <Text style={styles.userPhone}>{request.userPhone}</Text>
            )}
          </View>
        </View>
      </View>

      {isAssignedToMe && request.status !== 'Resolved' && request.status !== 'Cancelled' && (
        <View style={styles.progressActions}>
          <Text style={styles.progressTitle}>Update Status</Text>
          {request.status === 'Assigned' && (
            <Pressable
              style={({ pressed }) => [styles.progressBtn, { backgroundColor: Colors.info }, pressed && { opacity: 0.9 }, updating && { opacity: 0.7 }]}
              onPress={() => handleStatusUpdate('En Route')}
              disabled={updating}
            >
              <MaterialCommunityIcons name="car-emergency" size={22} color={Colors.white} />
              <Text style={styles.progressBtnText}>Start Navigation</Text>
            </Pressable>
          )}
          {request.status === 'En Route' && (
            <>
              <Pressable
                style={({ pressed }) => [styles.progressBtn, { backgroundColor: Colors.danger }, pressed && { opacity: 0.9 }]}
                onPress={() => setNavigating(false)}
              >
                <Ionicons name="stop" size={22} color={Colors.white} />
                <Text style={styles.progressBtnText}>Stop Navigation</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.progressBtn, { backgroundColor: Colors.teal }, pressed && { opacity: 0.9 }, updating && { opacity: 0.7 }]}
                onPress={() => handleStatusUpdate('Arrived')}
                disabled={updating}
              >
                <Ionicons name="flag" size={22} color={Colors.white} />
                <Text style={styles.progressBtnText}>Mark Arrived</Text>
              </Pressable>
            </>
          )}
          {request.status === 'Arrived' && (
            <Pressable
              style={({ pressed }) => [styles.progressBtn, { backgroundColor: Colors.success }, pressed && { opacity: 0.9 }, updating && { opacity: 0.7 }]}
              onPress={() => handleStatusUpdate('Resolved')}
              disabled={updating}
            >
              <Ionicons name="checkmark-circle" size={22} color={Colors.white} />
              <Text style={styles.progressBtnText}>Mark Resolved</Text>
            </Pressable>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 20, paddingBottom: 40 },
  loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 16, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  statusCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 20,
    alignItems: 'center', marginBottom: 14, ...Colors.shadow,
  },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 8 },
  statusText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  requestId: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  card: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 18,
    marginBottom: 14, ...Colors.shadow,
  },
  cardLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  descText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textPrimary, lineHeight: 22 },
  photoPlaceholder: {
    alignItems: 'center', paddingVertical: 24, gap: 8,
    backgroundColor: Colors.background, borderRadius: 10,
  },
  photoText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  locationText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textPrimary, flex: 1 },
  coordsText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, paddingLeft: 26 },
  navRow: { flexDirection: 'row', gap: 10, marginTop: 12, flexWrap: 'wrap' },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.teal,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    ...Colors.shadow,
  },
  navBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.white },
  liveHint: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 6 },
  distanceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  distanceText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.navy },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  userAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.textMuted, alignItems: 'center', justifyContent: 'center',
  },
  userName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  userDate: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 1 },
  userPhone: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.teal, marginTop: 2 },
  progressActions: { gap: 12, marginTop: 4 },
  progressTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  progressBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.info, borderRadius: 14, paddingVertical: 16, ...Colors.shadow,
  },
  progressBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.white },
});
