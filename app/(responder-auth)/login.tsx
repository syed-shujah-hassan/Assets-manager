import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useAuth } from '@/lib/auth-context';
import { loginUser } from '@/lib/api';
import * as Haptics from 'expo-haptics';

export default function ResponderLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, user, isReady } = useAuth();

  useEffect(() => {
    if (isReady && user?.role === 'responder') {
      router.replace('/(responder-tabs)');
    }
  }, [isReady, user]);

  if (isReady && user?.role === 'responder') {
    return null;
  }

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const session = await loginUser(email, password, 'responder');
      login(session.user, session.token);
      router.dismissAll();
      router.replace('/(responder-tabs)');
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
            <MaterialCommunityIcons name="ambulance" size={36} color={Colors.danger} />
          </View>
          <Text style={styles.title}>Responder Login</Text>
          <Text style={styles.subtitle}>Sign in to manage rescue operations</Text>
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Enter your email" placeholderTextColor={Colors.textMuted} autoCapitalize="none" keyboardType="email-address" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Enter your password" placeholderTextColor={Colors.textMuted} secureTextEntry={!showPassword} />
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
    backgroundColor: Colors.dangerBg,
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
  },
  inputIcon: { paddingLeft: 14 },
  input: {
    flex: 1, paddingVertical: 14, paddingHorizontal: 10,
    fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textPrimary,
  },
  eyeBtn: { padding: 14 },
  button: {
    backgroundColor: Colors.navy, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 8, ...Colors.shadow,
  },
  buttonText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.white },
});
