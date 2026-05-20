import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, ScrollView, Switch } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useAuth } from '@/lib/auth-context';
import * as Haptics from 'expo-haptics';
import { fetchResponderById } from '@/lib/api';

export default function ResponderProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [available, setAvailable] = useState(true);
  const [availabilityText, setAvailabilityText] = useState<'Available' | 'Busy' | 'Inactive'>('Available');
  const [vehicleType, setVehicleType] = useState('Ambulance');
  const [zone, setZone] = useState('');
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const loadAvailability = async () => {
    if (!user?.id) return;
    try {
      const responder = await fetchResponderById(user.id);
      setAvailabilityText(responder.availability);
      setAvailable(responder.availability === 'Available');
      setVehicleType(responder.vehicleType || 'Ambulance');
      setZone(responder.zone || '');
    } catch {
      // keep local state
    }
  };

  useEffect(() => {
    loadAvailability();

    // Lightweight sync so admin changes reflect while screen is open
    const interval = setInterval(() => {
      loadAvailability();
    }, 10000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    logout();
    router.dismissAll();
    router.replace('/(responder-auth)/login');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: topPadding + 16, paddingBottom: Platform.OS === 'web' ? 84 + 34 : 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.profileCard}>
        <View style={styles.avatarWrap}>
          <MaterialCommunityIcons name="ambulance" size={36} color={Colors.white} />
        </View>
        <Text style={styles.profileName}>{user?.name || 'Rescue Unit'}</Text>
        <Text style={styles.profileEmail}>{user?.email || 'responder@email.com'}</Text>
        <View style={styles.profileBadge}>
          <Ionicons name="shield-checkmark" size={14} color={Colors.navy} />
          <Text style={styles.profileBadgeText}>Verified Responder</Text>
        </View>
      </View>

      <View style={styles.availCard}>
        <View style={styles.availLeft}>
          <View style={[styles.availDot, { backgroundColor: available ? Colors.success : Colors.textMuted }]} />
          <View>
            <Text style={styles.availTitle}>Availability Status</Text>
            <Text style={styles.availSubtitle}>{available ? 'Accepting new requests' : 'Not accepting requests'}</Text>
          </View>
        </View>
        <Switch
          value={available}
          onValueChange={() => {
            // Admin-controlled status: responder cannot change availability
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          disabled
          trackColor={{ false: '#d1d5db', true: 'rgba(16,185,129,0.3)' }}
          thumbColor={available ? Colors.success : '#9ca3af'}
        />
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Responder Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{user?.phone || '+92 300 1234567'}</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Vehicle Type</Text>
          <Text style={styles.infoValue}>{vehicleType}</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Zone</Text>
          <Text style={styles.infoValue}>{zone || '—'}</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Role</Text>
          <Text style={styles.infoValue}>First Responder</Text>
        </View>
      </View>

      <View style={styles.menuCard}>
        {[
          { icon: 'person-outline' as const, label: 'Edit Profile', href: '/responder/edit-profile' as const },
          { icon: 'notifications-outline' as const, label: 'Notifications', href: '/responder/notifications' as const },
          { icon: 'shield-checkmark-outline' as const, label: 'Privacy & Security', href: '/responder/privacy-security' as const },
          { icon: 'help-circle-outline' as const, label: 'Help & Support', href: '/responder/help-support' as const },
          { icon: 'information-circle-outline' as const, label: 'About', href: '/responder/about' as const },
        ].map((item, index) => (
          <View key={item.label}>
            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
              onPress={() => router.push(item.href)}
            >
              <Ionicons name={item.icon} size={22} color={Colors.textSecondary} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </Pressable>
            {index < 4 && <View style={styles.menuDivider} />}
          </View>
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.9 }]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 20 },
  profileCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 24,
    alignItems: 'center', marginBottom: 16, ...Colors.shadow,
  },
  avatarWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.navy, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  profileName: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  profileEmail: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  profileBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(10,22,40,0.06)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 10,
  },
  profileBadgeText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.navy },
  availCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, borderRadius: 14, padding: 16,
    marginBottom: 16, ...Colors.shadow,
  },
  availLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  availDot: { width: 10, height: 10, borderRadius: 5 },
  availTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  availSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 1 },
  infoCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 18,
    marginBottom: 16, ...Colors.shadow,
  },
  infoTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 14 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  infoValue: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  infoDivider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 6 },
  menuCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 6,
    marginBottom: 16, ...Colors.shadow,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  menuDivider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: 14 },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.white, borderRadius: 14, paddingVertical: 16,
    borderWidth: 1, borderColor: Colors.dangerLight, marginBottom: 16,
  },
  logoutText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.danger },
});
