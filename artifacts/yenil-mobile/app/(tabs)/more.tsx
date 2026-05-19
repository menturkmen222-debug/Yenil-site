import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, Platform, Alert,
} from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

const menuItems = [
  { icon: "book-outline" as const, label: "E-kitap & Gollanmalar", desc: "Okap öwren, gollanmalar we maslahatlar", href: "/ekitap", color: "#6366f1" },
  { icon: "location-outline" as const, label: "Ýer paýlaşma", desc: "Canlý ýer yzarlama we link paýlaşma", href: "/konum", color: "#4f46e5" },
  { icon: "apps-outline" as const, label: "Içerki ulgamlar", desc: "Aydym, Belet film, Belet music", href: "/ulgamlar", color: "#f59e0b" },
  { icon: "bulb-outline" as const, label: "Teklip ibermek", desc: "Öz hyzmatyňyzy teklip ediň", href: "/teklip", color: "#15803d" },
  { icon: "storefront-outline" as const, label: "Sanly bazar", desc: "Akkauntlar we sanly harytlar", href: "/bazar", color: "#8b5cf6" },
  { icon: "chatbubble-outline" as const, label: "SMS arkaly sargyt", desc: "Offline sargyt gollanmasy", href: "/sms", color: "#6366f1" },
];

const PLANS = [
  {
    id: "basic",
    name: "Esasy",
    price: "Mugt",
    period: "",
    color: "#6b7280",
    features: ["Demirýol bilet", "Bonus pul", "E-kitap (mugt)"],
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "19",
    period: "TMT/aý",
    color: "#6366f1",
    features: ["Ähli mugt hyzmatlar", "Premium E-kitaplar", "AI Kömekçi (beta)", "Çalt goldaw", "Reklamsyz"],
    popular: true,
  },
  {
    id: "business",
    name: "Işewür",
    price: "49",
    period: "TMT/aý",
    color: "#166534",
    features: ["Ähli Pro hyzmatlar", "Köp akkaunt", "API elýeterliligi", "Bagyşlanan goldaw", "Analitika"],
    popular: false,
  },
];

export default function MoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [selectedPlan, setSelectedPlan] = useState("basic");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: (isWeb ? 0 : insets.top) + 12, backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>Has köp</Text>
        <Text style={styles.headerSub}>Ähli hyzmatlar</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 34 : 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* MENU ITEMS */}
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

        {/* SUBSCRIPTION SECTION */}
        <View style={[styles.subHeader, { borderTopColor: colors.border }]}>
          <View style={[styles.subHeaderIcon, { backgroundColor: colors.primary + "20" }]}>
            <Ionicons name="diamond-outline" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.subHeaderTitle, { color: colors.foreground }]}>Obuna meýilnamasy</Text>
            <Text style={[styles.subHeaderDesc, { color: colors.mutedForeground }]}>Premium hyzmatlara elýeterlilik alyň</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingRight: 16 }}
          style={{ marginLeft: -16, paddingLeft: 16, marginBottom: 16 }}
        >
          {PLANS.map((plan) => (
            <Pressable
              key={plan.id}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedPlan(plan.id); }}
              style={[
                styles.planCard,
                {
                  backgroundColor: selectedPlan === plan.id ? plan.color : colors.card,
                  borderColor: selectedPlan === plan.id ? plan.color : colors.border,
                },
              ]}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Köp saýlanýar</Text>
                </View>
              )}
              <Text style={[styles.planName, { color: selectedPlan === plan.id ? "#fff" : colors.foreground }]}>
                {plan.name}
              </Text>
              <View style={styles.planPriceRow}>
                <Text style={[styles.planPrice, { color: selectedPlan === plan.id ? "#fff" : plan.color }]}>
                  {plan.price}
                </Text>
                {plan.period ? (
                  <Text style={[styles.planPeriod, { color: selectedPlan === plan.id ? "rgba(255,255,255,0.8)" : colors.mutedForeground }]}>
                    {" "}{plan.period}
                  </Text>
                ) : null}
              </View>
              {plan.features.map((f, fi) => (
                <View key={fi} style={styles.planFeature}>
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={selectedPlan === plan.id ? "rgba(255,255,255,0.9)" : colors.primary}
                  />
                  <Text style={[styles.planFeatureText, { color: selectedPlan === plan.id ? "rgba(255,255,255,0.9)" : colors.mutedForeground }]}>
                    {f}
                  </Text>
                </View>
              ))}
              <Pressable
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  if (plan.id === "basic") {
                    Alert.alert("Esasy meýilnama", "Siz häzir esasy meýilnamada. Mugt elýeterli!");
                  } else {
                    Alert.alert(
                      `${plan.name} obuna`,
                      `${plan.name} meýilnamasyna ${plan.price} ${plan.period} töleg bilen ýazylyşmak isleýärsiňizmi?`,
                      [
                        { text: "Ýok" },
                        { text: "Ýazylyş", onPress: () => Alert.alert("Üstünlikli!", "Operator bilen habarlaşylar!") },
                      ]
                    );
                  }
                }}
                style={[
                  styles.planBtn,
                  {
                    backgroundColor: selectedPlan === plan.id ? "rgba(255,255,255,0.25)" : plan.color + "20",
                  },
                ]}
              >
                <Text style={[styles.planBtnText, { color: selectedPlan === plan.id ? "#fff" : plan.color }]}>
                  {plan.id === "basic" ? "Häzirki" : "Saýla"}
                </Text>
              </Pressable>
            </Pressable>
          ))}
        </ScrollView>

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
  subHeader: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 16, marginTop: 8, borderTopWidth: 1 },
  subHeaderIcon: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  subHeaderTitle: { fontSize: 17, fontWeight: "700" },
  subHeaderDesc: { fontSize: 12, marginTop: 2 },
  planCard: { width: 190, borderRadius: 20, borderWidth: 2, padding: 16, gap: 8, position: "relative" },
  popularBadge: { position: "absolute", top: -10, right: 12, backgroundColor: "#f59e0b", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  popularBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  planName: { fontSize: 18, fontWeight: "800" },
  planPriceRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 4 },
  planPrice: { fontSize: 28, fontWeight: "800" },
  planPeriod: { fontSize: 12 },
  planFeature: { flexDirection: "row", alignItems: "center", gap: 6 },
  planFeatureText: { fontSize: 12 },
  planBtn: { borderRadius: 12, paddingVertical: 10, alignItems: "center", marginTop: 8 },
  planBtnText: { fontWeight: "700", fontSize: 14 },
  contactCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 8, gap: 4 },
  contactTitle: { fontWeight: "700", fontSize: 15, marginBottom: 8 },
  contactPhone: { fontSize: 16, fontWeight: "700" },
});
