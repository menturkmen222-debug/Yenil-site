import React, { useState, useRef } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  TextInput, Alert, Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { PessimisticButton } from "@/components/PessimisticButton";
import { saveOrder } from "@/lib/firebase";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useRates } from "@/contexts/RatesContext";

export default function HelpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const rates = useRates();
  const isWeb = Platform.OS === "web";
  const scrollRef = useRef<ScrollView>(null);

  const [expanded, setExpanded] = useState<number | null>(null);
  const [question, setQuestion] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const faqs = [
    {
      q: "Bilet satyn almak näçe wagt alýar?",
      a: "Sargydyňyz kabul edilenden soň 1–4 sagadyň içinde bilet SMS arkaly iberilýär.",
      icon: "time-outline" as const,
    },
    {
      q: "Nähili töleg usullary bar?",
      a: "TMCell arkaly pul geçiriş, SMS tassyklamasy ýa-da Bonus Pul arkaly töleg edip bilersiňiz.",
      icon: "card-outline" as const,
    },
    {
      q: "Bonus pul nähili almaly?",
      a: "TMCell sahypasyna geçip, bonus pul satyn alyň. Töleg edenden soň balansynyz doldurylar.",
      icon: "wallet-outline" as const,
    },
    {
      q: "Ýalňyş maglumatlary girizendim, näme etmeli?",
      a: "Dessine biziň bilen habarlaşyň: +993 71 789091 ýa-da +993 64 629487.",
      icon: "alert-circle-outline" as const,
    },
    {
      q: "Daşary ýurt walýutasy näçeden çalşylýar?",
      a: `Satyn almak: 1 USD = ${rates.usd_buy_tmt} TMT. Satmak: 1 USD = ${rates.usd_sell_tmt} TMT.`,
      icon: "swap-horizontal-outline" as const,
    },
    {
      q: "Içerki ulgamlar nähili işleýär?",
      a: "Aydym, Hiňlen, Belet üçin premium abonelik satyn almak mümkin. Töleg edip, SMS arkaly bron koduňyzy iberiň.",
      icon: "apps-outline" as const,
    },
  ];

  async function submitQuestion() {
    if (!question.trim() || !phone.trim()) {
      Alert.alert("Ýalňyşlyk", "Sorag we telefon belgiňizi giriziň!");
      return;
    }
    setLoading(true);
    try {
      await saveOrder("user-questions", { question, phone });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSent(true);
      setQuestion("");
      setPhone("");
    } catch {
      Alert.alert("Ýalňyşlyk", "Sorag ibermek başa barmady, täzeden synanşyň.");
    } finally {
      setLoading(false);
    }
  }

  function scrollToForm() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>

      {/* ── Header ─────────────────────────────────────── */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={[s.header, { paddingTop: (isWeb ? 0 : insets.top) + 10 }]}
      >
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={20} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Kömek merkezi</Text>
          <Text style={s.headerSub}>Soralyňyzy çözýäris</Text>
        </View>
        <View style={s.headerBadge}>
          <View style={s.headerBadgeDot} />
          <Text style={s.headerBadgeText}>Onlaýn</Text>
        </View>
      </LinearGradient>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 110 : 110 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Contact options ───────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(350).delay(60)}>
          <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>GOLDAW GÖRNÜŞLERI</Text>
          <View style={s.contactRow}>

            {/* AI card */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/ai-chat");
              }}
              style={({ pressed }) => [s.contactCard, { opacity: pressed ? 0.88 : 1 }]}
            >
              <LinearGradient
                colors={["#0d9488", "#0891b2"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={s.contactCardGrad}
              >
                <View style={s.contactCardIcon}>
                  <Ionicons name="sparkles" size={22} color="#fff" />
                </View>
                <Text style={s.contactCardTitle}>Ýeňil AI</Text>
                <Text style={s.contactCardDesc}>Soralyňyza hut{"\n"}häzir jogap berer</Text>
                <View style={s.contactCardBadge}>
                  <View style={s.contactCardBadgeDot} />
                  <Text style={s.contactCardBadgeText}>Derrew</Text>
                </View>
              </LinearGradient>
            </Pressable>

            {/* Admin card */}
            <Pressable
              onPress={scrollToForm}
              style={({ pressed }) => [s.contactCard, { opacity: pressed ? 0.88 : 1 }]}
            >
              <LinearGradient
                colors={["#4f46e5", "#7c3aed"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={s.contactCardGrad}
              >
                <View style={s.contactCardIcon}>
                  <MaterialCommunityIcons name="headset" size={22} color="#fff" />
                </View>
                <Text style={s.contactCardTitle}>Admin goldawy</Text>
                <Text style={s.contactCardDesc}>Işgärlerimiz{"\n"}jogap berer</Text>
                <View style={[s.contactCardBadge, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
                  <Ionicons name="time-outline" size={10} color="rgba(255,255,255,0.9)" />
                  <Text style={s.contactCardBadgeText}>6 sagadyň içinde</Text>
                </View>
              </LinearGradient>
            </Pressable>

          </View>
        </Animated.View>

        {/* ── FAQ section ──────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(350).delay(120)}>
          <Text style={[s.sectionLabel, { color: colors.mutedForeground, marginTop: 24 }]}>KÖP SORALÝAN SORAGLAR</Text>

          <View style={[s.faqGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {faqs.map((f, i) => (
              <View key={i}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setExpanded(expanded === i ? null : i);
                  }}
                  style={({ pressed }) => [s.faqRow, { opacity: pressed ? 0.8 : 1 }]}
                >
                  <View style={[s.faqIconWrap, { backgroundColor: colors.primary + "15" }]}>
                    <Ionicons name={f.icon} size={16} color={colors.primary} />
                  </View>
                  <Text style={[s.faqQ, { color: colors.foreground }]}>{f.q}</Text>
                  <Ionicons
                    name={expanded === i ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={expanded === i ? colors.primary : colors.mutedForeground}
                  />
                </Pressable>

                {expanded === i && (
                  <Animated.View entering={FadeInDown.duration(200)} style={[s.faqAnswer, { backgroundColor: colors.primary + "08" }]}>
                    <Text style={[s.faqA, { color: colors.mutedForeground }]}>{f.a}</Text>
                  </Animated.View>
                )}

                {i < faqs.length - 1 && (
                  <View style={[s.faqDivider, { backgroundColor: colors.border }]} />
                )}
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── Send question form ───────────────────────── */}
        <Animated.View entering={FadeInUp.duration(350).delay(180)}>
          <View style={[s.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>

            {/* Form header */}
            <View style={[s.formHeader, { borderBottomColor: colors.border }]}>
              <View style={[s.formHeaderIcon, { backgroundColor: "#4f46e5" + "18" }]}>
                <MaterialCommunityIcons name="headset" size={18} color="#4f46e5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.formHeaderTitle, { color: colors.foreground }]}>Admin bilen habarlaş</Text>
                <Text style={[s.formHeaderSub, { color: colors.mutedForeground }]}>
                  Soralyňyzy ýollaň — 6 sagatyň içinde jogap bereris
                </Text>
              </View>
              <View style={[s.formTimeBadge, { backgroundColor: "#4f46e5" + "12", borderColor: "#4f46e5" + "30" }]}>
                <Ionicons name="time-outline" size={11} color="#4f46e5" />
                <Text style={[s.formTimeBadgeText, { color: "#4f46e5" }]}>≤ 6 sag</Text>
              </View>
            </View>

            {/* Sent success */}
            {sent && (
              <Animated.View
                entering={FadeInDown.duration(300)}
                style={[s.sentBox, { backgroundColor: "#f0fdf4", borderColor: "#86efac" }]}
              >
                <View style={s.sentIconWrap}>
                  <Ionicons name="checkmark-circle" size={24} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.sentTitle}>Soralyňyz alyndy!</Text>
                  <Text style={s.sentDesc}>6 sagatyň içinde jogap ibereris.</Text>
                </View>
              </Animated.View>
            )}

            {/* Inputs */}
            <View style={s.formBody}>
              <View>
                <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Soralyňyz</Text>
                <TextInput
                  value={question}
                  onChangeText={setQuestion}
                  placeholder="Soralyňyzy şu ýere ýazyň..."
                  placeholderTextColor={colors.mutedForeground + "80"}
                  multiline
                  numberOfLines={4}
                  style={[
                    s.textArea,
                    {
                      backgroundColor: colors.background,
                      borderColor: question.length > 0 ? colors.primary + "60" : colors.border,
                      color: colors.foreground,
                    },
                  ]}
                />
              </View>

              <View>
                <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Siziň nomeriňiz</Text>
                <View style={[
                  s.phoneInputWrap,
                  {
                    backgroundColor: colors.background,
                    borderColor: phone.length >= 8 ? colors.primary + "60" : colors.border,
                  },
                ]}>
                  <View style={[s.phoneFlag, { backgroundColor: colors.primary + "10" }]}>
                    <Text style={s.phoneFlagText}>🇹🇲</Text>
                  </View>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+993 XX XXXXXX"
                    placeholderTextColor={colors.mutedForeground + "80"}
                    keyboardType="phone-pad"
                    style={[s.phoneInput, { color: colors.foreground }]}
                  />
                </View>
              </View>

              {/* Two action buttons side by side */}
              <View style={s.formBtnRow}>
                {/* AI button */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push("/ai-chat");
                  }}
                  style={({ pressed }) => [
                    s.aiBtnSmall,
                    { backgroundColor: colors.primary + "12", borderColor: colors.primary + "35", opacity: pressed ? 0.82 : 1 },
                  ]}
                >
                  <Ionicons name="sparkles" size={15} color={colors.primary} />
                  <View>
                    <Text style={[s.aiBtnSmallTitle, { color: colors.primary }]}>AI-dan sor</Text>
                    <Text style={[s.aiBtnSmallSub, { color: colors.primary + "99" }]}>Hut häzir</Text>
                  </View>
                </Pressable>

                {/* Admin submit button */}
                <View style={{ flex: 1 }}>
                  <PessimisticButton
                    label="Admina ýollamak"
                    loadingLabel="Iberilýär..."
                    loading={loading}
                    disabled={loading || !question.trim() || !phone.trim()}
                    onPress={submitQuestion}
                    color="#4f46e5"
                    size="md"
                    icon={<Ionicons name="send" size={15} color="#fff" />}
                  />
                </View>
              </View>
            </View>

          </View>
        </Animated.View>


      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingBottom: 18,
  },
  backBtn: { padding: 6 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  headerSub: { color: "rgba(255,255,255,0.65)", fontSize: 11.5, marginTop: 1 },
  headerBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  headerBadgeDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: "#4ade80",
  },
  headerBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  // Section labels
  sectionLabel: {
    fontSize: 10.5, fontWeight: "800", letterSpacing: 1.1,
    marginBottom: 10,
  },

  // Contact option cards (2-column)
  contactRow: { flexDirection: "row", gap: 10 },
  contactCard: { flex: 1, borderRadius: 20, overflow: "hidden" },
  contactCardGrad: { padding: 16, minHeight: 148, justifyContent: "space-between" },
  contactCardIcon: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 10,
  },
  contactCardTitle: { color: "#fff", fontSize: 14, fontWeight: "800", marginBottom: 4 },
  contactCardDesc: { color: "rgba(255,255,255,0.8)", fontSize: 11.5, lineHeight: 17, marginBottom: 10 },
  contactCardBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(0,0,0,0.22)", alignSelf: "flex-start",
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4,
  },
  contactCardBadgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#4ade80" },
  contactCardBadgeText: { color: "rgba(255,255,255,0.9)", fontSize: 10, fontWeight: "700" },

  // FAQ group (iOS list-style card)
  faqGroup: {
    borderWidth: 1, borderRadius: 18, overflow: "hidden",
  },
  faqRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  faqIconWrap: {
    width: 30, height: 30, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
  },
  faqQ: { flex: 1, fontSize: 13.5, fontWeight: "600", lineHeight: 20 },
  faqAnswer: { paddingHorizontal: 56, paddingBottom: 14, paddingTop: 2 },
  faqA: { fontSize: 13, lineHeight: 20 },
  faqDivider: { height: 1, marginLeft: 56 },

  // Form card
  formCard: {
    borderWidth: 1, borderRadius: 20, overflow: "hidden", marginTop: 24,
  },
  formHeader: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  formHeaderIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  formHeaderTitle: { fontSize: 14, fontWeight: "800" },
  formHeaderSub: { fontSize: 11, marginTop: 1.5, lineHeight: 16 },
  formTimeBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4,
  },
  formTimeBadgeText: { fontSize: 10, fontWeight: "700" },

  // Sent success
  sentBox: {
    flexDirection: "row", alignItems: "center", gap: 12,
    margin: 16, padding: 14, borderRadius: 14, borderWidth: 1,
  },
  sentIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: "#d1fae5", alignItems: "center", justifyContent: "center",
  },
  sentTitle: { fontSize: 13, fontWeight: "800", color: "#065f46" },
  sentDesc: { fontSize: 12, color: "#059669", marginTop: 2 },

  // Form body
  formBody: { padding: 16, gap: 14 },
  fieldLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3, marginBottom: 8 },
  textArea: {
    borderWidth: 1.5, borderRadius: 13,
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12,
    fontSize: 14, height: 100, textAlignVertical: "top",
  },
  phoneInputWrap: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderRadius: 13, overflow: "hidden",
  },
  phoneFlag: {
    paddingHorizontal: 13, paddingVertical: 14,
    alignItems: "center", justifyContent: "center",
  },
  phoneFlagText: { fontSize: 18 },
  phoneInput: { flex: 1, fontSize: 15, paddingVertical: 13, paddingRight: 14 },

  // Action buttons row
  formBtnRow: { flexDirection: "row", alignItems: "stretch", gap: 10 },
  aiBtnSmall: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
  },
  aiBtnSmallTitle: { fontSize: 12, fontWeight: "800" },
  aiBtnSmallSub: { fontSize: 10, fontWeight: "600", marginTop: 1 },

  // Contact info card
  contactInfoCard: {
    borderWidth: 1, borderRadius: 18, overflow: "hidden",
    marginTop: 14,
  },
  contactInfoTitle: { fontSize: 13, fontWeight: "800", padding: 14, paddingBottom: 12 },
  contactInfoRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  contactInfoIcon: {
    width: 32, height: 32, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
  },
  contactInfoLabel: { fontSize: 10.5, fontWeight: "600", marginBottom: 2 },
  contactInfoVal: { fontSize: 13.5, fontWeight: "700" },
  contactInfoDivider: { height: 1, marginLeft: 58 },
});
