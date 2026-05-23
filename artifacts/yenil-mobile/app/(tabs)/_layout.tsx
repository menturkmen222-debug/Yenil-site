import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type TabIconProps = { focused: boolean; color: string };

function HomeIcon({ focused, color }: TabIconProps) {
  return (
    <Ionicons
      name={focused ? "home" : "home-outline"}
      size={23}
      color={color}
    />
  );
}

function HyzmatlarIcon({ focused, color }: TabIconProps) {
  return (
    <Ionicons
      name={focused ? "grid" : "grid-outline"}
      size={23}
      color={color}
    />
  );
}

function ProfilIcon({ focused, color }: TabIconProps) {
  return (
    <Ionicons
      name={focused ? "person-circle" : "person-circle-outline"}
      size={24}
      color={color}
    />
  );
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
          backgroundColor: isIOS ? "transparent" : colors.tabBarBg,
          borderTopWidth: isIOS ? 0 : StyleSheet.hairlineWidth,
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
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.tabBarBg },
              ]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Baş sahypa",
          tabBarIcon: (p) => <HomeIcon {...p} />,
        }}
      />

      <Tabs.Screen
        name="hyzmatlar"
        options={{
          title: "Hyzmatlar",
          tabBarIcon: (p) => <HyzmatlarIcon {...p} />,
        }}
      />

      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarIcon: (p) => <ProfilIcon {...p} />,
        }}
      />

      <Tabs.Screen name="amallar"    options={{ href: null }} />
      <Tabs.Screen name="more"       options={{ href: null }} />
      <Tabs.Screen name="sozlamalar" options={{ href: null }} />
      <Tabs.Screen name="(demiryol)" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="tmcell"     options={{ href: null }} />
      <Tabs.Screen name="pay"        options={{ href: null }} />
      <Tabs.Screen name="statistika" options={{ href: null }} />
    </Tabs>
  );
}
