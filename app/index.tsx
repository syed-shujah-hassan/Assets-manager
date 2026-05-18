import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Image } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth-context';

export default function RoleSelectionScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const { user, isReady } = useAuth();

  useEffect(() => {
    if (isReady && user) {
      if (user.role === 'responder') {
        router.replace('/(responder-tabs)');
      } else {
        router.replace('/(citizen-tabs)');
      }
    }
  }, [isReady, user]);

  if (!isReady || user) return null;

  const handleSelect = (role: 'citizen' | 'responder') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (role === 'citizen') {
      router.push('/(citizen-auth)/login');
    } else {
      router.push('/(responder-auth)/login');
    }
  };

  return (
    <LinearGradient
      colors={[Colors.navy, Colors.navyMedium, Colors.navyLight]}
      style={styles.container}
    >
      <View style={[styles.content, { paddingTop: topPadding + 40 }]}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={48} color={Colors.teal} />
          </View>
          <Text style={styles.title}>Rescue Management</Text>
          <Text style={styles.subtitle}>Emergency Response System</Text>
        </View>

        <View style={styles.cardsContainer}>
          <Text style={styles.selectLabel}>Select your role</Text>

          <Pressable
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={() => handleSelect('citizen')}
          >
            <View style={styles.cardIconWrap}>
              <Ionicons name="people" size={32} color={Colors.teal} />
            </View>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>I am a Citizen</Text>
              <Text style={styles.cardDesc}>Report emergencies, track requests, and get help</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={Colors.textMuted} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={() => handleSelect('responder')}
          >
            <View style={[styles.cardIconWrap, { backgroundColor: Colors.dangerBg }]}>
              <MaterialCommunityIcons name="ambulance" size={32} color={Colors.danger} />
            </View>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>I am a Responder</Text>
              <Text style={styles.cardDesc}>Respond to emergencies and manage rescue operations</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={Colors.textMuted} />
          </Pressable>
        </View>

        <View style={[styles.footer, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 16 }]}>
          <Text style={styles.footerText}>Government Emergency Response</Text>
          <Text style={styles.footerVersion}>v1.0.0</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: Colors.white,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 6,
  },
  cardsContainer: {
    paddingHorizontal: 20,
    gap: 14,
  },
  selectLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    paddingLeft: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    gap: 14,
    ...Colors.shadowMedium,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  cardIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextWrap: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  cardDesc: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.35)',
  },
  footerVersion: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.2)',
  },
});
