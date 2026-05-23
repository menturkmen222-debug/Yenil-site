import React, { useState, useMemo } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  Modal, Platform, Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";

type Category = { id: string; label: string; icon: keyof typeof Ionicons.glyphMap; color: string };
type Product = {
  id: string;
  categoryId: string;
  name: string;
  desc: string;
  details: string;
  price: number;
  currency: "TMT" | "BP";
  originalPrice?: number;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  seller: string;
  rating: number;
  sold: number;
  badge?: string;
  badgeColor?: string;
  inStock: boolean;
  deliveryTime: string;
};

const CATEGORIES: Category[] = [
  { id: "all", label: "Hemmesi", icon: "grid-outline", color: "#6366f1" },
  { id: "streaming", label: "Streaming", icon: "play-circle-outline", color: "#ef4444" },
  { id: "games", label: "Oýunlar", icon: "game-controller-outline", color: "#f59e0b" },
  { id: "accounts", label: "Akkauntlar", icon: "person-circle-outline", color: "#0ea5e9" },
  { id: "social", label: "Sosial media", icon: "share-social-outline", color: "#ec4899" },
  { id: "software", label: "Programma", icon: "desktop-outline", color: "#8b5cf6" },
  { id: "education", label: "Bilim", icon: "school-outline", color: "#10b981" },
  { id: "vpn", label: "VPN / Tor", icon: "shield-checkmark-outline", color: "#64748b" },
];

