/**
 * GlobalSearch — Ýeňil ilovasyndaky universal gözleg
 *
 * Gözleg indeksi config fayllaryndan DINAMIKI gurulýar:
 *   • TRANSPORT_CATEGORIES  → gatnaw.tsx içindäki hyzmatlar
 *   • PAYMENT_CATEGORIES    → toleglar.tsx içindäki hyzmatlar
 *   • CATEGORIES + LESSONS  → e-bilim sapaklar
 *   • HYZMAT_CATEGORIES     → jemgyýet hyzmatlary
 *   • SCREEN_ITEMS          → ilkinji ekranlar (el bilen)
 *
 * Täze hyzmat / sapak goşulsa — bu ýere goşmak hökman däl,
 * config faylyna goşmak ýeterli.
 */

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View, Text, StyleSheet, Modal, Pressable, TextInput,
  FlatList, Platform, Keyboard, Animated,
} from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { CATEGORIES, LESSONS } from "@/lib/ebilimData";
import { HYZMAT_CATEGORIES } from "@/lib/hyzmatlar";
import { TRANSPORT_CATEGORIES } from "@/config/transportFeatures";
import { PAYMENT_CATEGORIES } from "@/config/paymentFeatures";
import { METHODS as PUL_GAZAN_METHODS } from "@/app/pul-gazan";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type ResultType = "ekran" | "sapak" | "kategoriýa" | "hyzmat" | "gatnaw" | "töleg";

