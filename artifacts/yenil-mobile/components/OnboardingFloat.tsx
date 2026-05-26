/**
 * OnboardingFloat — Avtomatik onboarding
 * Har bir bosqich o'ziga xos vizual kompozitsiya bilan.
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, Modal, Pressable,
  Animated, Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";

const STORAGE_KEY = "@yenil_onboarding_v3_seen";
const { width: SW } = Dimensions.get("window");

// ─────────────────────────────────────────────────────────────────────────────
// Unique visual card for each step
// ─────────────────────────────────────────────────────────────────────────────

/** Step 0 — Ýeňil'e hoş geldiňiz */
function CardWelcome() {
  return (
    <LinearGradient colors={["#064e3b", "#059669", "#34d399"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={card.wrap}>
      <View style={[card.ring, { width: 220, height: 220, top: -70, right: -70, borderColor: "rgba(255,255,255,0.1)" }]} />
      <View style={[card.ring, { width: 140, height: 140, bottom: -40, left: -40, borderColor: "rgba(255,255,255,0.08)" }]} />
      {/* Stars scattered */}
      <View style={[card.starDot, { top: 28, left: 36 }]}>
        <Ionicons name="star" size={12} color="rgba(255,255,255,0.6)" />
      </View>
      <View style={[card.starDot, { top: 18, right: 52 }]}>
        <Ionicons name="star" size={8} color="rgba(255,255,255,0.45)" />
      </View>
      <View style={[card.starDot, { bottom: 26, right: 38 }]}>
        <Ionicons name="star" size={10} color="rgba(255,255,255,0.5)" />
      </View>
      {/* Logo badge */}
      <View style={[card.logoBadge, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
        <Text style={card.logoText}>Ý</Text>
      </View>
      {/* Main rocket */}
      <View style={[card.mainCircle, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
        <Ionicons name="rocket" size={44} color="#fff" />
      </View>
      {/* "Super App" tag */}
      <View style={[card.tag, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
        <Ionicons name="globe-outline" size={11} color="#fff" />
        <Text style={card.tagText}>Türkmenistan Super App</Text>
      </View>
    </LinearGradient>
  );
}

/** Step 1 — Demirýol biletleri */
function CardTrain() {
  return (
    <LinearGradient colors={["#1e3a8a", "#1d4ed8", "#60a5fa"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={card.wrap}>
      {/* Track lines at bottom */}
      <View style={card.trackWrap}>
        {[0, 1, 2, 3, 4, 5].map(i => (
          <View key={i} style={[card.sleeper, { backgroundColor: "rgba(255,255,255,0.3)" }]} />
        ))}
        <View style={[card.rail, { top: 6 }]} />
        <View style={[card.rail, { bottom: 6 }]} />
      </View>
      {/* Ticket in top-right */}
      <View style={[card.corner, { top: 18, right: 18, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 10, padding: 6 }]}>
        <Ionicons name="ticket-outline" size={20} color="#fff" />
      </View>
      {/* Location pin top-left */}
      <View style={[card.corner, { top: 18, left: 18, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 10, padding: 6 }]}>
        <Ionicons name="location" size={20} color="#fff" />
      </View>
      {/* Main train */}
      <View style={[card.mainCircle, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
        <Ionicons name="train" size={46} color="#fff" />
      </View>
      {/* "Bank kartsyz" tag */}
      <View style={[card.tag, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
        <Ionicons name="checkmark-circle" size={11} color="#4ade80" />
        <Text style={card.tagText}>Bank kartsyz · 6 sanly kod</Text>
      </View>
    </LinearGradient>
  );
}

/** Step 2 — Ýeňil Pay */
function CardPay() {
  return (
    <LinearGradient colors={["#4c1d95", "#7c3aed", "#a78bfa"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={card.wrap}>
      <View style={[card.ring, { width: 180, height: 180, top: -55, left: -55, borderColor: "rgba(255,255,255,0.1)" }]} />
      {/* Exchange layout: left coin ↔ right coin */}
      <View style={card.exchangeRow}>
        {/* Left: $ */}
        <View style={[card.currencyBox, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
          <MaterialCommunityIcons name="currency-usd" size={28} color="#fff" />
          <Text style={card.currencyLabel}>USD</Text>
        </View>
        {/* Arrows */}
        <View style={card.arrowsCol}>
          <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.8)" />
          <View style={{ height: 6 }} />
          <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.5)" />
        </View>
        {/* Right: TMT */}
        <View style={[card.currencyBox, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
          <MaterialCommunityIcons name="cash-multiple" size={28} color="#fde68a" />
          <Text style={card.currencyLabel}>TMT</Text>
        </View>
      </View>
      {/* Services row */}
      <View style={card.servicesRow}>
        {["Payeer", "PM", "WM"].map((name) => (
          <View key={name} style={[card.servicePill, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
            <Text style={card.servicePillText}>{name}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

/** Step 3 — AI Agent */
function CardAI() {
  return (
    <LinearGradient colors={["#1e1b4b", "#4338ca", "#818cf8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={card.wrap}>
      {/* Chat bubble left */}
      <View style={[card.chatBubble, { left: 20, top: 30, backgroundColor: "rgba(255,255,255,0.15)" }]}>
        <Text style={card.chatText}>Salam! Kömek edip bilerin?</Text>
        <View style={[card.chatTail, { left: -7 }]} />
      </View>
      {/* Chat bubble right */}
      <View style={[card.chatBubble, { right: 20, bottom: 48, backgroundColor: "rgba(99,102,241,0.5)" }]}>
        <Text style={card.chatText}>Demirýol bilet nädip?</Text>
        <View style={[card.chatTail, { right: -7, transform: [{ scaleX: -1 }] }]} />
      </View>
      {/* Main chip icon */}
      <View style={[card.mainCircle, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
        <MaterialCommunityIcons name="robot-excited" size={46} color="#fff" />
      </View>
      {/* Online badge */}
      <View style={[card.tag, { backgroundColor: "rgba(74,222,128,0.25)" }]}>
        <View style={[card.onlineDot, { backgroundColor: "#4ade80" }]} />
        <Text style={[card.tagText, { color: "#4ade80" }]}>AI · Elmydama onlaýn</Text>
      </View>
    </LinearGradient>
  );
}

/** Step 4 — E-Bilim */
function CardEBilim() {
  return (
    <LinearGradient colors={["#78350f", "#b45309", "#fbbf24"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={card.wrap}>
      <View style={[card.ring, { width: 200, height: 200, top: -60, right: -60, borderColor: "rgba(255,255,255,0.1)" }]} />
      {/* Graduation cap top-right */}
      <View style={[card.corner, { top: 16, right: 16, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 10, padding: 7 }]}>
        <Ionicons name="school" size={20} color="#fff" />
      </View>
      {/* BP reward top-left */}
      <View style={[card.corner, { top: 16, left: 16, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 }]}>
        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "800" }}>+0.3 BP</Text>
      </View>
      {/* Main open book */}
      <View style={[card.mainCircle, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
        <Ionicons name="book" size={44} color="#fff" />
      </View>
      {/* Category pills */}
      <View style={card.servicesRow}>
        {["AI", "Kripto", "Frilanser"].map((name) => (
          <View key={name} style={[card.servicePill, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Text style={card.servicePillText}>{name}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

/** Step 5 — BP Bonus Pul */
function CardBP() {
  return (
    <LinearGradient colors={["#134e4a", "#0f766e", "#2dd4bf"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={card.wrap}>
      {/* Coin stack visual */}
      <View style={card.coinStack}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              card.coin,
              {
                bottom: i * 14,
                backgroundColor: i === 2 ? "#fbbf24" : i === 1 ? "#f59e0b" : "#d97706",
                width: 72 - i * 6,
                zIndex: i,
              },
            ]}
          >
            <Text style={card.coinText}>BP</Text>
          </View>
        ))}
      </View>
      {/* Wallet + ways to earn */}
      <View style={[card.bpMethodsWrap]}>
        {[
          { icon: "school-outline" as const, label: "E-Bilim" },
          { icon: "people-outline" as const, label: "Referal" },
          { icon: "bicycle-outline" as const, label: "Kuryer" },
        ].map(({ icon, label }) => (
          <View key={label} style={[card.bpMethod, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
            <Ionicons name={icon} size={16} color="#fff" />
            <Text style={card.bpMethodText}>{label}</Text>
          </View>
        ))}
      </View>
      <View style={[card.tag, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
        <MaterialCommunityIcons name="cash-fast" size={12} color="#fff" />
        <Text style={card.tagText}>Içki pul ulgamy</Text>
      </View>
    </LinearGradient>
  );
}

/** Step 6 — Başlamaga taýyn */
function CardReady() {
  return (
    <LinearGradient colors={["#7f1d1d", "#b91c1c", "#f87171"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={card.wrap}>
      {/* Confetti dots */}
      {[
        { top: 22, left: 28,  color: "#fbbf24", size: 10 },
        { top: 14, right: 44, color: "#34d399", size: 8  },
        { top: 38, right: 22, color: "#a78bfa", size: 12 },
        { bottom: 32, left: 22, color: "#60a5fa", size: 9 },
        { bottom: 18, right: 30, color: "#fbbf24", size: 7 },
      ].map((dot, i) => (
        <View
          key={i}
          style={[
            card.confettiDot,
            {
              top: dot.top,
              bottom: dot.bottom,
              left: dot.left,
              right: dot.right,
              width: dot.size,
              height: dot.size,
              borderRadius: dot.size / 2,
              backgroundColor: dot.color,
            },
          ]}
        />
      ))}
      {/* Trophy */}
      <View style={[card.corner, { top: 16, left: 16, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 10, padding: 7 }]}>
        <Ionicons name="trophy" size={20} color="#fbbf24" />
      </View>
      {/* Star top-right */}
      <View style={[card.corner, { top: 16, right: 16, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 10, padding: 7 }]}>
        <Ionicons name="star" size={20} color="#fbbf24" />
      </View>
      {/* Big checkmark */}
      <View style={[card.mainCircle, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
        <Ionicons name="checkmark-circle" size={50} color="#fff" />
      </View>
      <View style={[card.tag, { backgroundColor: "rgba(255,255,255,0.22)" }]}>
        <Ionicons name="rocket" size={11} color="#fff" />
        <Text style={card.tagText}>Ýeňil bilen ýol aç!</Text>
      </View>
    </LinearGradient>
  );
}

const CARD_RENDERERS = [
  CardWelcome,
  CardTrain,
  CardPay,
  CardAI,
  CardEBilim,
  CardBP,
  CardReady,
];

// ─────────────────────────────────────────────────────────────────────────────
// Step metadata
// ─────────────────────────────────────────────────────────────────────────────
const STEPS = [
  { title: "Ýeňil'e hoş geldiňiz!", desc: "Türkmenistanyň iň ýeňil super-programmasy. Bilet almakdan pul gazanmaga çenli — hemmesi bir ýerde.", accent: "#10b981" },
  { title: "Demirýol biletleri",     desc: "Bank kartyňyz bolmasa-da otly bilet alyp bilersiňiz! 6 sanly zakaz koduňyzy giriziň — töleg biz tarapdan.", accent: "#3b82f6" },
  { title: "Ýeňil Pay",             desc: "Payeer, Perfect Money we WebMoney walýutalaryny TMT'ye çalşyp bilersiňiz. Tiz, ygtybarly we amatly.", accent: "#8b5cf6" },
  { title: "AI Agent kömekçi",      desc: "Islendik soragyňyza AI kömekçimiz jogap berýär. Maslahata, maglumata ýa-da kömege — elmydama taýyn.", accent: "#6366f1" },
  { title: "E-Bilim — Öwren, Gazan", desc: "Sapak geç → synag ber → BP gazan! 25+ sapak: AI, Frilanser, Kripto we beýlekiler.", accent: "#f59e0b" },
  { title: "BP — Bonus Pul",        desc: "BP biziň içki pul ulgamymyz. Sapak geçip, dost çagyryp, kuryer bolup BP gazanyp bilersiňiz!", accent: "#14b8a6" },
  { title: "Başlamaga taýyn!",      desc: "Ähli mümkinçilikler eliňizde. Islän hyzmaty ulanyp başlaň. Kömek gerek bolsa AI Agent hemişe taýyn!", accent: "#ef4444" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export function OnboardingFloat() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  const sheetAnim   = useRef(new Animated.Value(700)).current;
  const slideX      = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (!val) {
        const t = setTimeout(() => {
          setVisible(true);
          setStep(0);
          sheetAnim.setValue(700);
          progressAnim.setValue(0);
          Animated.spring(sheetAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 180 }).start();
          animProgress(0);
        }, 1800);
        return () => clearTimeout(t);
      }
    });
  }, []);

  const animProgress = (s: number) => {
    Animated.timing(progressAnim, {
      toValue: (s + 1) / STEPS.length,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const gotoStep = (next: number, dir: "fwd" | "bck") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const outX = dir === "fwd" ? -SW * 0.7 : SW * 0.7;
    const inX  = dir === "fwd" ?  SW * 0.7 : -SW * 0.7;
    Animated.timing(slideX, { toValue: outX, duration: 210, useNativeDriver: true }).start(() => {
      setStep(next);
      slideX.setValue(inX);
      Animated.spring(slideX, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 240 }).start();
      animProgress(next);
    });
  };

  const goNext = () => {
    if (step >= STEPS.length - 1) { handleClose(); return; }
    gotoStep(step + 1, "fwd");
  };
  const goPrev = () => {
    if (step === 0) return;
    gotoStep(step - 1, "bck");
  };

  const dismiss = (save = true) => {
    Animated.timing(sheetAnim, { toValue: 700, duration: 280, useNativeDriver: true }).start(() => {
      setVisible(false);
      if (save) AsyncStorage.setItem(STORAGE_KEY, "1");
    });
  };
  const handleClose = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    dismiss(true);
  };
  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dismiss(true);
  };

  if (!visible) return null;

  const cur       = STEPS[step];
  const isLast    = step === STEPS.length - 1;
  const CardComp  = CARD_RENDERERS[step];
  const barWidth  = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <Modal visible={visible} animationType="none" transparent statusBarTranslucent onRequestClose={handleSkip}>
      <Pressable style={ob.backdrop} onPress={handleSkip} />

      <Animated.View
        style={[
          ob.sheet,
          { backgroundColor: colors.background, paddingBottom: insets.bottom + 20, transform: [{ translateY: sheetAnim }] },
        ]}
      >
        {/* Handle */}
        <View style={[ob.handle, { backgroundColor: colors.border }]} />

        {/* Top row */}
        <View style={ob.topRow}>
          <Text style={[ob.stepCount, { color: colors.mutedForeground }]}>{step + 1} / {STEPS.length}</Text>
          <Pressable onPress={handleSkip} hitSlop={12} style={[ob.skipBtn, { backgroundColor: colors.muted }]}>
            <Text style={[ob.skipTxt, { color: colors.mutedForeground }]}>Geçir</Text>
          </Pressable>
        </View>

        {/* Progress bar */}
        <View style={[ob.progressTrack, { backgroundColor: colors.border }]}>
          <Animated.View style={[ob.progressFill, { width: barWidth, backgroundColor: cur.accent }]} />
        </View>

        {/* Animated content */}
        <Animated.View style={[ob.content, { transform: [{ translateX: slideX }] }]}>
          {/* Unique card per step */}
          <CardComp />

          {/* Text */}
          <Text style={[ob.title, { color: colors.foreground }]}>{cur.title}</Text>
          <Text style={[ob.desc, { color: colors.mutedForeground }]}>{cur.desc}</Text>
        </Animated.View>

        {/* Nav */}
        <View style={ob.navRow}>
          <Pressable
            onPress={goPrev}
            disabled={step === 0}
            style={[ob.backBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: step === 0 ? 0.28 : 1 }]}
          >
            <Ionicons name="arrow-back" size={20} color={colors.foreground} />
          </Pressable>
          <Pressable
            onPress={goNext}
            style={({ pressed }) => [ob.nextBtn, { backgroundColor: cur.accent, opacity: pressed ? 0.88 : 1 }]}
          >
            <Text style={ob.nextTxt}>{isLast ? "Başlalyň!" : "Dowam et"}</Text>
            <Ionicons name={isLast ? "checkmark" : "arrow-forward"} size={18} color="#fff" />
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card shared styles
// ─────────────────────────────────────────────────────────────────────────────
const card = StyleSheet.create({
  wrap: {
    borderRadius: 24, height: 210, marginBottom: 20,
    alignItems: "center", justifyContent: "center",
    overflow: "hidden", position: "relative",
  },
  ring: {
    position: "absolute", borderRadius: 999, borderWidth: 1.5,
  },
  starDot: { position: "absolute" },
  corner: { position: "absolute" },
  confettiDot: { position: "absolute" },

  // Welcome
  logoBadge: {
    position: "absolute", top: 16, left: 16,
    width: 36, height: 36, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
  },
  logoText: { color: "#fff", fontSize: 18, fontWeight: "900" },

  // Main center circle (reused across steps)
  mainCircle: {
    width: 86, height: 86, borderRadius: 43,
    alignItems: "center", justifyContent: "center",
  },

  // Bottom tag
  tag: {
    position: "absolute", bottom: 14,
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },
  tagText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  onlineDot: { width: 7, height: 7, borderRadius: 4 },

  // Train card
  trackWrap: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 36,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  sleeper: { width: 14, height: 36, borderRadius: 3 },
  rail: {
    position: "absolute", left: 0, right: 0, height: 4,
    backgroundColor: "rgba(255,255,255,0.5)", borderRadius: 2,
  },

  // Pay card
  exchangeRow: {
    flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 12,
  },
  currencyBox: {
    width: 72, height: 72, borderRadius: 18,
    alignItems: "center", justifyContent: "center", gap: 4,
  },
  currencyLabel: { color: "#fff", fontSize: 11, fontWeight: "800" },
  arrowsCol: { alignItems: "center" },
  servicesRow: { flexDirection: "row", gap: 8 },
  servicePill: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5 },
  servicePillText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  // AI card
  chatBubble: {
    position: "absolute", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8,
    maxWidth: "55%",
  },
  chatText: { color: "#fff", fontSize: 11, fontWeight: "600", lineHeight: 15 },
  chatTail: {
    position: "absolute", bottom: 8,
    width: 0, height: 0,
    borderTopWidth: 7, borderTopColor: "transparent",
    borderBottomWidth: 7, borderBottomColor: "transparent",
    borderRightWidth: 7, borderRightColor: "rgba(255,255,255,0.15)",
  },

  // BP card
  coinStack: {
    position: "absolute", alignItems: "center", bottom: 20,
    width: "100%", height: 60,
  },
  coin: {
    position: "absolute", height: 22, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
  },
  coinText: { color: "#fff", fontSize: 11, fontWeight: "900" },
  bpMethodsWrap: {
    flexDirection: "row", gap: 8, marginBottom: 10,
  },
  bpMethod: {
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7,
    alignItems: "center", gap: 4,
  },
  bpMethodText: { color: "#fff", fontSize: 10, fontWeight: "700" },
});

// ─────────────────────────────────────────────────────────────────────────────
// Sheet styles
// ─────────────────────────────────────────────────────────────────────────────
const ob = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingTop: 10, overflow: "hidden",
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 14 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 10 },
  stepCount: { fontSize: 13, fontWeight: "700" },
  skipBtn: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  skipTxt: { fontSize: 13, fontWeight: "600" },
  progressTrack: { height: 3, marginHorizontal: 20, borderRadius: 2, marginBottom: 18, overflow: "hidden" },
  progressFill: { height: 3, borderRadius: 2 },
  content: { paddingHorizontal: 20 },
  title: { fontSize: 21, fontWeight: "900", letterSpacing: -0.5, marginBottom: 9, textAlign: "center" },
  desc: { fontSize: 14, lineHeight: 21, textAlign: "center", marginBottom: 22 },
  navRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20 },
  backBtn: { width: 50, height: 50, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  nextBtn: {
    flex: 1, height: 52, borderRadius: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    shadowOpacity: 0.22, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  nextTxt: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
