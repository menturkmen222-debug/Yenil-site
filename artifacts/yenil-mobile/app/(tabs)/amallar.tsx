import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, Pressable, FlatList, Modal,
  Alert, Platform, ScrollView, RefreshControl, TextInput,
  Animated, Share, ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import {
  getHistory, deleteHistoryItem, clearHistory, addToHistory,
  formatTimestamp, groupByDate,
  type OrderHistoryItem, type OrderType,
} from "@/lib/orderHistory";

// ════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════

type FilterKey = "all" | OrderType;
type SortKey = "newest" | "oldest" | "highest" | "lowest";
type DateRangeKey = "all" | "today" | "week" | "month";
type ViewMode = "list" | "analytics";

const ORDER_TYPES: {
  key: FilterKey; label: string; icon: string; color: string; iconLib: "ion" | "mc";
}[] = [
  { key: "all",          label: "Hemmesi",    icon: "apps-outline",            color: "#6366f1", iconLib: "ion" },
  { key: "bonus-buy",    label: "BP al",      icon: "wallet-outline",          color: "#10b981", iconLib: "ion" },
  { key: "bonus-sell",   label: "BP sat",     icon: "cash-outline",            color: "#f59e0b", iconLib: "ion" },
  { key: "currency-buy", label: "Walýuta al", icon: "swap-horizontal-outline", color: "#3b82f6", iconLib: "ion" },
  { key: "currency-sell",label: "Walýuta sat",icon: "swap-vertical-outline",   color: "#ec4899", iconLib: "ion" },
  { key: "demiryol",     label: "Demirýol",   icon: "train-outline",           color: "#8b5cf6", iconLib: "ion" },
  { key: "sim",          label: "SIM",        icon: "sim-outline",             color: "#ef4444", iconLib: "ion" },
  { key: "walýuta",      label: "Çalyşmak",  icon: "repeat-outline",          color: "#06b6d4", iconLib: "ion" },
  { key: "howa-bilet",   label: "Howa",       icon: "airplane-outline",        color: "#f97316", iconLib: "ion" },
];

const SORT_OPTIONS: { key: SortKey; label: string; icon: string }[] = [
  { key: "newest",  label: "Täzesi ilki",    icon: "time-outline" },
  { key: "oldest",  label: "Könesi ilki",    icon: "hourglass-outline" },
  { key: "highest", label: "Uly mukdar",     icon: "trending-up-outline" },
  { key: "lowest",  label: "Kiçi mukdar",    icon: "trending-down-outline" },
];

const DATE_RANGES: { key: DateRangeKey; label: string }[] = [
  { key: "all",   label: "Hemme wagt" },
  { key: "today", label: "Şu gün" },
  { key: "week",  label: "Bu hepde" },
  { key: "month", label: "Bu aý" },
];

function getTypeConfig(type: OrderType) {
  return ORDER_TYPES.find((t) => t.key === type) ?? ORDER_TYPES[0];
}

function isIncome(type: OrderType) {
  return ["bonus-buy", "currency-buy", "demiryol", "howa-bilet"].includes(type);
}

// ════════════════════════════════════════════════════════════════════
// Test data seeder
// ════════════════════════════════════════════════════════════════════

const TEST_ITEMS: Omit<OrderHistoryItem, "id" | "timestamp">[] = [
  { type: "bonus-buy",     title: "BP satyn alyndy",         details: "Payeer arkaly 50 BP",        amount: 50,   amountLabel: "+50.00 BP",      walletId: "P1234567890" },
  { type: "demiryol",      title: "Demirýol bileti",         details: "Aşgabat → Mary · 2 sany",    amount: 140,  amountLabel: "−140 TMT",       phone: "+99361234567" },
  { type: "currency-buy",  title: "Walýuta satyn alyndy",    details: "100 USD → TMT",              amount: 2900, amountLabel: "+2,900 TMT",     currency: "USD" },
  { type: "bonus-sell",    title: "BP satyldy",              details: "Perfect Money çykarylyşy",   amount: 25,   amountLabel: "−25.00 BP",      walletId: "U12345678" },
  { type: "sim",           title: "SIM kart sargytlandy",    details: "TMCELL · +99361000000",      amount: 15,   amountLabel: "−15 TMT",        simPhone: "+99361000000" },
  { type: "walýuta",       title: "Walýuta çalşyldy",        details: "50 USD → 1,450 TMT",         amount: 50,   amountLabel: "50 USD",         currency: "USD" },
  { type: "currency-sell", title: "Walýuta satyldy",         details: "200 USD satylan",            amount: 3800, amountLabel: "+3,800 TMT",     currency: "USD" },
  { type: "howa-bilet",    title: "Howa bileti sargytlandy", details: "Aşgabat → Moskwa",           amount: 850,  amountLabel: "−850 TMT",       phone: "+99361234567" },
  { type: "bonus-buy",     title: "BP satyn alyndy",         details: "WebMoney arkaly 100 BP",     amount: 100,  amountLabel: "+100.00 BP",     walletId: "Z123456789" },
  { type: "demiryol",      title: "Demirýol bileti",         details: "Mary → Türkmenabat · 1 sany",amount: 70,   amountLabel: "−70 TMT",        phone: "+99362345678" },
];

