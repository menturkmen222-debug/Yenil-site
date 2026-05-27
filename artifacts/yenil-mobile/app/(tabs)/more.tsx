import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, Platform, Modal,
  Dimensions, ActivityIndicator, Animated,
} from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { DailyGiftModal } from "@/components/DailyGiftModal";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");


// ── Plans ──────────────────────────────────────────────────────────
const PLANS = [
  {
    id: "base",
    name: "Başlangyç",
    price: "Mugt",
    free: true,
    color: "#6366f1",
    bg: "#eef2ff",
    icon: "rocket-outline" as const,
    features: [
      "AI Agent günlik 3 sorag",
      "AI Kömekçi günlik 5 sorag",
      "Ýer Paýlaşmak günlik 3 gezek",
      "Çanly Ýer Paýlaşmak günlik 10/min",
    ],
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "35",
    free: false,
    color: "#10b981",
    bg: "#d1fae5",
    icon: "diamond-outline" as const,
    features: [
      "Başlangyçdaky ähli",
      "AI Agent günlik 10 sorag",
      "AI Kömekçi (Çäksiz)",
      "Ýer Paýlaşmak günlik 15 gezek",
      "Çanly Ýer Paýlaşmak günlik 6/sag",
    ],
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "65",
    free: false,
    color: "#f59e0b",
    bg: "#fef3c7",
    icon: "ribbon-outline" as const,
    features: [
      "Adyňyz ýanyna galyçka",
      "Ähli orunlarda iň ýokaryda",
      "Ulgamda nobatsyz ýerine ýetirmek",
      "AI Agent (Çäksiz)",
      "AI Kömekçi (Çäksiz)",
      "Ýer Paýlaşmak (Çäksiz)",
      "Çanly Ýer Paýlaşmak (Çäksiz)",
    ],
    popular: false,
  },
];

// ── Payment Modal ────────────────────────────────────────────────────
type PayPlan = typeof PLANS[number];
type PayMethod = "tmcell" | "bank";

