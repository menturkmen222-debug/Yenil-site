import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  Alert, ActivityIndicator, Platform,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";

const BACKENDLESS_URL = `https://api.backendless.com/C3BB5032-1DCC-4DB3-888F-AEDA785F26CB/9A8CACA4-5889-4D47-903E-BF12F059E175`;
const PAYMENT_PHONES = ["+993 71 789091", "+993 64 629487", "+993 71 788546"];

const CITIES: Record<string, string> = {
  ashgabat: "Aşgabat",
  dashoguz: "Daşoguz",
  balkanabat: "Balkanabat",
  turkmenbasy: "Türkmenbaşy",
  mary: "Mary",
  lebap: "Lebap",
};

const CITY_KEYS = Object.keys(CITIES);
type Section = "info" | "form" | "payment" | "confirm" | "success";

function PickerRow({ label, value, onNext, onPrev }: { label: string; value: string; onNext: () => void; onPrev: () => void }) {
  const colors = useColors();
  return (
    <View style={[pickStyles.row, { borderColor: colors.border }]}>
      <Text style={[pickStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={pickStyles.ctrl}>
        <Pressable onPress={onPrev} style={[pickStyles.btn, { backgroundColor: colors.muted }]}>
          <Feather name="chevron-left" size={18} color={colors.primary} />
        </Pressable>
        <Text style={[pickStyles.val, { color: colors.foreground }]}>{value}</Text>
        <Pressable onPress={onNext} style={[pickStyles.btn, { backgroundColor: colors.muted }]}>
          <Feather name="chevron-right" size={18} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const pickStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1 },
  label: { fontSize: 13, flex: 1 },
  ctrl: { flexDirection: "row", alignItems: "center", gap: 10 },
  btn: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  val: { fontSize: 14, fontWeight: "600", minWidth: 80, textAlign: "center" },
});

export default function DemiryolScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { balance, deduct, deviceId } = useBonusPul();
  const isWeb = Platform.OS === "web";

  const [section, setSection] = useState<Section>("info");
  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(1);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [passport, setPassport] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [firstClass, setFirstClass] = useState(false);
  const [secondClass, setSecondClass] = useState(false);
  const [mediaPortal, setMediaPortal] = useState(false);
  const [proofType, setProofType] = useState<"sms" | "bonus" | null>(null);
  const [smsText, setSmsText] = useState("");
  const [loading, setLoading] = useState(false);

  // Ticket lookup
  const [bookingCode, setBookingCode] = useState("");
  const [ticketResult, setTicketResult] = useState<any>(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketError, setTicketError] = useState("");
  const [showLookup, setShowLookup] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  function calcPrice() {
    if (!travelDate) return 60;
    const travel = new Date(travelDate);
    const diff = Math.ceil((travel.getTime() - Date.now()) / 86400000);
    let base = diff <= 1 ? 80 : diff <= 3 ? 70 : 60;
    let addons = 0;
    if (secondClass) addons += diff <= 4 ? 10 : 5;
    if (mediaPortal) addons += 5;
    if (firstClass) addons += diff <= 4 ? 15 : 10;
    return base + addons;
  }

  const price = calcPrice();

  async function searchTicket() {
    const code = bookingCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      Alert.alert("Ýalňyşlyk", "Bron kody 6 belgi bolmaly (meselem: ABC123)");
      return;
    }
    setTicketLoading(true);
    setTicketError("");
    setTicketResult(null);
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const base = domain ? `https://${domain}` : "";
      const res = await fetch(`${base}/api/demiryol?id=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tapylmady");
      if (!data.data?.booking) throw new Error("Bron kody tapylmady");
      setTicketResult(data.data.booking);
    } catch (e: any) {
      setTicketError(e.message || "Bilinmeýän ýalňyşlyk");
    } finally {
      setTicketLoading(false);
    }
  }

  async function handleSubmit() {
    if (!proofType) { Alert.alert("Ýalňyşlyk", "Töleg usulyny saýlaň!"); return; }
    if (proofType === "sms" && !smsText.trim()) { Alert.alert("Ýalňyşlyk", "SMS habary giriziň!"); return; }
    if (proofType === "bonus" && balance < price) { Alert.alert("Ýalňyşlyk", `Ýeterlik bonus pul ýok. Balansy: ${balance} BP`); return; }

    setLoading(true);
    try {
      if (proofType === "bonus") {
        const ok = await deduct(price);
        if (!ok) { Alert.alert("Ýalňyşlyk", "Bonus pul aýyrmak başartmady!"); setLoading(false); return; }
      }
      const orderData = {
        type: "demiryol", name, surname, passport, birthdate,
        route: `${CITY_KEYS[fromIdx]}-${CITY_KEYS[toIdx]}`,
        travelDate, totalPrice: price, clientPhone, proofType,
        deviceId: proofType === "bonus" ? deviceId : undefined,
        smsText: proofType === "sms" ? smsText : null,
        firstClass, secondClass, mediaPortal,
        timestamp: new Date().toISOString(), created: new Date().toISOString(), updated: new Date().toISOString(),
      };
      const res = await fetch(`${BACKENDLESS_URL}/data/orders`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      if (!res.ok) throw new Error(`Status: ${res.status}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSection("success");
    } catch (e: any) {
      Alert.alert("Ýalňyşlyk", e.message || "Bilinmeýän ýalňyşlyk");
    } finally {
      setLoading(false);
    }
  }

  function validateForm() {
    if (!name || !surname || !birthdate || !passport || !travelDate || !clientPhone) {
      Alert.alert("Ýalňyşlyk", "Ähli meýdançalary dolduryň!"); return false;
    }
    if (fromIdx === toIdx) {
      Alert.alert("Ýalňyşlyk", "Nirden we Nira tapawutly bolmaly!"); return false;
    }
    return true;
  }

  const topPad = isWeb ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.primary }]}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Ionicons name="train-outline" size={24} color="#fff" />
            <Text style={styles.headerTitle}>Demirýol biletleri</Text>
          </View>
          <Pressable onPress={() => setShowLookup(!showLookup)}
            style={[styles.lookupBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Ionicons name="search-outline" size={18} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>Bilet gözle</Text>
          </Pressable>
        </View>

        {showLookup && (
          <View style={styles.lookupBox}>
            <TextInput
              value={bookingCode}
              onChangeText={t => setBookingCode(t.toUpperCase())}
              placeholder="Bron kody (ABC123)"
              placeholderTextColor="rgba(255,255,255,0.6)"
              maxLength={6}
              style={[styles.lookupInput]}
              autoCapitalize="characters"
            />
            <Pressable onPress={searchTicket} style={styles.lookupSearchBtn}>
              {ticketLoading ? <ActivityIndicator color="#fff" size="small" /> :
                <Ionicons name="search" size={20} color="#fff" />}
            </Pressable>
          </View>
        )}

        {ticketError ? (
          <Text style={{ color: "#fca5a5", marginTop: 8, fontSize: 13 }}>{ticketError}</Text>
        ) : ticketResult ? (
          <View style={styles.ticketResult}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              {ticketResult.passenger_name} — {ticketResult.route || "Ugur"}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
              {ticketResult.departure_date} | {ticketResult.train_number}
            </Text>
          </View>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 34 : 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {section === "info" && (
          <View>
            <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoTitle, { color: colors.foreground }]}>Möhüm maglumat</Text>
                <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                  Bu hyzmat arkaly Türkmenistanyň demirýol biletlerini kart tölegsiz satyn alyp bilersiňiz. Töleg öňünden geçirilýär. Bilet 1 sagadyň içinde SMS arkaly iberilýär.
                </Text>
              </View>
            </View>
            <View style={[styles.warnBox, { backgroundColor: "#fef3c7", borderColor: "#f59e0b" }]}>
              <Ionicons name="warning-outline" size={18} color="#d97706" />
              <Text style={{ color: "#92400e", fontSize: 13, flex: 1, lineHeight: 18 }}>
                Töleg edeniňizden soň 15 minut içinde SMS zaýawka iberilmeli.
              </Text>
            </View>
            <Pressable
              onPress={() => setSection("form")}
              style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={styles.primaryBtnText}>Dowam etmek</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </Pressable>
          </View>
        )}

        {section === "form" && (
          <View>
            <Text style={[styles.sectionHead, { color: colors.foreground }]}>Ugur we pasport</Text>

            <PickerRow
              label="Nirden"
              value={CITIES[CITY_KEYS[fromIdx]]}
              onPrev={() => setFromIdx(i => (i - 1 + CITY_KEYS.length) % CITY_KEYS.length)}
              onNext={() => setFromIdx(i => (i + 1) % CITY_KEYS.length)}
            />
            <PickerRow
              label="Nira"
              value={CITIES[CITY_KEYS[toIdx]]}
              onPrev={() => setToIdx(i => (i - 1 + CITY_KEYS.length) % CITY_KEYS.length)}
              onNext={() => setToIdx(i => (i + 1) % CITY_KEYS.length)}
            />

            {[
              { label: "Adyňyz", value: name, set: setName, placeholder: "Adyňyz" },
              { label: "Familýaňyz", value: surname, set: setSurname, placeholder: "Familýaňyz" },
              { label: "Pasport ID", value: passport, set: (v: string) => setPassport(v.toUpperCase()), placeholder: "I-DZ 123456" },
              { label: "Doglan senesi (YYYY-MM-DD)", value: birthdate, set: setBirthdate, placeholder: "1990-01-15" },
              { label: "Sapar senesi (YYYY-MM-DD)", value: travelDate, set: setTravelDate, placeholder: today },
              { label: "Siziň nomeriňiz", value: clientPhone, set: setClientPhone, placeholder: "+99361xxxxxx" },
            ].map((f, i) => (
              <View key={i} style={{ marginTop: 14 }}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{f.label}</Text>
                <TextInput
                  value={f.value}
                  onChangeText={f.set}
                  placeholder={f.placeholder}
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                />
              </View>
            ))}

            <Text style={[styles.sectionHead, { color: colors.foreground, marginTop: 20 }]}>Goşmaça</Text>
            {[
              { label: "1-nji gat", val: firstClass, set: (v: boolean) => { setFirstClass(v); if (v) setSecondClass(false); } },
              { label: "2-nji gat", val: secondClass, set: (v: boolean) => { setSecondClass(v); if (v) setFirstClass(false); } },
              { label: "Media portal (+5 TMT)", val: mediaPortal, set: setMediaPortal },
            ].map((a, i) => (
              <Pressable key={i} onPress={() => a.set(!a.val)}
                style={[styles.checkRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.checkbox, { borderColor: colors.primary, backgroundColor: a.val ? colors.primary : "transparent" }]}>
                  {a.val && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={[{ color: colors.foreground, fontSize: 14, fontWeight: "600" }]}>{a.label}</Text>
              </Pressable>
            ))}

            <View style={[styles.priceBadge, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}>
              <Ionicons name="cash-outline" size={20} color={colors.primary} />
              <Text style={[styles.priceText, { color: colors.primary }]}>Jemi: {price} TMT</Text>
            </View>

            <Pressable
              onPress={() => { if (validateForm()) setSection("payment"); }}
              style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={styles.primaryBtnText}>Töleg usulyna geçmek</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </Pressable>
            <Pressable onPress={() => setSection("info")} style={styles.secondaryBtn}>
              <Feather name="arrow-left" size={16} color={colors.mutedForeground} />
              <Text style={[styles.secondaryBtnText, { color: colors.mutedForeground }]}>Yza</Text>
            </Pressable>
          </View>
        )}

        {section === "payment" && (
          <View>
            <Text style={[styles.sectionHead, { color: colors.foreground }]}>Töleg maglumatlary</Text>
            <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                {PAYMENT_PHONES.map((p, i) => (
                  <Text key={i} style={[{ color: colors.foreground, fontWeight: "700", fontSize: 15, marginBottom: 2 }]}>{p}</Text>
                ))}
                <Text style={[{ color: colors.primary, fontWeight: "700", marginTop: 8 }]}>Jemi: {price} TMT</Text>
              </View>
            </View>

            <Text style={[styles.sectionHead, { color: colors.foreground }]}>Töleg usulyny saýlaň</Text>
            {[
              { id: "sms" as const, icon: "chatbubble-outline" as const, label: "SMS habary" },
              { id: "bonus" as const, icon: "wallet-outline" as const, label: `Bonus pul (${balance.toFixed(2)} BP)` },
            ].map(t => (
              <Pressable key={t.id} onPress={() => setProofType(t.id)}
                style={[styles.proofCard, {
                  backgroundColor: proofType === t.id ? colors.primary + "15" : colors.card,
                  borderColor: proofType === t.id ? colors.primary : colors.border,
                }]}>
                <Ionicons name={t.icon} size={22} color={proofType === t.id ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.proofLabel, { color: proofType === t.id ? colors.primary : colors.foreground }]}>{t.label}</Text>
              </Pressable>
            ))}

            {proofType === "bonus" && balance < price && (
              <View style={[styles.warnBox, { backgroundColor: "#fee2e2", borderColor: "#ef4444" }]}>
                <Ionicons name="warning-outline" size={16} color="#ef4444" />
                <Text style={{ color: "#dc2626", fontSize: 13, flex: 1 }}>
                  Ýeterlik bonus pul ýok ({balance.toFixed(2)} BP / {price} BP gerek)
                </Text>
              </View>
            )}

            {proofType === "sms" && (
              <View style={{ marginTop: 12 }}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>SMS habarynyzy giriziň</Text>
                <TextInput
                  value={smsText}
                  onChangeText={setSmsText}
                  placeholder="SMS haty şu ýere ýazyň..."
                  placeholderTextColor={colors.mutedForeground}
                  multiline numberOfLines={4}
                  style={[styles.input, styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                />
              </View>
            )}

            <Pressable
              onPress={() => { if (!proofType) { Alert.alert("Saýlaň", "Töleg usulyny saýlaň!"); return; } setSection("confirm"); }}
              style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={styles.primaryBtnText}>Tassyklamaga geçmek</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </Pressable>
            <Pressable onPress={() => setSection("form")} style={styles.secondaryBtn}>
              <Feather name="arrow-left" size={16} color={colors.mutedForeground} />
              <Text style={[styles.secondaryBtnText, { color: colors.mutedForeground }]}>Yza</Text>
            </Pressable>
          </View>
        )}

        {section === "confirm" && (
          <View>
            <Text style={[styles.sectionHead, { color: colors.foreground }]}>Tassyklaň</Text>
            <View style={[styles.confirmCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {[
                ["Ad", name], ["Familýa", surname], ["Pasport", passport],
                ["Ugur", `${CITIES[CITY_KEYS[fromIdx]]} → ${CITIES[CITY_KEYS[toIdx]]}`],
                ["Sapar senesi", travelDate], ["Töleg", `${price} TMT`],
                ["Nomeriňiz", clientPhone],
                ["Tassyklama", proofType === "sms" ? "SMS habary" : "Bonus pul"],
              ].map(([k, v], i) => (
                <View key={i} style={[styles.confirmRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.confirmKey, { color: colors.mutedForeground }]}>{k}</Text>
                  <Text style={[styles.confirmVal, { color: colors.foreground }]}>{v}</Text>
                </View>
              ))}
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed || loading ? 0.7 : 1 }]}
            >
              {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>Hawa, tassyklaýyn</Text>
                </>
              )}
            </Pressable>
            <Pressable onPress={() => setSection("payment")} style={styles.secondaryBtn}>
              <Feather name="arrow-left" size={16} color={colors.mutedForeground} />
              <Text style={[styles.secondaryBtnText, { color: colors.mutedForeground }]}>Yza</Text>
            </Pressable>
          </View>
        )}

        {section === "success" && (
          <View style={[styles.successCard, { backgroundColor: "#f0fdf4", borderColor: "#86efac" }]}>
            <Ionicons name="trophy-outline" size={48} color="#059669" />
            <Text style={[styles.successTitle, { color: "#065f46" }]}>Üstünlikli!</Text>
            <Text style={[styles.successText, { color: "#047857" }]}>
              Iň tiz wagtda siz bilen baglanarlar we bron kody bilen bilet nusgasyny iberärler.
            </Text>
            <Pressable
              onPress={() => {
                setSection("info");
                setName(""); setSurname(""); setPassport(""); setBirthdate("");
                setTravelDate(""); setClientPhone(""); setProofType(null); setSmsText("");
                setFirstClass(false); setSecondClass(false); setMediaPortal(false);
              }}
              style={({ pressed }) => [styles.primaryBtn, { backgroundColor: "#059669", opacity: pressed ? 0.85 : 1 }]}
            >
              <Ionicons name="home-outline" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Täze sargyt</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  lookupBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  lookupBox: { flexDirection: "row", gap: 8, marginTop: 12 },
  lookupInput: { flex: 1, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: 2 },
  lookupSearchBtn: { width: 42, height: 42, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  ticketResult: { marginTop: 10, padding: 10, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 10 },
  infoBox: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12, alignItems: "flex-start" },
  infoTitle: { fontWeight: "700", fontSize: 14, marginBottom: 4 },
  infoText: { fontSize: 13, lineHeight: 20 },
  warnBox: { flexDirection: "row", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderLeftWidth: 4, marginBottom: 12, alignItems: "flex-start" },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 16, marginTop: 16 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  secondaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, marginTop: 8 },
  secondaryBtnText: { fontSize: 15, fontWeight: "600" },
  sectionHead: { fontSize: 17, fontWeight: "700", marginTop: 16, marginBottom: 12 },
  fieldLabel: { fontSize: 12, marginBottom: 6, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  textarea: { height: 100, textAlignVertical: "top" },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  priceBadge: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16, borderRadius: 14, borderWidth: 1, marginTop: 16 },
  priceText: { fontSize: 20, fontWeight: "800" },
  proofCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 2, marginBottom: 10 },
  proofLabel: { fontSize: 15, fontWeight: "600" },
  confirmCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 8 },
  confirmRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1 },
  confirmKey: { fontSize: 13 },
  confirmVal: { fontSize: 13, fontWeight: "600", maxWidth: "55%", textAlign: "right" },
  successCard: { borderRadius: 20, borderWidth: 1, padding: 28, alignItems: "center", gap: 12, marginTop: 20 },
  successTitle: { fontSize: 24, fontWeight: "800" },
  successText: { fontSize: 14, lineHeight: 22, textAlign: "center" },
});
