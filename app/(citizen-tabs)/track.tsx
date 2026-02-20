import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { fetchRequests, EmergencyRequest } from '@/lib/api';

const STATUS_FILTERS = ['All', 'Pending', 'Assigned', 'En Route', 'Resolved', 'Cancelled'] as const;

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

export default function TrackRequestScreen() {
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('All');
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const loadData = async () => {
    try {
      const data = await fetchRequests('citizen');
      setRequests(data);
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filtered = filter === 'All' ? requests : requests.filter(r => r.status === filter);

  const renderItem = ({ item }: { item: EmergencyRequest }) => {
    const color = getStatusColor(item.status);
    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
        onPress={() => router.push({ pathname: '/citizen/request-details', params: { id: item.id } })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardId}>{item.id}</Text>
          <View style={[styles.badge, { backgroundColor: color.bg }]}>
            <Text style={[styles.badgeText, { color: color.text }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>{item.location}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
        </View>
        {item.responderName && (
          <View style={styles.responderRow}>
            <Ionicons name="person-circle-outline" size={16} color={Colors.teal} />
            <Text style={styles.responderText}>{item.responderName}</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Requests</Text>
        <Text style={styles.subtitle}>{requests.length} total requests</Text>
      </View>

      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        style={styles.filterContainer}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.filterChip, filter === item && styles.filterChipActive]}
            onPress={() => setFilter(item)}
          >
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
          </Pressable>
        )}
      />

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.teal} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: Platform.OS === 'web' ? 84 + 34 : 100 }]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!filtered.length}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.teal} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={44} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No requests found</Text>
              <Text style={styles.emptySubtext}>
                {filter !== 'All' ? `No ${filter.toLowerCase()} requests` : 'Submit an emergency to get started'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  filterContainer: { maxHeight: 48, marginTop: 12 },
  filterList: { paddingHorizontal: 20, gap: 8 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  filterText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  listContent: { paddingHorizontal: 20, paddingTop: 16 },
  card: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16,
    marginBottom: 12, ...Colors.shadow,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardId: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.teal },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  cardDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textPrimary, lineHeight: 20, marginBottom: 10 },
  cardMeta: { gap: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, flex: 1 },
  responderRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  responderText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.teal },
  loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  emptySubtext: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted, textAlign: 'center' },
});
