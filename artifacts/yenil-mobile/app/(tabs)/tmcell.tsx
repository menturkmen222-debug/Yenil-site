import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  Alert, ActivityIndicator, Platform, Image, Dimensions,
} from "react-native";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";
import { saveOrder, transferBP, getBPTransferHistory, createTMCellCashout, deductBalanceAtomic, type BPTransfer } from "@/lib/firebase";
import { COMMISSION_RATES } from "@/lib/payments";
import { PessimisticButton } from "@/components/PessimisticButton";
import BPCheckoutModal from "@/components/BPCheckoutModal";
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

// ── Merged Bonus Pul Section (buy + sell + transfer) ───────────────
function BonusPulSection({ colors }: { colors: ReturnType<typeof useColors> }) {
  const [mode, setMode] = useState<"buy" | "sell" | "transfer">("buy");
  const { balance, deviceId, sendBP } = useBonusPul();

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
      await saveOrder("bonus-orders", { deviceId, amount: selectedBuy ?? 0, userPhone: buyPhone, payMethod: buyPayMethod || "terminal", cardInfo: buyPayMethod === "card" ? { bank: buyCardBank, type: buyCardType, last4: buyCardLast4 } : null, status: "pending" });
      await addToHistory({ type: "bonus-buy", title: "BP Satyn almak", details: `${selectedBuy} BP · ${buyPhone}`, amount: selectedBuy ?? 0, amountLabel: `${selectedBuy} BP`, phone: buyPhone });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setBuyDone(true);
    } catch { Alert.alert("Ýalňyşlyk", "Bilinmeýän ýalňyşlyk"); }
    finally { setBuyLoading(false); }
  }

  const CASHOUT_FEE_RATE = 0.005;
  const sellAmtNum = parseFloat(sellAmount) || 0;
  const cashoutCommission = parseFloat((sellAmtNum * CASHOUT_FEE_RATE).toFixed(2));
  const cashoutReceive = parseFloat((sellAmtNum - cashoutCommission).toFixed(2));

  async function handleSell() {
    const amt = parseFloat(sellAmount);
    if (!amt || amt <= 0) { Alert.alert("Ýalňyşlyk", "Mukdary giriziň!"); return; }
    if (!sellPhone.trim()) { Alert.alert("Ýalňyşlyk", "TMCell nomeriňizi giriziň!"); return; }
    setSellLoading(true);
    try {
      const result = await createTMCellCashout(deviceId, amt, sellPhone.trim());
      if (!result.success) {
        Alert.alert("Ýalňyşlyk", result.message);
        setSellLoading(false); return;
      }
      await addToHistory({
        type: "bonus-sell", title: "TMCell Çykaryş",
        details: `${amt} BP → ${result.receiveAmount} TMT · ${sellPhone}`,
        amount: amt, amountLabel: `-${amt} BP`, phone: sellPhone,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSellDone(true);
    } catch { Alert.alert("Ýalňyşlyk", "Bilinmeýän ýalňyşlyk"); }
    finally { setSellLoading(false); }
  }

  const resetBuy = () => { setBuyDone(false); setSelectedBuy(null); setBuyPhone(""); setShowPayment(false); setBuyPayMethod(""); setBuyCardBank(""); setBuyCardType(""); setBuyCardLast4(""); };
  const resetSell = () => { setSellDone(false); setSellAmount(""); setSellPhone(""); };

  // transfer state
  const [toId, setToId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [transferSending, setTransferSending] = useState(false);
  const [transferDone, setTransferDone] = useState(false);
  const [transferHistory, setTransferHistory] = useState<BPTransfer[]>([]);
  const [loadingHist, setLoadingHist] = useState(false);
  const [showTransferHistory, setShowTransferHistory] = useState(false);

  useEffect(() => {
    if (mode !== "transfer" || !deviceId) return;
    setLoadingHist(true);
    getBPTransferHistory(deviceId).then(h => { setTransferHistory(h); setLoadingHist(false); });
  }, [mode, deviceId]);

  async function handleTransfer() {
    const id = toId.trim();
    const amt = parseFloat(transferAmount);
    if (!id) { Alert.alert("Ýalňyşlyk", "Alyjynyň ID-ni giriziň"); return; }
    if (!amt || amt <= 0) { Alert.alert("Ýalňyşlyk", "Nädogry mukdar"); return; }
    if (amt > balance) { Alert.alert("Ýalňyşlyk", `Ýeterlik BP ýok (${balance.toFixed(2)} BP)`); return; }
    Alert.alert("Tassykla", `${amt} BP geçirilsin my?`, [
      { text: "Ýok" },
      { text: "Hawa, iber", onPress: async () => {
        setTransferSending(true);
        try {
          const result = await sendBP(id, amt, transferNote);
          if (result.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Üstünlikli", result.message);
            setToId(""); setTransferAmount(""); setTransferNote("");
            setTransferDone(true);
            getBPTransferHistory(deviceId).then(h => setTransferHistory(h));
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Ýalňyşlyk", result.message);
          }
        } catch { Alert.alert("Ýalňyşlyk", "Geçirme başa barmady"); }
        finally { setTransferSending(false); }
      }},
    ]);
  }

  return (
    <>
      {/* iOS-style segmented control */}
      <View style={[s.segment, { backgroundColor: colors.muted }]}>
        {([
          { id: "buy" as const, icon: "arrow-down-circle-outline" as const, label: "Almak" },
          { id: "sell" as const, icon: "arrow-up-circle-outline" as const, label: "Çykaryş" },
          { id: "transfer" as const, icon: "paper-plane-outline" as const, label: "Geçirmek" },
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
                <View style={{ marginTop: 16 }}>
                  <PessimisticButton
                    label="Töleg geçirdim"
                    loadingLabel="Barlanýar..."
                    loading={buyLoading}
                    disabled={buyLoading}
                    onPress={handleBuy}
                    color={colors.primary}
                    size="lg"
                    icon={<Ionicons name="checkmark-circle-outline" size={18} color="#fff" />}
                  />
                </View>
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

                <View style={{ marginTop: 16 }}>
                  <PessimisticButton
                    label="Töleg geçirdim"
                    loadingLabel="Barlanýar..."
                    loading={buyLoading}
                    disabled={buyLoading}
                    onPress={handleBuy}
                    color="#6366f1"
                    size="lg"
                    icon={<Ionicons name="card-outline" size={18} color="#fff" />}
                  />
                </View>
                <Pressable onPress={() => setBuyPayMethod("")} style={s.backRow}>
                  <Feather name="arrow-left" size={16} color={colors.mutedForeground} />
                  <Text style={[{ color: colors.mutedForeground, fontWeight: "600" }]}>Yza</Text>
                </Pressable>
              </>
            )}
          </>
        )
      ) : mode === "sell" ? (
        sellDone ? (
          <View style={s.successBox}>
            <View style={[s.successIcon, { backgroundColor: "#d1fae5" }]}>
              <Ionicons name="phone-portrait" size={40} color="#059669" />
            </View>
            <Text style={[s.successTitle, { color: colors.foreground }]}>Çykaryş iberildi!</Text>
            <Text style={[s.successDesc, { color: colors.mutedForeground }]}>
              TMCell çykaryş haýyşnamaňyz kabul edildi.{"\n"}Iň gysga wagtda TMCell balansynyza geçer.
            </Text>
            <Pressable onPress={resetSell} style={[s.primaryBtn, { backgroundColor: colors.primary }]}>
              <Text style={s.primaryBtnText}>Täzeden</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Rate pill */}
            <View style={[s.ratePill, { backgroundColor: "#05966912", borderColor: "#05966930" }]}>
              <Ionicons name="phone-portrait-outline" size={15} color="#059669" />
              <Text style={[s.rateText, { color: "#059669" }]}>TMCell çykaryş · {(COMMISSION_RATES.tmcell_cashout * 100).toFixed(1)}% komissiya</Text>
            </View>

            {/* Balance card */}
            <View style={[s.balanceCard, { backgroundColor: colors.primary }]}>
              <View style={s.balanceCardRow}>
                <View style={[s.balanceCardIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                  <Ionicons name="wallet" size={22} color="#fff" />
                </View>
                <View>
                  <Text style={s.balanceCardLabel}>Häzirki balans</Text>
                  <Text style={s.balanceCardVal}>{balance.toFixed(2)} BP</Text>
                </View>
              </View>
            </View>

            <View style={{ marginTop: 16 }}>
              <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Çykarmak üçin mukdar (BP)</Text>
              <TextInput value={sellAmount} onChangeText={setSellAmount} placeholder="Meseläň: 100"
                placeholderTextColor={colors.mutedForeground} keyboardType="decimal-pad"
                style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>

            {sellAmtNum > 0 && (
              <View style={[{ borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 10, gap: 7, backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[{ fontSize: 12, fontWeight: "700", color: colors.foreground, marginBottom: 2 }]}>Töleg hasaplamasy</Text>
                {[
                  { label: "Çykarylýan BP",  val: `${sellAmtNum} BP`,           red: false },
                  { label: `Komissiya (${(COMMISSION_RATES.tmcell_cashout * 100).toFixed(1)}%)`, val: `-${cashoutCommission} BP`,   red: true  },
                ].map((row, i) => (
                  <View key={i} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{row.label}</Text>
                    <Text style={{ color: row.red ? "#ef4444" : colors.foreground, fontWeight: "700", fontSize: 12 }}>{row.val}</Text>
                  </View>
                ))}
                <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 3 }} />
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 12 }}>TMCell-de alarsyňyz</Text>
                  <Text style={{ color: "#059669", fontWeight: "800", fontSize: 17 }}>{cashoutReceive} TMT</Text>
                </View>
              </View>
            )}

            <View style={{ marginTop: 14 }}>
              <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Siziň TMCell nomeriňiz</Text>
              <TextInput value={sellPhone} onChangeText={setSellPhone} placeholder="+993 6X XXXXXX"
                placeholderTextColor={colors.mutedForeground} keyboardType="phone-pad"
                style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>

            <View style={[{ flexDirection: "row", gap: 8, alignItems: "flex-start", padding: 11, borderRadius: 12, borderWidth: 1, marginTop: 12, backgroundColor: "#fef3c710", borderColor: "#d9770640" }]}>
              <Ionicons name="information-circle-outline" size={15} color="#d97706" />
              <Text style={{ color: "#d97706", fontSize: 12, flex: 1, lineHeight: 17 }}>
                Diňe öz TMCell belgiňize çykaryp bolýar. Karta çykaryş elýeterli däl.
              </Text>
            </View>

            {sellLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
            ) : (
              <Pressable
                onPress={handleSell}
                disabled={!sellAmount || !sellPhone}
                style={({ pressed }) => [s.primaryBtn, { backgroundColor: "#059669", opacity: pressed || !sellAmount || !sellPhone ? 0.7 : 1, marginTop: 20 }]}
              >
                <Ionicons name="phone-portrait-outline" size={18} color="#fff" />
                <Text style={s.primaryBtnText}>TMCell-e çykar</Text>
              </Pressable>
            )}
          </>
        )
      ) : transferDone ? (
        <View style={s.successBox}>
          <View style={[s.successIcon, { backgroundColor: "#d1fae5" }]}>
            <Ionicons name="checkmark-circle" size={40} color="#059669" />
          </View>
          <Text style={[s.successTitle, { color: colors.foreground }]}>Geçirildi!</Text>
          <Text style={[s.successDesc, { color: colors.mutedForeground }]}>BP üstünlikli iberildi.</Text>
          <Pressable onPress={() => setTransferDone(false)} style={[s.primaryBtn, { backgroundColor: colors.primary }]}>
            <Text style={s.primaryBtnText}>Täzeden</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          <LinearGradient
            colors={[colors.headerGradientStart, colors.headerGradientEnd] as [string, string]}
            style={{ borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}
          >
            <Ionicons name="wallet-outline" size={22} color="rgba(255,255,255,0.85)" />
            <View>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "600" }}>Mowjut balans</Text>
              <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}>{balance.toFixed(2)} BP</Text>
            </View>
          </LinearGradient>

          <View>
            <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Alyjynyň ID-si *</Text>
            <TextInput
              value={toId} onChangeText={setToId}
              placeholder="dev_... ID giriz"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, marginTop: 6 }]}
            />
          </View>

          <View>
            <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Mukdar (BP) *</Text>
            <TextInput
              value={transferAmount} onChangeText={setTransferAmount}
              placeholder="Meseläň: 50"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="decimal-pad"
              style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, marginTop: 6 }]}
            />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {[10, 25, 50, 100].map(q => (
                <Pressable
                  key={q}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTransferAmount(String(q)); }}
                  style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: transferAmount === String(q) ? colors.primary : colors.muted, borderWidth: 1, borderColor: transferAmount === String(q) ? colors.primary : colors.border }}
                >
                  <Text style={{ fontWeight: "700", color: transferAmount === String(q) ? "#fff" : colors.foreground, fontSize: 13 }}>{q} BP</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View>
            <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Bellik (islege görä)</Text>
            <TextInput
              value={transferNote} onChangeText={setTransferNote}
              placeholder="Sebäp ýa-da bellik..."
              placeholderTextColor={colors.mutedForeground}
              style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, marginTop: 6 }]}
            />
          </View>

          {transferSending ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />
          ) : (
            <Pressable
              onPress={handleTransfer}
              style={({ pressed }) => [s.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
            >
              <Ionicons name="paper-plane-outline" size={18} color="#fff" />
              <Text style={s.primaryBtnText}>{transferAmount && parseFloat(transferAmount) > 0 ? `${transferAmount} BP Geçir` : "Geçir"}</Text>
            </Pressable>
          )}

          {transferHistory.length > 0 && (
            <View style={{ marginTop: 4 }}>
              <Pressable
                onPress={() => setShowTransferHistory(v => !v)}
                style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8 }}
              >
                <Ionicons name={showTransferHistory ? "chevron-up-outline" : "chevron-down-outline"} size={16} color={colors.mutedForeground} />
                <Text style={{ color: colors.mutedForeground, fontWeight: "600", fontSize: 13 }}>Geçirme taryhy</Text>
              </Pressable>
              {showTransferHistory && (
                <View style={{ gap: 8 }}>
                  {loadingHist ? <ActivityIndicator color={colors.primary} /> : transferHistory.slice(0, 10).map(t => {
                    const isOut = t.from === deviceId;
                    return (
                      <View key={t.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, backgroundColor: colors.card, borderColor: colors.border }}>
                        <View style={{ width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: isOut ? "#ef444412" : "#05966912" }}>
                          <Ionicons name={isOut ? "arrow-up-outline" : "arrow-down-outline"} size={16} color={isOut ? "#ef4444" : "#059669"} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 13 }}>
                            {isOut ? `→ ${t.toNickname || t.to.slice(0, 12) + "..."}` : `← ${t.fromNickname || t.from.slice(0, 12) + "..."}`}
                          </Text>
                          {t.note ? <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{t.note}</Text> : null}
                        </View>
                        <Text style={{ fontWeight: "800", color: isOut ? "#ef4444" : "#059669" }}>{isOut ? "-" : "+"}{t.amount} BP</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </>
  );
}

// ── Kripto Walýuta Section (USDT only · TRC20 · BEP20 · TON) ───────

const USDT_NETWORKS = [
  { id: "trc20" as const, name: "TRC20", full: "Tron Network",           color: "#ef4444", fee: 1.00, time: "~1-3 dak" },
  { id: "bep20" as const, name: "BEP20", full: "Binance Smart Chain",    color: "#f59e0b", fee: 0.50, time: "~3-5 dak" },
  { id: "ton"   as const, name: "TON",   full: "Telegram Open Network",  color: "#0088cc", fee: 0.05, time: "~5 sek"  },
];

const USDT_WALLETS: Record<"trc20"|"bep20"|"ton", string> = {
  trc20: "TYvmFoX8Swr3G3JBqfbT5qvTtSNr4wH1KR",
  bep20: "0x7a4B2F3E5d8c1A9B6e4F2D7c8a3B5e9F1d4c2A7",
  ton:   "UQBvAzI7nB5RFxeJ7c9YpqT8L5m2kNpTgQP4zX6wKjV1hW",
};

const BP_PER_USDT  = COMMISSION_RATES.crypto_bp_per_usdt;
const USDT_PER_BP  = COMMISSION_RATES.crypto_usdt_per_bp;

const P2P_ORDERS_DATA = [
  { id:"po1", pair:"BP/USDT",  type:"sell" as const, price:34.5, min:100,  max:2000, seller:"YenilOfficial", premium:true,  pay:"Ýeňil BP"  },
  { id:"po2", pair:"TMT/USDT", type:"sell" as const, price:34.5, min:200,  max:5000, seller:"YenilOfficial", premium:true,  pay:"TMT Nagt"  },
  { id:"po3", pair:"BP/USDT",  type:"buy"  as const, price:33.8, min:50,   max:1000, seller:"AlparslanT",   premium:false, pay:"Ýeňil BP"  },
  { id:"po4", pair:"BP/USDT",  type:"sell" as const, price:34.2, min:100,  max:1500, seller:"MergenD",      premium:false, pay:"Ýeňil BP"  },
  { id:"po5", pair:"TMT/USDT", type:"buy"  as const, price:33.5, min:300,  max:4000, seller:"NurgeldiA",    premium:false, pay:"TMT Nagt"  },
  { id:"po6", pair:"TMT/USDT", type:"sell" as const, price:34.3, min:100,  max:2000, seller:"AysoltanO",    premium:false, pay:"TMT Bank"  },
];

function CurrencySection({ colors }: { colors: ReturnType<typeof useColors> }) {
  const { balance, deduct, deviceId } = useBonusPul();
  type CTab = "deposit" | "withdraw" | "p2p";
  const [ctab, setCtab] = useState<CTab>("deposit");

  // deposit
  const [depNet, setDepNet] = useState<"trc20"|"bep20"|"ton">("trc20");
  const [depUsdt, setDepUsdt] = useState("");
  const [depTx, setDepTx] = useState("");
  const [depLoading, setDepLoading] = useState(false);
  const [depDone, setDepDone] = useState(false);
  const [depErr, setDepErr] = useState("");

  // withdraw
  const [wdNet, setWdNet] = useState<"trc20"|"bep20"|"ton">("trc20");
  const [wdBP, setWdBP] = useState("");
  const [wdAddr, setWdAddr] = useState("");
  const [wdLoading, setWdLoading] = useState(false);
  const [wdDone, setWdDone] = useState(false);
  const [wdErr, setWdErr] = useState("");
  const [wdShowCheckout, setWdShowCheckout] = useState(false);

  // p2p
  const [p2pPair, setP2pPair] = useState<"all"|"BP/USDT"|"TMT/USDT">("all");

  const depUsdtNum  = parseFloat(depUsdt)  || 0;
  const depBPCalc   = depUsdtNum * BP_PER_USDT;
  const wdBPNum     = parseFloat(wdBP)     || 0;
  const wdUsdtCalc  = wdBPNum * USDT_PER_BP;
  const wdNetData   = USDT_NETWORKS.find(n => n.id === wdNet)!;
  const wdReceive   = Math.max(0, wdUsdtCalc - wdNetData.fee);

  async function submitDeposit() {
    if (depUsdtNum <= 0) { setDepErr("USDT mukdaryny giriziň!"); return; }
    if (!depTx.trim() || depTx.trim().length < 15) { setDepErr("Dogry TX Hash giriziň!"); return; }
    setDepLoading(true); setDepErr("");
    try {
      await saveOrder("crypto-deposits", {
        network: depNet, usdtAmount: depUsdtNum, bpAmount: depBPCalc,
        txHash: depTx.trim(), timestamp: new Date().toISOString(),
      });
      await addToHistory({
        type: "currency-buy", title: "Kripto Depozit",
        details: `${depUsdtNum} USDT (${depNet.toUpperCase()}) → ${depBPCalc.toFixed(1)} BP`,
        amount: depBPCalc, amountLabel: `+${depBPCalc.toFixed(1)} BP`,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDepDone(true);
    } catch { setDepErr("Ulgam ýalňyşlygy. Gaýtadan synanyşyň."); }
    finally { setDepLoading(false); }
  }

  async function submitWithdraw() {
    if (wdBPNum <= 0) { setWdErr("BP mukdaryny giriziň!"); return; }
    if (balance < wdBPNum) { setWdShowCheckout(true); return; }
    if (wdReceive <= 0) { setWdErr("Mukdar komissiyadan az. Köpräk giriziň."); return; }
    if (!wdAddr.trim()) { setWdErr("Kripto manzilinizi giriziň!"); return; }
    setWdLoading(true); setWdErr("");
    try {
      await saveOrder("crypto-withdrawals", {
        network: wdNet, bpAmount: wdBPNum, usdtAmount: wdUsdtCalc,
        fee: wdNetData.fee, receiveAmount: wdReceive, walletAddress: wdAddr.trim(),
        timestamp: new Date().toISOString(),
      });
      deduct(wdBPNum);
      await addToHistory({
        type: "currency-sell", title: "Kripto Çykaryş",
        details: `${wdBPNum} BP → ${wdReceive.toFixed(4)} USDT (${wdNet.toUpperCase()})`,
        amount: wdBPNum, amountLabel: `-${wdBPNum} BP`,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setWdDone(true);
    } catch { setWdErr("Ulgam ýalňyşlygy. Gaýtadan synanyşyň."); }
    finally { setWdLoading(false); }
  }

  function handleP2P(o: typeof P2P_ORDERS_DATA[0]) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      `${o.pair} — ${o.type === "buy" ? "Satyn al" : "Sat"}`,
      `Satyjy: ${o.seller}\nBaha: ${o.price}/USDT\nDiapazon: ${o.min}–${o.max}\nTöleg: ${o.pay}\n\nOperator size ýakyn wagtda ýüz tutar.`,
      [
        { text: "Ýatyr", style: "cancel" },
        { text: o.type === "buy" ? "Satyn al" : "Sat", onPress: () =>
          Alert.alert("Sargyt iberildi!", `${o.pair} sargydyňyz kabul edildi. Operator habarlaşar.`) },
      ]
    );
  }

  // ─── Deposit done screen ───
  if (depDone) return (
    <View style={s.successBox}>
      <View style={[s.successIcon, { backgroundColor: "#d1fae5" }]}>
        <Ionicons name="checkmark-circle" size={40} color="#059669" />
      </View>
      <Text style={[s.successTitle, { color: colors.foreground }]}>Üstünlikli!</Text>
      <Text style={[s.successDesc, { color: colors.mutedForeground }]}>
        {depBPCalc.toFixed(1)} BP TX tassyklanandan soň ({USDT_NETWORKS.find(n=>n.id===depNet)?.time}) balansynyza goşular.
      </Text>
      <Pressable onPress={() => { setDepDone(false); setDepUsdt(""); setDepTx(""); }} style={[s.primaryBtn, { backgroundColor: colors.primary }]}>
        <Text style={s.primaryBtnText}>Täzeden</Text>
      </Pressable>
    </View>
  );

  // ─── Withdraw done screen ───
  if (wdDone) return (
    <View style={s.successBox}>
      <View style={[s.successIcon, { backgroundColor: "#dbeafe" }]}>
        <Ionicons name="send" size={36} color="#2563eb" />
      </View>
      <Text style={[s.successTitle, { color: colors.foreground }]}>Çykaryş iberildi!</Text>
      <Text style={[s.successDesc, { color: colors.mutedForeground }]}>
        {wdReceive.toFixed(4)} USDT {wdAddr.slice(0,10)}... manziline iberilýär.{"\n"}Garaşylýan wagt: {wdNetData.time}
      </Text>
      <Pressable onPress={() => { setWdDone(false); setWdBP(""); setWdAddr(""); }} style={[s.primaryBtn, { backgroundColor: colors.primary }]}>
        <Text style={s.primaryBtnText}>Täzeden</Text>
      </Pressable>
    </View>
  );

  return (
    <>
      {/* ── Rate hero ── */}
      <LinearGradient
        colors={[colors.primary, colors.primary + "bb"] as [string,string]}
        style={cs.rateHero}
      >
        <View style={cs.rateHeroLeft}>
          <Text style={cs.rateHeroLabel}>Kripto Walýuta · USDT</Text>
          <Text style={cs.rateHeroVal}>1 USDT = {BP_PER_USDT} BP</Text>
        </View>
        <View style={cs.rateHeroBadge}>
          <Ionicons name="logo-bitcoin" size={13} color="#f59e0b" />
          <Text style={cs.rateHeroBadgeText}>Stablecoin</Text>
        </View>
      </LinearGradient>

      {/* ── Sub-tabs ── */}
      <View style={[s.segment, { backgroundColor: colors.muted, marginBottom: 16 }]}>
        {([
          { id: "deposit"  as const, icon: "arrow-down-circle-outline" as const, label: "Depozit"   },
          { id: "withdraw" as const, icon: "arrow-up-circle-outline"   as const, label: "Çykaryş"   },
          { id: "p2p"      as const, icon: "swap-horizontal-outline"   as const, label: "P2P Bazar" },
        ]).map(t => (
          <Pressable key={t.id}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCtab(t.id); }}
            style={[s.segBtn, {
              backgroundColor: ctab === t.id ? colors.card : "transparent",
              shadowColor: ctab === t.id ? "#000" : "transparent",
              shadowOpacity: ctab === t.id ? 0.1 : 0,
              shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
              elevation: ctab === t.id ? 2 : 0,
            }]}
          >
            <Ionicons name={t.icon} size={13} color={ctab === t.id ? colors.primary : colors.mutedForeground} />
            <Text style={[s.segBtnText, { color: ctab === t.id ? colors.foreground : colors.mutedForeground, fontSize: 11 }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* ════════════ DEPOSIT TAB ════════════ */}
      {ctab === "deposit" && (
        <>
          {/* Rate summary card */}
          <View style={[cs.depSummaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={cs.depSummaryRow}>
              <View style={[cs.depSummaryIcon, { backgroundColor: "#05966915" }]}>
                <Ionicons name="arrow-down-circle" size={22} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[cs.depSummaryLabel, { color: colors.mutedForeground }]}>Depozit kursy</Text>
                <Text style={[cs.depSummaryVal, { color: colors.foreground }]}>1 USDT = <Text style={{ color: colors.primary, fontWeight: "800" }}>{BP_PER_USDT} BP</Text></Text>
              </View>
              <View style={[cs.depRateBadge, { backgroundColor: "#05966912", borderColor: "#05966930" }]}>
                <Text style={{ color: "#059669", fontSize: 11, fontWeight: "700" }}>Anyk kurs</Text>
              </View>
            </View>
          </View>

          {/* Network selector */}
          <Text style={[cs.depSectionLabel, { color: colors.mutedForeground }]}>Tarmogy saýlaň</Text>
          <View style={cs.netRow}>
            {USDT_NETWORKS.map(n => (
              <Pressable key={n.id} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDepNet(n.id); }}
                style={[cs.netCard, depNet === n.id
                  ? { backgroundColor: n.color + "15", borderColor: n.color, borderWidth: 2 }
                  : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }
                ]}
              >
                <View style={[cs.netDot, { backgroundColor: n.color }]} />
                <Text style={[cs.netName, { color: depNet === n.id ? n.color : colors.foreground }]}>{n.name}</Text>
                <Text style={[cs.netFee, { color: colors.mutedForeground }]}>{n.fee} kom.</Text>
                <Text style={[cs.netTime, { color: depNet === n.id ? n.color + "bb" : colors.mutedForeground }]}>{n.time}</Text>
              </Pressable>
            ))}
          </View>

          {/* Amount input */}
          <Text style={[cs.depSectionLabel, { color: colors.mutedForeground, marginTop: 16 }]}>Iberjek USDT mukdaryňyz</Text>
          <View style={[cs.inputRow, { backgroundColor: colors.card, borderColor: depUsdtNum > 0 ? colors.primary : colors.border, borderWidth: 1.5 }]}>
            <View style={[cs.depPfxBadge, { backgroundColor: "#2563eb18" }]}>
              <Text style={{ color: "#2563eb", fontSize: 14, fontWeight: "800" }}>$</Text>
            </View>
            <TextInput value={depUsdt} onChangeText={setDepUsdt} placeholder="0.00"
              placeholderTextColor={colors.mutedForeground} keyboardType="decimal-pad"
              style={[cs.inputField, { color: colors.foreground }]} />
            <View style={[cs.depSfxBadge, { backgroundColor: colors.muted }]}>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "700" }}>USDT</Text>
            </View>
          </View>

          {/* Conversion preview */}
          {depUsdtNum > 0 && (
            <View style={[cs.depConvCard, { backgroundColor: colors.primary + "0e", borderColor: colors.primary + "30" }]}>
              <View style={cs.depConvRow}>
                <View style={cs.depConvItem}>
                  <Text style={[cs.depConvLbl, { color: colors.mutedForeground }]}>Iberýärsiňiz</Text>
                  <Text style={[cs.depConvVal, { color: colors.foreground }]}>{depUsdtNum} USDT</Text>
                </View>
                <View style={[cs.depConvArrow, { backgroundColor: colors.primary + "20" }]}>
                  <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                </View>
                <View style={[cs.depConvItem, { alignItems: "flex-end" }]}>
                  <Text style={[cs.depConvLbl, { color: colors.mutedForeground }]}>Alarsyňyz</Text>
                  <Text style={[cs.depConvVal, { color: colors.primary, fontWeight: "800" }]}>{depBPCalc.toFixed(1)} BP</Text>
                </View>
              </View>
            </View>
          )}

          {/* Wallet address */}
          <Text style={[cs.depSectionLabel, { color: colors.mutedForeground, marginTop: 16 }]}>
            Ýeňil {USDT_NETWORKS.find(n=>n.id===depNet)?.name} Manzili
          </Text>
          <Pressable
            onPress={() => Alert.alert("Manzil", USDT_WALLETS[depNet], [{ text: "Ýap" }])}
            style={[cs.addrCard, { backgroundColor: colors.card, borderColor: USDT_NETWORKS.find(n=>n.id===depNet)!.color }]}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <View style={[cs.netDot, { backgroundColor: USDT_NETWORKS.find(n=>n.id===depNet)!.color }]} />
                <Text style={{ fontSize: 10, fontWeight: "800", color: USDT_NETWORKS.find(n=>n.id===depNet)!.color }}>
                  {USDT_NETWORKS.find(n=>n.id===depNet)?.full} · USDT
                </Text>
              </View>
              <Text style={[cs.addrText, { color: colors.foreground }]} selectable numberOfLines={2}>
                {USDT_WALLETS[depNet]}
              </Text>
            </View>
            <View style={[cs.copyBtn, { backgroundColor: USDT_NETWORKS.find(n=>n.id===depNet)!.color }]}>
              <Ionicons name="copy-outline" size={15} color="#fff" />
            </View>
          </Pressable>
          <View style={[cs.depWarningRow, { backgroundColor: "#fef9c3", borderColor: "#fde047", marginTop: 6 }]}>
            <Ionicons name="warning-outline" size={14} color="#ca8a04" />
            <Text style={[cs.depWarningText, { color: "#92400e" }]}>
              Diňe {USDT_NETWORKS.find(n=>n.id===depNet)?.name} USDT iberiň. Başga token ýitgä sebäp bolar.
            </Text>
          </View>

          {/* TX Hash */}
          <Text style={[cs.depSectionLabel, { color: colors.mutedForeground, marginTop: 16 }]}>Tranzaksiýa haşy (TX ID)</Text>
          <View style={[cs.inputRow, { backgroundColor: colors.card, borderColor: depTx.length > 10 ? "#059669" : colors.border, borderWidth: 1.5 }]}>
            <Ionicons name="receipt-outline" size={15} color={depTx.length > 10 ? "#059669" : colors.mutedForeground} />
            <TextInput value={depTx} onChangeText={setDepTx} placeholder="0x... ýa-da TX ID"
              placeholderTextColor={colors.mutedForeground} autoCapitalize="none"
              style={[cs.inputField, { color: colors.foreground }]} />
          </View>

          {depErr ? (
            <View style={cs.errBox}>
              <Ionicons name="alert-circle-outline" size={15} color="#dc2626" />
              <Text style={cs.errText}>{depErr}</Text>
            </View>
          ) : null}

          {depLoading ? (
            <View style={[cs.depLoadingWrap]}>
              <ActivityIndicator color={colors.primary} />
              <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 6 }}>Tassyklanýar...</Text>
            </View>
          ) : (
            <Pressable onPress={submitDeposit}
              style={({ pressed }) => [s.primaryBtn, { backgroundColor: "#059669", opacity: pressed ? 0.85 : 1, marginTop: 18 }]}>
              <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
              <Text style={s.primaryBtnText}>Tassyklamak we Ibermek</Text>
            </Pressable>
          )}

          {/* How-to guide */}
          <View style={[cs.stepsCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 20 }]}>
            <View style={cs.stepsTitleRow}>
              <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
              <Text style={[cs.stepsTitle, { color: colors.foreground }]}>Nädip depozit etmeli?</Text>
            </View>
            {[
              { icon: "layers-outline" as const, text: "Tarmogy saýlaň (TON iň arzan: 0.05 USDT)" },
              { icon: "send-outline" as const, text: "Ýeňil manziline USDT iberiň" },
              { icon: "receipt-outline" as const, text: "TX haşyny giriziň we tassyklaň" },
              { icon: "checkmark-circle-outline" as const, text: "BP balansynyza awtomatik geçer" },
            ].map((step, i) => (
              <View key={i} style={cs.stepRow}>
                <View style={[cs.stepNum, { backgroundColor: colors.primary }]}>
                  <Text style={cs.stepNumText}>{i + 1}</Text>
                </View>
                <Ionicons name={step.icon} size={13} color={colors.mutedForeground} style={{ marginRight: 2 }} />
                <Text style={[cs.stepText, { color: colors.foreground, flex: 1 }]}>{step.text}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* ════════════ WITHDRAW TAB ════════════ */}
      {ctab === "withdraw" && (
        <>
          {/* Balance hero card */}
          <View style={[cs.wdBalHero, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
            <View style={{ flex: 1 }}>
              <Text style={cs.wdBalHeroLabel}>Balansiňiz</Text>
              <Text style={cs.wdBalHeroVal}>{balance.toFixed(2)} <Text style={{ fontSize: 16, fontWeight: "600", opacity: 0.85 }}>BP</Text></Text>
            </View>
            <View style={cs.wdBalHeroRight}>
              <View style={cs.wdRatePill}>
                <Text style={cs.wdRatePillText}>1 BP = {USDT_PER_BP} USDT</Text>
              </View>
              <View style={cs.wdBalIconWrap}>
                <Ionicons name="wallet" size={24} color="rgba(255,255,255,0.9)" />
              </View>
            </View>
          </View>

          {/* Network selector */}
          <Text style={[cs.depSectionLabel, { color: colors.mutedForeground, marginTop: 4 }]}>Çykaryş tarmagyňyz</Text>
          <View style={cs.netRow}>
            {USDT_NETWORKS.map(n => (
              <Pressable key={n.id} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setWdNet(n.id); }}
                style={[cs.netCard, wdNet === n.id
                  ? { backgroundColor: n.color + "15", borderColor: n.color, borderWidth: 2 }
                  : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }
                ]}
              >
                <View style={[cs.netDot, { backgroundColor: n.color }]} />
                <Text style={[cs.netName, { color: wdNet === n.id ? n.color : colors.foreground }]}>{n.name}</Text>
                <Text style={[cs.netFee, { color: colors.mutedForeground }]}>{n.fee} USDT</Text>
                <Text style={[cs.netTime, { color: wdNet === n.id ? n.color + "bb" : colors.mutedForeground }]}>{n.time}</Text>
              </Pressable>
            ))}
          </View>

          {/* BP amount input */}
          <Text style={[cs.depSectionLabel, { color: colors.mutedForeground, marginTop: 16 }]}>Näçe BP çykarmak isleýärsiňiz?</Text>
          <View style={[cs.inputRow, { backgroundColor: colors.card, borderColor: wdBPNum > 0 ? colors.primary : colors.border, borderWidth: 1.5 }]}>
            <Ionicons name="logo-bitcoin" size={15} color={wdBPNum > 0 ? colors.primary : colors.mutedForeground} />
            <TextInput value={wdBP} onChangeText={setWdBP} placeholder="0"
              placeholderTextColor={colors.mutedForeground} keyboardType="decimal-pad"
              style={[cs.inputField, { color: colors.foreground }]} />
            <View style={[cs.depSfxBadge, { backgroundColor: colors.muted }]}>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "700" }}>BP</Text>
            </View>
          </View>

          {/* Fee breakdown — shown when amount entered */}
          {wdBPNum > 0 && (
            <>
              <View style={[cs.wdFeeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={cs.wdFeeTitleRow}>
                  <Ionicons name="calculator-outline" size={14} color={colors.primary} />
                  <Text style={[cs.feeTitleTxt, { color: colors.foreground }]}>Töleg hasaplamasy</Text>
                </View>
                {[
                  { label: "Çykarylýan BP",              val: `${wdBPNum} BP`,                 accent: false },
                  { label: "USDT deňeri",                val: `${wdUsdtCalc.toFixed(4)} USDT`, accent: false },
                  { label: `${wdNetData.name} tarmak komissiyasy`, val: `-${wdNetData.fee} USDT`, accent: true },
                ].map((row, i) => (
                  <View key={i} style={[cs.feeRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border + "60", paddingTop: 7 }]}>
                    <Text style={[cs.feeRowLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                    <Text style={[cs.feeRowVal, { color: row.accent ? "#ef4444" : colors.foreground }]}>{row.val}</Text>
                  </View>
                ))}
                <View style={[cs.feeDivider, { backgroundColor: colors.border, marginVertical: 6 }]} />
                <View style={cs.feeRow}>
                  <Text style={[cs.feeRowLabel, { color: colors.foreground, fontWeight: "700" }]}>Alarsyňyz</Text>
                  <Text style={[cs.feeRowVal, { color: "#059669", fontSize: 18, fontWeight: "800" }]}>
                    {wdReceive.toFixed(4)} USDT
                  </Text>
                </View>
              </View>

              {/* Plain-language summary */}
              <View style={[cs.wdSummaryBanner, { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }]}>
                <Ionicons name="information-circle" size={16} color="#059669" />
                <Text style={[cs.wdSummaryText, { color: "#166534" }]}>
                  Siz <Text style={{ fontWeight: "800" }}>{wdBPNum} BP</Text> çykarýarsyňyz.{" "}
                  {wdNetData.name} tarmagynyň komissiyasy{" "}
                  <Text style={{ fontWeight: "800", color: "#dc2626" }}>{wdNetData.fee} USDT</Text>.{" "}
                  Hamyonyňyza <Text style={{ fontWeight: "800" }}>{wdReceive.toFixed(4)} USDT</Text> geler.
                </Text>
              </View>
            </>
          )}

          {/* Wallet address */}
          <Text style={[cs.depSectionLabel, { color: colors.mutedForeground, marginTop: 16 }]}>
            {wdNetData.name} Kripto Manziliniz
          </Text>
          <View style={[cs.inputRow, { backgroundColor: colors.card, borderColor: wdAddr.length > 5 ? wdNetData.color : colors.border, borderWidth: 1.5 }]}>
            <Ionicons name="wallet-outline" size={15} color={wdAddr.length > 5 ? wdNetData.color : colors.mutedForeground} />
            <TextInput value={wdAddr} onChangeText={setWdAddr}
              placeholder={wdNet === "bep20" ? "0x..." : wdNet === "ton" ? "UQ..." : "T..."}
              placeholderTextColor={colors.mutedForeground} autoCapitalize="none"
              style={[cs.inputField, { color: colors.foreground }]} />
          </View>
          <View style={[cs.depWarningRow, { backgroundColor: "#fef9c3", borderColor: "#fde047", marginTop: 6 }]}>
            <Ionicons name="warning-outline" size={14} color="#ca8a04" />
            <Text style={[cs.depWarningText, { color: "#92400e" }]}>
              Manzil ýalňyş girizilse pul yzyna gaýtarylmaýar. Üns bilen barlaň.
            </Text>
          </View>

          {wdErr ? (
            <View style={cs.errBox}>
              <Ionicons name="alert-circle-outline" size={15} color="#dc2626" />
              <Text style={cs.errText}>{wdErr}</Text>
            </View>
          ) : null}

          {wdLoading ? (
            <View style={[cs.depLoadingWrap]}>
              <ActivityIndicator color={colors.primary} />
              <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 6 }}>Iberilýär...</Text>
            </View>
          ) : (
            <Pressable onPress={submitWithdraw}
              style={({ pressed }) => [s.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1, marginTop: 18 }]}>
              <Ionicons name="send-outline" size={18} color="#fff" />
              <Text style={s.primaryBtnText}>Çykaryşy Tassyklamak</Text>
            </Pressable>
          )}
        </>
      )}

      {/* BP Checkout Modal for crypto withdrawal */}
      <BPCheckoutModal
        visible={wdShowCheckout}
        onClose={() => setWdShowCheckout(false)}
        serviceName={`Kripto Çykaryş · ${wdBPNum} BP`}
        serviceAmount={wdBPNum}
        currentBalance={balance}
        deviceId={deviceId}
        onPaymentComplete={() => { setWdShowCheckout(false); submitWithdraw(); }}
      />

      {/* ════════════ P2P TAB ════════════ */}
      {ctab === "p2p" && (
        <>
          {/* Pair chips */}
          <View style={cs.pairRow}>
            {(["all", "BP/USDT", "TMT/USDT"] as const).map(p => (
              <Pressable key={p}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setP2pPair(p); }}
                style={[cs.pairChip, p2pPair === p
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }
                ]}
              >
                <Text style={[cs.pairChipTxt, { color: p2pPair === p ? "#fff" : colors.foreground }]}>
                  {p === "all" ? "Hemmesi" : p}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Premium banner */}
          <View style={[cs.premBanner, { borderColor: "#f59e0b" }]}>
            <LinearGradient colors={["#f59e0b15","#fbbf2415"]} style={cs.premBannerGrad}>
              <Ionicons name="star" size={15} color="#f59e0b" />
              <View style={{ flex: 1 }}>
                <Text style={[cs.premBannerTitle, { color: colors.foreground }]}>Premium Jübütler — BP/USDT · TMT/USDT</Text>
                <Text style={[cs.premBannerSub, { color: colors.mutedForeground }]}>Escrow goragy · Operator kepilligi</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Orders */}
          <View style={{ gap: 10 }}>
            {P2P_ORDERS_DATA
              .filter(o => p2pPair === "all" || o.pair === p2pPair)
              .map(order => (
                <Pressable key={order.id} onPress={() => handleP2P(order)}
                  style={({ pressed }) => [cs.orderCard, {
                    backgroundColor: colors.card,
                    borderColor: order.premium ? "#f59e0b" : colors.border,
                    borderWidth: order.premium ? 1.5 : 1,
                    opacity: pressed ? 0.88 : 1,
                  }]}
                >
                  {order.premium && (
                    <View style={cs.premTag}>
                      <Ionicons name="star" size={8} color="#fff" />
                      <Text style={cs.premTagTxt}>PREMIUM</Text>
                    </View>
                  )}
                  <View style={cs.orderTop}>
                    <View style={[cs.orderTypeBadge, { backgroundColor: order.type === "buy" ? "#05966920" : "#0284c720" }]}>
                      <Text style={[cs.orderTypeText, { color: order.type === "buy" ? "#059669" : "#0284c7" }]}>
                        {order.type === "buy" ? "ALMAK" : "SATMAK"}
                      </Text>
                    </View>
                    <Text style={[cs.orderPair, { color: colors.foreground }]}>{order.pair}</Text>
                    <View style={{ flex: 1 }} />
                    <Text style={[cs.orderPrice, { color: colors.primary }]}>{order.price}</Text>
                    <Text style={[cs.orderPriceUnit, { color: colors.mutedForeground }]}>/USDT</Text>
                  </View>
                  <View style={cs.orderBottom}>
                    <Text style={[cs.orderMeta, { color: colors.mutedForeground }]}>
                      <Ionicons name="person-outline" size={11} /> {order.seller}
                    </Text>
                    <Text style={[cs.orderMeta, { color: colors.mutedForeground }]}>  ·  {order.pay}</Text>
                    <View style={{ flex: 1 }} />
                    <Text style={[cs.orderLimit, { color: colors.mutedForeground }]}>{order.min}–{order.max}</Text>
                  </View>
                  <Pressable onPress={() => handleP2P(order)}
                    style={[cs.orderBtn, { backgroundColor: order.type === "buy" ? "#059669" : colors.primary }]}>
                    <Text style={cs.orderBtnTxt}>{order.type === "buy" ? "Satmak" : "Satyn al"}</Text>
                  </Pressable>
                </Pressable>
              ))}
          </View>
        </>
      )}
    </>
  );
}

