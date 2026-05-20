import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Platform, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useAuth } from '@/lib/auth-context';
import { fetchRequests, EmergencyRequest, formatRequestRef } from '@/lib/api';
import * as Haptics from 'expo-haptics';

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

function StatusBadge({ status }: { status: string }) {
  const color = getStatusColor(status);
  return (
    <View style={[styles.badge, { backgroundColor: color.bg }]}>
      <Text style={[styles.badgeText, { color: color.text }]}>{status}</Text>
    </View>
  );
}

export default function CitizenHomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const [isListening, setIsListening] = useState(false);
  const [description, setDescription] = useState('');

  const loadRequests = async () => {
    try {
      const data = await fetchRequests('citizen', user?.id);
      setRequests(data);
    } catch (e) {}
  };

  useEffect(() => { loadRequests(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const activeRequest = requests.find(r => r.status !== 'Resolved' && r.status !== 'Cancelled');
  const recentRequests = requests.slice(0, 5);

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.navy, Colors.navyMedium]} style={[styles.headerBg, { paddingTop: topPadding + 16 }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'Citizen'}</Text>
          </View>
          <View style={styles.headerBadge}>
            <Ionicons name="notifications-outline" size={22} color={Colors.white} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === 'web' ? 84 + 34 : 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.teal} />}
      >
        <View style={styles.emergencySection}>
          <Pressable
            style={({ pressed }) => [styles.emergencyButton, pressed && { transform: [{ scale: 0.95 }] }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              router.push('/citizen/submit-emergency');
            }}
          >
            <LinearGradient
              colors={[Colors.danger, '#B91C1C']}
              style={styles.emergencyGradient}
            >
              <Ionicons name="warning" size={36} color={Colors.white} />
              <Text style={styles.emergencyText}>EMERGENCY</Text>
              <Text style={styles.emergencySubtext}>Tap to report</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {activeRequest && (
          <Pressable
            style={styles.activeCard}
            onPress={() => router.push({ pathname: '/citizen/request-details', params: { id: activeRequest.id } })}
          >
            <View style={styles.activeCardHeader}>
              <View style={styles.activeCardDot} />
              <Text style={styles.activeCardLabel}>Active Request</Text>
              <StatusBadge status={activeRequest.status} />
            </View>
            <Text style={styles.activeCardDesc} numberOfLines={2}>{activeRequest.description}</Text>
            <View style={styles.activeCardFooter}>
              <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.activeCardLocation} numberOfLines={1}>{activeRequest.location}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </View>
          </Pressable>
        )}

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <Pressable
              style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.85 }]}
              onPress={() => router.push('/citizen/submit-emergency')}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.dangerBg }]}>
                <MaterialCommunityIcons name="plus-circle" size={24} color={Colors.danger} />
              </View>
              <Text style={styles.actionLabel}>New Request</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.85 }]}
              onPress={() => router.push('/(citizen-tabs)/track')}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.infoLight }]}>
                <Ionicons name="list" size={24} color={Colors.info} />
              </View>
              <Text style={styles.actionLabel}>My Requests</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.85 }]}
              onPress={() => router.push('/(citizen-tabs)/profile')}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(13,148,136,0.1)' }]}>
                <Ionicons name="person" size={24} color={Colors.teal} />
              </View>
              <Text style={styles.actionLabel}>Profile</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Requests</Text>
          {recentRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No requests yet</Text>
              <Text style={styles.emptySubtext}>Your emergency requests will appear here</Text>
            </View>
          ) : (
            recentRequests.map(req => (
              <Pressable
                key={req.id}
                style={({ pressed }) => [styles.requestCard, pressed && { opacity: 0.9 }]}
                onPress={() => router.push({ pathname: '/citizen/request-details', params: { id: req.id } })}
              >
                <View style={styles.requestCardLeft}>
                  <Text style={styles.requestId}>{formatRequestRef(req)}</Text>
                  <Text style={styles.requestDesc} numberOfLines={1}>{req.description}</Text>
                  <Text style={styles.requestDate}>{new Date(req.createdAt).toLocaleDateString()}</Text>
                </View>
                <StatusBadge status={req.status} />
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBg: { paddingBottom: 24, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 14, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.6)' },
  userName: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.white, marginTop: 2 },
  headerBadge: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  scrollView: { flex: 1, marginTop: -1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  emergencySection: { alignItems: 'center', marginBottom: 20 },
  emergencyButton: { width: 140, height: 140, borderRadius: 70, ...Colors.shadowMedium },
  emergencyGradient: {
    width: 140, height: 140, borderRadius: 70,
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  emergencyText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.white, letterSpacing: 1 },
  emergencySubtext: { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.7)' },
  activeCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16,
    marginBottom: 20, ...Colors.shadow, borderLeftWidth: 4, borderLeftColor: Colors.teal,
  },
  activeCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  activeCardDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.teal },
  activeCardLabel: { flex: 1, fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  activeCardDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 20, marginBottom: 10 },
  activeCardFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  activeCardLocation: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  quickActions: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 12 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 16,
    alignItems: 'center', gap: 10, ...Colors.shadow,
  },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textPrimary, textAlign: 'center' },
  recentSection: { marginBottom: 20 },
  requestCard: {
    backgroundColor: Colors.white, borderRadius: 12, padding: 14,
    marginBottom: 10, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', ...Colors.shadow,
  },
  requestCardLeft: { flex: 1, gap: 3, marginRight: 12 },
  requestId: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.teal },
  requestDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textPrimary },
  requestDate: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  emptySubtext: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
});