async function seedTestData() {
  for (let i = 0; i < TEST_ITEMS.length; i++) {
    await addToHistory(TEST_ITEMS[i]);
  }
}

// ════════════════════════════════════════════════════════════════════
// Mini Bar component for analytics
// ════════════════════════════════════════════════════════════════════

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(4, (value / max) * 100) : 4;
  return (
    <View style={{ height: 8, flex: 1, backgroundColor: color + "22", borderRadius: 4, overflow: "hidden" }}>
      <View style={{ width: `${pct}%`, height: "100%", backgroundColor: color, borderRadius: 4 }} />
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════
// Transaction Row
// ════════════════════════════════════════════════════════════════════

function TxRow({
  item, onDelete, onPress,
}: {
  item: OrderHistoryItem;
  onDelete: (id: string) => void;
  onPress: (item: OrderHistoryItem) => void;
}) {
  const colors = useColors();
  const cfg = getTypeConfig(item.type);
  const income = isIncome(item.type);

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress(item);
      }}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(
          "Amaly öçür",
          `"${item.title}" amaly öçürmek isleýärsiňizmi?`,
          [
            { text: "Ýok" },
            { text: "Öçür", style: "destructive", onPress: () => onDelete(item.id) },
          ]
        );
      }}
      style={({ pressed }) => [
        s.txRow,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.78 : 1 },
      ]}
    >
      <View style={[s.txIcon, { backgroundColor: cfg.color + "18" }]}>
        <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.txTitle, { color: colors.foreground }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[s.txDetails, { color: colors.mutedForeground }]} numberOfLines={1}>
          {item.details}
        </Text>
        <Text style={[s.txTime, { color: colors.mutedForeground }]}>
          {formatTimestamp(item.timestamp)}
        </Text>
      </View>

      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons
            name={income ? "arrow-down-circle-outline" : "arrow-up-circle-outline"}
            size={14}
            color={income ? "#10b981" : "#ef4444"}
          />
          <Text style={[s.txAmount, { color: income ? "#10b981" : "#ef4444" }]}>
            {item.amountLabel}
          </Text>
        </View>
        <View style={[s.txBadge, { backgroundColor: cfg.color + "15" }]}>
          <Ionicons name={cfg.icon as any} size={9} color={cfg.color} />
          <Text style={[s.txBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ════════════════════════════════════════════════════════════════════
// Detail Modal
// ════════════════════════════════════════════════════════════════════

function DetailModal({
  item, visible, onClose, onDelete, colors,
}: {
  item: OrderHistoryItem | null;
  visible: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  if (!item) return null;
  const cfg = getTypeConfig(item.type);
  const income = isIncome(item.type);

  const fields: { label: string; value: string }[] = [
    { label: "Görnüş", value: cfg.label },
    { label: "Jikme-jik", value: item.details },
    { label: "Wagt", value: new Date(item.timestamp).toLocaleString("ru-RU") },
    ...(item.phone       ? [{ label: "Telefon",  value: item.phone }]       : []),
    ...(item.walletId    ? [{ label: "Wallet ID", value: item.walletId }]   : []),
    ...(item.currency    ? [{ label: "Walýuta",  value: item.currency }]    : []),
    ...(item.simPhone    ? [{ label: "SIM belgisi", value: item.simPhone }] : []),
    ...(item.operator    ? [{ label: "Operator", value: item.operator }]    : []),
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[dm.wrap, { backgroundColor: colors.background }]}>
        <View style={[dm.handle, { backgroundColor: colors.border }]} />

        <LinearGradient
          colors={[cfg.color + "dd", cfg.color] as [string, string]}
          style={dm.hero}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <View style={dm.heroIcon}>
            <Ionicons name={cfg.icon as any} size={32} color="#fff" />
          </View>
          <Text style={dm.heroTitle}>{item.title}</Text>
          <Text style={[dm.heroAmount, { color: income ? "#a7f3d0" : "#fecaca" }]}>
            {item.amountLabel}
          </Text>
        </LinearGradient>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
          {fields.map((f, i) => (
            <View key={i} style={[dm.field, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[dm.fieldLabel, { color: colors.mutedForeground }]}>{f.label}</Text>
              <Text style={[dm.fieldValue, { color: colors.foreground }]}>{f.value}</Text>
            </View>
          ))}

          <View style={[dm.idField, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={[dm.fieldLabel, { color: colors.mutedForeground }]}>Amal ID</Text>
            <Text style={[dm.idText, { color: colors.mutedForeground }]}>{item.id}</Text>
          </View>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert("Amaly öçür", "Bu amaly öçürmek isleýärsiňizmi?", [
                { text: "Ýok" },
                {
                  text: "Öçür", style: "destructive",
                  onPress: () => { onDelete(item.id); onClose(); },
                },
              ]);
            }}
            style={({ pressed }) => [dm.deleteBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={dm.deleteBtnText}>Bu amaly öçür</Text>
          </Pressable>
        </ScrollView>

        <Pressable
          onPress={onClose}
          style={[dm.closeBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
        >
          <Ionicons name="close" size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════
// Settings Modal
// ════════════════════════════════════════════════════════════════════

function SettingsModal({
  visible, onClose,
  sort, setSort,
  dateRange, setDateRange,
  viewMode, setViewMode,
  onClearAll, onExport, onSeedTest,
  totalCount, colors,
}: {
  visible: boolean; onClose: () => void;
  sort: SortKey; setSort: (s: SortKey) => void;
  dateRange: DateRangeKey; setDateRange: (d: DateRangeKey) => void;
  viewMode: ViewMode; setViewMode: (v: ViewMode) => void;
  onClearAll: () => void; onExport: () => void; onSeedTest: () => void;
  totalCount: number; colors: ReturnType<typeof useColors>;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[st.wrap, { backgroundColor: colors.background }]}>
        <View style={[st.handle, { backgroundColor: colors.border }]} />

        <View style={[st.header, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[st.title, { color: colors.foreground }]}>Sazlamalar</Text>
            <Text style={[st.sub, { color: colors.mutedForeground }]}>Görüşi we tertipleri sazlaň</Text>
          </View>
          <Pressable onPress={onClose} style={[st.closeBtn, { backgroundColor: colors.muted }]}>
            <Ionicons name="close" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 18, gap: 0, paddingBottom: 48 }}>

          {/* View mode */}
          <Text style={[st.groupTitle, { color: colors.mutedForeground }]}>GÖRÜŞ GÖRNÜŞI</Text>
          <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { key: "list" as ViewMode,      label: "Sanaw görnüşi",    icon: "list-outline" },
              { key: "analytics" as ViewMode, label: "Analitika görnüşi", icon: "bar-chart-outline" },
            ].map((opt, idx, arr) => (
              <React.Fragment key={opt.key}>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setViewMode(opt.key); }}
                  style={st.row}
                >
                  <View style={[st.rowIcon, { backgroundColor: colors.primary + "18" }]}>
                    <Ionicons name={opt.icon as any} size={18} color={colors.primary} />
                  </View>
                  <Text style={[st.rowLabel, { color: colors.foreground }]}>{opt.label}</Text>
                  {viewMode === opt.key && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                </Pressable>
                {idx < arr.length - 1 && <View style={[st.divider, { backgroundColor: colors.border }]} />}
              </React.Fragment>
            ))}
          </View>

          {/* Sort */}
          <Text style={[st.groupTitle, { color: colors.mutedForeground }]}>TERTIP ETMEK</Text>
          <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {SORT_OPTIONS.map((opt, idx, arr) => (
              <React.Fragment key={opt.key}>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSort(opt.key); }}
                  style={st.row}
                >
                  <View style={[st.rowIcon, { backgroundColor: colors.primary + "18" }]}>
                    <Ionicons name={opt.icon as any} size={18} color={colors.primary} />
                  </View>
                  <Text style={[st.rowLabel, { color: colors.foreground }]}>{opt.label}</Text>
                  {sort === opt.key && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                </Pressable>
                {idx < arr.length - 1 && <View style={[st.divider, { backgroundColor: colors.border }]} />}
              </React.Fragment>
            ))}
          </View>

          {/* Date range */}
          <Text style={[st.groupTitle, { color: colors.mutedForeground }]}>WAGT ARALYGY</Text>
          <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {DATE_RANGES.map((opt, idx, arr) => (
              <React.Fragment key={opt.key}>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDateRange(opt.key); }}
                  style={st.row}
                >
                  <View style={[st.rowIcon, { backgroundColor: "#6366f1" + "18" }]}>
                    <Ionicons name="calendar-outline" size={18} color="#6366f1" />
                  </View>
                  <Text style={[st.rowLabel, { color: colors.foreground }]}>{opt.label}</Text>
                  {dateRange === opt.key && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                </Pressable>
                {idx < arr.length - 1 && <View style={[st.divider, { backgroundColor: colors.border }]} />}
              </React.Fragment>
            ))}
          </View>

          {/* Actions */}
          <Text style={[st.groupTitle, { color: colors.mutedForeground }]}>HEREKETLER</Text>
          <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable onPress={() => { onExport(); }} style={st.row}>
              <View style={[st.rowIcon, { backgroundColor: "#10b981" + "18" }]}>
                <Ionicons name="share-outline" size={18} color="#10b981" />
              </View>
              <Text style={[st.rowLabel, { color: colors.foreground }]}>Amallary paýlaş</Text>
              <Ionicons name="chevron-forward-outline" size={16} color={colors.mutedForeground} />
            </Pressable>
            <View style={[st.divider, { backgroundColor: colors.border }]} />
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSeedTest();
                onClose();
              }}
              style={st.row}
            >
              <View style={[st.rowIcon, { backgroundColor: "#8b5cf6" + "18" }]}>
                <Ionicons name="flask-outline" size={18} color="#8b5cf6" />
              </View>
              <Text style={[st.rowLabel, { color: colors.foreground }]}>Synag maglumaty goş</Text>
              <Ionicons name="chevron-forward-outline" size={16} color={colors.mutedForeground} />
            </Pressable>
            <View style={[st.divider, { backgroundColor: colors.border }]} />
            <Pressable
              onPress={() => {
                onClose();
                setTimeout(onClearAll, 300);
              }}
              style={st.row}
            >
              <View style={[st.rowIcon, { backgroundColor: "#ef444418" }]}>
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </View>
              <Text style={[st.rowLabel, { color: "#ef4444" }]}>Hemmesini aýyr ({totalCount})</Text>
              <Ionicons name="chevron-forward-outline" size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════
// Analytics View
// ════════════════════════════════════════════════════════════════════

function AnalyticsView({ history, colors }: { history: OrderHistoryItem[]; colors: ReturnType<typeof useColors> }) {
  const now = new Date();

  const thisMonth = history.filter((x) => {
    const d = new Date(x.timestamp);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const lastMonth = history.filter((x) => {
    const d = new Date(x.timestamp);
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
  });

  const totalIn  = history.filter((x) => isIncome(x.type)).reduce((s, x) => s + Math.abs(x.amount), 0);
  const totalOut = history.filter((x) => !isIncome(x.type)).reduce((s, x) => s + Math.abs(x.amount), 0);

  const byType = ORDER_TYPES.filter((t) => t.key !== "all").map((t) => ({
    ...t,
    count: history.filter((x) => x.type === t.key).length,
    total: history.filter((x) => x.type === t.key).reduce((s, x) => s + Math.abs(x.amount), 0),
  })).filter((t) => t.count > 0).sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...byType.map((t) => t.count), 1);

  const last7: { label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = `${d.getDate()}.${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    const count = history.filter((x) => {
      const dx = new Date(x.timestamp);
      return dx.toDateString() === d.toDateString();
    }).length;
    last7.push({ label, count });
  }
  const maxDay = Math.max(...last7.map((d) => d.count), 1);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 120 }}
    >
      {/* Summary cards */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={[an.card, { backgroundColor: "#10b98114", borderColor: "#10b98130", flex: 1 }]}>
          <Ionicons name="arrow-down-circle" size={22} color="#10b981" />
          <Text style={[an.cardNum, { color: "#10b981" }]}>{totalIn.toFixed(0)}</Text>
          <Text style={[an.cardLabel, { color: colors.mutedForeground }]}>Giriş</Text>
        </View>
        <View style={[an.card, { backgroundColor: "#ef444414", borderColor: "#ef444430", flex: 1 }]}>
          <Ionicons name="arrow-up-circle" size={22} color="#ef4444" />
          <Text style={[an.cardNum, { color: "#ef4444" }]}>{totalOut.toFixed(0)}</Text>
          <Text style={[an.cardLabel, { color: colors.mutedForeground }]}>Çykyş</Text>
        </View>
        <View style={[an.card, { backgroundColor: colors.primary + "14", borderColor: colors.primary + "30", flex: 1 }]}>
          <Ionicons name="calendar-outline" size={22} color={colors.primary} />
          <Text style={[an.cardNum, { color: colors.primary }]}>{thisMonth.length}</Text>
          <Text style={[an.cardLabel, { color: colors.mutedForeground }]}>Bu aý</Text>
        </View>
      </View>

      {/* Month comparison */}
      <View style={[an.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[an.sectionTitle, { color: colors.foreground }]}>Aý deňeşdirmesi</Text>
        {[
          { label: "Bu aý", count: thisMonth.length, color: colors.primary },
          { label: "Geçen aý", count: lastMonth.length, color: colors.mutedForeground },
        ].map((item) => (
          <View key={item.label} style={{ gap: 4, marginTop: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={[an.barLabel, { color: colors.foreground }]}>{item.label}</Text>
              <Text style={[an.barLabel, { color: item.color, fontWeight: "700" }]}>{item.count} amal</Text>
            </View>
            <MiniBar value={item.count} max={Math.max(thisMonth.length, lastMonth.length, 1)} color={item.color} />
          </View>
        ))}
      </View>

      {/* Last 7 days bar chart */}
      <View style={[an.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[an.sectionTitle, { color: colors.foreground }]}>Soňky 7 gün</Text>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, marginTop: 12, height: 80 }}>
          {last7.map((d) => {
            const h = maxDay > 0 ? Math.max(8, (d.count / maxDay) * 68) : 8;
            return (
              <View key={d.label} style={{ flex: 1, alignItems: "center", gap: 4 }}>
                <View style={{ width: "100%", height: h, backgroundColor: colors.primary, borderRadius: 4 }} />
                <Text style={[an.dayLabel, { color: colors.mutedForeground }]}>{d.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* By type breakdown */}
      <View style={[an.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[an.sectionTitle, { color: colors.foreground }]}>Görnüş boýunça</Text>
        {byType.length === 0 ? (
          <Text style={[an.barLabel, { color: colors.mutedForeground, marginTop: 10 }]}>Heniz amal ýok</Text>
        ) : (
          byType.map((t) => (
            <View key={t.key} style={{ marginTop: 12, gap: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                  <View style={[an.dot, { backgroundColor: t.color }]} />
                  <Text style={[an.barLabel, { color: colors.foreground }]}>{t.label}</Text>
                </View>
                <Text style={[an.barLabel, { color: t.color, fontWeight: "700" }]}>
                  {t.count} amal
                </Text>
              </View>
              <MiniBar value={t.count} max={maxCount} color={t.color} />
            </View>
          ))
        )}
      </View>

      {/* Activity heatmap-style summary */}
      <View style={[an.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[an.sectionTitle, { color: colors.foreground }]}>Jemi maglumat</Text>
        {[
          { icon: "receipt-outline",      label: "Jemi amal sany",   value: `${history.length}`,              color: colors.primary },
          { icon: "trending-up-outline",  label: "Orta günlük",      value: `${(history.length / 30).toFixed(1)}`,  color: "#10b981" },
          { icon: "star-outline",         label: "Iň köp amal",      value: byType[0]?.label ?? "—",          color: "#f59e0b" },
          { icon: "swap-horizontal",      label: "Walýuta amallary", value: `${history.filter(x => x.currency).length}`, color: "#3b82f6" },
        ].map((row) => (
          <View key={row.label} style={[an.summaryRow, { borderBottomColor: colors.border }]}>
            <View style={[an.summaryIcon, { backgroundColor: row.color + "18" }]}>
              <Ionicons name={row.icon as any} size={16} color={row.color} />
            </View>
            <Text style={[an.barLabel, { color: colors.foreground, flex: 1 }]}>{row.label}</Text>
            <Text style={[an.barLabel, { color: row.color, fontWeight: "700" }]}>{row.value}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ════════════════════════════════════════════════════════════════════
// Empty State
// ════════════════════════════════════════════════════════════════════

function EmptyState({ colors, filter }: { colors: any; filter: FilterKey }) {
  return (
    <View style={s.emptyWrap}>
      <View style={[s.emptyIcon, { backgroundColor: colors.muted }]}>
        <Ionicons name="receipt-outline" size={44} color={colors.mutedForeground} />
      </View>
      <Text style={[s.emptyTitle, { color: colors.foreground }]}>
        {filter === "all" ? "Amal ýok" : "Bu görnüşde amal ýok"}
      </Text>
      <Text style={[s.emptyDesc, { color: colors.mutedForeground }]}>
        {filter === "all"
          ? "Siz entek hiç hili amal amala aşyrmadyňyz.\nHyzmatlary ulanyp başlaň!"
          : `"${ORDER_TYPES.find((t) => t.key === filter)?.label}" görnüşinde amal tapylmady.`}
      </Text>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════
// Main Screen
// ════════════════════════════════════════════════════════════════════

export default function AmallarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const [history, setHistory] = useState<OrderHistoryItem[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [filter, setFilter]             = useState<FilterKey>("all");
  const [sort, setSort]                 = useState<SortKey>("newest");
  const [dateRange, setDateRange]       = useState<DateRangeKey>("all");
  const [viewMode, setViewMode]         = useState<ViewMode>("list");
  const [refreshing, setRefreshing]     = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText]     = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OrderHistoryItem | null>(null);
  const searchRef = useRef<TextInput>(null);
  const searchAnim = useRef(new Animated.Value(0)).current;

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    const data = await getHistory();
    setHistory(data);
    setIsLoading(false);
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  useFocusEffect(useCallback(() => {
    loadHistory();
  }, [loadHistory]));

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
      "Ähli amal taryhyny aýyrmak isleýärsiňizmi?",
      [
        { text: "Ýok" },
        {
          text: "Hemmesini aýyr", style: "destructive",
          onPress: async () => { await clearHistory(); setHistory([]); },
        },
      ]
    );
  }, []);

  const handleExport = useCallback(async () => {
    const lines = history.map(
      (x) => `[${new Date(x.timestamp).toLocaleString("ru-RU")}] ${x.title} — ${x.amountLabel} (${x.details})`
    );
    const text = `Ýeňil — Amal taryhy\n${"─".repeat(30)}\n${lines.join("\n")}`;
    try {
      await Share.share({ message: text, title: "Amal taryhy" });
    } catch {}
  }, [history]);

  const handleSeedTest = useCallback(async () => {
    await seedTestData();
    await loadHistory();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Taýyn!", "10 sany synag amaly goşuldy.");
  }, [loadHistory]);

  const toggleSearch = () => {
    const show = !searchVisible;
    setSearchVisible(show);
    Animated.timing(searchAnim, {
      toValue: show ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start(() => {
      if (show) searchRef.current?.focus();
      else setSearchText("");
    });
  };

  // ── apply date range ──
  function applyDateRange(items: OrderHistoryItem[]): OrderHistoryItem[] {
    const now = Date.now();
    switch (dateRange) {
      case "today": return items.filter((x) => now - x.timestamp < 86_400_000);
      case "week":  return items.filter((x) => now - x.timestamp < 604_800_000);
      case "month": return items.filter((x) => {
        const d = new Date(x.timestamp);
        const n = new Date();
        return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
      });
      default: return items;
    }
  }

  // ── apply sort ──
  function applySort(items: OrderHistoryItem[]): OrderHistoryItem[] {
    switch (sort) {
      case "oldest":  return [...items].sort((a, b) => a.timestamp - b.timestamp);
      case "highest": return [...items].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
      case "lowest":  return [...items].sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));
      default:        return [...items].sort((a, b) => b.timestamp - a.timestamp);
    }
  }

  const base = applyDateRange(history);
  const filtered = (filter === "all" ? base : base.filter((x) => x.type === filter))
    .filter((x) =>
      !searchText.trim() ||
      x.title.toLowerCase().includes(searchText.toLowerCase()) ||
      x.details.toLowerCase().includes(searchText.toLowerCase()) ||
      x.amountLabel.toLowerCase().includes(searchText.toLowerCase())
    );
  const sorted  = applySort(filtered);
  const groups  = groupByDate(sorted);

  // ── stats ──
  const totalCount     = history.length;
  const thisMonthCount = history.filter((x) => {
    const d = new Date(x.timestamp); const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;
  const totalSpent = history
    .filter((x) => !isIncome(x.type))
    .reduce((s, x) => s + Math.abs(x.amount), 0);

  const activeFilters = [filter !== "all", sort !== "newest", dateRange !== "all"].filter(Boolean).length;
  const searchH = searchAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 52] });

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Modals */}
      <SettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        sort={sort} setSort={setSort}
        dateRange={dateRange} setDateRange={setDateRange}
        viewMode={viewMode} setViewMode={setViewMode}
        onClearAll={handleClearAll}
        onExport={handleExport}
        onSeedTest={handleSeedTest}
        totalCount={totalCount}
        colors={colors}
      />
      <DetailModal
        item={selectedItem}
        visible={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onDelete={handleDelete}
        colors={colors}
      />

      {/* ── Header ── */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd] as [string, string]}
        style={[s.header, { paddingTop: (isWeb ? 0 : insets.top) + 14 }]}
      >
        {/* Title row */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.headerTitle}>Amallarym</Text>
            <Text style={s.headerSub}>
              {viewMode === "analytics" ? "Analitika & Statistika" : "Amallaryňyzy görüň we dolandyryň"}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={toggleSearch}
              style={[s.headerBtn, searchVisible && { backgroundColor: "rgba(255,255,255,0.3)" }]}
            >
              <Ionicons name={searchVisible ? "close" : "search-outline"} size={18} color="#fff" />
            </Pressable>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSettingsOpen(true); }}
              style={s.headerBtn}
            >
              {activeFilters > 0 && (
                <View style={s.settingsBadge}>
                  <Text style={s.settingsBadgeText}>{activeFilters}</Text>
                </View>
              )}
              <Ionicons name="options-outline" size={18} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statCell}>
            <Text style={s.statNum}>{totalCount}</Text>
            <Text style={s.statLabel}>Jemi amal</Text>
          </View>
          <View style={s.statDiv} />
          <View style={s.statCell}>
            <Text style={s.statNum}>{thisMonthCount}</Text>
            <Text style={s.statLabel}>Bu aý</Text>
          </View>
          <View style={s.statDiv} />
          <View style={s.statCell}>
            <Text style={s.statNum}>{totalSpent.toFixed(0)}</Text>
            <Text style={s.statLabel}>TMT çykarylan</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Search bar (animated) ── */}
      <Animated.View style={[s.searchWrap, { height: searchH, overflow: "hidden", borderBottomColor: colors.border }]}>
        <View style={[s.searchInner, { backgroundColor: colors.background }]}>
          <Ionicons name="search-outline" size={16} color={colors.mutedForeground} style={{ marginLeft: 12 }} />
          <TextInput
            ref={searchRef}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Amal gözle..."
            placeholderTextColor={colors.mutedForeground}
            style={[s.searchInput, { color: colors.foreground }]}
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText("")} style={{ paddingRight: 12 }}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </Animated.View>

      {/* ── Filter chips ── */}
      {viewMode === "list" && (
        <View style={[s.filterWrap, { borderBottomColor: colors.border }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.filterScroll}
          >
            {ORDER_TYPES.map((t) => {
              const isActive = filter === t.key;
              const count = t.key === "all"
                ? applyDateRange(history).length
                : applyDateRange(history).filter((x) => x.type === t.key).length;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFilter(t.key); }}
                  style={[
                    s.chip,
                    { backgroundColor: isActive ? t.color : colors.muted, borderColor: isActive ? t.color : colors.border },
                  ]}
                >
                  <Ionicons name={t.icon as any} size={12} color={isActive ? "#fff" : t.color} />
                  <Text style={[s.chipText, { color: isActive ? "#fff" : colors.foreground }]}>
                    {t.label}
                  </Text>
                  {count > 0 && (
                    <View style={[s.chipBadge, { backgroundColor: isActive ? "rgba(255,255,255,0.28)" : colors.border }]}>
                      <Text style={[s.chipBadgeText, { color: isActive ? "#fff" : colors.mutedForeground }]}>
                        {count}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ── Content ── */}
      {isLoading && history.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>Ýüklenýär...</Text>
        </View>
      ) : viewMode === "analytics" ? (
        <AnalyticsView history={history} colors={colors} />
      ) : sorted.length === 0 ? (
        <EmptyState colors={colors} filter={filter} />
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
          contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: group }) => (
            <View style={s.group}>
              <View style={s.dateRow}>
                <View style={[s.dateLine, { backgroundColor: colors.border }]} />
                <View style={[s.datePill, { backgroundColor: colors.muted }]}>
                  <Text style={[s.dateText, { color: colors.mutedForeground }]}>{group.date}</Text>
                </View>
                <View style={[s.dateLine, { backgroundColor: colors.border }]} />
              </View>
              <View style={[s.groupItems, { borderColor: colors.border }]}>
                {group.data.map((item, idx) => (
                  <View key={item.id}>
                    <TxRow item={item} onDelete={handleDelete} onPress={setSelectedItem} />
                    {idx < group.data.length - 1 && (
                      <View style={[s.divider, { backgroundColor: colors.border }]} />
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

// ════════════════════════════════════════════════════════════════════
// Styles
// ════════════════════════════════════════════════════════════════════

const s = StyleSheet.create({
  container: { flex: 1 },

  header: { paddingHorizontal: 18, paddingBottom: 18 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  headerSub: { color: "rgba(255,255,255,0.72)", fontSize: 12, marginTop: 2 },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  settingsBadge: {
    position: "absolute", top: -2, right: -2, width: 16, height: 16,
    borderRadius: 8, backgroundColor: "#fbbf24",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.7)",
    zIndex: 1,
  },
  settingsBadgeText: { color: "#fff", fontSize: 8, fontWeight: "800" },

  statsRow: {
    flexDirection: "row", backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14, paddingVertical: 13,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.14)",
  },
  statCell: { flex: 1, alignItems: "center" },
  statNum: { color: "#fff", fontSize: 20, fontWeight: "800", letterSpacing: -0.5 },
  statLabel: { color: "rgba(255,255,255,0.68)", fontSize: 10, marginTop: 2 },
  statDiv: { width: 1, backgroundColor: "rgba(255,255,255,0.18)" },

  searchWrap: { borderBottomWidth: 1 },
  searchInner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 14, marginVertical: 6,
    borderRadius: 12, overflow: "hidden",
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 10, paddingHorizontal: 6 },

  filterWrap: { borderBottomWidth: 1 },
  filterScroll: { paddingHorizontal: 14, paddingVertical: 9, gap: 7 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 11, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  chipText: { fontSize: 11, fontWeight: "600" },
  chipBadge: {
    minWidth: 17, height: 17, borderRadius: 9,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 3,
  },
  chipBadgeText: { fontSize: 9, fontWeight: "700" },

  group: { marginTop: 8 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginBottom: 8 },
  dateLine: { flex: 1, height: 1 },
  datePill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  dateText: { fontSize: 11, fontWeight: "600" },
  groupItems: { marginHorizontal: 14, borderRadius: 16, overflow: "hidden", borderWidth: 1 },

  txRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  txIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  txTitle: { fontSize: 13, fontWeight: "700", marginBottom: 1 },
  txDetails: { fontSize: 11, marginBottom: 2 },
  txTime: { fontSize: 10 },
  txAmount: { fontSize: 14, fontWeight: "800", marginBottom: 3 },
  txBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7 },
  txBadgeText: { fontSize: 9, fontWeight: "700" },
  divider: { height: 1, marginLeft: 68 },

  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  emptyTitle: { fontSize: 19, fontWeight: "800", marginBottom: 8 },
  emptyDesc: { fontSize: 13, textAlign: "center", lineHeight: 20 },
});

const dm = StyleSheet.create({
  wrap: { flex: 1, position: "relative" },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 0 },
  hero: { padding: 24, alignItems: "center", gap: 8, marginBottom: 0 },
  heroIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  heroTitle: { color: "#fff", fontSize: 20, fontWeight: "800", textAlign: "center" },
  heroAmount: { fontSize: 28, fontWeight: "900", letterSpacing: -1, textAlign: "center" },
  field: { padding: 14, borderRadius: 14, borderWidth: 1, gap: 3 },
  fieldLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  fieldValue: { fontSize: 14, fontWeight: "600" },
  idField: { padding: 12, borderRadius: 12, borderWidth: 1 },
  idText: { fontSize: 11, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  deleteBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: 14, paddingVertical: 14, marginTop: 8,
    borderWidth: 1.5, borderColor: "#ef444430", backgroundColor: "#ef444410",
  },
  deleteBtnText: { color: "#ef4444", fontWeight: "700", fontSize: 15 },
  closeBtn: {
    position: "absolute", top: 12, right: 16,
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
});

const st = StyleSheet.create({
  wrap: { flex: 1 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 8 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: "800", letterSpacing: -0.4 },
  sub: { fontSize: 12, marginTop: 3 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  groupTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 8, marginTop: 20, paddingHorizontal: 2 },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 0 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: "600" },
  divider: { height: 1, marginLeft: 60 },
});

const an = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14, alignItems: "center", gap: 6 },
  cardNum: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  cardLabel: { fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  section: { borderRadius: 16, borderWidth: 1, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "800", letterSpacing: -0.2 },
  barLabel: { fontSize: 12, fontWeight: "600" },
  dayLabel: { fontSize: 9, fontWeight: "600" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
  summaryIcon: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
});
