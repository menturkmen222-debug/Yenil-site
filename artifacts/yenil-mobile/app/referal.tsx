import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  Platform, ActivityIndicator, Share, TextInput, Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { useColors } from "@/hooks/useColors";
import { PessimisticButton } from "@/components/PessimisticButton";
import { useBonusPul } from "@/contexts/BonusPulContext";
import {
  getOrCreateReferralCode, getReferralStats, applyReferralCode,
  type ReferralStats,
} from "@/lib/firebase";

export default function ReferalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { deviceId } = useBonusPul();
  const isWeb = Platform.OS === "web";

  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [applyCode, setApplyCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyMsg, setApplyMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!deviceId) return;
    setLoading(true);
    getReferralStats(deviceId).then(s => {
      setStats(s);
      setLoading(false);
    });
  }, [deviceId]);

  async function handleCopy() {
    if (!stats?.code) return;
    await Clipboard.setStringAsync(stats.code);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleShare() {
    if (!stats?.code) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Share.share({
      message: `Ýeňil programmasy — Türkmenistanyň iň ynamly onlayn hyzmat platformasy!\n\nMeniň referal kodum: ${stats.code}\n\nYükle we ilkinji sargytyňda bonus BP al!`,
      title: "Ýeňil — Referal",
    });
  }

  async function handleApplyCode() {
    const code = applyCode.trim().toUpperCase();
    if (!code) { Alert.alert("Ýalňyşlyk", "Kod giriziň"); return; }
    setApplying(true);
    setApplyMsg(null);
    const result = await applyReferralCode(deviceId, code);
    setApplyMsg({ type: result.success ? "success" : "error", text: result.message });
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setApplyCode("");
    }
    setApplying(false);
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#312e81", "#6366f1"]}
        style={[s.header, { paddingTop: (isWeb ? 0 : insets.top) + 14 }]}
      >
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.headerTitle}>Ýeňil Referal</Text>
          <Text style={s.headerSub}>Dostlaryngyz üçin BP gazanyň</Text>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

        {loading ? (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : (
          <>
            {/* ── Stats ── */}
            <View style={s.statsRow}>
              {[
                { label: "Çagyryldy", value: stats?.totalJoins ?? 0, icon: "people-outline", color: "#6366f1" },
                { label: "Jemi Gazanylan", value: `${(stats?.totalEarned ?? 0).toFixed(1)} BP`, icon: "wallet-outline", color: "#059669" },
                { label: "Passiwli Komissiýa", value: `${(stats?.passiveEarned ?? 0).toFixed(1)} BP`, icon: "trending-up-outline", color: "#f59e0b" },
              ].map((st, i) => (
                <View key={i} style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[s.statIcon, { backgroundColor: st.color + "18" }]}>
                    <Ionicons name={st.icon as any} size={20} color={st.color} />
                  </View>
                  <Text style={[s.statValue, { color: st.color }]}>{st.value}</Text>
                  <Text style={[s.statLabel, { color: colors.mutedForeground }]}>{st.label}</Text>
                </View>
              ))}
            </View>

            {/* ── Referral Code Card ── */}
            <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>SIZIŇ REFERAL KODUNUZ</Text>
            <LinearGradient
              colors={["#312e81", "#6366f1"]}
              style={s.codeCard}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <View style={s.codeCardTop}>
                <View style={s.codeIconWrap}>
                  <Ionicons name="link-outline" size={24} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.codeCardLabel}>Şahsy Referal Kodunyz</Text>
                  <Text style={s.codeCardSub}>Dostlaryňyza paýlaşyň</Text>
                </View>
              </View>
              <Text style={s.codeText}>{stats?.code || "..."}</Text>
              <View style={s.codeActions}>
                <Pressable onPress={handleCopy} style={s.codeActionBtn}>
                  <Ionicons name={copied ? "checkmark" : "copy-outline"} size={16} color="#fff" />
                  <Text style={s.codeActionText}>{copied ? "Göçürildi!" : "Göçür"}</Text>
                </Pressable>
                <Pressable onPress={handleShare} style={[s.codeActionBtn, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
                  <Ionicons name="share-social-outline" size={16} color="#fff" />
                  <Text style={s.codeActionText}>Paýlaş</Text>
                </Pressable>
              </View>
            </LinearGradient>

            {/* ── How it works ── */}
            <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>NÄHILI IŞLEÝÄR?</Text>
            <View style={[s.howCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {[
                {
                  icon: "share-social-outline",
                  color: "#6366f1",
                  title: "Kod paýlaşyň",
                  desc: "Dostuňyz kody girizen dessine hasabyňyza 0.5 BP geçirilýär",
                },
                {
                  icon: "trending-up-outline",
                  color: "#059669",
                  title: "Passiwli gazanç",
                  desc: "Dostuňyz her gezek bilet satyn alandan ýa-da taksi çagyrandan 0.2 BP alýarsyňyz",
                },
                {
                  icon: "infinite-outline",
                  color: "#f59e0b",
                  title: "Çäklendirilmedik",
                  desc: "Näçe köp dost çagyrsa, şonça köp gazanýarsyňyz — dowamly",
                },
              ].map((item, i) => (
                <View key={i} style={[s.howRow, i < 2 && { borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 14 }]}>
                  <View style={[s.howIcon, { backgroundColor: item.color + "18" }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[s.howTitle, { color: colors.foreground }]}>{item.title}</Text>
                    <Text style={[s.howDesc, { color: colors.mutedForeground }]}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* ── Apply someone's code ── */}
            <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>BAŞGANYŇ KODYNY ULANYŇ</Text>
            <View style={[s.applyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.applyDesc, { color: colors.mutedForeground }]}>
                Biriniň referal kodyny ulananyňyzda ol 0.5 BP alýar we ikitaraplaýyn goldaş bolýarsyňyz.
              </Text>
              <View style={s.applyRow}>
                <TextInput
                  style={[s.applyInput, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
                  value={applyCode}
                  onChangeText={t => setApplyCode(t.toUpperCase())}
                  placeholder="Kody giriziň (ör: ABC12345)"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="characters"
                  maxLength={8}
                />
                <PessimisticButton
                  label=""
                  loadingLabel=""
                  loading={applying}
                  disabled={applying || !applyCode.trim()}
                  onPress={handleApplyCode}
                  color="#6366f1"
                  size="sm"
                  icon={<Ionicons name="checkmark" size={20} color="#fff" />}
                />
              </View>
              {applyMsg && (
                <View style={[s.applyMsg, {
                  backgroundColor: applyMsg.type === "success" ? "#059669" + "12" : "#ef4444" + "12",
                  borderColor: applyMsg.type === "success" ? "#059669" + "30" : "#ef4444" + "30",
                }]}>
                  <Ionicons
                    name={applyMsg.type === "success" ? "checkmark-circle-outline" : "close-circle-outline"}
                    size={15} color={applyMsg.type === "success" ? "#059669" : "#ef4444"}
                  />
                  <Text style={[s.applyMsgText, { color: applyMsg.type === "success" ? "#059669" : "#ef4444" }]}>
                    {applyMsg.text}
                  </Text>
                </View>
              )}
            </View>

            {/* ── Earnings breakdown ── */}
            <View style={[s.earningsCard, { backgroundColor: "#6366f1" + "08", borderColor: "#6366f1" + "20" }]}>
              <Ionicons name="calculator-outline" size={18} color="#6366f1" />
              <View style={{ flex: 1 }}>
                <Text style={[s.earningsTitle, { color: colors.foreground }]}>Gazanç Hasaplamasý</Text>
                <Text style={[s.earningsRow, { color: colors.mutedForeground }]}>10 dost → birinji gün: <Text style={{ color: "#059669", fontWeight: "700" }}>5 BP</Text></Text>
                <Text style={[s.earningsRow, { color: colors.mutedForeground }]}>10 dost × aýda 5 sargyt × 0.2 BP = <Text style={{ color: "#6366f1", fontWeight: "700" }}>10 BP/aý passiv</Text></Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 18,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.72)", fontSize: 11, marginTop: 2 },

  sectionLabel: {
    fontSize: 11, fontWeight: "700", letterSpacing: 0.8,
    marginLeft: 20, marginTop: 20, marginBottom: 8,
  },

  statsRow: {
    flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: 16,
  },
  statCard: {
    flex: 1, borderRadius: 14, borderWidth: 1, padding: 12,
    alignItems: "center", gap: 6,
  },
  statIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 16, fontWeight: "800" },
  statLabel: { fontSize: 9, textAlign: "center", fontWeight: "600" },

  codeCard: {
    marginHorizontal: 16, borderRadius: 20, padding: 22,
    shadowColor: "#6366f1", shadowOpacity: 0.25, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  codeCardTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  codeIconWrap: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  codeCardLabel: { color: "#fff", fontSize: 16, fontWeight: "800" },
  codeCardSub: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 },
  codeText: {
    color: "#fff", fontSize: 32, fontWeight: "900",
    letterSpacing: 5, textAlign: "center", marginBottom: 20,
  },
  codeActions: { flexDirection: "row", gap: 10 },
  codeActionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 12, paddingVertical: 10,
  },
  codeActionText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  howCard: {
    marginHorizontal: 16, borderRadius: 16, borderWidth: 1, padding: 16, gap: 14,
  },
  howRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", paddingTop: 0 },
  howIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  howTitle: { fontSize: 13, fontWeight: "700" },
  howDesc: { fontSize: 12, lineHeight: 18 },

  applyCard: {
    marginHorizontal: 16, borderRadius: 16, borderWidth: 1, padding: 16, gap: 12,
  },
  applyDesc: { fontSize: 12, lineHeight: 18 },
  applyRow: { flexDirection: "row", gap: 10 },
  applyInput: {
    flex: 1, borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 16, fontWeight: "700", letterSpacing: 2,
  },
  applyBtn: {
    width: 50, borderRadius: 12, alignItems: "center", justifyContent: "center",
  },
  applyMsg: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 10, borderWidth: 1, padding: 10,
  },
  applyMsgText: { flex: 1, fontSize: 12, fontWeight: "600" },

  earningsCard: {
    flexDirection: "row", gap: 12, alignItems: "flex-start",
    marginHorizontal: 16, marginTop: 4, padding: 14,
    borderRadius: 14, borderWidth: 1,
  },
  earningsTitle: { fontSize: 13, fontWeight: "700", marginBottom: 4 },
  earningsRow: { fontSize: 12, lineHeight: 19 },
});
