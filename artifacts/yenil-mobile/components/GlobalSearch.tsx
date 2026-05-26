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

// ── Search index ─────────────────────────────────────────────────────
type ResultType = "screen" | "lesson" | "category" | "service";

interface SearchResult {
  id: string;
  type: ResultType;
  title: string;
  subtitle: string;
  icon: string;
  iconFamily?: "Ionicons";
  color: string;
  route?: string;
  onPress?: () => void;
}

const SCREEN_ITEMS: SearchResult[] = [
  { id: "demiryol",   type: "screen", title: "Demirýol biletleri",   subtitle: "Otly biletini zakaz et",            icon: "train-outline",           color: "#3b82f6", route: "/(tabs)/(demiryol)" },
  { id: "pay",        type: "screen", title: "Ýeňil Pay",            subtitle: "Payeer, Perfect Money, WebMoney",   icon: "swap-horizontal-outline", color: "#8b5cf6", route: "/(tabs)/pay" },
  { id: "smm",        type: "screen", title: "SMM Hyzmatlary",       subtitle: "Sosial media we marketing",         icon: "megaphone-outline",       color: "#e11d48", route: "/smm" },
  { id: "kuryer",     type: "screen", title: "Kuryer hyzmaty",       subtitle: "Çalt eltip bermek",                 icon: "bicycle-outline",         color: "#f97316", route: "/kuryer" },
  { id: "konum",      type: "screen", title: "Ýer Paýlaşma",         subtitle: "Canlý ýer yzarlama",                icon: "location-outline",        color: "#10b981", route: "/konum" },
  { id: "bazar",      type: "screen", title: "Sanly Bazar",          subtitle: "Onlaýn söwda meýdany",              icon: "storefront-outline",      color: "#06b6d4", route: "/bazar" },
  { id: "ebilim",     type: "screen", title: "E-Bilim",              subtitle: "Öwren, test ber, BP gazan",         icon: "school-outline",          color: "#6366f1", route: "/e-bilim" },
  { id: "kripto",     type: "screen", title: "Kripto Birja",         subtitle: "USDT ↔ BP alyş-çalyş",             icon: "logo-bitcoin",            color: "#f59e0b", route: "/kripto-birja" },
  { id: "nagt",       type: "screen", title: "Nagt Agent",           subtitle: "BP → Nagt pul çykarmak",            icon: "cash-outline",            color: "#16a34a", route: "/nagt-cashout" },
  { id: "pulgazan",   type: "screen", title: "Pul Gazan",            subtitle: "7 usul bilen BP gazan",             icon: "trophy-outline",          color: "#eab308", route: "/pul-gazan" },
  { id: "informator", type: "screen", title: "Informator",           subtitle: "Habarlar we täzelikler",            icon: "newspaper-outline",       color: "#0891b2", route: "/informator" },
  { id: "gatnaw",     type: "screen", title: "Gatnaw",               subtitle: "Gatnawyň tertibi",                  icon: "bus-outline",             color: "#7c3aed", route: "/gatnaw" },
  { id: "tmcell",     type: "screen", title: "TMCell",               subtitle: "Balans we internet",                icon: "phone-portrait-outline",  color: "#0d9488", route: "/(tabs)/tmcell" },
  { id: "referal",    type: "screen", title: "Referal ulgamy",       subtitle: "Dost çagyr, BP gazan",              icon: "people-outline",          color: "#ec4899", route: "/referal" },
  { id: "ekitap",     type: "screen", title: "E-Kitap",              subtitle: "Kitap okap BP gazan",               icon: "book-outline",            color: "#8b5cf6", route: "/ekitap" },
  { id: "howa",       type: "screen", title: "Howa maglumaty",       subtitle: "Gündelik howa çaklamasy",           icon: "partly-sunny-outline",    color: "#0ea5e9", route: "/howa" },
  { id: "teklip",     type: "screen", title: "Teklip ibermek",       subtitle: "Öz hyzmatyňyzy teklip ediň",       icon: "bulb-outline",            color: "#f59e0b", route: "/teklip" },
  { id: "help",       type: "screen", title: "Kömek merkezi",        subtitle: "Sorag we jogaplar",                 icon: "help-circle-outline",     color: "#64748b", route: "/help" },
  { id: "about",      type: "screen", title: "Biz barada",           subtitle: "Ýeňil hakynda maglumat",            icon: "information-circle-outline", color: "#334155", route: "/about" },
  { id: "profile",    type: "screen", title: "Profil",               subtitle: "Şahsy maglumatlar",                 icon: "person-outline",          color: "#10b981", route: "/(tabs)/profile" },
  { id: "sozlamalar", type: "screen", title: "Sazlamalar",           subtitle: "Tema, dil we beýlekiler",           icon: "settings-outline",        color: "#64748b", route: "/(tabs)/sozlamalar" },
];