function PaymentModal({
  plan, onClose, onSuccess,
}: {
  plan: PayPlan;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [method, setMethod] = useState<PayMethod>("tmcell");
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    setPaying(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise(r => setTimeout(r, 1600));
    setPaying(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSuccess();
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={pm.overlay} onPress={onClose} />
      <View style={[pm.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 28 }]}>
        <View style={[pm.handle, { backgroundColor: colors.border }]} />

        {/* Header */}
        <View style={pm.header}>
          <View style={[pm.planIconBg, { backgroundColor: plan.color + "20" }]}>
            <Ionicons name={plan.icon} size={24} color={plan.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[pm.planName, { color: colors.foreground }]}>{plan.name} Tarifi</Text>
            <Text style={[pm.planPrice, { color: plan.color }]}>
              {plan.free ? "Mugt" : `${plan.price} TMT / aý`}
            </Text>
          </View>
          <Pressable onPress={onClose} style={[pm.closeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="close" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <View style={[pm.divider, { backgroundColor: colors.border }]} />

        {/* Method */}
        <Text style={[pm.sectionLabel, { color: colors.mutedForeground }]}>TÖLEG USULY</Text>

        <Pressable
          onPress={() => { setMethod("tmcell"); Haptics.selectionAsync(); }}
          style={[pm.methodRow, {
            backgroundColor: method === "tmcell" ? "#0ea5e9" + "12" : colors.card,
            borderColor: method === "tmcell" ? "#0ea5e9" : colors.border,
          }]}
        >
          <View style={[pm.methodIcon, { backgroundColor: "#0ea5e912" }]}>
            <Ionicons name="phone-portrait-outline" size={20} color="#0ea5e9" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[pm.methodName, { color: colors.foreground }]}>TMCell balans</Text>
            <Text style={[pm.methodDesc, { color: colors.mutedForeground }]}>Mobil balansdan göni töleg</Text>
          </View>
          <View style={[pm.radio, {
            borderColor: method === "tmcell" ? "#0ea5e9" : colors.border,
            backgroundColor: method === "tmcell" ? "#0ea5e9" : "transparent",
          }]}>
            {method === "tmcell" && <View style={pm.radioDot} />}
          </View>
        </Pressable>

        <Pressable
          onPress={() => { setMethod("bank"); Haptics.selectionAsync(); }}
          style={[pm.methodRow, {
            backgroundColor: method === "bank" ? "#8b5cf6" + "12" : colors.card,
            borderColor: method === "bank" ? "#8b5cf6" : colors.border,
          }]}
        >
          <View style={[pm.methodIcon, { backgroundColor: "#8b5cf612" }]}>
            <Ionicons name="card-outline" size={20} color="#8b5cf6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[pm.methodName, { color: colors.foreground }]}>Bank kartasy</Text>
            <Text style={[pm.methodDesc, { color: colors.mutedForeground }]}>Milli bank kartasy arkaly</Text>
          </View>
          <View style={[pm.radio, {
            borderColor: method === "bank" ? "#8b5cf6" : colors.border,
            backgroundColor: method === "bank" ? "#8b5cf6" : "transparent",
          }]}>
            {method === "bank" && <View style={pm.radioDot} />}
          </View>
        </Pressable>

        {/* Summary */}
        <View style={[pm.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[pm.summaryLabel, { color: colors.mutedForeground }]}>Jemi töleg</Text>
          <Text style={[pm.summaryAmount, { color: colors.foreground }]}>
            {plan.free ? "0.00 TMT" : `${plan.price}.00 TMT`}
          </Text>
        </View>

        {/* Confirm */}
        <Pressable
          onPress={handlePay}
          disabled={paying}
          style={({ pressed }) => [pm.confirmBtn, { backgroundColor: plan.color, opacity: pressed || paying ? 0.8 : 1 }]}
        >
          {paying ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={pm.confirmText}>Tassyklanýar...</Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name={plan.free ? "checkmark-circle-outline" : "lock-closed-outline"} size={18} color="#fff" />
              <Text style={pm.confirmText}>{plan.free ? "Mugt işe başla" : `${plan.price} TMT Töle`}</Text>
            </View>
          )}
        </Pressable>

        <Text style={[pm.footnote, { color: colors.mutedForeground }]}>
          {plan.free
            ? "Tölegsiz. Islän wagtyňyz ýatyrып bilersiňiz."
            : "Töleg tassyklanansoň tarifyňyz derhal işjeňleşer."}
        </Text>
      </View>
    </Modal>
  );
}

// ── Success Modal ────────────────────────────────────────────────────
function SuccessModal({ plan, onClose }: { plan: PayPlan; onClose: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const scale = React.useRef(new Animated.Value(0.6)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 160 }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={sc.overlay}>
        <Animated.View style={[sc.card, { backgroundColor: colors.card, transform: [{ scale }], opacity }]}>
          <View style={[sc.iconRing, { borderColor: plan.color + "40", backgroundColor: plan.color + "15" }]}>
            <View style={[sc.iconInner, { backgroundColor: plan.color }]}>
              <Ionicons name="checkmark" size={32} color="#fff" />
            </View>
          </View>
          <Text style={[sc.title, { color: colors.foreground }]}>Gutlaýarys! 🎉</Text>
          <Text style={[sc.planName, { color: plan.color }]}>{plan.name} tarifi işjeňleşdi</Text>
          <Text style={[sc.desc, { color: colors.mutedForeground }]}>
            {plan.free
              ? "Başlangyç mümkinçiliklerden peýdalanyp başlap bilersiňiz."
              : "Ähli premium mümkinçilikler elýeterli boldy."}
          </Text>
          <Pressable
            onPress={onClose}
            style={[sc.btn, { backgroundColor: plan.color }]}
          >
            <Text style={sc.btnText}>Dowam et</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Tarif Sheet ──────────────────────────────────────────────────────
function TarifSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [payPlan, setPayPlan] = useState<PayPlan | null>(null);
  const [successPlan, setSuccessPlan] = useState<PayPlan | null>(null);

  const handleSelect = (plan: PayPlan) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPayPlan(plan);
  };

  const handleSuccess = () => {
    const p = payPlan;
    setPayPlan(null);
    setSuccessPlan(p);
  };

  return (
    <>
      {payPlan && (
        <PaymentModal
          plan={payPlan}
          onClose={() => setPayPlan(null)}
          onSuccess={handleSuccess}
        />
      )}
      {successPlan && (
        <SuccessModal
          plan={successPlan}
          onClose={() => { setSuccessPlan(null); onClose(); }}
        />
      )}

      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <Pressable style={ts.overlay} onPress={onClose} />
        <View style={[ts.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>
          <View style={[ts.handle, { backgroundColor: colors.border }]} />

          {/* Sheet header */}
          <View style={ts.sheetHead}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={ts.crownBox}>
                <Ionicons name="ribbon" size={18} color="#f59e0b" />
              </View>
              <View>
                <Text style={[ts.sheetTitle, { color: colors.foreground }]}>Tarif saýlaň</Text>
                <Text style={[ts.sheetSub, { color: colors.mutedForeground }]}>Özüňize laýyk meýilnama</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={[ts.sheetClose, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="close" size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, gap: 12 }}>
            {PLANS.map((plan) => {
              const isPopular = plan.popular;
              const isPremium = plan.id === "premium";
              const cardBg = isPremium ? "#0f0a00" : isPopular ? plan.color : colors.card;
              const textColor = (isPopular || isPremium) ? "#fff" : colors.foreground;
              const subColor = (isPopular || isPremium) ? "rgba(255,255,255,0.65)" : colors.mutedForeground;

              return (
                <View
                  key={plan.id}
                  style={[ts.planCard, {
                    backgroundColor: cardBg,
                    borderColor: isPremium ? plan.color + "60" : isPopular ? plan.color : colors.border,
                    shadowColor: plan.color,
                    shadowOpacity: (isPopular || isPremium) ? 0.3 : 0.05,
                    shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
                    elevation: (isPopular || isPremium) ? 10 : 1,
                  }]}
                >
                  {/* Decorative orb for premium */}
                  {isPremium && (
                    <>
                      <View style={[ts.premOrb, { top: -30, right: -30, backgroundColor: plan.color + "25", width: 100, height: 100 }]} />
                      <View style={[ts.premOrb, { bottom: -20, left: -20, backgroundColor: plan.color + "15", width: 80, height: 80 }]} />
                    </>
                  )}

                  {/* Chip */}
                  {(isPopular || isPremium) && (
                    <View style={[ts.chip, { backgroundColor: isPopular ? "rgba(255,255,255,0.2)" : plan.color + "35" }]}>
                      <Ionicons name={isPopular ? "flame" : "star"} size={11} color={isPopular ? "#fff" : plan.color} />
                      <Text style={[ts.chipText, { color: isPopular ? "#fff" : plan.color }]}>
                        {isPopular ? "Meşhur saýlaw" : "PREMIUM"}
                      </Text>
                    </View>
                  )}

                  {/* Plan header row */}
                  <View style={ts.planHeaderRow}>
                    <View style={[ts.planIconBg, {
                      backgroundColor: (isPopular || isPremium) ? "rgba(255,255,255,0.15)" : plan.bg,
                    }]}>
                      <Ionicons name={plan.icon} size={22} color={(isPopular || isPremium) ? "#fff" : plan.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[ts.planName, { color: textColor }]}>{plan.name}</Text>
                      {plan.free ? (
                        <View style={[ts.freeBadge, { backgroundColor: plan.color + "20" }]}>
                          <Text style={[ts.freeBadgeText, { color: plan.color }]}>MUGT</Text>
                        </View>
                      ) : (
                        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 3 }}>
                          <Text style={[ts.planPrice, { color: (isPopular || isPremium) ? "#fff" : plan.color }]}>
                            {plan.price}
                          </Text>
                          <Text style={[ts.planPer, { color: subColor }]}>TMT/aý</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Divider */}
                  <View style={[ts.divider, { backgroundColor: (isPopular || isPremium) ? "rgba(255,255,255,0.12)" : colors.border }]} />

                  {/* Features */}
                  <View style={{ gap: 7, marginBottom: 16 }}>
                    {plan.features.map((f, fi) => (
                      <View key={fi} style={ts.featureRow}>
                        <View style={[ts.checkCircle, {
                          backgroundColor: (isPopular || isPremium) ? "rgba(255,255,255,0.15)" : plan.color + "18",
                        }]}>
                          <Ionicons name="checkmark" size={11} color={(isPopular || isPremium) ? "#fff" : plan.color} />
                        </View>
                        <Text style={[ts.featureText, { color: subColor }]}>{f}</Text>
                      </View>
                    ))}
                  </View>

                  {/* CTA Button */}
                  <Pressable
                    onPress={() => handleSelect(plan)}
                    style={({ pressed }) => [ts.planBtn, {
                      backgroundColor: isPopular ? "#fff"
                        : isPremium ? plan.color
                        : plan.color + "18",
                      borderWidth: isPopular ? 0 : isPremium ? 0 : 1.5,
                      borderColor: plan.color,
                      opacity: pressed ? 0.82 : 1,
                      shadowColor: plan.color,
                      shadowOpacity: (isPopular || isPremium) ? 0.35 : 0,
                      shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
                      elevation: (isPopular || isPremium) ? 6 : 0,
                    }]}
                  >
                    <Ionicons
                      name={plan.free ? "rocket-outline" : isPopular ? "diamond-outline" : "ribbon-outline"}
                      size={16}
                      color={isPopular ? plan.color : isPremium ? "#fff" : plan.color}
                    />
                    <Text style={[ts.planBtnText, {
                      color: isPopular ? plan.color : isPremium ? "#fff" : plan.color,
                    }]}>
                      {plan.free ? "Mugt başla" : isPopular ? "Pro almak" : "Premium almak"}
                    </Text>
                  </Pressable>
                </View>
              );
            })}

            <Text style={[ts.footNote, { color: colors.mutedForeground }]}>
              Tölegler her aýyň başynda ýazylýar. Islän wagtyňyz ýatyryp bilersiňiz.
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

// ── Grouped row component ──────────────────────────────────────────
function GroupRow({
  icon, iconBg, iconColor, label, desc, badge, badgeBg, badgeColor,
  last = false, onPress, rightEl, colors,
}: {
  icon: string; iconBg: string; iconColor: string;
  label: string; desc?: string;
  badge?: string; badgeBg?: string; badgeColor?: string;
  last?: boolean; onPress?: () => void; rightEl?: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [gr.row, { opacity: pressed ? 0.7 : 1 }]}
    >
      {/* Icon */}
      <View style={[gr.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>

      {/* Text */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
          <Text style={[gr.label, { color: colors.foreground }]}>{label}</Text>
          {badge && (
            <View style={[gr.badge, { backgroundColor: badgeBg ?? "#f59e0b" }]}>
              <Text style={[gr.badgeText, { color: badgeColor ?? "#fff" }]}>{badge}</Text>
            </View>
          )}
        </View>
        {desc && <Text style={[gr.desc, { color: colors.mutedForeground }]}>{desc}</Text>}
      </View>

      {/* Right element or chevron */}
      {rightEl ?? (
        <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground + "80"} />
      )}

      {/* Separator */}
      {!last && <View style={[gr.sep, { backgroundColor: colors.border, left: 58 }]} />}
    </Pressable>
  );
}

// ── Main screen ────────────────────────────────────────────────────
export default function MoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [tarifOpen, setTarifOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);

  const topPad = (isWeb ? 0 : insets.top);

  return (
    <>
      <TarifSheet visible={tarifOpen} onClose={() => setTarifOpen(false)} />
      <DailyGiftModal visible={giftOpen} onClose={() => setGiftOpen(false)} />

      <ScrollView
        style={[s.root, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Large title header ── */}
        <LinearGradient
          colors={[colors.headerGradientStart, colors.headerGradientEnd]}
          style={[s.header, { paddingTop: topPad + 16 }]}
        >
          <Text style={[s.largeTitle, { color: "#fff" }]}>Has köp</Text>
          <Text style={[s.largeSub, { color: "rgba(255,255,255,0.75)" }]}>Ähli hyzmatlar & sazlamalar</Text>
        </LinearGradient>

        {/* ── AI HERO CARD ── */}
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/ai-chat" as Href); }}
          style={({ pressed }) => [s.aiHero, { opacity: pressed ? 0.92 : 1 }]}
        >
          {/* Gradient background layer */}
          <View style={s.aiHeroBg} />

          <View style={s.aiHeroContent}>
            {/* Left: avatar + info */}
            <View style={s.aiHeroLeft}>
              <View style={s.aiAvatarOuter}>
                <View style={s.aiAvatarInner}>
                  <Ionicons name="sparkles-outline" size={26} color="#6366f1" />
                </View>
                <View style={s.aiOnlineDot} />
              </View>
              <View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                  <Text style={s.aiHeroTitle}>AI Kömekçi</Text>
                  <View style={s.betaChip}>
                    <Text style={s.betaChipText}>BETA</Text>
                  </View>
                </View>
                <Text style={s.aiHeroSub}>Intellektual akylly kömekçi</Text>
              </View>
            </View>

            {/* Right: action */}
            <View style={s.aiHeroRight}>
              <View style={s.aiFlashBadge}>
                <Ionicons name="flash" size={14} color="#6366f1" />
                <Text style={s.aiFlashText}>Çalt jogap</Text>
              </View>
              <View style={s.aiChevron}>
                <Ionicons name="arrow-forward" size={16} color="#6366f1" />
              </View>
            </View>
          </View>

          {/* Bottom: chips */}
          <View style={s.aiChipsRow}>
            {["Sorag ber", "Kömek al", "Maslakat", "Syn et"].map(c => (
              <View key={c} style={s.aiChip}>
                <Text style={s.aiChipText}>{c}</Text>
              </View>
            ))}
          </View>
        </Pressable>

        {/* ── SECTION: Hyzmatlar ── */}
        <Text style={[s.groupTitle, { color: colors.mutedForeground }]}>HYZMATLAR</Text>

        {/* Pul Gazan card — top of HYZMATLAR */}
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/pul-gazan" as Href); }}
          style={({ pressed }) => [pulGazanCard.wrap, { opacity: pressed ? 0.92 : 1 }]}
        >
          <View style={pulGazanCard.gradient}>
            <View style={pulGazanCard.iconWrap}>
              <Ionicons name="cash-outline" size={24} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={pulGazanCard.title}>Pul Gazan</Text>
                <View style={pulGazanCard.hotBadge}>
                  <Ionicons name="flame" size={9} color="#fff" />
                  <Text style={pulGazanCard.hotText}>HOT</Text>
                </View>
              </View>
              <Text style={pulGazanCard.desc}>7 usul bilen BP gazanyň — Agent, Referal, Kuryer we beýlekiler</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
          </View>
        </Pressable>

        <View style={[s.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <GroupRow
            icon="storefront-outline"
            iconBg="#f0fdf4"
            iconColor="#10b981"
            label="Hyzmatlar"
            desc="Ähli hyzmatlary gör we öz hyzmatyňy teklip et"
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/hyzmatlar" as Href); }}
            colors={colors}
          />
          <GroupRow
            icon="location-outline"
            iconBg="#eef2ff"
            iconColor="#6366f1"
            label="Ýer paýlaşma"
            desc="Canlý ýer yzarlama we link paýlaşma"
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/konum" as Href); }}
            colors={colors}
          />
          <GroupRow
            icon="bulb-outline"
            iconBg="#fef3c7"
            iconColor="#f59e0b"
            label="Teklip ibermek"
            desc="Öz hyzmatyňyzy teklip ediň"
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/teklip" as Href); }}
            colors={colors}
          />
          <GroupRow
            icon="gift-outline"
            iconBg="#ecfdf5"
            iconColor="#10b981"
            label="Gündelik Sowgat"
            desc="Her 24 sagatda 1 gezek mugt BP sowgat"
            badge="TÄZE"
            badgeBg="#10b981"
            badgeColor="#fff"
            last
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setGiftOpen(true); }}
            colors={colors}
          />
        </View>

        {/* ── TARIF PREMIUM CARD ── */}
        <Text style={[s.groupTitle, { color: colors.mutedForeground }]}>HASAP</Text>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setTarifOpen(true); }}
          style={({ pressed }) => [s.tarifCard, { transform: [{ scale: pressed ? 0.975 : 1 }] }]}
        >
          {/* Decorative orbs */}
          <View style={[s.tarifOrb, { top: -40, right: -40, width: 130, height: 130, backgroundColor: "#10b98122" }]} />
          <View style={[s.tarifOrb, { bottom: -30, left: -20, width: 100, height: 100, backgroundColor: "#8b5cf618" }]} />
          <View style={[s.tarifOrb, { top: 20, left: 60, width: 60, height: 60, backgroundColor: "#f59e0b0e" }]} />

          {/* Top: icon + title + badge */}
          <View style={s.tarifTop}>
            <View style={s.tarifIconBox}>
              <View style={s.tarifIconGlow} />
              <Ionicons name="ribbon" size={26} color="#f59e0b" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.tarifTitle}>Tarif Meýilnamasy</Text>
              <Text style={s.tarifSub}>Mugt · Pro · Premium</Text>
            </View>
            <View style={s.tarifCurrentBadge}>
              <View style={s.tarifCurrentDot} />
              <Text style={s.tarifCurrentText}>Başlangyç</Text>
            </View>
          </View>

          {/* Plan tier row */}
          <View style={s.tarifTierRow}>
            {PLANS.map(p => (
              <View key={p.id} style={[s.tarifTier, { borderColor: p.color + "50", backgroundColor: p.color + "15" }]}>
                <Ionicons name={p.icon} size={13} color={p.color} />
                <Text style={[s.tarifTierText, { color: p.color }]}>{p.name}</Text>
                {p.free && <Text style={[s.tarifTierFree, { color: p.color }]}>mugt</Text>}
              </View>
            ))}
          </View>

          {/* Divider */}
          <View style={s.tarifDivider} />

          {/* Feature hints */}
          <View style={{ gap: 8, marginBottom: 18 }}>
            {[
              { icon: "sparkles-outline" as const, color: "#8b5cf6", text: "AI Agent & AI Kömekçi hyzmatlary" },
              { icon: "location-outline" as const, color: "#10b981", text: "Ýer Paýlaşmak & Çanly ýer görkezmek" },
              { icon: "star-outline" as const, color: "#f59e0b", text: "Premium: adyňyz öňde, nobatsyz hyzmat" },
            ].map((f, i) => (
              <View key={i} style={s.tarifFeatureRow}>
                <View style={[s.tarifCheckCircle, { backgroundColor: f.color + "18" }]}>
                  <Ionicons name={f.icon} size={12} color={f.color} />
                </View>
                <Text style={s.tarifFeatureText}>{f.text}</Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          <View style={s.tarifCta}>
            <LinearGradient
              colors={["#10b981", "#059669"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.tarifCtaGradient}
            >
              <Ionicons name="diamond-outline" size={17} color="#fff" />
              <Text style={s.tarifCtaText}>Tarif saýlamak</Text>
              <Ionicons name="chevron-forward" size={17} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          </View>
        </Pressable>

      </ScrollView>
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────


const ts = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingTop: 10, maxHeight: SCREEN_H * 0.92,
  },
  handle: { width: 42, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  sheetHead: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, marginBottom: 18,
  },
  crownBox: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: "#fef3c7",
    alignItems: "center", justifyContent: "center",
  },
  sheetTitle: { fontSize: 21, fontWeight: "800", letterSpacing: -0.3 },
  sheetSub: { fontSize: 12, marginTop: 1 },
  sheetClose: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },

  /* Plan card */
  planCard: {
    borderRadius: 24, padding: 18, borderWidth: 1.5,
    overflow: "hidden", position: "relative",
  },
  premOrb: { position: "absolute", borderRadius: 999 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    alignSelf: "flex-start", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 14,
  },
  chipText: { fontSize: 11, fontWeight: "800" },

  planHeaderRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  planIconBg: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  planName: { fontSize: 17, fontWeight: "800", marginBottom: 3 },
  freeBadge: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  freeBadgeText: { fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  planPrice: { fontSize: 28, fontWeight: "800", lineHeight: 32 },
  planPer: { fontSize: 13 },

  divider: { height: 1, marginVertical: 14 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkCircle: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  featureText: { fontSize: 13.5, flex: 1, lineHeight: 19 },

  planBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 20,
  },
  planBtnText: { fontWeight: "800", fontSize: 15 },

  footNote: { textAlign: "center", fontSize: 12, lineHeight: 17, paddingHorizontal: 8 },
});

const gr = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 13, gap: 12,
    position: "relative",
  },
  iconWrap: { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 15, fontWeight: "600" },
  desc: { fontSize: 12, marginTop: 1 },
  badge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: "800" },
  sep: { position: "absolute", bottom: 0, right: 0, height: 0.5, backgroundColor: "transparent" },
});

const pulGazanCard = StyleSheet.create({
  wrap: {
    marginHorizontal: 16, marginBottom: 10, borderRadius: 18, overflow: "hidden",
    shadowColor: "#059669", shadowOpacity: 0.22, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  gradient: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 18,
    backgroundColor: "#059669",
  },
  iconWrap: {
    width: 48, height: 48, borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center", justifyContent: "center",
  },
  title: { color: "#fff", fontSize: 17, fontWeight: "800" },
  desc: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 3, lineHeight: 17 },
  hotBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#ef4444", borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  hotText: { color: "#fff", fontSize: 8, fontWeight: "800" },
});

