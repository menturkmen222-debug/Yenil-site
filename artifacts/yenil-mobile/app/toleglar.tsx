import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  Platform, StatusBar,
} from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { PAYMENT_CATEGORIES, type PaymentService, type PaymentCategory } from "@/config/paymentFeatures";

// ──────────────────────────────────────────────────────────────────
// STATUS BADGE
// ──────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: PaymentService["status"] }) {
  if (status === "active") return null;
  if (status === "coming_soon") {
    return (
      <View style={badgeStyles.soonWrap}>
        <Text style={badgeStyles.soonText}>Ýakynda</Text>
      </View>
    );
  }
  return (
    <View style={badgeStyles.offWrap}>
      <Text style={badgeStyles.offText}>Off</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  soonWrap: {
    position: "absolute", top: 6, right: 6,
    backgroundColor: "rgba(245,158,11,0.13)",
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: "rgba(245,158,11,0.28)",
  },
  soonText: { fontSize: 8, fontWeight: "800", color: "#d97706", letterSpacing: 0.4 },
  offWrap: {
    position: "absolute", top: 6, right: 6,
    backgroundColor: "rgba(100,116,139,0.1)",
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
  },
  offText: { fontSize: 8, fontWeight: "700", color: "#94a3b8" },
});

// ──────────────────────────────────────────────────────────────────
// SERVICE ITEM — glassmorphism card
// ──────────────────────────────────────────────────────────────────
function ServiceItem({ service }: { service: PaymentService }) {
  const colors = useColors();
  const isActive = service.status === "active";
  const isIOS = Platform.OS === "ios";

  const handlePress = () => {
    if (!isActive || !service.route) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(service.route as Href);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        svcStyles.item,
        {
          backgroundColor: isActive ? service.color + "10" : colors.muted,
          borderColor: isActive ? service.color + "2e" : colors.border,
          opacity: service.status === "disabled" ? 0.38 : pressed && isActive ? 0.78 : 1,
        },
      ]}
    >
      <StatusBadge status={service.status} />

      {/* Glassmorphism icon container */}
      <View
        style={[
          svcStyles.iconWrap,
          {
            backgroundColor: isActive ? service.color + "1e" : colors.border + "60",
            borderColor: isActive ? service.color + "28" : "transparent",
            borderWidth: 1,
          },
        ]}
      >
        <Ionicons
          name={service.icon as any}
          size={22}
          color={isActive ? service.color : "#94a3b8"}
        />
      </View>

      <Text
        style={[svcStyles.title, { color: isActive ? colors.foreground : colors.mutedForeground }]}
        numberOfLines={2}
      >
        {service.title}
      </Text>
      <Text style={[svcStyles.subtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
        {service.subtitle}
      </Text>

      {isActive && (
        <View style={[svcStyles.activeDot, { backgroundColor: service.color }]} />
      )}
    </Pressable>
  );
}

const svcStyles = StyleSheet.create({
  item: {
    flex: 1,
    minWidth: "30%",
    maxWidth: "32%",
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 11,
    paddingTop: 13,
    alignItems: "center",
    gap: 5,
    position: "relative",
    overflow: "hidden",
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    marginBottom: 2,
  },
  title: { fontSize: 11, fontWeight: "700", textAlign: "center", lineHeight: 14 },
  subtitle: { fontSize: 9.5, textAlign: "center", lineHeight: 13 },
  activeDot: {
    position: "absolute", bottom: 6, right: 6,
    width: 6, height: 6, borderRadius: 3,
  },
});

