import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  Alert, ActivityIndicator, Platform, Image, Dimensions,
} from "react-native";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
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
const MERCHANT_CARD = "8600 **** **** 4219";
const TM_BANKS = ["Halkbank", "Türkmenbaşy bank", "Rysgal bank", "Senagat bank", "Daýhanbank", "MILLI bank"];
const TM_CARD_TYPES = ["Visa", "MasterCard", "MIR", "Altyn Asyr"];
const BP_AMOUNTS = [50, 100, 200, 500];
const UZS_AMOUNTS = [10000, 25000, 50000, 100000];
const UZS_RATE = 0.028;

const UZ_OPERATORS = [
  { id: "ucell", name: "Ucell", color: "#e63946" },
  { id: "beeline", name: "Beeline UZ", color: "#f5a623" },
  { id: "mobiuz", name: "Mobiuz", color: "#2563eb" },
  { id: "uztelecom", name: "Uztelecom", color: "#059669" },
];

type Tab = "bonus" | "currency" | "sim";

// ── Merged Bonus Pul Section (buy + sell) ──────────────────────────
function BonusPulSection({ colors }: { colors: ReturnType<typeof useColors> }) {
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const { balance, deviceId } = useBonusPul();

  // buy state
  const [selectedBuy, setSelectedBuy] = useState<number | null>(null);
  const [buyPhone, setBuyPhone] = useState("");
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyDone, setBuyDone] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [buyPayMethod, setBuyPayMethod] = useState<"" | "terminal" | "card">("");
  const [buyCardBank, setBuyCardBank] = useState("");
  const [buyCardType, setBuyCardType] = useState("");
  const [buyCardLast4, setBuyCardLast4] = useState("");

  // sell state
  const [sellAmount, setSellAmount] = useState("");
  const [sellPhone, setSellPhone] = useState("");
  const [sellLoading, setSellLoading] = useState(false);
  const [sellDone, setSellDone] = useState(false);

  async function handleBuy() {
    if (!buyPhone.trim()) { Alert.alert("Ýalňyşlyk", "Telefon belgiňizi giriziň!"); return; }
    if (buyPayMethod === "card" && (!buyCardBank || !buyCardType || buyCardLast4.length < 4)) {
      Alert.alert("Kart maglumatlary", "Bank, kart görnüşi we soňky 4 san girizmeli!"); return;
    }
    setBuyLoading(true);
    try {
      await saveOrder("bonus-orders", { deviceId, amount: selectedBuy, userPhone: buyPhone, payMethod: buyPayMethod || "terminal", cardInfo: buyPayMethod === "card" ? { bank: buyCardBank, type: buyCardType, last4: buyCardLast4 } : null, status: "pending" });
      await addToHistory({ type: "bonus-buy", title: "BP Satyn almak", details: `${selectedBuy} BP · ${buyPhone}`, amount: selectedBuy, amountLabel: `${selectedBuy} BP`, phone: buyPhone });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setBuyDone(true);
    } catch { Alert.alert("Ýalňyşlyk", "Bilinmeýän ýalňyşlyk"); }
    finally { setBuyLoading(false); }
  }

  async function handleSell() {
    const amt = parseFloat(sellAmount);
    if (!amt || amt <= 0) { Alert.alert("Ýalňyşlyk", "Mukdary giriziň!"); return; }
    if (amt > balance) { Alert.alert("Ýalňyşlyk", `Ýeterlik bonus pul ýok. Balansyňyz: ${balance} BP`); return; }
    if (!sellPhone.trim()) { Alert.alert("Ýalňyşlyk", "Nomeriňizi giriziň!"); return; }
    setSellLoading(true);
    try {
      await saveOrder("bonus-sell-orders", { deviceId, amount: amt, userPhone: sellPhone, status: "pending" });
      await addToHistory({ type: "bonus-sell", title: "BP Satmak", details: `${amt} BP · ${sellPhone}`, amount: amt, amountLabel: `${amt} BP`, phone: sellPhone });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSellDone(true);
    } catch { Alert.alert("Ýalňyşlyk", "Bilinmeýän ýalňyşlyk"); }
    finally { setSellLoading(false); }
  }

  const resetBuy = () => { setBuyDone(false); setSelectedBuy(null); setBuyPhone(""); setShowPayment(false); setBuyPayMethod(""); setBuyCardBank(""); setBuyCardType(""); setBuyCardLast4(""); };
  const resetSell = () => { setSellDone(false); setSellAmount(""); setSellPhone(""); };

  return (
    <>
      {/* iOS-style segmented control */}
      <View style={[s.segment, { backgroundColor: colors.muted }]}>
        {([
          { id: "buy" as const, icon: "arrow-down-circle-outline" as const, label: "BP Almak" },
          { id: "sell" as const, icon: "arrow-up-circle-outline" as const, label: "BP Satmak" },
        ]).map(t => (
          <Pressable
            key={t.id}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMode(t.id); }}
            style={[s.segBtn, { backgroundColor: mode === t.id ? colors.card : "transparent", shadowColor: mode === t.id ? "#000" : "transparent", shadowOpacity: mode === t.id ? 0.1 : 0, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: mode === t.id ? 2 : 0 }]}
          >
            <Ionicons name={t.icon} size={15} color={mode === t.id ? colors.primary : colors.mutedForeground} />
            <Text style={[s.segBtnText, { color: mode === t.id ? colors.foreground : colors.mutedForeground }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {mode === "buy" ? (
        buyDone ? (
          <View style={s.successBox}>
            <View style={[s.successIcon, { backgroundColor: "#d1fae5" }]}>
              <Ionicons name="checkmark-circle" size={40} color="#059669" />
            </View>
            <Text style={[s.successTitle, { color: colors.foreground }]}>Üstünlikli!</Text>
            <Text style={[s.successDesc, { color: colors.mutedForeground }]}>Bonus pul haýyşnamaňyz kabul edildi. Iň gysga wagtda hasabyňyza goşular.</Text>
            <Pressable onPress={resetBuy} style={[s.primaryBtn, { backgroundColor: colors.primary }]}>
              <Text style={s.primaryBtnText}>Täzeden</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Info pill */}
            <View style={[s.ratePill, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
              <MaterialCommunityIcons name="cash-multiple" size={16} color={colors.primary} />
              <Text style={[s.rateText, { color: colors.primary }]}>1 BP = 1 TMT</Text>
            </View>
            <Text style={[s.subTitle, { color: colors.mutedForeground }]}>
              Mukdary saýlap, görkezilen nomerlere pul geçiriň.
            </Text>
            {!showPayment ? (
              <>
                <View style={s.amountGrid}>
                  {BP_AMOUNTS.map(a => (
                    <Pressable key={a} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedBuy(a); }}
                      style={[s.amountCard, {
                        width: OP_CARD_W,
                        backgroundColor: selectedBuy === a ? colors.primary : colors.card,
                        borderColor: selectedBuy === a ? colors.primary : colors.border,
                        borderWidth: selectedBuy === a ? 0 : 1,
                      }]}>
                      <View style={[s.amountIconBg, { backgroundColor: selectedBuy === a ? "rgba(255,255,255,0.2)" : colors.primary + "15" }]}>
                        <MaterialCommunityIcons name="cash" size={18} color={selectedBuy === a ? "#fff" : colors.primary} />
                      </View>
                      <Text style={[s.amountVal, { color: selectedBuy === a ? "#fff" : colors.foreground }]}>{a}</Text>
                      <Text style={[s.amountLabel, { color: selectedBuy === a ? "rgba(255,255,255,0.75)" : colors.mutedForeground }]}>BP = {a} TMT</Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable onPress={() => { if (!selectedBuy) { Alert.alert("Saýlaň", "Mukdary saýlaň!"); return; } setShowPayment(true); }}
                  style={({ pressed }) => [s.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1, marginTop: 20 }]}>
                  <Ionicons name="arrow-forward-circle-outline" size={18} color="#fff" />
                  <Text style={s.primaryBtnText}>Dowam etmek</Text>
                </Pressable>
              </>
            ) : buyPayMethod === "" ? (
              /* ── Payment method selector ── */
              <>
                <Text style={[s.fieldLabel, { color: colors.mutedForeground, marginBottom: 12, marginTop: 4 }]}>
                  Töleg usulyny saýlaň
                </Text>
                {([
                  { id: "terminal" as const, label: "TMCELL Terminal", desc: "Görkezilen nomerlere pul geçiriň", icon: "phone-portrait-outline" as const, color: colors.primary },
                  { id: "card" as const, label: "Kartdan töle", desc: "Bank karty arkaly töleg", icon: "card-outline" as const, color: "#6366f1" },
                ]).map((pm) => (
                  <Pressable
                    key={pm.id}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setBuyPayMethod(pm.id); }}
                    style={[s.payMethodCard, { backgroundColor: colors.card, borderColor: pm.color + "60" }]}
                  >
                    <View style={[s.payMethodIcon, { backgroundColor: pm.color + "20" }]}>
                      <Ionicons name={pm.icon} size={22} color={pm.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.payMethodLabel, { color: colors.foreground }]}>{pm.label}</Text>
                      <Text style={[s.payMethodDesc, { color: colors.mutedForeground }]}>{pm.desc}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={pm.color} />
                  </Pressable>
                ))}
                <Pressable onPress={() => setShowPayment(false)} style={s.backRow}>
                  <Feather name="arrow-left" size={16} color={colors.mutedForeground} />
                  <Text style={[{ color: colors.mutedForeground, fontWeight: "600" }]}>Yza</Text>
                </Pressable>
              </>
            ) : buyPayMethod === "terminal" ? (
              /* ── Terminal flow ── */
              <>
                <View style={[s.iosCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[s.iosCardIcon, { backgroundColor: colors.primary + "15" }]}>
                    <Ionicons name="call-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.iosCardTitle, { color: colors.foreground }]}>Şu nomerleriň birine {selectedBuy} TMT geçiriň</Text>
                    {PAYMENT_PHONES.map((p, i) => (
                      <Text key={i} style={[s.phoneNum, { color: colors.primary }]}>{p}</Text>
                    ))}
                  </View>
                </View>
                <View style={{ marginTop: 14 }}>
                  <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Siziň nomeriňiz (tassyklama üçin)</Text>
                  <TextInput value={buyPhone} onChangeText={setBuyPhone} placeholder="+993 XX XXXXXX"
                    placeholderTextColor={colors.mutedForeground} keyboardType="phone-pad"
                    style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  />
                </View>
                {buyLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} /> : (
                  <Pressable onPress={handleBuy}
                    style={({ pressed }) => [s.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1, marginTop: 16 }]}>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={s.primaryBtnText}>Töleg geçirdim</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => setBuyPayMethod("")} style={s.backRow}>
                  <Feather name="arrow-left" size={16} color={colors.mutedForeground} />
                  <Text style={[{ color: colors.mutedForeground, fontWeight: "600" }]}>Yza</Text>
                </Pressable>
              </>
            ) : (
              /* ── Card payment flow ── */
              <>
                <View style={[s.merchantCardBox, { backgroundColor: "#6366f1" }]}>
                  <Text style={s.merchantCardLabel2}>Töleg kart belgisi</Text>
                  <Text style={s.merchantCardNum2}>{MERCHANT_CARD}</Text>
                  <Text style={s.merchantCardBank2}>Halkbank · Türkmenistan</Text>
                  <View style={s.merchantAmtRow}>
                    <Ionicons name="cash-outline" size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={s.merchantAmtText}>Geçirilmeli: {selectedBuy} TMT</Text>
                  </View>
                </View>

                <Text style={[s.fieldLabel, { color: colors.mutedForeground, marginTop: 16, marginBottom: 8 }]}>Siziň bankyňyz</Text>
                <View style={s.bankChipRow}>
                  {TM_BANKS.map((b) => (
                    <Pressable
                      key={b}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setBuyCardBank(b); }}
                      style={[s.bankChip, {
                        backgroundColor: buyCardBank === b ? "#6366f1" : colors.muted,
                        borderColor: buyCardBank === b ? "#6366f1" : colors.border,
                      }]}
                    >
                      <Text style={[s.bankChipText, { color: buyCardBank === b ? "#fff" : colors.foreground }]}>{b}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={[s.fieldLabel, { color: colors.mutedForeground, marginTop: 14, marginBottom: 8 }]}>Kart görnüşi</Text>
                <View style={s.bankChipRow}>
                  {TM_CARD_TYPES.map((ct) => (
                    <Pressable
                      key={ct}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setBuyCardType(ct); }}
                      style={[s.bankChip, {
                        backgroundColor: buyCardType === ct ? "#6366f1" : colors.muted,
                        borderColor: buyCardType === ct ? "#6366f1" : colors.border,
                      }]}
                    >
                      <Text style={[s.bankChipText, { color: buyCardType === ct ? "#fff" : colors.foreground }]}>{ct}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={[s.fieldLabel, { color: colors.mutedForeground, marginTop: 14, marginBottom: 8 }]}>Kartyňyzyň soňky 4 sany</Text>
                <TextInput
                  value={buyCardLast4}
                  onChangeText={(t) => setBuyCardLast4(t.replace(/\D/g, "").slice(0, 4))}
                  placeholder="XXXX"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="number-pad"
                  maxLength={4}
                  style={[s.input, { backgroundColor: colors.card, borderColor: buyCardLast4.length === 4 ? "#6366f1" : colors.border, color: colors.foreground, fontSize: 22, fontWeight: "800", letterSpacing: 8, textAlign: "center" }]}
                />

                <Text style={[s.fieldLabel, { color: colors.mutedForeground, marginTop: 14 }]}>Telefon nomeriňiz (tassyklama üçin)</Text>
                <TextInput value={buyPhone} onChangeText={setBuyPhone} placeholder="+993 XX XXXXXX"
                  placeholderTextColor={colors.mutedForeground} keyboardType="phone-pad"
                  style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                />

                {buyLoading ? <ActivityIndicator color="#6366f1" style={{ marginTop: 20 }} /> : (
                  <Pressable onPress={handleBuy}
                    style={({ pressed }) => [s.primaryBtn, { backgroundColor: "#6366f1", opacity: pressed ? 0.85 : 1, marginTop: 16 }]}>
                    <Ionicons name="card-outline" size={18} color="#fff" />
                    <Text style={s.primaryBtnText}>Töleg geçirdim</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => setBuyPayMethod("")} style={s.backRow}>
                  <Feather name="arrow-left" size={16} color={colors.mutedForeground} />
                  <Text style={[{ color: colors.mutedForeground, fontWeight: "600" }]}>Yza</Text>
                </Pressable>
              </>
            )}
          </>
        )
      ) : (
        sellDone ? (
          <View style={s.successBox}>
            <View style={[s.successIcon, { backgroundColor: "#dbeafe" }]}>
              <Ionicons name="checkmark-circle" size={40} color="#2563eb" />
            </View>
            <Text style={[s.successTitle, { color: colors.foreground }]}>Haýyşnama kabul edildi!</Text>
            <Text style={[s.successDesc, { color: colors.mutedForeground }]}>Bonus pul satmak haýyşnamaňyz iň gysga wagtda işleniler.</Text>
            <Pressable onPress={resetSell} style={[s.primaryBtn, { backgroundColor: colors.primary }]}>
              <Text style={s.primaryBtnText}>Täzeden</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Balance card */}
            <View style={[s.balanceCard, { backgroundColor: colors.primary }]}>
              <View style={s.balanceCardRow}>
                <View style={[s.balanceCardIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                  <Ionicons name="wallet" size={22} color="#fff" />
                </View>
                <View>
                  <Text style={s.balanceCardLabel}>Häzirki balans</Text>
                  <Text style={s.balanceCardVal}>{balance} BP</Text>
                </View>
              </View>
            </View>
            <View style={{ marginTop: 16 }}>
              <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Satmak üçin mukdar (BP)</Text>
              <TextInput value={sellAmount} onChangeText={setSellAmount} placeholder="Meseläň: 100"
                placeholderTextColor={colors.mutedForeground} keyboardType="decimal-pad"
                style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>
            <View style={{ marginTop: 14 }}>
              <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>TMT alynjak nomer</Text>
              <TextInput value={sellPhone} onChangeText={setSellPhone} placeholder="+993 XX XXXXXX"
                placeholderTextColor={colors.mutedForeground} keyboardType="phone-pad"
                style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>
            {sellLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} /> : (
              <Pressable onPress={handleSell}
                style={({ pressed }) => [s.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1, marginTop: 20 }]}>
                <Ionicons name="paper-plane-outline" size={18} color="#fff" />
                <Text style={s.primaryBtnText}>Haýyşnama ibermek</Text>
              </Pressable>
            )}
          </>
        )
      )}
    </>
  );
}

// ── Currency / Walýuta Section ─────────────────────────────────────
const CRYPTOS = [
  { id: "payeer", label: "Payeer", icon: "P", color: "#1a73e8", bg: "#e8f0fe" },
  { id: "perfect", label: "Perfect Money", icon: "PM", color: "#e8a020", bg: "#fef3cd" },
  { id: "webmoney", label: "WebMoney", icon: "WM", color: "#2e7d32", bg: "#e8f5e9" },
];

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
      const screenshotUrl = imageUri && proofType === "screenshot" ? await uploadImage(imageUri, "proof.jpg") : null;
      await saveOrder("orders", {
        type: mode === "buy" ? "pay-buy" : "pay-sell", crypto, currency,
        amount: parseFloat(amount), totalPrice: calcTotal(), phone, walletId,
        secretCode, proofType, smsText, screenshotUrl,
      });
      await addToHistory({
        type: mode === "buy" ? "currency-buy" : "currency-sell",
        title: mode === "buy" ? "Walýuta almak" : "Walýuta satmak",
        details: `${amount} ${currency?.toUpperCase()} · ${crypto === "payeer" ? "Payeer" : crypto === "perfect" ? "Perfect Money" : "WebMoney"} · ${phone}`,
        amount: parseFloat(amount) || 0, amountLabel: `${calcTotal().toFixed(2)} TMT`,
        phone, walletId, crypto, currency,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(true);
    } catch { Alert.alert("Ýalňyşlyk", "Bilinmeýän ýalňyşlyk"); }
    finally { setLoading(false); }
  }

  const reset = () => { setDone(false); setAmount(""); setWalletId(""); setPhone(""); setSmsText(""); setImageUri(null); setSecretCode(""); };

  if (done) return (
    <View style={s.successBox}>
      <View style={[s.successIcon, { backgroundColor: "#ede9fe" }]}>
        <MaterialCommunityIcons name="check-decagram" size={40} color="#7c3aed" />
      </View>
      <Text style={[s.successTitle, { color: colors.foreground }]}>Üstünlikli!</Text>
      <Text style={[s.successDesc, { color: colors.mutedForeground }]}>Iň tiz wagtda Ýeňil siz bilen baglanar.</Text>
      <Pressable onPress={reset} style={[s.primaryBtn, { backgroundColor: colors.primary }]}>
        <Text style={s.primaryBtnText}>Täzeden</Text>
      </Pressable>
    </View>
  );

  const selectedCrypto = CRYPTOS.find(c => c.id === crypto)!;

  return (
    <>
      {/* Mode toggle */}
      <View style={[s.segment, { backgroundColor: colors.muted }]}>
        {([
          { id: "buy" as const, icon: "arrow-down-circle-outline" as const, label: "Satyn almak" },
          { id: "sell" as const, icon: "arrow-up-circle-outline" as const, label: "Satmak" },
        ]).map(t => (
          <Pressable key={t.id} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMode(t.id); }}
            style={[s.segBtn, { backgroundColor: mode === t.id ? colors.card : "transparent", shadowColor: mode === t.id ? "#000" : "transparent", shadowOpacity: mode === t.id ? 0.1 : 0, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: mode === t.id ? 2 : 0 }]}>
            <Ionicons name={t.icon} size={15} color={mode === t.id ? colors.primary : colors.mutedForeground} />
            <Text style={[s.segBtnText, { color: mode === t.id ? colors.foreground : colors.mutedForeground }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Rate pill */}
      <View style={[s.ratePill, { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }]}>
        <MaterialCommunityIcons name="trending-up" size={15} color="#059669" />
        <Text style={[s.rateText, { color: "#059669" }]}>1 USD = {mode === "buy" ? "29" : "19"} TMT</Text>
      </View>

      {/* Payment method — iOS card grid */}
      <Text style={[s.fieldLabel, { color: colors.mutedForeground, marginBottom: 10 }]}>Töleg görnüşi</Text>
      <View style={s.cryptoGrid}>
        {CRYPTOS.map(c => (
          <Pressable key={c.id} onPress={() => { setCrypto(c.id); setWalletId(""); }}
            style={[s.cryptoCard, {
              backgroundColor: crypto === c.id ? c.color : colors.card,
              borderColor: crypto === c.id ? c.color : colors.border,
            }]}>
            <View style={[s.cryptoIconBg, { backgroundColor: crypto === c.id ? "rgba(255,255,255,0.25)" : c.bg }]}>
              <Text style={[s.cryptoIconText, { color: crypto === c.id ? "#fff" : c.color }]}>{c.icon}</Text>
            </View>
            <Text style={[s.cryptoLabel, { color: crypto === c.id ? "#fff" : colors.foreground }]}>{c.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Payeer currency selector */}
      {crypto === "payeer" && (
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          {([{ id: "usd", flag: "$", name: "USD" }, { id: "rub", flag: "₽", name: "RUB" }]).map(cur => (
            <Pressable key={cur.id} onPress={() => setCurrency(cur.id)}
              style={[s.curChip, { flex: 1, backgroundColor: currency === cur.id ? colors.primary + "15" : colors.card, borderColor: currency === cur.id ? colors.primary : colors.border }]}>
              <Text style={[s.curFlag, { color: currency === cur.id ? colors.primary : colors.mutedForeground }]}>{cur.flag}</Text>
              <Text style={[s.curName, { color: currency === cur.id ? colors.primary : colors.foreground }]}>{cur.name}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Amount */}
      <View style={{ marginBottom: 14 }}>
        <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Mukdar</Text>
        <TextInput value={amount} onChangeText={setAmount} placeholder="0.00"
          placeholderTextColor={colors.mutedForeground} keyboardType="decimal-pad"
          style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        />
      </View>

      {/* Wallet */}
      <View style={{ marginBottom: 14 }}>
        <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Wallet ID</Text>
        <TextInput value={walletId} onChangeText={setWalletId}
          placeholder={crypto === "payeer" ? "P1234567890" : crypto === "perfect" ? "U1234567890" : "Z123456789012"}
          placeholderTextColor={colors.mutedForeground} autoCapitalize="characters"
          style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        />
      </View>

      {/* Phone */}
      <View style={{ marginBottom: 14 }}>
        <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Telefon nomeriňiz</Text>
        <TextInput value={phone} onChangeText={setPhone} placeholder="+993 XX XXXXXX"
          placeholderTextColor={colors.mutedForeground} keyboardType="phone-pad"
          style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        />
      </View>

      {/* Secret (sell only) */}
      {mode === "sell" && (
        <View style={{ marginBottom: 14 }}>
          <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Gizlin kod (biz ibereris)</Text>
          <TextInput value={secretCode} onChangeText={setSecretCode} placeholder="Gizlin kod"
            placeholderTextColor={colors.mutedForeground}
            style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          />
        </View>
      )}

      {/* Total */}
      {parseFloat(amount) > 0 && (
        <View style={[s.totalBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "40" }]}>
          <Text style={[s.totalLabel, { color: colors.mutedForeground }]}>Jemi</Text>
          <Text style={[s.totalVal, { color: colors.primary }]}>{calcTotal().toFixed(2)} TMT</Text>
        </View>
      )}

      {/* Payment destination */}
      {mode === "buy" && (
        <View style={[s.iosCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 14 }]}>
          <View style={[s.iosCardIcon, { backgroundColor: colors.primary + "15" }]}>
            <Ionicons name="call-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.iosCardTitle, { color: colors.foreground }]}>Şu nomerlere pul geçiriň</Text>
            {PAYMENT_PHONES.map((p, i) => <Text key={i} style={[s.phoneNum, { color: colors.primary }]}>{p}</Text>)}
          </View>
        </View>
      )}
      {mode === "sell" && (
        <View style={[s.iosCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 14 }]}>
          <View style={[s.iosCardIcon, { backgroundColor: "#e8f0fe" }]}>
            <MaterialCommunityIcons name="wallet-outline" size={20} color="#1a73e8" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.iosCardTitle, { color: colors.foreground }]}>Siz şu Payeer ID-a pul ibermeli</Text>
            <Text style={[s.phoneNum, { color: "#1a73e8" }]}>P1115509057</Text>
          </View>
        </View>
      )}

      {/* Proof */}
      <Text style={[s.fieldLabel, { color: colors.mutedForeground, marginBottom: 10 }]}>Tölegi tassyklaň</Text>
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
        {([
          { id: "screenshot" as const, icon: "camera-outline" as const, label: "Skrinshot" },
          { id: "sms" as const, icon: "chatbubble-outline" as const, label: "SMS" },
        ]).map(t => (
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
          style={[s.input, s.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, marginBottom: 14 }]}
        />
      )}
      {proofType === "screenshot" && (
        <Pressable onPress={pickImage}
          style={[{ borderWidth: 2, borderStyle: "dashed", borderColor: colors.primary, borderRadius: 14, padding: 18, alignItems: "center", marginBottom: 14, gap: 6 }]}>
          <Ionicons name="cloud-upload-outline" size={28} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: "600" }}>{imageUri ? "Surat saýlandy ✓" : "Skrinshot saýlaň"}</Text>
        </Pressable>
      )}
      {imageUri && proofType === "screenshot" && (
        <Image source={{ uri: imageUri }} style={{ height: 120, borderRadius: 12, marginBottom: 14, resizeMode: "cover" }} />
      )}

      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} /> : (
        <Pressable onPress={handleSubmit}
          style={({ pressed }) => [s.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}>
          <Ionicons name="paper-plane-outline" size={18} color="#fff" />
          <Text style={s.primaryBtnText}>Göýbermek</Text>
        </Pressable>
      )}
    </>
  );
}

// ── SIM Kart Section ───────────────────────────────────────────────
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
      await addToHistory({ type: "sim", title: "SIM Kart töleg", details: `${UZ_OPERATORS.find(o => o.id === operator)?.name} · ${simPhone} · ${selected} UZS`, amount: selected, amountLabel: `${tmtAmount} TMT`, phone: payMethod === "terminal" ? payPhone : undefined, simPhone, operator });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(true);
    } catch { Alert.alert("Ýalňyşlyk", "Bilinmeýän ýalňyşlyk"); }
    finally { setLoading(false); }
  }

  if (done) return (
    <View style={s.successBox}>
      <View style={[s.successIcon, { backgroundColor: "#d1fae5" }]}>
        <Ionicons name="phone-portrait" size={40} color="#059669" />
      </View>
      <Text style={[s.successTitle, { color: colors.foreground }]}>Üstünlikli!</Text>
      <Text style={[s.successDesc, { color: colors.mutedForeground }]}>SIM kart töleg haýyşnamaňyz kabul edildi. Iň gysga wagtda işleniler.</Text>
      <Pressable onPress={() => { setDone(false); setOperator(null); setSelected(null); setShowPayment(false); setPayMethod(null); }}
        style={[s.primaryBtn, { backgroundColor: colors.primary }]}>
        <Text style={s.primaryBtnText}>Täzeden</Text>
      </Pressable>
    </View>
  );

  if (!operator) return (
    <>
      <View style={[s.ratePill, { backgroundColor: "#f0f9ff", borderColor: "#bae6fd" }]}>
        <Ionicons name="cellular-outline" size={15} color="#0284c7" />
        <Text style={[s.rateText, { color: "#0284c7" }]}>Özbegistanyň ähli operatorlary</Text>
      </View>
      <Text style={[s.subTitle, { color: colors.mutedForeground }]}>Operatoryňyzy saýlaň:</Text>
      <View style={s.operatorGrid}>
        {UZ_OPERATORS.map(op => (
          <Pressable key={op.id} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setOperator(op.id); }}
            style={({ pressed }) => [s.operatorCard, { width: OP_CARD_W, backgroundColor: colors.card, borderColor: op.color + "60", borderWidth: 1.5, opacity: pressed ? 0.85 : 1 }]}>
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
      <View style={[{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: opColor + "15", borderRadius: 14, marginBottom: 16, borderWidth: 1, borderColor: opColor + "40" }]}>
        <View style={[s.opIcon, { backgroundColor: opColor }]}>
          <Ionicons name="cellular-outline" size={20} color="#fff" />
        </View>
        <Text style={[{ fontWeight: "700", fontSize: 15, color: colors.foreground }]}>{UZ_OPERATORS.find(o => o.id === operator)?.name}</Text>
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
              backgroundColor: selected === a ? opColor : colors.card,
              borderColor: selected === a ? opColor : colors.border,
              borderWidth: selected === a ? 0 : 1,
            }]}>
            <View style={[s.amountIconBg, { backgroundColor: selected === a ? "rgba(255,255,255,0.2)" : opColor + "15" }]}>
              <Ionicons name="phone-portrait-outline" size={16} color={selected === a ? "#fff" : opColor} />
            </View>
            <Text style={[s.amountVal, { color: selected === a ? "#fff" : colors.foreground, fontSize: 16 }]}>
              {a >= 1000 ? (a / 1000) + "K" : a}
            </Text>
            <Text style={[s.amountLabel, { color: selected === a ? "rgba(255,255,255,0.75)" : colors.mutedForeground }]}>UZS ≈ {(a * UZS_RATE).toFixed(1)} TMT</Text>
          </Pressable>
        ))}
      </View>
      {selected && (
        <View style={[s.totalBox, { backgroundColor: opColor + "10", borderColor: opColor + "40", marginTop: 14 }]}>
          <Text style={[s.totalLabel, { color: colors.mutedForeground }]}>Tölenjek mukdar</Text>
          <Text style={[s.totalVal, { color: opColor }]}>{tmt} TMT</Text>
        </View>
      )}
      <Pressable onPress={() => { if (!simPhone || !selected) { Alert.alert("Ýalňyşlyk", "Ähli meýdançalary dolduryň!"); return; } setShowPayment(true); }}
        style={({ pressed }) => [s.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1, marginTop: 16 }]}>
        <Ionicons name="card-outline" size={18} color="#fff" />
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
        {([
          { id: "terminal" as const, icon: "phone-portrait-outline" as const, label: "TMCELL terminal" },
          { id: "bonus" as const, icon: "wallet-outline" as const, label: `Bonus pul\n(${balance} BP)` },
        ]).map(m => (
          <Pressable key={m.id} onPress={() => setPayMethod(m.id)}
            style={[s.proofCard, { backgroundColor: payMethod === m.id ? colors.primary + "15" : colors.card, borderColor: payMethod === m.id ? colors.primary : colors.border }]}>
            <Ionicons name={m.icon} size={24} color={payMethod === m.id ? colors.primary : colors.mutedForeground} />
            <Text style={[{ fontWeight: "600", fontSize: 12, textAlign: "center", color: payMethod === m.id ? colors.primary : colors.foreground }]}>{m.label}</Text>
          </Pressable>
        ))}
      </View>
      {payMethod === "terminal" && (
        <>
          <View style={[s.iosCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 14 }]}>
            <View style={[s.iosCardIcon, { backgroundColor: colors.primary + "15" }]}>
              <Ionicons name="call-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.iosCardTitle, { color: colors.foreground }]}>Şu nomerlere {tmt} TMT geçiriň</Text>
              {PAYMENT_PHONES.map((p, i) => <Text key={i} style={[s.phoneNum, { color: colors.primary }]}>{p}</Text>)}
            </View>
          </View>
          <View style={{ marginBottom: 14 }}>
            <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Töleg geçirýän nomeriňiz</Text>
            <TextInput value={payPhone} onChangeText={setPayPhone} placeholder="+993 XX XXXXXX"
              placeholderTextColor={colors.mutedForeground} keyboardType="phone-pad"
              style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            />
          </View>
        </>
      )}
      {payMethod === "bonus" && (
        <View style={[s.iosCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 14 }]}>
          <View style={[s.iosCardIcon, { backgroundColor: "#fef3c7" }]}>
            <Ionicons name="wallet-outline" size={20} color="#d97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.iosCardTitle, { color: colors.foreground }]}>Bonus puluňyzdan <Text style={{ color: colors.primary, fontWeight: "800" }}>{tmt} BP</Text> aýrylar.</Text>
            {balance < parseFloat(tmt) && <Text style={{ color: "#dc2626", marginTop: 4, fontSize: 12 }}>Ýeterlik bonus pul ýok!</Text>}
          </View>
        </View>
      )}
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} /> : (
        <Pressable onPress={handlePay} disabled={!payMethod}
          style={({ pressed }) => [s.primaryBtn, { backgroundColor: colors.primary, opacity: pressed || !payMethod ? 0.7 : 1, marginTop: 4 }]}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
          <Text style={s.primaryBtnText}>Töleg geçirdim</Text>
        </Pressable>
      )}
    </>
  );
}