interface SearchItem {
  id: string;
  type: ResultType;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route?: string;
  badge?: string; // "Ýakynda", "Täze", etc.
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Esasy ekranlar — el bilen
// ─────────────────────────────────────────────────────────────────────────────
const SCREEN_ITEMS: SearchItem[] = [
  {
    id: "s-demiryol",
    type: "ekran",
    title: "Demirýol biletleri",
    subtitle: "Bank kartsyz otly bilet zakaz et",
    icon: "train-outline",
    color: "#0d9488",
    route: "/(tabs)/(demiryol)",
  },
  {
    id: "s-pay",
    type: "ekran",
    title: "Ýeňil Pay",
    subtitle: "Payeer · Perfect Money · WebMoney → TMT",
    icon: "swap-horizontal-outline",
    color: "#8b5cf6",
    route: "/(tabs)/pay",
  },
  {
    id: "s-gatnaw",
    type: "ekran",
    title: "Gatnaw we Ulag",
    subtitle: "Döwlet, hususy we logistika hyzmatlary",
    icon: "car-sport-outline",
    color: "#f59e0b",
    route: "/gatnaw",
  },
  {
    id: "s-toleglar",
    type: "ekran",
    title: "Tölegler we Hyzmatlar",
    subtitle: "Kommunal, aragatnaşyk, media tölegleri",
    icon: "card-outline",
    color: "#0ea5e9",
    route: "/toleglar",
  },
  {
    id: "s-smm",
    type: "ekran",
    title: "SMM Hyzmatlary",
    subtitle: "Designer · SMM · Reklama · Foto/Wideo",
    icon: "megaphone-outline",
    color: "#e11d48",
    route: "/smm",
  },
  {
    id: "s-kuryer",
    type: "ekran",
    title: "Kuryer hyzmaty",
    subtitle: "Tiz poçta we mini-tabşyryklar, BP gazan",
    icon: "bicycle-outline",
    color: "#f97316",
    route: "/kuryer",
  },
  {
    id: "s-konum",
    type: "ekran",
    title: "Ýer Paýlaşma",
    subtitle: "Canlý ýer yzarlama we paýlaşma",
    icon: "location-outline",
    color: "#10b981",
    route: "/konum",
  },
  {
    id: "s-bazar",
    type: "ekran",
    title: "Sanly Bazar",
    subtitle: "Sanly önümler we premium mazmunlar",
    icon: "storefront-outline",
    color: "#06b6d4",
    route: "/bazar",
  },
  {
    id: "s-ebilim",
    type: "ekran",
    title: "E-Bilim",
    subtitle: "Öwren, synag ber, BP gazan",
    icon: "school-outline",
    color: "#6366f1",
    route: "/e-bilim",
  },
  {
    id: "s-pulgazan",
    type: "ekran",
    title: "Pul/Abraý gazan",
    subtitle: `${PUL_GAZAN_METHODS.length} usul bilen BP gazan`,
    icon: "trophy-outline",
    color: "#eab308",
    route: "/pul-gazan",
  },
  {
    id: "s-agent-topup",
    type: "ekran",
    title: "Agent — TMCell Balans",
    subtitle: "100 TMT → 115 BP (15% bonus)",
    icon: "phone-portrait-outline",
    color: "#0d9488",
    route: "/agent-topup",
  },
  {
    id: "s-informator",
    type: "ekran",
    title: "Informator",
    subtitle: "GAI, Sykylyk, Ýol ýapyk — real wagtda habarlar",
    icon: "warning-outline",
    color: "#0891b2",
    route: "/informator",
  },
  {
    id: "s-referal",
    type: "ekran",
    title: "Referal ulgamy",
    subtitle: "Dost çagyr, her referal üçin BP gazan",
    icon: "people-outline",
    color: "#ec4899",
    route: "/referal",
  },
  {
    id: "s-ekitap",
    type: "ekran",
    title: "E-Kitap",
    subtitle: "Kitap, kurslar we makalalar",
    icon: "book-outline",
    color: "#8b5cf6",
    route: "/ekitap",
  },
  {
    id: "s-howa",
    type: "ekran",
    title: "Howa we Uçar biletleri",
    subtitle: "Gündelik howa çaklamasy, aviabilet",
    icon: "airplane-outline",
    color: "#0ea5e9",
    route: "/howa",
  },
  {
    id: "s-ulgamlar",
    type: "ekran",
    title: "Sanly Ulgamlar",
    subtitle: "Aydym, Hiňlen, Belet Film, Belet Music",
    icon: "musical-notes-outline",
    color: "#7c3aed",
    route: "/ulgamlar",
  },
  {
    id: "s-ai-chat",
    type: "ekran",
    title: "AI Söhbet",
    subtitle: "Intellektual AI kömekçi bilen gürleş",
    icon: "hardware-chip-outline",
    color: "#6366f1",
    route: "/ai-chat",
  },
  {
    id: "s-teklip",
    type: "ekran",
    title: "Teklip ibermek",
    subtitle: "Öz hyzmatyňyzy teklip ediň",
    icon: "bulb-outline",
    color: "#f59e0b",
    route: "/teklip",
  },
  {
    id: "s-sms",
    type: "ekran",
    title: "SMS bilen zakaz",
    subtitle: "Bilet almagy telefon arkaly düşündiriş",
    icon: "chatbubble-ellipses-outline",
    color: "#64748b",
    route: "/sms",
  },
  {
    id: "s-tmcell",
    type: "ekran",
    title: "TMCell",
    subtitle: "Balans we internet tölegi",
    icon: "cellular-outline",
    color: "#0d9488",
    route: "/(tabs)/tmcell",
  },
  {
    id: "s-profile",
    type: "ekran",
    title: "Profil",
    subtitle: "Şahsy maglumat we sazlamalar",
    icon: "person-circle-outline",
    color: "#10b981",
    route: "/(tabs)/profile",
  },
  {
    id: "s-sozlamalar",
    type: "ekran",
    title: "Sazlamalar",
    subtitle: "Tema, dil, bildirim",
    icon: "settings-outline",
    color: "#64748b",
    route: "/(tabs)/sozlamalar",
  },
  {
    id: "s-help",
    type: "ekran",
    title: "Kömek merkezi",
    subtitle: "Sorag we jogaplar, goldaw",
    icon: "help-circle-outline",
    color: "#0891b2",
    route: "/help",
  },
  {
    id: "s-about",
    type: "ekran",
    title: "Biz barada",
    subtitle: "Ýeňil topary we missiýasy",
    icon: "information-circle-outline",
    color: "#334155",
    route: "/about",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. Dinamiki: Transport hyzmatlary — TRANSPORT_CATEGORIES-dan
// ─────────────────────────────────────────────────────────────────────────────
function buildTransportItems(): SearchItem[] {
  const items: SearchItem[] = [];
  for (const cat of TRANSPORT_CATEGORIES) {
    for (const svc of cat.services) {
      items.push({
        id: `tr-${svc.id}`,
        type: "gatnaw",
        title: svc.title,
        subtitle: `Gatnaw · ${cat.title}`,
        icon: (svc.icon as keyof typeof Ionicons.glyphMap) || "car-outline",
        color: svc.color,
        route: svc.route ?? "/gatnaw",
        badge: svc.status === "coming_soon" ? "Ýakynda" : undefined,
      });
    }
  }
  return items;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Dinamiki: Töleg hyzmatlary — PAYMENT_CATEGORIES-dan
// ─────────────────────────────────────────────────────────────────────────────
function buildPaymentItems(): SearchItem[] {
  const items: SearchItem[] = [];
  for (const cat of PAYMENT_CATEGORIES) {
    for (const svc of cat.services) {
      items.push({
        id: `pay-${svc.id}`,
        type: "töleg",
        title: svc.title,
        subtitle: `Töleg · ${cat.title}`,
        icon: (svc.icon as keyof typeof Ionicons.glyphMap) || "card-outline",
        color: svc.color,
        route: svc.route ?? "/toleglar",
        badge: svc.status === "coming_soon" ? "Ýakynda" : undefined,
      });
    }
  }
  return items;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Dinamiki: E-Bilim kategorýalary we sapaklar
// ─────────────────────────────────────────────────────────────────────────────
function buildEBilimItems(): SearchItem[] {
  const cats: SearchItem[] = CATEGORIES.map((c) => ({
    id: `ecat-${c.id}`,
    type: "kategoriýa" as ResultType,
    title: c.title,
    subtitle: `E-Bilim · ${c.subtitle}`,
    icon: "albums-outline" as keyof typeof Ionicons.glyphMap,
    color: c.color,
    route: "/e-bilim",
  }));
  const lessons: SearchItem[] = LESSONS.map((l) => {
    const cat = CATEGORIES.find((c) => c.id === l.categoryId);
    return {
      id: `el-${l.id}`,
      type: "sapak" as ResultType,
      title: l.title,
      subtitle: `E-Bilim Sapak · ${cat?.title ?? l.categoryId}`,
      icon: "play-circle-outline" as keyof typeof Ionicons.glyphMap,
      color: cat?.color ?? "#6366f1",
      route: "/e-bilim",
      badge: l.isPremium ? "Premium" : undefined,
    };
  });
  return [...cats, ...lessons];
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Dinamiki: Jemgyýet hyzmatlary — HYZMAT_CATEGORIES-dan
// ─────────────────────────────────────────────────────────────────────────────
function buildHyzmatItems(): SearchItem[] {
  return HYZMAT_CATEGORIES.map((s) => ({
    id: `hyz-${s.key}`,
    type: "hyzmat" as ResultType,
    title: s.label,
    subtitle: "Jemgyýet hyzmatlary bazary",
    icon: (s.icon as keyof typeof Ionicons.glyphMap) || "briefcase-outline",
    color: s.color,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalise: ä/ö/ü/ý/ň/ç/ş → a/o/u/y/n/c/s
// ─────────────────────────────────────────────────────────────────────────────
function norm(s: string) {
  return s
    .toLowerCase()
    .replace(/ý/g, "y").replace(/ä/g, "a").replace(/ö/g, "o")
    .replace(/ü/g, "u").replace(/ň/g, "n").replace(/ç/g, "c")
    .replace(/ş/g, "s").replace(/ž/g, "z").replace(/ñ/g, "n");
}

const TYPE_LABEL: Record<ResultType, string> = {
  ekran: "Ekran",
  sapak: "Sapak",
  "kategoriýa": "Kategoriýa",
  hyzmat: "Hyzmat",
  gatnaw: "Gatnaw",
  töleg: "Töleg",
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export function GlobalSearch({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");

  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Build full index once (memo — rerenders etmez)
  const ALL_ITEMS = useMemo<SearchItem[]>(
    () => [
      ...SCREEN_ITEMS,
      ...buildTransportItems(),
      ...buildPaymentItems(),
      ...buildEBilimItems(),
      ...buildHyzmatItems(),
    ],
    []
  );

  useEffect(() => {
    if (visible) {
      setQuery("");
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 250 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start(() => setTimeout(() => inputRef.current?.focus(), 60));
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 50, duration: 180, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const results = useMemo<SearchItem[]>(() => {
    const q = norm(query.trim());
    if (!q) {
      // Girizme: esasy ekranlar (ilkinji 14)
      return SCREEN_ITEMS.slice(0, 14);
    }
    return ALL_ITEMS.filter((item) => {
      return (
        norm(item.title).includes(q) ||
        norm(item.subtitle).includes(q) ||
        norm(item.type).includes(q)
      );
    }).slice(0, 40);
  }, [query, ALL_ITEMS]);

  const handleSelect = (item: SearchItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    onClose();
    if (item.route) {
      setTimeout(() => router.push(item.route as Href), 130);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Animated.View style={[gs.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          gs.sheet,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + 10,
            paddingBottom: insets.bottom + 12,
            transform: [{ translateY: slideAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        {/* ── Search bar row ── */}
        <View style={gs.headerRow}>
          <View style={[gs.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search" size={17} color={colors.mutedForeground} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Hyzmat, sapak, ekran gözle..."
              placeholderTextColor={colors.mutedForeground}
              style={[gs.input, { color: colors.foreground }]}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {Platform.OS !== "ios" && query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <Ionicons name="close-circle" size={17} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={onClose}
            style={[gs.closeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[gs.closeTxt, { color: colors.foreground }]}>Ýap</Text>
          </Pressable>
        </View>

        {/* ── Section label ── */}
        <Text style={[gs.sectionLbl, { color: colors.mutedForeground }]}>
          {query ? `${results.length} NETIJE` : "GIRIZME TEKLIPLER"}
        </Text>

        {/* ── Results ── */}
        <FlatList
          data={results}
          keyExtractor={(r) => r.id}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={gs.listContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleSelect(item)}
              style={({ pressed }) => [
                gs.row,
                {
                  backgroundColor: pressed ? colors.primary + "0D" : colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Icon */}
              <View style={[gs.iconBox, { backgroundColor: item.color + "1A" }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>

              {/* Text */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={[gs.rowTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.badge && (
                    <View style={[gs.badge, { backgroundColor: item.color + "22" }]}>
                      <Text style={[gs.badgeTxt, { color: item.color }]}>{item.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={[gs.rowSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </View>

              {/* Type pill */}
              <View style={[gs.typePill, { backgroundColor: item.color + "14" }]}>
                <Text style={[gs.typeTxt, { color: item.color }]}>
                  {TYPE_LABEL[item.type]}
                </Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={gs.empty}>
              <Ionicons name="search-outline" size={46} color={colors.mutedForeground + "50"} />
              <Text style={[gs.emptyTitle, { color: colors.foreground }]}>
                Netije tapylmady
              </Text>
              <Text style={[gs.emptySub, { color: colors.mutedForeground }]}>
                "{query}" boýunça hiç zat ýok.{"\n"}Başga söz synanyşyň.
              </Text>
            </View>
          }
        />
      </Animated.View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const gs = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row", alignItems: "center",
    gap: 10, paddingHorizontal: 16, marginBottom: 10,
  },
  searchWrap: {
    flex: 1, flexDirection: "row", alignItems: "center",
    gap: 9, borderRadius: 16, paddingHorizontal: 13,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    borderWidth: 1,
  },
  input: {
    flex: 1, fontSize: 15, padding: 0,
  },
  closeBtn: {
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1,
  },
  closeTxt: { fontSize: 14, fontWeight: "600" },
  sectionLbl: {
    fontSize: 11, fontWeight: "700", letterSpacing: 0.8,
    marginLeft: 20, marginBottom: 8,
  },
  listContent: { paddingHorizontal: 14, paddingBottom: 24, gap: 4 },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 14, padding: 12, borderWidth: 1,
  },
  iconBox: {
    width: 42, height: 42, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
  },
  rowTitle: { fontSize: 14, fontWeight: "700" },
  rowSub: { fontSize: 12, marginTop: 1.5 },
  badge: { borderRadius: 7, paddingHorizontal: 6, paddingVertical: 2 },
  badgeTxt: { fontSize: 9, fontWeight: "800" },
  typePill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  typeTxt: { fontSize: 10, fontWeight: "800" },
  empty: { alignItems: "center", paddingTop: 70, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptySub: { textAlign: "center", fontSize: 13, lineHeight: 19, color: "#9ca3af" },
});
