import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  Alert, ActivityIndicator, Platform, Image, Dimensions,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";
import { saveOrder } from "@/lib/firebase";
import { uploadImage } from "@/lib/upload";
import { addToHistory } from "@/lib/orderHistory";

const OP_CARD_W = (Dimensions.get("window").width - 32 - 12) / 2;

const PAYMENT_PHONES = ["+993 71 789091", "+993 64 629487", "+993 71 788546"];
const BP_AMOUNTS = [50, 100, 200, 500];
const UZS_AMOUNTS = [10000, 25000, 50000, 100000];
const UZS_RATE = 0.028;

const UZ_OPERATORS = [
  { id: "ucell", name: "Ucell", color: "#e63946" },
  { id: "beeline", name: "Beeline UZ", color: "#f5a623" },
  { id: "mobiuz", name: "Mobiuz", color: "#2563eb" },
  { id: "uztelecom", name: "Uztelecom", color: "#059669" },
];

type Tab = "bp-buy" | "bp-sell" | "currency" | "sim";

function BonusBuySection({ colors }: { colors: ReturnType<typeof useColors> }) {
  const { deviceId } = useBonusPul();
  const [selected, setSelected] = useState<number | null>(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  async function handlePay() {
    if (!phone.trim()) { Alert.alert("Ýalňyşlyk", "Telefon belgiňizi giriziň!"); return; }
    setLoading(true);
    try {
      await saveOrder("bonus-orders", { deviceId, amount: selected, userPhone: phone, status: "pending" });
      await addToHistory({
        type: "bonus-buy",
        title: "BP Satyn almak",
        details: `${selected} BP · ${phone}`,
        amount: selected,
        amountLabel: `${selected} BP`,
        phone,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(true);
    } catch { Alert.alert("Ýalňyşlyk", "Bilinmeýän ýalňyşlyk"); }
    finally { setLoading(false); }
  }

  if (done) return (
    <View style={{ alignItems: "center", gap: 14, paddingTop: 24 }}>
      <Ionicons name="checkmark-circle" size={56} color="#059669" />
      <Text style={[{ fontSize: 20, fontWeight: "800", color: colors.foreground }]}>Üstünlikli!</Text>
      <Text style={[{ color: colors.mutedForeground, fontSize: 13, textAlign: "center", lineHeight: 20 }]}>
        Siziň bonus pul haýyşnamaňyz kabul edildi. Iň gysga wagtda hasabyňyza goşular.
      </Text>
      <Pressable onPress={() => { setDone(false); setSelected(null); setPhone(""); setShowPayment(false); }}
        style={({ pressed }) => [s.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}>
        <Text style={s.primaryBtnText}>Täzeden</Text>
      </Pressable>
    </View>
  );

  return (
    <>
      <Text style={[s.subTitle, { color: colors.mutedForeground }]}>
        Mukdary saýlap, görkezilen nomerlere pul geçiriň. Tassyklama soňra hasabyňyza goşular.
      </Text>
      {!showPayment ? (
        <>
          <View style={s.amountGrid}>
            {BP_AMOUNTS.map(a => (
              <Pressable key={a} onPress={() => setSelected(a)}
                style={[s.amountCard, {
                  width: OP_CARD_W,
                  backgroundColor: selected === a ? colors.primary + "15" : colors.card,
                  borderColor: selected === a ? colors.primary : colors.border,
                  borderWidth: selected === a ? 2 : 1,
                }]}>
                <Text style={[s.amountVal, { color: selected === a ? colors.primary : colors.foreground }]}>{a}</Text>
                <Text style={[s.amountLabel, { color: colors.mutedForeground }]}>BP = {a} TMT</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => { if (!selected) { Alert.alert("Saýlaň", "Mukdary saýlaň!"); return; } setShowPayment(true); }}
            style={({ pressed }) => [s.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1, marginTop: 20 }]}>
            <Text style={s.primaryBtnText}>Dowam etmek</Text>
          </Pressable>
        </>
      ) : (
        <>
          <View style={[s.infoBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary }]}>
            <Text style={[{ fontWeight: "700", color: colors.foreground, marginBottom: 8 }]}>Şu nomerleriň birine {selected} TMT geçirmeli:</Text>
            {PAYMENT_PHONES.map((p, i) => <Text key={i} style={{ color: colors.primary, fontWeight: "700", fontSize: 15, marginBottom: 4 }}>{p}</Text>)}
          </View>
          <View style={{ marginTop: 14 }}>
            <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Siziň nomeriňiz (tassyklama üçin)</Text>
            <TextInput value={phone} onChangeText={setPhone} placeholder="+993 XX XXXXXX"
              placeholderTextColor={colors.mutedForeground} keyboardType="phone-pad"
              style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            />
          </View>
          {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} /> : (
            <Pressable onPress={handlePay}
              style={({ pressed }) => [s.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1, marginTop: 16 }]}>
              <Text style={s.primaryBtnText}>Töleg geçirdim</Text>
            </Pressable>
          )}
          <Pressable onPress={() => setShowPayment(false)} style={s.backRow}>
            <Feather name="arrow-left" size={16} color={colors.mutedForeground} />
            <Text style={[{ color: colors.mutedForeground, fontWeight: "600" }]}>Yza</Text>
          </Pressable>
        </>
      )}
    </>
  );
}

function BonusSellSection({ colors }: { colors: ReturnType<typeof useColors> }) {
  const { balance, deviceId } = useBonusPul();
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSell() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { Alert.alert("Ýalňyşlyk", "Mukdary giriziň!"); return; }
    if (amt > balance) { Alert.alert("Ýalňyşlyk", `Ýeterlik bonus pul ýok. Balansyňyz: ${balance} BP`); return; }
    if (!phone.trim()) { Alert.alert("Ýalňyşlyk", "Nomeriňizi giriziň!"); return; }
    setLoading(true);
    try {
      await saveOrder("bonus-sell-orders", { deviceId, amount: amt, userPhone: phone, status: "pending" });
      await addToHistory({
        type: "bonus-sell",
        title: "BP Satmak",
        details: `${amt} BP · ${phone}`,
        amount: amt,
        amountLabel: `${amt} BP`,
        phone,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(true);
    } catch { Alert.alert("Ýalňyşlyk", "Bilinmeýän ýalňyşlyk"); }
    finally { setLoading(false); }
  }

  if (done) return (
    <View style={{ alignItems: "center", gap: 14, paddingTop: 24 }}>
      <Ionicons name="checkmark-circle" size={56} color="#059669" />
      <Text style={[{ fontSize: 20, fontWeight: "800", color: colors.foreground }]}>Haýyşnama kabul edildi!</Text>
      <Text style={[{ color: colors.mutedForeground, textAlign: "center", lineHeight: 20, fontSize: 13 }]}>
        Bonus pul satmak haýyşnamaňyz kabul edildi. Iň gysga wagtda işleniler.
      </Text>
      <Pressable onPress={() => { setDone(false); setAmount(""); setPhone(""); }}
        style={({ pressed }) => [s.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}>
        <Text style={s.primaryBtnText}>Täzeden</Text>
      </Pressable>
    </View>
  );

  return (
    <>
      <View style={[s.infoBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary }]}>
        <Text style={[{ color: colors.foreground }]}>
          Häzirki balansyňyz: <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 18 }}>{balance} BP</Text>
        </Text>
      </View>
      <View style={{ marginTop: 16 }}>
        <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Satmak üçin mukdar (BP)</Text>
        <TextInput value={amount} onChangeText={setAmount} placeholder="Meseläň: 100"
          placeholderTextColor={colors.mutedForeground} keyboardType="decimal-pad"
          style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        />
      </View>
      <View style={{ marginTop: 14 }}>
        <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>TMT alynjak nomer</Text>
        <TextInput value={phone} onChangeText={setPhone} placeholder="+993 XX XXXXXX"
          placeholderTextColor={colors.mutedForeground} keyboardType="phone-pad"
          style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        />
      </View>
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} /> : (
        <Pressable onPress={handleSell}
          style={({ pressed }) => [s.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1, marginTop: 20 }]}>
          <Text style={s.primaryBtnText}>Haýyşnama ibermek</Text>
        </Pressable>
      )}
    </>
  );
}

