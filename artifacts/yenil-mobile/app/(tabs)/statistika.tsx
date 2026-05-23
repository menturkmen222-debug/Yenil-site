import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  ActivityIndicator, Modal, Platform, Alert,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { PessimisticButton } from "@/components/PessimisticButton";
import { useBonusPul } from "@/contexts/BonusPulContext";
import {
  getHistory, clearHistory, addToHistory,
  OrderHistoryItem, OrderType,
} from "@/lib/orderHistory";
import { saveOrder } from "@/lib/firebase";

const BACKENDLESS_URL = `https://api.backendless.com/C3BB5032-1DCC-4DB3-888F-AEDA785F26CB/9A8CACA4-5889-4D47-903E-BF12F059E175`;

type FilterType = "all" | OrderType;

const TYPE_META: Record<OrderType, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  "bonus-buy":      { icon: "arrow-down-circle",    color: "#15803d", label: "BP Satyn almak" },
  "bonus-sell":     { icon: "arrow-up-circle",      color: "#059669", label: "BP Satmak" },
  "currency-buy":   { icon: "swap-horizontal",      color: "#6366f1", label: "Walýuta almak" },
  "currency-sell":  { icon: "swap-horizontal",      color: "#f59e0b", label: "Walýuta satmak" },
  "sim":            { icon: "phone-portrait",        color: "#e63946", label: "SIM Kart" },
  "demiryol":       { icon: "train-outline",         color: "#8b5cf6", label: "Demirýol biledi" },
  "walýuta":        { icon: "repeat-outline",        color: "#06b6d4", label: "Walýuta çalyşmak" },
  "howa-bilet":     { icon: "airplane-outline",      color: "#0ea5e9", label: "Howa biledi" },
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Şu gün · " + d.toLocaleTimeString("tk", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Düýn · " + d.toLocaleTimeString("tk", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("tk", { day: "2-digit", month: "short" }) + " · " + d.toLocaleTimeString("tk", { hour: "2-digit", minute: "2-digit" });
}

