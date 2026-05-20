import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { SettingsToggleRow } from '@/components/settings/SettingsToggleRow';
import {
  loadNotificationSettings,
  saveNotificationSettings,
  type NotificationSettings,
} from '@/lib/user-settings';
import * as Haptics from 'expo-haptics';

export default function NotificationsScreen() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadNotificationSettings('citizen').then(setSettings);
  }, []);

  const update = (patch: Partial<NotificationSettings>) => {
    if (!settings) return;
    setSettings({ ...settings, ...patch });
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await saveNotificationSettings('citizen', settings);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Notification preferences updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Could not save preferences.');
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.teal} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.hint}>Choose how you want to be notified about emergencies and request updates.</Text>
      <View style={styles.card}>
        <SettingsToggleRow
          label="Emergency alerts"
          description="Critical alerts about your active requests"
          value={settings.emergencyAlerts}
          onValueChange={(v) => update({ emergencyAlerts: v })}
        />
        <View style={styles.divider} />
        <SettingsToggleRow
          label="Request status updates"
          description="When a responder is assigned or en route"
          value={settings.requestUpdates}
          onValueChange={(v) => update({ requestUpdates: v })}
        />
        <View style={styles.divider} />
        <SettingsToggleRow
          label="Sound"
          description="Play sound for push-style alerts"
          value={settings.soundEnabled}
          onValueChange={(v) => update({ soundEnabled: v })}
        />
        <View style={styles.divider} />
        <SettingsToggleRow
          label="Email notifications"
          description="Summary emails for resolved requests"
          value={settings.emailNotifications}
          onValueChange={(v) => update({ emailNotifications: v })}
        />
      </View>

      <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveText}>Save Preferences</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  hint: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginBottom: 16, lineHeight: 20 },
  card: { backgroundColor: Colors.white, borderRadius: 16, marginBottom: 20, ...Colors.shadow },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: 16 },
  saveBtn: {
    backgroundColor: Colors.teal,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveText: { color: Colors.white, fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
