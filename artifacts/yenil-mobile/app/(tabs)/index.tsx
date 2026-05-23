import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";
import { getUserProfile, type UserProfile } from "@/lib/firebase";

// ─── Tiz geçiş kartalary ──────────────────────────────────────────────────────

type QuickAction = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  color: string;
  route: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  { icon: "car-outline",      label: "Gatnaw",    color: "#1B6B3A", route: "/gatnaw" },
  { icon: "bicycle-outline",  label: "Kuryer",    color: "#0369a1", route: "/kuryer" },
  { icon: "construct-outline",label: "Usta",      color: "#b45309", route: "/bazar" },
  { icon: "storefront-outline",label: "Bazar",    color: "#7c3aed", route: "/bazar" },
];

// ─── Esasy ekran ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { balanceBP, reputationPoints, deviceId } = useBonusPul();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!deviceId) return;
    getUserProfile(deviceId).then(setProfile).catch(() => {});
  }, [deviceId]);

  const greeting = profile?.name ? `Salam, ${profile.name}!` : "Salam!";
  const shortId = deviceId ? deviceId.slice(-6).toUpperCase() : "------";

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* ── Gradient sarlavha ─────────────────────────────────────── */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={[s.header, { paddingTop: (isWeb ? 0 : insets.top) + 14 }]}
      >
        <View style={s.headerRow}>
          <View>
            <Text style={s.headerGreeting}>{greeting}</Text>
            <Text style={s.headerTitle}>Ýeňil</Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/help" as never);
            }}
            style={s.notifBtn}
          >
            <Ionicons name="notifications-outline" size={22} color="#fff" />
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        {/* ── BP Balans kartasy ────────────────────────────────────── */}
        <LinearGradient
          colors={["#0d4222", "#1B6B3A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.balanceCard}
        >
          <View style={s.balanceCardTop}>
            <View>
              <Text style={s.balanceLabel}>BP Balansy</Text>
              <Text style={s.balanceAmount}>
                {balanceBP.toLocaleString("tk-TM", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
              <Text style={s.balanceCurrency}>Bonus Pul (BP)</Text>
            </View>
            <View style={s.balanceLogo}>
              <Ionicons name="leaf" size={28} color="rgba(255,255,255,0.9)" />
            </View>
          </View>

          <View style={s.balanceCardBottom}>
            <View style={s.repBadge}>
              <Ionicons name="star" size={12} color="#fbbf24" />
              <Text style={s.repText}>{reputationPoints} bal</Text>
            </View>
            <Text style={s.deviceIdText}>ID: {shortId}</Text>
          </View>

          {/* Bezeg çemberleri */}
          <View style={[s.circle, s.circleLeft]} />
          <View style={[s.circle, s.circleRight]} />
        </LinearGradient>

        {/* ── Tiz geçiş bölümi ─────────────────────────────────────── */}
        <Text style={[s.sectionLabel, { color: colors.foreground }]}>
          Tiz geçiş
        </Text>
        <View style={s.quickGrid}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.label}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(action.route as never);
              }}
              style={({ pressed }) => [
                s.quickCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.82 : 1,
                },
              ]}
            >
              <View
                style={[
                  s.quickIcon,
                  { backgroundColor: action.color + "18" },
                ]}
              >
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={[s.quickLabel, { color: colors.foreground }]}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Placeholder ──────────────────────────────────────────── */}
        <View
          style={[
            s.placeholder,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              s.placeholderIcon,
              { backgroundColor: colors.primary + "12" },
            ]}
          >
            <Ionicons
              name="rocket-outline"
              size={36}
              color={colors.primary}
            />
          </View>
          <Text style={[s.placeholderTitle, { color: colors.foreground }]}>
            Tiz orada hyzmatlar goşulýar
          </Text>
          <Text
            style={[s.placeholderDesc, { color: colors.mutedForeground }]}
          >
            Ýeňil platformasy dürli hyzmatlar bilen doldurylar.{"\n"}
            Täzelikleri yzarlaň!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Stiller ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerGreeting: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 2,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  content: {
    padding: 16,
    gap: 16,
  },

  balanceCard: {
    borderRadius: 20,
    padding: 22,
    overflow: "hidden",
    shadowColor: "#1B6B3A",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  balanceCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  balanceAmount: {
    color: "#fff",
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 44,
  },
  balanceCurrency: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  balanceLogo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  balanceCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  repBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  repText: {
    color: "#fbbf24",
    fontSize: 12,
    fontWeight: "700",
  },
  deviceIdText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
  },
  circle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  circleLeft: {
    width: 140,
    height: 140,
    bottom: -50,
    left: -30,
  },
  circleRight: {
    width: 100,
    height: 100,
    top: -30,
    right: 40,
  },

  sectionLabel: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2,
  },
  quickGrid: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  quickCard: {
    width: "47.5%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  quickIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },

  placeholder: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: "dashed",
    padding: 36,
    alignItems: "center",
    marginTop: 4,
  },
  placeholderIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  placeholderDesc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
});
