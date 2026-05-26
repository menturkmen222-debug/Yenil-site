import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, Modal, Pressable,
  Animated, Dimensions, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";

const KEY = "@yenil_onboarding_v1_seen";
const { width: SW } = Dimensions.get("window");

// ── Onboarding steps ─────────────────────────────────────────────────
const STEPS = [
  {
    emoji: "👋",
    title: "Ýeňil'e hoş geldiňiz!",
    desc: "Ýeňil — Türkmenistanyň iň ýeňil super-programmasy. Bilet almakdan başlap, pul gazanmaga çenli — hemmesi bir ýerde!",
    color: "#10b981",
    gradient: ["#065f46", "#10b981"] as const,
    icon: "sparkles-outline" as const,
  },
  {
    emoji: "🚂",
    title: "Demirýol biletleri",
    desc: "Bank karty bolmasa-da otly bilet alyp bilersiňiz! 6 sanly zakaz koduňyzy giriziň — biletini biz tölüýäris.",
    color: "#3b82f6",
    gradient: ["#1e3a8a", "#3b82f6"] as const,
    icon: "train-outline" as const,
  },
  {
    emoji: "💱",
    title: "Ýeňil Pay",
    desc: "Payeer, Perfect Money we WebMoney pul birliklerini TMT'ye çalşyp bilersiňiz. Tiz, ygtybarly we amatly!",
    color: "#8b5cf6",
    gradient: ["#4c1d95", "#8b5cf6"] as const,
    icon: "swap-horizontal-outline" as const,
  },
  {
    emoji: "🤖",
    title: "AI Agent kömekçi",
    desc: "Islendik soragyňyza AI kömekçimiz jogap berýär. Maslakat, maglumat, kömek — elmydama elýeterli!",
    color: "#6366f1",
    gradient: ["#312e81", "#6366f1"] as const,
    icon: "hardware-chip-outline" as const,
  },
  {
    emoji: "📚",
    title: "E-Bilim ekosistemi",
    desc: "Sapak geç → test ber → BP gazan! Gazanan BP'leriňizi goşmaça hyzmatlara ulanyp bilersiňiz.",
    color: "#f59e0b",
    gradient: ["#78350f", "#f59e0b"] as const,
    icon: "school-outline" as const,
  },
  {
    emoji: "💰",
    title: "BP – Bonus Pul",
    desc: "BP (Bonus Pul) – biziň içki pulluk ulgamymyz. Sapak geçip, dost çagyryp, kuryer bolup BP gazanyp bilersiňiz!",
    color: "#10b981",
    gradient: ["#064e3b", "#059669"] as const,
    icon: "wallet-outline" as const,
  },
  {
    emoji: "🎉",
    title: "Başlamaga taýyn!",
    desc: "Ähli mümkinçilikler siziň eliňizde. Isledigiňiz hyzmaty ulanyp başlaň. Kömek gerek bolsa AI Agent elmydama elýeterli!",
    color: "#e11d48",
    gradient: ["#881337", "#e11d48"] as const,
    icon: "rocket-outline" as const,
  },
];

