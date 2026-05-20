import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, Pressable, FlatList,
  Alert, Platform, ScrollView, RefreshControl,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import {
  getHistory, deleteHistoryItem, clearHistory,
  formatTimestamp, groupByDate,
  type OrderHistoryItem, type OrderType,
} from "@/lib/orderHistory";

// ─── Type config ───────────────────────────────────────────────────
type FilterKey = "all" | OrderType;

const ORDER_TYPES: { key: FilterKey; label: string; icon: string; color: string; iconLib: "ion" | "mc" }[] = [
  { key: "all",          label: "Hemmesi",   icon: "apps-outline",           color: "#6366f1", iconLib: "ion" },
  { key: "bonus-buy",    label: "BP al",     icon: "wallet-outline",         color: "#10b981", iconLib: "ion" },
  { key: "bonus-sell",   label: "BP sat",    icon: "cash-outline",           color: "#f59e0b", iconLib: "ion" },
  { key: "currency-buy", label: "Walýuta al",icon: "swap-horizontal-outline",color: "#3b82f6", iconLib: "ion" },
  { key: "currency-sell",label: "Walýuta sat",icon:"swap-vertical-outline",  color: "#ec4899", iconLib: "ion" },
  { key: "demiryol",     label: "Demirýol",  icon: "train-outline",          color: "#8b5cf6", iconLib: "ion" },
  { key: "sim",          label: "SIM",       icon: "sim-outline",            color: "#ef4444", iconLib: "ion" },
  { key: "walýuta",      label: "Çalyşmak",  icon: "repeat-outline",         color: "#06b6d4", iconLib: "ion" },
];

function getTypeConfig(type: OrderType) {
  return ORDER_TYPES.find((t) => t.key === type) ?? ORDER_TYPES[0];
}

function getAmountColor(type: OrderType, colors: any): string {
  if (type === "bonus-buy" || type === "currency-buy" || type === "demiryol") return colors.success;
  return "#ef4444";
}

