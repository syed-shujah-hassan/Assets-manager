import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert, Modal, Animated } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { submitEmergencyRequest, analyzeEmergencyDraft } from '@/lib/api';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/lib/auth-context';

export default function SubmitEmergencyScreen() {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>('Detecting your location...');
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const normalizeVoiceDescription = (raw: string) => {
    const text = String(raw || '').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    const firstUpper = text.charAt(0).toUpperCase() + text.slice(1);
    return /[.!?]$/.test(firstUpper) ? firstUpper : `${firstUpper}.`;
  };

  const detectPriority = (text: string): 'Critical' | 'High' | 'Medium' | 'Low' => {
    const value = String(text || '').toLowerCase();
    const hasAny = (words: string[]) => words.some((w) => value.includes(w));
    if (hasAny(['fire', 'explosion', 'blast', 'unconscious', 'not breathing', 'severe bleeding', 'trapped', 'collapse'])) {
      return 'Critical';
    }
    if (hasAny(['accident', 'injury', 'injured', 'burn', 'gas leak', 'smoke', 'seizure'])) {
      return 'High';
    }
    if (hasAny(['pain', 'dizzy', 'minor', 'help'])) {
      return 'Medium';
    }
    return 'Low';
  };

  // Pulse animation for mic
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  const startListening = () => {
    if (Platform.OS === 'web') {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).speechRecognition;
      if (!SpeechRecognition) {
        Alert.alert('Not supported', 'Speech recognition is not supported in this browser. Please use Chrome.');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('Listening...');
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptText = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            const cleaned = normalizeVoiceDescription(transcriptText);
            setDescription(prev => {
              const merged = prev ? `${prev} ${cleaned}` : cleaned;
              return normalizeVoiceDescription(merged);
            });
            setTranscript(cleaned);
          } else {
            interimTranscript += transcriptText;
            setTranscript(interimTranscript);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech error:', event.error);
        if (event.error === 'not-allowed') {
          Alert.alert('Permission Denied', 'Please allow microphone access in your browser settings.');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      try {
        recognition.start();
      } catch (err) {
        setIsListening(false);
      }
    } else {
      // Mobile Expo Go Fix: Trigger Keyboard Voice Input
      setIsListening(true);
      setTranscript('Please use the microphone on your keyboard...');
      
      // Auto-focus the text area so keyboard pops up
      setTimeout(() => {
        setIsListening(false);
        // On mobile, the best way is to focus the input so they can use the native mic
        Alert.alert('Voice Typing', 'Opening keyboard... Please tap the microphone icon on your keyboard to speak.');
      }, 2000);
    }
  };

  const captureLocation = async (): Promise<{ lat: number; lng: number; accuracy?: number }> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            resolve({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            }),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        );
      });
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });
    return {
      lat: loc.coords.latitude,
      lng: loc.coords.longitude,
      accuracy: loc.coords.accuracy ?? undefined,
    };
  };

  const formatLocationLabel = async (lat: number, lng: number) => {
    try {
      const places = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      const p = places[0];
      if (!p) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      const parts = [p.name, p.street, p.streetNumber, p.district, p.city, p.region].filter(Boolean);
      return parts.join(', ') || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  };

  const refreshLocation = async () => {
    setLocating(true);
    setLocationLabel('Updating GPS location...');
    try {
      const { lat, lng, accuracy } = await captureLocation();
      setCoords({ lat, lng });
      setLocationAccuracy(typeof accuracy === 'number' ? accuracy : null);
      const label = await formatLocationLabel(lat, lng);
      setLocationLabel(label);
    } catch {
      setCoords(null);
      setLocationAccuracy(null);
      setLocationLabel('Unable to get current location. Tap refresh or allow location access.');
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    refreshLocation();
  }, []);

  const pickImage = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera required', 'Please allow camera access to capture a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    const cleanedDescription = normalizeVoiceDescription(description);
    if (!cleanedDescription.trim()) {
      Alert.alert('Required', 'Please describe the emergency');
      return;
    }
    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const { lat, lng, accuracy } = await captureLocation();
      const label = await formatLocationLabel(lat, lng);
      setCoords({ lat, lng });
      setLocationAccuracy(typeof accuracy === 'number' ? accuracy : null);
      setLocationLabel(label);

      if (typeof accuracy === 'number' && accuracy > 120) {
        Alert.alert(
          'Approximate location',
          `GPS accuracy is about ${Math.round(accuracy)} meters. For a precise pin, tap Refresh location near a window, then submit again.`
        );
      }

      let aiDescription = cleanedDescription;
      let aiPriority = detectPriority(cleanedDescription);
      try {
        const analyzed = await analyzeEmergencyDraft({
          description: cleanedDescription,
          location: label,
        });
        aiDescription = analyzed.cleanedDescription || cleanedDescription;
        aiPriority = analyzed.priority || aiPriority;
      } catch {
        // fallback to local rule-priority when backend AI endpoint unavailable
      }

      await submitEmergencyRequest({
        description: aiDescription,
        location: label,
        coordinates: { lat, lng },
        photoUri: photoUri || undefined,
        userId: user?.id,
        userName: user?.name,
        userPhone: user?.phone,
        priority: aiPriority,
      });

      Alert.alert('Submitted', 'Your emergency request has been submitted. Help is on the way.');
      router.replace('/(citizen-tabs)');
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={styles.label}>Description</Text>
            <Pressable 
              onPress={startListening} 
              style={[styles.micBtn, isListening && styles.micBtnActive]}
            >
              <Ionicons name={isListening ? "mic" : "mic-outline"} size={18} color={isListening ? Colors.white : Colors.teal} />
              <Text style={[styles.micText, isListening && { color: Colors.white }]}>{isListening ? 'Listening...' : 'Voice'}</Text>
            </Pressable>
          </View>
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
          <Text style={styles.label}>Photo Evidence (Camera)</Text>
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
                <Text style={styles.photoPlaceholderText}>Tap to take a photo</Text>
              </View>
            )}
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Location</Text>
          <View style={styles.locationCard}>
            <Ionicons name="location" size={20} color={Colors.teal} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>Current GPS Location</Text>
              <Text style={styles.locationCoords}>{locationLabel}</Text>
              {locationAccuracy != null && (
                <Text style={styles.locationAccuracy}>
                  Accuracy: ~{Math.round(locationAccuracy)}m
                  {locationAccuracy > 120 ? ' (try Refresh for better pin)' : ''}
                </Text>
              )}
            </View>
            <Pressable
              style={({ pressed }) => [styles.refreshLocBtn, pressed && { opacity: 0.85 }, locating && { opacity: 0.6 }]}
              onPress={refreshLocation}
              disabled={locating}
            >
              {locating ? (
                <ActivityIndicator size="small" color={Colors.teal} />
              ) : (
                <>
                  <MaterialCommunityIcons name="crosshairs-gps" size={14} color={Colors.teal} />
                  <Text style={styles.gpsText}>Refresh</Text>
                </>
              )}
            </Pressable>
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

        {/* Voice Overlay Modal */}
        <Modal
          visible={isListening}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsListening(false)}
        >
          <View style={styles.voiceOverlay}>
            <View style={styles.voiceContent}>
              <Text style={styles.voiceTitle}>{transcript || 'Speak now...'}</Text>
              
              <View style={styles.micCircleContainer}>
                <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
                <View style={styles.mainMicCircle}>
                  <Ionicons name="mic" size={40} color={Colors.white} />
                </View>
              </View>

              <Text style={styles.voiceHint}>Google-style Voice Recognition</Text>
              
              <Pressable 
                style={styles.voiceCloseBtn} 
                onPress={() => setIsListening(false)}
              >
                <Ionicons name="close" size={28} color={Colors.white} />
              </Pressable>
            </View>
          </View>
        </Modal>
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
  micBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(13,148,136,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  micBtnActive: {
    backgroundColor: Colors.teal,
  },
  micText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.teal,
  },
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
  locationAccuracy: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  refreshLocBtn: {
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
  
  // Voice Modal Styles
  voiceOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceContent: {
    width: '100%',
    alignItems: 'center',
    padding: 30,
  },
  voiceTitle: {
    fontSize: 22,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 60,
    height: 60,
  },
  micCircleContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  pulseCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(239, 68, 68, 0.4)',
  },
  mainMicCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  voiceHint: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Inter_400Regular',
    marginTop: 20,
  },
  voiceCloseBtn: {
    marginTop: 80,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
