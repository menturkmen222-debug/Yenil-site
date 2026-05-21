import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BonusPulProvider } from "@/contexts/BonusPulContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="ulgamlar" options={{ headerShown: false }} />
      <Stack.Screen name="teklip" options={{ headerShown: false }} />
      <Stack.Screen name="bazar" options={{ headerShown: false }} />
      <Stack.Screen name="help" options={{ headerShown: false }} />
      <Stack.Screen name="about" options={{ headerShown: false }} />
      <Stack.Screen name="sms" options={{ headerShown: false }} />
      <Stack.Screen name="ekitap" options={{ headerShown: false }} />
      <Stack.Screen name="smm" options={{ headerShown: false }} />
      <Stack.Screen name="howa" options={{ headerShown: false }} />
      <Stack.Screen name="gatnaw" options={{ headerShown: false }} />
      <Stack.Screen name="toleglar" options={{ headerShown: false }} />
      <Stack.Screen name="pul-gazan" options={{ headerShown: false }} />
      <Stack.Screen name="agent-topup" options={{ headerShown: false }} />
      <Stack.Screen name="referal" options={{ headerShown: false }} />
      <Stack.Screen name="informator" options={{ headerShown: false }} />
      <Stack.Screen name="kripto-birja" options={{ headerShown: false }} />
      <Stack.Screen name="nagt-cashout" options={{ headerShown: false }} />
      <Stack.Screen name="kuryer" options={{ headerShown: false }} />
      <Stack.Screen name="sanly-bazar-sell" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <ThemeProvider>
                <BonusPulProvider>
                  <RootLayoutNav />
                </BonusPulProvider>
              </ThemeProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
