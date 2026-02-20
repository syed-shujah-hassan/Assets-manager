import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { fetchResponderHistory, EmergencyRequest } from '@/lib/api';

function getStatusColor(status: string) {
  switch (status) {
    case 'Resolved': return { bg: Colors.successLight, text: Colors.success };
    case 'Cancelled': return { bg: Colors.dangerLight, text: Colors.danger };
    default: return { bg: Colors.background, text: Colors.textSecondary };
  }
}

export default function ResponderHistoryScreen() {
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const loadData = async () => {
    try {
      const data = await fetchResponderHistory();
      setRequests(data);
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: EmergencyRequest }) => {
    const color = getStatusColor(item.status);
    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
        onPress={() => router.push({ pathname: '/responder/request-details', params: { id: item.id } })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardId}>{item.id}</Text>
          <View style={[styles.badge, { backgroundColor: color.bg }]}>
            <Text style={[styles.badgeText, { color: color.text }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        <View style={styles.cardFooter}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>{item.location}</Text>
          </View>
          <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Request History</Text>
        <Text style={styles.subtitle}>{requests.length} completed requests</Text>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.teal} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: Platform.OS === 'web' ? 84 + 34 : 100 }]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!requests.length}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.teal} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No history yet</Text>
              <Text style={styles.emptySubtext}>Completed requests will appear here</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 20 },
  card: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16,
    marginBottom: 12, ...Colors.shadow,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardId: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.navy },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  cardDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textPrimary, lineHeight: 20, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, marginRight: 12 },
  metaText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, flex: 1 },
  dateText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  emptySubtext: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
});
