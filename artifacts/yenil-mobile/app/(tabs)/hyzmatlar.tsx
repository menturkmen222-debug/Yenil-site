import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";
import { PessimisticButton } from "@/components/PessimisticButton";
import { SeamlessCheckout } from "@/components/BPCheckoutModal";

// ─── Tip ──────────────────────────────────────────────────────────────────────

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

// ─── Hyzmatlar katalogy ───────────────────────────────────────────────────────

interface ServiceItem {
  id:    string;
  icon:  IoniconsName;
  color: string;
  label: string;
  desc:  string;
  route: string;
}

const CATALOG: ServiceItem[] = [
  {
    id:    "kuryer",
    icon:  "bicycle-outline",
    color: "#0369a1",
    label: "Kuryer",
    desc:  "Tiz eltip bermek",
    route: "/kuryer",
  },
  {
    id:    "gatnaw",
    icon:  "car-outline",
    color: "#1B6B3A",
    label: "Gatnaw",
    desc:  "Ulag hyzmatlar",
    route: "/gatnaw",
  },
  {
    id:    "usta",
    icon:  "construct-outline",
    color: "#b45309",
    label: "Usta",
    desc:  "Ussatlar tapyň",
    route: "/bazar",
  },
  {
    id:    "bazar",
    icon:  "storefront-outline",
    color: "#7c3aed",
    label: "Sanly Bazar",
    desc:  "Onlaýn söwda",
    route: "/sanly-bazar-sell",
  },
  {
    id:    "pulgazan",
    icon:  "cash-outline",
    color: "#047857",
    label: "Pul Gazan",
    desc:  "BP gazanyň",
    route: "/pul-gazan",
  },
  {
    id:    "ebilim",
    icon:  "school-outline",
    color: "#4338ca",
    label: "E-Bilim",
    desc:  "Onlaýn kurslar",
    route: "/e-bilim",
  },
];

// ─── VIP Status maglumatlary ──────────────────────────────────────────────────

const VIP = {
  id:    "vip-status-v1",
  name:  "VIP Status",
  price: 50,
  desc:
    "VIP Status bilen profiliňizde altyn nyşan peýda bolýar, müşderileriňiz sizi has ynamly görýär we platformada ileri tutulýarsyňyz.",
  features: [
    { icon: "star-outline"              as IoniconsName, label: "Profilde altyn VIP nyşany" },
    { icon: "trending-up-outline"       as IoniconsName, label: "Abraý baly +10 bonus" },
    { icon: "shield-checkmark-outline"  as IoniconsName, label: "Tassyklanan hyzmatçy belgisi" },
    { icon: "flash-outline"             as IoniconsName, label: "Gözlegde ilki görkezilmek" },
  ],
} as const;

// ─── CatalogCard ──────────────────────────────────────────────────────────────

interface CatalogCardProps {
  item: ServiceItem;
}

function CatalogCard({ item }: CatalogCardProps) {
  const colors = useColors();
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(item.route as never);
      }}
      style={({ pressed }) => [
        cc.card,
        {
          backgroundColor: colors.card,
          borderColor:     colors.border,
          opacity:         pressed ? 0.82 : 1,
        },
      ]}
    >
      <View style={[cc.iconWrap, { backgroundColor: item.color + "15" }]}>
        <Ionicons name={item.icon} size={22} color={item.color} />
      </View>
      <Text style={[cc.label, { color: colors.foreground }]}>{item.label}</Text>
      <Text style={[cc.desc, { color: colors.mutedForeground }]}>{item.desc}</Text>
    </Pressable>
  );
}

