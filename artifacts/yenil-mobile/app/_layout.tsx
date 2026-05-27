import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { BonusPulProvider } from "@/contexts/BonusPulContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { RatesProvider } from "@/contexts/RatesContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  useEffect(() => {
    AsyncStorage.getItem("onboarding_seen").then((val) => {
      if (!val) {
        setTimeout(() => router.replace("/welcome"), 80);
      }
    });
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="welcome" options={{ headerShown: false, animation: "fade" }} />
      <Stack.Screen name="ulgamlar" options={{ headerShown: false }} />
      <Stack.Screen name="teklip" options={{ headerShown: false }} />
      <Stack.Screen name="bazar" options={{ headerShown: false }} />
      <Stack.Screen name="help" options={{ headerShown: false }} />
      <Stack.Screen name="about" options={{ headerShown: false }} />
      <Stack.Screen name="sms" options={{ headerShown: false }} />
      <Stack.Screen name="hyzmatlar" options={{ headerShown: false }} />
      <Stack.Screen name="smm" options={{ headerShown: false }} />
      <Stack.Screen name="howa" options={{ headerShown: false }} />
      <Stack.Screen name="gatnaw" options={{ headerShown: false }} />
      <Stack.Screen name="toleglar" options={{ headerShown: false }} />
      <Stack.Screen name="pul-gazan" options={{ headerShown: false }} />
      <Stack.Screen name="agent-topup" options={{ headerShown: false }} />
      <Stack.Screen name="referal" options={{ headerShown: false }} />
      <Stack.Screen name="informator" options={{ headerShown: false }} />
      <Stack.Screen name="kuryer" options={{ headerShown: false }} />
      <Stack.Screen name="sanly-bazar-sell" options={{ headerShown: false }} />
      <Stack.Screen name="e-bilim" options={{ headerShown: false }} />
      <Stack.Screen name="ai-chat" options={{ headerShown: false }} />
      <Stack.Screen name="konum" options={{ headerShown: false }} />
      <Stack.Screen name="auth/register" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false, animation: "slide_from_bottom" }} />
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
              <LanguageProvider>
                <ThemeProvider>
                  <RatesProvider>
                    <BonusPulProvider>
                      <NotificationProvider>
                        <RootLayoutNav />
                        <OfflineBanner />
                      </NotificationProvider>
                    </BonusPulProvider>
                  </RatesProvider>
                </ThemeProvider>
              </LanguageProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
