import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function ResponderDetailLayout() {
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
      <Stack.Screen name="request-details" options={{ title: 'Request Details' }} />
    </Stack>
  );
}