const cc = StyleSheet.create({
  card: {
    width: "31%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 12, fontWeight: "800", textAlign: "center" },
  desc:  { fontSize: 10, textAlign: "center", lineHeight: 14 },
});

// ─── Esasy ekran ──────────────────────────────────────────────────────────────

export default function HyzmatlarScreen() {
  const colors    = useColors();
  const insets    = useSafeAreaInsets();
  const isWeb     = Platform.OS === "web";
  const { balanceBP } = useBonusPul();

  const [modalVisible, setModalVisible] = useState(false);

  const handleSuccess = useCallback(() => {
    setModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Üstünlikli!",
      "Töleg kabul edildi. VIP Status hasabyňyza goşuldy.",
      [{ text: "Bolýar", style: "default" }]
    );
  }, []);

  const handleOpenModal = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setModalVisible(true);
  }, []);

  const isInsufficient = balanceBP < VIP.price;

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>

      {/* ── Gradient sarlavha ─────────────────────────────────────────────── */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={[s.header, { paddingTop: (isWeb ? 0 : insets.top) + 14 }]}
      >
        <View>
          <Text style={s.headerTitle}>Hyzmatlar</Text>
          <Text style={s.headerSub}>Premium hyzmatlar dükany</Text>
        </View>
        <Pressable
          style={[s.balancePill, { backgroundColor: "rgba(255,255,255,0.18)" }]}
          onPress={() => {}}
        >
          <Ionicons name="wallet-outline" size={14} color="#fff" />
          <Text style={s.balancePillText}>
            {balanceBP.toLocaleString("tk-TM", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            BP
          </Text>
        </Pressable>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 100 }]}
      >

        {/* ── Hyzmatlar katalogy ──────────────────────────────────────────── */}
        <Text style={[s.sectionLabel, { color: colors.foreground }]}>
          Hyzmatlar katalogy
        </Text>
        <View style={s.catalogGrid}>
          {CATALOG.map((item) => (
            <CatalogCard key={item.id} item={item} />
          ))}
        </View>

        {/* ── Bölüji ─────────────────────────────────────────────────────── */}
        <View style={[s.divider, { backgroundColor: colors.border }]} />

        {/* ── VIP Status — öne çykarylan ─────────────────────────────────── */}
        <View style={s.featuredHeader}>
          <View style={[s.featuredBadge, { backgroundColor: "#fbbf2420" }]}>
            <Ionicons name="star" size={12} color="#f59e0b" />
            <Text style={s.featuredBadgeText}>Öne çykarylan</Text>
          </View>
        </View>

        <View
          style={[
            s.vipCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* Kartanyň banner bölegi */}
          <LinearGradient
            colors={["#0d4222", "#1B6B3A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.6 }}
            style={s.vipBanner}
          >
            {/* Bezeg daşky çemberler */}
            <View style={[s.deco, s.decoA]} />
            <View style={[s.deco, s.decoB]} />

            <View style={s.vipBannerLeft}>
              <View style={s.vipIconWrap}>
                <Ionicons name="shield-checkmark" size={32} color="#fbbf24" />
              </View>
              <View>
                <Text style={s.vipTitle}>{VIP.name}</Text>
                <Text style={s.vipSub}>Premium agzalyk</Text>
              </View>
            </View>

            <View style={s.vipPriceBadge}>
              <Text style={s.vipPriceNum}>{VIP.price}</Text>
              <Text style={s.vipPriceCurr}>BP</Text>
            </View>
          </LinearGradient>

          {/* Karta body */}
          <View style={s.vipBody}>
            <Text style={[s.vipDesc, { color: colors.mutedForeground }]}>
              {VIP.desc}
            </Text>

            {/* Aýratynlyklar */}
            <View
              style={[
                s.featBox,
                { backgroundColor: colors.muted, borderColor: colors.border },
              ]}
            >
              {VIP.features.map((f, i) => (
                <View
                  key={i}
                  style={[
                    s.featRow,
                    i < VIP.features.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      s.featIconWrap,
                      { backgroundColor: "#fbbf2418" },
                    ]}
                  >
                    <Ionicons name={f.icon} size={15} color="#f59e0b" />
                  </View>
                  <Text style={[s.featText, { color: colors.foreground }]}>
                    {f.label}
                  </Text>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={colors.primary}
                  />
                </View>
              ))}
            </View>

            {/* Töleg ýagdaýy satyr */}
            <View
              style={[
                s.payStatus,
                {
                  backgroundColor: isInsufficient
                    ? "#fef3c714"
                    : colors.primary + "10",
                  borderColor: isInsufficient
                    ? "#d9770635"
                    : colors.primary + "35",
                },
              ]}
            >
              <Ionicons
                name={isInsufficient ? "alert-circle-outline" : "checkmark-circle-outline"}
                size={15}
                color={isInsufficient ? "#d97706" : colors.primary}
              />
              <Text
                style={[
                  s.payStatusText,
                  { color: isInsufficient ? "#d97706" : colors.primary },
                ]}
              >
                {isInsufficient
                  ? `Balansyňyz ýetmeýär (${(VIP.price - balanceBP).toFixed(2)} BP kem). Töleg ekranynda bank / TMCell arkaly doldurylýar.`
                  : `Balansyňyz ${VIP.price} BP töleg üçin ýeterlik.`}
              </Text>
            </View>

            {/* Satyn almak düwmesi */}
            <PessimisticButton
              label={`${VIP.price} BP — Satyn Almak`}
              icon="cart-outline"
              onPress={handleOpenModal}
            />

            {/* Howpsuz töleg tekst */}
            <View style={s.secureRow}>
              <Ionicons
                name="lock-closed-outline"
                size={12}
                color={colors.mutedForeground}
              />
              <Text style={[s.secureText, { color: colors.mutedForeground }]}>
                Howpsuz BP tölegi — balans anyk aýrylar
              </Text>
            </View>
          </View>
        </View>

        {/* ── Ýakynda goşuljak hyzmatlar ─────────────────────────────────── */}
        <View
          style={[
            s.comingSoon,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={[s.comingSoonIcon, { backgroundColor: colors.primary + "12" }]}>
            <Ionicons name="rocket-outline" size={26} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.comingSoonTitle, { color: colors.foreground }]}>
              Başga hyzmatlar ýakyn wagtda
            </Text>
            <Text style={[s.comingSoonDesc, { color: colors.mutedForeground }]}>
              Täze premium hyzmatlar üznüksiz goşulýar
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* ── Seamless Checkout modaly ──────────────────────────────────────── */}
      <SeamlessCheckout
        visible={modalVisible}
        serviceName={VIP.name}
        serviceIcon="shield-checkmark-outline"
        serviceColor="#f59e0b"
        amount={VIP.price}
        serviceId={VIP.id}
        description="VIP Status — premium agzalyk"
        onSuccess={handleSuccess}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

// ─── Stiller ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  headerSub: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    marginTop: 3,
  },
  balancePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 2,
  },
  balancePillText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },

  // Mazmun
  content: {
    padding: 16,
    gap: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "800",
  },

  // Katalog grid
  catalogGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },

  // Featured badge
  featuredHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  featuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  featuredBadgeText: {
    color: "#f59e0b",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  // VIP karta
  vipCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#1B6B3A",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  vipBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    overflow: "hidden",
    position: "relative",
  },
  deco: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  decoA: { width: 130, height: 130, bottom: -55, left: -30 },
  decoB: { width: 90,  height: 90,  top: -35,   right: 60  },
  vipBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  vipIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  vipTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },
  vipSub: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
    marginTop: 2,
  },
  vipPriceBadge: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  vipPriceNum: {
    color: "#fbbf24",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 28,
  },
  vipPriceCurr: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
  },

  // Karta body
  vipBody: {
    padding: 18,
    gap: 14,
  },
  vipDesc: {
    fontSize: 14,
    lineHeight: 21,
  },

  // Features
  featBox: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  featRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  featIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  featText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },

  // Töleg ýagdaýy
  payStatus: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  payStatusText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
  },

  // Howpsuz satyr
  secureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: -4,
  },
  secureText: {
    fontSize: 11,
  },

  // Ýakynda
  comingSoon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
  },
  comingSoonIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  comingSoonTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 3,
  },
  comingSoonDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
});
