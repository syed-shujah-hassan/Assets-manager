import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useAuth } from '@/lib/auth-context';
import { loginUser } from '@/lib/api';
import * as Haptics from 'expo-haptics';

export default function CitizenLoginScreen() {
  const [cnic, setCnic] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, user, isReady } = useAuth();

  useEffect(() => {
    if (isReady && user?.role === 'citizen') {
      router.replace('/(citizen-tabs)');
    }
  }, [isReady, user]);

  if (isReady && user?.role === 'citizen') {
    return null;
  }

  const handleLogin = async () => {
    if (!cnic.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const user = await loginUser(cnic, password, 'citizen');
      login(user);
      router.dismissAll();
      router.replace('/(citizen-tabs)');
    } catch (e: any) {
      setError(e.message || 'Login failed');
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
        <Pressable style={styles.backBtn} onPress={() => router.replace('/')}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          <Text style={styles.backBtnText}>Change Role</Text>
        </Pressable>

        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="people" size={36} color={Colors.teal} />
          </View>
          <Text style={styles.title}>Citizen Login</Text>
          <Text style={styles.subtitle}>Sign in to report and track emergencies</Text>
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>CNIC</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="id-card-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={cnic}
                onChangeText={setCnic}
                placeholder="42101-1234567-8"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.button, pressed && { opacity: 0.9 }, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <Link href="/(citizen-auth)/register" asChild>
            <Pressable>
              <Text style={styles.linkText}>Sign Up</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  backBtn: { 
    position: 'absolute', 
    top: Platform.OS === 'web' ? 20 : 10, 
    left: 0, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    zIndex: 10,
    padding: 10
  },
  backBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  header: { alignItems: 'center', marginBottom: 32 },
  iconWrap: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: 'rgba(13,148,136,0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 4 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.dangerBg, padding: 12, borderRadius: 10, marginBottom: 16,
  },
  errorText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.danger, flex: 1 },
  form: { gap: 18 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, paddingLeft: 2 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}),
  },
  inputIcon: { paddingLeft: 14 },
  input: {
    flex: 1, paddingVertical: 14, paddingHorizontal: 10,
    fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textPrimary,
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}),
  },
  eyeBtn: { padding: 14 },
  button: {
    backgroundColor: Colors.teal, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 8, ...Colors.shadow,
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}),
  },
  buttonText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.white },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 24 },
  footerText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  linkText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.teal },
});
