import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, Platform, Modal,
  TextInput, KeyboardAvoidingView, FlatList, Dimensions, StatusBar,
} from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");

// ── AI Chat Modal ──────────────────────────────────────────────────
type Msg = { id: string; role: "user" | "agent"; text: string };

function AiChatModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Msg[]>([
    { id: "0", role: "agent", text: "Salam! Men AI Kömekçi. Size çalt kömek edip bilerin 🤖\n\nSoragy ýazyň!" },
  ]);
  const [input, setInput] = useState("");
  const flatRef = React.useRef<FlatList>(null);

  const send = () => {
    if (!input.trim()) return;
    const userMsg: Msg = { id: Date.now().toString(), role: "user", text: input.trim() };
    const agentMsg: Msg = {
      id: (Date.now() + 1).toString(),
      role: "agent",
      text: "Bu Beta synag görnüşi. Ýakyn wagtda doly işleýän AI kömekçi bolýar! ⚡",
    };
    setMessages(prev => [...prev, userMsg, agentMsg]);
    setInput("");
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Chat header */}
        <View style={[ch.header, { paddingTop: insets.top + 10, backgroundColor: "#6366f1" }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={ch.avatarWrap}>
              <MaterialCommunityIcons name="robot-outline" size={22} color="#fff" />
              <View style={ch.onlineDot} />
            </View>
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={ch.agentName}>AI Kömekçi</Text>
                <View style={ch.betaBadge}><Text style={ch.betaText}>BETA</Text></View>
              </View>
              <Text style={ch.agentSub}>Çalt kömek & akylly jogap</Text>
            </View>
          </View>
          <Pressable style={ch.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color="rgba(255,255,255,0.85)" />
          </Pressable>
        </View>

        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => (
            <View style={[ch.bubble,
              item.role === "user"
                ? [ch.bubbleUser, { backgroundColor: "#6366f1" }]
                : [ch.bubbleAgent, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }],
            ]}>
              <Text style={{ color: item.role === "user" ? "#fff" : colors.foreground, fontSize: 14, lineHeight: 20 }}>
                {item.text}
              </Text>
            </View>
          )}
        />

        <View style={[ch.inputRow, { borderTopColor: colors.border, backgroundColor: colors.background, paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Soragyňyzy ýazyň..."
            placeholderTextColor={colors.mutedForeground}
            style={[ch.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <Pressable
            onPress={send}
            style={[ch.sendBtn, { backgroundColor: input.trim() ? "#6366f1" : colors.border }]}
          >
            <Ionicons name="send" size={16} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Plans ──────────────────────────────────────────────────────────
const PLANS = [
  {
    id: "base",
    name: "Başlangyç",
    price: "15",
    color: "#6366f1",
    bg: "#eef2ff",
    icon: "rocket-outline" as const,
    features: ["Demirýol biletleri", "Ýeňil Pay", "TMCell", "Sanly bazar"],
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "35",
    color: "#10b981",
    bg: "#d1fae5",
    icon: "diamond-outline" as const,
    features: ["Başlangyçdaky ähli", "AI Kömekçi (çäksiz)", "Ýeňil AI Agent", "Ilkinji goldaw"],
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "65",
    color: "#f59e0b",
    bg: "#fef3c7",
    icon: "ribbon-outline" as const,
    features: ["Prodaky ähli", "AI Agent (doly)", "Şahsy menejer", "Ähli hyzmatlar"],
    popular: false,
  },
];

function TarifSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={ts.overlay} onPress={onClose} />
      <View style={[ts.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 24 }]}>
        <View style={[ts.handle, { backgroundColor: colors.border }]} />

        <View style={ts.sheetHead}>
          <View style={{ gap: 2 }}>
            <Text style={[ts.sheetTitle, { color: colors.foreground }]}>Tarif saýlaň</Text>
            <Text style={[ts.sheetSub, { color: colors.mutedForeground }]}>Özüňize laýyk teklip</Text>
          </View>
          <Pressable onPress={onClose} style={[ts.sheetClose, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="close" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
          {PLANS.map(plan => (
            <View
              key={plan.id}
              style={[ts.planCard, {
                backgroundColor: plan.popular ? plan.color : colors.card,
                borderColor: plan.popular ? plan.color : colors.border,
                shadowColor: plan.color,
                shadowOpacity: plan.popular ? 0.25 : 0.06,
                shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: plan.popular ? 8 : 1,
              }]}
            >
              {plan.popular && (
                <View style={ts.popularChip}>
                  <Ionicons name="flame" size={10} color={plan.color} />
                  <Text style={[ts.popularChipText, { color: plan.color }]}>Meşhur saýlaw</Text>
                </View>
              )}
              <View style={ts.planRow}>
                <View style={[ts.planIconBg, { backgroundColor: plan.popular ? "rgba(255,255,255,0.2)" : plan.bg }]}>
                  <Ionicons name={plan.icon} size={22} color={plan.popular ? "#fff" : plan.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[ts.planName, { color: plan.popular ? "#fff" : colors.foreground }]}>{plan.name}</Text>
                  <View style={{ flexDirection: "row", alignItems: "baseline", gap: 2 }}>
                    <Text style={[ts.planPrice, { color: plan.popular ? "#fff" : plan.color }]}>{plan.price}</Text>
                    <Text style={[ts.planPer, { color: plan.popular ? "rgba(255,255,255,0.7)" : colors.mutedForeground }]}>TMT/aý</Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                  style={[ts.planBtn, {
                    backgroundColor: plan.popular ? "#fff" : plan.color + "15",
                    borderWidth: plan.popular ? 0 : 1.5,
                    borderColor: plan.color,
                  }]}
                >
                  <Text style={[ts.planBtnText, { color: plan.popular ? plan.color : plan.color }]}>
                    {plan.popular ? "Pro almak" : "Saýlamak"}
                  </Text>
                </Pressable>
              </View>
              <View style={[ts.divider, { backgroundColor: plan.popular ? "rgba(255,255,255,0.2)" : colors.border }]} />
              {plan.features.map((f, fi) => (
                <View key={fi} style={ts.featureRow}>
                  <View style={[ts.checkCircle, { backgroundColor: plan.popular ? "rgba(255,255,255,0.2)" : plan.bg }]}>
                    <Ionicons name="checkmark" size={11} color={plan.popular ? "#fff" : plan.color} />
                  </View>
                  <Text style={[ts.featureText, { color: plan.popular ? "rgba(255,255,255,0.85)" : colors.mutedForeground }]}>{f}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
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
  const [aiOpen, setAiOpen] = useState(false);
  const [tarifOpen, setTarifOpen] = useState(false);

  const topPad = (isWeb ? 0 : insets.top);

  return (
    <>
      <AiChatModal visible={aiOpen} onClose={() => setAiOpen(false)} />
      <TarifSheet visible={tarifOpen} onClose={() => setTarifOpen(false)} />

      <ScrollView
        style={[s.root, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Large title header ── */}
        <View style={[s.header, { paddingTop: topPad + 16, backgroundColor: colors.background }]}>
          <Text style={[s.largeTitle, { color: colors.foreground }]}>Has köp</Text>
          <Text style={[s.largeSub, { color: colors.mutedForeground }]}>Ähli hyzmatlar & sazlamalar</Text>
        </View>

        {/* ── AI HERO CARD ── */}
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setAiOpen(true); }}
          style={({ pressed }) => [s.aiHero, { opacity: pressed ? 0.92 : 1 }]}
        >
          {/* Gradient background layer */}
          <View style={s.aiHeroBg} />

          <View style={s.aiHeroContent}>
            {/* Left: avatar + info */}
            <View style={s.aiHeroLeft}>
              <View style={s.aiAvatarOuter}>
                <View style={s.aiAvatarInner}>
                  <MaterialCommunityIcons name="robot-outline" size={26} color="#6366f1" />
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
                <Text style={pulGazanCard.title}>Pul Gazan 💰</Text>
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

        {/* E-Bilim card */}
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/e-bilim" as Href); }}
          style={({ pressed }) => [eBilimCard.wrap, { opacity: pressed ? 0.92 : 1 }]}
        >
          <LinearGradient
            colors={["#1e1b4b", "#6366f1"]}
            style={eBilimCard.inner}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <View style={eBilimCard.iconWrap}>
              <Text style={{ fontSize: 26 }}>📚</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={eBilimCard.title}>E-Bilim 📚</Text>
                <View style={eBilimCard.newBadge}>
                  <Text style={eBilimCard.newText}>TÄZE</Text>
                </View>
              </View>
              <Text style={eBilimCard.desc}>O'qi, test ber, BP gazan — 7 ugur 25+ sapak</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </Pressable>

        <View style={[s.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
            last
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/teklip" as Href); }}
            colors={colors}
          />
        </View>

        {/* ── TARIF PREMIUM CARD ── */}
        <Text style={[s.groupTitle, { color: colors.mutedForeground }]}>HASAP</Text>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setTarifOpen(true); }}
          style={({ pressed }) => [s.tarifCard, { opacity: pressed ? 0.92 : 1 }]}
        >
          {/* Top row */}
          <View style={s.tarifTop}>
            <View style={s.tarifIconStack}>
              {/* Background glow */}
              <View style={s.tarifGlowCircle} />
              <Ionicons name="star" size={28} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.tarifTitle}>Tarif satyn almak</Text>
              <Text style={s.tarifSub}>Pro we Premium hyzmatlar</Text>
            </View>
            <View style={s.tarifBadge}>
              <Text style={s.tarifBadgeText}>15 TMT+</Text>
            </View>
          </View>

          {/* Plan pills */}
          <View style={s.tarifPlansRow}>
            {PLANS.map(p => (
              <View key={p.id} style={[s.tarifPlanPill, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                <Ionicons name={p.icon} size={12} color="#fff" />
                <Text style={s.tarifPlanPillText}>{p.name}</Text>
              </View>
            ))}
          </View>

          {/* Divider */}
          <View style={s.tarifDivider} />

          {/* Feature hints */}
          <View style={s.tarifFeatures}>
            {["AI Kömekçi (çäksiz)", "Ilkinji hyzmat goldawy", "Ähli premium mümkinçilikler"].map((f, i) => (
              <View key={i} style={s.tarifFeatureRow}>
                <View style={s.tarifCheckCircle}>
                  <Ionicons name="checkmark" size={10} color="#10b981" />
                </View>
                <Text style={s.tarifFeatureText}>{f}</Text>
              </View>
            ))}
          </View>

          {/* CTA button */}
          <View style={s.tarifCta}>
            <Text style={s.tarifCtaText}>Tarif saýlamak</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </View>
        </Pressable>

      </ScrollView>
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────

const ch = StyleSheet.create({
  header: {
    paddingHorizontal: 16, paddingBottom: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  avatarWrap: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center", position: "relative",
  },
  onlineDot: {
    position: "absolute", bottom: 0, right: 0,
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: "#fbbf24", borderWidth: 2, borderColor: "#fff",
  },
  agentName: { color: "#fff", fontWeight: "800", fontSize: 16 },
  agentSub: { color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 1 },
  betaBadge: { backgroundColor: "#f59e0b", borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  betaText: { color: "#fff", fontSize: 8, fontWeight: "800", letterSpacing: 0.5 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center",
  },
  bubble: { maxWidth: "80%", borderRadius: 18, padding: 12 },
  bubbleUser: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  bubbleAgent: { alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1,
  },
  input: {
    flex: 1, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, borderWidth: 1,
  },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
});

const ts = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    paddingTop: 12, maxHeight: SCREEN_H * 0.88,
  },
  handle: { width: 38, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 18 },
  sheetHead: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, marginBottom: 16,
  },
  sheetTitle: { fontSize: 20, fontWeight: "800" },
  sheetSub: { fontSize: 12, marginTop: 2 },
  sheetClose: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  planCard: { borderRadius: 20, padding: 16, borderWidth: 1.5, overflow: "visible" },
  popularChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#fff", borderRadius: 20,
    alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12,
  },
  popularChipText: { fontSize: 11, fontWeight: "800" },
  planRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  planIconBg: { width: 46, height: 46, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  planName: { fontSize: 15, fontWeight: "800", marginBottom: 2 },
  planPrice: { fontSize: 26, fontWeight: "800" },
  planPer: { fontSize: 12 },
  planBtn: { borderRadius: 11, paddingVertical: 9, paddingHorizontal: 14, alignItems: "center" },
  planBtnText: { fontWeight: "700", fontSize: 13 },
  divider: { height: 1, marginVertical: 12 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 6 },
  checkCircle: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  featureText: { fontSize: 13, flex: 1 },
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

  // Tarif card
  tarifCard: {
    marginHorizontal: 16, borderRadius: 22, overflow: "hidden",
    backgroundColor: "#111827",
    shadowColor: "#000",
    shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
    elevation: 10, padding: 20,
  },
  tarifTop: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  tarifIconStack: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: "#10b981",
    alignItems: "center", justifyContent: "center",
    position: "relative",
    shadowColor: "#10b981", shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  tarifGlowCircle: {
    position: "absolute",
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: "#10b98140",
  },
  tarifTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  tarifSub: { color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 2 },
  tarifBadge: {
    backgroundColor: "#10b981",
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6,
  },
  tarifBadgeText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  tarifPlansRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  tarifPlanPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6,
  },
  tarifPlanPillText: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "700" },

  tarifDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginBottom: 14 },

  tarifFeatures: { gap: 8, marginBottom: 18 },
  tarifFeatureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  tarifCheckCircle: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "#10b98120",
    alignItems: "center", justifyContent: "center",
  },
  tarifFeatureText: { color: "rgba(255,255,255,0.7)", fontSize: 13, flex: 1 },

  tarifCta: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "#10b981",
    borderRadius: 14, paddingVertical: 14,
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

const eBilimCard = StyleSheet.create({
  wrap: {
    marginHorizontal: 16, marginBottom: 10, borderRadius: 18, overflow: "hidden",
    shadowColor: "#6366f1", shadowOpacity: 0.22, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  inner: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 18,
  },
  iconWrap: {
    width: 48, height: 48, borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  title: { color: "#fff", fontSize: 17, fontWeight: "800" },
  desc: { color: "rgba(255,255,255,0.78)", fontSize: 12, marginTop: 3 },
  newBadge: {
    backgroundColor: "#22d3ee", borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  newText: { color: "#fff", fontSize: 8, fontWeight: "800" },
});
