import { useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable, Alert, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { fetchRequestLocations, RequestLocations, updateResponderLiveLocation, updateResponderLocation } from '@/lib/api';
import { buildGoogleDirectionsUrl } from '@/lib/mapsDirections';
import * as Location from 'expo-location';

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function ResponderTrackRequestScreen() {
  const params = useLocalSearchParams<{ id?: string; lat?: string; lng?: string }>();
  const lat = params.lat ? Number(params.lat) : undefined;
  const lng = params.lng ? Number(params.lng) : undefined;

  const [locations, setLocations] = useState<RequestLocations | null>(null);
  const [myLat, setMyLat] = useState<number | null>(null);
  const [myLng, setMyLng] = useState<number | null>(null);
  
  const mapRef = useRef<MapView | null>(null);

  const incidentLat = locations?.incident?.coordinates?.lat ?? lat;
  const incidentLng = locations?.incident?.coordinates?.lng ?? lng;
  const responderLat = myLat ?? locations?.responderLive?.coordinates?.lat;
  const responderLng = myLng ?? locations?.responderLive?.coordinates?.lng;
  const citizenLat = locations?.citizenLive?.coordinates?.lat;
  const citizenLng = locations?.citizenLive?.coordinates?.lng;

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        setMyLat(pos.coords.latitude);
        setMyLng(pos.coords.longitude);
      } catch {
        // ignore
      }
    })();
  }, []);

  // Watch responder's own GPS and send to backend
  useEffect(() => {
    if (!params.id) return;
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 15 },
          async (pos) => {
            if (cancelled) return;
            setMyLat(pos.coords.latitude);
            setMyLng(pos.coords.longitude);
            try {
              await updateResponderLiveLocation(params.id as string, {
                coordinates: { lat: pos.coords.latitude, lng: pos.coords.longitude },
                accuracy: pos.coords.accuracy ?? undefined,
                at: new Date(pos.timestamp).toISOString(),
              });
            } catch {}
          }
        );
      } catch {}
    })();

    return () => {
      cancelled = true;
      try { subscription?.remove(); } catch {}
    };
  }, [params.id]);

  // Poll locations from backend (incident + citizen)
  useEffect(() => {
    if (!params.id) return;
    let cancelled = false;

    const load = async () => {
      try {
        const data = await fetchRequestLocations(params.id as string);
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
  }, [params.id]);

  const mapRegion = useMemo(() => {
    if (typeof incidentLat !== 'number' || typeof incidentLng !== 'number') return null;
    return {
      latitude: incidentLat,
      longitude: incidentLng,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
  }, [incidentLat, incidentLng]);

  const openGoogleMapsToIncident = async () => {
    if (typeof incidentLat !== 'number' || typeof incidentLng !== 'number') {
      Alert.alert('Missing location', 'Incident coordinates are not available for this request.');
      return;
    }
    const destination = { lat: incidentLat, lng: incidentLng };
    const url =
      typeof responderLat === 'number' && typeof responderLng === 'number'
        ? buildGoogleDirectionsUrl({ lat: responderLat, lng: responderLng }, destination)
        : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${incidentLat},${incidentLng}`)}&travelmode=driving`;
    const can = await Linking.canOpenURL(url);
    if (!can) {
      Alert.alert('Unable to open Maps', 'Google Maps is not available on this device.');
      return;
    }
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Live Rescue Tracking</Text>
          {params.id && <Text style={styles.subtitle}>Request {params.id}</Text>}
        </View>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusLeft}>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusPillText}>Tracking Active</Text>
          </View>
          <Text style={styles.statusLine}>Incident location is fixed. Your position updates live.</Text>
        </View>
        <Pressable style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.9 }]} onPress={openGoogleMapsToIncident}>
          <Ionicons name="navigate" size={18} color={Colors.white} />
          <Text style={styles.navBtnText}>Navigate</Text>
        </Pressable>
      </View>

      <View style={styles.mapCard}>
        <View style={styles.mapHeader}>
          <View style={styles.mapTitleRow}>
            <MaterialCommunityIcons name="map-marker-distance" size={18} color={Colors.teal} />
            <Text style={styles.mapTitle}>Live Map</Text>
          </View>
          <Text style={styles.mapHint}>Blue line = full road route from you to the emergency.</Text>
        </View>

        <View style={styles.mapPlaceholder}>
          {mapRegion ? (
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={mapRegion}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              showsUserLocation={false}
              showsMyLocationButton={false}
            >
              {typeof responderLat === 'number' && typeof responderLng === 'number' &&
               typeof incidentLat === 'number' && typeof incidentLng === 'number' && GOOGLE_MAPS_KEY && (
                <MapViewDirections
                  origin={{ latitude: responderLat, longitude: responderLng }}
                  destination={{ latitude: incidentLat, longitude: incidentLng }}
                  apikey={GOOGLE_MAPS_KEY}
                  strokeWidth={5}
                  strokeColor={Colors.info}
                  optimizeWaypoints={true}
                  onReady={(result) => {
                    mapRef.current?.fitToCoordinates(result.coordinates, {
                      edgePadding: {
                        right: 50,
                        bottom: 50,
                        left: 50,
                        top: 50,
                      },
                    });
                  }}
                  onError={(errorMessage) => {
                    console.error('MapViewDirections Error:', errorMessage);
                  }}
                />
              )}
              {typeof incidentLat === 'number' && typeof incidentLng === 'number' && (
                <Marker
                  coordinate={{ latitude: incidentLat, longitude: incidentLng }}
                  title="Incident"
                  description={locations?.incident?.location || 'Reported location'}
                >
                  <View style={[styles.pinBubble, { backgroundColor: Colors.navy }]}>
                    <Ionicons name="warning" size={16} color={Colors.white} />
                  </View>
                </Marker>
              )}
              {typeof responderLat === 'number' && typeof responderLng === 'number' && (
                <Marker coordinate={{ latitude: responderLat, longitude: responderLng }} title="You (Responder)">
                  <View style={[styles.pinBubble, { backgroundColor: Colors.danger }]}>
                    <MaterialCommunityIcons name="ambulance" size={16} color={Colors.white} />
                  </View>
                </Marker>
              )}
              {typeof citizenLat === 'number' && typeof citizenLng === 'number' && (
                <Marker coordinate={{ latitude: citizenLat, longitude: citizenLng }} title="Citizen">
                  <View style={[styles.pinBubble, { backgroundColor: Colors.teal }]}>
                    <Ionicons name="person" size={16} color={Colors.white} />
                  </View>
                </Marker>
              )}
            </MapView>
          ) : (
            <View style={styles.mapFallback}>
              <Ionicons name="map-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.mapFallbackText}>Loading map…</Text>
            </View>
          )}

          <View style={styles.mapFooter}>
            {typeof incidentLat === 'number' && typeof incidentLng === 'number' ? (
              <Text style={styles.coordsText}>
                Incident: {incidentLat.toFixed(4)}, {incidentLng.toFixed(4)}
              </Text>
            ) : (
              <Text style={styles.coordsText}>Using request location.</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.legendCard}>
        <Text style={styles.legendTitle}>Legend</Text>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: Colors.navy }]} />
          <Text style={styles.legendLabel}>Incident location (fixed)</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: Colors.danger }]} />
          <Text style={styles.legendLabel}>You (Responder)</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: Colors.teal }]} />
          <Text style={styles.legendLabel}>Citizen live position</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Colors.shadow,
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}),
  },
  headerTextWrap: { flex: 1 },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },

  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    backgroundColor: Colors.white,
    marginBottom: 18,
    ...Colors.shadow,
    gap: 12,
  },
  statusLeft: { flex: 1 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(13,148,136,0.08)',
    marginBottom: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.teal, marginRight: 6 },
  statusPillText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.teal },
  statusLine: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },

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

  mapCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    ...Colors.shadow,
  },
  mapHeader: { marginBottom: 10 },
  mapTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  mapTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  mapHint: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  mapPlaceholder: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth:  1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  map: { height: 260, width: '100%' },
  mapFallback: { height: 260, alignItems: 'center', justifyContent: 'center', gap: 10 },
  mapFallbackText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  pinBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    ...Colors.shadow,
  },
  mapFooter: {
    height: 32,
    paddingHorizontal: 12,
    alignItems: 'flex-start',
    justifyContent: 'center',
    backgroundColor: '#020617',
  },
  coordsText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(248,250,252,0.7)' },

  legendCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    ...Colors.shadow,
  },
  legendTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
});