// ── Tab icon components ────────────────────────────────────────────
const TAB_DEFS: Array<{ id: Tab; label: string; activeIcon: string; inactiveIcon: string; color: string }> = [
  { id: "bonus", label: "Bonus Pul", activeIcon: "wallet", inactiveIcon: "wallet-outline", color: "#059669" },
  { id: "currency", label: "Walýuta", activeIcon: "swap-horizontal", inactiveIcon: "swap-horizontal-outline", color: "#2563eb" },
  { id: "sim", label: "SIM Kart", activeIcon: "phone-portrait", inactiveIcon: "phone-portrait-outline", color: "#7c3aed" },
];

// ── Screen ─────────────────────────────────────────────────────────
export default function YenilPayScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { balance } = useBonusPul();
  const [tab, setTab] = useState<Tab>("bonus");

  const activeTabDef = TAB_DEFS.find(t => t.id === tab)!;

  return (
    <View style={[{ flex: 1 }, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={[s.header, { paddingTop: (isWeb ? 0 : insets.top) + 14, backgroundColor: colors.primary }]}>
        <View style={{ gap: 2 }}>
          <Text style={s.headerTitle}>Ýeňil Pay</Text>
          <Text style={s.headerSub}>Maliýe hyzmatlar</Text>
        </View>
        <View style={s.balanceBadge}>
          <Ionicons name="wallet-outline" size={14} color="#fff" />
          <Text style={s.balanceText}>{balance.toFixed(2)} BP</Text>
        </View>
      </View>

      {/* ── iOS-style horizontal tab bar ── */}
      <View style={[s.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {TAB_DEFS.map(t => {
          const isActive = tab === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTab(t.id); }}
              style={[s.tabItem, isActive && { borderBottomColor: t.color, borderBottomWidth: 2.5 }]}
            >
              <View style={[s.tabIconWrap, { backgroundColor: isActive ? t.color + "15" : "transparent" }]}>
                <Ionicons
                  name={(isActive ? t.activeIcon : t.inactiveIcon) as any}
                  size={20}
                  color={isActive ? t.color : colors.mutedForeground}
                />
              </View>
              <Text style={[s.tabLabel, { color: isActive ? t.color : colors.mutedForeground }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Section header ── */}
      <View style={[s.sectionHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={[s.sectionIconBg, { backgroundColor: activeTabDef.color + "15" }]}>
          <Ionicons name={activeTabDef.activeIcon as any} size={18} color={activeTabDef.color} />
        </View>
        <Text style={[s.sectionTitle, { color: colors.foreground }]}>{activeTabDef.label}</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {tab === "bonus" && <BonusPulSection colors={colors} />}
        {tab === "currency" && <CurrencySection colors={colors} />}
        {tab === "sim" && <SimSection colors={colors} />}
      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Header
  header: {
    paddingHorizontal: 18, paddingBottom: 16,
    flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between",
  },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  headerSub: { color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 1 },
  balanceBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  balanceText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1, alignItems: "center", paddingVertical: 10, gap: 4,
    borderBottomWidth: 2.5, borderBottomColor: "transparent",
  },
  tabIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  tabLabel: { fontSize: 10, fontWeight: "700" },

  // Section header
  sectionHeader: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sectionIconBg: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 15, fontWeight: "800" },

  // iOS segment control
  segment: {
    flexDirection: "row", borderRadius: 12, padding: 4, marginBottom: 16,
  },
  segBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 9, borderRadius: 9,
  },
  segBtnText: { fontSize: 13, fontWeight: "700" },

  // Rate pill
  ratePill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start",
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    marginBottom: 14,
  },
  rateText: { fontSize: 12, fontWeight: "700" },

  // subTitle
  subTitle: { fontSize: 13, lineHeight: 20, marginBottom: 16 },

  // Amount cards
  amountGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 4 },
  amountCard: { borderRadius: 16, padding: 14, alignItems: "center", gap: 6 },
  amountIconBg: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  amountVal: { fontSize: 22, fontWeight: "800" },
  amountLabel: { fontSize: 11, textAlign: "center" },

  // iOS card (info box)
  iosCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    borderWidth: 1, borderRadius: 14, padding: 14,
  },
  iosCardIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  iosCardTitle: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  phoneNum: { fontSize: 14, fontWeight: "700", marginBottom: 2 },

  // Total box
  totalBox: {
    borderWidth: 1, borderRadius: 14, padding: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 8,
  },
  totalLabel: { fontSize: 13, fontWeight: "600" },
  totalVal: { fontSize: 22, fontWeight: "800" },

  // Inputs
  fieldLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  textarea: { height: 80, textAlignVertical: "top" },

  // Primary btn
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 14, paddingVertical: 16,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  // Back row
  backRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },

  // Payment method selector cards
  payMethodCard: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 18, borderWidth: 1.5, padding: 16, marginBottom: 12 },
  payMethodIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  payMethodLabel: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  payMethodDesc: { fontSize: 12 },

  // Merchant card (card payment)
  merchantCardBox: { borderRadius: 18, padding: 18, marginBottom: 14 },
  merchantCardLabel2: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "700", marginBottom: 6 },
  merchantCardNum2: { color: "#fff", fontSize: 20, fontWeight: "800", letterSpacing: 3, marginBottom: 6 },
  merchantCardBank2: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginBottom: 10 },
  merchantAmtRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  merchantAmtText: { color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: "700" },

  // Bank chips
  bankChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  bankChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1 },
  bankChipText: { fontSize: 12, fontWeight: "700" },

  // Proof card
  proofCard: { flex: 1, borderRadius: 14, borderWidth: 2, padding: 14, alignItems: "center", gap: 6 },

  // Crypto grid
  cryptoGrid: { flexDirection: "row", gap: 8, marginBottom: 14 },
  cryptoCard: { flex: 1, borderRadius: 14, borderWidth: 1.5, padding: 12, alignItems: "center", gap: 8 },
  cryptoIconBg: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cryptoIconText: { fontSize: 13, fontWeight: "900" },
  cryptoLabel: { fontSize: 10, fontWeight: "700", textAlign: "center" },

  // Currency chip
  curChip: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1.5, borderRadius: 12, paddingVertical: 11 },
  curFlag: { fontSize: 16, fontWeight: "700" },
  curName: { fontSize: 13, fontWeight: "700" },

  // Operator grid
  operatorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  operatorCard: { borderRadius: 16, padding: 16, alignItems: "center", gap: 10 },
  opIcon: { width: 50, height: 50, borderRadius: 15, alignItems: "center", justifyContent: "center" },

  // Balance card
  balanceCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  balanceCardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  balanceCardIcon: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  balanceCardLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "600" },
  balanceCardVal: { color: "#fff", fontSize: 24, fontWeight: "800" },

  // Success
  successBox: { alignItems: "center", gap: 14, paddingTop: 24, paddingBottom: 24 },
  successIcon: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 20, fontWeight: "800" },
  successDesc: { fontSize: 13, textAlign: "center", lineHeight: 20 },
});
