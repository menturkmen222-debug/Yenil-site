import React from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, Platform,
} from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";

function ServiceCard({ icon, title, desc, onPress, color }: {
  icon: React.ReactNode; title: string; desc: string; onPress: () => void; color: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.serviceCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={[styles.serviceIconBg, { backgroundColor: color + "20" }]}>
        {icon}
      </View>
      <Text style={[styles.serviceTitle, { color: colors.primary }]}>{title}</Text>
      <Text style={[styles.serviceDesc, { color: colors.mutedForeground }]}>{desc}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { balance } = useBonusPul();
  const isWeb = Platform.OS === "web";

  const nav = (path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as Href);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* HERO */}
      <View style={[styles.hero, { backgroundColor: colors.primary, paddingTop: (isWeb ? 0 : insets.top) + 24 }]}>
        <Text style={styles.heroTitle}>Ýeňil</Text>
        <Text style={styles.heroSub}>Türkmenistanda iň ynamly onlayn hyzmatlar</Text>
        <View style={styles.balanceBadge}>
          <Ionicons name="wallet-outline" size={16} color="#fff" />
          <Text style={styles.balanceText}>{balance.toFixed(2)} BP</Text>
        </View>

        {/* AI ROW — balansyň aşagynda */}
        <View style={styles.aiRow}>
          {/* Ýeňil AI Agent */}
          <Pressable
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
            style={({ pressed }) => [styles.aiCard, { opacity: pressed ? 0.82 : 1 }]}
          >
            <View style={[styles.aiIconWrap, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
              <MaterialCommunityIcons name="robot-outline" size={20} color="#fff" />
              <View style={[styles.aiBadge, { backgroundColor: "#ef4444" }]}>
                <Text style={styles.aiBadgeText}>Ýakyn</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiTitle}>Ýeňil AI Agent</Text>
              <Text style={styles.aiDesc} numberOfLines={1}>Intellektual kömekçi</Text>
            </View>
            <View style={styles.aiDot} />
          </Pressable>

          {/* AI Kömekçi */}
          <Pressable
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
            style={({ pressed }) => [styles.aiCard, { opacity: pressed ? 0.82 : 1, backgroundColor: "rgba(255,255,255,0.1)" }]}
          >
            <View style={[styles.aiIconWrap, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
              <View style={[styles.aiBadge, { backgroundColor: "#f59e0b" }]}>
                <Text style={styles.aiBadgeText}>Beta</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiTitle}>AI Kömekçi</Text>
              <Text style={styles.aiDesc} numberOfLines={1}>Çalt kömek & jogap</Text>
            </View>
            <Ionicons name="flash-outline" size={13} color="rgba(255,255,255,0.65)" />
          </Pressable>
        </View>
      </View>

      {/* SERVICES */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Hyzmatlar</Text>
      <View style={styles.servicesGrid}>
        <ServiceCard
          icon={<Ionicons name="train-outline" size={28} color={colors.primary} />}
          title="Demirýol"
          desc="Kart tölegsiz bilet"
          onPress={() => nav("/(demiryol)")}
          color={colors.primary}
        />
        <ServiceCard
          icon={<MaterialCommunityIcons name="currency-usd" size={28} color="#0ea5e9" />}
          title="Ýeňil Pay"
          desc="Walýuta çalyşmak"
          onPress={() => nav("/tmcell")}
          color="#0ea5e9"
        />
        <ServiceCard
          icon={<Ionicons name="phone-portrait-outline" size={28} color="#8b5cf6" />}
          title="TMCell"
          desc="Bonus pul & SIM"
          onPress={() => nav("/tmcell")}
          color="#8b5cf6"
        />
        <ServiceCard
          icon={<Ionicons name="apps-outline" size={28} color="#f59e0b" />}
          title="Ulgamlar"
          desc="Aydym, Belet we ş.m."
          onPress={() => nav("/ulgamlar")}
          color="#f59e0b"
        />
      </View>

      {/* E-KITAP BANNER */}
      <Pressable
        onPress={() => nav("/ekitap")}
        style={({ pressed }) => [styles.banner, { opacity: pressed ? 0.9 : 1, backgroundColor: "#6366f1" }]}
      >
        <View style={[styles.bannerIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
          <Ionicons name="book-outline" size={26} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>E-kitap & Gollanmalar</Text>
          <Text style={styles.bannerDesc}>Okap öwren • 6 kitap elýeterli</Text>
        </View>
        <Feather name="arrow-right" size={20} color="#fff" />
      </Pressable>

      {/* SANLY BAZAR BANNER */}
      <Pressable
        onPress={() => nav("/bazar")}
        style={({ pressed }) => [styles.banner, { opacity: pressed ? 0.9 : 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
      >
        <View style={[styles.bannerIcon, { backgroundColor: colors.primary + "20" }]}>
          <Ionicons name="storefront-outline" size={26} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.bannerTitle, { color: colors.foreground }]}>Sanly bazar</Text>
          <Text style={[styles.bannerDesc, { color: colors.mutedForeground }]}>Akkauntlar we sanly harytlar</Text>
        </View>
        <Feather name="arrow-right" size={20} color={colors.primary} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    paddingHorizontal: 20, paddingBottom: 20,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  heroTitle: { fontSize: 36, fontWeight: "800", color: "#fff", marginBottom: 6 },
  heroSub: { fontSize: 14, color: "rgba(255,255,255,0.85)", marginBottom: 14 },
  balanceBadge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 14,
    paddingVertical: 8, borderRadius: 50, alignSelf: "flex-start",
    marginBottom: 14,
  },
  balanceText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  aiRow: { flexDirection: "row", gap: 10 },
  aiCard: {
    flex: 1, borderRadius: 14, padding: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  aiIconWrap: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  aiBadge: {
    position: "absolute", top: -5, right: -7,
    borderRadius: 5, paddingHorizontal: 4, paddingVertical: 1,
  },
  aiBadgeText: { color: "#fff", fontSize: 7, fontWeight: "800" },
  aiTitle: { color: "#fff", fontSize: 12, fontWeight: "700" },
  aiDesc: { color: "rgba(255,255,255,0.7)", fontSize: 10, marginTop: 1 },
  aiDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#fbbf24" },
  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingVertical: 16 },
  statCard: {
    flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 14,
    borderWidth: 1,
  },
  statNum: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11, marginTop: 2 },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginLeft: 16, marginTop: 8, marginBottom: 12 },
  servicesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16, marginBottom: 16 },
  serviceCard: { width: "47%", borderRadius: 16, padding: 16, borderWidth: 1, gap: 8 },
  serviceIconBg: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  serviceTitle: { fontSize: 14, fontWeight: "700" },
  serviceDesc: { fontSize: 12 },
  banner: {
    marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 14,
  },
  bannerIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  bannerTitle: { color: "#fff", fontWeight: "700", fontSize: 15 },
  bannerDesc: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 },
  reviewCard: {
    width: 220, marginRight: 12, borderRadius: 14, padding: 14, borderWidth: 1,
    marginBottom: 16,
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  reviewAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  reviewAvatarText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  reviewAuthor: { fontWeight: "700", fontSize: 13 },
  reviewText: { fontSize: 12, lineHeight: 18 },
  socialRow: { flexDirection: "row", gap: 12, paddingHorizontal: 16, marginTop: 8, justifyContent: "center" },
  socialBtn: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
});