const s = StyleSheet.create({
  root: { flex: 1 },

  // Large title header (iOS style)
  header: { paddingHorizontal: 20, paddingBottom: 6 },
  largeTitle: { fontSize: 34, fontWeight: "800", letterSpacing: -0.8 },
  largeSub: { fontSize: 13, marginTop: 4 },

  // Section group title
  groupTitle: {
    fontSize: 11, fontWeight: "700", letterSpacing: 0.8,
    marginLeft: 20, marginTop: 28, marginBottom: 8,
  },
  group: {
    marginHorizontal: 16, borderRadius: 16,
    borderWidth: 1, overflow: "hidden",
  },

  // AI Hero card
  aiHero: {
    marginHorizontal: 16, marginTop: 20,
    borderRadius: 22, overflow: "hidden",
    backgroundColor: "#6366f1",
    shadowColor: "#6366f1",
    shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  aiHeroBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#6366f1",
  },
  aiHeroContent: {
    flexDirection: "row", alignItems: "center",
    padding: 18, gap: 14,
  },
  aiHeroLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  aiAvatarOuter: { position: "relative" },
  aiAvatarInner: {
    width: 50, height: 50, borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },
  aiOnlineDot: {
    position: "absolute", bottom: 1, right: 1,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: "#4ade80", borderWidth: 2, borderColor: "#6366f1",
  },
  aiHeroTitle: { color: "#fff", fontSize: 17, fontWeight: "800" },
  aiHeroSub: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 },
  betaChip: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
  },
  betaChipText: { color: "#fff", fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  aiHeroRight: { alignItems: "center", gap: 8 },
  aiFlashBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#fff", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  aiFlashText: { color: "#6366f1", fontSize: 11, fontWeight: "700" },
  aiChevron: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },
  aiChipsRow: {
    flexDirection: "row", gap: 7,
    paddingHorizontal: 18, paddingBottom: 16, flexWrap: "wrap",
  },
  aiChip: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  aiChipText: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "600" },

  // Tarif entry card
  tarifCard: {
    marginHorizontal: 16, borderRadius: 26, overflow: "hidden",
    backgroundColor: "#0d1117",
    shadowColor: "#10b981",
    shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: { width: 0, height: 10 },
    elevation: 12, padding: 20,
  },
  tarifOrb: { position: "absolute", borderRadius: 999 },
  tarifTop: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 18 },
  tarifIconBox: {
    width: 54, height: 54, borderRadius: 17,
    backgroundColor: "#1a1000",
    borderWidth: 1.5, borderColor: "#f59e0b30",
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  tarifIconGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 17,
    backgroundColor: "#f59e0b0c",
  },
  tarifTitle: { color: "#fff", fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  tarifSub: { color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 3 },
  tarifCurrentBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
  },
  tarifCurrentDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#4ade80" },
  tarifCurrentText: { color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "700" },

  tarifTierRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  tarifTier: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 4, borderRadius: 12, paddingVertical: 7,
    borderWidth: 1, flexWrap: "wrap",
  },
  tarifTierText: { fontSize: 11, fontWeight: "800" },
  tarifTierFree: { fontSize: 9, fontWeight: "700", opacity: 0.8 },

  tarifDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginBottom: 14 },
  tarifFeatureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  tarifCheckCircle: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  tarifFeatureText: { color: "rgba(255,255,255,0.6)", fontSize: 13, flex: 1, lineHeight: 18 },

  tarifCta: { borderRadius: 16, overflow: "hidden", marginTop: 2 },
  tarifCtaGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 15, borderRadius: 16,
  },
  tarifCtaText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  // Version
  versionRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 7, marginTop: 28,
  },
  versionDot: { width: 6, height: 6, borderRadius: 3 },
  versionText: { fontSize: 12 },
});