function groupByDate(items: OrderHistoryItem[]): { label: string; data: OrderHistoryItem[] }[] {
  const map = new Map<string, OrderHistoryItem[]>();
  for (const item of items) {
    const d = new Date(item.timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    const key =
      diffDays === 0 ? "Şu gün" :
      diffDays === 1 ? "Düýn" :
      diffDays < 7  ? "Bu hepde" :
      d.toLocaleDateString("tk", { month: "long", year: "numeric" });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries()).map(([label, data]) => ({ label, data }));
}

export default function StatistikaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { deviceId } = useBonusPul();

  const [history, setHistory] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [repeatItem, setRepeatItem] = useState<OrderHistoryItem | null>(null);
  const [repeatLoading, setRepeatLoading] = useState(false);
  const [repeatDone, setRepeatDone] = useState(false);

  const topPad = (isWeb ? 0 : insets.top) + 12;

  const load = useCallback(async () => {
    setLoading(true);
    const h = await getHistory();
    setHistory(h);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === "all" ? history : history.filter(h => h.type === filter);
  const grouped = groupByDate(filtered);

  const countByType = (t: OrderType) => history.filter(h => h.type === t).length;
  const totalCount = history.length;

  async function handleRepeat() {
    if (!repeatItem) return;
    setRepeatLoading(true);
    try {
      const { type } = repeatItem;
      if (type === "bonus-buy") {
        await saveOrder("bonus-orders", {
          deviceId,
          amount: repeatItem.amount,
          userPhone: repeatItem.phone ?? "",
          status: "pending",
        });
      } else if (type === "bonus-sell") {
        await saveOrder("bonus-sell-orders", {
          deviceId,
          amount: repeatItem.amount,
          userPhone: repeatItem.phone ?? "",
          status: "pending",
        });
      } else if (type === "currency-buy" || type === "currency-sell") {
        const resp = await fetch(`${BACKENDLESS_URL}/data/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: type === "currency-buy" ? "pay-buy" : "pay-sell",
            crypto: repeatItem.crypto ?? "usdt",
            currency: repeatItem.currency ?? "usd",
            amount: repeatItem.amount,
            phone: repeatItem.phone ?? "",
            walletId: repeatItem.walletId ?? "",
            timestamp: new Date().toISOString(),
          }),
        });
        if (!resp.ok) throw new Error(`Status: ${resp.status}`);
      } else if (type === "sim") {
        await saveOrder("sim-topup-orders", {
          deviceId,
          operator: repeatItem.operator ?? "",
          simPhone: repeatItem.simPhone ?? "",
          amount: repeatItem.amount,
          status: "pending",
        });
      }
      const { id: _id, timestamp: _ts, ...repeatRest } = repeatItem;
      await addToHistory(repeatRest);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRepeatDone(true);
      load();
    } catch (e: any) {
      Alert.alert("Ýalňyşlyk", e.message || "Bilinmeýän ýalňyşlyk");
    } finally {
      setRepeatLoading(false);
    }
  }

  function handleClearHistory() {
    Alert.alert(
      "Taryhy arassala",
      "Ähli amallar taryhy pozulyp gider. Dowam etmekçimi?",
      [
        { text: "Ýok", style: "cancel" },
        { text: "Hawa, poz", style: "destructive", onPress: async () => {
          await clearHistory();
          setHistory([]);
        }},
      ]
    );
  }

  const FILTERS: { id: FilterType; label: string }[] = [
    { id: "all", label: "Hemmesi" },
    { id: "bonus-buy", label: "BP Almak" },
    { id: "bonus-sell", label: "BP Satmak" },
    { id: "currency-buy", label: "Walýuta Al" },
    { id: "currency-sell", label: "Walýuta Sat" },
    { id: "sim", label: "SIM Kart" },
  ];

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>

      {/* Header */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={[s.header, { paddingTop: topPad }]}
      >
        <View>
          <Text style={s.headerTitle}>Statistika</Text>
          <Text style={s.headerSub}>Siziň amallar taryhyňyz</Text>
        </View>
        {history.length > 0 && (
          <Pressable onPress={handleClearHistory} style={s.clearBtn}>
            <Feather name="trash-2" size={16} color="rgba(255,255,255,0.8)" />
          </Pressable>
        )}
      </LinearGradient>

      {/* Summary Cards */}
      {history.length > 0 && (
        <View style={[s.summaryRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={s.summaryItem}>
            <Text style={[s.summaryVal, { color: colors.foreground }]}>{totalCount}</Text>
            <Text style={[s.summaryLabel, { color: colors.mutedForeground }]}>Jemi amal</Text>
          </View>
          <View style={[s.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={s.summaryItem}>
            <Text style={[s.summaryVal, { color: colors.primary }]}>{countByType("bonus-buy") + countByType("bonus-sell")}</Text>
            <Text style={[s.summaryLabel, { color: colors.mutedForeground }]}>Bonus Pul</Text>
          </View>
          <View style={[s.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={s.summaryItem}>
            <Text style={[s.summaryVal, { color: "#6366f1" }]}>{countByType("currency-buy") + countByType("currency-sell")}</Text>
            <Text style={[s.summaryLabel, { color: colors.mutedForeground }]}>Walýuta</Text>
          </View>
          <View style={[s.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={s.summaryItem}>
            <Text style={[s.summaryVal, { color: "#e63946" }]}>{countByType("sim")}</Text>
            <Text style={[s.summaryLabel, { color: colors.mutedForeground }]}>SIM</Text>
          </View>
        </View>
      )}

      {/* Filter chips */}
      {history.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ backgroundColor: colors.background, borderBottomColor: colors.border, borderBottomWidth: 1 }}
          contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 10, gap: 8, flexDirection: "row" }}
        >
          {FILTERS.map(f => (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[s.filterChip, {
                backgroundColor: filter === f.id ? colors.primary : colors.card,
                borderColor: filter === f.id ? colors.primary : colors.border,
              }]}
            >
              <Text style={[s.filterChipText, { color: filter === f.id ? "#fff" : colors.foreground }]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Content */}
      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : history.length === 0 ? (
        <View style={s.centered}>
          <Ionicons name="receipt-outline" size={64} color={colors.mutedForeground} />
          <Text style={[s.emptyTitle, { color: colors.foreground }]}>Heniz amal ýok</Text>
          <Text style={[s.emptySub, { color: colors.mutedForeground }]}>
            Siz amala girizilen islendik hereketler bu ýerde görüner we gaýtalanar.
          </Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.centered}>
          <Ionicons name="filter-outline" size={48} color={colors.mutedForeground} />
          <Text style={[s.emptyTitle, { color: colors.foreground }]}>Netije tapylmady</Text>
          <Text style={[s.emptySub, { color: colors.mutedForeground }]}>Bu kategoriýada amal ýok.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 14, paddingBottom: isWeb ? 110 : 110, gap: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {grouped.map(group => (
            <View key={group.label}>
              <Text style={[s.groupLabel, { color: colors.mutedForeground }]}>{group.label}</Text>
              <View style={{ gap: 10 }}>
                {group.data.map(item => {
                  const meta = TYPE_META[item.type];
                  return (
                    <View
                      key={item.id}
                      style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <View style={[s.cardIconWrap, { backgroundColor: meta.color + "18" }]}>
                        <Ionicons name={meta.icon} size={22} color={meta.color} />
                      </View>
                      <View style={s.cardBody}>
                        <Text style={[s.cardTitle, { color: colors.foreground }]}>{meta.label}</Text>
                        <Text style={[s.cardDetails, { color: colors.mutedForeground }]} numberOfLines={1}>
                          {item.details}
                        </Text>
                        <Text style={[s.cardDate, { color: colors.mutedForeground }]}>{formatDate(item.timestamp)}</Text>
                      </View>
                      <View style={s.cardRight}>
                        <Text style={[s.cardAmount, { color: meta.color }]}>{item.amountLabel}</Text>
                        <Pressable
                          onPress={() => { setRepeatItem(item); setRepeatDone(false); }}
                          style={[s.repeatBtn, { backgroundColor: meta.color + "15", borderColor: meta.color + "40" }]}
                        >
                          <Feather name="refresh-cw" size={12} color={meta.color} />
                          <Text style={[s.repeatBtnText, { color: meta.color }]}>Gaýtala</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Repeat Modal */}
      <Modal
        visible={!!repeatItem}
        transparent
        animationType="slide"
        onRequestClose={() => { setRepeatItem(null); setRepeatDone(false); }}
      >
        <Pressable style={s.modalOverlay} onPress={() => { setRepeatItem(null); setRepeatDone(false); }} />
        <View style={[s.modalSheet, { backgroundColor: colors.card }]}>
          {repeatDone ? (
            <View style={{ alignItems: "center", gap: 14, paddingVertical: 12 }}>
              <Ionicons name="checkmark-circle" size={60} color="#059669" />
              <Text style={[{ fontSize: 20, fontWeight: "800", color: colors.foreground }]}>Üstünlikli!</Text>
              <Text style={[{ color: colors.mutedForeground, textAlign: "center", fontSize: 13 }]}>
                Haýyşnama kabul edildi. Iň gysga wagtda işleniler.
              </Text>
              <Pressable
                onPress={() => { setRepeatItem(null); setRepeatDone(false); }}
                style={[s.primaryBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={s.primaryBtnText}>Ýap</Text>
              </Pressable>
            </View>
          ) : repeatItem ? (
            <>
              <View style={s.modalHandle} />
              <Text style={[s.modalTitle, { color: colors.foreground }]}>Amaly gaýtalaň</Text>
              <Text style={[s.modalSub, { color: colors.mutedForeground }]}>
                Aşakdaky amaly ýene bir gezek ibermekçimisiniz?
              </Text>

              <View style={[s.repeatPreview, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={[s.cardIconWrap, { backgroundColor: TYPE_META[repeatItem.type].color + "18" }]}>
                    <Ionicons name={TYPE_META[repeatItem.type].icon} size={22} color={TYPE_META[repeatItem.type].color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[{ fontWeight: "700", color: colors.foreground }]}>{TYPE_META[repeatItem.type].label}</Text>
                    <Text style={[{ color: colors.mutedForeground, fontSize: 13 }]} numberOfLines={2}>{repeatItem.details}</Text>
                  </View>
                  <Text style={[{ fontWeight: "800", fontSize: 16, color: TYPE_META[repeatItem.type].color }]}>
                    {repeatItem.amountLabel}
                  </Text>
                </View>
              </View>

              <View style={{ gap: 10, marginTop: 16 }}>
                  <PessimisticButton
                    label="Hawa, gaýtala"
                    loadingLabel="Ugradylýar..."
                    loading={repeatLoading}
                    disabled={repeatLoading}
                    onPress={handleRepeat}
                    color={colors.primary}
                    size="lg"
                    icon={<Feather name="refresh-cw" size={16} color="#fff" />}
                  />
                  <Pressable
                    onPress={() => { setRepeatItem(null); setRepeatDone(false); }}
                    style={({ pressed }) => [s.secondaryBtn, { backgroundColor: colors.muted, opacity: pressed ? 0.85 : 1 }]}
                  >
                    <Text style={[s.secondaryBtnText, { color: colors.foreground }]}>Ýatyr</Text>
                  </Pressable>
                </View>
            </>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 2 },
  clearBtn: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
  },
  summaryRow: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  summaryItem: { flex: 1, alignItems: "center", gap: 2 },
  summaryVal: { fontSize: 20, fontWeight: "800" },
  summaryLabel: { fontSize: 11, fontWeight: "600" },
  summaryDivider: { width: 1, marginVertical: 4 },
  filterChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  filterChipText: { fontWeight: "600", fontSize: 12 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  emptySub: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  groupLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, gap: 2 },
  cardTitle: { fontWeight: "700", fontSize: 14 },
  cardDetails: { fontSize: 12, lineHeight: 16 },
  cardDate: { fontSize: 11, marginTop: 2 },
  cardRight: { alignItems: "flex-end", gap: 6 },
  cardAmount: { fontWeight: "800", fontSize: 14 },
  repeatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  repeatBtnText: { fontSize: 11, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    gap: 6,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#94a3b8",
    borderRadius: 4,
    alignSelf: "center",
    marginBottom: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  modalSub: { fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 4 },
  repeatPreview: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 8,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 15,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondaryBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryBtnText: { fontWeight: "600", fontSize: 15 },
});
