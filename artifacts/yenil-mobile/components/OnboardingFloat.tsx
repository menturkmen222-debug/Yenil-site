/**
 * OnboardingFloat
 *
 * • Foydalanuvchi ilovani birinchi marta ochganda (AsyncStorage key yo'q bo'lsa)
 *   2 soniyadan keyin avtomatik pastdan yuqoriga suzib chiqadi.
 * • Hech qanday float button yo'q — to'g'ridan-to'g'ri onboarding sheet.
 * • Emoji o'rniga kuchli Ionicons / LinearGradient ikonkalar.
 */

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

const STORAGE_KEY = "@yenil_onboarding_v2_seen";
const { width: SW } = Dimensions.get("window");

// ─────────────────────────────────────────────────────────────────────────────
// Onboarding steps
// ─────────────────────────────────────────────────────────────────────────────
interface Step {
  title: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: readonly [string, string, ...string[]];
  accentColor: string;
}

const STEPS: Step[] = [
  {
    title: "Ýeňil'e hoş geldiňiz!",
    desc: "Ýeňil — Türkmenistanyň iň ýeňil super-programmasy. Bilet almakdan pul gazanmaga çenli — hemmesi bir ýerde.",
    icon: "rocket-outline",
    gradient: ["#064e3b", "#059669", "#10b981"],
    accentColor: "#10b981",
  },
  {
    title: "Demirýol biletleri",
    desc: "Bank kartyňyz bolmasa-da otly bilet alyp bilersiňiz! 6 sanly zakaz koduňyzy giriziň — töleg biz tarapdan edilýär.",
    icon: "train-outline",
    gradient: ["#1e3a8a", "#1d4ed8", "#3b82f6"],
    accentColor: "#3b82f6",
  },
  {
    title: "Ýeňil Pay",
    desc: "Payeer, Perfect Money we WebMoney walýutalaryny TMT'ye çalşyp bilersiňiz. Tiz, ygtybarly we has amatly.",
    icon: "swap-horizontal-outline",
    gradient: ["#4c1d95", "#6d28d9", "#8b5cf6"],
    accentColor: "#8b5cf6",
  },
  {
    title: "AI Agent kömekçi",
    desc: "Islendik soragyňyza AI kömekçimiz jogap berýär. Maslahata, maglumata ýa-da kömege mätäç bolsaňyz — elmydama taýyn.",
    icon: "hardware-chip-outline",
    gradient: ["#1e1b4b", "#4338ca", "#6366f1"],
    accentColor: "#6366f1",
  },
  {
    title: "E-Bilim — Öwren, Gazan",
    desc: "Sapak geç → synag ber → BP gazan! 25+ sapak bar: AI, Frilanser, Kripto we beýlekiler.",
    icon: "school-outline",
    gradient: ["#78350f", "#b45309", "#f59e0b"],
    accentColor: "#f59e0b",
  },
  {
    title: "BP — Bonus Pul",
    desc: "BP (Bonus Pul) — biziň içki pul ulgamymyz. Sapak geçip, dost çagyryp, kuryer bolup BP gazanyp bilersiňiz.",
    icon: "wallet-outline",
    gradient: ["#065f46", "#047857", "#059669"],
    accentColor: "#059669",
  },
  {
    title: "Başlamaga taýyn!",
    desc: "Ähli mümkinçilikler eliňizde. Islän hyzmaty ulanyp başlaň. Kömek gerek bolsa AI Agent hemişe elýeterli!",
    icon: "checkmark-circle-outline",
    gradient: ["#7f1d1d", "#b91c1c", "#ef4444"],
    accentColor: "#ef4444",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export function OnboardingFloat() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  // Sheet slide animation
  const sheetAnim = useRef(new Animated.Value(700)).current;
  // Step slide animation
  const slideX = useRef(new Animated.Value(0)).current;
  // Progress bar animation
  const progressAnim = useRef(new Animated.Value(0)).current;

  // ── Check AsyncStorage on mount ──────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (!val) {
        // Delay so home screen fully loads first
        const timer = setTimeout(() => {
          setVisible(true);
          setStep(0);
          sheetAnim.setValue(700);
          Animated.spring(sheetAnim, {
            toValue: 0,
            useNativeDriver: true,
            damping: 22,
            stiffness: 180,
          }).start();
          animateProgress(0);
        }, 1800);
        return () => clearTimeout(timer);
      }
    });
  }, []);

  // ── Progress bar ─────────────────────────────────────────────────────────
  const animateProgress = (targetStep: number) => {
    Animated.timing(progressAnim, {
      toValue: (targetStep + 1) / STEPS.length,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // ── Navigate steps ───────────────────────────────────────────────────────
  const gotoStep = (nextStep: number, direction: "forward" | "back") => {
    const outX = direction === "forward" ? -SW : SW;
    const inX = direction === "forward" ? SW : -SW;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.timing(slideX, {
      toValue: outX,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      slideX.setValue(inX);
      Animated.spring(slideX, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 220,
      }).start();
      animateProgress(nextStep);
    });
  };

  const goNext = () => {
    if (step >= STEPS.length - 1) {
      handleClose();
      return;
    }
    gotoStep(step + 1, "forward");
  };

  const goPrev = () => {
    if (step === 0) return;
    gotoStep(step - 1, "back");
  };

  const handleClose = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.timing(sheetAnim, {
      toValue: 700,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      AsyncStorage.setItem(STORAGE_KEY, "1");
    });
  };

  // ── Skip ─────────────────────────────────────────────────────────────────
  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(sheetAnim, {
      toValue: 700,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      AsyncStorage.setItem(STORAGE_KEY, "1");
    });
  };

  if (!visible) return null;

  const cur = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={handleSkip}
    >
      {/* Backdrop */}
      <Pressable style={ob.backdrop} onPress={handleSkip} />

      {/* Sheet */}
      <Animated.View
        style={[
          ob.sheet,
          {
            backgroundColor: colors.background,
            paddingBottom: insets.bottom + 20,
            transform: [{ translateY: sheetAnim }],
          },
        ]}
      >
        {/* Handle */}
        <View style={[ob.handle, { backgroundColor: colors.border }]} />

        {/* Top row: step counter + skip */}
        <View style={ob.topRow}>
          <Text style={[ob.stepCount, { color: colors.mutedForeground }]}>
            {step + 1} / {STEPS.length}
          </Text>
          <Pressable onPress={handleSkip} hitSlop={12} style={[ob.skipBtn, { backgroundColor: colors.muted }]}>
            <Text style={[ob.skipTxt, { color: colors.mutedForeground }]}>Geçir</Text>
          </Pressable>
        </View>

        {/* Progress bar */}
        <View style={[ob.progressTrack, { backgroundColor: colors.border }]}>
          <Animated.View
            style={[ob.progressFill, { width: progressWidth, backgroundColor: cur.accentColor }]}
          />
        </View>

        {/* Content — animated on step change */}
        <Animated.View style={[ob.content, { transform: [{ translateX: slideX }] }]}>
          {/* Icon card */}
          <LinearGradient
            colors={cur.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={ob.iconCard}
          >
            {/* Decorative rings */}
            <View style={[ob.ring1, { borderColor: "rgba(255,255,255,0.12)" }]} />
            <View style={[ob.ring2, { borderColor: "rgba(255,255,255,0.07)" }]} />

            {/* Center icon */}
            <View style={[ob.iconCircle, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
              <View style={[ob.iconInner, { backgroundColor: "rgba(255,255,255,0.20)" }]}>
                <Ionicons name={cur.icon} size={40} color="#fff" />
              </View>
            </View>

            {/* Step dots on card */}
            <View style={ob.cardDots}>
              {STEPS.map((_, i) => (
                <View
                  key={i}
                  style={[
                    ob.cardDot,
                    {
                      backgroundColor: i === step ? "#fff" : "rgba(255,255,255,0.35)",
                      width: i === step ? 20 : 6,
                    },
                  ]}
                />
              ))}
            </View>
          </LinearGradient>

          {/* Text */}
          <Text style={[ob.title, { color: colors.foreground }]}>{cur.title}</Text>
          <Text style={[ob.desc, { color: colors.mutedForeground }]}>{cur.desc}</Text>
        </Animated.View>

        {/* Navigation */}
        <View style={ob.navRow}>
          {/* Back */}
          <Pressable
            onPress={goPrev}
            disabled={step === 0}
            style={[
              ob.backBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: step === 0 ? 0.3 : 1,
              },
            ]}
          >
            <Ionicons name="arrow-back" size={20} color={colors.foreground} />
          </Pressable>

          {/* Next / Finish */}
          <Pressable
            onPress={goNext}
            style={({ pressed }) => [ob.nextBtn, { backgroundColor: cur.accentColor, opacity: pressed ? 0.88 : 1 }]}
          >
            <Text style={ob.nextTxt}>
              {isLast ? "Başlalyň!" : "Dowam et"}
            </Text>
            <Ionicons
              name={isLast ? "checkmark" : "arrow-forward"}
              size={18}
              color="#fff"
            />
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const ob = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 10,
    overflow: "hidden",
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: "center", marginBottom: 14,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  stepCount: {
    fontSize: 13,
    fontWeight: "700",
  },
  skipBtn: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipTxt: {
    fontSize: 13,
    fontWeight: "600",
  },
  progressTrack: {
    height: 3,
    marginHorizontal: 20,
    borderRadius: 2,
    marginBottom: 20,
    overflow: "hidden",
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },

  // ── Animated content ──
  content: {
    paddingHorizontal: 20,
  },

  // ── Icon card ──
  iconCard: {
    borderRadius: 24,
    height: 210,
    marginBottom: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  ring1: {
    position: "absolute",
    width: 200, height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
    top: -60, right: -60,
  },
  ring2: {
    position: "absolute",
    width: 140, height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    bottom: -40, left: -40,
  },
  iconCircle: {
    width: 100, height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  iconInner: {
    width: 76, height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  cardDots: {
    position: "absolute",
    bottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  cardDot: {
    height: 6,
    borderRadius: 3,
  },

  // ── Text ──
  title: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 10,
    textAlign: "center",
  },
  desc: {
    fontSize: 14.5,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 26,
  },

  // ── Nav ──
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 50, height: 50,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  nextTxt: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
