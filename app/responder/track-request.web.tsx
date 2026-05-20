import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable, Linking, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { fetchRequestLocations, RequestLocations } from '@/lib/api';
import { buildGoogleDirectionsEmbedUrl, buildGoogleDirectionsUrl, MapPoint } from '@/lib/mapsDirections';
import * as Location from 'expo-location';

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

function WebRouteIframe({ src }: { src: string }) {
  if (Platform.OS !== 'web') return null;
  return (
    <View style={styles.iframeWrap}>
      {React.createElement('iframe', {
        title: 'Driving route',
        src,
        style: { width: '100%', height: '100%', border: 0, borderRadius: 14 },
        loading: 'lazy',
        allowFullScreen: true,
        referrerPolicy: 'no-referrer-when-downgrade',
      })}
    </View>
  );
}

export default function ResponderTrackRequestScreen() {
  const params = useLocalSearchParams<{ id?: string; lat?: string; lng?: string }>();
  const lat = params.lat ? Number(params.lat) : undefined;
  const lng = params.lng ? Number(params.lng) : undefined;

  const [locations, setLocations] = useState<RequestLocations | null>(null);
  const [origin, setOrigin] = useState<MapPoint | null>(null);
  const [originLoading, setOriginLoading] = useState(true);

  const incidentLat = locations?.incident?.coordinates?.lat ?? lat;
  const incidentLng = locations?.incident?.coordinates?.lng ?? lng;

  const destination = useMemo(() => {
    if (typeof incidentLat !== 'number' || typeof incidentLng !== 'number') return null;
    return { lat: incidentLat, lng: incidentLng };
  }, [incidentLat, incidentLng]);

  useEffect(() => {
    let cancelled = false;
    setOriginLoading(true);

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 0,
            });
          });
          if (!cancelled) {
            setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          }
          return;
        }

        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        if (!cancelled) {
          setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setOriginLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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

  const embedUrl =
    GOOGLE_MAPS_KEY && origin && destination
      ? buildGoogleDirectionsEmbedUrl(GOOGLE_MAPS_KEY, origin, destination)
      : null;

  const openFullRoute = async () => {
    if (!destination) {
      return;
    }
    const url = origin
      ? buildGoogleDirectionsUrl(origin, destination)
      : `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
    const can = await Linking.canOpenURL(url);
    if (can) Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Live Rescue Tracking</Text>
          {params.id && (
            <Text style={styles.subtitle}>
              {locations?.referenceCode ? `Request ${locations.referenceCode}` : 'Request ···'}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusLeft}>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusPillText}>Route tracking</Text>
          </View>
          <Text style={styles.statusLine}>
            Full driving path from your location to the emergency (inDrive style).
          </Text>
        </View>
        <Pressable style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.9 }]} onPress={openFullRoute}>
          <Ionicons name="navigate" size={18} color={Colors.white} />
          <Text style={styles.navBtnText}>Navigate</Text>
        </Pressable>
      </View>

      <View style={styles.mapCard}>
        <View style={styles.mapHeader}>
          <View style={styles.mapTitleRow}>
            <MaterialCommunityIcons name="map-marker-distance" size={18} color={Colors.teal} />
            <Text style={styles.mapTitle}>Driving route</Text>
          </View>
          <Text style={styles.mapHint}>Blue line = exact roads from start to emergency.</Text>
        </View>

        <View style={styles.mapPlaceholder}>
          {originLoading ? (
            <View style={styles.mapFallback}>
              <ActivityIndicator color={Colors.teal} />
              <Text style={styles.mapFallbackText}>Getting your location for route…</Text>
            </View>
          ) : embedUrl ? (
            <WebRouteIframe src={embedUrl} />
          ) : !GOOGLE_MAPS_KEY ? (
            <View style={styles.mapFallback}>
              <Text style={styles.mapFallbackText}>Google Maps API key missing in .env</Text>
            </View>
          ) : !destination ? (
            <View style={styles.mapFallback}>
              <Text style={styles.mapFallbackText}>Incident coordinates not available.</Text>
            </View>
          ) : (
            <View style={styles.mapFallback}>
              <Text style={styles.mapFallbackText}>Allow location access to draw the route.</Text>
              <Pressable style={styles.navBtn} onPress={openFullRoute}>
                <Text style={styles.navBtnText}>Open in Google Maps</Text>
              </Pressable>
            </View>
          )}

          {destination && (
            <View style={styles.mapFooter}>
              <Text style={styles.coordsText}>
                {origin
                  ? `From you → Emergency: ${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`
                  : `Emergency: ${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`}
              </Text>
            </View>
          )}
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
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  iframeWrap: { height: 320, width: '100%' },
  mapFallback: { height: 320, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16 },
  mapFallbackText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted, textAlign: 'center' },
  mapFooter: {
    height: 36,
    paddingHorizontal: 12,
    alignItems: 'flex-start',
    justifyContent: 'center',
    backgroundColor: '#020617',
  },
  coordsText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(248,250,252,0.7)' },
});