// ── Onboarding Sheet ─────────────────────────────────────────────────
function OnboardingSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const slideX = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      setStep(0);
      Animated.spring(sheetAnim, {
        toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200,
      }).start();
    } else {
      Animated.timing(sheetAnim, { toValue: 600, duration: 260, useNativeDriver: true }).start();
    }
  }, [visible]);

  const goNext = () => {
    if (step >= STEPS.length - 1) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(slideX, { toValue: -SW, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setStep((s) => s + 1);
      slideX.setValue(SW);
      Animated.spring(slideX, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 200 }).start();
    });
  };

  const goPrev = () => {
    if (step === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(slideX, { toValue: SW, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setStep((s) => s - 1);
      slideX.setValue(-SW);
      Animated.spring(slideX, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 200 }).start();
    });
  };

  const cur = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <Modal visible={visible} animationType="none" transparent statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={ob.backdrop} onPress={onClose} />
      <Animated.View
        style={[ob.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16, transform: [{ translateY: sheetAnim }] }]}
      >
        {/* Handle */}
        <View style={[ob.handle, { backgroundColor: colors.border }]} />

        {/* Skip */}
        <Pressable onPress={onClose} style={ob.skipBtn}>
          <Text style={[ob.skipText, { color: colors.mutedForeground }]}>Geçir</Text>
        </Pressable>

        {/* Content */}
        <Animated.View style={[ob.content, { transform: [{ translateX: slideX }] }]}>
          {/* Gradient card */}
          <LinearGradient
            colors={cur.gradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={ob.card}
          >
            {/* Decorative rings */}
            <View style={[ob.ring, { width: 180, height: 180, top: -60, right: -60, borderColor: "rgba(255,255,255,0.1)" }]} />
            <View style={[ob.ring, { width: 120, height: 120, bottom: -30, left: -30, borderColor: "rgba(255,255,255,0.08)" }]} />

            <View style={ob.cardInner}>
              <Text style={ob.emoji}>{cur.emoji}</Text>
              <View style={[ob.iconBox, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
                <Ionicons name={cur.icon} size={28} color="#fff" />
              </View>
            </View>
          </LinearGradient>

          {/* Text */}
          <Text style={[ob.title, { color: colors.foreground }]}>{cur.title}</Text>
          <Text style={[ob.desc, { color: colors.mutedForeground }]}>{cur.desc}</Text>
        </Animated.View>

        {/* Step dots */}
        <View style={ob.dots}>
          {STEPS.map((_, i) => (
            <Pressable key={i} onPress={() => { setStep(i); slideX.setValue(0); }}>
              <View style={[ob.dot, {
                backgroundColor: i === step ? cur.color : colors.border,
                width: i === step ? 22 : 7,
              }]} />
            </Pressable>
          ))}
        </View>

        {/* Navigation */}
        <View style={ob.navRow}>
          <Pressable
            onPress={goPrev}
            style={[ob.prevBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: step === 0 ? 0.35 : 1 }]}
            disabled={step === 0}
          >
            <Ionicons name="arrow-back" size={20} color={colors.foreground} />
          </Pressable>

          <Pressable
            onPress={goNext}
            style={[ob.nextBtn, { backgroundColor: cur.color }]}
          >
            <Text style={ob.nextText}>{isLast ? "Başla! 🚀" : "Dowam et"}</Text>
            {!isLast && <Ionicons name="arrow-forward" size={18} color="#fff" />}
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ── Float Trigger ─────────────────────────────────────────────────────
export function OnboardingFloat() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [showFloat, setShowFloat] = useState(false);
  const [showSheet, setShowSheet] = useState(false);

  const floatAnim = useRef(new Animated.Value(120)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((val) => {
      if (!val) {
        setTimeout(() => {
          setShowFloat(true);
          Animated.spring(floatAnim, {
            toValue: 0, useNativeDriver: true, damping: 14, stiffness: 120, delay: 600,
          }).start(() => {
            startPulse();
          });
        }, 1200);
      }
    });
  }, []);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  };

  const handleOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowFloat(false);
    setShowSheet(true);
  };

  const handleClose = () => {
    setShowSheet(false);
    AsyncStorage.setItem(KEY, "1");
  };

  const handleDismiss = () => {
    Animated.timing(floatAnim, { toValue: 200, duration: 280, useNativeDriver: true }).start(() => {
      setShowFloat(false);
      AsyncStorage.setItem(KEY, "1");
    });
  };

  if (!showFloat && !showSheet) return null;

  return (
    <>
      <OnboardingSheet visible={showSheet} onClose={handleClose} />

      {showFloat && (
        <Animated.View
          style={[
            fl.container,
            {
              bottom: insets.bottom + 100,
              right: 16,
              transform: [{ translateY: floatAnim }, { scale: bounceAnim }],
            },
          ]}
          pointerEvents="box-none"
        >
          {/* Pulse ring */}
          <Animated.View
            style={[
              fl.pulseRing,
              { transform: [{ scale: pulseAnim }], opacity: pulseAnim.interpolate({ inputRange: [1, 1.4], outputRange: [0.5, 0] }) },
            ]}
          />

          {/* Card */}
          <Pressable onPress={handleOpen} style={({ pressed }) => [fl.card, { opacity: pressed ? 0.88 : 1 }]}>
            <LinearGradient
              colors={["#065f46", "#10b981"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={fl.gradient}
            >
              {/* Close tiny */}
              <Pressable onPress={handleDismiss} style={fl.closeBtn} hitSlop={12}>
                <Ionicons name="close" size={12} color="rgba(255,255,255,0.7)" />
              </Pressable>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={fl.iconBox}>
                  <Text style={{ fontSize: 20 }}>✨</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={fl.title}>Biz bilen tanyşyň!</Text>
                  <Text style={fl.sub}>Ýeňil'i doly öwreniň →</Text>
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      )}
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────
const ob = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingTop: 10,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: "center", marginBottom: 8,
  },
  skipBtn: {
    alignSelf: "flex-end", paddingHorizontal: 20, paddingVertical: 8, marginBottom: 4,
  },
  skipText: { fontSize: 14, fontWeight: "600" },

  content: { paddingHorizontal: 20 },

  card: {
    borderRadius: 24, height: 200, marginBottom: 20,
    overflow: "hidden", justifyContent: "center", alignItems: "center",
    position: "relative",
  },
  ring: {
    position: "absolute", borderRadius: 999, borderWidth: 1.5,
  },
  cardInner: { alignItems: "center", gap: 14 },
  emoji: { fontSize: 48 },
  iconBox: {
    width: 56, height: 56, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },

  title: { fontSize: 22, fontWeight: "900", textAlign: "center", marginBottom: 10, letterSpacing: -0.4 },
  desc: { fontSize: 14.5, lineHeight: 22, textAlign: "center", marginBottom: 24 },

  dots: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, marginBottom: 20,
  },
  dot: { height: 7, borderRadius: 4 },

  navRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20 },
  prevBtn: {
    width: 48, height: 48, borderRadius: 15, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  nextBtn: {
    flex: 1, height: 52, borderRadius: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  nextText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});

const fl = StyleSheet.create({
  container: { position: "absolute", zIndex: 999 },
  pulseRing: {
    position: "absolute",
    width: 220, height: 70,
    borderRadius: 22,
    backgroundColor: "#10b98130",
    alignSelf: "center",
    top: 0,
  },
  card: {
    borderRadius: 22,
    shadowColor: "#10b981",
    shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
    elevation: 14,
    overflow: "hidden",
    width: 220,
  },
  gradient: { padding: 14, borderRadius: 22, position: "relative" },
  closeBtn: {
    position: "absolute", top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center", justifyContent: "center",
    zIndex: 1,
  },
  iconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  title: { color: "#fff", fontSize: 13, fontWeight: "800", lineHeight: 18 },
  sub: { color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 2 },
});