const LESSON_ITEMS: SearchResult[] = LESSONS.slice(0, 60).map((l) => {
  const cat = CATEGORIES.find((c) => c.id === l.categoryId);
  return {
    id: `lesson-${l.id}`,
    type: "lesson",
    title: `${l.emoji} ${l.title}`,
    subtitle: `E-Bilim · ${cat?.title ?? l.categoryId}`,
    icon: "play-circle-outline",
    color: cat?.color ?? "#6366f1",
    route: "/e-bilim",
  };
});

const CATEGORY_ITEMS: SearchResult[] = CATEGORIES.map((c) => ({
  id: `cat-${c.id}`,
  type: "category",
  title: `${c.emoji} ${c.title}`,
  subtitle: c.subtitle,
  icon: "albums-outline",
  color: c.color,
  route: "/e-bilim",
}));

const SERVICE_ITEMS: SearchResult[] = HYZMAT_CATEGORIES.map((s) => ({
  id: `svc-${s.key}`,
  type: "service",
  title: s.label,
  subtitle: "Jemgyýet hyzmatlary",
  icon: s.icon,
  color: s.color,
}));

const ALL_ITEMS = [...SCREEN_ITEMS, ...CATEGORY_ITEMS, ...LESSON_ITEMS, ...SERVICE_ITEMS];

const TYPE_LABELS: Record<ResultType, string> = {
  screen: "Ekran",
  lesson: "Sapak",
  category: "Kategoriýa",
  service: "Hyzmat",
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/ý/g, "y").replace(/ä/g, "a").replace(/ö/g, "o")
    .replace(/ü/g, "u").replace(/ň/g, "n").replace(/ç/g, "c")
    .replace(/ş/g, "s").replace(/ž/g, "z");
}

// ── Component ────────────────────────────────────────────────────────
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
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setQuery("");
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 220 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start(() => setTimeout(() => inputRef.current?.focus(), 80));
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 40, duration: 180, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return SCREEN_ITEMS.slice(0, 12);
    return ALL_ITEMS.filter((item) => {
      const t = normalize(item.title);
      const s = normalize(item.subtitle);
      return t.includes(q) || s.includes(q);
    }).slice(0, 30);
  }, [query]);

  const handleSelect = (item: SearchResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    onClose();
    if (item.onPress) {
      item.onPress();
    } else if (item.route) {
      setTimeout(() => router.push(item.route as Href), 120);
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
      <Animated.View style={[s.backdrop, { opacity: opacityAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          s.sheet,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 16,
            transform: [{ translateY: slideAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={[s.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.mutedForeground} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Hyzmat, sapak, ekran gözle..."
              placeholderTextColor={colors.mutedForeground}
              style={[s.input, { color: colors.foreground }]}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {query.length > 0 && Platform.OS !== "ios" && (
              <Pressable onPress={() => setQuery("")}>
                <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
          <Pressable onPress={onClose} style={[s.cancelBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.cancelText, { color: colors.foreground }]}>Ýap</Text>
          </Pressable>
        </View>

        {/* Hint */}
        {!query ? (
          <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>
            GIRIZME TEKLIPLER
          </Text>
        ) : (
          <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>
            {results.length} NETIJE TAPYLDY
          </Text>
        )}

        <FlatList
          data={results}
          keyExtractor={(r) => r.id}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, gap: 4 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleSelect(item)}
              style={({ pressed }) => [
                s.resultRow,
                {
                  backgroundColor: pressed ? colors.primary + "0C" : colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={[s.resultIcon, { backgroundColor: item.color + "18" }]}>
                <Ionicons name={item.icon as any} size={19} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.resultTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[s.resultSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </View>
              <View style={[s.typePill, { backgroundColor: item.color + "15" }]}>
                <Text style={[s.typeText, { color: item.color }]}>{TYPE_LABELS[item.type]}</Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="search-outline" size={44} color={colors.mutedForeground + "60"} />
              <Text style={[s.emptyTitle, { color: colors.foreground }]}>Netije tapylmady</Text>
              <Text style={[s.emptySub, { color: colors.mutedForeground }]}>
                "{query}" boýunça hiç zat ýok. Başga söz synanyşyň.
              </Text>
            </View>
          }
        />
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.48)",
  },
  sheet: {
    flex: 1,
  },
  header: {
    flexDirection: "row", alignItems: "center",
    gap: 10, paddingHorizontal: 16, marginBottom: 12,
  },
  searchBar: {
    flex: 1, flexDirection: "row", alignItems: "center",
    gap: 10, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1, fontSize: 15, padding: 0,
  },
  cancelBtn: {
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1,
  },
  cancelText: { fontSize: 14, fontWeight: "600" },
  sectionLabel: {
    fontSize: 11, fontWeight: "700", letterSpacing: 0.7,
    marginLeft: 20, marginBottom: 8,
  },
  resultRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 14, padding: 12, borderWidth: 1,
  },
  resultIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  resultTitle: { fontSize: 14, fontWeight: "700" },
  resultSub: { fontSize: 12, marginTop: 1 },
  typePill: {
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3,
  },
  typeText: { fontSize: 10, fontWeight: "800" },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptySub: { textAlign: "center", fontSize: 13, lineHeight: 18, paddingHorizontal: 20 },
});
