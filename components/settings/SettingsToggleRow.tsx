import { View, Text, Switch, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

type Props = {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
};

export function SettingsToggleRow({ label, description, value, onValueChange }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.textWrap}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#d1d5db', true: 'rgba(13,148,136,0.35)' }}
        thumbColor={value ? Colors.teal : '#f4f4f5'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  textWrap: { flex: 1 },
  label: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  description: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },
});
