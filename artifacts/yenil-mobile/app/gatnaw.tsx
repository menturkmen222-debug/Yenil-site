import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  Platform, StatusBar, Animated,
} from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { TRANSPORT_CATEGORIES, type TransportService, type TransportCategory } from "@/config/transportFeatures";

// ──────────────────────────────────────────────────────────────────
// STATUS BADGE
// ──────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: TransportService["status"] }) {
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
    position: "absolute", top: 7, right: 7,
    backgroundColor: "rgba(245,158,11,0.15)",
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: "rgba(245,158,11,0.3)",
  },
  soonText: { fontSize: 8, fontWeight: "800", color: "#d97706", letterSpacing: 0.4 },
  offWrap: {
    position: "absolute", top: 7, right: 7,
    backgroundColor: "rgba(100,116,139,0.1)",
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
  },
  offText: { fontSize: 8, fontWeight: "700", color: "#94a3b8" },
});

// ──────────────────────────────────────────────────────────────────
// SERVICE ITEM
// ──────────────────────────────────────────────────────────────────
function ServiceItem({ service }: { service: TransportService }) {
  const colors = useColors();
  const isActive = service.status === "active";

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
          backgroundColor: isActive
            ? (service.color + "0f")
            : colors.muted,
          borderColor: isActive
            ? (service.color + "30")
            : colors.border,
          opacity: service.status === "disabled"
            ? 0.4
            : pressed && isActive ? 0.82 : 1,
        },
      ]}
    >
      <StatusBadge status={service.status} />

      {/* Icon */}
      <View style={[
        svcStyles.iconWrap,
        {
          backgroundColor: isActive
            ? (service.color + "20")
            : colors.border + "50",
        },
      ]}>
        <Ionicons
          name={service.icon as any}
          size={22}
          color={isActive ? service.color : "#94a3b8"}
        />
      </View>

      {/* Text */}
      <Text
        style={[
          svcStyles.title,
          { color: isActive ? colors.foreground : colors.mutedForeground },
        ]}
        numberOfLines={2}
      >
        {service.title}
      </Text>
      <Text
        style={[svcStyles.subtitle, { color: colors.mutedForeground }]}
        numberOfLines={1}
      >
        {service.subtitle}
      </Text>

      {/* Active indicator */}
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
    padding: 12,
    paddingTop: 14,
    paddingBottom: 12,
    alignItems: "center",
    gap: 6,
    position: "relative",
    overflow: "hidden",
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    marginBottom: 2,
  },
  title: {
    fontSize: 11, fontWeight: "700",
    textAlign: "center", lineHeight: 14,
  },
  subtitle: {
    fontSize: 9.5, textAlign: "center", lineHeight: 13,
  },
  activeDot: {
    position: "absolute", bottom: 6, right: 6,
    width: 6, height: 6, borderRadius: 3,
  },
});

