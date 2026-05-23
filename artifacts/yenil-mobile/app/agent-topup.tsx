import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  Platform, Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";
import {
  createAgentDeposit, watchAgentDeposits, saveReputationEntry,
  ADMIN_CARD_NUMBER, ADMIN_CARD_HOLDER, BP_BONUS_PERCENT,
  type AgentDeposit,
} from "@/lib/firebase";
import { formatRelativeTime } from "@/lib/reputation";
import { PessimisticButton } from "@/components/PessimisticButton";

const MIN_TMT = 50;
const STATUS_MAP: Record<AgentDeposit["status"], { label: string; color: string; icon: string }> = {
  pending: { label: "Garaşylýar", color: "#f59e0b", icon: "time-outline" },
  confirmed: { label: "Tassyklandy", color: "#059669", icon: "checkmark-circle-outline" },
  rejected: { label: "Ret edildi", color: "#ef4444", icon: "close-circle-outline" },
};

export default function AgentTopupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { deviceId, balance, refreshBalance } = useBonusPul();
  const isWeb = Platform.OS === "web";

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deposits, setDeposits] = useState<AgentDeposit[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const tmt = parseFloat(amount) || 0;
  const bpEarned = Math.round(tmt * (1 + BP_BONUS_PERCENT / 100) * 100) / 100;
  const bonusAmount = Math.round(tmt * (BP_BONUS_PERCENT / 100) * 100) / 100;

  useEffect(() => {
    if (!deviceId) return;
    const unsub = watchAgentDeposits(deviceId, setDeposits);
    return () => unsub();
  }, [deviceId]);

  async function handleCopyCard() {
    await Clipboard.setStringAsync(ADMIN_CARD_NUMBER.replace(/\s/g, ""));
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleSubmit() {
    if (tmt < MIN_TMT) {
      Alert.alert("Ýalňyşlyk", `Minimum ${MIN_TMT} TMT geçirip bolýar`);
      return;
    }
    setLoading(true);
    try {
      await createAgentDeposit(deviceId, tmt);
      await saveReputationEntry(deviceId, {
        type: "positive",
        reason: "Agent deposit sargyt iberildi",
        delta: 1,
        timestamp: new Date().toISOString(),
        isPublic: false,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep(3);
      setAmount("");
    } catch {
      Alert.alert("Ýalňyşlyk", "Sargyt döredilmedi. Täzeden synanyşyň.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#064e3b", "#059669"]}
        style={[s.header, { paddingTop: (isWeb ? 0 : insets.top) + 14 }]}
      >
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.headerTitle}>Agent — TMT → BP</Text>
          <Text style={s.headerSub}>Admin kartasyna TMT geçiriň, +15% bonus BP alyň</Text>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

        {step === 3 ? (
          <View style={s.successWrap}>
            <View style={[s.successCircle, { backgroundColor: "#059669" + "18" }]}>
              <Ionicons name="checkmark-circle" size={64} color="#059669" />
            </View>
            <Text style={[s.successTitle, { color: colors.foreground }]}>Sargyt iberildi!</Text>
            <Text style={[s.successDesc, { color: colors.mutedForeground }]}>
              Admin tassyklansoň, BP hasabyňyza otomatik geçirilýär. Adatda 5–30 minut içinde.
            </Text>
            <Pressable
              onPress={() => setStep(1)}
              style={[s.btnPrimary, { backgroundColor: "#059669", marginTop: 24 }]}
            >
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={s.btnPrimaryText}>Täze sargyt</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* ── How it works ── */}
            <View style={[s.howCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.howTitle, { color: colors.foreground }]}>Nähili işleýär?</Text>
              {[
                { num: "1", text: `Aşakdaky admin kartasyna TMT geçiriň`, color: "#059669" },
                { num: "2", text: "Sargyt ibereniňizde admin tassyklar", color: "#6366f1" },
                { num: "3", text: `${BP_BONUS_PERCENT}% goşmaça bonus bilen BP alýarsyňyz`, color: "#f59e0b" },
              ].map(item => (
                <View key={item.num} style={s.stepRow}>
                  <View style={[s.stepNum, { backgroundColor: item.color }]}>
                    <Text style={s.stepNumText}>{item.num}</Text>
                  </View>
                  <Text style={[s.stepText, { color: colors.foreground }]}>{item.text}</Text>
                </View>
              ))}
            </View>

            {/* ── Admin Card ── */}
            <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>ADMIN KARTAS</Text>
            <Pressable
              onPress={handleCopyCard}
              style={({ pressed }) => [
                s.cardDisplay,
                { backgroundColor: "#059669", opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <LinearGradient
                colors={["#064e3b", "#059669"]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              />
              <View style={s.cardChip}>
                <Ionicons name="card-outline" size={22} color="rgba(255,255,255,0.6)" />
              </View>
              <Text style={s.cardNumber}>{ADMIN_CARD_NUMBER}</Text>
              <View style={s.cardBottom}>
                <View>
                  <Text style={s.cardLabel}>KART EÝESI</Text>
                  <Text style={s.cardHolder}>{ADMIN_CARD_HOLDER}</Text>
                </View>
                <View style={[s.copyBtn, { backgroundColor: copied ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.2)" }]}>
                  <Ionicons name={copied ? "checkmark" : "copy-outline"} size={14} color="#fff" />
                  <Text style={s.copyBtnText}>{copied ? "Gopçiklendy!" : "Kopirlä"}</Text>
                </View>
              </View>
            </Pressable>

            {/* ── Amount Input ── */}
            <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>GEÇIRJEK MUKDARYŇYZ</Text>
            <View style={[s.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.inputRow}>
                <TextInput
                  style={[s.amountInput, { color: colors.foreground, borderColor: colors.border }]}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder={`Min: ${MIN_TMT} TMT`}
                  placeholderTextColor={colors.mutedForeground}
                />
                <View style={[s.currencyBadge, { backgroundColor: "#059669" + "18" }]}>
                  <Text style={[s.currencyText, { color: "#059669" }]}>TMT</Text>
                </View>
              </View>

              {tmt >= MIN_TMT && (
                <View style={[s.calcBox, { backgroundColor: "#059669" + "08", borderColor: "#059669" + "20" }]}>
                  <View style={s.calcRow}>
                    <Text style={[s.calcLabel, { color: colors.mutedForeground }]}>Esasy TMT:</Text>
                    <Text style={[s.calcValue, { color: colors.foreground }]}>{tmt} TMT</Text>
                  </View>
                  <View style={s.calcRow}>
                    <Text style={[s.calcLabel, { color: colors.mutedForeground }]}>{BP_BONUS_PERCENT}% bonus:</Text>
                    <Text style={[s.calcValue, { color: "#059669" }]}>+{bonusAmount} BP</Text>
                  </View>
                  <View style={[s.calcDivider, { backgroundColor: "#059669" + "20" }]} />
                  <View style={s.calcRow}>
                    <Text style={[s.calcLabelBig, { color: colors.foreground }]}>Jemi BP:</Text>
                    <Text style={[s.calcValueBig, { color: "#059669" }]}>{bpEarned} BP</Text>
                  </View>
                </View>
              )}

              <Text style={[s.warningText, { color: colors.mutedForeground }]}>
                Pul geçireniňizden SOŇRA sargyt iberiň. Tassyklanmaz öň BP berilmez.
              </Text>

              <View style={{ marginTop: 6 }}>
                <PessimisticButton
                  label="Sargyt iber"
                  loadingLabel="Iberilýär..."
                  loading={loading}
                  disabled={loading || tmt < MIN_TMT}
                  onPress={handleSubmit}
                  color="#059669"
                  size="lg"
                  icon={<Ionicons name="send-outline" size={18} color="#fff" />}
                />
              </View>
            </View>
          </>
        )}

        {/* ── Deposit History ── */}
        {deposits.length > 0 && (
          <>
            <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>SARGYT TARYHY</Text>
            <View style={{ paddingHorizontal: 16, gap: 8 }}>
              {deposits.slice(0, 10).map(dep => {
                const st = STATUS_MAP[dep.status];
                return (
                  <View key={dep.id} style={[s.historyItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[s.historyIconWrap, { backgroundColor: st.color + "18" }]}>
                      <Ionicons name={st.icon as any} size={20} color={st.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <Text style={[s.historyAmount, { color: colors.foreground }]}>{dep.tmtAmount} TMT → {dep.bpAmount} BP</Text>
                        <View style={[s.statusBadge, { backgroundColor: st.color + "15" }]}>
                          <Text style={[s.statusText, { color: st.color }]}>{st.label}</Text>
                        </View>
                      </View>
                      <Text style={[s.historyTime, { color: colors.mutedForeground }]}>{formatRelativeTime(dep.createdAt)}</Text>
                    </View>
                  </View>
                );
              })}
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

  howCard: {
    marginHorizontal: 16, marginTop: 16, borderRadius: 16,
    borderWidth: 1, padding: 16, gap: 12,
  },
  howTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepNum: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  stepNumText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  stepText: { flex: 1, fontSize: 13, lineHeight: 19 },

  cardDisplay: {
    marginHorizontal: 16, borderRadius: 20, padding: 22,
    overflow: "hidden",
    shadowColor: "#059669", shadowOpacity: 0.3, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  cardChip: { marginBottom: 20 },
  cardNumber: { color: "#fff", fontSize: 22, fontWeight: "700", letterSpacing: 3, marginBottom: 20 },
  cardBottom: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  cardLabel: { color: "rgba(255,255,255,0.6)", fontSize: 9, letterSpacing: 1, fontWeight: "700" },
  cardHolder: { color: "#fff", fontSize: 13, fontWeight: "700", marginTop: 2 },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  copyBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  inputCard: {
    marginHorizontal: 16, borderRadius: 16, borderWidth: 1, padding: 16, gap: 14,
  },
  inputRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  amountInput: {
    flex: 1, borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 22, fontWeight: "700",
  },
  currencyBadge: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  currencyText: { fontSize: 14, fontWeight: "800" },

  calcBox: {
    borderRadius: 12, borderWidth: 1, padding: 14, gap: 8,
  },
  calcRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  calcLabel: { fontSize: 13 },
  calcValue: { fontSize: 13, fontWeight: "700" },
  calcDivider: { height: 1, marginVertical: 2 },
  calcLabelBig: { fontSize: 15, fontWeight: "700" },
  calcValueBig: { fontSize: 20, fontWeight: "800" },

  warningText: { fontSize: 12, lineHeight: 18 },

  btnPrimary: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 14, paddingVertical: 15,
  },
  btnPrimaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  historyItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 14,
  },
  historyIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  historyAmount: { fontSize: 13, fontWeight: "700" },
  historyTime: { fontSize: 11, marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: "700" },

  successWrap: { alignItems: "center", paddingHorizontal: 32, paddingTop: 48, gap: 12 },
  successCircle: { width: 110, height: 110, borderRadius: 55, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  successTitle: { fontSize: 24, fontWeight: "800", textAlign: "center" },
  successDesc: { fontSize: 14, textAlign: "center", lineHeight: 22 },
});
