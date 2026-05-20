import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { fetchRequestById, EmergencyRequest, formatRequestRef } from '@/lib/api';

const TIMELINE_STEPS = ['Pending', 'Assigned', 'En Route', 'Arrived', 'Resolved'];

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

export default function RequestDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [request, setRequest] = useState<EmergencyRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchRequestById(id || '');
        setRequest(data || null);
      } catch (e) {} finally { setLoading(false); }
    })();
  }, [id]);

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
  const currentStepIndex = TIMELINE_STEPS.indexOf(request.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.statusCard}>
        <View style={[styles.statusBadge, { backgroundColor: color.bg }]}>
          <Text style={[styles.statusText, { color: color.text }]}>{request.status}</Text>
        </View>
        <Text style={styles.requestId}>{formatRequestRef(request)}</Text>
        <Text style={styles.dateText}>{new Date(request.createdAt).toLocaleString()}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Description</Text>
        <Text style={styles.descText}>{request.description}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Location</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={18} color={Colors.teal} />
          <Text style={styles.locationText}>{request.location}</Text>
        </View>
        <Text style={styles.coordsText}>{request.coordinates.lat}, {request.coordinates.lng}</Text>
      </View>

      {request.responderName && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Assigned Responder</Text>
          <View style={styles.responderRow}>
            <View style={styles.responderAvatar}>
              <Ionicons name="person" size={22} color={Colors.white} />
            </View>
            <View>
              <Text style={styles.responderName}>{request.responderName}</Text>
              <Text style={styles.responderInfo}>Emergency Rescue Unit</Text>
              {request.responderPhone && (
                <Text style={styles.responderContact}>{request.responderPhone}</Text>
              )}
            </View>
          </View>
        </View>
      )}

      {(request.status === 'Assigned' || request.status === 'En Route' || request.status === 'Arrived') && (
        <Pressable
          style={({ pressed }) => [styles.mapButton, pressed && { opacity: 0.9 }]}
          onPress={() =>
            router.push({
              pathname: '/citizen/track-request',
              params: {
                id: request.id,
                lat: String(request.coordinates.lat),
                lng: String(request.coordinates.lng),
              },
            })
          }
        >
          <Ionicons name="navigate-outline" size={18} color={Colors.white} />
          <Text style={styles.mapButtonText}>View Live Location (Preview)</Text>
        </Pressable>
      )}

      {request.status !== 'Cancelled' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status Timeline</Text>
          <View style={styles.timeline}>
            {TIMELINE_STEPS.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              return (
                <View key={step} style={styles.timelineStep}>
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineDot,
                      isCompleted && styles.timelineDotActive,
                      isCurrent && styles.timelineDotCurrent,
                    ]}>
                      {isCompleted && <Ionicons name="checkmark" size={12} color={Colors.white} />}
                    </View>
                    {index < TIMELINE_STEPS.length - 1 && (
                      <View style={[styles.timelineLine, isCompleted && styles.timelineLineActive]} />
                    )}
                  </View>
                  <Text style={[
                    styles.timelineLabel,
                    isCompleted && styles.timelineLabelActive,
                    isCurrent && styles.timelineLabelCurrent,
                  ]}>{step}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {request.status === 'Resolved' && (
        <Pressable
          style={({ pressed }) => [styles.feedbackButton, pressed && { opacity: 0.9 }]}
          onPress={() => router.push({ pathname: '/citizen/submit-feedback', params: { id: request.id } })}
        >
          <Ionicons name="star" size={20} color={Colors.white} />
          <Text style={styles.feedbackText}>Submit Feedback</Text>
        </Pressable>
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
  statusBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 10 },
  statusText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  requestId: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  dateText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 4 },
  card: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 18,
    marginBottom: 14, ...Colors.shadow,
  },
  cardTitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  descText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textPrimary, lineHeight: 22 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  locationText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textPrimary, flex: 1 },
  coordsText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, paddingLeft: 26 },
  responderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  responderAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.teal, alignItems: 'center', justifyContent: 'center',
  },
  responderName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  responderInfo: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 1 },
  responderContact: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.teal, marginTop: 2 },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.navy,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 4,
    ...Colors.shadow,
  },
  mapButtonText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.white },
  timeline: { gap: 0 },
  timelineStep: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 40 },
  timelineLeft: { alignItems: 'center', width: 24, marginRight: 12 },
  timelineDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center',
  },
  timelineDotActive: { backgroundColor: Colors.teal },
  timelineDotCurrent: { backgroundColor: Colors.teal, borderWidth: 3, borderColor: 'rgba(13,148,136,0.25)' },
  timelineLine: { width: 2, flex: 1, backgroundColor: Colors.border, minHeight: 18 },
  timelineLineActive: { backgroundColor: Colors.teal },
  timelineLabel: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textMuted, paddingTop: 2 },
  timelineLabelActive: { color: Colors.textPrimary, fontFamily: 'Inter_500Medium' },
  timelineLabelCurrent: { fontFamily: 'Inter_700Bold', color: Colors.teal },
  feedbackButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.teal, borderRadius: 14, paddingVertical: 16,
    marginTop: 4, ...Colors.shadow,
  },
  feedbackText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.white },
});
