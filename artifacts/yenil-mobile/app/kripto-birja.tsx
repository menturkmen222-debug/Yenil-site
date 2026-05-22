import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  Platform, Modal, TextInput, ActivityIndicator, Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";
import {
  watchCryptoAds, createCryptoAd, initiateCryptoTrade, cancelCryptoAd, getReputation,
  type CryptoAd, type CryptoAdType,
} from "@/lib/firebase";
import { getLevel, formatRelativeTime } from "@/lib/reputation";
import { REP_THRESHOLDS } from "@/lib/payments";

export default function KriptoBirjaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { deviceId, balance } = useBonusPul();
  const isWeb = Platform.OS === "web";

  const [ads, setAds] = useState<CryptoAd[]>([]);
  const [tab, setTab] = useState<"all" | "sell_usdt" | "buy_usdt">("all");
  const [myRep, setMyRep] = useState(20);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<CryptoAdType>("sell_usdt");
  const [usdtAmt, setUsdtAmt] = useState("");
  const [bpRate, setBpRate] = useState("");
  const [creating, setCreating] = useState(false);
  const [tradingId, setTradingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = watchCryptoAds(setAds);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!deviceId) return;
    getReputation(deviceId).then(r => setMyRep(r.score));
  }, [deviceId]);

  const filtered = tab === "all" ? ads : ads.filter(a => a.type === tab);
  const canPost = myRep >= REP_THRESHOLDS.MIN_P2P_POST;

  async function handleCreate() {
    const usdt = parseFloat(usdtAmt);
    const rate = parseFloat(bpRate);
    if (!usdt || usdt <= 0) { Alert.alert("Ýalňyşlyk", "USDT mukdaryny giriziň"); return; }
    if (!rate || rate <= 0) { Alert.alert("Ýalňyşlyk", "Kursy giriziň"); return; }
    setCreating(true);
    const result = await createCryptoAd(deviceId, createType, usdt, rate);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCreateModal(false);
      setUsdtAmt("");
      setBpRate("");
    } else {
      Alert.alert("Ýalňyşlyk", result.message);
    }
    setCreating(false);
  }

  async function handleTrade(adId: string) {
    setTradingId(adId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await initiateCryptoTrade(adId, deviceId);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("✅ Söwda başlandy", result.message);
    } else {
      Alert.alert("Ýalňyşlyk", result.message);
    }
    setTradingId(null);
  }

  async function handleCancel(adId: string) {
    Alert.alert("E'lony ýatyr", "Bu e'lony ýatyrmagy isleýärsiňizmi?", [
      { text: "Ýok" },
      {
        text: "Ýatyr", style: "destructive",
        onPress: async () => {
          const result = await cancelCryptoAd(adId, deviceId);
          if (!result.success) Alert.alert("Ýalňyşlyk", result.message);
          else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }

  function CryptoAdCard({ ad }: { ad: CryptoAd }) {
    const isOwn = ad.ownerDeviceId === deviceId;
    const isSellUsdt = ad.type === "sell_usdt";
    const lv = getLevel(ad.ownerRepScore);
    const isLocked = ad.status === "locked";

    return (
      <View style={[cc.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Header */}
        <View style={cc.cardHead}>
          <View style={[cc.typePill, { backgroundColor: isSellUsdt ? "#05966918" : "#6366f118" }]}>
            <Ionicons
              name={isSellUsdt ? "arrow-up-circle-outline" : "arrow-down-circle-outline"}
              size={14}
              color={isSellUsdt ? "#059669" : "#6366f1"}
            />
            <Text style={[cc.typePillText, { color: isSellUsdt ? "#059669" : "#6366f1" }]}>
              {isSellUsdt ? "USDT Sat" : "USDT Al"}
            </Text>
          </View>
          {isLocked && (
            <View style={cc.lockedBadge}>
              <Ionicons name="lock-closed" size={11} color="#f59e0b" />
              <Text style={cc.lockedText}>Eskrod</Text>
            </View>
          )}
          {isOwn && (
            <Pressable onPress={() => handleCancel(ad.id)} style={cc.cancelBtn}>
              <Ionicons name="trash-outline" size={14} color="#ef4444" />
            </Pressable>
          )}
        </View>

        {/* Amounts */}
        <View style={cc.amountsRow}>
          <View style={cc.amountBlock}>
            <Text style={[cc.amountValue, { color: colors.foreground }]}>{ad.usdtAmount} USDT</Text>
            <Text style={[cc.amountLabel, { color: colors.mutedForeground }]}>Mukdar</Text>
          </View>
          <View style={[cc.rateCircle, { backgroundColor: isSellUsdt ? "#05966918" : "#6366f118" }]}>
            <Ionicons name="swap-horizontal-outline" size={18} color={isSellUsdt ? "#059669" : "#6366f1"} />
          </View>
          <View style={[cc.amountBlock, { alignItems: "flex-end" }]}>
            <Text style={[cc.amountValue, { color: colors.foreground }]}>{ad.totalBP.toFixed(1)} BP</Text>
            <Text style={[cc.amountLabel, { color: colors.mutedForeground }]}>{ad.bpPerUsdt} BP/USDT</Text>
          </View>
        </View>

        {/* Trader info */}
        <View style={cc.traderRow}>
          <View style={[cc.traderAvatar, { backgroundColor: lv.bg, borderColor: lv.border }]}>
            <Text style={{ fontSize: 14 }}>{lv.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[cc.traderName, { color: colors.foreground }]}>{ad.ownerNickname}</Text>
            <Text style={[cc.traderRep, { color: lv.color }]}>Abraý: {ad.ownerRepScore} · {lv.labelTm}</Text>
          </View>
          <Text style={[cc.adTime, { color: colors.mutedForeground }]}>{formatRelativeTime(ad.createdAt)}</Text>
        </View>

        {/* Trade button */}
        {!isOwn && !isLocked && (
          <Pressable
            onPress={() => handleTrade(ad.id)}
            disabled={tradingId === ad.id}
            style={[cc.tradeBtn, { backgroundColor: isSellUsdt ? "#059669" : "#6366f1" }]}
          >
            {tradingId === ad.id
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="swap-horizontal" size={16} color="#fff" />
            }
            <Text style={cc.tradeBtnText}>
              {tradingId === ad.id ? "Başlanýar..." : isSellUsdt ? "USDT Al" : "USDT Sat"}
            </Text>
          </Pressable>
        )}
      </View>
    );
  }

  const usdtNum = parseFloat(usdtAmt) || 0;
  const rateNum = parseFloat(bpRate) || 0;
  const totalBP = Math.round(usdtNum * rateNum * 100) / 100;

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#4c1d95", "#7c3aed"]}
        style={[s.header, { paddingTop: (isWeb ? 0 : insets.top) + 14 }]}
      >
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.headerTitle}>P2P Kripto Birja ₿</Text>
          <Text style={s.headerSub}>USDT ↔ BP ygtybarly söwda</Text>
        </View>
        {canPost && (
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowCreateModal(true); }}
            style={s.addBtn}
          >
            <Ionicons name="add" size={22} color="#7c3aed" />
          </Pressable>
        )}
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

        {/* ── Rep gate ── */}
        {!canPost && (
          <View style={[s.repGate, { backgroundColor: "#7c3aed" + "10", borderColor: "#7c3aed" + "25" }]}>
            <Text style={{ fontSize: 28, marginBottom: 4 }}>🔐</Text>
            <Text style={[s.repGateTitle, { color: colors.foreground }]}>E'lon ýerleşdirmek üçin</Text>
            <Text style={[s.repGateDesc, { color: colors.mutedForeground }]}>
              Abraý derejeniz <Text style={{ color: "#7c3aed", fontWeight: "800" }}>{REP_THRESHOLDS.MIN_P2P_POST}+</Text> bolmaly. Häzir: <Text style={{ color: "#7c3aed", fontWeight: "800" }}>{myRep}</Text>
            </Text>
          </View>
        )}

        {/* ── Info ── */}
        <View style={[s.escrowInfo, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[s.escrowIconWrap, { backgroundColor: "#7c3aed" + "18" }]}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#7c3aed" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.escrowTitle, { color: colors.foreground }]}>Eskrod goragly söwda</Text>
            <Text style={[s.escrowDesc, { color: colors.mutedForeground }]}>
              BP söwda wagtynda eskroda saklanýar. Admin tassykladykda ikitaraplaýyn geçirilýär.
            </Text>
          </View>
        </View>

        {/* ── Tabs ── */}
        <View style={[s.tabRow, { backgroundColor: colors.muted }]}>
          {[
            { id: "all" as const, label: "Ähli" },
            { id: "sell_usdt" as const, label: "USDT Sat" },
            { id: "buy_usdt" as const, label: "USDT Al" },
          ].map(t => (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={[s.tabBtn, tab === t.id && { backgroundColor: "#7c3aed" }]}
            >
              <Text style={[s.tabBtnText, { color: tab === t.id ? "#fff" : colors.mutedForeground }]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Ads ── */}
        {filtered.length === 0 ? (
          <View style={[s.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ fontSize: 36, textAlign: "center" }}>💱</Text>
            <Text style={[s.emptyTitle, { color: colors.foreground }]}>E'lon ýok</Text>
            <Text style={[s.emptyDesc, { color: colors.mutedForeground }]}>
              {canPost ? "Ilkinji e'lony siz ýerleşdiriň" : "Heniz elýeterli e'lon ýok"}
            </Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, gap: 10 }}>
            {filtered.map(ad => <CryptoAdCard key={ad.id} ad={ad} />)}
          </View>
        )}
      </ScrollView>

      {/* ── Create Ad Modal ── */}
      <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCreateModal(false)}>
        <View style={[s.modalWrap, { backgroundColor: colors.background }]}>
          <View style={[s.modalHandle, { backgroundColor: colors.border }]} />
          <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[s.modalTitle, { color: colors.foreground }]}>Täze E'lon</Text>
              <Text style={[s.modalSub, { color: colors.mutedForeground }]}>USDT söwda e'lony ýerleşdiriň</Text>
            </View>
            <Pressable onPress={() => setShowCreateModal(false)} style={[s.closeBtn, { backgroundColor: colors.muted }]}>
              <Ionicons name="close" size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
            {/* Ad type */}
            <View>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>Söwda görnüşi</Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                {[
                  { id: "sell_usdt" as const, label: "USDT Satmak (BP Al)", color: "#059669" },
                  { id: "buy_usdt" as const, label: "USDT Almak (BP Ber)", color: "#6366f1" },
                ].map(t => (
                  <Pressable
                    key={t.id}
                    onPress={() => setCreateType(t.id)}
                    style={[
                      s.typeBtn,
                      {
                        flex: 1, backgroundColor: createType === t.id ? t.color : colors.card,
                        borderColor: createType === t.id ? t.color : colors.border,
                      },
                    ]}
                  >
                    <Text style={[s.typeBtnText, { color: createType === t.id ? "#fff" : colors.foreground }]}>
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* USDT amount */}
            <View style={{ gap: 6 }}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>USDT Mukdary</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
                value={usdtAmt}
                onChangeText={setUsdtAmt}
                keyboardType="numeric"
                placeholder="ör: 10"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            {/* BP/USDT rate */}
            <View style={{ gap: 6 }}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>BP/USDT Kursy</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
                value={bpRate}
                onChangeText={setBpRate}
                keyboardType="numeric"
                placeholder="ör: 28 (1 USDT = 28 BP)"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            {/* Preview */}
            {usdtNum > 0 && rateNum > 0 && (
              <View style={[s.previewBox, { backgroundColor: "#7c3aed" + "08", borderColor: "#7c3aed" + "20" }]}>
                <Text style={[s.previewLabel, { color: colors.mutedForeground }]}>
                  {usdtNum} USDT × {rateNum} BP = <Text style={{ color: "#7c3aed", fontWeight: "800" }}>{totalBP} BP</Text>
                </Text>
                {createType === "sell_usdt" && (
                  <Text style={[s.previewSub, { color: colors.mutedForeground }]}>
                    Bu mukdar siziň balansyňyzdan alynýar (eskrod)
                  </Text>
                )}
              </View>
            )}

            <Pressable
              onPress={handleCreate}
              disabled={creating || !usdtAmt || !bpRate}
              style={[s.btnPrimary, { backgroundColor: "#7c3aed", opacity: !usdtAmt || !bpRate ? 0.5 : 1 }]}
            >
              {creating
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="add-circle-outline" size={18} color="#fff" />
              }
              <Text style={s.btnPrimaryText}>{creating ? "Ýerleşdirilýär..." : "E'lon ýerleşdir"}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const cc = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 12 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  typePill: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  typePillText: { fontSize: 11, fontWeight: "700" },
  lockedBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#f59e0b18", borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  lockedText: { fontSize: 10, color: "#f59e0b", fontWeight: "700" },
  cancelBtn: { marginLeft: "auto" as any, padding: 4 },
  amountsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  amountBlock: { gap: 3 },
  amountValue: { fontSize: 20, fontWeight: "800" },
  amountLabel: { fontSize: 11 },
  rateCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  traderRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  traderAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  traderName: { fontSize: 13, fontWeight: "700" },
  traderRep: { fontSize: 11, marginTop: 1 },
  adTime: { fontSize: 10 },
  tradeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 12 },
  tradeBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});

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
  addBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
  },

  repGate: {
    marginHorizontal: 16, marginTop: 16, borderRadius: 16, borderWidth: 1,
    padding: 20, alignItems: "center", gap: 4,
  },
  repGateTitle: { fontSize: 15, fontWeight: "700" },
  repGateDesc: { fontSize: 13, textAlign: "center" },

  escrowInfo: {
    flexDirection: "row", gap: 12, alignItems: "flex-start",
    marginHorizontal: 16, marginTop: 12, borderRadius: 16, borderWidth: 1, padding: 14,
  },
  escrowIconWrap: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  escrowTitle: { fontSize: 13, fontWeight: "700", marginBottom: 3 },
  escrowDesc: { fontSize: 12, lineHeight: 17 },

  tabRow: {
    flexDirection: "row", marginHorizontal: 16, marginTop: 14,
    borderRadius: 12, padding: 3, gap: 2,
  },
  tabBtn: { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: "center" },
  tabBtnText: { fontSize: 12, fontWeight: "700" },

  empty: {
    marginHorizontal: 16, marginTop: 12, borderRadius: 18, borderWidth: 1,
    padding: 28, alignItems: "center", gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyDesc: { fontSize: 13, textAlign: "center" },

  modalWrap: { flex: 1 },
  modalHandle: { width: 38, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 8 },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  modalSub: { fontSize: 12, marginTop: 2 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  inputLabel: { fontSize: 13, fontWeight: "600" },
  typeBtn: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 10, borderWidth: 1.5, alignItems: "center" },
  typeBtnText: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, fontWeight: "700" },
  previewBox: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 4 },
  previewLabel: { fontSize: 14 },
  previewSub: { fontSize: 11 },
  btnPrimary: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 14, paddingVertical: 15,
  },
  btnPrimaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
