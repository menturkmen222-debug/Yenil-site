import React from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";

export const METHODS = [
  {
    id: "e-bilim",
    title: "E-Bilim — Öwren we Gazan",
    desc: "AI, Frilanser, Kripto. Synag geç we BP gazan",
    icon: "book-outline" as const,
    badge: "0.05–0.3 BP",
    badgeColor: "#6366f1",
    gradient: ["#1e1b4b", "#6366f1"] as [string, string],
    earn: "0.3 BP/sapak",
    route: "/e-bilim",
    hot: true,
  },
  {
    id: "agent-topup",
    title: "Agent — TMCell Balans",
    desc: "100 TMT geçirseňiz, 115 BP (15% bonus) alýarsyňyz",
    icon: "phone-portrait-outline" as const,
    badge: "+15% bonus",
    badgeColor: "#10b981",
    gradient: ["#064e3b", "#059669"] as [string, string],
    earn: "115 BP",
    route: "/agent-topup",
    hot: true,
  },
  {
    id: "referal",
    title: "Ýeňil Referal",
    desc: "Dostlaryňyzy çagyrýarys, her biri üçin 0.5 BP + passiwli gazanç",
    icon: "people-outline" as const,
    badge: "0.5 BP + passiwli",
    badgeColor: "#6366f1",
    gradient: ["#312e81", "#6366f1"] as [string, string],
    earn: "∞ BP",
    route: "/referal",
    hot: false,
  },
  {
    id: "kuryer",
    title: "Ýol Kurýeri",
    desc: "Ýoluňyzda başgasynyň harydyny eltip beriň ýa-da tabşyryk ýerine ýetiriň",
    icon: "bicycle-outline" as const,
    badge: "50+ BP",
    badgeColor: "#d97706",
    gradient: ["#92400e", "#d97706"] as [string, string],
    earn: "50+ BP",
    route: "/kuryer",
    hot: false,
  },
  {
    id: "sanly-bazar-sell",
    title: "Sanly Bazar — Satyjy",
    desc: "VPN, PUBG UC, programma satyn we BP gazanyň",
    icon: "storefront-outline" as const,
    badge: "Öz bahanyz",
    badgeColor: "#db2777",
    gradient: ["#831843", "#db2777"] as [string, string],
    earn: "Baha siz belg.",
    route: "/sanly-bazar-sell",
    hot: false,
  },
];

