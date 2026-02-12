import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="screens/splash" />
      <Stack.Screen name="screens/onboarding" />
      <Stack.Screen name="screens/prayer" />
      <Stack.Screen name="screens/quran_list" />
      <Stack.Screen name="screens/quran_details" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

