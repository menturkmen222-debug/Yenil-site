import { Stack } from "expo-router";

export default function DemiryolLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="biletlerim" />
      <Stack.Screen name="d-sozlamalar" />
      <Stack.Screen name="sms" />
    </Stack>
  );
}