// ──────────────────────────────────────────────────────────────────
// CATEGORY BLOCK
// ──────────────────────────────────────────────────────────────────
function CategoryBlock({
  category,
  index,
}: {
  category: TransportCategory;
  index: number;
}) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(true);

  if (!category.enabled) return null;

  const activeCount = category.services.filter(s => s.status === "active").length;

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded(e => !e);
  };

  return (
    <View style={[catStyles.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
      <Pressable onPress={toggle} style={catStyles.header}>
        {/* Icon */}
        <LinearGradient
          colors={[category.gradientStart, category.gradientEnd] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={catStyles.catIconWrap}
        >
          <Ionicons name={category.icon as any} size={18} color="#fff" />
        </LinearGradient>

        {/* Title */}
        <View style={{ flex: 1 }}>
          <Text style={[catStyles.catTitle, { color: colors.foreground }]} numberOfLines={1}>
            {category.title}
          </Text>
          <View style={catStyles.catMeta}>
            <Text style={[catStyles.catCount, { color: colors.mutedForeground }]}>
              {category.services.length} hyzmat
            </Text>
            {activeCount > 0 && (
              <View style={[catStyles.activeBadge, { backgroundColor: category.color + "18" }]}>
                <View style={[catStyles.activeDotSmall, { backgroundColor: category.color }]} />
                <Text style={[catStyles.activeText, { color: category.color }]}>
                  {activeCount} işleýär
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Chevron */}
        <View style={[catStyles.chevronWrap, { backgroundColor: category.color + "12" }]}>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={14}
            color={category.color}
          />
        </View>
      </Pressable>

      {/* Services grid */}
      {expanded && (
        <View style={catStyles.servicesWrap}>
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
    borderRadius: 20, borderWidth: 1,
    marginBottom: 12, overflow: "hidden",
  },
  header: {
    flexDirection: "row", alignItems: "center",
    gap: 12, padding: 16,
  },
  catIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  catTitle: {
    fontSize: 14, fontWeight: "800", letterSpacing: -0.2,
  },
  catMeta: {
    flexDirection: "row", alignItems: "center",
    gap: 8, marginTop: 3,
  },
  catCount: { fontSize: 11 },
  activeBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10,
  },
  activeDotSmall: { width: 5, height: 5, borderRadius: 3 },
  activeText: { fontSize: 10, fontWeight: "700" },
  chevronWrap: {
    width: 28, height: 28, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
  },
  servicesWrap: {
    paddingHorizontal: 12, paddingBottom: 14,
    borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.04)",
    paddingTop: 12,
  },
  servicesRow: {
    flexDirection: "row", flexWrap: "wrap", gap: 8,
  },
});

// ──────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ──────────────────────────────────────────────────────────────────
export default function GatnawScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  const topPad = (isWeb ? 0 : insets.top);

  const totalServices = TRANSPORT_CATEGORIES.reduce((s, c) => s + c.services.length, 0);
  const activeServices = TRANSPORT_CATEGORIES.reduce(
    (s, c) => s + c.services.filter(sv => sv.status === "active").length, 0
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {isIOS && <StatusBar barStyle="light-content" />}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
      >
        {/* ── HERO ── */}
        <LinearGradient
          colors={[colors.headerGradientStart, colors.headerGradientEnd] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[heroStyles.hero, { paddingTop: topPad + 16 }]}
        >
          {/* Back button */}
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
            style={heroStyles.backBtn}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>

          {/* Tag */}
          <View style={heroStyles.tag}>
            <Ionicons name="git-network-outline" size={13} color="rgba(255,255,255,0.9)" />
            <Text style={heroStyles.tagText}>Transport Merkezi</Text>
          </View>

          {/* Title */}
          <Text style={heroStyles.title}>Gatnaw we Ulag</Text>
          <Text style={heroStyles.subtitle}>
            Türkmenistanyň ähli transport hyzmatlary — döwlet, hususy we logistika
          </Text>

          {/* Stats row */}
          <View style={heroStyles.statsRow}>
            {[
              { num: String(TRANSPORT_CATEGORIES.length), label: "Kategoriýa" },
              { num: String(totalServices), label: "Hyzmat" },
              { num: String(activeServices), label: "Işleýär" },
            ].map((s, i) => (
              <View key={i} style={heroStyles.statCard}>
                <Text style={heroStyles.statNum}>{s.num}</Text>
                <Text style={heroStyles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* ── LEGEND ── */}
        <View style={[legendStyles.wrap, { borderBottomColor: colors.border }]}>
          <View style={legendStyles.item}>
            <View style={[legendStyles.dot, { backgroundColor: colors.primary }]} />
            <Text style={[legendStyles.text, { color: colors.mutedForeground }]}>Işleýär</Text>
          </View>
          <View style={legendStyles.item}>
            <View style={[legendStyles.dot, { backgroundColor: "#f59e0b" }]} />
            <Text style={[legendStyles.text, { color: colors.mutedForeground }]}>Ýakynda</Text>
          </View>
        </View>

        {/* ── CATEGORIES ── */}
        <View style={{ paddingHorizontal: 14, paddingTop: 14 }}>
          {TRANSPORT_CATEGORIES.map((cat, i) => (
            <CategoryBlock key={cat.id} category={cat} index={i} />
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
            colors={[colors.headerGradientStart, colors.headerGradientEnd] as [string, string]}
            style={ctaStyles.icon}
          >
            <Ionicons name="headset-outline" size={22} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={[ctaStyles.title, { color: colors.foreground }]}>
              Hyzmat teklip etmek isleýärsiňizmi?
            </Text>
            <Text style={[ctaStyles.sub, { color: colors.mutedForeground }]}>
              Transport ulgamyna öz hyzmatyňyzy goşuň
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={colors.primary} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const heroStyles = StyleSheet.create({
  hero: {
    paddingHorizontal: 18, paddingBottom: 28,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  tag: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "flex-start",
    borderRadius: 50, paddingHorizontal: 12, paddingVertical: 5,
    marginBottom: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  tagText: { color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: "600" },
  title: {
    color: "#fff", fontSize: 32, fontWeight: "900",
    letterSpacing: -0.8, marginBottom: 8,
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)", fontSize: 13,
    lineHeight: 19, marginBottom: 22,
  },
  statsRow: {
    flexDirection: "row", gap: 10,
  },
  statCard: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14, paddingVertical: 12, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  statNum: {
    color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: -0.5,
  },
  statLabel: {
    color: "rgba(255,255,255,0.75)", fontSize: 10, fontWeight: "600", marginTop: 2,
  },
});

const legendStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row", gap: 18, paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 1,
  },
  item: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  text: { fontSize: 12, fontWeight: "600" },
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
