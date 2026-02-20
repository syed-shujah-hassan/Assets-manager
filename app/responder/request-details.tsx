import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { fetchRequestById, updateRequestStatus, EmergencyRequest } from '@/lib/api';
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

export default function ResponderRequestDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [request, setRequest] = useState<EmergencyRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchRequestById(id || '');
        setRequest(data || null);
        if (data && data.status !== 'Pending') setAccepted(true);
      } catch (e) {} finally { setLoading(false); }
    })();
  }, [id]);

  const handleStatusUpdate = async (status: EmergencyRequest['status']) => {
    if (!request) return;
    setUpdating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const updated = await updateRequestStatus(request.id, status);
      setRequest(updated);
      if (status === 'Assigned') setAccepted(true);
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

  const handleReject = () => {
    Alert.alert('Reject Request', 'Are you sure you want to reject this request?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => router.back() },
    ]);
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
        {request.distance && (
          <View style={styles.distanceRow}>
            <Ionicons name="navigate" size={14} color={Colors.navy} />
            <Text style={styles.distanceText}>{request.distance} away</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Reported By</Text>
        <View style={styles.userRow}>
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={20} color={Colors.white} />
          </View>
          <View>
            <Text style={styles.userName}>{request.userName}</Text>
            <Text style={styles.userDate}>{new Date(request.createdAt).toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {!accepted && request.status === 'Pending' && (
        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [styles.rejectBtn, pressed && { opacity: 0.9 }]}
            onPress={handleReject}
          >
            <Ionicons name="close" size={22} color={Colors.danger} />
            <Text style={styles.rejectText}>Reject</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.acceptBtn, pressed && { opacity: 0.9 }, updating && { opacity: 0.7 }]}
            onPress={() => handleStatusUpdate('Assigned')}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <Ionicons name="checkmark" size={22} color={Colors.white} />
                <Text style={styles.acceptText}>Accept</Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      {accepted && request.status !== 'Resolved' && request.status !== 'Cancelled' && (
        <View style={styles.progressActions}>
          <Text style={styles.progressTitle}>Update Status</Text>
          {request.status === 'Assigned' && (
            <Pressable
              style={({ pressed }) => [styles.progressBtn, pressed && { opacity: 0.9 }, updating && { opacity: 0.7 }]}
              onPress={() => handleStatusUpdate('En Route')}
              disabled={updating}
            >
              <MaterialCommunityIcons name="car-emergency" size={22} color={Colors.white} />
              <Text style={styles.progressBtnText}>Mark En Route</Text>
            </Pressable>
          )}
          {request.status === 'En Route' && (
            <Pressable
              style={({ pressed }) => [styles.progressBtn, { backgroundColor: Colors.teal }, pressed && { opacity: 0.9 }, updating && { opacity: 0.7 }]}
              onPress={() => handleStatusUpdate('Arrived')}
              disabled={updating}
            >
              <Ionicons name="flag" size={22} color={Colors.white} />
              <Text style={styles.progressBtnText}>Mark Arrived</Text>
            </Pressable>
          )}
          {(request.status === 'Arrived' || request.status === 'En Route') && (
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
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.white, borderRadius: 14, paddingVertical: 16,
    borderWidth: 1.5, borderColor: Colors.dangerLight,
  },
  rejectText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.danger },
  acceptBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.teal, borderRadius: 14, paddingVertical: 16, ...Colors.shadow,
  },
  acceptText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.white },
  progressActions: { gap: 12, marginTop: 4 },
  progressTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  progressBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.info, borderRadius: 14, paddingVertical: 16, ...Colors.shadow,
  },
  progressBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.white },
});
