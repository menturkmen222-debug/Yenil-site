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
          <View style={{ flexDirection: "row", gap: 6 }}>
            <Pressable style={chatStyles.headerBtn}>
              <Ionicons name="settings-outline" size={20} color="rgba(255,255,255,0.85)" />
            </Pressable>
            <Pressable style={chatStyles.headerBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.85)" />
            </Pressable>
          </View>
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

// Futuristic corner bracket decoration
function CornerBrackets({ color }: { color: string }) {
  const s = 14;
  const t = 2;
  const br = { borderColor: color };
  return (
    <>
      <View style={{ position: "absolute", top: 8, left: 8, width: s, height: s, borderTopWidth: t, borderLeftWidth: t, ...br }} />
      <View style={{ position: "absolute", top: 8, right: 8, width: s, height: s, borderTopWidth: t, borderRightWidth: t, ...br }} />
      <View style={{ position: "absolute", bottom: 8, left: 8, width: s, height: s, borderBottomWidth: t, borderLeftWidth: t, ...br }} />
      <View style={{ position: "absolute", bottom: 8, right: 8, width: s, height: s, borderBottomWidth: t, borderRightWidth: t, ...br }} />
    </>
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

  // Futuristic card always uses dark palette
  const CARD_BG = "#0b1a12";
  const CARD_BORDER = colors.primary + "70";
  const GRID = colors.primary + "10";


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

        {/* ── FUTURISTIC AI AGENT CARD ── */}
        <View style={{ marginHorizontal: 16, marginTop: -20, zIndex: 10 }}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setChatOpen(true);
            }}
            style={({ pressed }) => [{
              backgroundColor: CARD_BG,
              borderRadius: 20,
              borderWidth: 1.5,
              borderColor: CARD_BORDER,
              overflow: "hidden",
              opacity: pressed ? 0.92 : 1,
              shadowColor: colors.primary,
              shadowOpacity: 0.35,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 4 },
              elevation: 10,
            }]}
          >
            {/* Corner brackets */}
            <CornerBrackets color={colors.primary + "90"} />

            {/* Subtle scan line grid overlay */}
            <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
              pointerEvents="none">
              {[...Array(6)].map((_, i) => (
                <View key={i} style={{
                  position: "absolute", left: 0, right: 0,
                  top: i * 34, height: 1, backgroundColor: GRID,
                }} />
              ))}
            </View>

            {/* TOP ROW */}
            <View style={{ flexDirection: "row", alignItems: "center", padding: 14, gap: 12 }}>
              {/* Avatar */}
              <View style={{ position: "relative", width: 46, height: 46 }}>
                <View style={{
                  position: "absolute", top: -4, bottom: -4, left: -4, right: -4,
                  borderRadius: 9999, borderWidth: 1,
                  borderColor: colors.primary + "28",
                }} />
                <View style={{
                  width: 46, height: 46, borderRadius: 15,
                  backgroundColor: colors.primary + "25",
                  borderWidth: 1.5, borderColor: colors.primary + "55",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <MaterialCommunityIcons name="robot-outline" size={24} color={colors.primary} />
                </View>
                <View style={{
                  position: "absolute", bottom: 1, right: 1,
                  width: 10, height: 10, borderRadius: 5,
                  backgroundColor: "#4ade80", borderWidth: 2, borderColor: CARD_BG,
                }} />
              </View>

              {/* Name + badge */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                  <Text style={{ color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 0.2 }}>
                    Ýeňil AI Agent
                  </Text>
                  <View style={{
                    backgroundColor: "#f59e0b1a", borderRadius: 5,
                    paddingHorizontal: 6, paddingVertical: 2,
                    borderWidth: 1, borderColor: "#f59e0b50",
                  }}>
                    <Text style={{ color: "#fbbf24", fontSize: 8, fontWeight: "800", letterSpacing: 1 }}>SYNAG</Text>
                  </View>
                </View>
                <Text style={{ color: colors.primary + "90", fontSize: 10, fontWeight: "600", marginTop: 2 }}>
                  Intellektual AI kömekçi
                </Text>
              </View>

              {/* Online indicator */}
              <View style={{ alignItems: "center", gap: 3 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#4ade80" }} />
                <Text style={{ color: "#4ade80", fontSize: 8, fontWeight: "700" }}>ONLAÝN</Text>
              </View>
            </View>

            {/* Thin divider */}
            <View style={{ height: 1, backgroundColor: colors.primary + "20", marginHorizontal: 14 }} />

            {/* Action row */}
            <View style={{
              flexDirection: "row", gap: 8,
              paddingHorizontal: 14, paddingBottom: 14, paddingTop: 12,
            }}>
              {/* Main chat button */}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setChatOpen(true);
                }}
                style={({ pressed }) => ({
                  flex: 1, borderRadius: 13,
                  backgroundColor: colors.primary,
                  paddingVertical: 12, paddingHorizontal: 14,
                  flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                  opacity: pressed ? 0.85 : 1,
                  shadowColor: colors.primary,
                  shadowOpacity: 0.5,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                })}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{
                    width: 22, height: 22, borderRadius: 11,
                    backgroundColor: "rgba(255,255,255,0.25)",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Ionicons name="add" size={15} color="#fff" />
                  </View>
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>Täze söhbet</Text>
                </View>
                <MaterialCommunityIcons name="robot-outline" size={17} color="rgba(255,255,255,0.65)" />
              </Pressable>

              {/* History */}
              <Pressable
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                style={{
                  width: 44, height: 44, borderRadius: 13,
                  backgroundColor: colors.primary + "18",
                  borderWidth: 1, borderColor: colors.primary + "35",
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Ionicons name="time-outline" size={18} color={colors.primary} />
              </Pressable>

              {/* Mic */}
              <Pressable
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                style={{
                  width: 44, height: 44, borderRadius: 13,
                  backgroundColor: colors.primary + "18",
                  borderWidth: 1, borderColor: colors.primary + "35",
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Ionicons name="mic-outline" size={18} color={colors.primary} />
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
    paddingHorizontal: 20, paddingBottom: 38,
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