function CurrencySection({ colors }: { colors: ReturnType<typeof useColors> }) {
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [crypto, setCrypto] = useState("payeer");
  const [currency, setCurrency] = useState("usd");
  const [amount, setAmount] = useState("");
  const [walletId, setWalletId] = useState("");
  const [phone, setPhone] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [proofType, setProofType] = useState<"screenshot" | "sms" | null>(null);
  const [smsText, setSmsText] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function calcTotal() {
    const amt = parseFloat(amount) || 0;
    if (mode === "buy") {
      if (crypto === "payeer") return currency === "usd" ? amt * 29 : (amt / 90) * 29;
      return amt * 29;
    } else {
      if (crypto === "payeer") return currency === "usd" ? amt * 19 : (amt / 50) * 10;
      return amt * 19;
    }
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
  }

  async function handleSubmit() {
    if (!amount || !phone) { Alert.alert("Ýalňyşlyk", "Ähli meýdançalary dolduryň!"); return; }
    setLoading(true);
    try {
      const screenshotUrl = imageUri && proofType === "screenshot"
        ? await uploadImage(imageUri, "proof.jpg")
        : null;
      await saveOrder("orders", {
        type: mode === "buy" ? "pay-buy" : "pay-sell", crypto, currency,
        amount: parseFloat(amount), totalPrice: calcTotal(), phone, walletId,
        secretCode, proofType, smsText, screenshotUrl,
      });
      await addToHistory({
        type: mode === "buy" ? "currency-buy" : "currency-sell",
        title: mode === "buy" ? "Walýuta almak" : "Walýuta satmak",
        details: `${amount} ${currency?.toUpperCase()} · ${crypto === "payeer" ? "Payeer" : crypto === "perfect" ? "Perfect Money" : "WebMoney"} · ${phone}`,
        amount: parseFloat(amount) || 0,
        amountLabel: `${calcTotal().toFixed(2)} TMT`,
        phone,
        walletId,
        crypto,
        currency,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(true);
    } catch { Alert.alert("Ýalňyşlyk", "Bilinmeýän ýalňyşlyk"); }
    finally { setLoading(false); }
  }

  if (done) return (
    <View style={{ alignItems: "center", gap: 14, paddingTop: 24 }}>
      <Ionicons name="trophy-outline" size={56} color={colors.primary} />
      <Text style={[{ fontSize: 20, fontWeight: "800", color: colors.foreground }]}>Üstünlikli!</Text>
      <Text style={[{ color: colors.mutedForeground, textAlign: "center", lineHeight: 20, fontSize: 13 }]}>Iň tiz wagtda Ýeňil siz bilen baglanar.</Text>
      <Pressable onPress={() => { setDone(false); setAmount(""); setWalletId(""); setPhone(""); setSmsText(""); setImageUri(null); setSecretCode(""); }}
        style={({ pressed }) => [s.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}>
        <Text style={s.primaryBtnText}>Täzeden</Text>
      </Pressable>
    </View>
  );

  return (
    <>
      <View style={[s.tabRow, { backgroundColor: colors.muted }]}>
        {([{ id: "buy" as const, label: "Satyn almak" }, { id: "sell" as const, label: "Satmak" }]).map(t => (
          <Pressable key={t.id} onPress={() => setMode(t.id)}
            style={[s.tabBtn, { backgroundColor: mode === t.id ? colors.primary : "transparent" }]}>
            <Text style={[{ fontWeight: "700", fontSize: 13, color: mode === t.id ? "#fff" : colors.mutedForeground }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={[s.infoBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary }]}>
        <Text style={[{ fontWeight: "700", color: colors.foreground }]}>1 USD = {mode === "buy" ? "29" : "19"} TMT · Payeer, Perfect Money, WebMoney</Text>
      </View>
      <View style={{ marginTop: 14 }}>
        <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Töleg görnüşi</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {["payeer", "perfect", "webmoney"].map(c => (
            <Pressable key={c} onPress={() => { setCrypto(c); setWalletId(""); }}
              style={[s.cryptoChip, { backgroundColor: crypto === c ? colors.primary + "15" : colors.card, borderColor: crypto === c ? colors.primary : colors.border }]}>
              <Text style={[{ fontWeight: "700", fontSize: 11, color: crypto === c ? colors.primary : colors.foreground }]}>
                {c === "payeer" ? "Payeer" : c === "perfect" ? "Perfect Money" : "WebMoney"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      {crypto === "payeer" && (
        <View style={{ marginTop: 12, flexDirection: "row", gap: 8 }}>
          {["usd", "rub"].map(cur => (
            <Pressable key={cur} onPress={() => setCurrency(cur)}
              style={[s.cryptoChip, { flex: 1, backgroundColor: currency === cur ? colors.primary + "15" : colors.card, borderColor: currency === cur ? colors.primary : colors.border }]}>
              <Text style={[{ fontWeight: "700", fontSize: 13, color: currency === cur ? colors.primary : colors.foreground }]}>{cur === "usd" ? "USD ($)" : "RUB (₽)"}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <View style={{ marginTop: 14 }}>
        <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Mukdar</Text>
        <TextInput value={amount} onChangeText={setAmount} placeholder="0.00"
          placeholderTextColor={colors.mutedForeground} keyboardType="decimal-pad"
          style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        />
      </View>
      <View style={{ marginTop: 14 }}>
        <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Wallet ID</Text>
        <TextInput value={walletId} onChangeText={setWalletId}
          placeholder={crypto === "payeer" ? "P1234567890" : crypto === "perfect" ? "U1234567890" : "Z123456789012"}
          placeholderTextColor={colors.mutedForeground} autoCapitalize="characters"
          style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        />
      </View>
      <View style={{ marginTop: 14 }}>
        <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Telefon nomeriňiz</Text>
        <TextInput value={phone} onChangeText={setPhone} placeholder="+993 XX XXXXXX"
          placeholderTextColor={colors.mutedForeground} keyboardType="phone-pad"
          style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        />
      </View>
      {mode === "sell" && (
        <View style={{ marginTop: 14 }}>
          <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Gizlin kod (biz ibereris)</Text>
          <TextInput value={secretCode} onChangeText={setSecretCode} placeholder="Gizlin kod"
            placeholderTextColor={colors.mutedForeground}
            style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          />
        </View>
      )}
      {parseFloat(amount) > 0 && (
        <View style={[s.infoBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary, alignItems: "center", marginTop: 14 }]}>
          <Text style={[{ color: colors.primary, fontSize: 22, fontWeight: "800" }]}>{calcTotal().toFixed(2)} TMT</Text>
        </View>
      )}
      {mode === "buy" && (
        <View style={[s.infoBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary, marginTop: 10 }]}>
          {PAYMENT_PHONES.map((p, i) => <Text key={i} style={{ color: colors.primary, fontWeight: "700", fontSize: 14 }}>{p}</Text>)}
        </View>
      )}
      {mode === "sell" && (
        <View style={[s.infoBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary, marginTop: 10 }]}>
          <Text style={[{ color: colors.foreground, fontWeight: "700" }]}>Siz şu ID-a pul ibermeli:</Text>
          <Text style={{ color: colors.primary, fontWeight: "700", marginTop: 4 }}>P1115509057</Text>
        </View>
      )}
      {/* Proof */}
      <View style={{ marginTop: 16 }}>
        <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Tölegi tassyklaň</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {([{ id: "screenshot" as const, icon: "camera-outline" as const, label: "Skrinshot" },
            { id: "sms" as const, icon: "chatbubble-outline" as const, label: "SMS" }]).map(t => (
            <Pressable key={t.id} onPress={() => setProofType(t.id)}
              style={[s.proofCard, { backgroundColor: proofType === t.id ? colors.primary + "15" : colors.card, borderColor: proofType === t.id ? colors.primary : colors.border }]}>
              <Ionicons name={t.icon} size={20} color={proofType === t.id ? colors.primary : colors.mutedForeground} />
              <Text style={[{ fontWeight: "600", fontSize: 12, color: proofType === t.id ? colors.primary : colors.foreground }]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
        {proofType === "sms" && (
          <TextInput value={smsText} onChangeText={setSmsText} placeholder="SMS haty ýazyň..."
            placeholderTextColor={colors.mutedForeground} multiline numberOfLines={3}
            style={[s.input, s.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, marginTop: 10 }]}
          />
        )}
        {proofType === "screenshot" && (
          <Pressable onPress={pickImage}
            style={[{ borderWidth: 2, borderStyle: "dashed", borderColor: colors.primary, borderRadius: 12, padding: 16, alignItems: "center", marginTop: 10, gap: 6 }]}>
            <Ionicons name="cloud-upload-outline" size={28} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: "600" }}>{imageUri ? "Surat saýlandy ✓" : "Skrinshot saýlaň"}</Text>
          </Pressable>
        )}
        {imageUri && proofType === "screenshot" && (
          <Image source={{ uri: imageUri }} style={{ height: 120, borderRadius: 10, marginTop: 10, resizeMode: "cover" }} />
        )}
      </View>
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} /> : (
        <Pressable onPress={handleSubmit}
          style={({ pressed }) => [s.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1, marginTop: 20 }]}>
          <Text style={s.primaryBtnText}>Göýbermek</Text>
        </Pressable>
      )}
    </>
  );
}

function SimSection({ colors }: { colors: ReturnType<typeof useColors> }) {
  const { balance, deviceId, deduct } = useBonusPul();
  const [operator, setOperator] = useState<string | null>(null);
  const [simPhone, setSimPhone] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [payPhone, setPayPhone] = useState("");
  const [payMethod, setPayMethod] = useState<"terminal" | "bonus" | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const tmt = selected ? (selected * UZS_RATE).toFixed(1) : "—";

  async function handlePay() {
    if (!simPhone || !selected || !operator || !payMethod) { Alert.alert("Ýalňyşlyk", "Ähli meýdançalary dolduryň!"); return; }
    setLoading(true);
    try {
      const tmtAmount = parseFloat(tmt);
      if (payMethod === "bonus") {
        if (balance < tmtAmount) { Alert.alert("Ýalňyşlyk", `Ýeterlik bonus pul ýok. Balansyňyz: ${balance} BP. Gerekli: ${tmtAmount} BP`); setLoading(false); return; }
        const ok = await deduct(tmtAmount);
        if (!ok) { Alert.alert("Ýalňyşlyk", "Bonus pul aýyrmak başartmady!"); setLoading(false); return; }
      }
      await saveOrder("sim-topup-orders", { operator, simPhone, amount: selected, tmtAmount, payMethod, payPhone: payMethod === "terminal" ? payPhone : undefined, deviceId, status: "pending" });
      await addToHistory({
        type: "sim",
        title: "SIM Kart töleg",
        details: `${UZ_OPERATORS.find(o => o.id === operator)?.name} · ${simPhone} · ${selected} UZS`,
        amount: selected,
        amountLabel: `${tmtAmount} TMT`,
        phone: payMethod === "terminal" ? payPhone : undefined,
        simPhone,
        operator,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(true);
    } catch { Alert.alert("Ýalňyşlyk", "Bilinmeýän ýalňyşlyk"); }
    finally { setLoading(false); }
  }

  if (done) return (
    <View style={{ alignItems: "center", gap: 14, paddingTop: 24 }}>
      <Ionicons name="phone-portrait-outline" size={56} color="#059669" />
      <Text style={[{ fontSize: 20, fontWeight: "800", color: colors.foreground }]}>Üstünlikli!</Text>
      <Text style={[{ color: colors.mutedForeground, textAlign: "center", lineHeight: 20, fontSize: 13 }]}>SIM kart töleg haýyşnamaňyz kabul edildi. Iň gysga wagtda işleniler.</Text>
      <Pressable onPress={() => { setDone(false); setOperator(null); setSelected(null); setShowPayment(false); setPayMethod(null); }}
        style={({ pressed }) => [s.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}>
        <Text style={s.primaryBtnText}>Täzeden</Text>
      </Pressable>
    </View>
  );

  if (!operator) return (
    <>
      <Text style={[s.subTitle, { color: colors.mutedForeground }]}>Özbegistanyň ähli operatorlarynyň SIM kartalaryna pul geçirip bilýärsiňiz.</Text>
      <Text style={[s.fieldLabel, { color: colors.foreground, marginBottom: 12 }]}>Operatoryňyzy saýlaň:</Text>
      <View style={s.operatorGrid}>
        {UZ_OPERATORS.map(op => (
          <Pressable key={op.id} onPress={() => setOperator(op.id)}
            style={({ pressed }) => [s.operatorCard, {
              width: OP_CARD_W,
              backgroundColor: colors.card,
              borderColor: op.color + "60",
              borderWidth: 1.5,
              opacity: pressed ? 0.85 : 1,
            }]}>
            <View style={[s.opIcon, { backgroundColor: op.color }]}>
              <Ionicons name="cellular-outline" size={22} color="#fff" />
            </View>
            <Text style={[{ fontWeight: "800", fontSize: 13, color: colors.foreground, textAlign: "center" }]}>{op.name}</Text>
          </Pressable>
        ))}
      </View>
    </>
  );

  const opColor = UZ_OPERATORS.find(o => o.id === operator)?.color || colors.primary;

  if (!showPayment) return (
    <>
      <Pressable onPress={() => setOperator(null)} style={s.backRow}>
        <Feather name="arrow-left" size={16} color={colors.primary} />
        <Text style={[{ color: colors.primary, fontWeight: "600" }]}>Operator saýlamak</Text>
      </Pressable>
      <View style={[{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, backgroundColor: opColor + "15", borderRadius: 12, marginBottom: 16 }]}>
        <View style={[s.opIcon, { backgroundColor: opColor }]}>
          <Ionicons name="cellular-outline" size={20} color="#fff" />
        </View>
        <Text style={[{ fontWeight: "700", color: colors.foreground }]}>{UZ_OPERATORS.find(o => o.id === operator)?.name}</Text>
      </View>
      <View style={{ marginBottom: 14 }}>
        <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Özbegistan telefon nomeri</Text>
        <TextInput value={simPhone} onChangeText={setSimPhone} placeholder="+998 XX XXX XX XX"
          placeholderTextColor={colors.mutedForeground} keyboardType="phone-pad"
          style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        />
      </View>
      <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Mukdary saýlaň (UZS)</Text>
      <View style={s.amountGrid}>
        {UZS_AMOUNTS.map(a => (
          <Pressable key={a} onPress={() => setSelected(a)}
            style={[s.amountCard, {
              width: OP_CARD_W,
              backgroundColor: selected === a ? colors.primary + "15" : colors.card,
              borderColor: selected === a ? colors.primary : colors.border,
              borderWidth: selected === a ? 2 : 1,
            }]}>
            <Text style={[s.amountVal, { color: selected === a ? colors.primary : colors.foreground, fontSize: 16 }]}>
              {a >= 1000 ? (a / 1000) + "K" : a}
            </Text>
            <Text style={[s.amountLabel, { color: colors.mutedForeground }]}>UZS ≈ {(a * UZS_RATE).toFixed(1)} TMT</Text>
          </Pressable>
        ))}
      </View>
      {selected && (
        <View style={[s.infoBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary, marginTop: 14 }]}>
          <Text style={{ color: colors.foreground }}>Tölenjek mukdar: <Text style={{ color: colors.primary, fontWeight: "800" }}>{tmt} TMT</Text></Text>
        </View>
      )}
      <Pressable onPress={() => { if (!simPhone || !selected) { Alert.alert("Ýalňyşlyk", "Ähli meýdançalary dolduryň!"); return; } setShowPayment(true); }}
        style={({ pressed }) => [s.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1, marginTop: 16 }]}>
        <Text style={s.primaryBtnText}>Töleg usulyny saýlaň</Text>
      </Pressable>
    </>
  );

  return (
    <>
      <Pressable onPress={() => setShowPayment(false)} style={s.backRow}>
        <Feather name="arrow-left" size={16} color={colors.primary} />
        <Text style={[{ color: colors.primary, fontWeight: "600" }]}>Yza</Text>
      </Pressable>
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
        {([{ id: "terminal" as const, icon: "phone-portrait-outline" as const, label: "TMCELL terminal" },
          { id: "bonus" as const, icon: "wallet-outline" as const, label: `Bonus pul (${balance} BP)` }]).map(m => (
          <Pressable key={m.id} onPress={() => setPayMethod(m.id)}
            style={[s.proofCard, { backgroundColor: payMethod === m.id ? colors.primary + "15" : colors.card, borderColor: payMethod === m.id ? colors.primary : colors.border }]}>
            <Ionicons name={m.icon} size={22} color={payMethod === m.id ? colors.primary : colors.mutedForeground} />
            <Text style={[{ fontWeight: "600", fontSize: 12, textAlign: "center", color: payMethod === m.id ? colors.primary : colors.foreground }]}>{m.label}</Text>
          </Pressable>
        ))}
      </View>
      {payMethod === "terminal" && (
        <>
          <View style={[s.infoBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary }]}>
            <Text style={[{ fontWeight: "700", color: colors.foreground, marginBottom: 8 }]}>Şu nomerleriň birine {tmt} TMT geçirmeli:</Text>
            {PAYMENT_PHONES.map((p, i) => <Text key={i} style={{ color: colors.primary, fontWeight: "700", fontSize: 15, marginBottom: 4 }}>{p}</Text>)}
          </View>
          <View style={{ marginTop: 14 }}>
            <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Töleg geçirýän nomeriňiz</Text>
            <TextInput value={payPhone} onChangeText={setPayPhone} placeholder="+993 XX XXXXXX"
              placeholderTextColor={colors.mutedForeground} keyboardType="phone-pad"
              style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            />
          </View>
        </>
      )}
      {payMethod === "bonus" && (
        <View style={[s.infoBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary }]}>
          <Text style={{ color: colors.foreground }}>Bonus puluňyzdan <Text style={{ color: colors.primary, fontWeight: "800" }}>{tmt} BP</Text> aýrylar.</Text>
          {balance < parseFloat(tmt) && <Text style={{ color: "#dc2626", marginTop: 4 }}>Ýeterlik bonus pul ýok!</Text>}
        </View>
      )}
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} /> : (
        <Pressable onPress={handlePay} disabled={!payMethod}
          style={({ pressed }) => [s.primaryBtn, { backgroundColor: colors.primary, opacity: pressed || !payMethod ? 0.7 : 1, marginTop: 16 }]}>
          <Text style={s.primaryBtnText}>Töleg geçirdim</Text>
        </Pressable>
      )}
    </>
  );
}

export default function TmcellScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { balance } = useBonusPul();
  const [tab, setTab] = useState<Tab>("bp-buy");

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "bp-buy", label: "BP Almak" },
    { id: "bp-sell", label: "BP Satmak" },
    { id: "currency", label: "Walýuta" },
    { id: "sim", label: "SIM Kart" },
  ];

  return (
    <View style={[{ flex: 1 }, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: (isWeb ? 0 : insets.top) + 12, backgroundColor: colors.primary }]}>
        <Text style={s.headerTitle}>TMCell & Bonus Pul</Text>
        <View style={s.balanceBadge}>
          <Ionicons name="wallet-outline" size={14} color="#fff" />
          <Text style={s.balanceText}>{balance.toFixed(2)} BP</Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: colors.card, borderBottomColor: colors.border, borderBottomWidth: 1, flexGrow: 0, flexShrink: 0 }}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 8, alignItems: "center" }}
      >
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          {tabs.map(t => (
            <Pressable key={t.id} onPress={() => setTab(t.id)}
              style={[s.tabChip, {
                backgroundColor: tab === t.id ? colors.primary : "transparent",
                borderColor: tab === t.id ? colors.primary : colors.mutedForeground + "50",
              }]}>
              <Text style={{ fontWeight: "700", fontSize: 13, color: tab === t.id ? "#fff" : colors.mutedForeground }}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 110 : 110 }}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {tab === "bp-buy" && <BonusBuySection colors={colors} />}
        {tab === "bp-sell" && <BonusSellSection colors={colors} />}
        {tab === "currency" && <CurrencySection colors={colors} />}
        {tab === "sim" && <SimSection colors={colors} />}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 14, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  balanceBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  balanceText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  tabChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  tabRow: { flexDirection: "row", borderRadius: 12, padding: 4, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  subTitle: { fontSize: 13, lineHeight: 20, marginBottom: 16 },
  amountGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  amountCard: { borderRadius: 14, padding: 14, alignItems: "center", gap: 4 },
  amountVal: { fontSize: 22, fontWeight: "800" },
  amountLabel: { fontSize: 11, textAlign: "center" },
  infoBox: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 8 },
  fieldLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  textarea: { height: 80, textAlignVertical: "top" },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 16 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  proofCard: { flex: 1, borderRadius: 12, borderWidth: 2, padding: 14, alignItems: "center", gap: 6 },
  cryptoChip: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, alignItems: "center" },
  operatorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  operatorCard: { borderRadius: 14, padding: 16, alignItems: "center", gap: 10 },
  opIcon: { width: 50, height: 50, borderRadius: 15, alignItems: "center", justifyContent: "center" },
});
