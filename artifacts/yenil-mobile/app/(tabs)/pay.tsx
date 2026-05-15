import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  Alert, ActivityIndicator, Platform,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

const BACKENDLESS_URL = `https://api.backendless.com/C3BB5032-1DCC-4DB3-888F-AEDA785F26CB/9A8CACA4-5889-4D47-903E-BF12F059E175`;
const PAYMENT_PHONES = ["+993 71 789091", "+993 64 629487", "+993 71 788546"];

type CryptoType = "payeer" | "perfect" | "webmoney";
type Mode = "buy" | "sell";

const CRYPTO_OPTIONS: { id: CryptoType; label: string; icon: string }[] = [
  { id: "payeer", label: "Payeer", icon: "P" },
  { id: "perfect", label: "Perfect Money", icon: "PM" },
  { id: "webmoney", label: "WebMoney", icon: "WM" },
];

export default function PayScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const [mode, setMode] = useState<Mode>("buy");
  const [crypto, setCrypto] = useState<CryptoType>("payeer");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [phone, setPhone] = useState("");
  const [smsText, setSmsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function calcTotal() {
    const amt = parseFloat(amount) || 0;
    if (mode === "buy") return (amt * 29).toFixed(0);
    return (amt * 19).toFixed(0);
  }

  async function handleSubmit() {
    if (!amount || !accountId || !phone) {
      Alert.alert("Ýalňyşlyk", "Ähli meýdançalary dolduryň!"); return;
    }
    setLoading(true);
    try {
      const orderData = {
        type: mode === "buy" ? "pay-buy" : "pay-sell",
        crypto, amount: parseFloat(amount), totalTmt: parseFloat(calcTotal()),
        accountId, phone, smsText: smsText || null,
        timestamp: new Date().toISOString(),
      };
      const path = mode === "buy" ? "bonus-orders" : "bonus-sell-orders";
      const res = await fetch(`${BACKENDLESS_URL}/data/${path === "bonus-orders" ? "orders" : "sell-orders"}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
    } catch (e: any) {
      Alert.alert("Ýalňyşlyk", e.message || "Bilinmeýän ýalňyşlyk");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: (isWeb ? 67 : insets.top) + 12, backgroundColor: colors.primary }]}>
          <Text style={styles.headerTitle}>Ýeňil Pay</Text>
        </View>
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={64} color="#059669" />
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Üstünlikli iberildi!</Text>
          <Text style={[styles.successText, { color: colors.mutedForeground }]}>
            Siziň sargydyňyz kabul edildi. Iň tiz wagtda siz bilen baglanarlar.
          </Text>
          <Pressable
            onPress={() => { setSuccess(false); setAmount(""); setAccountId(""); setPhone(""); setSmsText(""); }}
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="arrow-back-outline" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>Täze sargyt</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: (isWeb ? 67 : insets.top) + 12, backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>Ýeňil Pay</Text>
        <Text style={styles.headerSub}>Daşary ýurt walýutasy</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 34 : 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Buy/Sell toggle */}
        <View style={[styles.toggleRow, { backgroundColor: colors.muted }]}>
          {(["buy", "sell"] as Mode[]).map(m => (
            <Pressable key={m} onPress={() => setMode(m)}
              style={[styles.toggleBtn, m === mode && { backgroundColor: colors.primary }]}>
              <Text style={[styles.toggleText, { color: m === mode ? "#fff" : colors.mutedForeground }]}>
                {m === "buy" ? "Satyn almak" : "Satmak"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Rate info */}
        <View style={[styles.rateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.rateItem}>
            <Text style={[styles.rateLabel, { color: colors.mutedForeground }]}>Satyn alma kursy</Text>
            <Text style={[styles.rateVal, { color: colors.primary }]}>1 USD = 29 TMT</Text>
          </View>
          <View style={[styles.rateDivider, { backgroundColor: colors.border }]} />
          <View style={styles.rateItem}>
            <Text style={[styles.rateLabel, { color: colors.mutedForeground }]}>Satmak kursy</Text>
            <Text style={[styles.rateVal, { color: colors.foreground }]}>1 USD = 19 TMT</Text>
          </View>
        </View>

        {/* Crypto type */}
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Walýuta görnüşi</Text>
        <View style={styles.cryptoRow}>
          {CRYPTO_OPTIONS.map(c => (
            <Pressable key={c.id} onPress={() => setCrypto(c.id)}
              style={[styles.cryptoCard, {
                backgroundColor: crypto === c.id ? colors.primary + "15" : colors.card,
                borderColor: crypto === c.id ? colors.primary : colors.border,
              }]}>
              <View style={[styles.cryptoIcon, { backgroundColor: crypto === c.id ? colors.primary : colors.muted }]}>
                <Text style={[styles.cryptoIconText, { color: crypto === c.id ? "#fff" : colors.mutedForeground }]}>{c.icon}</Text>
              </View>
              <Text style={[styles.cryptoLabel, { color: crypto === c.id ? colors.primary : colors.foreground }]}>{c.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Amount */}
        <View style={{ marginTop: 16 }}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Mukdar (USD)</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          />
        </View>

        {/* Total */}
        {parseFloat(amount) > 0 && (
          <View style={[styles.totalCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary }]}>
            <Text style={[styles.totalLabel, { color: colors.primary }]}>
              {mode === "buy" ? "Tölemeli mukdar" : "Alynýan mukdar"}
            </Text>
            <Text style={[styles.totalVal, { color: colors.primary }]}>{calcTotal()} TMT</Text>
          </View>
        )}

        {/* Account ID */}
        <View style={{ marginTop: 14 }}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            {crypto === "payeer" ? "Payeer ID (P xxxxxxx)" : crypto === "perfect" ? "Perfect Money ID" : "WebMoney Purse"}
          </Text>
          <TextInput
            value={accountId}
            onChangeText={setAccountId}
            placeholder={crypto === "payeer" ? "P1234567" : crypto === "perfect" ? "U12345678" : "Z12345678"}
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="characters"
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          />
        </View>

        {/* Phone */}
        <View style={{ marginTop: 14 }}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Siziň nomeriňiz</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+99361xxxxxx"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="phone-pad"
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          />
        </View>

        {/* Payment info for buy */}
        {mode === "buy" && (
          <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoTitle, { color: colors.foreground }]}>Töleg sanlary</Text>
              {PAYMENT_PHONES.map((p, i) => (
                <Text key={i} style={[{ color: colors.foreground, fontWeight: "700", fontSize: 14, marginBottom: 2 }]}>{p}</Text>
              ))}
            </View>
          </View>
        )}

        {/* SMS proof */}
        <View style={{ marginTop: 14 }}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>SMS tassyklaması (islege görä)</Text>
          <TextInput
            value={smsText}
            onChangeText={setSmsText}
            placeholder="SMS haty şu ýere ýazyň..."
            placeholderTextColor={colors.mutedForeground}
            multiline numberOfLines={3}
            style={[styles.input, styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          />
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed || loading ? 0.7 : 1 }]}
        >
          {loading ? <ActivityIndicator color="#fff" size="small" /> : (
            <>
              <Ionicons name="send-outline" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Sargyt ibermek</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 },
  toggleRow: { flexDirection: "row", borderRadius: 14, padding: 4, marginBottom: 16 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center" },
  toggleText: { fontSize: 14, fontWeight: "700" },
  rateCard: { flexDirection: "row", borderRadius: 14, borderWidth: 1, marginBottom: 16, overflow: "hidden" },
  rateItem: { flex: 1, padding: 14 },
  rateLabel: { fontSize: 11, marginBottom: 4 },
  rateVal: { fontSize: 15, fontWeight: "700" },
  rateDivider: { width: 1 },
  fieldLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  cryptoRow: { flexDirection: "row", gap: 10 },
  cryptoCard: { flex: 1, borderRadius: 12, borderWidth: 2, padding: 12, alignItems: "center", gap: 8 },
  cryptoIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cryptoIconText: { fontSize: 11, fontWeight: "800" },
  cryptoLabel: { fontSize: 11, fontWeight: "700", textAlign: "center" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  textarea: { height: 80, textAlignVertical: "top" },
  totalCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginTop: 12 },
  totalLabel: { fontSize: 14, fontWeight: "600" },
  totalVal: { fontSize: 22, fontWeight: "800" },
  infoBox: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginTop: 14, alignItems: "flex-start" },
  infoTitle: { fontWeight: "700", fontSize: 14, marginBottom: 6 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 16, marginTop: 20 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  successContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  successTitle: { fontSize: 24, fontWeight: "800" },
  successText: { fontSize: 14, lineHeight: 22, textAlign: "center" },
});
