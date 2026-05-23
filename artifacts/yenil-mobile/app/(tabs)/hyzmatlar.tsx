import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";
import { PessimisticButton } from "@/components/PessimisticButton";
import { SeamlessCheckout } from "@/components/BPCheckoutModal";

// ─── VIP xyzmat maglumatlary ──────────────────────────────────────────────────

const VIP_SERVICE = {
  id:          "vip-status-v1",
  name:        "VIP Status",
  price:       50,
  description:
    "VIP Status bilen profiliňizde aýratyn nyşan peýda bolýar, müşderileriňiz sizi has ynamly görýär we Ýeňil platformasynda ileri tutulýarsyňyz.",
  features: [
    { icon: "star-outline"           as const, text: "Profilde altyn VIP nyşany" },
    { icon: "trending-up-outline"    as const, text: "Abraý baly +10 bonus" },
    { icon: "shield-checkmark-outline" as const, text: "Tassyklanan hyzmatçy belgisi" },
    { icon: "flash-outline"          as const, text: "Gözleg netijelerinde ilki görkezilmek" },
  ],
};

// ─── Esasy ekran ──────────────────────────────────────────────────────────────

export default function HyzmatlarScreen() {
  const colors     = useColors();
  const insets     = useSafeAreaInsets();
  const isWeb      = Platform.OS === "web";
  const { balanceBP } = useBonusPul();

  const [modalVisible, setModalVisible] = useState(false);

  const handleSuccess = () => {
    setModalVisible(false);
    Alert.alert(
      "Üstünlikli!",
      "Töleg kabul edildi. VIP Status hasabyňyza goşuldy.",
      [{ text: "Bolýar", style: "default" }]
    );
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* ── Gradient sarlavha ─────────────────────────────────────── */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={[s.header, { paddingTop: (isWeb ? 0 : insets.top) + 14 }]}
      >
        <View>
          <Text style={s.headerTitle}>Hyzmatlar</Text>
          <Text style={s.headerSub}>Premium hyzmatlar dükany</Text>
        </View>
        <View style={[s.balancePill, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
          <Ionicons name="wallet-outline" size={14} color="#fff" />
          <Text style={s.balancePillText}>
            {balanceBP.toLocaleString("tk-TM", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            BP
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        {/* ── Bölüm başlygy ────────────────────────────────────────── */}
        <Text style={[s.sectionLabel, { color: colors.foreground }]}>
          Premium hyzmatlar
        </Text>

        {/* ── VIP Status kartasy ───────────────────────────────────── */}
        <View
          style={[
            s.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* Kartanyň üst bölegi — gradient zolak */}
          <LinearGradient
            colors={["#0d4222", "#1B6B3A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.cardBanner}
          >
            <View style={s.cardBannerLeft}>
              <View style={s.cardIconWrap}>
                <Ionicons name="shield-checkmark" size={30} color="#fbbf24" />
              </View>
              <View>
                <Text style={s.cardBannerTitle}>{VIP_SERVICE.name}</Text>
                <Text style={s.cardBannerSub}>Premium agzalyk</Text>
              </View>
            </View>
            <View style={s.cardPriceBadge}>
              <Text style={s.cardPriceValue}>{VIP_SERVICE.price}</Text>
              <Text style={s.cardPriceCurrency}>BP</Text>
            </View>
          </LinearGradient>

          {/* Beýany */}
          <View style={s.cardBody}>
            <Text style={[s.cardDesc, { color: colors.mutedForeground }]}>
              {VIP_SERVICE.description}
            </Text>

            {/* Aýratynlyklar sanawy */}
            <View
              style={[
                s.featuresBox,
                { backgroundColor: colors.muted, borderColor: colors.border },
              ]}
            >
              {VIP_SERVICE.features.map((f, i) => (
                <View
                  key={i}
                  style={[
                    s.featureRow,
                    i < VIP_SERVICE.features.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      s.featureIconWrap,
                      { backgroundColor: colors.primary + "15" },
                    ]}
                  >
                    <Ionicons name={f.icon} size={16} color={colors.primary} />
                  </View>
                  <Text style={[s.featureText, { color: colors.foreground }]}>
                    {f.text}
                  </Text>
                </View>
              ))}
            </View>

            {/* Satyn almak düwmesi */}
            <View style={s.btnWrap}>
              <PessimisticButton
                label={`${VIP_SERVICE.price} BP — Satyn Almak`}
                icon="cart-outline"
                onPress={() => setModalVisible(true)}
              />
            </View>

            {/* Balans duýduryşy */}
            {balanceBP < VIP_SERVICE.price && (
              <View
                style={[
                  s.warningRow,
                  {
                    backgroundColor: colors.warning + "14",
                    borderColor: colors.warning + "35",
                  },
                ]}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color={colors.warning}
                />
                <Text style={[s.warningText, { color: colors.warning }]}>
                  Balansyňyz ýetmeýär. Töleg ekranynda goşmaça usullar
                  görkeziler.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Geljekde goşuljak hyzmatlar ──────────────────────────── */}
        <View
          style={[
            s.comingSoon,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons
            name="rocket-outline"
            size={28}
            color={colors.mutedForeground}
          />
          <Text style={[s.comingSoonText, { color: colors.mutedForeground }]}>
            Başga hyzmatlar ýakyn wagtda goşular
          </Text>
        </View>
      </ScrollView>

      {/* ── To'lov modaly ─────────────────────────────────────────── */}
      <SeamlessCheckout
        visible={modalVisible}
        serviceName={VIP_SERVICE.name}
        amount={VIP_SERVICE.price}
        serviceId={VIP_SERVICE.id}
        onSuccess={handleSuccess}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

// ─── Stiller ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },

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

  content: {
    padding: 16,
    gap: 16,
  },

  sectionLabel: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2,
  },

  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  cardBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  cardIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBannerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  cardBannerSub: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    marginTop: 2,
  },
  cardPriceBadge: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cardPriceValue: {
    color: "#fbbf24",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 26,
  },
  cardPriceCurrency: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  cardBody: {
    padding: 18,
    gap: 16,
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 21,
  },

  featuresBox: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  featureIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },

  btnWrap: { marginTop: 4 },

  warningRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
  },

  comingSoon: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 28,
    alignItems: "center",
    gap: 10,
  },
  comingSoonText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
