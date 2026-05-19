import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, Linking,
  Platform, useColorScheme,
} from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";

const reviews = [
  { author: "Amangül", text: "Bilet almak aňsat eken, 2 sagadyň içinde bilet alyp berdiler!" },
  { author: "Didar", text: "Ýeňil sag bol, indi otran ýerimden hem kösenmän bilet alýan." },
  { author: "Jeren", text: "Ynamymy ödediler, 4 sagadyň içinde SMS iberildi." },
  { author: "Gözel", text: "Örän gowy hyzmat, gyssagly ýagdaýda hem kömek etdiler." },
  { author: "Myrat", text: "Ýeňil bilen her zat ýeňil bolýar, maslahat berýärin!" },
];

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
  const colorScheme = useColorScheme();
  const isWeb = Platform.OS === "web";

  const [nums, setNums] = useState({ users: 0, orders: 0, rating: 0 });

  useEffect(() => {
    const targets = { users: 500, orders: 1200, rating: 98 };
    const dur = 1500;
    const start = Date.now();
    const timer = setInterval(() => {
      const progress = Math.min((Date.now() - start) / dur, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setNums({
        users: Math.round(targets.users * ease),
        orders: Math.round(targets.orders * ease),
        rating: Math.round(targets.rating * ease),
      });
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, []);

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
      <View style={[styles.hero, { backgroundColor: colors.primary, paddingTop: (isWeb ? 67 : insets.top) + 24 }]}>
        <Text style={styles.heroTitle}>Ýeňil</Text>
        <Text style={styles.heroSub}>Türkmenistanda iň ynamly onlayn hyzmatlar</Text>
        <View style={styles.balanceBadge}>
          <Ionicons name="wallet-outline" size={16} color="#fff" />
          <Text style={styles.balanceText}>{balance.toFixed(2)} BP</Text>
        </View>
      </View>

      {/* STATS */}
      <View style={styles.statsRow}>
        {[
          { num: `${nums.users}+`, label: "Müşderi" },
          { num: `${nums.orders}+`, label: "Sargyt" },
          { num: `${nums.rating}%`, label: "Kanagatlanma" },
        ].map((s, i) => (
          <View key={i} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: colors.primary }]}>{s.num}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* SERVICES */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Hyzmatlar</Text>
      <View style={styles.servicesGrid}>
        <ServiceCard
          icon={<Ionicons name="train-outline" size={28} color={colors.primary} />}
          title="Demirýol"
          desc="Kart tölegsiz bilet"
          onPress={() => nav("/demiryol")}
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

      {/* TEKLIP BANNER */}
      <Pressable
        onPress={() => nav("/teklip")}
        style={({ pressed }) => [styles.banner, { opacity: pressed ? 0.9 : 1, backgroundColor: colors.primary }]}
      >
        <Ionicons name="bulb-outline" size={28} color="#fff" />
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Öz hyzmatyňyzy teklip ediň</Text>
          <Text style={styles.bannerDesc}>Teklipleriňize garaşýarys!</Text>
        </View>
        <Feather name="arrow-right" size={20} color="#fff" />
      </Pressable>

      {/* BAZAR BANNER */}
      <Pressable
        onPress={() => nav("/bazar")}
        style={({ pressed }) => [styles.banner, { opacity: pressed ? 0.9 : 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
      >
        <Ionicons name="storefront-outline" size={28} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.bannerTitle, { color: colors.foreground }]}>Sanly bazar</Text>
          <Text style={[styles.bannerDesc, { color: colors.mutedForeground }]}>Akkauntlar we sanly harytlar</Text>
        </View>
        <Feather name="arrow-right" size={20} color={colors.primary} />
      </Pressable>

      {/* REVIEWS */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        <Ionicons name="star" size={16} color="#f59e0b" /> Müşderilerimiziň pikirleri
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16 }}>
        {reviews.map((r, i) => (
          <View key={i} style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.reviewHeader}>
              <View style={[styles.reviewAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.reviewAvatarText}>{r.author[0]}</Text>
              </View>
              <View>
                <Text style={[styles.reviewAuthor, { color: colors.primary }]}>{r.author}</Text>
                <Text style={{ color: "#f59e0b", fontSize: 11 }}>★★★★★</Text>
              </View>
            </View>
            <Text style={[styles.reviewText, { color: colors.mutedForeground }]}>{r.text}</Text>
          </View>
        ))}
      </ScrollView>

      {/* SOCIAL */}
      <View style={styles.socialRow}>
        {[
          { icon: "logo-instagram" as const, color: "#e1306c", url: "https://www.instagram.com/yenil_tm" },
          { icon: "paper-plane-outline" as const, color: "#0088cc", url: "http://t.me/yenil_tm" },
        ].map((s, i) => (
          <Pressable key={i} onPress={() => Linking.openURL(s.url)}
            style={[styles.socialBtn, { backgroundColor: s.color }]}>
            <Ionicons name={s.icon} size={22} color="#fff" />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    paddingHorizontal: 20, paddingBottom: 32,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  heroTitle: { fontSize: 36, fontWeight: "800", color: "#fff", marginBottom: 6 },
  heroSub: { fontSize: 14, color: "rgba(255,255,255,0.85)", marginBottom: 16 },
  balanceBadge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 14,
    paddingVertical: 8, borderRadius: 50, alignSelf: "flex-start",
  },
  balanceText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingVertical: 16 },
  statCard: {
    flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 14,
    borderWidth: 1,
  },
  statNum: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11, marginTop: 2 },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginLeft: 16, marginTop: 8, marginBottom: 12 },
  servicesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16, marginBottom: 16 },
  serviceCard: {
    width: "47%", borderRadius: 16, padding: 16, borderWidth: 1, gap: 8,
  },
  serviceIconBg: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  serviceTitle: { fontSize: 14, fontWeight: "700" },
  serviceDesc: { fontSize: 12 },
  banner: {
    marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 18,
    flexDirection: "row", alignItems: "center", gap: 14,
  },
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