export default function PulGazanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { balance } = useBonusPul();
  const isWeb = Platform.OS === "web";

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <LinearGradient
        colors={["#064e3b", "#059669"]}
        style={[s.header, { paddingTop: (isWeb ? 0 : insets.top) + 14 }]}
      >
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.headerTitle}>Pul/Abraý gazan</Text>
          <Text style={s.headerSub}>{METHODS.length} usul bilen BP we TMT gazanyň</Text>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ── Balance Hero ── */}
        <View style={[s.balanceHero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.balanceLeft}>
            <Text style={[s.balanceLabel, { color: colors.mutedForeground }]}>Häzirki balansynyz</Text>
            <Text style={[s.balanceNum, { color: "#059669" }]}>{balance.toFixed(2)} BP</Text>
            <Text style={[s.balanceSub, { color: colors.mutedForeground }]}>1 BP ≈ 1 TMT</Text>
          </View>
          <View style={s.balanceRight}>
            <View style={[s.balanceIconWrap, { backgroundColor: "#059669" + "18" }]}>
              <Ionicons name="wallet-outline" size={32} color="#059669" />
            </View>
            <Text style={[s.balanceTip, { color: colors.mutedForeground }]}>Işläň we ulanyň</Text>
          </View>
        </View>

        {/* ── Methods ── */}
        <Text style={[s.sectionTitle, { color: colors.mutedForeground }]}>GAZANMAK USULLARY</Text>

        {METHODS.map((m, i) => (
          <Pressable
            key={m.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push(m.route as any);
            }}
            style={({ pressed }) => [s.methodCard, { opacity: pressed ? 0.9 : 1 }]}
          >
            <LinearGradient colors={m.gradient} style={s.methodGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={s.methodIconCircle}>
                <Ionicons name={m.icon} size={26} color="#fff" />
              </View>
            </LinearGradient>

            <View style={[s.methodBody, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.methodTop}>
                <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
                  <Text style={[s.methodTitle, { color: colors.foreground }]} numberOfLines={2}>{m.title}</Text>
                  <Text style={[s.methodDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{m.desc}</Text>
                </View>
                <View style={s.methodRight}>
                  <View style={[s.earnBadge, { backgroundColor: m.badgeColor + "18", borderColor: m.badgeColor + "40" }]}>
                    <Text style={[s.earnText, { color: m.badgeColor }]}>{m.earn}</Text>
                  </View>
                  {m.hot && (
                    <View style={[s.hotChip, { marginTop: 4 }]}>
                      <Ionicons name="flame" size={9} color="#fff" />
                      <Text style={s.hotChipText}>HOT</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground + "80"} style={{ marginTop: 4 }} />
                </View>
              </View>
              <View style={[s.badgeRow]}>
                <View style={[s.methodBadge, { backgroundColor: m.badgeColor + "15" }]}>
                  <Text style={[s.methodBadgeText, { color: m.badgeColor }]}>{m.badge}</Text>
                </View>
                <Text style={[s.methodNum, { color: colors.mutedForeground }]}>#{i + 1}</Text>
              </View>
            </View>
          </Pressable>
        ))}

        {/* ── Info box ── */}
        <View style={[s.infoBox, { backgroundColor: "#059669" + "10", borderColor: "#059669" + "28" }]}>
          <Ionicons name="information-circle-outline" size={16} color="#059669" />
          <Text style={[s.infoText, { color: colors.foreground }]}>
            BP = Bonus Pul. 1 BP ≈ 1 TMT. TMCell hisobiga chiqarib olsa bo'ladi. Har bir amal abraý balingizni oshiradi.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 18,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.72)", fontSize: 12, marginTop: 2 },

  balanceHero: {
    marginHorizontal: 16, marginTop: 16, marginBottom: 4,
    borderRadius: 18, borderWidth: 1, padding: 18,
    flexDirection: "row", alignItems: "center",
    shadowColor: "#059669", shadowOpacity: 0.08, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  balanceLeft: { flex: 1 },
  balanceLabel: { fontSize: 12, fontWeight: "600", marginBottom: 4 },
  balanceNum: { fontSize: 32, fontWeight: "800" },
  balanceSub: { fontSize: 11, marginTop: 4 },
  balanceRight: { alignItems: "center", gap: 6 },
  balanceIconWrap: { width: 60, height: 60, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  balanceTip: { fontSize: 10, textAlign: "center" },

  sectionTitle: {
    fontSize: 11, fontWeight: "700", letterSpacing: 0.8,
    marginLeft: 20, marginTop: 22, marginBottom: 10,
  },

  methodCard: {
    flexDirection: "row", marginHorizontal: 16, marginBottom: 10,
    borderRadius: 18, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  methodGradient: {
    width: 68, alignItems: "center", justifyContent: "center",
  },
  methodIconCircle: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  methodBody: {
    flex: 1, padding: 14, borderTopWidth: 1, borderBottomWidth: 1, borderRightWidth: 1,
    borderTopRightRadius: 18, borderBottomRightRadius: 18,
  },
  methodTop: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  methodTitle: { fontSize: 14, fontWeight: "700" },
  methodDesc: { fontSize: 12, lineHeight: 17 },
  methodRight: { alignItems: "flex-end" },
  earnBadge: {
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1,
  },
  earnText: { fontSize: 11, fontWeight: "800" },
  badgeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  methodBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  methodBadgeText: { fontSize: 10, fontWeight: "700" },
  methodNum: { fontSize: 10 },

  hotChip: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#ef4444", borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  hotChipText: { color: "#fff", fontSize: 8, fontWeight: "800" },

  infoBox: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    marginHorizontal: 16, marginTop: 16, padding: 14,
    borderRadius: 14, borderWidth: 1,
  },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
