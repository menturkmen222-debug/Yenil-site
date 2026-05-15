import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { SymbolView } from "expo-symbols";

import { useColors } from "@/hooks/useColors";

export default function TabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
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
          title: "Baş sahypa",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house" tintColor={color} size={24} />
            ) : (
              <Feather name="home" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="demiryol"
        options={{
          title: "Bilet",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="ticket" tintColor={color} size={24} />
            ) : (
              <Ionicons name="train-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="pay"
        options={{
          title: "Töleg",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="arrow.left.arrow.right" tintColor={color} size={24} />
            ) : (
              <Ionicons name="swap-horizontal-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="tmcell"
        options={{
          title: "TMCell",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="simcard" tintColor={color} size={24} />
            ) : (
              <Ionicons name="phone-portrait-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "Has köp",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="ellipsis.circle" tintColor={color} size={24} />
            ) : (
              <Feather name="menu" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}
