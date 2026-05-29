/**
 * DailyGiftModal — Gündelik Sowgat
 *
 * Düzgünler:
 * • Her 24 sagatda 1 gezek. Sene Firebase-de saklanýar (anti-cheat).
 * • Berlen BP diňe içerde ulanylyp bilner (bonus balans).
 * • Tikme, lotereýa, bet — ýok. Bu diňe mugt sylag.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, Modal, Pressable, Animated,
  Dimensions, ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { getDeviceIdAsync } from "@/lib/deviceId";
import { claimDailyGift, checkDailyGiftClaimed } from "@/lib/firebase";

const { width: SW } = Dimensions.get("window");

type Phase = "loading" | "available" | "opening" | "claimed" | "already_claimed";

// ─────────────────────────────────────────────────────────────────────────────
// Confetti particle colors
// ─────────────────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = [
  "#10b981", "#f59e0b", "#6366f1", "#ef4444",
  "#0ea5e9", "#ec4899", "#14b8a6", "#fbbf24",
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export function DailyGiftModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState<Phase>("loading");
  const [reward, setReward] = useState(0);

  // ── Sheet entrance ──
  const sheetAnim = useRef(new Animated.Value(600)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;

  // ── Gift box animations ──
  const boxScale = useRef(new Animated.Value(1)).current;
  const boxRotate = useRef(new Animated.Value(0)).current;
  const boxOpacity = useRef(new Animated.Value(1)).current;

  // ── Pulse rings (idle) ──
  const pulseScale1 = useRef(new Animated.Value(1)).current;
  const pulseOpacity1 = useRef(new Animated.Value(0.5)).current;
  const pulseScale2 = useRef(new Animated.Value(1)).current;
  const pulseOpacity2 = useRef(new Animated.Value(0.3)).current;

  // ── Reward reveal ──
  const rewardScale = useRef(new Animated.Value(0.2)).current;
  const rewardOpacity = useRef(new Animated.Value(0)).current;

  // ── Confetti: 8 particles ──
  const confetti = useRef(
    CONFETTI_COLORS.map(() => ({
      pos: new Animated.ValueXY({ x: 0, y: 0 }),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  // ─────────────────────────────────────────────────────────────────────────
  // Load state when modal opens
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return;
    setPhase("loading");

    // Animate sheet in (useNativeDriver: false for web compat with translateY)
    sheetAnim.setValue(600);
    sheetOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(sheetAnim, { toValue: 0, useNativeDriver: false, damping: 24, stiffness: 200 }),
      Animated.timing(sheetOpacity, { toValue: 1, duration: 220, useNativeDriver: false }),
    ]).start();

    // Reset all animations
    boxScale.setValue(1);
    boxRotate.setValue(0);
    boxOpacity.setValue(1);
    rewardScale.setValue(0.2);
    rewardOpacity.setValue(0);
    confetti.forEach(p => { p.pos.setValue({ x: 0, y: 0 }); p.opacity.setValue(0); p.scale.setValue(0); });

    getDeviceIdAsync()
      .then(async (deviceId) => {
        const claimed = await checkDailyGiftClaimed(deviceId);
        if (claimed) {
          setPhase("already_claimed");
        } else {
          setPhase("available");
          startPulse();
        }
      })
      .catch(() => {
        setPhase("available");
        startPulse();
      });
  }, [visible]);

  // ─────────────────────────────────────────────────────────────────────────
  // Pulse rings loop
  // ─────────────────────────────────────────────────────────────────────────
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  const startPulse = useCallback(() => {
    pulseLoop.current?.stop();
    pulseScale1.setValue(1); pulseOpacity1.setValue(0.5);
    pulseScale2.setValue(1); pulseOpacity2.setValue(0.3);

    const loop = Animated.loop(
      Animated.stagger(400, [
        Animated.parallel([
          Animated.timing(pulseScale1, { toValue: 1.8, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseOpacity1, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale2, { toValue: 1.8, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseOpacity2, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ]),
      ])
    );
    pulseLoop.current = loop;
    loop.start();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Open gift button pressed
  // ─────────────────────────────────────────────────────────────────────────
  const handleOpen = async () => {
    if (phase !== "available") return;

    // Stop pulse
    pulseLoop.current?.stop();

    setPhase("opening");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Step 1: box bounces up
    Animated.sequence([
      Animated.spring(boxScale, {
        toValue: 1.35,
        useNativeDriver: true,
        damping: 6,
        stiffness: 300,
      }),
      Animated.delay(80),
    ]).start();

    // Step 2: box wobbles (rotation)
    Animated.sequence([
      Animated.timing(boxRotate, { toValue: 12, duration: 80, useNativeDriver: true }),
      Animated.timing(boxRotate, { toValue: -12, duration: 100, useNativeDriver: true }),
      Animated.timing(boxRotate, { toValue: 8, duration: 80, useNativeDriver: true }),
      Animated.timing(boxRotate, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();

    // Step 3: fade box out after 400ms
    setTimeout(() => {
      Animated.timing(boxOpacity, { toValue: 0, duration: 260, useNativeDriver: true }).start();
    }, 380);

    // Step 4: claim from Firebase & show reward
    setTimeout(async () => {
      const deviceId = await getDeviceIdAsync();
      const result = await claimDailyGift(deviceId);

      const finalReward = result.canClaim ? (result.reward ?? 0.05) : 0.05;
      setReward(finalReward);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPhase("claimed");

      // Reward number spring in
      Animated.parallel([
        Animated.spring(rewardScale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 10,
          stiffness: 180,
        }),
        Animated.timing(rewardOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();

      // Confetti burst
      fireConfetti();
    }, 560);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Confetti burst
  // ─────────────────────────────────────────────────────────────────────────
  const fireConfetti = () => {
    confetti.forEach((p, i) => {
      const angle = (i / confetti.length) * 2 * Math.PI - Math.PI / 2;
      const spread = 0.45;
      const finalAngle = angle + (Math.random() - 0.5) * spread;
      const dist = 90 + Math.random() * 60;
      const tx = Math.cos(finalAngle) * dist;
      const ty = Math.sin(finalAngle) * dist - 20;

      p.pos.setValue({ x: 0, y: 0 });
      p.opacity.setValue(0);
      p.scale.setValue(0);

      Animated.parallel([
        Animated.spring(p.scale, { toValue: 1, useNativeDriver: true, damping: 8, stiffness: 200 }),
        Animated.timing(p.opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(p.pos, { toValue: { x: tx, y: ty }, duration: 700, useNativeDriver: true }),
      ]).start(() => {
        Animated.timing(p.opacity, { toValue: 0, duration: 400, useNativeDriver: true }).start();
      });
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Dismiss sheet
  // ─────────────────────────────────────────────────────────────────────────
  const handleClose = () => {
    Animated.parallel([
      Animated.timing(sheetAnim, { toValue: 600, duration: 260, useNativeDriver: false }),
      Animated.timing(sheetOpacity, { toValue: 0, duration: 220, useNativeDriver: false }),
    ]).start(onClose);
  };

  const boxRotateDeg = boxRotate.interpolate({
    inputRange: [-360, 360],
    outputRange: ["-360deg", "360deg"],
  });

  const isRare = reward === 2;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Modal visible={visible} animationType="none" transparent statusBarTranslucent onRequestClose={handleClose}>
      {/* Backdrop */}
      <Animated.View style={[dg.backdrop, { opacity: sheetOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={phase === "opening" ? undefined : handleClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          dg.sheet,
          {
            backgroundColor: colors.background,
            paddingBottom: insets.bottom + 24,
            transform: [{ translateY: sheetAnim }],
            opacity: sheetOpacity,
          },
        ]}
      >
        {/* Handle */}
        <View style={[dg.handle, { backgroundColor: colors.border }]} />

        {/* Header row */}
        <View style={dg.headerRow}>
          <View>
            <Text style={[dg.sheetTitle, { color: colors.foreground }]}>Gündelik Sowgat</Text>
            <Text style={[dg.sheetSub, { color: colors.mutedForeground }]}>Her gün açylyp bilner · Mugt</Text>
          </View>
          <Pressable
            onPress={phase === "opening" ? undefined : handleClose}
            style={[dg.closeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="close" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {/* ── LOADING ── */}
        {phase === "loading" && (
          <View style={dg.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[dg.loadingTxt, { color: colors.mutedForeground }]}>Barlanýar...</Text>
          </View>
        )}

        {/* ── AVAILABLE ── */}
        {(phase === "available" || phase === "opening") && (
          <View style={dg.center}>
            {/* Pulse rings */}
            <View style={dg.pulseWrap}>
              <Animated.View
                style={[dg.pulseRing, {
                  borderColor: "#10b98140",
                  transform: [{ scale: pulseScale1 }],
                  opacity: pulseOpacity1,
                }]}
              />
              <Animated.View
                style={[dg.pulseRing, {
                  borderColor: "#10b98128",
                  width: 140, height: 140, borderRadius: 70,
                  transform: [{ scale: pulseScale2 }],
                  opacity: pulseOpacity2,
                }]}
              />

              {/* Gift box */}
              <Animated.View
                style={[
                  dg.giftBox,
                  {
                    backgroundColor: "#10b981",
                    transform: [{ scale: boxScale }, { rotate: boxRotateDeg }],
                    opacity: boxOpacity,
                    shadowColor: "#10b981",
                  },
                ]}
              >
                {/* Ribbon */}
                <View style={dg.ribbon} />
                <View style={dg.ribbonH} />
                <Ionicons name="gift" size={52} color="#fff" />
              </Animated.View>
            </View>

            <Text style={[dg.availableTitle, { color: colors.foreground }]}>
              Sowgatyňyz garaşýar!
            </Text>
            <Text style={[dg.availableSub, { color: colors.mutedForeground }]}>
              Şu gün üçin sowgat almadyňyz.{"\n"}BP balansyňyza goşular.
            </Text>

            {/* Info chips */}
            <View style={dg.chipsRow}>
              <View style={[dg.chip, { backgroundColor: "#10b98115" }]}>
                <Ionicons name="time-outline" size={13} color="#10b981" />
                <Text style={[dg.chipText, { color: "#10b981" }]}>Her 24 sagat</Text>
              </View>
              <View style={[dg.chip, { backgroundColor: "#6366f115" }]}>
                <Ionicons name="wallet-outline" size={13} color="#6366f1" />
                <Text style={[dg.chipText, { color: "#6366f1" }]}>BP balansyna goşulýar</Text>
              </View>
            </View>

            <Pressable
              onPress={handleOpen}
              disabled={phase === "opening"}
              style={({ pressed }) => [
                dg.openBtn,
                {
                  backgroundColor: phase === "opening" ? "#10b98180" : "#10b981",
                  opacity: pressed ? 0.88 : 1,
                  shadowColor: "#10b981",
                },
              ]}
            >
              {phase === "opening" ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="gift-outline" size={20} color="#fff" />
                  <Text style={dg.openBtnText}>Sowgady Açmak</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {/* ── CLAIMED ── */}
        {phase === "claimed" && (
          <View style={dg.center}>
            {/* Confetti particles */}
            <View style={dg.confettiWrap} pointerEvents="none">
              {confetti.map((p, i) => (
                <Animated.View
                  key={i}
                  style={[
                    dg.confettiDot,
                    {
                      backgroundColor: CONFETTI_COLORS[i],
                      transform: [
                        { translateX: p.pos.x },
                        { translateY: p.pos.y },
                        { scale: p.scale },
                      ],
                      opacity: p.opacity,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Reward circle */}
            <Animated.View
              style={[
                dg.rewardWrap,
                {
                  transform: [{ scale: rewardScale }],
                  opacity: rewardOpacity,
                },
              ]}
            >
              <LinearGradient
                colors={isRare ? ["#7f1d1d", "#ef4444", "#fbbf24"] : ["#064e3b", "#059669", "#34d399"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={dg.rewardCircle}
              >
                {isRare && (
                  <View style={dg.rareBadge}>
                    <Ionicons name="star" size={10} color="#fff" />
                    <Text style={dg.rareBadgeText}>SEÝREK</Text>
                  </View>
                )}
                <Text style={dg.rewardAmount}>+{reward.toFixed(2)}</Text>
                <Text style={dg.rewardCurrency}>BP</Text>
              </LinearGradient>
            </Animated.View>

            <Animated.View style={{ opacity: rewardOpacity, alignItems: "center" }}>
              <Text style={[dg.claimedTitle, { color: colors.foreground }]}>
                {isRare ? "Ajaýyp! Seýrek sowgat!" : "Tebrikleýäris!"}
              </Text>
              <Text style={[dg.claimedSub, { color: colors.mutedForeground }]}>
                {reward.toFixed(2)} BP bonus balansyňyza goşuldy.{"\n"}
                Bu BP içerde ulanylyp bilner.
              </Text>

              {/* Bonus info */}
              <View style={[dg.bonusInfo, { backgroundColor: "#6366f110", borderColor: "#6366f130" }]}>
                <MaterialCommunityIcons name="information-outline" size={14} color="#6366f1" />
                <Text style={[dg.bonusInfoText, { color: "#6366f1" }]}>
                  Bonus BP diňe Ýeňil içinde ulanylyp bilner
                </Text>
              </View>
            </Animated.View>

            <Animated.View style={[{ width: "100%", opacity: rewardOpacity }]}>
              <Pressable
                onPress={handleClose}
                style={({ pressed }) => [
                  dg.openBtn,
                  { backgroundColor: isRare ? "#ef4444" : "#10b981", opacity: pressed ? 0.88 : 1 },
                ]}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={dg.openBtnText}>Ajaýyp, sag bol!</Text>
              </Pressable>
            </Animated.View>
          </View>
        )}

        {/* ── ALREADY CLAIMED ── */}
        {phase === "already_claimed" && (
          <View style={dg.center}>
            <View style={[dg.alreadyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Clock icon */}
              <View style={[dg.alreadyIconWrap, { backgroundColor: "#f59e0b18" }]}>
                <Ionicons name="time" size={42} color="#f59e0b" />
              </View>
              <Text style={[dg.alreadyTitle, { color: colors.foreground }]}>
                Şu günki sowgadyňyzy aldyňyz
              </Text>
              <Text style={[dg.alreadySub, { color: colors.mutedForeground }]}>
                Siz şu günki sowgadyňyzy aldyňyz.{"\n"}Ertir ýene geliň!
              </Text>

              {/* Next gift countdown visual */}
              <View style={[dg.countdownRow, { backgroundColor: "#f59e0b12" }]}>
                <Ionicons name="gift-outline" size={16} color="#f59e0b" />
                <Text style={[dg.countdownText, { color: "#f59e0b" }]}>
                  Indiki sowgat: ertir
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleClose}
              style={({ pressed }) => [dg.openBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1.5, opacity: pressed ? 0.8 : 1 }]}
            >
              <Ionicons name="arrow-back-outline" size={20} color={colors.foreground} />
              <Text style={[dg.openBtnText, { color: colors.foreground }]}>Yza dön</Text>
            </Pressable>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const dg = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingTop: 10, minHeight: 480,
  },
  handle: {
    width: 42, height: 4, borderRadius: 2,
    alignSelf: "center", marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row", alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 22, marginBottom: 4,
  },
  sheetTitle: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  sheetSub: { fontSize: 13, marginTop: 3 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },

  center: {
    alignItems: "center", paddingHorizontal: 22,
    paddingTop: 16, paddingBottom: 8,
  },

  // Loading
  loadingTxt: { marginTop: 14, fontSize: 14 },

  // Pulse rings + gift box
  pulseWrap: {
    width: 160, height: 160,
    alignItems: "center", justifyContent: "center",
    marginBottom: 22, position: "relative",
  },
  pulseRing: {
    position: "absolute",
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 1.5,
  },
  giftBox: {
    width: 96, height: 96, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
    shadowOpacity: 0.4, shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 }, elevation: 12,
    overflow: "hidden",
  },
  ribbon: {
    position: "absolute", top: 0, bottom: 0, width: 10,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  ribbonH: {
    position: "absolute", left: 0, right: 0, height: 10,
    backgroundColor: "rgba(255,255,255,0.3)",
    top: "40%",
  },

  availableTitle: { fontSize: 20, fontWeight: "800", letterSpacing: -0.3, marginBottom: 8 },
  availableSub: { fontSize: 13.5, textAlign: "center", lineHeight: 20, marginBottom: 18 },

  chipsRow: { flexDirection: "row", gap: 8, marginBottom: 24, flexWrap: "wrap", justifyContent: "center" },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 12, fontWeight: "700" },

  openBtn: {
    width: SW - 44, height: 54, borderRadius: 17,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, shadowOpacity: 0.28, shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  openBtnText: { color: "#fff", fontSize: 17, fontWeight: "800" },

  // Claimed
  confettiWrap: {
    position: "absolute", top: 60,
    alignItems: "center", justifyContent: "center",
    width: "100%", height: 200,
  },
  confettiDot: {
    position: "absolute",
    width: 10, height: 10, borderRadius: 5,
  },
  rewardWrap: { marginBottom: 20, marginTop: 8 },
  rewardCircle: {
    width: 150, height: 150, borderRadius: 75,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#10b981", shadowOpacity: 0.4,
    shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 14,
    position: "relative", overflow: "visible",
  },
  rareBadge: {
    position: "absolute", top: -8,
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#fbbf24", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  rareBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  rewardAmount: { color: "#fff", fontSize: 40, fontWeight: "900", letterSpacing: -1 },
  rewardCurrency: { color: "rgba(255,255,255,0.8)", fontSize: 18, fontWeight: "800", marginTop: -6 },

  claimedTitle: { fontSize: 22, fontWeight: "900", marginBottom: 8, textAlign: "center" },
  claimedSub: { fontSize: 13.5, textAlign: "center", lineHeight: 20, marginBottom: 14 },

  bonusInfo: {
    flexDirection: "row", alignItems: "center", gap: 7,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: 1, marginBottom: 22,
  },
  bonusInfoText: { fontSize: 12, fontWeight: "600", flex: 1, lineHeight: 17 },

  // Already claimed
  alreadyBox: {
    borderRadius: 24, padding: 26, borderWidth: 1,
    alignItems: "center", width: "100%", marginBottom: 20,
  },
  alreadyIconWrap: {
    width: 84, height: 84, borderRadius: 28,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  alreadyTitle: { fontSize: 18, fontWeight: "800", textAlign: "center", marginBottom: 8 },
  alreadySub: { fontSize: 13.5, textAlign: "center", lineHeight: 20, marginBottom: 16 },
  countdownRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10,
  },
  countdownText: { fontSize: 13, fontWeight: "700" },
});
