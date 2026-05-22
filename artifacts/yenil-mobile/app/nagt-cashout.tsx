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
  watchNagtOrders, createNagtOrder, acceptNagtOrder, completeNagtOrder, getReputation,
  NAGT_RATE, type NagtOrder,
} from "@/lib/firebase";
import { formatRelativeTime } from "@/lib/reputation";
import { REP_THRESHOLDS, MIN_CASHOUT_BP } from "@/lib/payments";

const CITIES = ["Aşgabat", "Türkmenabat", "Mary", "Balkanabat", "Daşoguz", "Tejen", "Serdar", "Türkmenbaşy"];

const STATUS_COLORS: Record<NagtOrder["status"], string> = {
  open: "#059669",
  matched: "#6366f1",
  completed: "#94a3b8",
  cancelled: "#ef4444",
};

const STATUS_LABELS: Record<NagtOrder["status"], string> = {
  open: "Garaşylýar",
  matched: "Agent tapyldy",
  completed: "Tamamlandy",
  cancelled: "Ýatyryldy",
};

export default function NagtCashoutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { deviceId, balance } = useBonusPul();
  const isWeb = Platform.OS === "web";

  const [orders, setOrders] = useState<NagtOrder[]>([]);
  const [myRep, setMyRep] = useState(20);
  const [showModal, setShowModal] = useState(false);
  const [bpAmt, setBpAmt] = useState("");
  const [city, setCity] = useState("Aşgabat");
  const [submitting, setSubmitting] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = watchNagtOrders(setOrders);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!deviceId) return;
    getReputation(deviceId).then(r => setMyRep(r.score));
  }, [deviceId]);

  const bp = parseFloat(bpAmt) || 0;
  const tmt = Math.round(bp * NAGT_RATE * 100) / 100;
  const canBeAgent = myRep >= REP_THRESHOLDS.MIN_AGENT;

  const myOrders = orders.filter(o => o.userDeviceId === deviceId);
  const otherOrders = orders.filter(o => o.userDeviceId !== deviceId && o.status === "open");

  async function handleCreate() {
    if (bp < MIN_CASHOUT_BP) { Alert.alert("Ýalňyşlyk", `Minimum ${MIN_CASHOUT_BP} BP çykaryp bolýar`); return; }
    if (bp > balance) { Alert.alert("Ýalňyşlyk", `Ýeterlik BP ýok (${balance.toFixed(2)} BP)`); return; }
    setSubmitting(true);
    const result = await createNagtOrder(deviceId, bp, city);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowModal(false);
      setBpAmt("");
    } else {
      Alert.alert("Ýalňyşlyk", result.message);
    }
    setSubmitting(false);
  }

  async function handleAccept(orderId: string) {
    setActingId(orderId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await acceptNagtOrder(orderId, deviceId);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("✅ Kabul edildi", result.message);
    } else {
      Alert.alert("Ýalňyşlyk", result.message);
    }
    setActingId(null);
  }

  async function handleComplete(orderId: string) {
    Alert.alert("Tamamla", "Söwda tamamlandy diýip tassyklaýarsyňyzmy?", [
      { text: "Ýok" },
      {
        text: "Hawa, tamamlandy",
        onPress: async () => {
          setActingId(orderId);
          const result = await completeNagtOrder(orderId, deviceId);
          if (result.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("🎉 Üstünlik!", result.message);
          } else {
            Alert.alert("Ýalňyşlyk", result.message);
          }
          setActingId(null);
        },
      },
    ]);
  }

  function OrderCard({ order }: { order: NagtOrder }) {
    const isMyOrder = order.userDeviceId === deviceId;
    const isMyAgentOrder = order.agentDeviceId === deviceId;
    const statusColor = STATUS_COLORS[order.status];

    return (
      <View style={[oc.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={oc.header}>
          <View style={oc.amountWrap}>
            <Text style={[oc.bpAmt, { color: colors.foreground }]}>{order.bpAmount} BP</Text>
            <Text style={[oc.arrow, { color: colors.mutedForeground }]}>→</Text>
            <Text style={[oc.tmtAmt, { color: "#0284c7" }]}>{order.tmtEquivalent} TMT nagt</Text>
          </View>
          <View style={[oc.statusBadge, { backgroundColor: statusColor + "18" }]}>
            <View style={[oc.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[oc.statusText, { color: statusColor }]}>{STATUS_LABELS[order.status]}</Text>
          </View>
        </View>

        <View style={oc.infoRow}>
          <Ionicons name="location-outline" size={13} color={colors.mutedForeground} />
          <Text style={[oc.city, { color: colors.foreground }]}>{order.city}</Text>
          <Text style={[oc.separator, { color: colors.mutedForeground }]}>·</Text>
          <Text style={[oc.time, { color: colors.mutedForeground }]}>{formatRelativeTime(order.createdAt)}</Text>
        </View>

        {order.agentNickname && (
          <View style={[oc.agentRow, { backgroundColor: "#6366f1" + "10" }]}>
            <Ionicons name="person-outline" size={13} color="#6366f1" />
            <Text style={[oc.agentText, { color: "#6366f1" }]}>Agent: {order.agentNickname}</Text>
          </View>
        )}

        {/* Buttons */}
        {!isMyOrder && canBeAgent && order.status === "open" && (
          <Pressable
            onPress={() => handleAccept(order.id)}
            disabled={actingId === order.id}
            style={[oc.actionBtn, { backgroundColor: "#0284c7" }]}
          >
            {actingId === order.id
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="people-outline" size={15} color="#fff" />
            }
            <Text style={oc.actionBtnText}>Agent hökmünde kabul et</Text>
          </Pressable>
        )}

        {isMyAgentOrder && order.status === "matched" && (
          <Pressable
            onPress={() => handleComplete(order.id)}
            disabled={actingId === order.id}
            style={[oc.actionBtn, { backgroundColor: "#059669" }]}
          >
            {actingId === order.id
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="checkmark-circle-outline" size={15} color="#fff" />
            }
            <Text style={oc.actionBtnText}>Tamamlandı diye belirt</Text>
          </Pressable>
        )}

        {isMyOrder && (
          <View style={[oc.ownerBadge, { backgroundColor: colors.primary + "12" }]}>
            <Ionicons name="person-circle-outline" size={12} color={colors.primary} />
            <Text style={[oc.ownerText, { color: colors.primary }]}>Siziň sargytyňyz</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#0c4a6e", "#0284c7"]}
        style={[s.header, { paddingTop: (isWeb ? 0 : insets.top) + 14 }]}
      >
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.headerTitle}>Nagt Pul P2P 💵</Text>
          <Text style={s.headerSub}>BP balansyňyzy nagt TMT-a çalşyň</Text>
        </View>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowModal(true); }}
          style={s.addBtn}
        >
          <Ionicons name="add" size={22} color="#0284c7" />
        </Pressable>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

        {/* ── How it works ── */}
        <View style={[s.howCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.howTitle, { color: colors.foreground }]}>Binance P2P ýaly işleýär</Text>
          <View style={{ gap: 10, marginTop: 8 }}>
            {[
              { emoji: "📱", text: "Siz BP mukdaryny we şäheriňizi görkeziň" },
              { emoji: "🤝", text: "Şäheriňizdäki agent sargydyňyzy kabul eder" },
              { emoji: "💵", text: "Duşuşyp nagt TMT alyň, agent BP alýar" },
              { emoji: "✅", text: "Ikitaraplaýyn abraý baly ýokarlanýar" },
            ].map((item, i) => (
              <View key={i} style={s.howRow}>
                <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
                <Text style={[s.howText, { color: colors.foreground }]}>{item.text}</Text>
              </View>
            ))}
          </View>
          <View style={[s.rateRow, { backgroundColor: "#0284c7" + "10", borderColor: "#0284c7" + "25" }]}>
            <Ionicons name="information-circle-outline" size={15} color="#0284c7" />
            <Text style={[s.rateText, { color: colors.foreground }]}>
              Häzirki kurs: <Text style={{ color: "#0284c7", fontWeight: "800" }}>1 BP = {NAGT_RATE} TMT</Text>
            </Text>
          </View>
        </View>

        {/* ── Agent req ── */}
        {!canBeAgent && (
          <View style={[s.agentGate, { backgroundColor: "#0284c7" + "10", borderColor: "#0284c7" + "25" }]}>
            <Ionicons name="shield-outline" size={18} color="#0284c7" />
            <Text style={[s.agentGateText, { color: colors.foreground }]}>
              Agent bolmak üçin abraý derejeniz <Text style={{ color: "#0284c7", fontWeight: "800" }}>{REP_THRESHOLDS.MIN_AGENT}+</Text> bolmaly. Häzir: {myRep}
            </Text>
          </View>
        )}

        {/* ── My orders ── */}
        {myOrders.length > 0 && (
          <>
            <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>MENIŇ SARGYÇLARYM</Text>
            <View style={{ paddingHorizontal: 16, gap: 10 }}>
              {myOrders.map(o => <OrderCard key={o.id} order={o} />)}
            </View>
          </>
        )}

        {/* ── Available orders ── */}
        <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>
          AÇYK SARGYÇLAR ({otherOrders.length})
        </Text>
        {otherOrders.length === 0 ? (
          <View style={[s.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ fontSize: 36, textAlign: "center" }}>💵</Text>
            <Text style={[s.emptyTitle, { color: colors.foreground }]}>Häzir açyk sargyt ýok</Text>
            <Text style={[s.emptyDesc, { color: colors.mutedForeground }]}>
              Ilkinji nagt çykaryş sargydy ýerleşdiriň
            </Text>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowModal(true); }}
              style={[s.emptyBtn, { backgroundColor: "#0284c7" }]}
            >
              <Ionicons name="add-circle-outline" size={16} color="#fff" />
              <Text style={s.emptyBtnText}>Sargyt ýerleşdir</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, gap: 10 }}>
            {otherOrders.map(o => <OrderCard key={o.id} order={o} />)}
          </View>
        )}
      </ScrollView>

      {/* ── New Order Modal ── */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <View style={[s.modalWrap, { backgroundColor: colors.background }]}>
          <View style={[s.modalHandle, { backgroundColor: colors.border }]} />
          <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[s.modalTitle, { color: colors.foreground }]}>Nagt Çykaryş</Text>
              <Text style={[s.modalSub, { color: colors.mutedForeground }]}>Bakiye: {balance.toFixed(2)} BP</Text>
            </View>
            <Pressable onPress={() => setShowModal(false)} style={[s.closeBtn, { backgroundColor: colors.muted }]}>
              <Ionicons name="close" size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
            <View style={{ gap: 6 }}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>BP Mukdary (min {MIN_CASHOUT_BP} BP)</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
                value={bpAmt}
                onChangeText={setBpAmt}
                keyboardType="numeric"
                placeholder={`Balans: ${balance.toFixed(2)} BP`}
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            {bp >= MIN_CASHOUT_BP && (
              <View style={[s.calcBox, { backgroundColor: "#0284c7" + "08", borderColor: "#0284c7" + "20" }]}>
                <View style={s.calcRow}>
                  <Text style={[s.calcLabel, { color: colors.mutedForeground }]}>Beriljek BP:</Text>
                  <Text style={[s.calcValue, { color: colors.foreground }]}>{bp} BP</Text>
                </View>
                <View style={s.calcRow}>
                  <Text style={[s.calcLabel, { color: colors.mutedForeground }]}>Alynýan nagt:</Text>
                  <Text style={[s.calcValueBig, { color: "#0284c7" }]}>{tmt} TMT</Text>
                </View>
              </View>
            )}

            <View style={{ gap: 6 }}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>Şäher</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {CITIES.map(c => (
                  <Pressable
                    key={c}
                    onPress={() => setCity(c)}
                    style={[
                      s.cityBtn,
                      { backgroundColor: city === c ? "#0284c7" : colors.card, borderColor: city === c ? "#0284c7" : colors.border },
                    ]}
                  >
                    <Text style={[s.cityBtnText, { color: city === c ? "#fff" : colors.foreground }]}>{c}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={[s.warningBox, { backgroundColor: "#f59e0b" + "10", borderColor: "#f59e0b" + "28" }]}>
              <Ionicons name="warning-outline" size={15} color="#f59e0b" />
              <Text style={[s.warningText, { color: colors.foreground }]}>
                BP sargyt iberilen dessine balansyňyzdan çykarylýar. Agent bilen duşuşanyňyzda nagt alarsyňyz.
              </Text>
            </View>

            <Pressable
              onPress={handleCreate}
              disabled={submitting || bp < MIN_CASHOUT_BP || bp > balance}
              style={[s.btnPrimary, { backgroundColor: "#0284c7", opacity: (bp < MIN_CASHOUT_BP || bp > balance) ? 0.5 : 1 }]}
            >
              {submitting
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="cash-outline" size={18} color="#fff" />
              }
              <Text style={s.btnPrimaryText}>{submitting ? "Iberilýär..." : "Sargyt iber"}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const oc = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  amountWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  bpAmt: { fontSize: 16, fontWeight: "800" },
  arrow: { fontSize: 14 },
  tmtAmt: { fontSize: 16, fontWeight: "800" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "700" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  city: { fontSize: 13, fontWeight: "600" },
  separator: { fontSize: 12 },
  time: { fontSize: 11 },
  agentRow: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  agentText: { fontSize: 12, fontWeight: "600" },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, paddingVertical: 11 },
  actionBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  ownerBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, alignSelf: "flex-start" as any },
  ownerText: { fontSize: 11, fontWeight: "600" },
});

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 18 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.72)", fontSize: 11, marginTop: 2 },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  howCard: { marginHorizontal: 16, marginTop: 16, borderRadius: 16, borderWidth: 1, padding: 16 },
  howTitle: { fontSize: 14, fontWeight: "700" },
  howRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  howText: { flex: 1, fontSize: 13, lineHeight: 19 },
  rateRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 10, marginTop: 12 },
  rateText: { fontSize: 13 },
  agentGate: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginTop: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  agentGateText: { flex: 1, fontSize: 13 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginLeft: 20, marginTop: 20, marginBottom: 8 },
  empty: { marginHorizontal: 16, borderRadius: 18, borderWidth: 1, padding: 28, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyDesc: { fontSize: 13, textAlign: "center" },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11, marginTop: 8 },
  emptyBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  modalWrap: { flex: 1 },
  modalHandle: { width: 38, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 8 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  modalSub: { fontSize: 12, marginTop: 2 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  inputLabel: { fontSize: 13, fontWeight: "600" },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 18, fontWeight: "700" },
  calcBox: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  calcRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  calcLabel: { fontSize: 13 },
  calcValue: { fontSize: 15, fontWeight: "700" },
  calcValueBig: { fontSize: 22, fontWeight: "800" },
  cityBtn: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5 },
  cityBtnText: { fontSize: 13, fontWeight: "600" },
  warningBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 12, borderWidth: 1, padding: 12 },
  warningText: { flex: 1, fontSize: 12, lineHeight: 17 },
  btnPrimary: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 15 },
  btnPrimaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