const PRODUCTS: Product[] = [
  {
    id: "p1", categoryId: "streaming",
    name: "Netflix Premium", desc: "4K UHD • 4 ekran • 1 aý",
    details: "Netflix Premium akkaunt. Doly HD we 4K goldawy bilen 4 ekranda birden tomaşa edip bilersiňiz. Türkmenistan we daşary ýurt filmler. 30 günlük kepillik.",
    price: 45, currency: "TMT", originalPrice: 65,
    icon: "play-circle", iconColor: "#ef4444",
    seller: "DigitalShop_TM", rating: 4.9, sold: 312,
    badge: "Arzanladyş", badgeColor: "#ef4444",
    inStock: true, deliveryTime: "Derhal",
  },
  {
    id: "p2", categoryId: "streaming",
    name: "Spotify Premium", desc: "1 aý • Reklamsyz • Offline",
    details: "Spotify Premium şahsy akkaunt. Reklamsyz aýdym diňläň, islendik aýdymy offline ýükläň. Doly Premium mümkinçilikler.",
    price: 25, currency: "TMT",
    icon: "musical-notes", iconColor: "#1db954",
    seller: "MediaZone", rating: 4.8, sold: 198,
    badge: "Köp satylýar", badgeColor: "#f59e0b",
    inStock: true, deliveryTime: "Derhal",
  },
  {
    id: "p3", categoryId: "games",
    name: "PUBG Mobile UC", desc: "600 UC • Derhal iberilýär",
    details: "PUBG Mobile oýny üçin 600 Unknown Cash (UC). Skin, Royale Pass we beýleki harytlary satyn alyň. ID bilen gönüden ýüklenýär.",
    price: 30, currency: "TMT",
    icon: "game-controller", iconColor: "#f59e0b",
    seller: "GameStore_TM", rating: 4.7, sold: 445,
    inStock: true, deliveryTime: "5-10 minut",
  },
  {
    id: "p4", categoryId: "games",
    name: "Free Fire Diamonds", desc: "1080 Almaz • Akkaunt ID bilen",
    details: "Free Fire oýny üçin 1080 Diamonds. Oýunyňyzdaky ID-ni berseňiz, göni akkauntňyza geçirýäris.",
    price: 35, currency: "TMT",
    icon: "diamond", iconColor: "#06b6d4",
    seller: "GameStore_TM", rating: 4.6, sold: 289,
    inStock: true, deliveryTime: "5-10 minut",
  },
  {
    id: "p5", categoryId: "accounts",
    name: "Instagram 10K Followers", desc: "10,000 real yzarlaýjy",
    details: "Siziň Instagram sahypäňize 10,000 hakyky yzarlaýjy goşýarys. Ygtybarly usul, akkaunt howpsuzlygy kepillendirilýär. 30 günlük kepillik.",
    price: 80, currency: "TMT",
    icon: "logo-instagram", iconColor: "#e1306c",
    seller: "SocialBoost", rating: 4.5, sold: 156,
    badge: "Meşhur", badgeColor: "#6366f1",
    inStock: true, deliveryTime: "1-3 sagat",
  },
  {
    id: "p6", categoryId: "vpn",
    name: "VPN Premium — 1 Aý", desc: "Çäklendirilmesiz internet • Howpsuz",
    details: "Premium VPN hyzmaty. Islendik web sahypa giriş, 256-bit şifrlemek, dünýäniň 50+ ýurdundaky serverler. Çalt we ygtybarly baglanşyk.",
    price: 20, currency: "TMT",
    icon: "shield-checkmark", iconColor: "#64748b",
    seller: "SecureNet_TM", rating: 4.8, sold: 521,
    inStock: true, deliveryTime: "Derhal",
  },
  {
    id: "p7", categoryId: "software",
    name: "Microsoft Office 365", desc: "1 ýyl abuna • 5 enjam",
    details: "Microsoft Office 365 Personal. Word, Excel, PowerPoint, Outlook we beýleki programmalar. 1TB OneDrive. 5 enjamda ulanmak mümkin.",
    price: 120, currency: "TMT", originalPrice: 180,
    icon: "document-text", iconColor: "#0ea5e9",
    seller: "SoftStore", rating: 4.9, sold: 87,
    badge: "Arzanladyş", badgeColor: "#ef4444",
    inStock: true, deliveryTime: "Derhal",
  },
  {
    id: "p8", categoryId: "education",
    name: "Duolingo Plus — 3 Aý", desc: "Dil öwreniş premium",
    details: "Duolingo Plus 3 aýlyk abuna. Reklamsyz, offline ders, çäklendirilmesiz ýürek, ösüş derňewi. Islendik dili öwreniň.",
    price: 40, currency: "TMT",
    icon: "school", iconColor: "#10b981",
    seller: "EduShop", rating: 4.7, sold: 64,
    inStock: true, deliveryTime: "Derhal",
  },
  {
    id: "p9", categoryId: "streaming",
    name: "YouTube Premium", desc: "Reklamsyz • Offline • 1 aý",
    details: "YouTube Premium 1 aýlyk. Reklamlary ýapyň, wideolary offline ýükläň, YouTube Music Premium girişi. Şahsy akkaunt.",
    price: 22, currency: "TMT",
    icon: "logo-youtube", iconColor: "#ff0000",
    seller: "MediaZone", rating: 4.6, sold: 203,
    inStock: true, deliveryTime: "Derhal",
  },
  {
    id: "p10", categoryId: "social",
    name: "Telegram Premium", desc: "1 aý • Ähli mümkinçilikler",
    details: "Telegram Premium 1 aýlyk. Animirlenen emoji, 4GB fayl ýüklemek, çalt ýüklemek, gizlin chat tipler we Premium badge.",
    price: 18, currency: "TMT",
    icon: "paper-plane", iconColor: "#0088cc",
    seller: "DigitalShop_TM", rating: 4.9, sold: 678,
    badge: "Iň köp satylýar", badgeColor: "#15803d",
    inStock: true, deliveryTime: "Derhal",
  },
  {
    id: "p11", categoryId: "games",
    name: "Steam Gift Card 20$", desc: "Global • Ähli oýunlar",
    details: "Steam platformasy üçin 20$ sowgat kartasy. Islendik oýun satyn almaga ulanyň. Global karta — ähli ýurtlarda işleýär.",
    price: 75, currency: "TMT",
    icon: "game-controller-outline", iconColor: "#1b2838",
    seller: "GameStore_TM", rating: 4.8, sold: 134,
    inStock: true, deliveryTime: "10-30 minut",
  },
  {
    id: "p12", categoryId: "accounts",
    name: "Canva Pro — 1 Aý", desc: "Dizaýn üçin premium gural",
    details: "Canva Pro 1 aýlyk abuna. 100M+ şablon, premium elementler, fon aýyrmak, brend toplumu, çäklendirilmesiz ýükleme.",
    price: 30, currency: "TMT",
    icon: "color-palette", iconColor: "#7c3aed",
    seller: "SoftStore", rating: 4.7, sold: 92,
    inStock: true, deliveryTime: "Derhal",
  },
];

