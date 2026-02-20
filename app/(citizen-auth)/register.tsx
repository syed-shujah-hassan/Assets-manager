import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useAuth } from '@/lib/auth-context';
import { registerUser } from '@/lib/api';
import * as Haptics from 'expo-haptics';

export default function CitizenRegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const user = await registerUser(name, email, password, phone);
      login(user);
      router.dismissAll();
      router.replace('/(citizen-tabs)');
    } catch (e: any) {
      setError(e.message || 'Registration failed');
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
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Register to access emergency services</Text>
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Enter your full name" placeholderTextColor={Colors.textMuted} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Enter your email" placeholderTextColor={Colors.textMuted} autoCapitalize="none" keyboardType="email-address" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+92 300 1234567" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Create a password" placeholderTextColor={Colors.textMuted} secureTextEntry />
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.button, pressed && { opacity: 0.9 }, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scrollContent: { flexGrow: 1, padding: 24 },
  header: { marginBottom: 24, marginTop: 8 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 4 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.dangerBg, padding: 12, borderRadius: 10, marginBottom: 16,
  },
  errorText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.danger, flex: 1 },
  form: { gap: 16 },
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
  button: {
    backgroundColor: Colors.teal, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 8, ...Colors.shadow,
  },
  buttonText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.white },
});
