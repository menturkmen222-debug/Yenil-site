import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  Alert, ActivityIndicator, Modal, Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";

const PAYMENT_PHONES = ["+993 71 789091", "+993 64 629487", "+993 71 788546"];

export default function TmcellScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { balance, buyBonusPul, sellBonusPul } = useBonusPul();

  const [showBuy, setShowBuy] = useState(false);
  const [showSell, setShowSell] = useState(false);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleBuy() {
    if (!amount || !phone) { Alert.alert("Ýalňyşlyk", "Mukdar we nomeri giriziň!"); return; }
    setLoading(true);
    try {
      await buyBonusPul(parseFloat(amount), phone);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Üstünlikli!", `${amount} BP satyn almak üçin sargydyňyz kabul edildi.`);
      setShowBuy(false); setAmount(""); setPhone("");
    } catch { Alert.alert("Ýalňyşlyk", "Bilinmeýän ýalňyşlyk"); }
    finally { setLoading(false); }
  }

  async function handleSell() {
    if (!amount || !phone) { Alert.alert("Ýalňyşlyk", "Mukdar we nomeri giriziň!"); return; }
    setLoading(true);
    try {
      await sellBonusPul(parseFloat(amount), phone);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Üstünlikli!", `${amount} BP satmak üçin sargydyňyz kabul edildi.`);
      setShowSell(false); setAmount(""); setPhone("");
    } catch { Alert.alert("Ýalňyşlyk", "Bilinmeýän ýalňyşlyk"); }
    finally { setLoading(false); }
  }

  const services = [
    { icon: "sim-outline" as const, title: "Özbegistan SIM goýmak", desc: "Özbegistan nomer bilen TMCell hyzmatlary", color: "#0ea5e9" },
    { icon: "swap-horizontal-outline" as const, title: "TMCell walýuta çalyşmak", desc: "TMCell hyzmatlary üçin walýuta çekmek", color: "#8b5cf6" },
    { icon: "phone-portrait-outline" as const, title: "Balans doldurmak", desc: "TMCell balansyňyzy doldurmak", color: "#f59e0b" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: (isWeb ? 67 : insets.top) + 12, backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>TMCell & Bonus Pul</Text>
        <Text style={styles.headerSub}>Bonus pul alyň we ulanyň</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 34 : 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
          <View>
            <Text style={styles.balanceLabel}>Siziň bonus pulyňyz</Text>
            <Text style={styles.balanceAmount}>{balance.toFixed(2)}</Text>
            <Text style={styles.balanceCurrency}>Bonus Pul (BP)</Text>
          </View>
          <Ionicons name="wallet" size={48} color="rgba(255,255,255,0.3)" />
        </View>

        {/* Buy/Sell Buttons */}
        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => { setShowBuy(true); setAmount(""); setPhone(""); }}
            style={({ pressed }) => [styles.actionBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
            <Text style={[styles.actionLabel, { color: colors.primary }]}>Bonus pul almak</Text>
            <Text style={[styles.actionDesc, { color: colors.mutedForeground }]}>Balansyňyzy dolduryň</Text>
          </Pressable>
          <Pressable
            onPress={() => { setShowSell(true); setAmount(""); setPhone(""); }}
            style={({ pressed }) => [styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="cash-outline" size={28} color={colors.foreground} />
            <Text style={[styles.actionLabel, { color: colors.foreground }]}>Bonus pul satmak</Text>
            <Text style={[styles.actionDesc, { color: colors.mutedForeground }]}>Puluňyzy nagtlaşdyryň</Text>
          </Pressable>
        </View>

        {/* Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>Bonus pul nähili işleýär?</Text>
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              Bonus puly (BP) demirýol biletleri we beýleki hyzmatlar üçin ulanmak bolýar. 1 BP = 1 TMT. Töleg sanlary:
            </Text>
            {PAYMENT_PHONES.map((p, i) => (
              <Text key={i} style={[{ color: colors.primary, fontWeight: "700", fontSize: 14, marginTop: 4 }]}>{p}</Text>
            ))}
          </View>
        </View>

        {/* Additional Services */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Goşmaça hyzmatlar</Text>
        {services.map((s, i) => (
          <Pressable key={i}
            style={({ pressed }) => [styles.serviceRow, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
          >
            <View style={[styles.serviceIcon, { backgroundColor: s.color + "20" }]}>
              <Ionicons name={s.icon} size={22} color={s.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.serviceTitle, { color: colors.foreground }]}>{s.title}</Text>
              <Text style={[styles.serviceDesc, { color: colors.mutedForeground }]}>{s.desc}</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={18} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </ScrollView>

      {/* Buy Modal */}
      <Modal visible={showBuy} transparent animationType="slide" onRequestClose={() => setShowBuy(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowBuy(false)} />
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Bonus pul satyn almak</Text>
          <Text style={[styles.sheetDesc, { color: colors.mutedForeground }]}>
            Aşakdaky sanlara töleg edip, bron koduny iberiň:
          </Text>
          {PAYMENT_PHONES.map((p, i) => (
            <Text key={i} style={[{ color: colors.primary, fontWeight: "700", fontSize: 16, marginBottom: 4 }]}>{p}</Text>
          ))}
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 16 }]}>Mukdar (BP/TMT)</Text>
          <TextInput
            value={amount} onChangeText={setAmount}
            placeholder="Mukdar giriziň" placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
          />
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 12 }]}>Siziň nomeriňiz</Text>
          <TextInput
            value={phone} onChangeText={setPhone}
            placeholder="+99361xxxxxx" placeholderTextColor={colors.mutedForeground}
            keyboardType="phone-pad"
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
          />
          <Pressable onPress={handleBuy} disabled={loading}
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed || loading ? 0.7 : 1, marginTop: 20 }]}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> :
              <Text style={styles.primaryBtnText}>Sargyt ibermek</Text>}
          </Pressable>
        </View>
      </Modal>

      {/* Sell Modal */}
      <Modal visible={showSell} transparent animationType="slide" onRequestClose={() => setShowSell(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowSell(false)} />
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Bonus pul satmak</Text>
          <Text style={[styles.sheetDesc, { color: colors.mutedForeground }]}>
            Bonus puly nagtlaşdyrmak üçin aşakdaky maglumatlary giriziň.
          </Text>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 12 }]}>Mukdar (BP)</Text>
          <TextInput
            value={amount} onChangeText={setAmount}
            placeholder="Mukdar giriziň" placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
          />
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 12 }]}>Siziň nomeriňiz</Text>
          <TextInput
            value={phone} onChangeText={setPhone}
            placeholder="+99361xxxxxx" placeholderTextColor={colors.mutedForeground}
            keyboardType="phone-pad"
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
          />
          <Pressable onPress={handleSell} disabled={loading}
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed || loading ? 0.7 : 1, marginTop: 20 }]}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> :
              <Text style={styles.primaryBtnText}>Sargyt ibermek</Text>}
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 },
  balanceCard: { borderRadius: 20, padding: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  balanceLabel: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginBottom: 4 },
  balanceAmount: { color: "#fff", fontSize: 42, fontWeight: "800", lineHeight: 48 },
  balanceCurrency: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  actionsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  actionBtn: { flex: 1, borderRadius: 16, borderWidth: 2, padding: 16, alignItems: "center", gap: 6 },
  actionLabel: { fontWeight: "700", fontSize: 13, textAlign: "center" },
  actionDesc: { fontSize: 11, textAlign: "center" },
  infoCard: { flexDirection: "row", gap: 12, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16, alignItems: "flex-start" },
  infoTitle: { fontWeight: "700", fontSize: 14, marginBottom: 6 },
  infoText: { fontSize: 13, lineHeight: 20 },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 12 },
  serviceRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  serviceIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  serviceTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  serviceDesc: { fontSize: 12 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 0 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: "800", marginBottom: 8 },
  sheetDesc: { fontSize: 13, lineHeight: 20, marginBottom: 8 },
  fieldLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 16 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
