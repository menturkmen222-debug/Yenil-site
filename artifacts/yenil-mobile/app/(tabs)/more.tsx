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
        <View style={[chatSt.header, { paddingTop: insets.top + 8 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={chatSt.avatarWrap}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
              <View style={chatSt.onlineDot} />
            </View>
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={chatSt.agentName}>AI Kömekçi</Text>
                <View style={chatSt.betaBadge}><Text style={chatSt.betaText}>BETA</Text></View>
              </View>
              <Text style={chatSt.agentSub}>Çalt kömek & jogap • Synag</Text>
            </View>
          </View>
          <Pressable style={chatSt.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color="rgba(255,255,255,0.85)" />
          </Pressable>
        </View>

        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => (
            <View style={[chatSt.bubble,
              item.role === "user"
                ? [chatSt.bubbleUser, { backgroundColor: colors.primary }]
                : [chatSt.bubbleAgent, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }],
            ]}>
              <Text style={{ color: item.role === "user" ? "#fff" : colors.foreground, fontSize: 14, lineHeight: 20 }}>
                {item.text}
              </Text>
            </View>
          )}
        />

        <View style={[chatSt.inputRow, { borderTopColor: colors.border, backgroundColor: colors.background, paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Soragyňyzy ýazyň..."
            placeholderTextColor={colors.mutedForeground}
            style={[chatSt.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <Pressable
            onPress={send}
            style={[chatSt.sendBtn, { backgroundColor: input.trim() ? colors.primary : colors.border }]}
          >
            <Ionicons name="send" size={16} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const PLANS = [
  {
    id: "base",
    name: "Başlangyç",
    price: "15",
    period: "/aý",
    color: "#6366f1",
    features: ["Demirýol biletleri", "Ýeňil Pay", "TMCell", "Sanly bazar"],
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "35",
    period: "/aý",
    color: "#10b981",
    features: ["Başlangyçdaky ähli", "AI Kömekçi (Çäklendirilmedik)", "Ýeňil AI Agent (Beta)", "Ilkinji goldaw"],
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "65",
    period: "/aý",
    color: "#f59e0b",
    features: ["Prodaky ähli", "Ýeňil AI Agent (Doly)", "Şahsy menejer", "Ähli hyzmatlar"],
    popular: false,
  },
];

export default function MoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <>
      <AiChatModal visible={aiOpen} onClose={() => setAiOpen(false)} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: (isWeb ? 0 : insets.top) + 12, backgroundColor: colors.primary }]}>
          <Text style={styles.headerTitle}>Has köp</Text>
          <Text style={styles.headerSub}>Ähli hyzmatlar</Text>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 34 : 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* AI KÖMEKÇI — first row */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setAiOpen(true);
            }}
            style={({ pressed }) => [styles.aiRow, {
              backgroundColor: colors.card,
              borderColor: colors.primary + "44",
              opacity: pressed ? 0.85 : 1,
              borderWidth: 1.5,
            }]}
          >
            <View style={[styles.aiIconBg, { backgroundColor: colors.primary + "18" }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={26} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <Text style={[styles.aiRowTitle, { color: colors.foreground }]}>AI Kömekçi</Text>
                <View style={[styles.betaBadge, { backgroundColor: "#f59e0b" }]}>
                  <Text style={styles.betaBadgeText}>BETA</Text>
                </View>
              </View>
              <Text style={[styles.aiRowDesc, { color: colors.mutedForeground }]}>Çalt kömek & akylly jogap</Text>
            </View>
            <View style={{ alignItems: "center", gap: 4 }}>
              <Ionicons name="flash-outline" size={16} color={colors.primary} />
              <Ionicons name="chevron-forward-outline" size={16} color={colors.mutedForeground} />
            </View>
          </Pressable>

          {/* OTHER MENU ITEMS */}
          {[
            { icon: "location-outline" as const, label: "Ýer paýlaşma", desc: "Canlý ýer yzarlama we link paýlaşma", href: "/konum", color: "#4f46e5" },
            { icon: "bulb-outline" as const, label: "Teklip ibermek", desc: "Öz hyzmatyňyzy teklip ediň", href: "/teklip", color: "#15803d" },
          ].map((item, i) => (
            <Pressable
              key={i}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(item.href as Href);
              }}
              style={({ pressed }) => [styles.row, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
            >
              <View style={[styles.iconBg, { backgroundColor: item.color + "18" }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: colors.foreground }]}>{item.label}</Text>
                <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={18} color={colors.mutedForeground} />
            </Pressable>
          ))}

          {/* TARIF SECTION */}
          <View style={[styles.tarifHeader, { borderTopColor: colors.border }]}>
            <View style={[styles.tarifIconBg, { backgroundColor: colors.primary + "18" }]}>
              <Ionicons name="star-outline" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.tarifTitle, { color: colors.foreground }]}>Tarif satyn almak</Text>
              <Text style={[styles.tarifSub, { color: colors.mutedForeground }]}>Has köp mümkinçilik açyň</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
          >
            {PLANS.map(plan => (
              <View
                key={plan.id}
                style={[styles.planCard, {
                  backgroundColor: colors.card,
                  borderColor: plan.popular ? plan.color : colors.border,
                  borderWidth: plan.popular ? 2 : 1,
                  shadowColor: plan.popular ? plan.color : "#000",
                  shadowOpacity: plan.popular ? 0.2 : 0.06,
                  shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: plan.popular ? 8 : 2,
                }]}
              >
                {plan.popular && (
                  <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
                    <Text style={styles.popularText}>Meşhur</Text>
                  </View>
                )}
                <View style={[styles.planIconBg, { backgroundColor: plan.color + "18" }]}>
                  <Ionicons
                    name={plan.id === "base" ? "rocket-outline" : plan.id === "pro" ? "diamond-outline" : "ribbon-outline"}
                    size={22}
                    color={plan.color}
                  />
                </View>
                <Text style={[styles.planName, { color: colors.foreground }]}>{plan.name}</Text>
                <View style={styles.priceRow}>
                  <Text style={[styles.planPrice, { color: plan.color }]}>{plan.price}</Text>
                  <Text style={[styles.planCurrency, { color: colors.mutedForeground }]}> TMT{plan.period}</Text>
                </View>
                <View style={styles.featureList}>
                  {plan.features.map((f, fi) => (
                    <View key={fi} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={13} color={plan.color} />
                      <Text style={[styles.featureText, { color: colors.mutedForeground }]}>{f}</Text>
                    </View>
                  ))}
                </View>
                <Pressable
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                  style={({ pressed }) => [styles.planBtn, {
                    backgroundColor: plan.popular ? plan.color : "transparent",
                    borderWidth: plan.popular ? 0 : 1.5,
                    borderColor: plan.color,
                    opacity: pressed ? 0.85 : 1,
                  }]}
                >
                  <Text style={[styles.planBtnText, { color: plan.popular ? "#fff" : plan.color }]}>
                    {plan.id === "base" ? "Başlamak" : plan.id === "pro" ? "Pro almak" : "Premium"}
                  </Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </ScrollView>
      </View>
    </>
  );
}

const chatSt = StyleSheet.create({
  header: {
    paddingHorizontal: 16, paddingBottom: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#16a34a",
  },
  avatarWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center", position: "relative",
  },
  onlineDot: {
    position: "absolute", bottom: 0, right: 0,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: "#fbbf24", borderWidth: 2, borderColor: "#fff",
  },
  agentName: { color: "#fff", fontWeight: "800", fontSize: 16 },
  agentSub: { color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 1 },
  betaBadge: { backgroundColor: "#f59e0b", borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  betaText: { color: "#fff", fontSize: 8, fontWeight: "800", letterSpacing: 0.5 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
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
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: "center", justifyContent: "center",
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 },

  aiRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 16, borderRadius: 18, marginBottom: 10,
  },
  aiIconBg: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  aiRowTitle: { fontSize: 16, fontWeight: "800" },
  aiRowDesc: { fontSize: 12 },
  betaBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  betaBadgeText: { color: "#fff", fontSize: 8, fontWeight: "800", letterSpacing: 0.5 },

  row: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  iconBg: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  rowTitle: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  rowDesc: { fontSize: 12 },

  tarifHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingTop: 20, paddingBottom: 14, marginTop: 4, borderTopWidth: 1,
  },
  tarifIconBg: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  tarifTitle: { fontSize: 17, fontWeight: "800" },
  tarifSub: { fontSize: 12, marginTop: 1 },

  planCard: { width: 185, borderRadius: 20, padding: 16, gap: 6, position: "relative", marginBottom: 4 },
  popularBadge: {
    position: "absolute", top: -10, right: 12,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3,
  },
  popularText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  planIconBg: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  planName: { fontSize: 17, fontWeight: "800" },
  priceRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 4 },
  planPrice: { fontSize: 28, fontWeight: "800" },
  planCurrency: { fontSize: 12 },
  featureList: { gap: 5, marginBottom: 8 },
  featureItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  featureText: { fontSize: 11, flex: 1, lineHeight: 15 },
  planBtn: { borderRadius: 12, paddingVertical: 10, alignItems: "center", marginTop: 4 },
  planBtnText: { fontWeight: "700", fontSize: 13 },
});
