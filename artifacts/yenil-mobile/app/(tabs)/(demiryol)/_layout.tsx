import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export default function DemiryolLayout() {
  const colors = useColors();
  const isDark = colors.isDark;
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Bilet al",
          tabBarIcon: ({ color }) => <Ionicons name="train-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="biletlerim"
        options={{
          title: "Biletlerim",
          tabBarIcon: ({ color }) => <Ionicons name="ticket-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="d-sozlamalar"
        options={{
          title: "Sozlamalar",
          tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen name="sms" options={{ href: null }} />
    </Tabs>
  );
}
