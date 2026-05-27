import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, Linking, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { db, ref, get } from "@/lib/firebase";

const values = [
  { icon: "shield-checkmark-outline" as const, title: "Ynamly", desc: "Her sargyt howpsuz we kepillendirilen" },
  { icon: "flash-outline" as const, title: "Çalt", desc: "Iň tiz wagtda hyzmat edilýär" },
  { icon: "people-outline" as const, title: "Goldaw", desc: "7/24 müşderi goldawy" },
  { icon: "star-outline" as const, title: "Hilli", desc: "Premium hyzmat, arzan baha" },
];

export default function AboutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const [userCount, setUserCount] = useState<string>("...");
  const [orderCount, setOrderCount] = useState<string>("...");

  useEffect(() => {
    get(ref(db, "user-balances")).then((snap) => {
      if (snap.exists()) {
        const count = Object.keys(snap.val()).length;
        setUserCount(count >= 1000 ? `${(count / 1000).toFixed(1)}k+` : `${count}+`);
      } else {
        setUserCount("0");
      }
    }).catch(() => setUserCount("500+"));

    get(ref(db, "orders")).then((snap) => {
      if (snap.exists()) {
        const count = Object.keys(snap.val()).length;
        setOrderCount(count >= 1000 ? `${(count / 1000).toFixed(1)}k+` : `${count}+`);
      } else {
        setOrderCount("0");
      }
    }).catch(() => setOrderCount("1200+"));
  }, []);

  const stats: [string, string][] = [
    [userCount, "Müşderi"],
    [orderCount, "Tamamlanan sargyt"],
    ["98%", "Kanagatlanma"],
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={[styles.header, { paddingTop: (isWeb ? 0 : insets.top) + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Ýeňil hakynda</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 110 : 110 }} showsVerticalScrollIndicator={false}>
        {/* About card */}
        <View style={[styles.aboutCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.aboutTitle}>Ýeňil</Text>
          <Text style={styles.aboutSubtitle}>Türkmenistanda onlayn hyzmatlar platformasy</Text>
          <Text style={styles.aboutDesc}>
            Biz 2022-nji ýyldan bäri Türkmenistanyň raýatlaryna demirýol biletleri, walýuta çalşygy, TMCell hyzmatlary we sanly hyzmatlar bilen hyzmat edýäris.
          </Text>
        </View>

        {/* Values */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Biziň gymmatlyklary</Text>
        <View style={styles.valuesGrid}>
          {values.map((v, i) => (
            <View key={i} style={[styles.valueCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.valueIcon, { backgroundColor: colors.primary + "15" }]}>
                <Ionicons name={v.icon} size={24} color={colors.primary} />
              </View>
              <Text style={[styles.valueTitle, { color: colors.foreground }]}>{v.title}</Text>
              <Text style={[styles.valueDesc, { color: colors.mutedForeground }]}>{v.desc}</Text>
            </View>
          ))}
        </View>

        {/* Stats */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sanlar</Text>
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {stats.map(([num, label], i) => (
            <View key={i} style={[styles.stat, i < 2 && { borderRightWidth: 1, borderRightColor: colors.border }]}>
              <Text style={[styles.statNum, { color: colors.primary }]}>{num}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Contact */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Habarlaşmak</Text>
        <View style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {["+993 71 789091", "+993 64 629487", "+993 71 788546"].map((p, i) => (
            <Pressable key={i} onPress={() => Linking.openURL(`tel:${p.replace(/\s/g, "")}`)}>
              <Text style={[styles.phone, { color: colors.primary }]}>{p}</Text>
            </Pressable>
          ))}
        </View>

        {/* Social */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Biziň sahypalarymyz</Text>
        <View style={styles.socialRow}>
          {[
            { icon: "logo-instagram" as const, label: "Instagram", url: "https://www.instagram.com/yenil_tm", color: "#e1306c" },
            { icon: "paper-plane-outline" as const, label: "Telegram", url: "http://t.me/yenil_tm", color: "#0088cc" },
            { icon: "logo-tiktok" as const, label: "TikTok", url: "http://tiktok.com/@yenil_", color: "#000" },
          ].map((s, i) => (
            <Pressable key={i} onPress={() => Linking.openURL(s.url)}
              style={({ pressed }) => [styles.socialBtn, { backgroundColor: s.color, opacity: pressed ? 0.8 : 1 }]}>
              <Ionicons name={s.icon} size={22} color="#fff" />
              <Text style={styles.socialLabel}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  aboutCard: { borderRadius: 20, padding: 24, marginBottom: 24, gap: 8 },
  aboutTitle: { color: "#fff", fontSize: 32, fontWeight: "900" },
  aboutSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 14 },
  aboutDesc: { color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 22, marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 12 },
  valuesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  valueCard: { width: "47%", borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  valueIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  valueTitle: { fontSize: 15, fontWeight: "700" },
  valueDesc: { fontSize: 12 },
  statsCard: { flexDirection: "row", borderRadius: 14, borderWidth: 1, marginBottom: 24, overflow: "hidden" },
  stat: { flex: 1, alignItems: "center", paddingVertical: 16 },
  statNum: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11, marginTop: 2 },
  contactCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10, marginBottom: 24 },
  phone: { fontSize: 18, fontWeight: "700" },
  socialRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  socialBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 14 },
  socialLabel: { color: "#fff", fontWeight: "700", fontSize: 12 },
});
