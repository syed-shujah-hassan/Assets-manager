import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'citizen' | 'responder';

export interface NotificationSettings {
  emergencyAlerts: boolean;
  requestUpdates: boolean;
  soundEnabled: boolean;
  emailNotifications: boolean;
}

export interface PrivacySettings {
  shareLiveLocation: boolean;
  showProfileToResponders: boolean;
  biometricLogin: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  emergencyAlerts: true,
  requestUpdates: true,
  soundEnabled: true,
  emailNotifications: false,
};

const DEFAULT_PRIVACY: PrivacySettings = {
  shareLiveLocation: true,
  showProfileToResponders: true,
  biometricLogin: false,
};

function key(role: UserRole, section: string) {
  return `rms_settings_${role}_${section}_v1`;
}

export async function loadNotificationSettings(role: UserRole): Promise<NotificationSettings> {
  try {
    const raw = await AsyncStorage.getItem(key(role, 'notifications'));
    if (raw) return { ...DEFAULT_NOTIFICATIONS, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return { ...DEFAULT_NOTIFICATIONS };
}

export async function saveNotificationSettings(role: UserRole, settings: NotificationSettings) {
  await AsyncStorage.setItem(key(role, 'notifications'), JSON.stringify(settings));
}

export async function loadPrivacySettings(role: UserRole): Promise<PrivacySettings> {
  try {
    const raw = await AsyncStorage.getItem(key(role, 'privacy'));
    if (raw) return { ...DEFAULT_PRIVACY, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return { ...DEFAULT_PRIVACY };
}

export async function savePrivacySettings(role: UserRole, settings: PrivacySettings) {
  await AsyncStorage.setItem(key(role, 'privacy'), JSON.stringify(settings));
}
