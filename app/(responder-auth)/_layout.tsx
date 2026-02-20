import { Stack } from 'expo-router';

export default function ResponderAuthLayout() {
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="login" options={{ title: 'Responder Login' }} />
    </Stack>
  );
}
