import { Platform } from 'react-native';

const Colors = {
  navy: '#0A1628',
  navyLight: '#1B2B4B',
  navyMedium: '#142240',
  teal: '#0D9488',
  tealLight: '#14B8A6',
  tealDark: '#0F766E',
  white: '#FFFFFF',
  background: '#F1F5F9',
  cardBg: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  dangerBg: '#FEF2F2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  success: '#10B981',
  successLight: '#D1FAE5',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  shadow: Platform.select({
    web: { boxShadow: '0px 2px 12px rgba(10, 22, 40, 0.08)' },
    default: {
      shadowColor: '#0A1628',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
  })!,
  shadowMedium: Platform.select({
    web: { boxShadow: '0px 4px 16px rgba(10, 22, 40, 0.12)' },
    default: {
      shadowColor: '#0A1628',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 5,
    },
  })!,
  light: {
    text: '#0F172A',
    background: '#F1F5F9',
    tint: '#0D9488',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#0D9488',
  },
};

export default Colors;
