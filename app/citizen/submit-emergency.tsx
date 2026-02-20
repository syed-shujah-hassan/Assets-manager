import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { submitEmergencyRequest } from '@/lib/api';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

export default function SubmitEmergencyScreen() {
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Required', 'Please describe the emergency');
      return;
    }
    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await submitEmergencyRequest({
        description,
        location: 'Block 7, Gulshan-e-Iqbal, Karachi',
        coordinates: { lat: 24.9215, lng: 67.0975 },
        photoUri: photoUri || undefined,
      });
      Alert.alert('Submitted', 'Your emergency request has been submitted. Help is on the way.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

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
        <View style={styles.warningCard}>
          <Ionicons name="warning" size={20} color={Colors.danger} />
          <Text style={styles.warningText}>Only submit real emergencies. False reports may result in penalties.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.textArea}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the emergency situation in detail..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Photo Evidence</Text>
          <Pressable
            style={({ pressed }) => [styles.photoButton, pressed && { opacity: 0.8 }]}
            onPress={pickImage}
          >
            {photoUri ? (
              <View style={styles.photoSelected}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                <Text style={styles.photoSelectedText}>Photo attached</Text>
                <Pressable onPress={() => setPhotoUri(null)}>
                  <Ionicons name="close-circle" size={22} color={Colors.textMuted} />
                </Pressable>
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera-outline" size={32} color={Colors.textMuted} />
                <Text style={styles.photoPlaceholderText}>Tap to add photo</Text>
              </View>
            )}
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Location</Text>
          <View style={styles.locationCard}>
            <Ionicons name="location" size={20} color={Colors.teal} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>Block 7, Gulshan-e-Iqbal, Karachi</Text>
              <Text style={styles.locationCoords}>24.9215, 67.0975</Text>
            </View>
            <View style={styles.gpsBadge}>
              <MaterialCommunityIcons name="crosshairs-gps" size={14} color={Colors.teal} />
              <Text style={styles.gpsText}>GPS</Text>
            </View>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.submitButton, pressed && { opacity: 0.9 }, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <>
              <Ionicons name="send" size={20} color={Colors.white} />
              <Text style={styles.submitText}>Submit Emergency Report</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 20, paddingBottom: 40 },
  warningCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.dangerBg, borderRadius: 12, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.dangerLight,
  },
  warningText: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.danger, lineHeight: 18 },
  section: { marginBottom: 20, gap: 8 },
  label: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, paddingLeft: 2 },
  textArea: {
    backgroundColor: Colors.white, borderRadius: 12, padding: 16,
    fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textPrimary,
    minHeight: 120, borderWidth: 1, borderColor: Colors.border, ...Colors.shadow,
  },
  photoButton: {
    backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border, borderStyle: 'dashed', overflow: 'hidden', ...Colors.shadow,
  },
  photoPlaceholder: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  photoPlaceholderText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  photoSelected: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16,
  },
  photoSelectedText: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.success },
  locationCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: Colors.border, ...Colors.shadow,
  },
  locationInfo: { flex: 1, gap: 2 },
  locationText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  locationCoords: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  gpsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(13,148,136,0.08)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
  },
  gpsText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.teal },
  submitButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.danger, borderRadius: 14, paddingVertical: 18,
    marginTop: 8, ...Colors.shadowMedium,
  },
  submitText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.white },
});
