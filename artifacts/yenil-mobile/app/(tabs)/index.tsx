import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, Platform, Modal,
  TextInput, KeyboardAvoidingView, FlatList,
} from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";

function ServiceCard({ icon, title, desc, onPress, color }: {
  icon: React.ReactNode; title: string; desc: string; onPress: () => void; color: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.serviceCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={[styles.serviceIconBg, { backgroundColor: color + "20" }]}>
        {icon}
      </View>
      <Text style={[styles.serviceTitle, { color: colors.primary }]}>{title}</Text>
      <Text style={[styles.serviceDesc, { color: colors.mutedForeground }]}>{desc}</Text>
    </Pressable>
  );
}

type Msg = { id: string; role: "user" | "agent"; text: string };

function AgentChatModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Msg[]>([
    { id: "0", role: "agent", text: "Salam! Men Ýeňil AI Agenti. Size nädip kömek edip bilerin? 🤖" },
  ]);
  const [input, setInput] = useState("");
  const flatRef = React.useRef<FlatList>(null);

  const send = () => {
    if (!input.trim()) return;
    const userMsg: Msg = { id: Date.now().toString(), role: "user", text: input.trim() };
    const agentMsg: Msg = {
      id: (Date.now() + 1).toString(),
      role: "agent",
      text: "Bu synag görnüşi. Ýakyn wagtda doly işleýän AI kömekçi bolýar! 🚀",
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
        <View style={[chatStyles.header, { backgroundColor: colors.primary, paddingTop: insets.top + 8 }]}>
          <View style={chatStyles.agentInfo}>
            <View style={chatStyles.agentAvatarWrap}>
              <MaterialCommunityIcons name="robot-outline" size={22} color="#fff" />
              <View style={chatStyles.onlineDot} />
            </View>
            <View>
              <Text style={chatStyles.agentName}>Ýeňil AI Agent</Text>
              <Text style={chatStyles.agentStatus}>Synag görnüşi • Onlaýn</Text>
            </View>
          </View>
          <Pressable style={chatStyles.headerBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color="rgba(255,255,255,0.85)" />
          </Pressable>
        </View>

        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => (
            <View style={[chatStyles.bubble, item.role === "user" ? chatStyles.bubbleUser : chatStyles.bubbleAgent,
              item.role === "user"
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
            ]}>
              {item.role === "agent" && (
                <View style={[chatStyles.agentBubbleIcon, { backgroundColor: colors.primary + "22" }]}>
                  <MaterialCommunityIcons name="robot-outline" size={14} color={colors.primary} />
                </View>
              )}
              <Text style={[chatStyles.bubbleText, { color: item.role === "user" ? "#fff" : colors.foreground }]}>
                {item.text}
              </Text>
            </View>
          )}
        />

        <View style={[chatStyles.inputRow, { borderTopColor: colors.border, backgroundColor: colors.background, paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Soragyňyzy ýazyň..."
            placeholderTextColor={colors.mutedForeground}
            style={[chatStyles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <Pressable
            onPress={send}
            style={[chatStyles.sendBtn, { backgroundColor: input.trim() ? colors.primary : colors.border }]}
          >
            <Ionicons name="send" size={16} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { balance } = useBonusPul();
  const isWeb = Platform.OS === "web";
  const [chatOpen, setChatOpen] = useState(false);

  const nav = (path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as Href);
  };

  const topPad = (isWeb ? 0 : insets.top) + 20;

  return (
    <>
      <AgentChatModal visible={chatOpen} onClose={() => setChatOpen(false)} />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO + AI AGENT merged panel ── */}
        <View style={[styles.hero, { backgroundColor: colors.primary, paddingTop: topPad }]}>

          {/* Top row: Logo + Balance */}
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroTitle}>Ýeňil</Text>
              <Text style={styles.heroSub}>Türkmenistanda iň ynamly onlayn hyzmatlar</Text>
            </View>
            <Pressable
              style={styles.balancePill}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <Ionicons name="wallet-outline" size={14} color="#fff" />
              <Text style={styles.balanceText}>{balance.toFixed(2)} BP</Text>
            </Pressable>
          </View>

          {/* AI Agent Card — inside hero */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setChatOpen(true);
            }}
            style={({ pressed }) => [styles.agentCard, { opacity: pressed ? 0.92 : 1 }]}
          >
            {/* Agent header row */}
            <View style={styles.agentTopRow}>
              {/* Avatar */}
              <View style={styles.agentAvatarOuter}>
                <View style={styles.agentAvatar}>
                  <MaterialCommunityIcons name="robot-outline" size={22} color={colors.primary} />
                </View>
                <View style={styles.agentOnlineDot} />
              </View>

              {/* Name + badge */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                  <Text style={styles.agentName}>Ýeňil AI Agent</Text>
                  <View style={styles.synagBadge}>
                    <Text style={styles.synagText}>SYNAG</Text>
                  </View>
                </View>
                <Text style={styles.agentSub}>Intellektual AI kömekçi</Text>
              </View>

              {/* Status */}
              <View style={styles.onlineRow}>
                <View style={styles.onlinePulse} />
                <Text style={styles.onlineText}>Onlaýn</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.agentDivider} />

            {/* Action row */}
            <View style={styles.agentActions}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setChatOpen(true);
                }}
                style={styles.chatBtn}
              >
                <Ionicons name="add-circle-outline" size={17} color="#fff" />
                <Text style={styles.chatBtnText}>Täze söhbet</Text>
              </Pressable>
              <Pressable
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                style={styles.agentIconBtn}
              >
                <Ionicons name="time-outline" size={18} color="rgba(255,255,255,0.7)" />
              </Pressable>
              <Pressable
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                style={styles.agentIconBtn}
              >
                <Ionicons name="mic-outline" size={18} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>
          </Pressable>
        </View>

        {/* SERVICES */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Hyzmatlar</Text>
        <View style={styles.servicesGrid}>
          <ServiceCard
            icon={<Ionicons name="train-outline" size={28} color={colors.primary} />}
            title="Demirýol"
            desc="Kart tölegsiz bilet"
            onPress={() => nav("/(demiryol)")}
            color={colors.primary}
          />
          <ServiceCard
            icon={<MaterialCommunityIcons name="currency-usd" size={28} color="#0ea5e9" />}
            title="Ýeňil Pay"
            desc="Walýuta çalyşmak"
            onPress={() => nav("/tmcell")}
            color="#0ea5e9"
          />
          <ServiceCard
            icon={<Ionicons name="apps-outline" size={28} color="#f59e0b" />}
            title="Ulgamlar"
            desc="Aydym, Belet we ş.m."
            onPress={() => nav("/ulgamlar")}
            color="#f59e0b"
          />
        </View>

        {/* E-KITAP BANNER */}
        <Pressable
          onPress={() => nav("/ekitap")}
          style={({ pressed }) => [styles.banner, { opacity: pressed ? 0.9 : 1, backgroundColor: "#6366f1" }]}
        >
          <View style={[styles.bannerIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Ionicons name="book-outline" size={26} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>E-kitap & Gollanmalar</Text>
            <Text style={styles.bannerDesc}>Okap öwren • 6 kitap elýeterli</Text>
          </View>
          <Feather name="arrow-right" size={20} color="#fff" />
        </Pressable>

        {/* SANLY BAZAR BANNER */}
        <Pressable
          onPress={() => nav("/bazar")}
          style={({ pressed }) => [styles.banner, { opacity: pressed ? 0.9 : 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
        >
          <View style={[styles.bannerIcon, { backgroundColor: colors.primary + "20" }]}>
            <Ionicons name="storefront-outline" size={26} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: colors.foreground }]}>Sanly bazar</Text>
            <Text style={[styles.bannerDesc, { color: colors.mutedForeground }]}>Akkauntlar we sanly harytlar</Text>
          </View>
          <Feather name="arrow-right" size={20} color={colors.primary} />
        </Pressable>
      </ScrollView>
    </>
  );
}

const chatStyles = StyleSheet.create({
  header: {
    paddingHorizontal: 16, paddingBottom: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  agentInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  agentAvatarWrap: { position: "relative" },
  onlineDot: {
    position: "absolute", bottom: 0, right: 0,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: "#4ade80", borderWidth: 2, borderColor: "#fff",
  },
  agentName: { color: "#fff", fontWeight: "800", fontSize: 16 },
  agentStatus: { color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 1 },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  bubble: { maxWidth: "80%", borderRadius: 18, padding: 12, flexDirection: "row", alignItems: "flex-start", gap: 8 },
  bubbleUser: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  bubbleAgent: { alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  agentBubbleIcon: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", marginTop: 1 },
  bubbleText: { fontSize: 14, lineHeight: 20, flex: 1 },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1,
  },
  input: {
    flex: 1, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, borderWidth: 1,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: "center", justifyContent: "center",
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Hero
  hero: {
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  heroTitle: { fontSize: 34, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  heroSub: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 3 },
  balancePill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 50,
    marginTop: 4,
  },
  balanceText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // AI Agent Card (inside hero)
  agentCard: {
    backgroundColor: "rgba(0,0,0,0.22)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  agentTopRow: {
    flexDirection: "row", alignItems: "center",
    gap: 12, padding: 14,
  },
  agentAvatarOuter: { position: "relative" },
  agentAvatar: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center", justifyContent: "center",
  },
  agentOnlineDot: {
    position: "absolute", bottom: 1, right: 1,
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: "#4ade80", borderWidth: 2, borderColor: "rgba(0,0,0,0.3)",
  },
  agentName: { color: "#fff", fontSize: 15, fontWeight: "800" },
  agentSub: { color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 2 },
  synagBadge: {
    backgroundColor: "rgba(251,191,36,0.2)", borderRadius: 5,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: "rgba(251,191,36,0.4)",
  },
  synagText: { color: "#fbbf24", fontSize: 8, fontWeight: "800", letterSpacing: 0.8 },
  onlineRow: { alignItems: "center", gap: 3 },
  onlinePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4ade80" },
  onlineText: { color: "#4ade80", fontSize: 9, fontWeight: "700" },
  agentDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginHorizontal: 14 },
  agentActions: {
    flexDirection: "row", gap: 8,
    paddingHorizontal: 14, paddingBottom: 14, paddingTop: 12,
  },
  chatBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14,
  },
  chatBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  agentIconBtn: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },

  // Services
  sectionTitle: { fontSize: 17, fontWeight: "700", marginLeft: 16, marginTop: 22, marginBottom: 12 },
  servicesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16, marginBottom: 16 },
  serviceCard: { width: "47%", borderRadius: 16, padding: 16, borderWidth: 1, gap: 8 },
  serviceIconBg: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  serviceTitle: { fontSize: 14, fontWeight: "700" },
  serviceDesc: { fontSize: 12 },

  // Banners
  banner: {
    marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 14,
  },
  bannerIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  bannerTitle: { color: "#fff", fontWeight: "700", fontSize: 15 },
  bannerDesc: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 },
});
