import React from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

const menuItems = [
  { icon: "apps-outline" as const, label: "Içerki ulgamlar", desc: "Aydym, Belet film, Belet music", href: "/ulgamlar", color: "#f59e0b" },
  { icon: "bulb-outline" as const, label: "Teklip ibermek", desc: "Öz hyzmatyňyzy teklip ediň", href: "/teklip", color: "#0d9488" },
  { icon: "storefront-outline" as const, label: "Sanly bazar", desc: "Akkauntlar we sanly harytlar", href: "/bazar", color: "#8b5cf6" },
  { icon: "help-circle-outline" as const, label: "Kömek / FAQ", desc: "Sorag-jogap we goldaw", href: "/help", color: "#0ea5e9" },
  { icon: "information-circle-outline" as const, label: "Hakynda", desc: "Kompaniýa barada maglumat", href: "/about", color: "#10b981" },
  { icon: "chatbubble-outline" as const, label: "SMS arkaly sargyt", desc: "Offline sargyt gollanmasy", href: "/sms", color: "#6366f1" },
];

export default function MoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: (isWeb ? 67 : insets.top) + 12, backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>Has köp</Text>
        <Text style={styles.headerSub}>Ähli hyzmatlar</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 34 : 100 }}
        showsVerticalScrollIndicator={false}
      >
        {menuItems.map((item, i) => (
          <Pressable
            key={i}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(item.href as Href);
            }}
            style={({ pressed }) => [styles.row, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
          >
            <View style={[styles.iconBg, { backgroundColor: item.color + "18" }]}>
              <Ionicons name={item.icon} size={24} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>{item.label}</Text>
              <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>{item.desc}</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={18} color={colors.mutedForeground} />
          </Pressable>
        ))}

        {/* Contact */}
        <View style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.contactTitle, { color: colors.foreground }]}>Biziň bilen habarlaşyň</Text>
          {["+993 71 789091", "+993 64 629487", "+993 71 788546"].map((p, i) => (
            <Text key={i} style={[styles.contactPhone, { color: colors.primary }]}>{p}</Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  iconBg: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  rowTitle: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  rowDesc: { fontSize: 12 },
  contactCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 8, gap: 4 },
  contactTitle: { fontWeight: "700", fontSize: 15, marginBottom: 8 },
  contactPhone: { fontSize: 16, fontWeight: "700" },
});
