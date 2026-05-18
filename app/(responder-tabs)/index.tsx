import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, Platform, Switch, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useAuth } from '@/lib/auth-context';
import { fetchRequests, EmergencyRequest, fetchResponderById, updateResponderAvailability, updateResponderLocation } from '@/lib/api';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';

function getStatusColor(status: string) {
  switch (status) {
    case 'Pending': return { bg: Colors.warningLight, text: Colors.warning };
    case 'Assigned': return { bg: Colors.infoLight, text: Colors.info };
    case 'En Route': return { bg: Colors.infoLight, text: Colors.info };
    default: return { bg: Colors.background, text: Colors.textSecondary };
  }
}

export default function ResponderHomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [available, setAvailable] = useState(true);
  const [availabilityText, setAvailabilityText] = useState<'Available' | 'Busy' | 'Inactive'>('Available');
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const loadAvailability = async () => {
    if (!user?.id) return;
    try {
      const responder = await fetchResponderById(user.id);
      setAvailabilityText(responder.availability);
      setAvailable(responder.availability === 'Available');
    } catch (e) {}
  };

  const loadRequests = async () => {
    try {
      const data = await fetchRequests('responder', user?.id);
      setRequests(data);
    } catch (e) {}
  };

  const startTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      // Simple foreground watcher
      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000,
          distanceInterval: 20,
        },
        async (pos) => {
          if (!user?.id || !available) return;
          try {
            await updateResponderLocation(user.id, {
              coordinates: { lat: pos.coords.latitude, lng: pos.coords.longitude },
              accuracy: pos.coords.accuracy ?? undefined,
              at: new Date(pos.timestamp).toISOString(),
            });
          } catch (e) {}
        }
      );
    } catch (err) {}
  };

  useEffect(() => {
    if (available && user?.id) {
      startTracking();
    }
  }, [available, user?.id]);

  useEffect(() => {
    loadRequests();
    loadAvailability();

    const interval = setInterval(() => {
      loadAvailability();
    }, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const renderRequest = ({ item }: { item: EmergencyRequest }) => {
    const color = getStatusColor(item.status);
    return (
      <Pressable
        style={({ pressed }) => [styles.requestCard, pressed && { opacity: 0.9 }]}
        onPress={() => router.push({ pathname: '/responder/request-details', params: { id: item.id } })}
      >
        <View style={styles.requestHeader}>
          <View style={styles.requestIdRow}>
            <Text style={styles.requestId}>{item.id}</Text>
            <View style={[styles.badge, { backgroundColor: color.bg }]}>
              <Text style={[styles.badgeText, { color: color.text }]}>{item.status}</Text>
            </View>
          </View>
          {item.distance && (
            <View style={styles.distanceRow}>
              <Ionicons name="navigate-outline" size={13} color={Colors.teal} />
              <Text style={styles.distanceText}>{item.distance}</Text>
            </View>
          )}
        </View>
        <Text style={styles.requestDesc} numberOfLines={2}>{item.description}</Text>
        <View style={styles.requestMeta}>
          <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>{item.location}</Text>
        </View>
        <View style={styles.requestFooter}>
          <View style={styles.userRow}>
            <Ionicons name="person-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.userName}>{item.userName}</Text>
          </View>
          <Text style={styles.timeText}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.navy, Colors.navyMedium]} style={[styles.headerBg, { paddingTop: topPadding + 16 }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Responder Dashboard</Text>
            <Text style={styles.responderName}>{user?.name || 'Rescue Unit'}</Text>
          </View>
          <View style={styles.statusToggle}>
            <MaterialCommunityIcons name="ambulance" size={18} color={available ? Colors.success : Colors.textMuted} />
            <Switch
              value={available}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              disabled
              trackColor={{ false: '#3e3e3e', true: 'rgba(16,185,129,0.3)' }}
              thumbColor={available ? Colors.success : '#f4f3f4'}
            />
          </View>
        </View>
        <View style={styles.availBadge}>
          <View style={[styles.availDot, { backgroundColor: available ? Colors.success : Colors.textMuted }]} />
          <Text style={styles.availText}>{availabilityText}</Text>
        </View>
      </LinearGradient>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{requests.length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: Colors.warning }]}>{requests.filter(r => r.status === 'Pending').length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: Colors.info }]}>{requests.filter(r => r.status === 'Assigned' || r.status === 'En Route').length}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Incoming Requests</Text>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequest}
        contentContainerStyle={[styles.listContent, { paddingBottom: Platform.OS === 'web' ? 84 + 34 : 100 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!requests.length}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.teal} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No active requests</Text>
            <Text style={styles.emptySubtext}>New emergencies will appear here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBg: { paddingBottom: 18, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.5)' },
  responderName: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.white, marginTop: 2 },
  statusToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  availBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginTop: 10,
  },
  availDot: { width: 8, height: 8, borderRadius: 4 },
  availText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.8)' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 16, gap: 10 },
  statCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 12, padding: 14,
    alignItems: 'center', ...Colors.shadow,
  },
  statNum: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.teal },
  statLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  sectionHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  listContent: { paddingHorizontal: 20, paddingTop: 12 },
  requestCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16,
    marginBottom: 12, ...Colors.shadow,
  },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  requestIdRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  requestId: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.navy },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  distanceText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.teal },
  requestDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textPrimary, lineHeight: 20, marginBottom: 8 },
  requestMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  metaText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, flex: 1 },
  requestFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 8,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  userName: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  timeText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  emptySubtext: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
});
