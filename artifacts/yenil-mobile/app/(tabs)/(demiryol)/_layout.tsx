import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

const ACTIVE_COLOR = "#10b981";

export default function DemiryolLayout() {
  const colors = useColors();
  const isDark = colors.isDark;
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: isIOS ? 0 : 0.5,
          borderTopColor: ACTIVE_COLOR + "44",
          elevation: 0,
          height: isWeb ? 84 : isIOS ? 82 : 72,
          paddingBottom: isIOS ? 0 : isWeb ? 16 : 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 0.1,
          marginTop: 1,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={95}
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
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "train" : "train-outline"}
              size={23}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="biletlerim"
        options={{
          title: "Biletlerim",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "ticket" : "ticket-outline"}
              size={23}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="d-sozlamalar"
        options={{
          title: "Sozlamalar",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={23}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen name="sms" options={{ href: null }} />
    </Tabs>
  );
}
