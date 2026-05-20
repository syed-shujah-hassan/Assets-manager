import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { fetchRequestLocations, RequestLocations } from '@/lib/api';

export default function TrackRequestScreen() {
  const params = useLocalSearchParams<{ id?: string; lat?: string; lng?: string }>();
  const lat = params.lat ? Number(params.lat) : undefined;
  const lng = params.lng ? Number(params.lng) : undefined;

  const [locations, setLocations] = useState<RequestLocations | null>(null);

  const hasCoordinates = useMemo(
    () => typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng),
    [lat, lng]
  );

  const incidentLat = locations?.incident?.coordinates?.lat ?? lat;
  const incidentLng = locations?.incident?.coordinates?.lng ?? lng;
  const responderLat = locations?.responderLive?.coordinates?.lat;
  const responderLng = locations?.responderLive?.coordinates?.lng;

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
            <Text style={styles.statusPillText}>Responder En Route</Text>
          </View>
          <Text style={styles.statusLine}>Your assigned rescue unit is on the way.</Text>
        </View>
        <View style={styles.etaBadge}>
          <Text style={styles.etaLabel}>ETA</Text>
          <Text style={styles.etaValue}>—</Text>
        </View>
      </View>

      <View style={styles.mapCard}>
        <View style={styles.mapHeader}>
          <View style={styles.mapTitleRow}>
            <MaterialCommunityIcons name="map-marker-distance" size={18} color={Colors.teal} />
            <Text style={styles.mapTitle}>Live Map</Text>
          </View>
          <Text style={styles.mapHint}>Incident location is fixed. Responder position updates live.</Text>
        </View>

        <View style={styles.mapPlaceholder}>
          {mapRegion ? (
            <MapView
              style={styles.map}
              initialRegion={mapRegion}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              showsUserLocation={false}
              showsMyLocationButton={false}
            >
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
                <Marker coordinate={{ latitude: responderLat, longitude: responderLng }} title="Responder">
                  <View style={[styles.pinBubble, { backgroundColor: Colors.danger }]}>
                    <MaterialCommunityIcons name="ambulance" size={16} color={Colors.white} />
                  </View>
                </Marker>
              )}
            </MapView>
          ) : (
            <View style={styles.mapFallback}>
              <Ionicons name="map-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.mapFallbackText}>{hasCoordinates ? 'Loading map…' : 'Missing coordinates for this request.'}</Text>
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
          <Text style={styles.legendLabel}>Your reported emergency location</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: Colors.danger }]} />
          <Text style={styles.legendLabel}>Responder unit current position</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: Colors.teal }]} />
          <Text style={styles.legendLabel}>Approximate route (for visual reference)</Text>
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
  },
  statusLeft: { flex: 1, paddingRight: 12 },
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
  etaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
    minWidth: 64,
  },
  etaLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.textMuted, textTransform: 'uppercase' },
  etaValue: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginTop: 2 },
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
  map: { height: 220, width: '100%' },
  mapFallback: { height: 220, alignItems: 'center', justifyContent: 'center', gap: 10 },
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