const cs = StyleSheet.create({
  rateHero: { borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", marginBottom: 16 },
  rateHeroLeft: { flex: 1 },
  rateHeroLabel: { color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "600" },
  rateHeroVal: { color: "#fff", fontSize: 18, fontWeight: "800", marginTop: 2 },
  rateHeroBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#f59e0b20", borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  rateHeroBadgeText: { color: "#f59e0b", fontSize: 11, fontWeight: "700" },

  netRow: { flexDirection: "row", gap: 7 },
  netCard: { flex: 1, borderRadius: 12, padding: 10, alignItems: "center", gap: 3 },
  netDot: { width: 8, height: 8, borderRadius: 4 },
  netName: { fontSize: 12, fontWeight: "800" },
  netFee: { fontSize: 9, fontWeight: "600" },
  netTime: { fontSize: 9 },

  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12 },
  inputField: { flex: 1, fontSize: 14 },
  inputPfx: { fontSize: 15, fontWeight: "700" },
  inputSfx: { fontSize: 12, fontWeight: "600" },

  calcBadge: { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9, marginTop: 7 },
  calcText: { fontSize: 12, fontWeight: "600" },

  addrCard: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1.5, padding: 12 },
  addrLabel: { fontSize: 10, fontWeight: "600", marginBottom: 3 },
  addrText: { fontSize: 11, lineHeight: 17 },
  copyBtn: { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  noteText: { fontSize: 11, lineHeight: 16, marginTop: 6 },

  errBox: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#fee2e2", borderRadius: 10, padding: 11, marginTop: 9 },
  errText: { color: "#dc2626", fontSize: 12, flex: 1 },

  stepsCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 18, gap: 9 },
  stepsTitle: { fontSize: 12, fontWeight: "700", marginBottom: 2 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  stepNum: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  stepNumText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  stepText: { fontSize: 12, flex: 1 },

  balCard: { flexDirection: "row", alignItems: "center", gap: 11, borderRadius: 14, borderWidth: 1, padding: 13 },
  balLabel: { fontSize: 10, fontWeight: "600" },
  balVal: { fontSize: 20, fontWeight: "800", marginTop: 2 },
  rateTag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  rateTagText: { fontSize: 10, fontWeight: "700" },

  feeCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 10, gap: 7 },
  feeTitleTxt: { fontSize: 12, fontWeight: "700", marginBottom: 2 },
  feeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  feeRowLabel: { fontSize: 12 },
  feeRowVal: { fontSize: 12, fontWeight: "700" },
  feeDivider: { height: 1, marginVertical: 3 },

  // ── Deposit redesign styles ──
  depSummaryCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 16 },
  depSummaryRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  depSummaryIcon: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  depSummaryLabel: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
  depSummaryVal: { fontSize: 15, fontWeight: "700" },
  depRateBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 5 },
  depSectionLabel: { fontSize: 12, fontWeight: "700", marginBottom: 8 },
  depPfxBadge: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  depSfxBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignItems: "center", justifyContent: "center" },
  depConvCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginTop: 8 },
  depConvRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  depConvItem: { flex: 1 },
  depConvArrow: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  depConvLbl: { fontSize: 10, fontWeight: "600", marginBottom: 3 },
  depConvVal: { fontSize: 14, fontWeight: "700" },
  depWarningRow: { flexDirection: "row", alignItems: "flex-start", gap: 7, borderRadius: 10, borderWidth: 1, padding: 10 },
  depWarningText: { fontSize: 11, flex: 1, lineHeight: 16 },
  depLoadingWrap: { alignItems: "center", paddingVertical: 24 },
  stepsTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },

  // ── Withdraw redesign styles ──
  wdBalHero: { borderRadius: 18, padding: 18, flexDirection: "row", alignItems: "center", marginBottom: 18, shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  wdBalHeroLabel: { color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "600", marginBottom: 4 },
  wdBalHeroVal: { color: "#fff", fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  wdBalHeroRight: { alignItems: "flex-end", gap: 8 },
  wdRatePill: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  wdRatePillText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  wdBalIconWrap: { width: 44, height: 44, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  wdFeeCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 10, gap: 8 },
  wdFeeTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  wdSummaryBanner: { borderRadius: 12, borderWidth: 1, padding: 12, marginTop: 8, flexDirection: "row", gap: 8, alignItems: "flex-start" },
  wdSummaryText: { fontSize: 12, lineHeight: 18, flex: 1 },

  pairRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  pairChip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 50 },
  pairChipTxt: { fontSize: 12, fontWeight: "600" },

  premBanner: { borderRadius: 12, borderWidth: 1.5, overflow: "hidden", marginBottom: 10 },
  premBannerGrad: { flexDirection: "row", alignItems: "center", gap: 9, padding: 11 },
  premBannerTitle: { fontSize: 12, fontWeight: "700" },
  premBannerSub: { fontSize: 10, marginTop: 1 },

  orderCard: { borderRadius: 14, padding: 12, gap: 8 },
  premTag: { position: "absolute", top: 10, right: 10, flexDirection: "row", alignItems: "center", gap: 2, backgroundColor: "#f59e0b", borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  premTagTxt: { color: "#fff", fontSize: 8, fontWeight: "800" },
  orderTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  orderTypeBadge: { borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  orderTypeText: { fontSize: 9, fontWeight: "800" },
  orderPair: { fontSize: 13, fontWeight: "700" },
  orderPrice: { fontSize: 15, fontWeight: "800" },
  orderPriceUnit: { fontSize: 11, fontWeight: "600" },
  orderBottom: { flexDirection: "row", alignItems: "center" },
  orderMeta: { fontSize: 11 },
  orderLimit: { fontSize: 11, fontWeight: "600" },
  orderBtn: { borderRadius: 9, paddingVertical: 8, alignItems: "center" },
  orderBtnTxt: { color: "#fff", fontSize: 12, fontWeight: "700" },
});

// ── SIM Kart Section ───────────────────────────────────────────────
function SimSection({ colors }: { colors: ReturnType<typeof useColors> }) {
  const { balance, deviceId } = useBonusPul();
  const [operator, setOperator] = useState<string | null>(null);
  const [simPhone, setSimPhone] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showSimTopUp, setShowSimTopUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const tmt = selected ? parseFloat((selected * UZS_RATE).toFixed(1)) : 0;

  async function handlePay() {
    if (!simPhone || !selected || !operator) { Alert.alert("Ýalňyşlyk", "Ähli meýdançalary dolduryň!"); return; }
    if (balance < tmt) { setShowSimTopUp(true); return; }
    setLoading(true);
    try {
      const result = await deductBalanceAtomic(deviceId, tmt);
      if (!result.success) { setShowSimTopUp(true); setLoading(false); return; }
      await saveOrder("sim-topup-orders", { operator, simPhone, amount: selected, tmtAmount: tmt, payMethod: "bonus", deviceId, status: "pending" });
      await addToHistory({ type: "sim", title: "SIM Kart töleg", details: `${UZ_OPERATORS.find(o => o.id === operator)?.name} · ${simPhone} · ${selected} UZS`, amount: selected, amountLabel: `-${tmt} BP`, simPhone, operator });
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
      <Pressable onPress={() => { setDone(false); setOperator(null); setSelected(null); setShowPayment(false); }}
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
        <Ionicons name="wallet-outline" size={18} color="#fff" />
        <Text style={s.primaryBtnText}>Töleg sahypasyna geç</Text>
      </Pressable>
    </>
  );

  return (
    <>
      <Pressable onPress={() => setShowPayment(false)} style={s.backRow}>
        <Feather name="arrow-left" size={16} color={colors.primary} />
        <Text style={[{ color: colors.primary, fontWeight: "600" }]}>Yza</Text>
      </Pressable>

      {/* BP payment card */}
      <View style={{ borderRadius: 18, backgroundColor: colors.primary, padding: 18, marginBottom: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="phone-portrait-outline" size={22} color="#fff" />
          </View>
          <View>
            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 11 }}>SIM kart töleg</Text>
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>{UZ_OPERATORS.find(o => o.id === operator)?.name ?? operator}</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 10, padding: 12 }}>
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>Töleg mukdary</Text>
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>{tmt} BP</Text>
        </View>
      </View>

      {/* Balance status */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12,
        backgroundColor: balance >= tmt ? "#f0fdf4" : "#fff7ed",
        borderColor: balance >= tmt ? "#86efac" : "#fed7aa" }}>
        <Ionicons name="wallet-outline" size={20} color={balance >= tmt ? "#059669" : "#d97706"} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "700", fontSize: 13, color: balance >= tmt ? "#059669" : "#d97706" }}>
            Siziň balansynyz: {balance.toFixed(2)} BP
          </Text>
          {balance < tmt && (
            <Text style={{ fontSize: 12, color: "#d97706", marginTop: 2 }}>
              Ýetmezçilik: {(tmt - balance).toFixed(2)} BP • Düwme balansy doldurýar
            </Text>
          )}
        </View>
        {balance >= tmt
          ? <Ionicons name="checkmark-circle" size={20} color="#059669" />
          : <Ionicons name="alert-circle" size={20} color="#d97706" />
        }
      </View>

      <View style={{ marginTop: 4 }}>
        <PessimisticButton
          label={balance >= tmt ? `${tmt} BP bilen tölenmek` : "Balans doldur we tölenmek"}
          loadingLabel="Işlenýär..."
          loading={loading}
          disabled={loading}
          onPress={handlePay}
          color={colors.primary}
          size="lg"
          icon={<Ionicons name="wallet-outline" size={18} color="#fff" />}
        />
      </View>

      <BPCheckoutModal
        visible={showSimTopUp}
        onClose={() => setShowSimTopUp(false)}
        serviceName={`SIM Kart · ${UZ_OPERATORS.find(o => o.id === operator)?.name ?? operator} · ${simPhone}`}
        serviceAmount={tmt}
        currentBalance={balance}
        deviceId={deviceId}
        onPaymentComplete={() => {
          setShowSimTopUp(false);
          saveOrder("sim-topup-orders", { operator, simPhone, amount: selected, tmtAmount: tmt, payMethod: "bonus", deviceId, status: "pending" })
            .then(() => addToHistory({ type: "sim", title: "SIM Kart töleg", details: `${UZ_OPERATORS.find(o => o.id === operator)?.name} · ${simPhone} · ${selected} UZS`, amount: selected ?? 0, amountLabel: `-${tmt} BP`, simPhone, operator }))
            .then(() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setDone(true); })
            .catch(() => Alert.alert("Ýalňyşlyk", "Sargyt saklanyp bilinmedi."));
        }}
      />
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
