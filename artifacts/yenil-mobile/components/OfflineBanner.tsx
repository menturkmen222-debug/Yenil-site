import React, { useEffect, useRef } from "react";
import { Animated, Text, View, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useOffline } from "@/hooks/useOffline";
import { useLanguage } from "@/contexts/LanguageContext";

export function OfflineBanner() {
  const { isOffline } = useOffline();
  const { t } = useLanguage();
  const slideAnim = useRef(new Animated.Value(-60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: isOffline ? 0 : -60,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: isOffline ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOffline]);

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      pointerEvents={isOffline ? "auto" : "none"}
    >
      <View style={styles.inner}>
        <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.title}>{t("offline_title")}</Text>
          <Text style={styles.desc}>{t("offline_cached")}</Text>
        </View>
        <View style={styles.dot} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: "#1e293b",
    paddingTop: Platform.OS === "ios" ? 50 : 36,
    paddingBottom: 10,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 10,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  desc: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    marginTop: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f87171",
  },
});
