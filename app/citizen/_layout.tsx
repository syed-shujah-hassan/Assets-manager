import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function CitizenDetailLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.white },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="submit-emergency" options={{ title: 'Report Emergency' }} />
      <Stack.Screen name="request-details" options={{ title: 'Request Details' }} />
      <Stack.Screen name="submit-feedback" options={{ title: 'Submit Feedback' }} />
    </Stack>
  );
}
