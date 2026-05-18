import { View, Text, Pressable, StyleSheet, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useAuth } from '@/lib/auth-context';
import * as Haptics from 'expo-haptics';

export default function CitizenProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    logout();
    router.dismissAll();
    router.replace('/(citizen-auth)/login');
  };

  const menuItems = [
    { icon: 'person-outline' as const, label: 'Edit Profile', onPress: () => {} },
    { icon: 'notifications-outline' as const, label: 'Notifications', onPress: () => {} },
    { icon: 'shield-checkmark-outline' as const, label: 'Privacy & Security', onPress: () => {} },
    { icon: 'help-circle-outline' as const, label: 'Help & Support', onPress: () => {} },
    { icon: 'information-circle-outline' as const, label: 'About', onPress: () => {} },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: topPadding + 16, paddingBottom: Platform.OS === 'web' ? 84 + 34 : 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.profileCard}>
        <View style={styles.avatarWrap}>
          <Ionicons name="person" size={36} color={Colors.teal} />
        </View>
        <Text style={styles.profileName}>{user?.name || 'Citizen User'}</Text>
        <Text style={styles.profileEmail}>{user?.email || 'citizen@email.com'}</Text>
        <View style={styles.profileBadge}>
          <Ionicons name="shield-checkmark" size={14} color={Colors.teal} />
          <Text style={styles.profileBadgeText}>Verified Citizen</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Personal Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{user?.phone || '+92 300 1234567'}</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>CNIC</Text>
          <Text style={styles.infoValue}>{user?.cnic || '42101-1234567-8'}</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Role</Text>
          <Text style={styles.infoValue}>Citizen</Text>
        </View>
      </View>

      <View style={styles.menuCard}>
        {menuItems.map((item, index) => (
          <View key={item.label}>
            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
              onPress={item.onPress}
            >
              <Ionicons name={item.icon} size={22} color={Colors.textSecondary} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </Pressable>
            {index < menuItems.length - 1 && <View style={styles.menuDivider} />}
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
    backgroundColor: 'rgba(13,148,136,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  profileName: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  profileEmail: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  profileBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(13,148,136,0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 10,
  },
  profileBadgeText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.teal },
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
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
  },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  menuDivider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: 14 },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.white, borderRadius: 14, paddingVertical: 16,
    borderWidth: 1, borderColor: Colors.dangerLight, marginBottom: 16,
  },
  logoutText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.danger },
});
