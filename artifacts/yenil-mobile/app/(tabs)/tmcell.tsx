import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  Alert, ActivityIndicator, Platform, Image, Dimensions,
} from "react-native";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
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
interface BonusPulSectionProps {
  colors: ReturnType<typeof useColors>;
  autoAmount?: number;
  autoMethod?: "terminal" | "card";
}

function BonusPulSection({ colors, autoAmount, autoMethod }: BonusPulSectionProps) {
  const [mode, setMode] = useState<"buy" | "sell" | "transfer">("buy");
  const { balance, deviceId, sendBP } = useBonusPul();

  // buy state
  const [selectedBuy, setSelectedBuy] = useState<number | null>(autoAmount ?? null);
  const [buyAmountText, setBuyAmountText] = useState(autoAmount ? String(autoAmount) : "");
  const [buyPhone, setBuyPhone] = useState("");
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyDone, setBuyDone] = useState(false);
  const [showPayment, setShowPayment] = useState(!!autoMethod);
  const [buyPayMethod, setBuyPayMethod] = useState<"" | "terminal" | "card">(autoMethod ?? "");
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

  const sellAmtNum = parseFloat(sellAmount) || 0;
  const cashoutCommission = parseFloat((sellAmtNum * COMMISSION_RATES.tmcell_cashout).toFixed(2));
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

  const resetBuy = () => { setBuyDone(false); setSelectedBuy(null); setBuyAmountText(""); setBuyPhone(""); setShowPayment(false); setBuyPayMethod(""); setBuyCardBank(""); setBuyCardType(""); setBuyCardLast4(""); };
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
          /* ── Success screen ── */
          <View style={s.successBox}>
            <View style={[s.buySuccessCircle, { backgroundColor: colors.primary + "18" }]}>
              <Ionicons name="checkmark-circle" size={52} color={colors.primary} />
            </View>
            <Text style={[s.successTitle, { color: colors.foreground }]}>Haýyşnama kabul edildi!</Text>
            <Text style={[s.successDesc, { color: colors.mutedForeground }]}>
              Ýakyn wagtda {selectedBuy} BP hasabyňyza goşular.{"\n"}
              Sorag üçin: +993 71 789091
            </Text>
            <Pressable onPress={resetBuy} style={[s.primaryBtn, { backgroundColor: colors.primary, marginTop: 4 }]}>
              <Ionicons name="refresh-outline" size={17} color="#fff" />
              <Text style={s.primaryBtnText}>Täzeden almak</Text>
            </Pressable>
          </View>
        ) : !showPayment ? (
          /* ══════════════════════════════════════════════
             STEP 1 — Mukdar saýla + töleg usulyny saýla
             ══════════════════════════════════════════════ */
          <>
            {/* ── Amount input card ── */}
            <View style={[s.buyAmountCard, {
              backgroundColor: colors.card,
              borderColor: selectedBuy ? colors.primary : colors.border,
            }]}>
              <View style={s.buyAmountTop}>
                <View style={[s.buyAmountIconWrap, { backgroundColor: colors.primary + "15" }]}>
                  <MaterialCommunityIcons name="wallet-outline" size={20} color={colors.primary} />
                </View>
                <Text style={[s.buyAmountCardLabel, { color: colors.mutedForeground }]}>Almak isleýän mukdaryňyz</Text>
              </View>
              <View style={s.buyAmountInputRow}>
                <TextInput
                  value={buyAmountText}
                  onChangeText={t => {
                    const clean = t.replace(/[^0-9]/g, "");
                    setBuyAmountText(clean);
                    setSelectedBuy(clean ? parseInt(clean, 10) : null);
                  }}
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground + "60"}
                  keyboardType="number-pad"
                  style={[s.buyAmountInput, { color: selectedBuy ? colors.primary : colors.foreground }]}
                />
                <View style={[s.buyAmountUnit, { backgroundColor: colors.primary + "12" }]}>
                  <Text style={[s.buyAmountUnitText, { color: colors.primary }]}>BP</Text>
                </View>
              </View>
              {/* Quick chips */}
              <View style={s.buyChipRow}>
                {BP_AMOUNTS.map(a => (
                  <Pressable
                    key={a}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setBuyAmountText(String(a)); setSelectedBuy(a); }}
                    style={[s.buyChip, {
                      backgroundColor: selectedBuy === a ? colors.primary : colors.muted,
                      borderColor: selectedBuy === a ? colors.primary : colors.border,
                    }]}
                  >
                    <Text style={[s.buyChipText, { color: selectedBuy === a ? "#fff" : colors.mutedForeground }]}>{a} BP</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* ── Rate note ── */}
            <View style={[s.buyRateNote, { backgroundColor: colors.primary + "0a", borderColor: colors.primary + "25" }]}>
              <MaterialCommunityIcons name="information-outline" size={13} color={colors.primary} />
              <Text style={[s.buyRateNoteText, { color: colors.primary }]}>
                1 BP = 1 TMT • Töleg usulyna görä komissiýa goşulýar
              </Text>
            </View>

            {/* ── Divider ── */}
            <View style={s.buyDivider}>
              <View style={[s.buyDividerLine, { backgroundColor: colors.border }]} />
              <Text style={[s.buyDividerText, { color: colors.mutedForeground }]}>Töleg usulyny saýlaň</Text>
              <View style={[s.buyDividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* ── Payment method cards ── */}
            {([
              {
                id: "terminal" as const,
                label: "TMCell Terminal",
                desc: "Görkezilen nomerlere pul geçiriň",
                icon: "phone-portrait-outline" as const,
                color: colors.primary,
                commissionRate: COMMISSION_RATES.tmcell_topup,
              },
              {
                id: "card" as const,
                label: "Bank kartasy",
                desc: "Karta arkaly töleg (Visa / MC / Altyn)",
                icon: "card-outline" as const,
                color: "#6366f1",
                commissionRate: COMMISSION_RATES.bank_topup,
              },
            ]).map((pm) => {
              const bp = selectedBuy ?? 0;
              const commAmt = Math.ceil(bp * pm.commissionRate);
              const totalTmt = bp + commAmt;
              const pct = Math.round(pm.commissionRate * 100);

              return (
                <Pressable
                  key={pm.id}
                  onPress={() => {
                    if (!selectedBuy || selectedBuy <= 0) {
                      Alert.alert("Mukdar", "Ilki mukdar giriziň!");
                      return;
                    }
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setBuyPayMethod(pm.id);
                    setShowPayment(true);
                  }}
                  style={({ pressed }) => [
                    s.buyMethodCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: pm.color + "55",
                      opacity: pressed ? 0.88 : 1,
                    },
                  ]}
                >
                  {/* Left: icon */}
                  <View style={[s.buyMethodIconWrap, { backgroundColor: pm.color + "15" }]}>
                    <Ionicons name={pm.icon} size={22} color={pm.color} />
                  </View>

                  {/* Center: name + commission + desc */}
                  <View style={{ flex: 1 }}>
                    <View style={s.buyMethodNameRow}>
                      <Text style={[s.buyMethodName, { color: colors.foreground }]}>{pm.label}</Text>
                      <View style={[s.buyMethodPctBadge, { backgroundColor: pm.color + "18" }]}>
                        <Text style={[s.buyMethodPctText, { color: pm.color }]}>+{pct}%</Text>
                      </View>
                    </View>
                    <Text style={[s.buyMethodDesc, { color: colors.mutedForeground }]}>{pm.desc}</Text>
                  </View>

                  {/* Right: total cost block */}
                  {bp > 0 ? (
                    <View style={[s.buyMethodCostBlock, { borderColor: pm.color + "30", backgroundColor: pm.color + "08" }]}>
                      <Text style={[s.buyMethodCostTmt, { color: pm.color }]}>{totalTmt}</Text>
                      <Text style={[s.buyMethodCostUnit, { color: pm.color + "99" }]}>TMT</Text>
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color={pm.color + "80"} />
                  )}
                </Pressable>
              );
            })}

            {/* ── Commission explainer ── */}
            {selectedBuy ? (
              <View style={[s.buyExplainer, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <View style={s.buyExplainerRow}>
                  <Text style={[s.buyExplainerKey, { color: colors.mutedForeground }]}>Satyn alynýan mukdar</Text>
                  <Text style={[s.buyExplainerVal, { color: colors.foreground }]}>{selectedBuy} BP</Text>
                </View>
                <View style={[s.buyExplainerDivider, { backgroundColor: colors.border }]} />
                <View style={s.buyExplainerRow}>
                  <Text style={[s.buyExplainerKey, { color: colors.mutedForeground }]}>TMCell Terminal (+30%)</Text>
                  <Text style={[s.buyExplainerVal, { color: colors.primary, fontWeight: "800" }]}>
                    {Math.ceil(selectedBuy * (1 + COMMISSION_RATES.tmcell_topup))} TMT töleýärsiňiz
                  </Text>
                </View>
                <View style={s.buyExplainerRow}>
                  <Text style={[s.buyExplainerKey, { color: colors.mutedForeground }]}>Bank kartasy (+15%)</Text>
                  <Text style={[s.buyExplainerVal, { color: "#6366f1", fontWeight: "800" }]}>
                    {Math.ceil(selectedBuy * (1 + COMMISSION_RATES.bank_topup))} TMT töleýärsiňiz
                  </Text>
                </View>
              </View>
            ) : (
              <View style={[s.buyExplainer, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Text style={[s.buyExplainerHint, { color: colors.mutedForeground }]}>
                  ↑ Mukdary giriziň — her usul üçin tölenýän TMT awtomatik hasaplanar
                </Text>
              </View>
            )}
          </>
        ) : buyPayMethod === "terminal" ? (
          /* ══════════════════════════════════════════════
             STEP 2a — TMCell Terminal töleg görkezmeleri
             ══════════════════════════════════════════════ */
          (() => {
            const bp = selectedBuy ?? 0;
            const commAmt = Math.ceil(bp * COMMISSION_RATES.tmcell_topup);
            const totalTmt = bp + commAmt;
            return (
              <>
                {/* Back */}
                <Pressable onPress={() => { setBuyPayMethod(""); setShowPayment(false); }} style={s.buyBackRow}>
                  <Feather name="arrow-left" size={15} color={colors.mutedForeground} />
                  <Text style={[s.buyBackText, { color: colors.mutedForeground }]}>Yza dön</Text>
                </Pressable>

                {/* Method badge */}
                <View style={s.buyStepHeader}>
                  <View style={[s.buyStepIconWrap, { backgroundColor: colors.primary + "15" }]}>
                    <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[s.buyStepTitle, { color: colors.foreground }]}>TMCell Terminal</Text>
                    <Text style={[s.buyStepSub, { color: colors.mutedForeground }]}>Aşakdaky nomerlere pul geçiriň</Text>
                  </View>
                </View>

                {/* Big total card */}
                <View style={[s.buyTotalCard, { backgroundColor: colors.primary + "0d", borderColor: colors.primary + "40" }]}>
                  <Text style={[s.buyTotalCardLabel, { color: colors.mutedForeground }]}>GEÇIRMELI MUKDAR</Text>
                  <Text style={[s.buyTotalCardAmount, { color: colors.primary }]}>{totalTmt} TMT</Text>
                  {/* Breakdown */}
                  <View style={[s.buyTotalBreakRow, { borderTopColor: colors.primary + "25" }]}>
                    <View style={s.buyBreakItem}>
                      <Text style={[s.buyBreakKey, { color: colors.mutedForeground }]}>Almak</Text>
                      <Text style={[s.buyBreakVal, { color: colors.foreground }]}>{bp} BP</Text>
                    </View>
                    <Ionicons name="add" size={14} color={colors.mutedForeground} />
                    <View style={s.buyBreakItem}>
                      <Text style={[s.buyBreakKey, { color: colors.mutedForeground }]}>Komissiýa (+30%)</Text>
                      <Text style={[s.buyBreakVal, { color: colors.foreground }]}>{commAmt} TMT</Text>
                    </View>
                    <Ionicons name="remove" size={14} color={colors.mutedForeground} style={{ opacity: 0 }} />
                    <View style={s.buyBreakItem}>
                      <Text style={[s.buyBreakKey, { color: colors.primary }]}>Jemi</Text>
                      <Text style={[s.buyBreakVal, { color: colors.primary, fontWeight: "900" }]}>{totalTmt} TMT</Text>
                    </View>
                  </View>
                </View>

                {/* Phone numbers */}
                <View style={[s.buyPhonesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={s.buyPhonesHeader}>
                    <Ionicons name="call-outline" size={15} color={colors.primary} />
                    <Text style={[s.buyPhonesTitle, { color: colors.foreground }]}>Şu nomerleriň BIRINE geçiriň</Text>
                  </View>
                  {PAYMENT_PHONES.map((p, i) => (
                    <View key={i} style={[s.buyPhoneRow, i < PAYMENT_PHONES.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                      <View style={[s.buyPhoneDot, { backgroundColor: colors.primary + "20" }]}>
                        <Text style={[{ fontSize: 10, fontWeight: "800", color: colors.primary }]}>{i + 1}</Text>
                      </View>
                      <Text style={[s.buyPhoneNum, { color: colors.primary }]}>{p}</Text>
                    </View>
                  ))}
                </View>

                {/* User phone input */}
                <View style={{ marginTop: 14 }}>
                  <Text style={[s.buyFieldLabel, { color: colors.mutedForeground }]}>Siziň TMCell nomeriňiz (tassyklama üçin)</Text>
                  <TextInput
                    value={buyPhone}
                    onChangeText={setBuyPhone}
                    placeholder="+993 XX XXXXXX"
                    placeholderTextColor={colors.mutedForeground + "80"}
                    keyboardType="phone-pad"
                    style={[s.buyInput, {
                      backgroundColor: colors.card,
                      borderColor: buyPhone.length >= 8 ? colors.primary : colors.border,
                      color: colors.foreground,
                    }]}
                  />
                </View>

                <View style={{ marginTop: 14 }}>
                  <PessimisticButton
                    label={`Töleg geçirdim — ${totalTmt} TMT`}
                    loadingLabel="Barlanýar..."
                    loading={buyLoading}
                    disabled={buyLoading || !buyPhone.trim()}
                    onPress={handleBuy}
                    color={colors.primary}
                    size="lg"
                    icon={<Ionicons name="checkmark-circle-outline" size={18} color="#fff" />}
                  />
                </View>
                <Text style={[s.buyHint, { color: colors.mutedForeground }]}>
                  Töleg geçirenden soň tassykla düwmesine basyň. Operator tassyklandan soň BP hasabyňyza goşular.
                </Text>
              </>
            );
          })()
        ) : (
          /* ══════════════════════════════════════════════
             STEP 2b — Bank kartasy töleg görkezmeleri
             ══════════════════════════════════════════════ */
          (() => {
            const bp = selectedBuy ?? 0;
            const commAmt = Math.ceil(bp * COMMISSION_RATES.bank_topup);
            const totalTmt = bp + commAmt;
            return (
              <>
                {/* Back */}
                <Pressable onPress={() => { setBuyPayMethod(""); setShowPayment(false); }} style={s.buyBackRow}>
                  <Feather name="arrow-left" size={15} color={colors.mutedForeground} />
                  <Text style={[s.buyBackText, { color: colors.mutedForeground }]}>Yza dön</Text>
                </Pressable>

                {/* Method badge */}
                <View style={s.buyStepHeader}>
                  <View style={[s.buyStepIconWrap, { backgroundColor: "#6366f115" }]}>
                    <Ionicons name="card-outline" size={20} color="#6366f1" />
                  </View>
                  <View>
                    <Text style={[s.buyStepTitle, { color: colors.foreground }]}>Bank kartasy</Text>
                    <Text style={[s.buyStepSub, { color: colors.mutedForeground }]}>Aşakdaky karta pul geçiriň</Text>
                  </View>
                </View>

                {/* Merchant card visual */}
                <View style={[s.buyMerchantCard, { backgroundColor: "#6366f1" }]}>
                  <View style={s.buyMerchantTop}>
                    <Text style={s.buyMerchantBankLabel}>TÖLEG KART</Text>
                    <Ionicons name="card" size={20} color="rgba(255,255,255,0.6)" />
                  </View>
                  <Text style={s.buyMerchantNum}>{MERCHANT_CARD}</Text>
                  <View style={s.buyMerchantBottom}>
                    <Text style={s.buyMerchantBank}>Halkbank · Türkmenistan</Text>
                    <View style={s.buyMerchantAmtWrap}>
                      <Text style={s.buyMerchantAmtLabel}>Geçirilmeli</Text>
                      <Text style={s.buyMerchantAmt}>{totalTmt} TMT</Text>
                    </View>
                  </View>
                </View>

                {/* Breakdown */}
                <View style={[s.buyTotalCard, { backgroundColor: "#6366f10d", borderColor: "#6366f140" }]}>
                  <Text style={[s.buyTotalCardLabel, { color: colors.mutedForeground }]}>TÖLEG HASAPLAMASY</Text>
                  <Text style={[s.buyTotalCardAmount, { color: "#6366f1" }]}>{totalTmt} TMT</Text>
                  <View style={[s.buyTotalBreakRow, { borderTopColor: "#6366f125" }]}>
                    <View style={s.buyBreakItem}>
                      <Text style={[s.buyBreakKey, { color: colors.mutedForeground }]}>Almak</Text>
                      <Text style={[s.buyBreakVal, { color: colors.foreground }]}>{bp} BP</Text>
                    </View>
                    <Ionicons name="add" size={14} color={colors.mutedForeground} />
                    <View style={s.buyBreakItem}>
                      <Text style={[s.buyBreakKey, { color: colors.mutedForeground }]}>Komissiýa (+15%)</Text>
                      <Text style={[s.buyBreakVal, { color: colors.foreground }]}>{commAmt} TMT</Text>
                    </View>
                    <Ionicons name="remove" size={14} color={colors.mutedForeground} style={{ opacity: 0 }} />
                    <View style={s.buyBreakItem}>
                      <Text style={[s.buyBreakKey, { color: "#6366f1" }]}>Jemi</Text>
                      <Text style={[s.buyBreakVal, { color: "#6366f1", fontWeight: "900" }]}>{totalTmt} TMT</Text>
                    </View>
                  </View>
                </View>

                {/* Bank selection */}
                <Text style={[s.buyFieldLabel, { color: colors.mutedForeground, marginTop: 14 }]}>Siziň bankyňyz</Text>
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

                {/* Card type */}
                <Text style={[s.buyFieldLabel, { color: colors.mutedForeground, marginTop: 14 }]}>Kart görnüşi</Text>
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

                {/* Last 4 */}
                <Text style={[s.buyFieldLabel, { color: colors.mutedForeground, marginTop: 14 }]}>Kartyňyzyň soňky 4 sany</Text>
                <TextInput
                  value={buyCardLast4}
                  onChangeText={(t) => setBuyCardLast4(t.replace(/\D/g, "").slice(0, 4))}
                  placeholder="• • • •"
                  placeholderTextColor={colors.mutedForeground + "80"}
                  keyboardType="number-pad"
                  maxLength={4}
                  style={[s.buyInput, s.buyInputLarge, {
                    backgroundColor: colors.card,
                    borderColor: buyCardLast4.length === 4 ? "#6366f1" : colors.border,
                    color: colors.foreground,
                  }]}
                />

                {/* Phone */}
                <Text style={[s.buyFieldLabel, { color: colors.mutedForeground, marginTop: 14 }]}>Siziň telefon nomeriňiz</Text>
                <TextInput
                  value={buyPhone}
                  onChangeText={setBuyPhone}
                  placeholder="+993 XX XXXXXX"
                  placeholderTextColor={colors.mutedForeground + "80"}
                  keyboardType="phone-pad"
                  style={[s.buyInput, {
                    backgroundColor: colors.card,
                    borderColor: buyPhone.length >= 8 ? "#6366f1" : colors.border,
                    color: colors.foreground,
                  }]}
                />

                <View style={{ marginTop: 14 }}>
                  <PessimisticButton
                    label={`Töleg geçirdim — ${totalTmt} TMT`}
                    loadingLabel="Barlanýar..."
                    loading={buyLoading}
                    disabled={buyLoading || !buyPhone.trim() || !buyCardBank || !buyCardType || buyCardLast4.length < 4}
                    onPress={handleBuy}
                    color="#6366f1"
                    size="lg"
                    icon={<Ionicons name="card-outline" size={18} color="#fff" />}
                  />
                </View>
                <Text style={[s.buyHint, { color: colors.mutedForeground }]}>
                  Töleg geçirenden soň tassykla düwmesine basyň. Operator tassyklandan soň BP hasabyňyza goşular.
                </Text>
              </>
            );
          })()
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


function CurrencySection({ colors }: { colors: ReturnType<typeof useColors> }) {
  const { balance, deduct, deviceId } = useBonusPul();
  type CTab = "deposit" | "withdraw";
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
          { id: "deposit"  as const, icon: "arrow-down-circle-outline" as const, label: "Depozit"  },
          { id: "withdraw" as const, icon: "arrow-up-circle-outline"   as const, label: "Çykaryş" },
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
            <View style={cs.depLoadingWrap}>
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
            <View style={cs.depLoadingWrap}>
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

      <BPCheckoutModal
        visible={wdShowCheckout}
        onClose={() => setWdShowCheckout(false)}
        serviceName={`Kripto Çykaryş · ${wdBPNum} BP`}
        serviceAmount={wdBPNum}
        currentBalance={balance}
        deviceId={deviceId}
        onPaymentComplete={() => { setWdShowCheckout(false); submitWithdraw(); }}
      />
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
  const [simAmountText, setSimAmountText] = useState("");
  const [showSimTopUp, setShowSimTopUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const simAmountNum = parseFloat(simAmountText) || 0;
  const tmt = parseFloat((simAmountNum * UZS_RATE).toFixed(1));
  const opInfo = UZ_OPERATORS.find(o => o.id === operator);
  const opColor = opInfo?.color ?? colors.primary;

  const canSubmit = !!operator && simPhone.trim().length >= 9 && simAmountNum > 0;

  async function handlePay() {
    if (!canSubmit) { Alert.alert("Ýalňyşlyk", "Ähli meýdançalary dolduryň!"); return; }
    if (balance < tmt) { setShowSimTopUp(true); return; }
    setLoading(true);
    try {
      const result = await deductBalanceAtomic(deviceId, tmt);
      if (!result.success) { setShowSimTopUp(true); setLoading(false); return; }
      await saveOrder("sim-topup-orders", { operator, simPhone, amount: simAmountNum, tmtAmount: tmt, payMethod: "bonus", deviceId, status: "pending" });
      await addToHistory({ type: "sim", title: "SIM Kart töleg", details: `${opInfo?.name} · ${simPhone} · ${simAmountNum} UZS`, amount: simAmountNum, amountLabel: `-${tmt} BP`, simPhone, operator });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(true);
    } catch { Alert.alert("Ýalňyşlyk", "Bilinmeýän ýalňyşlyk"); }
    finally { setLoading(false); }
  }

  function reset() { setDone(false); setOperator(null); setSimPhone(""); setSimAmountText(""); }

  if (done) return (
    <View style={s.successBox}>
      <View style={[s.successIcon, { backgroundColor: "#ede9fe" }]}>
        <Ionicons name="phone-portrait" size={40} color="#7c3aed" />
      </View>
      <Text style={[s.successTitle, { color: colors.foreground }]}>Üstünlikli!</Text>
      <Text style={[s.successDesc, { color: colors.mutedForeground }]}>
        SIM kart töleg haýyşnamaňyz kabul edildi.{"\n"}Iň gysga wagtda işleniler.
      </Text>
      <Pressable onPress={reset} style={[s.primaryBtn, { backgroundColor: "#7c3aed", paddingHorizontal: 32 }]}>
        <Ionicons name="refresh-outline" size={18} color="#fff" />
        <Text style={s.primaryBtnText}>Täzeden</Text>
      </Pressable>
    </View>
  );

  return (
    <>
      {/* Rate banner */}
      <View style={[s.simRateBanner, { backgroundColor: "#7c3aed12", borderColor: "#7c3aed30" }]}>
        <View style={[s.simRateIcon, { backgroundColor: "#7c3aed20" }]}>
          <Ionicons name="cellular-outline" size={16} color="#7c3aed" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.simRateTitle, { color: colors.foreground }]}>Özbegistan SIM Kart</Text>
          <Text style={[s.simRateSub, { color: colors.mutedForeground }]}>1 UZS ≈ {UZS_RATE} TMT · Islendik mukdar</Text>
        </View>
      </View>

      {/* ── Operator chips ── */}
      <Text style={[s.simFieldLabel, { color: colors.mutedForeground }]}>OPERATOR</Text>
      <View style={s.simOpRow}>
        {UZ_OPERATORS.map(op => {
          const active = operator === op.id;
          return (
            <Pressable
              key={op.id}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setOperator(active ? null : op.id); }}
              style={[s.simOpChip, {
                backgroundColor: active ? op.color : colors.card,
                borderColor: active ? op.color : colors.border,
                shadowColor: active ? op.color : "transparent",
                shadowOpacity: active ? 0.35 : 0,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: active ? 4 : 0,
              }]}
            >
              <View style={[s.simOpDot, { backgroundColor: active ? "rgba(255,255,255,0.3)" : op.color + "25" }]}>
                <Ionicons name="cellular-outline" size={13} color={active ? "#fff" : op.color} />
              </View>
              <Text style={[s.simOpChipText, { color: active ? "#fff" : colors.foreground }]}>{op.name}</Text>
              {active && <Ionicons name="checkmark-circle" size={15} color="#fff" />}
            </Pressable>
          );
        })}
      </View>

      {/* ── Phone number input ── */}
      <Text style={[s.simFieldLabel, { color: colors.mutedForeground }]}>TELEFON BELGI</Text>
      <View style={[s.simInputWrap, {
        backgroundColor: colors.card,
        borderColor: simPhone.length >= 9 ? opColor : colors.border,
      }]}>
        <View style={[s.simInputIcon, { backgroundColor: opColor + "15" }]}>
          <Ionicons name="call-outline" size={17} color={opColor} />
        </View>
        <TextInput
          value={simPhone}
          onChangeText={setSimPhone}
          placeholder="+998 XX XXX XX XX"
          placeholderTextColor={colors.mutedForeground + "90"}
          keyboardType="phone-pad"
          style={[s.simInputField, { color: colors.foreground }]}
        />
        {simPhone.length >= 9 && (
          <Ionicons name="checkmark-circle" size={18} color={opColor} />
        )}
      </View>

      {/* ── Amount input ── */}
      <Text style={[s.simFieldLabel, { color: colors.mutedForeground }]}>TÖLEG MUKDARY</Text>
      <View style={[s.simInputWrap, {
        backgroundColor: colors.card,
        borderColor: simAmountNum > 0 ? opColor : colors.border,
      }]}>
        <View style={[s.simInputIcon, { backgroundColor: opColor + "15" }]}>
          <Ionicons name="phone-portrait-outline" size={17} color={opColor} />
        </View>
        <TextInput
          value={simAmountText}
          onChangeText={t => setSimAmountText(t.replace(/[^0-9]/g, ""))}
          placeholder="0"
          placeholderTextColor={colors.mutedForeground + "90"}
          keyboardType="number-pad"
          style={[s.simInputField, { color: colors.foreground }]}
        />
        <Text style={[s.simInputSuffix, { color: colors.mutedForeground }]}>UZS</Text>
      </View>

      {/* ── Real-time calculation ── */}
      {simAmountNum > 0 ? (
        <View style={[s.simCalcCard, { backgroundColor: opColor + "0d", borderColor: opColor + "30" }]}>
          <View style={s.simCalcRow}>
            <Text style={[s.simCalcLabel, { color: colors.mutedForeground }]}>Kirgiziladigan UZS</Text>
            <Text style={[s.simCalcVal, { color: colors.foreground }]}>{simAmountNum.toLocaleString()} UZS</Text>
          </View>
          <View style={[s.simCalcDivider, { backgroundColor: opColor + "20" }]} />
          <View style={s.simCalcRow}>
            <Text style={[s.simCalcLabel, { color: colors.mutedForeground }]}>Kurs</Text>
            <Text style={[s.simCalcVal, { color: colors.foreground }]}>1 UZS = {UZS_RATE} TMT</Text>
          </View>
          <View style={[s.simCalcDivider, { backgroundColor: opColor + "20" }]} />
          <View style={s.simCalcRow}>
            <Text style={[{ fontSize: 13, fontWeight: "700", color: colors.foreground }]}>Tölenjek BP</Text>
            <Text style={[{ fontSize: 20, fontWeight: "900", color: opColor }]}>{tmt} BP</Text>
          </View>
          {balance > 0 && (
            <View style={[s.simBalRow, { borderTopColor: opColor + "20" }]}>
              <Ionicons
                name={balance >= tmt ? "checkmark-circle" : "alert-circle"}
                size={14}
                color={balance >= tmt ? "#059669" : "#f59e0b"}
              />
              <Text style={[s.simBalText, { color: balance >= tmt ? "#059669" : "#f59e0b" }]}>
                {balance >= tmt ? `Balans ýeterlik (${balance.toFixed(1)} BP)` : `Ýetmezçilik: ${(tmt - balance).toFixed(1)} BP`}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <Text style={[s.simCalcHint, { color: colors.mutedForeground }]}>
          UZS mukdary girizeniňizde töleg BP awtomatik hasaplanar
        </Text>
      )}

      {/* ── Pay button ── */}
      <View style={{ marginTop: 12 }}>
        <PessimisticButton
          label={canSubmit ? (balance >= tmt ? `${tmt} BP tölemek` : "Balans doldur we tölenmek") : "Maglumatlary dolduryň"}
          loadingLabel="Işlenýär..."
          loading={loading}
          disabled={loading || !canSubmit}
          onPress={handlePay}
          color={canSubmit ? (operator ? opColor : colors.primary) : colors.muted}
          size="lg"
          icon={<Ionicons name="phone-portrait-outline" size={18} color={canSubmit ? "#fff" : colors.mutedForeground} />}
        />
      </View>

      <BPCheckoutModal
        visible={showSimTopUp}
        onClose={() => setShowSimTopUp(false)}
        serviceName={`SIM Kart · ${opInfo?.name ?? operator} · ${simPhone}`}
        serviceAmount={tmt}
        currentBalance={balance}
        deviceId={deviceId}
        onPaymentComplete={() => {
          setShowSimTopUp(false);
          saveOrder("sim-topup-orders", { operator, simPhone, amount: simAmountNum, tmtAmount: tmt, payMethod: "bonus", deviceId, status: "pending" })
            .then(() => addToHistory({ type: "sim", title: "SIM Kart töleg", details: `${opInfo?.name} · ${simPhone} · ${simAmountNum} UZS`, amount: simAmountNum, amountLabel: `-${tmt} BP`, simPhone, operator: operator ?? undefined }))
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
  const params = useLocalSearchParams<{ autoBonus?: string; amount?: string; method?: string }>();
  const autoBonus = params.autoBonus === "1";
  const autoAmount = autoBonus && params.amount ? parseInt(params.amount, 10) : undefined;
  const autoMethod = autoBonus && params.method === "card" ? "card" as const : autoBonus && params.method === "terminal" ? "terminal" as const : undefined;
  const [tab, setTab] = useState<Tab>(autoBonus ? "bonus" : "bonus");

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
          <Text style={s.balanceText}>{balance.toFixed(1)} BP</Text>
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
        {tab === "bonus" && <BonusPulSection colors={colors} autoAmount={autoAmount} autoMethod={autoMethod} />}
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
  payMethodCard: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 18, borderWidth: 1.5, padding: 16 },
  payMethodIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  payMethodLabel: { fontSize: 15, fontWeight: "700", marginBottom: 1 },
  pmCommissionText: { fontSize: 12, fontWeight: "700", marginBottom: 2 },
  payMethodDesc: { fontSize: 11.5, lineHeight: 16 },
  pmSummaryRow: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, marginTop: 6 },
  pmSummaryText: { fontSize: 12, fontWeight: "600" },
  pmAmountCol: { alignItems: "flex-end", gap: 4 },
  pmAmountTmt: { fontSize: 15, fontWeight: "800", letterSpacing: -0.3 },
  pmPercentBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  pmPercentText: { fontSize: 11, fontWeight: "800" },

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

  // ── Bonus Pul "Almak" big amount input ──────────────────────────
  bigInputCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 2, borderRadius: 18, padding: 16, marginBottom: 10,
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 3,
  },
  bigInputIconWrap: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  bigInputField: { flex: 1, fontSize: 32, fontWeight: "900", letterSpacing: -0.5 },
  bigInputSuffix: { fontSize: 16, fontWeight: "700" },
  convBadge: {
    flexDirection: "row", alignItems: "center", gap: 7,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
    alignSelf: "flex-start", marginBottom: 14,
  },
  convBadgeText: { fontSize: 13, fontWeight: "700" },
  convHint: { fontSize: 12, marginBottom: 14, lineHeight: 18 },
  quickChipRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 16 },
  quickChip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  quickChipText: { fontSize: 13, fontWeight: "700" },

  // ── SIM Kart single-screen styles ───────────────────────────────
  simRateBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 18,
  },
  simRateIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  simRateTitle: { fontSize: 13, fontWeight: "800" },
  simRateSub: { fontSize: 11, marginTop: 1 },
  simFieldLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8, marginBottom: 8 },
  simOpRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  simOpChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 9,
  },
  simOpDot: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  simOpChipText: { fontSize: 13, fontWeight: "700" },
  simInputWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1.5, borderRadius: 14, padding: 13, marginBottom: 14,
  },
  simInputIcon: { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  simInputField: { flex: 1, fontSize: 16, fontWeight: "600" },
  simInputSuffix: { fontSize: 13, fontWeight: "700" },
  simCalcCard: {
    borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 4, gap: 10,
  },
  simCalcRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  simCalcDivider: { height: 1 },
  simCalcLabel: { fontSize: 12, fontWeight: "600" },
  simCalcVal: { fontSize: 13, fontWeight: "700" },
  simBalRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingTop: 10, borderTopWidth: 1,
  },
  simBalText: { fontSize: 12, fontWeight: "600", flex: 1 },
  simCalcHint: { fontSize: 12, marginBottom: 4, lineHeight: 18, fontStyle: "italic" },

  // ── Bonus Pul "Almak" redesign styles ──────────────────────────────
  // Amount input card
  buyAmountCard: {
    borderWidth: 1.5, borderRadius: 20, padding: 16, marginBottom: 12,
  },
  buyAmountTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  buyAmountIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  buyAmountCardLabel: { fontSize: 12, fontWeight: "600" },
  buyAmountInputRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  buyAmountInput: { flex: 1, fontSize: 38, fontWeight: "900", letterSpacing: -1 },
  buyAmountUnit: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  buyAmountUnitText: { fontSize: 16, fontWeight: "800" },
  buyChipRow: { flexDirection: "row", gap: 8 },
  buyChip: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  buyChipText: { fontSize: 12, fontWeight: "700" },

  // Rate note
  buyRateNote: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    marginBottom: 16,
  },
  buyRateNoteText: { fontSize: 11.5, fontWeight: "600", flex: 1, lineHeight: 17 },

  // Divider
  buyDivider: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  buyDividerLine: { flex: 1, height: 1 },
  buyDividerText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },

  // Payment method cards (step 1)
  buyMethodCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1.5, borderRadius: 18, padding: 14, marginBottom: 10,
  },
  buyMethodIconWrap: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  buyMethodNameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 },
  buyMethodName: { fontSize: 14, fontWeight: "700" },
  buyMethodPctBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  buyMethodPctText: { fontSize: 10, fontWeight: "800" },
  buyMethodDesc: { fontSize: 11.5, lineHeight: 16 },
  buyMethodCostBlock: {
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, minWidth: 68,
  },
  buyMethodCostTmt: { fontSize: 18, fontWeight: "900", letterSpacing: -0.5 },
  buyMethodCostUnit: { fontSize: 10, fontWeight: "700", marginTop: 1 },

  // Commission explainer box
  buyExplainer: {
    borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 4, gap: 8,
  },
  buyExplainerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  buyExplainerKey: { fontSize: 11.5, fontWeight: "600" },
  buyExplainerVal: { fontSize: 12, fontWeight: "700" },
  buyExplainerDivider: { height: 1 },
  buyExplainerHint: { fontSize: 12, lineHeight: 18, textAlign: "center", fontStyle: "italic" },

  // Step 2 — shared
  buyBackRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  buyBackText: { fontSize: 13, fontWeight: "600" },
  buyStepHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  buyStepIconWrap: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  buyStepTitle: { fontSize: 16, fontWeight: "800" },
  buyStepSub: { fontSize: 11.5, marginTop: 1 },

  // Big total card
  buyTotalCard: {
    borderWidth: 1.5, borderRadius: 20, padding: 18, marginBottom: 14, alignItems: "center",
  },
  buyTotalCardLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1, marginBottom: 6 },
  buyTotalCardAmount: { fontSize: 42, fontWeight: "900", letterSpacing: -1.5, marginBottom: 14 },
  buyTotalBreakRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderTopWidth: 1, paddingTop: 12, width: "100%", justifyContent: "center",
  },
  buyBreakItem: { alignItems: "center", flex: 1 },
  buyBreakKey: { fontSize: 10, fontWeight: "600", marginBottom: 3 },
  buyBreakVal: { fontSize: 13, fontWeight: "700" },

  // Phone numbers card (terminal)
  buyPhonesCard: {
    borderWidth: 1, borderRadius: 16, overflow: "hidden", marginBottom: 14,
  },
  buyPhonesHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "transparent",
  },
  buyPhonesTitle: { fontSize: 12, fontWeight: "700" },
  buyPhoneRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  buyPhoneDot: { width: 22, height: 22, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  buyPhoneNum: { fontSize: 15, fontWeight: "800", letterSpacing: 0.3 },

  // Merchant card (card payment)
  buyMerchantCard: {
    borderRadius: 20, padding: 20, marginBottom: 14,
    shadowColor: "#6366f1", shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  buyMerchantTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  buyMerchantBankLabel: { color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  buyMerchantNum: { color: "#fff", fontSize: 19, fontWeight: "800", letterSpacing: 4, marginBottom: 18 },
  buyMerchantBottom: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  buyMerchantBank: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "600" },
  buyMerchantAmtWrap: { alignItems: "flex-end" },
  buyMerchantAmtLabel: { color: "rgba(255,255,255,0.6)", fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  buyMerchantAmt: { color: "#fff", fontSize: 18, fontWeight: "900" },

  // Inputs (step 2)
  buyFieldLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3, marginBottom: 8 },
  buyInput: { borderWidth: 1.5, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  buyInputLarge: { fontSize: 24, fontWeight: "900", letterSpacing: 10, textAlign: "center" },
  buyHint: { fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 10, paddingHorizontal: 8 },

  // Success screen
  buySuccessCircle: { width: 88, height: 88, borderRadius: 28, alignItems: "center", justifyContent: "center" },
});