const SORT_OPTIONS = [
  { id: "popular", label: "Meşhur" },
  { id: "price_asc", label: "Arzan → Gymmat" },
  { id: "price_desc", label: "Gymmat → Arzan" },
  { id: "rating", label: "Reýting" },
];

export default function BazarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { balance, deduct } = useBonusPul();
  const isWeb = Platform.OS === "web";

  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [showSort, setShowSort] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    let list = PRODUCTS.filter((p) => {
      const matchCat = selectedCat === "all" || p.categoryId === selectedCat;
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.desc.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
    if (sortBy === "price_asc") list = [...list].sort((a, b) => a.price - b.price);
    else if (sortBy === "price_desc") list = [...list].sort((a, b) => b.price - a.price);
    else if (sortBy === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    else list = [...list].sort((a, b) => b.sold - a.sold);
    return list;
  }, [search, selectedCat, sortBy]);

  function handleBuy(product: Product) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (product.currency === "BP") {
      if (balance < product.price) {
        Alert.alert(
          "BP ýetmezçiligi",
          `Siziň balansiňiz: ${balance.toFixed(2)} BP\nGerekli: ${product.price} BP\n\nBP satyn almak üçin Bosh sahypa giriň.`
        );
        return;
      }
      Alert.alert(
        `${product.name} satyn almak`,
        `${product.price} BP tölemek bilen satyn alýarsyňyzmy?\n\nGowşurylyş: ${product.deliveryTime}`,
        [
          { text: "Ýok", style: "cancel" },
          {
            text: "Satyn al",
            onPress: () => {
              deduct(product.price);
              setSelectedProduct(null);
              Alert.alert(
                "Üstünlikli!",
                `${product.name} satyn alyndy!\n\n${product.price} BP hasabyňyzdan aýryldy.\n\nGowşurylyş: ${product.deliveryTime}`
              );
            },
          },
        ]
      );
    } else {
      Alert.alert(
        `${product.name} sargyt et`,
        `Bahasy: ${product.price} TMT\nGowşurylyş: ${product.deliveryTime}\n\nOperator siz bilen habarlaşar.`,
        [
          { text: "Ýok", style: "cancel" },
          {
            text: "Sargyt et",
            onPress: () => {
              setSelectedProduct(null);
              Alert.alert(
                "Sargyt kabul edildi!",
                `${product.name} sargydyňyz kabul edildi!\n\nOperator ${product.deliveryTime.toLowerCase()} içinde siz bilen habarlaşar.`
              );
            },
          },
        ]
      );
    }
  }

  function StarRating({ rating }: { rating: number }) {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
        <Ionicons name="star" size={12} color="#f59e0b" />
        <Text style={{ color: "#f59e0b", fontSize: 12, fontWeight: "700" }}>{rating.toFixed(1)}</Text>
      </View>
    );
  }

  function ProductCard({ item }: { item: Product }) {
    const isDiscounted = !!item.originalPrice;
    const discount = isDiscounted ? Math.round((1 - item.price / item.originalPrice!) * 100) : 0;
    return (
      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedProduct(item); }}
        style={({ pressed }) => [
          styles.productCard,
          { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.88 : 1 },
        ]}
      >
        {item.badge && (
          <View style={[styles.productBadge, { backgroundColor: item.badgeColor }]}>
            <Text style={styles.productBadgeText}>{item.badge}</Text>
          </View>
        )}
        {isDiscounted && (
          <View style={[styles.discountBadge, { backgroundColor: "#ef4444" }]}>
            <Text style={styles.discountBadgeText}>-{discount}%</Text>
          </View>
        )}
        <View style={[styles.productIconWrap, { backgroundColor: item.iconColor + "18" }]}>
          <Ionicons name={item.icon} size={32} color={item.iconColor} />
        </View>
        <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.productDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{item.desc}</Text>
        <View style={styles.productMeta}>
          <StarRating rating={item.rating} />
          <Text style={[styles.productSold, { color: colors.mutedForeground }]}>{item.sold} sany</Text>
        </View>
        <View style={styles.productPriceRow}>
          <View>
            <Text style={[styles.productPrice, { color: colors.primary }]}>
              {item.price} {item.currency}
            </Text>
            {isDiscounted && (
              <Text style={styles.productOldPrice}>{item.originalPrice} {item.currency}</Text>
            )}
          </View>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setSelectedProduct(item); }}
            style={[styles.buyBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.buyBtnText}>Satyn al</Text>
          </Pressable>
        </View>
        <View style={styles.deliveryRow}>
          <Ionicons name="flash-outline" size={11} color={colors.primary} />
          <Text style={[styles.deliveryText, { color: colors.primary }]}>{item.deliveryTime}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={[styles.header, { paddingTop: (isWeb ? 0 : insets.top) + 12 }]}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Sanly bazar</Text>
            <Text style={styles.headerSub}>{PRODUCTS.length} haryt elýeterli</Text>
          </View>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowSort(!showSort); }}
            style={styles.sortBtn}
          >
            <Ionicons name="options-outline" size={20} color="#fff" />
          </Pressable>
        </View>

        {/* ULANYJY BAZARY BUTTON */}
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/sanly-bazar-sell"); }}
          style={({ pressed }) => [styles.ulanyjyBtn, { opacity: pressed ? 0.85 : 1 }]}
        >
          <View style={styles.ulanyjyBtnLeft}>
            <View style={styles.ulanyjyIconWrap}>
              <Ionicons name="people-outline" size={18} color="#059669" />
            </View>
            <View>
              <Text style={styles.ulanyjyBtnTitle}>Ulanyjy Bazary</Text>
              <Text style={styles.ulanyjyBtnSub}>P2P • Sanly harydy sat / al</Text>
            </View>
          </View>
          <View style={styles.ulanyjyArrow}>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </View>
        </Pressable>
      </LinearGradient>

      {/* SORT DROPDOWN */}
      {showSort && (
        <View style={[styles.sortDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {SORT_OPTIONS.map((opt) => (
            <Pressable
              key={opt.id}
              onPress={() => { setSortBy(opt.id); setShowSort(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={[styles.sortOption, sortBy === opt.id && { backgroundColor: colors.primary + "15" }]}
            >
              <Text style={[styles.sortOptionText, { color: sortBy === opt.id ? colors.primary : colors.foreground }]}>
                {opt.label}
              </Text>
              {sortBy === opt.id && <Ionicons name="checkmark" size={16} color={colors.primary} />}
            </Pressable>
          ))}
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: isWeb ? 110 : 110 }}>
        {/* CATEGORIES */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCat === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedCat(cat.id); }}
                style={[
                  styles.catBtn,
                  isActive
                    ? { backgroundColor: cat.color }
                    : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
                ]}
              >
                <Ionicons name={cat.icon} size={15} color={isActive ? "#fff" : cat.color} />
                <Text style={[styles.catLabel, { color: isActive ? "#fff" : colors.foreground }]}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* SEARCH BAR */}
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Haryt gözle..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        {/* RESULT ROW */}
        <View style={styles.resultRow}>
          <Text style={[styles.resultText, { color: colors.mutedForeground }]}>
            {filtered.length} haryt tapyldy
          </Text>
          <Pressable onPress={() => setShowSort(true)} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="swap-vertical-outline" size={14} color={colors.primary} />
            <Text style={[styles.resultSort, { color: colors.primary }]}>
              {SORT_OPTIONS.find((s) => s.id === sortBy)?.label}
            </Text>
          </Pressable>
        </View>

        {/* PRODUCT GRID */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-circle-outline" size={64} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Haryt tapylmady</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Başga söz bilen gözläň ýa-da kategoriýa üýtgediň
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filtered.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* PRODUCT DETAIL MODAL */}
      <Modal
        visible={!!selectedProduct}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedProduct(null)}
      >
        {selectedProduct && (
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setSelectedProduct(null)} />
            <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
              <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />

              <Pressable
                onPress={() => setSelectedProduct(null)}
                style={[styles.closeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Ionicons name="close" size={20} color={colors.foreground} />
              </Pressable>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Icon */}
                <View style={styles.modalIconArea}>
                  <View style={[styles.modalIconWrap, { backgroundColor: selectedProduct.iconColor + "18" }]}>
                    <Ionicons name={selectedProduct.icon} size={52} color={selectedProduct.iconColor} />
                  </View>
                  {selectedProduct.badge && (
                    <View style={[styles.modalBadge, { backgroundColor: selectedProduct.badgeColor }]}>
                      <Text style={styles.modalBadgeText}>{selectedProduct.badge}</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.modalTitle, { color: colors.foreground }]}>{selectedProduct.name}</Text>
                <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>{selectedProduct.desc}</Text>

                {/* Stats */}
                <View style={styles.modalStats}>
                  {[
                    { icon: "star" as const, color: "#f59e0b", value: selectedProduct.rating.toFixed(1), label: "Reýting" },
                    { icon: "bag-check-outline" as const, color: colors.primary, value: `${selectedProduct.sold}`, label: "Satyldy" },
                    { icon: "flash-outline" as const, color: "#10b981", value: selectedProduct.deliveryTime, label: "Gowşurylyş", small: true },
                  ].map((s, i) => (
                    <View key={i} style={[styles.modalStatCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Ionicons name={s.icon} size={18} color={s.color} />
                      <Text style={[styles.modalStatValue, { color: colors.foreground, fontSize: s.small ? 11 : 16 }]}>{s.value}</Text>
                      <Text style={[styles.modalStatLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                    </View>
                  ))}
                </View>

                {/* Details card */}
                <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.detailTitle, { color: colors.foreground }]}>Haryt barada</Text>
                  <Text style={[styles.detailText, { color: colors.mutedForeground }]}>{selectedProduct.details}</Text>
                </View>

                {/* Seller */}
                <View style={[styles.sellerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.sellerAvatar, { backgroundColor: colors.primary }]}>
                    <Ionicons name="storefront-outline" size={20} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sellerName, { color: colors.foreground }]}>{selectedProduct.seller}</Text>
                    <Text style={[styles.sellerLabel, { color: colors.mutedForeground }]}>Satyjy • Barlanan</Text>
                  </View>
                  <View style={[styles.verifiedBadge, { backgroundColor: "#10b98118" }]}>
                    <Ionicons name="shield-checkmark" size={14} color="#10b981" />
                    <Text style={[styles.verifiedText, { color: "#10b981" }]}>Barlanan</Text>
                  </View>
                </View>

                {/* Price & Buy */}
                <View style={styles.priceRow}>
                  <View>
                    <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>Bahasy</Text>
                    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
                      <Text style={[styles.priceValue, { color: colors.primary }]}>
                        {selectedProduct.price} {selectedProduct.currency}
                      </Text>
                      {selectedProduct.originalPrice && (
                        <Text style={styles.priceOld}>{selectedProduct.originalPrice} {selectedProduct.currency}</Text>
                      )}
                    </View>
                  </View>
                  <Pressable
                    onPress={() => handleBuy(selectedProduct)}
                    style={({ pressed }) => [styles.modalBuyBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
                  >
                    <Ionicons name="cart-outline" size={18} color="#fff" />
                    <Text style={styles.modalBuyText}>Sargyt et</Text>
                  </Pressable>
                </View>

                {/* Guarantee */}
                <View style={[styles.guaranteeBox, { backgroundColor: "#10b98110", borderColor: "#10b98130" }]}>
                  <Ionicons name="shield-checkmark-outline" size={16} color="#10b981" />
                  <Text style={[styles.guaranteeText, { color: "#10b981" }]}>
                    Ähli harytlar üçin 30 günlük kepillik we yzyna gaýtarma mümkinçiligi bar.
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 1 },
  sortBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  ulanyjyBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  ulanyjyBtnLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  ulanyjyIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
  },
  ulanyjyBtnTitle: { color: "#fff", fontSize: 14, fontWeight: "700" },
  ulanyjyBtnSub: { color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 1 },
  ulanyjyArrow: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
    marginHorizontal: 16, marginBottom: 10, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14 },
  sortDropdown: {
    position: "absolute", top: 130, right: 16, zIndex: 100,
    borderRadius: 14, borderWidth: 1, overflow: "hidden", minWidth: 190,
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 10, elevation: 8,
  },
  sortOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  sortOptionText: { fontSize: 14, fontWeight: "600" },
  categoriesRow: { paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  catBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50 },
  catLabel: { fontSize: 13, fontWeight: "600" },
  trustBar: {
    flexDirection: "row", marginHorizontal: 16, marginBottom: 10,
    borderRadius: 14, borderWidth: 1, padding: 11, justifyContent: "space-around",
  },
  trustItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  trustText: { fontSize: 11, fontWeight: "600" },
  resultRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, marginBottom: 12,
  },
  resultText: { fontSize: 13 },
  resultSort: { fontSize: 13, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16 },
  productCard: { width: "47%", borderRadius: 18, borderWidth: 1, padding: 13, position: "relative", gap: 6 },
  productBadge: {
    position: "absolute", top: 10, left: 10, zIndex: 1,
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3,
  },
  productBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  discountBadge: {
    position: "absolute", top: 10, right: 10, zIndex: 1,
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3,
  },
  discountBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  productIconWrap: {
    width: 54, height: 54, borderRadius: 16,
    alignItems: "center", justifyContent: "center", marginBottom: 2,
  },
  productName: { fontSize: 13, fontWeight: "700" },
  productDesc: { fontSize: 11, lineHeight: 15 },
  productMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  productSold: { fontSize: 10 },
  productPriceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  productPrice: { fontSize: 14, fontWeight: "800" },
  productOldPrice: { fontSize: 10, color: "#9ca3af", textDecorationLine: "line-through" },
  buyBtn: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 10 },
  buyBtnText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  deliveryRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  deliveryText: { fontSize: 10, fontWeight: "600" },
  emptyState: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginTop: 16, marginBottom: 8 },
  emptyDesc: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  modalSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, paddingBottom: 20, maxHeight: "92%", position: "relative",
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  closeBtn: {
    position: "absolute", top: 16, right: 16, zIndex: 10,
    width: 34, height: 34, borderRadius: 17, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  modalIconArea: { alignItems: "center", marginBottom: 12, gap: 10 },
  modalIconWrap: { width: 90, height: 90, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  modalBadge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 },
  modalBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  modalTitle: { fontSize: 22, fontWeight: "800", textAlign: "center", marginBottom: 5 },
  modalSubtitle: { fontSize: 14, textAlign: "center", marginBottom: 16 },
  modalStats: { flexDirection: "row", gap: 10, marginBottom: 16 },
  modalStatCard: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 14, borderWidth: 1, gap: 4 },
  modalStatValue: { fontWeight: "800" },
  modalStatLabel: { fontSize: 10 },
  detailCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  detailTitle: { fontSize: 15, fontWeight: "700", marginBottom: 8 },
  detailText: { fontSize: 13, lineHeight: 20 },
  sellerCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 14,
  },
  sellerAvatar: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  sellerName: { fontSize: 14, fontWeight: "700" },
  sellerLabel: { fontSize: 12 },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  verifiedText: { fontSize: 11, fontWeight: "700" },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  priceLabel: { fontSize: 12, marginBottom: 2 },
  priceValue: { fontSize: 28, fontWeight: "800" },
  priceOld: { fontSize: 14, color: "#9ca3af", textDecorationLine: "line-through" },
  modalBuyBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 22, paddingVertical: 14, borderRadius: 16,
  },
  modalBuyText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  guaranteeBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  guaranteeText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
