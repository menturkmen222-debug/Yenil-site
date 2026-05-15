import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  Alert, ActivityIndicator, Platform, Image,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useColors } from "@/hooks/useColors";
import { uploadImage } from "@/lib/upload";

const BACKENDLESS_URL = `https://api.backendless.com/C3BB5032-1DCC-4DB3-888F-AEDA785F26CB/9A8CACA4-5889-4D47-903E-BF12F059E175`;
const PAYMENT_PHONES = ["+993 71 789091", "+993 64 629487", "+993 71 788546"];

type Mode = "main" | "buy" | "sell" | "success";
type CryptoType = "payeer" | "perfect" | "webmoney";
type ProofType = "screenshot" | "sms";

export default function PayScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const [mode, setMode] = useState<Mode>("main");

  // Buy state
  const [buyCrypto, setBuyCrypto] = useState<CryptoType>("payeer");
  const [buyCurrency, setBuyCurrency] = useState("usd");
  const [buyAmount, setBuyAmount] = useState("");
  const [buyPayeerId, setBuyPayeerId] = useState("");
  const [buyPerfectId, setBuyPerfectId] = useState("");
  const [buyWebmoneyId, setBuyWebmoneyId] = useState("");
  const [buyPhone, setBuyPhone] = useState("");
  const [buyProof, setBuyProof] = useState<ProofType | null>(null);
  const [buySms, setBuySms] = useState("");
  const [buyImageUri, setBuyImageUri] = useState<string | null>(null);
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState("");

  // Sell state
  const [sellCrypto, setSellCrypto] = useState<CryptoType>("payeer");
  const [sellCurrency, setSellCurrency] = useState("usd");
  const [sellAmount, setSellAmount] = useState("");
  const [sellPayeerId, setSellPayeerId] = useState("");
  const [sellPerfectId, setSellPerfectId] = useState("");
  const [sellWebmoneyId, setSellWebmoneyId] = useState("");
  const [sellPhone, setSellPhone] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [sellProof, setSellProof] = useState<ProofType | null>(null);
  const [sellSms, setSellSms] = useState("");
  const [sellImageUri, setSellImageUri] = useState<string | null>(null);
  const [sellLoading, setSellLoading] = useState(false);
  const [sellError, setSellError] = useState("");

  function calcBuyTotal() {
    const amt = parseFloat(buyAmount) || 0;
    if (buyCrypto === "payeer") return buyCurrency === "usd" ? amt * 29 : (amt / 90) * 29;
    return amt * 29;
  }

  function calcSellTotal() {
    const amt = parseFloat(sellAmount) || 0;
    if (sellCrypto === "payeer") return sellCurrency === "usd" ? amt * 19 : (amt / 50) * 10;
    return amt * 19;
  }

  async function pickImage(isSell: boolean) {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      if (isSell) setSellImageUri(result.assets[0].uri);
      else setBuyImageUri(result.assets[0].uri);
    }
  }


  async function submitBuy() {
    if (!buyCrypto || !buyPhone || !buyProof) { Alert.alert("Ýalňyşlyk", "Ähli meýdançalary dolduryň!"); return; }
    if (buyProof === "screenshot" && !buyImageUri) { Alert.alert("Ýalňyşlyk", "Skrinshot saýlanmady!"); return; }
    if (buyProof === "sms" && !buySms.trim()) { Alert.alert("Ýalňyşlyk", "SMS habaryny giriziň!"); return; }
    setBuyLoading(true); setBuyError("");
    try {
      let screenshotUrl: string | null = null;
      if (buyProof === "screenshot" && buyImageUri) screenshotUrl = await uploadImage(buyImageUri);
      const response = await fetch(`${BACKENDLESS_URL}/data/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "pay-buy", crypto: buyCrypto, currency: buyCurrency,
          amount: parseFloat(buyAmount) || 0, totalPrice: calcBuyTotal(), phone: buyPhone,
          payeerId: buyPayeerId, perfectId: buyPerfectId, webmoneyId: buyWebmoneyId,
          proofType: buyProof, smsText: buyProof === "sms" ? buySms : "", screenshotUrl,
          timestamp: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMode("success");
    } catch (e: any) {
      setBuyError("Ýalňyşlyk: " + (e.message || "Bilinmeýän ýalňyşlyk"));
    } finally { setBuyLoading(false); }
  }

  async function submitSell() {
    if (!sellCrypto || !sellPhone || !secretCode || !sellProof) { Alert.alert("Ýalňyşlyk", "Ähli meýdançalary dolduryň!"); return; }
    if (sellProof === "screenshot" && !sellImageUri) { Alert.alert("Ýalňyşlyk", "Skrinshot saýlanmady!"); return; }
    setSellLoading(true); setSellError("");
    try {
      let screenshotUrl: string | null = null;
      if (sellProof === "screenshot" && sellImageUri) screenshotUrl = await uploadImage(sellImageUri);
      const response = await fetch(`${BACKENDLESS_URL}/data/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "pay-sell", crypto: sellCrypto, currency: sellCurrency,
          amount: parseFloat(sellAmount) || 0, totalPrice: calcSellTotal(), phone: sellPhone,
          secretCode, payeerId: sellPayeerId, perfectId: sellPerfectId, webmoneyId: sellWebmoneyId,
          proofType: sellProof, smsText: sellProof === "sms" ? sellSms : "", screenshotUrl,
          timestamp: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMode("success");
    } catch (e: any) {
      setSellError("Ýalňyşlyk: " + (e.message || "Bilinmeýän ýalňyşlyk"));
    } finally { setSellLoading(false); }
  }

  const topPad = (isWeb ? 67 : insets.top) + 12;

  function CryptoFields({ isSell }: { isSell: boolean }) {
    const crypto = isSell ? sellCrypto : buyCrypto;
    const setCrypto = isSell ? setSellCrypto : setBuyCrypto;
    const currency = isSell ? sellCurrency : buyCurrency;
    const setCurrency = isSell ? setSellCurrency : setBuyCurrency;
    const amount = isSell ? sellAmount : buyAmount;
    const setAmount = isSell ? setSellAmount : setBuyAmount;
    const payeerId = isSell ? sellPayeerId : buyPayeerId;
    const setPayeerId = isSell ? setSellPayeerId : setBuyPayeerId;
    const perfectId = isSell ? sellPerfectId : buyPerfectId;
    const setPerfectId = isSell ? setSellPerfectId : setBuyPerfectId;
    const webmoneyId = isSell ? sellWebmoneyId : buyWebmoneyId;
    const setWebmoneyId = isSell ? setSellWebmoneyId : setBuyWebmoneyId;
    const total = isSell ? calcSellTotal() : calcBuyTotal();

    return (
      <>
        <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Töleg görnüşi</Text>
        <View style={s.cryptoRow}>
          {(["payeer", "perfect", "webmoney"] as CryptoType[]).map(c => (
            <Pressable key={c} onPress={() => setCrypto(c)}
              style={[s.cryptoCard, { backgroundColor: crypto === c ? colors.primary + "15" : colors.card, borderColor: crypto === c ? colors.primary : colors.border }]}>
              <Text style={[{ fontWeight: "700", fontSize: 11, color: crypto === c ? colors.primary : colors.foreground }]}>
                {c === "payeer" ? "Payeer" : c === "perfect" ? "Perfect Money" : "WebMoney"}
              </Text>
            </Pressable>
          ))}
        </View>

        {crypto === "payeer" && (
          <>
            <Text style={[s.fieldLabel, { color: colors.mutedForeground, marginTop: 12 }]}>Walýuta</Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 8 }}>
              {["usd", "rub"].map(cur => (
                <Pressable key={cur} onPress={() => setCurrency(cur)}
                  style={[s.curBtn, { backgroundColor: currency === cur ? colors.primary : colors.card, borderColor: currency === cur ? colors.primary : colors.border }]}>
                  <Text style={{ color: currency === cur ? "#fff" : colors.foreground, fontWeight: "700", fontSize: 13 }}>
                    {cur === "usd" ? "USD ($)" : "RUB (₽)"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <View style={{ marginTop: 12 }}>
          <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>
            Näçe {crypto === "payeer" && currency === "rub" ? "RUBL" : "USD"} {isSell ? "satmakçysyňyz" : "almakçysyňyz"}?
          </Text>
          <TextInput value={amount} onChangeText={setAmount} placeholder="1.00"
            placeholderTextColor={colors.mutedForeground} keyboardType="decimal-pad"
            style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          />
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>
            {crypto === "payeer" ? "Payeer ID" : crypto === "perfect" ? "Perfect Money Account" : "WebMoney Wallet (WMZ)"}
          </Text>
          <TextInput
            value={crypto === "payeer" ? payeerId : crypto === "perfect" ? perfectId : webmoneyId}
            onChangeText={crypto === "payeer" ? setPayeerId : crypto === "perfect" ? setPerfectId : setWebmoneyId}
            placeholder={crypto === "payeer" ? "P1234567890" : crypto === "perfect" ? "U1234567890" : "Z123456789012"}
            placeholderTextColor={colors.mutedForeground} autoCapitalize="characters"
            style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          />
        </View>

        {parseFloat(amount) > 0 && (
          <View style={[s.totalCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary }]}>
            <Text style={[{ color: colors.primary, fontSize: 26, fontWeight: "800" }]}>{total.toFixed(2)} TMT</Text>
          </View>
        )}
      </>
    );
  }

  function ProofSection({ isSell }: { isSell: boolean }) {
    const proof = isSell ? sellProof : buyProof;
    const setProof = isSell ? setSellProof : setBuyProof;
    const sms = isSell ? sellSms : buySms;
    const setSms = isSell ? setSellSms : setBuySms;
    const imageUri = isSell ? sellImageUri : buyImageUri;

    return (
      <>
        <Text style={[s.sectionHead, { color: colors.foreground }]}>Tölegi tassyklaň</Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          {([{ id: "screenshot" as ProofType, icon: "camera-outline" as const, label: "Skrinshot" },
            { id: "sms" as ProofType, icon: "chatbubble-outline" as const, label: "SMS habary" }]).map(t => (
            <Pressable key={t.id} onPress={() => setProof(t.id)}
              style={[s.proofCard, { backgroundColor: proof === t.id ? colors.primary + "15" : colors.card, borderColor: proof === t.id ? colors.primary : colors.border }]}>
              <Ionicons name={t.icon} size={22} color={proof === t.id ? colors.primary : colors.mutedForeground} />
              <Text style={[{ fontWeight: "700", fontSize: 13, color: proof === t.id ? colors.primary : colors.foreground }]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
        {proof === "sms" && (
          <TextInput value={sms} onChangeText={setSms} placeholder="SMS haty şu ýere ýazyň..."
            placeholderTextColor={colors.mutedForeground} multiline numberOfLines={3}
            style={[s.input, s.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, marginTop: 10 }]}
          />
        )}
        {proof === "screenshot" && (
          <Pressable onPress={() => pickImage(isSell)}
            style={[{ borderWidth: 2, borderStyle: "dashed", borderColor: colors.primary, borderRadius: 12, padding: 20, alignItems: "center", marginTop: 10, gap: 6 }]}>
            <Ionicons name="cloud-upload-outline" size={32} color={colors.primary} />
            <Text style={[{ color: colors.primary, fontWeight: "600" }]}>Suraty ýüklemek üçin üstünden basyň</Text>
          </Pressable>
        )}
        {imageUri && proof === "screenshot" && (
          <Image source={{ uri: imageUri }} style={{ height: 160, borderRadius: 12, marginTop: 10, resizeMode: "cover" }} />
        )}
      </>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: topPad, backgroundColor: colors.primary }]}>
        <Text style={s.headerTitle}>Ýeňil Pay</Text>
        <Text style={s.headerSub}>Daşary ýurt walýutasy</Text>
      </View>

      {mode === "main" && (
        <View style={{ padding: 16, gap: 14 }}>
          <View style={[s.rateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[{ color: colors.foreground, fontWeight: "700" }]}>Kurs: <Text style={{ color: colors.primary }}>1 USD = 29 TMT</Text> (satyn almak)</Text>
              <Text style={[{ color: colors.foreground, fontWeight: "700", marginTop: 2 }]}>Kurs: <Text style={{ color: colors.foreground }}>1 USD = 19 TMT</Text> (satmak)</Text>
              <Text style={[{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }]}>Payeer, Perfect Money, WebMoney</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 14 }}>
            <Pressable onPress={() => setMode("buy")}
              style={({ pressed }) => [s.mainBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}>
              <Ionicons name="arrow-down-circle-outline" size={28} color="#fff" />
              <Text style={s.mainBtnText}>Satyn almak</Text>
            </Pressable>
            <Pressable onPress={() => setMode("sell")}
              style={({ pressed }) => [s.mainBtn, { backgroundColor: "#059669", opacity: pressed ? 0.85 : 1 }]}>
              <Ionicons name="arrow-up-circle-outline" size={28} color="#fff" />
              <Text style={s.mainBtnText}>Satmak</Text>
            </Pressable>
          </View>
        </View>
      )}

      {(mode === "buy" || mode === "sell") && (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 34 : 100 }}
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => setMode("main")} style={s.backRow}>
            <Feather name="arrow-left" size={16} color={colors.primary} />
            <Text style={[{ color: colors.primary, fontWeight: "600" }]}>Yza</Text>
          </Pressable>

          <Text style={[s.sectionHead, { color: colors.foreground }]}>
            {mode === "buy" ? "Satyn almak" : "Satmak"}
          </Text>

          <CryptoFields isSell={mode === "sell"} />

          <View style={{ marginTop: 14 }}>
            <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Siziň TMCELL nomeriňiz</Text>
            <TextInput
              value={mode === "buy" ? buyPhone : sellPhone}
              onChangeText={mode === "buy" ? setBuyPhone : setSellPhone}
              placeholder="+993 XX XXXXXX" placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
              style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            />
          </View>

          {mode === "buy" && (
            <View style={[s.infoBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary }]}>
              <Text style={[{ fontWeight: "700", color: colors.foreground, marginBottom: 6 }]}>Töleg nomerlerimiz:</Text>
              {PAYMENT_PHONES.map((p, i) => <Text key={i} style={{ color: colors.primary, fontWeight: "700" }}>{p}</Text>)}
              <Text style={[{ color: colors.primary, fontWeight: "800", marginTop: 6 }]}>Jemi töleg: {calcBuyTotal().toFixed(2)} TMT</Text>
            </View>
          )}

          {mode === "sell" && (
            <>
              <View style={{ marginTop: 14 }}>
                <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Gizlin kod (biz size ibereris)</Text>
                <TextInput value={secretCode} onChangeText={setSecretCode} placeholder="Gizlin kod"
                  placeholderTextColor={colors.mutedForeground}
                  style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                />
              </View>
              <View style={[s.infoBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary }]}>
                <Text style={[{ fontWeight: "700", color: colors.foreground, marginBottom: 4 }]}>Siz şu ID-a pul ibermeli:</Text>
                <Text style={{ color: colors.primary, fontWeight: "700" }}>P1115509057</Text>
                <Text style={[{ color: colors.primary, fontWeight: "800", marginTop: 6 }]}>Size iberiljek: {calcSellTotal().toFixed(2)} TMT</Text>
              </View>
            </>
          )}

          <ProofSection isSell={mode === "sell"} />

          {(mode === "buy" ? buyError : sellError) ? (
            <View style={[{ backgroundColor: "#fee2e2", borderRadius: 10, padding: 12, marginTop: 12 }]}>
              <Text style={{ color: "#dc2626" }}>{mode === "buy" ? buyError : sellError}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={mode === "buy" ? submitBuy : submitSell}
            disabled={mode === "buy" ? buyLoading : sellLoading}
            style={({ pressed }) => [s.primaryBtn, { backgroundColor: colors.primary, opacity: pressed || (mode === "buy" ? buyLoading : sellLoading) ? 0.7 : 1 }]}
          >
            {(mode === "buy" ? buyLoading : sellLoading) ? <ActivityIndicator color="#fff" size="small" /> : (
              <>
                <Ionicons name="send-outline" size={18} color="#fff" />
                <Text style={s.primaryBtnText}>{mode === "buy" ? "Göýbermek we tassyklamak" : "Tassyklamak we ibermek"}</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      )}

      {mode === "success" && (
        <View style={s.successContainer}>
          <Ionicons name="trophy-outline" size={64} color={colors.primary} />
          <Text style={[s.successTitle, { color: colors.foreground }]}>Üstünlikli!</Text>
          <Text style={[s.successText, { color: colors.mutedForeground }]}>
            Iň tiz wagtda Ýeňil siz bilen baglanar.
          </Text>
          <Pressable onPress={() => {
            setMode("main");
            setBuyAmount(""); setSellAmount(""); setBuyProof(null); setSellProof(null);
            setBuySms(""); setSellSms(""); setBuyImageUri(null); setSellImageUri(null);
            setBuyError(""); setSellError(""); setSecretCode("");
          }}
            style={({ pressed }) => [s.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}>
            <Ionicons name="home-outline" size={18} color="#fff" />
            <Text style={s.primaryBtnText}>Baş sahypa</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 },
  rateCard: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: "flex-start" },
  mainBtn: { flex: 1, borderRadius: 16, padding: 20, alignItems: "center", gap: 8 },
  mainBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  sectionHead: { fontSize: 16, fontWeight: "700", marginTop: 16, marginBottom: 10 },
  fieldLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  textarea: { height: 80, textAlignVertical: "top" },
  cryptoRow: { flexDirection: "row", gap: 8 },
  cryptoCard: { flex: 1, borderRadius: 10, borderWidth: 2, padding: 12, alignItems: "center" },
  curBtn: { flex: 1, borderRadius: 10, borderWidth: 1, paddingVertical: 10, alignItems: "center" },
  totalCard: { borderWidth: 1, borderRadius: 14, padding: 16, alignItems: "center", marginTop: 14 },
  infoBox: { borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 14, gap: 2 },
  proofCard: { flex: 1, borderRadius: 12, borderWidth: 2, padding: 14, alignItems: "center", gap: 6 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 16, marginTop: 16 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  successContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  successTitle: { fontSize: 24, fontWeight: "800" },
  successText: { fontSize: 14, lineHeight: 22, textAlign: "center" },
});