// ── Payment Modal styles ─────────────────────────────────────────────
const pm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingTop: 10, paddingHorizontal: 20,
  },
  handle: { width: 42, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 22 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
  planIconBg: { width: 50, height: 50, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  planName: { fontSize: 17, fontWeight: "800" },
  planPrice: { fontSize: 15, fontWeight: "700", marginTop: 2 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  divider: { height: 1, marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.7, marginBottom: 10 },
  methodRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 16, padding: 14, borderWidth: 1.5, marginBottom: 10,
  },
  methodIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  methodName: { fontSize: 15, fontWeight: "700" },
  methodDesc: { fontSize: 12, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#fff" },
  summary: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderRadius: 14, padding: 14, borderWidth: 1, marginTop: 6, marginBottom: 16,
  },
  summaryLabel: { fontSize: 13, fontWeight: "600" },
  summaryAmount: { fontSize: 22, fontWeight: "900" },
  confirmBtn: {
    borderRadius: 16, paddingVertical: 16,
    alignItems: "center", justifyContent: "center",
    shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  confirmText: { color: "#fff", fontSize: 17, fontWeight: "800" },
  footnote: { textAlign: "center", fontSize: 12, lineHeight: 17, marginTop: 12 },
});

// ── Success Modal styles ─────────────────────────────────────────────
const sc = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center", justifyContent: "center", padding: 32,
  },
  card: {
    width: "100%", borderRadius: 28, padding: 32,
    alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 }, elevation: 16,
  },
  iconRing: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 3, alignItems: "center", justifyContent: "center",
    marginBottom: 22,
  },
  iconInner: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 24, fontWeight: "900", marginBottom: 6, letterSpacing: -0.5 },
  planName: { fontSize: 16, fontWeight: "800", marginBottom: 12 },
  desc: { textAlign: "center", fontSize: 14, lineHeight: 20, marginBottom: 28 },
  btn: {
    width: "100%", borderRadius: 16, paddingVertical: 15,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});

