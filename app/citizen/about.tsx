import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.logoWrap}>
        <Ionicons name="shield-checkmark" size={48} color={Colors.teal} />
      </View>
      <Text style={styles.appName}>Rescue Management System</Text>
      <Text style={styles.version}>Version 1.0.0</Text>
      <Text style={styles.desc}>
        RMS connects citizens, first responders, and administrators for faster emergency reporting,
        dispatch, and tracking across Karachi and surrounding areas.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Features</Text>
        <Text style={styles.bullet}>• One-tap emergency reporting with GPS</Text>
        <Text style={styles.bullet}>• Real-time request tracking</Text>
        <Text style={styles.bullet}>• Responder assignment and live location</Text>
        <Text style={styles.bullet}>• Central government admin dashboard</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Organization</Text>
        <Text style={styles.meta}>Government of Pakistan — RMS Pilot</Text>
        <Text style={styles.meta}>© 2026 Rescue Management System</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 24, paddingBottom: 40, alignItems: 'center' },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(13,148,136,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, textAlign: 'center' },
  version: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.teal, marginTop: 4, marginBottom: 16 },
  desc: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    ...Colors.shadow,
  },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 10 },
  bullet: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginBottom: 6, lineHeight: 20 },
  meta: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginBottom: 4 },
});
