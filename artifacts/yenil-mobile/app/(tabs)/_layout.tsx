import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, Text } from "react-native";
import { SymbolView } from "expo-symbols";

import { useColors } from "@/hooks/useColors";

type TabIconProps = { focused: boolean; color: string };

function HomeIcon({ focused, color }: TabIconProps) {
  const isIOS = Platform.OS === "ios";
  if (isIOS) return <SymbolView name={focused ? "house.fill" : "house"} tintColor={color} size={24} />;
  return <Ionicons name={focused ? "home" : "home-outline"} size={23} color={color} />;
}
function AmallarIcon({ focused, color }: TabIconProps) {
  const isIOS = Platform.OS === "ios";
  if (isIOS) return <SymbolView name={focused ? "clock.fill" : "clock"} tintColor={color} size={24} />;
  return <Ionicons name={focused ? "receipt" : "receipt-outline"} size={23} color={color} />;
}
function MoreIcon({ focused, color }: TabIconProps) {
  const isIOS = Platform.OS === "ios";
  if (isIOS) return <SymbolView name={focused ? "square.grid.2x2.fill" : "square.grid.2x2"} tintColor={color} size={24} />;
  return <Ionicons name={focused ? "apps" : "apps-outline"} size={23} color={color} />;
}
function SozlamalarIcon({ focused, color }: TabIconProps) {
  const isIOS = Platform.OS === "ios";
  if (isIOS) return <SymbolView name={focused ? "gearshape.fill" : "gearshape"} tintColor={color} size={24} />;
  return <Ionicons name={focused ? "settings" : "settings-outline"} size={23} color={color} />;
}

export default function TabLayout() {
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
          borderTopWidth: isWeb ? 1 : isIOS ? 0 : 0.5,
          borderTopColor: colors.border,
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
      {/* 1 — Baş sahypa */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Baş sahypa",
          tabBarIcon: (p) => <HomeIcon {...p} />,
        }}
      />

      {/* 2 — Amallar */}
      <Tabs.Screen
        name="amallar"
        options={{
          title: "Amallar",
          tabBarIcon: (p) => <AmallarIcon {...p} />,
        }}
      />

      {/* Hidden tabs */}
      <Tabs.Screen
        name="(demiryol)"
        options={{ href: null, tabBarStyle: { display: "none" } }}
      />
      <Tabs.Screen name="tmcell" options={{ href: null }} />

      {/* 3 — Has köp */}
      <Tabs.Screen
        name="more"
        options={{
          title: "Has köp",
          tabBarIcon: (p) => <MoreIcon {...p} />,
        }}
      />

      {/* 4 — Sozlamalar */}
      <Tabs.Screen
        name="sozlamalar"
        options={{
          title: "Sozlamalar",
          tabBarIcon: (p) => <SozlamalarIcon {...p} />,
        }}
      />

      {/* Hidden tabs */}
      <Tabs.Screen name="pay" options={{ href: null }} />
      <Tabs.Screen name="statistika" options={{ href: null }} />
    </Tabs>
  );
}
