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
        {/* Header */}
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
          <View style={{ flexDirection: "row", gap: 6 }}>
            <Pressable style={chatStyles.headerBtn}>
              <Ionicons name="settings-outline" size={20} color="rgba(255,255,255,0.85)" />
            </Pressable>
            <Pressable style={chatStyles.headerBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.85)" />
            </Pressable>
          </View>
        </View>

        {/* Messages */}
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

        {/* Input */}
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

  return (
    <>
      <AgentChatModal visible={chatOpen} onClose={() => setChatOpen(false)} />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO */}
        <View style={[styles.hero, { backgroundColor: colors.primary, paddingTop: (isWeb ? 0 : insets.top) + 24 }]}>
          <Text style={styles.heroTitle}>Ýeňil</Text>
          <Text style={styles.heroSub}>Türkmenistanda iň ynamly onlayn hyzmatlar</Text>
          <View style={styles.balanceBadge}>
            <Ionicons name="wallet-outline" size={16} color="#fff" />
            <Text style={styles.balanceText}>{balance.toFixed(2)} BP</Text>
          </View>
        </View>

        {/* YENIL AI AGENT CARD */}
        <View style={[styles.agentSection, { marginHorizontal: 16, marginTop: -18 }]}>
          <View style={[styles.agentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Top row */}
            <View style={styles.agentTopRow}>
              <View style={styles.agentAvatarGroup}>
                <View style={[styles.agentAvatar, { backgroundColor: colors.primary }]}>
                  <MaterialCommunityIcons name="robot-outline" size={26} color="#fff" />
                </View>
                <View style={styles.agentOnline} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={[styles.agentName, { color: colors.foreground }]}>Ýeňil AI Agent</Text>
                  <View style={[styles.testBadge, { backgroundColor: "#f59e0b22" }]}>
                    <Text style={[styles.testBadgeText, { color: "#f59e0b" }]}>SYNAG</Text>
                  </View>
                </View>
                <Text style={[styles.agentDesc, { color: colors.mutedForeground }]}>
                  Ähli işleri sorag esasynda ýerine ýetirýän intellektual kömekçi
                </Text>
              </View>
              {/* Settings icon */}
              <Pressable
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                style={[styles.agentIconBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
              >
                <Ionicons name="settings-outline" size={17} color={colors.mutedForeground} />
              </Pressable>
            </View>

            {/* Capabilities */}
            <View style={[styles.capabilityRow, { borderTopColor: colors.border }]}>
              {[
                { icon: "train-outline", label: "Bilet", color: colors.primary },
                { icon: "cash-outline", label: "Töleg", color: "#0ea5e9" },
                { icon: "phone-portrait-outline", label: "TMCell", color: "#8b5cf6" },
                { icon: "search-outline", label: "Gözleg", color: "#f59e0b" },
                { icon: "apps-outline", label: "Ulgam", color: "#10b981" },
              ].map((cap, i) => (
                <View key={i} style={styles.capItem}>
                  <View style={[styles.capIcon, { backgroundColor: cap.color + "18" }]}>
                    <Ionicons name={cap.icon as any} size={14} color={cap.color} />
                  </View>
                  <Text style={[styles.capLabel, { color: colors.mutedForeground }]}>{cap.label}</Text>
                </View>
              ))}
            </View>

            {/* Action buttons */}
            <View style={styles.agentBtnRow}>
              {/* + New Chat button */}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setChatOpen(true);
                }}
                style={({ pressed }) => [styles.newChatBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 }]}
              >
                <View style={styles.newChatBtnInner}>
                  <View style={styles.plusCircle}>
                    <Ionicons name="add" size={16} color={colors.primary} />
                  </View>
                  <Text style={styles.newChatBtnText}>Täze söhbet</Text>
                </View>
                <MaterialCommunityIcons name="robot-outline" size={18} color="rgba(255,255,255,0.7)" />
              </Pressable>

              {/* Info/history button */}
              <Pressable
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                style={[styles.agentSecondBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
              >
                <Ionicons name="time-outline" size={18} color={colors.mutedForeground} />
              </Pressable>

              {/* Mic button */}
              <Pressable
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                style={[styles.agentSecondBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
              >
                <Ionicons name="mic-outline" size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>
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
            icon={<Ionicons name="phone-portrait-outline" size={28} color="#8b5cf6" />}
            title="TMCell"
            desc="Bonus pul & SIM"
            onPress={() => nav("/tmcell")}
            color="#8b5cf6"
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
  agentAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
  },
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
  hero: {
    paddingHorizontal: 20, paddingBottom: 36,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  heroTitle: { fontSize: 36, fontWeight: "800", color: "#fff", marginBottom: 6 },
  heroSub: { fontSize: 14, color: "rgba(255,255,255,0.85)", marginBottom: 14 },
  balanceBadge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 14,
    paddingVertical: 8, borderRadius: 50, alignSelf: "flex-start",
  },
  balanceText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  agentSection: { zIndex: 10 },
  agentCard: {
    borderRadius: 22, borderWidth: 1,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 6, overflow: "hidden",
  },
  agentTopRow: { flexDirection: "row", alignItems: "flex-start", padding: 16, gap: 0 },
  agentAvatarGroup: { position: "relative" },
  agentAvatar: {
    width: 50, height: 50, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  agentOnline: {
    position: "absolute", bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: "#4ade80", borderWidth: 2, borderColor: "#fff",
  },
  agentName: { fontSize: 15, fontWeight: "800" },
  agentDesc: { fontSize: 11, marginTop: 3, lineHeight: 15 },
  testBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  testBadgeText: { fontSize: 8, fontWeight: "800", letterSpacing: 0.5 },
  agentIconBtn: {
    width: 34, height: 34, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, marginLeft: 4,
  },

  capabilityRow: {
    flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, justifyContent: "space-between",
  },
  capItem: { alignItems: "center", gap: 5 },
  capIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  capLabel: { fontSize: 9, fontWeight: "600" },

  agentBtnRow: { flexDirection: "row", gap: 8, padding: 14, paddingTop: 0 },
  newChatBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  newChatBtnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  plusCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
  },
  newChatBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  agentSecondBtn: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },

  sectionTitle: { fontSize: 17, fontWeight: "700", marginLeft: 16, marginTop: 20, marginBottom: 12 },
  servicesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16, marginBottom: 16 },
  serviceCard: { width: "47%", borderRadius: 16, padding: 16, borderWidth: 1, gap: 8 },
  serviceIconBg: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  serviceTitle: { fontSize: 14, fontWeight: "700" },
  serviceDesc: { fontSize: 12 },
  banner: {
    marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 14,
  },
  bannerIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  bannerTitle: { color: "#fff", fontWeight: "700", fontSize: 15 },
  bannerDesc: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 },
});