// ──────────────────────────────────────────────────────────────────
// CATEGORY BLOCK — glassmorphism container
// ──────────────────────────────────────────────────────────────────
function CategoryBlock({ category }: { category: PaymentCategory }) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(true);

  if (!category.enabled) return null;

  const activeCount = category.services.filter(s => s.status === "active").length;

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded(e => !e);
  };

  return (
    <View
      style={[
        catStyles.wrap,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: category.color,
        },
      ]}
    >
      {/* Subtle colour accent stripe */}
      <View style={[catStyles.accentStripe, { backgroundColor: category.color }]} />

      <Pressable onPress={toggle} style={catStyles.header}>
        <LinearGradient
          colors={[category.gradientStart, category.gradientEnd] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={catStyles.catIconWrap}
        >
          <Ionicons name={category.icon as any} size={17} color="#fff" />
        </LinearGradient>

        <View style={{ flex: 1 }}>
          <Text style={[catStyles.catTitle, { color: colors.foreground }]} numberOfLines={1}>
            {category.title}
          </Text>
          <View style={catStyles.catMeta}>
            <Text style={[catStyles.catCount, { color: colors.mutedForeground }]}>
              {category.services.length} hyzmat
            </Text>
            {activeCount > 0 && (
              <View style={[catStyles.activeBadge, { backgroundColor: category.color + "16" }]}>
                <View style={[catStyles.activeDotSmall, { backgroundColor: category.color }]} />
                <Text style={[catStyles.activeText, { color: category.color }]}>
                  {activeCount} işleýär
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={[catStyles.chevronWrap, { backgroundColor: category.color + "12" }]}>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={14}
            color={category.color}
          />
        </View>
      </Pressable>

      {expanded && (
        <View style={[catStyles.servicesWrap, { borderTopColor: colors.border }]}>
          <View style={catStyles.servicesRow}>
            {category.services.map(service => (
              <ServiceItem key={service.id} service={service} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const catStyles = StyleSheet.create({
  wrap: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 11,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  accentStripe: {
    position: "absolute",
    top: 0, left: 0,
    width: 3, height: "100%",
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  header: {
    flexDirection: "row", alignItems: "center",
    gap: 12, padding: 15, paddingLeft: 18,
  },
  catIconWrap: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  catTitle: { fontSize: 13.5, fontWeight: "800", letterSpacing: -0.2 },
  catMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 3 },
  catCount: { fontSize: 11 },
  activeBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10,
  },
  activeDotSmall: { width: 5, height: 5, borderRadius: 3 },
  activeText: { fontSize: 10, fontWeight: "700" },
  chevronWrap: {
    width: 27, height: 27, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
  },
  servicesWrap: {
    paddingHorizontal: 12, paddingBottom: 13,
    borderTopWidth: 1,
    paddingTop: 11,
  },
  servicesRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
});

// ──────────────────────────────────────────────────────────────────
// GLASS STAT CARD — used in hero
// ──────────────────────────────────────────────────────────────────
function GlassStatCard({ num, label }: { num: string; label: string }) {
  return (
    <View style={glassCardStyles.wrap}>
      <Text style={glassCardStyles.num}>{num}</Text>
      <Text style={glassCardStyles.label}>{label}</Text>
    </View>
  );
}

const glassCardStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.13)",
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  num: { color: "#fff", fontSize: 21, fontWeight: "900", letterSpacing: -0.5 },
  label: { color: "rgba(255,255,255,0.72)", fontSize: 10, fontWeight: "600", marginTop: 2 },
});

// ──────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ──────────────────────────────────────────────────────────────────
export default function ToleglarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  const topPad = isWeb ? 0 : insets.top;

  const totalServices = PAYMENT_CATEGORIES.reduce((s, c) => s + c.services.length, 0);
  const activeServices = PAYMENT_CATEGORIES.reduce(
    (s, c) => s + c.services.filter(sv => sv.status === "active").length, 0
  );
  const categoryCount = PAYMENT_CATEGORIES.filter(c => c.enabled).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {isIOS && <StatusBar barStyle="light-content" />}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 44 + insets.bottom }}
      >
        {/* ── HERO (Purple/Violet gradient) ── */}
        <LinearGradient
          colors={["#4c1d95", "#7c3aed", "#a855f7"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[heroStyles.hero, { paddingTop: topPad + 16 }]}
        >
          {/* Decorative circles */}
          <View style={heroStyles.circle1} />
          <View style={heroStyles.circle2} />
          <View style={heroStyles.circle3} />

          {/* Back button */}
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
            style={heroStyles.backBtn}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>

          {/* Title */}
          <Text style={heroStyles.title}>Tölegler we{"\n"}Hyzmatlar</Text>
          <Text style={heroStyles.subtitle}>
            Kommunal, döwlet we sanly tölegler — hemmesi bir ýerde, çalt we ygtybarly
          </Text>

          {/* Stats row */}
          <View style={heroStyles.statsRow}>
            <GlassStatCard num={String(categoryCount)} label="Kategoriýa" />
            <GlassStatCard num={String(totalServices)} label="Hyzmat" />
            <GlassStatCard num={String(activeServices)} label="Işleýär" />
          </View>

        </LinearGradient>

        {/* ── CATEGORIES ── */}
        <View style={{ paddingHorizontal: 14, paddingTop: 14 }}>
          {PAYMENT_CATEGORIES.map(cat => (
            <CategoryBlock key={cat.id} category={cat} />
          ))}
        </View>

        {/* ── BOTTOM CTA ── */}
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/teklip" as Href); }}
          style={({ pressed }) => [
            ctaStyles.wrap,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <LinearGradient
            colors={["#4c1d95", "#7c3aed"]}
            style={ctaStyles.icon}
          >
            <Ionicons name="card-outline" size={22} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={[ctaStyles.title, { color: colors.foreground }]}>
              Hyzmat goşmak isleýärsiňizmi?
            </Text>
            <Text style={[ctaStyles.sub, { color: colors.mutedForeground }]}>
              Töleg ulgamyna täze hyzmat teklip ediň
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color="#7c3aed" />
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ── STYLES ──────────────────────────────────────────────────────────

const heroStyles = StyleSheet.create({
  hero: {
    paddingHorizontal: 18,
    paddingBottom: 26,
    overflow: "hidden",
  },
  circle1: {
    position: "absolute",
    top: -60, right: -50,
    width: 200, height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  circle2: {
    position: "absolute",
    top: 30, right: -80,
    width: 260, height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  circle3: {
    position: "absolute",
    bottom: -40, left: -30,
    width: 140, height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  tag: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.13)",
    alignSelf: "flex-start",
    borderRadius: 50, paddingHorizontal: 12, paddingVertical: 5,
    marginBottom: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  tagText: { color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: "600" },
  title: {
    color: "#fff", fontSize: 32, fontWeight: "900",
    letterSpacing: -0.8, marginBottom: 9,
    lineHeight: 38,
  },
  subtitle: {
    color: "rgba(255,255,255,0.76)", fontSize: 13,
    lineHeight: 19, marginBottom: 22,
  },
  statsRow: { flexDirection: "row", gap: 9, marginBottom: 14 },
  pillsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 50, paddingHorizontal: 11, paddingVertical: 5,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
  },
  pillText: { color: "rgba(255,255,255,0.88)", fontSize: 11, fontWeight: "600" },
});

const legendStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row", alignItems: "center", gap: 16,
    paddingHorizontal: 16, paddingVertical: 11,
    borderBottomWidth: 1,
  },
  item: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  text: { fontSize: 12, fontWeight: "600" },
  total: { fontSize: 11 },
});

const ctaStyles = StyleSheet.create({
  wrap: {
    marginHorizontal: 14, marginTop: 4,
    borderRadius: 18, borderWidth: 1,
    padding: 16, flexDirection: "row",
    alignItems: "center", gap: 14,
  },
  icon: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 14, fontWeight: "700", marginBottom: 3 },
  sub: { fontSize: 12, lineHeight: 17 },
});
