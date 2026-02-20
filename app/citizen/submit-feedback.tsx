import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { submitFeedback } from '@/lib/api';
import * as Haptics from 'expo-haptics';

export default function SubmitFeedbackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Required', 'Please select a rating');
      return;
    }
    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await submitFeedback({ requestId: id || '', rating, comment });
      Alert.alert('Thank You', 'Your feedback has been submitted successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topSection}>
          <View style={styles.iconWrap}>
            <Ionicons name="star" size={36} color={Colors.warning} />
          </View>
          <Text style={styles.title}>Rate Your Experience</Text>
          <Text style={styles.subtitle}>Request {id}</Text>
        </View>

        <View style={styles.ratingSection}>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(star => (
              <Pressable
                key={star}
                onPress={() => {
                  setRating(star);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={44}
                  color={star <= rating ? Colors.warning : Colors.border}
                />
              </Pressable>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>{ratingLabels[rating]}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Additional Comments (Optional)</Text>
          <TextInput
            style={styles.textArea}
            value={comment}
            onChangeText={setComment}
            placeholder="Share your experience with the rescue team..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <Pressable
          style={({ pressed }) => [styles.submitButton, pressed && { opacity: 0.9 }, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={styles.submitText}>Submit Feedback</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 20, paddingBottom: 40 },
  topSection: { alignItems: 'center', marginBottom: 28 },
  iconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.warningLight, alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 4 },
  ratingSection: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 24,
    alignItems: 'center', marginBottom: 20, ...Colors.shadow,
  },
  starsRow: { flexDirection: 'row', gap: 8 },
  ratingLabel: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.warning, marginTop: 12 },
  section: { marginBottom: 20, gap: 8 },
  label: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, paddingLeft: 2 },
  textArea: {
    backgroundColor: Colors.white, borderRadius: 12, padding: 16,
    fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textPrimary,
    minHeight: 100, borderWidth: 1, borderColor: Colors.border, ...Colors.shadow,
  },
  submitButton: {
    backgroundColor: Colors.teal, borderRadius: 14, paddingVertical: 18,
    alignItems: 'center', marginTop: 8, ...Colors.shadow,
  },
  submitText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.white },
});
