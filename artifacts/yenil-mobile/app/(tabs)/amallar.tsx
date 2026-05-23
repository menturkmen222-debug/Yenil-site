import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { query, orderByChild, limitToLast } from "firebase/database";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";
import { db, ref, get } from "@/lib/firebase";

// ─── Tipler ───────────────────────────────────────────────────────────────────

interface TxRecord {
  key:         string;
  type:        string;
  serviceId:   string;
  description: string;
  amount:      number;
  created:     number;
  timestamp:   string;
}

// ─── Kömekçi funksiýalar ──────────────────────────────────────────────────────

function formatDate(ts: number): string {
  const d    = new Date(ts);
  const pad  = (n: number) => n.toString().padStart(2, "0");
  return (
    `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

function isThisMonth(ts: number): boolean {
  const now = new Date();
  const d   = new Date(ts);
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface ServiceMeta {
  icon:  IoniconsName;
  color: string;
  label: string;
}

function resolveService(serviceId: string, description: string): ServiceMeta {
  const sid = serviceId.toLowerCase();
  const des = description.toLowerCase();

  if (sid.includes("vip"))                             return { icon: "shield-checkmark-outline", color: "#f59e0b", label: "VIP Status" };
  if (sid.includes("kuryer") || des.includes("kuryer")) return { icon: "bicycle-outline",         color: "#0369a1", label: "Kuryer" };
  if (sid.includes("gatnaw") || des.includes("gatnaw")) return { icon: "car-outline",             color: "#1B6B3A", label: "Gatnaw" };
  if (sid.includes("bazar")  || des.includes("bazar"))  return { icon: "storefront-outline",      color: "#7c3aed", label: "Bazar" };
  if (sid.includes("bilim")  || des.includes("bilim"))  return { icon: "school-outline",          color: "#4338ca", label: "E-Bilim" };
  if (sid.includes("sms")    || des.includes("sms"))    return { icon: "chatbubble-outline",      color: "#ea580c", label: "SMS" };
  if (sid.includes("topup")  || des.includes("topup"))  return { icon: "add-circle-outline",      color: "#16a34a", label: "Goşmak" };
  if (sid.includes("cashout"))                           return { icon: "arrow-up-circle-outline", color: "#dc2626", label: "Çykarmak" };
  return { icon: "receipt-outline", color: "#6b7280", label: "Amal" };
}

// ─── Amal kartasy ─────────────────────────────────────────────────────────────

interface TxCardProps {
  item: TxRecord;
}

function TxCard({ item }: TxCardProps) {
  const colors = useColors();
  const meta   = resolveService(item.serviceId, item.description);
  const isOut  = item.amount > 0;         // çykdaýjy (payment)
  const amtColor = isOut ? "#ef4444" : colors.success;
  const amtSign  = isOut ? "−" : "+";

  return (
    <View
      style={[
        tc.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {/* Ikona */}
      <View style={[tc.iconWrap, { backgroundColor: meta.color + "14" }]}>
        <Ionicons name={meta.icon} size={20} color={meta.color} />
      </View>

      {/* Mazmun */}
      <View style={tc.body}>
        <Text
          style={[tc.title, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {item.description || meta.label}
        </Text>
        <Text style={[tc.sub, { color: colors.mutedForeground }]}>
          {formatDate(item.created)}
        </Text>
      </View>

      {/* Mukdar */}
      <View style={tc.right}>
        <View style={[tc.dirRow, { backgroundColor: amtColor + "12" }]}>
          <Ionicons
            name={isOut ? "arrow-down-outline" : "arrow-up-outline"}
            size={11}
            color={amtColor}
          />
          <Text style={[tc.amount, { color: amtColor }]}>
            {amtSign}
            {item.amount.toFixed(2)} BP
          </Text>
        </View>
        <Text style={[tc.typeTag, { color: colors.mutedForeground }]}>
          {meta.label}
        </Text>
      </View>
    </View>
  );
}

const tc = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 3 },
  title: { fontSize: 14, fontWeight: "700" },
  sub:   { fontSize: 11 },
  right: { alignItems: "flex-end", gap: 5 },
  dirRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  amount:  { fontSize: 14, fontWeight: "800" },
  typeTag: { fontSize: 10, fontWeight: "600" },
});

// ─── Bo'sh ýagdaý ─────────────────────────────────────────────────────────────

function EmptyState() {
  const colors = useColors();
  return (
    <View style={es.wrap}>
      <View style={[es.iconWrap, { backgroundColor: colors.primary + "12" }]}>
        <Ionicons name="receipt-outline" size={44} color={colors.primary} />
      </View>
      <Text style={[es.title, { color: colors.foreground }]}>
        Amal ýok
      </Text>
      <Text style={[es.desc, { color: colors.mutedForeground }]}>
        Siz entek hiç hili amal amala aşyrmadyňyz.{"\n"}
        Hyzmatlary ulanyp başlaň!
      </Text>
    </View>
  );
}

const es = StyleSheet.create({
  wrap:    { alignItems: "center", paddingVertical: 60, paddingHorizontal: 32 },
  iconWrap:{
    width: 88, height: 88, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 10, textAlign: "center" },
  desc:  { fontSize: 14, textAlign: "center", lineHeight: 22 },
});

// ─── Statistika kartasy ───────────────────────────────────────────────────────

interface StatsCardProps {
  total:       number;
  monthCount:  number;
  totalSpent:  number;
}

function StatsCard({ total, monthCount, totalSpent }: StatsCardProps) {
  const colors = useColors();
  const items = [
    { label: "Jemi amal",   value: total.toString(),             icon: "layers-outline"    as IoniconsName },
    { label: "Bu aý",       value: monthCount.toString(),        icon: "calendar-outline"  as IoniconsName },
    { label: "Jemi harçlan",value: `${totalSpent.toFixed(1)} BP`,icon: "wallet-outline"    as IoniconsName },
  ];
  return (
    <View
      style={[
        sc.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          <View style={sc.item}>
            <View style={[sc.iconWrap, { backgroundColor: colors.primary + "12" }]}>
              <Ionicons name={item.icon} size={16} color={colors.primary} />
            </View>
            <Text style={[sc.value, { color: colors.foreground }]}>
              {item.value}
            </Text>
            <Text style={[sc.label, { color: colors.mutedForeground }]}>
              {item.label}
            </Text>
          </View>
          {i < items.length - 1 && (
            <View style={[sc.divider, { backgroundColor: colors.border }]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const sc = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  item: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    gap: 6,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
  },
  value: { fontSize: 16, fontWeight: "900", letterSpacing: -0.4 },
  label: { fontSize: 10, fontWeight: "600", textAlign: "center" },
  divider: { width: StyleSheet.hairlineWidth, marginVertical: 14 },
});

// ─── Esasy ekran ──────────────────────────────────────────────────────────────

export default function AmallarScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const isWeb   = Platform.OS === "web";
  const { deviceId } = useBonusPul();

  const [txList,    setTxList]    = useState<TxRecord[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);

  // ── Firebase'den ýükle ──────────────────────────────────────────────────────
  const loadTransactions = useCallback(async (silent = false) => {
    if (!deviceId) { setLoading(false); return; }
    if (!silent) setLoading(true);

    try {
      const q    = query(
        ref(db, `transactions/${deviceId}`),
        orderByChild("created"),
        limitToLast(20)
      );
      const snap = await get(q);

      if (!snap.exists()) {
        setTxList([]);
        return;
      }

      const raw: TxRecord[] = [];
      snap.forEach((child) => {
        const v = child.val();
        raw.push({
          key:         child.key ?? "",
          type:        v.type        ?? "payment",
          serviceId:   v.serviceId   ?? "",
          description: v.description ?? "",
          amount:      v.amount      ?? 0,
          created:     v.created     ?? v.createdAt ?? Date.now(),
          timestamp:   v.timestamp   ?? "",
        });
      });

      // Täzesi birinji (Firebase ASC berýär, biz DESC edýäris)
      setTxList(raw.reverse());
    } catch {
      setTxList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [deviceId]);

  // Tab açylanda awtomatik täzele
  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  const handleRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    loadTransactions(true);
  }, [loadTransactions]);

  // ── Statistika ──────────────────────────────────────────────────────────────
  const total      = txList.length;
  const monthCount = txList.filter((t) => isThisMonth(t.created)).length;
  const totalSpent = txList.reduce((acc, t) => acc + t.amount, 0);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>

      {/* Gradient sarlavha */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={[s.header, { paddingTop: (isWeb ? 0 : insets.top) + 14 }]}
      >
        <View>
          <Text style={s.headerTitle}>Amallar</Text>
          <Text style={s.headerSub}>Soňky 20 BP amaly</Text>
        </View>
        <Pressable
          onPress={() => loadTransactions(true)}
          style={s.refreshBtn}
        >
          <Ionicons name="refresh-outline" size={20} color="#fff" />
        </Pressable>
      </LinearGradient>

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[s.loadingText, { color: colors.mutedForeground }]}>
            Ýüklenýär...
          </Text>
        </View>
      ) : (
        <FlatList
          data={txList}
          keyExtractor={(item) => item.key}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={[
            s.list,
            { paddingBottom: insets.bottom + 100 },
          ]}
          ListHeaderComponent={
            total > 0 ? (
              <StatsCard
                total={total}
                monthCount={monthCount}
                totalSpent={totalSpent}
              />
            ) : null
          }
          ListEmptyComponent={<EmptyState />}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => <TxCard item={item} />}
        />
      )}
    </View>
  );
}

// ─── Stiller ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  headerSub: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    marginTop: 3,
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },

  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14 },

  list: {
    padding: 16,
    gap: 10,
  },
});
