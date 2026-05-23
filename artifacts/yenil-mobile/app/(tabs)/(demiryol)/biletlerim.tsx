import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  TextInput, Alert, Platform,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { PessimisticButton } from "@/components/PessimisticButton";

const DEMIRYOL_API = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api/demiryol`
  : "/api/demiryol";

interface TicketInfo {
  passenger_name?: string;
  route?: string;
  departure_date?: string;
  train_number?: string;
  seat?: string;
  wagon?: string;
  ticket_type?: string;
}

const SAVED_TICKETS_MOCK = [
  {
    id: "ABC123",
    passenger: "Myrat Durdyýew",
    route: "Aşgabat → Daşoguz",
    date: "2026-05-25",
    status: "active",
  },
  {
    id: "XYZ789",
    passenger: "Amangül Annagylyjowa",
    route: "Mary → Balkanabat",
    date: "2026-05-28",
    status: "active",
  },
];

export default function BiletlerimScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [bookingCode, setBookingCode] = useState("");
  const [ticketResult, setTicketResult] = useState<TicketInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"saved" | "search">("saved");

  async function searchTicket() {
    const code = bookingCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      Alert.alert("Ýalňyşlyk", "Bron kody 6 belgi bolmaly (meselem: ABC123)");
      return;
    }
    setLoading(true);
    setError("");
    setTicketResult(null);
    try {
      const res = await fetch(`${DEMIRYOL_API}?id=${encodeURIComponent(code)}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || `Status: ${res.status}`);
      }
      const data = await res.json();
      if (!data.data?.booking) throw new Error("Bron kody tapylmady");
      setTicketResult(data.data.booking);
    } catch (e: any) {
      setError(e.message || "Nätanyş ýalňyşlyk");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={[styles.header, { paddingTop: (isWeb ? 0 : insets.top) + 12 }]}
      >
        <View style={styles.headerRow}>
          <Ionicons name="ticket-outline" size={22} color="#fff" />
          <Text style={styles.headerTitle}>Biletlerim</Text>
        </View>
        <Text style={styles.headerSub}>Biletleriňizi dolandyryň</Text>
      </LinearGradient>

      <View style={[styles.tabSelector, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {(["saved", "search"] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab(t); }}
            style={[styles.tabBtn, activeTab === t && { backgroundColor: colors.primary }]}
          >
            <Ionicons
              name={t === "saved" ? "list-outline" : "search-outline"}
              size={16}
              color={activeTab === t ? "#fff" : colors.mutedForeground}
            />
            <Text style={[styles.tabBtnText, { color: activeTab === t ? "#fff" : colors.mutedForeground }]}>
              {t === "saved" ? "Biletlerim" : "Bilet gözle"}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 110 : 120 }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "saved" && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Işjeň biletler</Text>
            {SAVED_TICKETS_MOCK.map((ticket) => (
              <View key={ticket.id} style={[styles.ticketCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.ticketStatusDot, { backgroundColor: colors.success }]} />
                <View style={{ flex: 1 }}>
                  <View style={styles.ticketTop}>
                    <Text style={[styles.ticketPassenger, { color: colors.foreground }]}>{ticket.passenger}</Text>
                    <View style={[styles.ticketIdBadge, { backgroundColor: colors.primary + "20" }]}>
                      <Text style={[styles.ticketId, { color: colors.primary }]}>{ticket.id}</Text>
                    </View>
                  </View>
                  <View style={styles.ticketRoute}>
                    <Ionicons name="train-outline" size={14} color={colors.primary} />
                    <Text style={[styles.ticketRouteText, { color: colors.mutedForeground }]}>{ticket.route}</Text>
                  </View>
                  <View style={styles.ticketDate}>
                    <Ionicons name="calendar-outline" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.ticketDateText, { color: colors.mutedForeground }]}>{ticket.date}</Text>
                  </View>
                </View>
                <View style={styles.ticketActions}>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      Alert.alert("Täzeden satyn almak", `${ticket.id} biletini täzeden almak isleýärsiňizmi?`, [
                        { text: "Ýok" },
                        { text: "Hawa", onPress: () => Alert.alert("Ugradyldy", "Täzeden sargyt ugradyldy!") },
                      ]);
                    }}
                    style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                  >
                    <Ionicons name="refresh-outline" size={16} color="#fff" />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      Alert.alert("Üýtgetmek", "Bilet üýtgetmek hyzmatyna geçiň?", [
                        { text: "Ýok" },
                        { text: "Hawa", onPress: () => Alert.alert("Ugradyldy", "Operator bilen habarlaşylar!") },
                      ]);
                    }}
                    style={[styles.actionBtn, { backgroundColor: "#f59e0b" }]}
                  >
                    <Ionicons name="create-outline" size={16} color="#fff" />
                  </Pressable>
                </View>
              </View>
            ))}

            <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoTitle, { color: colors.foreground }]}>Bilet dolandyryş</Text>
                <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                  Bilet täzeden almak ýa-da üýtgetmek üçin sahypamyzyň operatory bilen habarlaşar. Üýtgeşmeler 30 minut içinde tamamlanar.
                </Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === "search" && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Bron kody bilen gözle</Text>
            <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="search-outline" size={20} color={colors.mutedForeground} />
              <TextInput
                value={bookingCode}
                onChangeText={(t) => setBookingCode(t.toUpperCase())}
                placeholder="Bron kody (ABC123)"
                placeholderTextColor={colors.mutedForeground}
                maxLength={6}
                autoCapitalize="characters"
                style={[styles.searchInput, { color: colors.foreground }]}
              />
              {bookingCode.length > 0 && (
                <Pressable onPress={() => { setBookingCode(""); setTicketResult(null); setError(""); }}>
                  <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
                </Pressable>
              )}
            </View>
            <PessimisticButton
              label="Gözlemek"
              loadingLabel="Gözlenýär..."
              loading={loading}
              disabled={loading}
              onPress={searchTicket}
              color={colors.primary}
              size="lg"
              icon={<Ionicons name="search" size={18} color="#fff" />}
            />

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: "#fee2e2", borderColor: "#ef4444" }]}>
                <Ionicons name="alert-circle-outline" size={18} color="#dc2626" />
                <Text style={{ color: "#dc2626", flex: 1, fontSize: 13 }}>{error}</Text>
              </View>
            ) : null}

            {ticketResult && (
              <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                <View style={styles.resultHeader}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                  <Text style={[styles.resultTitle, { color: colors.foreground }]}>Bilet tapyldy!</Text>
                </View>
                {[
                  ["Ýolagçy", ticketResult.passenger_name],
                  ["Ugur", ticketResult.route],
                  ["Ugraýyş senesi", ticketResult.departure_date],
                  ["Otly №", ticketResult.train_number],
                  ["Wagon", ticketResult.wagon],
                  ["Oturgyç", ticketResult.seat],
                ].filter(([, v]) => v).map(([k, v], i) => (
                  <View key={i} style={[styles.resultRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.resultKey, { color: colors.mutedForeground }]}>{k}</Text>
                    <Text style={[styles.resultVal, { color: colors.foreground }]}>{v}</Text>
                  </View>
                ))}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    Alert.alert("Täzeden sargyt", "Bu bilet üçin täzeden sargyt bermek isleýärsiňizmi?", [
                      { text: "Ýok" },
                      { text: "Hawa", onPress: () => Alert.alert("Ugradyldy", "Operator bilen habarlaşylar!") },
                    ]);
                  }}
                  style={[styles.rebuyBtn, { backgroundColor: colors.primary }]}
                >
                  <Ionicons name="refresh-outline" size={18} color="#fff" />
                  <Text style={styles.rebuyBtnText}>Täzeden almak</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 },
  tabSelector: { flexDirection: "row", margin: 16, borderRadius: 12, borderWidth: 1, padding: 4, gap: 4 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  tabBtnText: { fontSize: 13, fontWeight: "700" },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  ticketCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  ticketStatusDot: { width: 8, height: 8, borderRadius: 4 },
  ticketTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  ticketPassenger: { fontSize: 14, fontWeight: "700", flex: 1 },
  ticketIdBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  ticketId: { fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  ticketRoute: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  ticketRouteText: { fontSize: 12 },
  ticketDate: { flexDirection: "row", alignItems: "center", gap: 6 },
  ticketDateText: { fontSize: 12 },
  ticketActions: { gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  infoBox: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginTop: 8, alignItems: "flex-start" },
  infoTitle: { fontWeight: "700", fontSize: 14, marginBottom: 4 },
  infoText: { fontSize: 12, lineHeight: 18 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 16, fontWeight: "700", letterSpacing: 2 },
  searchBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 16, marginBottom: 16 },
  searchBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  errorBox: { flexDirection: "row", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderLeftWidth: 4, marginBottom: 12, alignItems: "flex-start" },
  resultCard: { borderRadius: 16, borderWidth: 2, overflow: "hidden", marginBottom: 12 },
  resultHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  resultTitle: { fontSize: 16, fontWeight: "700" },
  resultRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  resultKey: { fontSize: 13 },
  resultVal: { fontSize: 13, fontWeight: "600" },
  rebuyBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, margin: 14, borderRadius: 12, paddingVertical: 14 },
  rebuyBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