// ─── Transaction Row ───────────────────────────────────────────────
function TxRow({
  item,
  onDelete,
}: {
  item: OrderHistoryItem;
  onDelete: (id: string) => void;
}) {
  const colors = useColors();
  const cfg = getTypeConfig(item.type);

  return (
    <Pressable
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert("Amaly öçür", `"${item.title}" amaly öçürmek isleýärsiňizmi?`, [
          { text: "Ýok" },
          {
            text: "Öçür",
            style: "destructive",
            onPress: () => onDelete(item.id),
          },
        ]);
      }}
      style={({ pressed }) => [
        styles.txRow,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {/* Icon */}
      <View style={[styles.txIcon, { backgroundColor: cfg.color + "18" }]}>
        <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={[styles.txTitle, { color: colors.foreground }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.txDetails, { color: colors.mutedForeground }]} numberOfLines={1}>
          {item.details}
        </Text>
        <Text style={[styles.txTime, { color: colors.mutedForeground }]}>
          {formatTimestamp(item.timestamp)}
        </Text>
      </View>

      {/* Amount */}
      <View style={{ alignItems: "flex-end" }}>
        <Text style={[styles.txAmount, { color: getAmountColor(item.type, colors) }]}>
          {item.amountLabel}
        </Text>
        <View style={[styles.txTypeBadge, { backgroundColor: cfg.color + "15" }]}>
          <Text style={[styles.txTypeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Empty state ───────────────────────────────────────────────────
function EmptyState({ colors }: { colors: any }) {
  return (
    <View style={styles.emptyWrap}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
        <Ionicons name="receipt-outline" size={48} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Amal ýok</Text>
      <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
        Siz entek hiç hili amal amala aşyrmadyňyz.{"\n"}Hyzmatlary ulanyp başlaň!
      </Text>
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────
export default function AmallarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const [history, setHistory] = useState<OrderHistoryItem[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    const data = await getHistory();
    setHistory(data);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, [loadHistory]);

  const handleDelete = useCallback(async (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await deleteHistoryItem(id);
    setHistory((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const handleClearAll = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Hemmesini aýyr",
      "Ähli amal taryhyny aýyrmak isleýärsiňizmi? Bu yzyna gaýtarylmaz!",
      [
        { text: "Ýok" },
        {
          text: "Hemmesini aýyr",
          style: "destructive",
          onPress: async () => {
            await clearHistory();
            setHistory([]);
          },
        },
      ]
    );
  }, []);

  // Filtered data
  const filtered = filter === "all" ? history : history.filter((x) => x.type === filter);
  const groups = groupByDate(filtered);

  // Statistics
  const totalCount = history.length;
  const totalSpent = history
    .filter((x) => ["bonus-buy", "currency-buy", "demiryol"].includes(x.type))
    .reduce((sum, x) => sum + Math.abs(x.amount), 0);
  const thisMonthCount = history.filter((x) => {
    const d = new Date(x.timestamp);
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd] as [string, string]}
        style={[styles.header, { paddingTop: (isWeb ? 0 : insets.top) + 14 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Amallarym</Text>
            <Text style={styles.headerSub}>Amallaryňyzy görüň we dolandyryň</Text>
          </View>
          {history.length > 0 && (
            <Pressable
              onPress={handleClearAll}
              style={styles.clearBtn}
            >
              <Ionicons name="trash-outline" size={16} color="rgba(255,255,255,0.9)" />
            </Pressable>
          )}
        </View>

        {/* ── Stats row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{totalCount}</Text>
            <Text style={styles.statLabel}>Jemi amal</Text>
          </View>
          <View style={[styles.statDivider]} />
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{thisMonthCount}</Text>
            <Text style={styles.statLabel}>Bu aý</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{totalSpent.toFixed(0)}</Text>
            <Text style={styles.statLabel}>TMT sarp edildi</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Filter chips ── */}
      <View style={[styles.filterWrap, { borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {ORDER_TYPES.map((t) => {
            const isActive = filter === t.key;
            const count = t.key === "all" ? history.length : history.filter((x) => x.type === t.key).length;
            return (
              <Pressable
                key={t.key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFilter(t.key);
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? t.color : colors.muted,
                    borderColor: isActive ? t.color : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={t.icon as any}
                  size={13}
                  color={isActive ? "#fff" : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isActive ? "#fff" : colors.foreground },
                  ]}
                >
                  {t.label}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.filterBadge,
                      { backgroundColor: isActive ? "rgba(255,255,255,0.3)" : colors.border },
                    ]}
                  >
                    <Text style={[styles.filterBadgeText, { color: isActive ? "#fff" : colors.mutedForeground }]}>
                      {count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Transactions ── */}
      {filtered.length === 0 ? (
        <EmptyState colors={colors} />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.date}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={{ paddingBottom: isWeb ? 110 : 110, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: group }) => (
            <View style={styles.group}>
              {/* Date label */}
              <View style={styles.dateRow}>
                <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
                <View style={[styles.datePill, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
                    {group.date}
                  </Text>
                </View>
                <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
              </View>

              {/* Items */}
              <View style={styles.groupItems}>
                {group.data.map((item, idx) => (
                  <View key={item.id}>
                    <TxRow item={item} onDelete={handleDelete} />
                    {idx < group.data.length - 1 && (
                      <View style={[styles.itemDivider, { backgroundColor: colors.border }]} />
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  headerSub: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 3 },
  clearBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  statCard: { flex: 1, alignItems: "center" },
  statNum: { color: "#fff", fontSize: 22, fontWeight: "800" },
  statLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)" },

  filterWrap: { borderBottomWidth: 1 },
  filterScroll: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 12, fontWeight: "600" },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterBadgeText: { fontSize: 10, fontWeight: "700" },

  group: { marginTop: 8 },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  dateLine: { flex: 1, height: 1 },
  datePill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  dateText: { fontSize: 11, fontWeight: "600" },

  groupItems: {
    marginHorizontal: 14,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "transparent",
  },

  txRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  txTitle: { fontSize: 14, fontWeight: "700", marginBottom: 1 },
  txDetails: { fontSize: 12, marginBottom: 2 },
  txTime: { fontSize: 11 },
  txAmount: { fontSize: 15, fontWeight: "800", marginBottom: 4 },
  txTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  txTypeText: { fontSize: 10, fontWeight: "700" },

  itemDivider: { height: 1, marginLeft: 72 },

  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", marginBottom: 10 },
  emptyDesc: { fontSize: 14, textAlign: "center", lineHeight: 22 },
});
