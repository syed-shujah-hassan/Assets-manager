import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

const FAQ = [
  {
    q: 'How do I accept a new assignment?',
    a: 'Open an assigned request from your dashboard, review details, then tap Start Navigation to go En Route.',
  },
  {
    q: 'Can I change my availability?',
    a: 'Availability (Available / Busy) is updated by the admin when you are assigned or complete a request.',
  },
  {
    q: 'How is my live location used?',
    a: 'While En Route, your GPS is shared with the citizen and admin so they can track your approach.',
  },
];

export default function HelpSupportScreen() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const contact = (type: 'phone' | 'email') => {
    const url = type === 'phone' ? 'tel:+92115117' : 'mailto:support@rms.gov.pk?subject=RMS%20Responder%20Support';
    Linking.canOpenURL(url).then((ok) => {
      if (ok) Linking.openURL(url);
      else Alert.alert('Unavailable', 'Cannot open this contact method on your device.');
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.intro}>Responder guides and RMS dispatch support.</Text>

      <Text style={styles.sectionTitle}>FAQ</Text>
      <View style={styles.card}>
        {FAQ.map((item, index) => {
          const open = openIndex === index;
          return (
            <View key={item.q}>
              <Pressable style={styles.faqRow} onPress={() => setOpenIndex(open ? null : index)}>
                <Text style={styles.faqQ}>{item.q}</Text>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textMuted} />
              </Pressable>
              {open ? <Text style={styles.faqA}>{item.a}</Text> : null}
              {index < FAQ.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Contact</Text>
      <Pressable style={styles.contactRow} onPress={() => contact('phone')}>
        <Ionicons name="call-outline" size={22} color={Colors.teal} />
        <View style={styles.contactText}>
          <Text style={styles.contactLabel}>Emergency helpline</Text>
          <Text style={styles.contactValue}>115 / RMS Hotline</Text>
        </View>
      </Pressable>
      <Pressable style={styles.contactRow} onPress={() => contact('email')}>
        <Ionicons name="mail-outline" size={22} color={Colors.teal} />
        <View style={styles.contactText}>
          <Text style={styles.contactLabel}>Email support</Text>
          <Text style={styles.contactValue}>support@rms.gov.pk</Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  intro: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginBottom: 20, lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 12 },
  card: { backgroundColor: Colors.white, borderRadius: 16, marginBottom: 20, ...Colors.shadow },
  faqRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, gap: 12 },
  faqQ: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  faqA: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: 16 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    ...Colors.shadow,
  },
  contactText: { flex: 1 },
  contactLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  contactValue: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textPrimary, marginTop: 2 },
});
