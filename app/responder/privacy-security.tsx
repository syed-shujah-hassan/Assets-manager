import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { SettingsToggleRow } from '@/components/settings/SettingsToggleRow';
import { useAuth } from '@/lib/auth-context';
import { changeUserPassword } from '@/lib/api';
import {
  loadPrivacySettings,
  savePrivacySettings,
  type PrivacySettings,
} from '@/lib/user-settings';
import * as Haptics from 'expo-haptics';

export default function PrivacySecurityScreen() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  useEffect(() => {
    loadPrivacySettings('responder').then(setSettings);
  }, []);

  const update = (patch: Partial<PrivacySettings>) => {
    if (!settings) return;
    setSettings({ ...settings, ...patch });
  };

  const handleSavePrivacy = async () => {
    if (!settings) return;
    setSavingPrivacy(true);
    try {
      await savePrivacySettings('responder', settings);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Privacy settings updated.');
    } catch {
      Alert.alert('Error', 'Could not save privacy settings.');
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Required', 'Enter current and new password.');
      return;
    }
    if (!token) {
      Alert.alert('Session expired', 'Please log in again.');
      return;
    }
    setChangingPwd(true);
    try {
      await changeUserPassword(token, currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Password changed successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to change password');
    } finally {
      setChangingPwd(false);
    }
  };

  if (!settings) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.navy} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Privacy</Text>
        <View style={styles.card}>
          <SettingsToggleRow
            label="Share live location"
            description="During an active emergency request"
            value={settings.shareLiveLocation}
            onValueChange={(v) => update({ shareLiveLocation: v })}
          />
          <View style={styles.divider} />
          <SettingsToggleRow
            label="Show profile to responders"
            description="Name and phone when assigned"
            value={settings.showProfileToResponders}
            onValueChange={(v) => update({ showProfileToResponders: v })}
          />
          <View style={styles.divider} />
          <SettingsToggleRow
            label="Biometric login"
            description="Use fingerprint on supported devices (coming soon)"
            value={settings.biometricLogin}
            onValueChange={(v) => update({ biometricLogin: v })}
          />
        </View>

        <Pressable style={styles.saveBtn} onPress={handleSavePrivacy} disabled={savingPrivacy}>
          {savingPrivacy ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.saveText}>Save Privacy Settings</Text>
          )}
        </Pressable>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Change Password</Text>
        <View style={styles.field}>
          <Text style={styles.label}>Current password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Current password"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>New password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="At least 6 characters"
          />
        </View>
        <Pressable style={styles.outlineBtn} onPress={handleChangePassword} disabled={changingPwd}>
          {changingPwd ? (
            <ActivityIndicator color={Colors.navy} />
          ) : (
            <Text style={styles.outlineText}>Update Password</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 12 },
  hint: { fontSize: 14, color: Colors.textSecondary },
  card: { backgroundColor: Colors.white, borderRadius: 16, marginBottom: 16, ...Colors.shadow },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: 16 },
  field: { marginBottom: 12 },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginBottom: 8 },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  saveBtn: {
    backgroundColor: Colors.navy,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveText: { color: Colors.white, fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  outlineBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.navy,
    backgroundColor: Colors.white,
  },
  outlineText: { color: Colors.navy, fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
