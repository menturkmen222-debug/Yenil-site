import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  Alert, Platform, Clipboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";
import { PessimisticButton } from "@/components/PessimisticButton";
import { COMMISSION_RATES, calcCryptoDepositBP, calcCryptoWithdrawUSDT, getCryptoDepositRatePct } from "@/lib/payments";
import { saveOrder } from "@/lib/firebase";

type Network = "trc20" | "bep20" | "ton";
type TabId = "deposit" | "withdraw";

const NETWORKS: { id: Network; name: string; full: string; color: string; fee: number; icon: keyof typeof Ionicons.glyphMap; time: string }[] = [
  { id: "trc20", name: "TRC20", full: "Tron Network", color: "#ef4444", fee: 1.0, icon: "flash-outline", time: "~1-3 min" },
  { id: "bep20", name: "BEP20", full: "Binance Smart Chain", color: "#f59e0b", fee: 0.5, icon: "logo-bitcoin", time: "~3-5 min" },
  { id: "ton", name: "TON", full: "Telegram Open Network", color: "#0088cc", fee: 0.05, icon: "paper-plane-outline", time: "~5 sek" },
];

const WALLET_ADDRESSES: Record<Network, string> = {
  trc20: "TYvmFoX8Swr3G3JBqfbT5qvTtSNr4wH1KR",
  bep20: "0x7a4B2F3E5d8c1A9B6e4F2D7c8a3B5e9F1d4c2A7",
  ton: "UQBvAzI7nB5RFxeJ7c9YpqT8L5m2kNpTgQP4zX6wKjV1hW",
};


const TABS: { id: TabId; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: "deposit", label: "Depozit", icon: "arrow-down-circle-outline" },
  { id: "withdraw", label: "Çykaryş", icon: "arrow-up-circle-outline" },
];

export default function PayScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { balance, deduct, sendBP } = useBonusPul();

  const [tab, setTab] = useState<TabId>("deposit");
  const [mode, setMode] = useState<"main" | "success">("main");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Deposit state
  const [depNetwork, setDepNetwork] = useState<Network>("trc20");
  const [depTxHash, setDepTxHash] = useState("");
  const [depAmount, setDepAmount] = useState("");
  const [depError, setDepError] = useState("");

  // Withdraw state
  const [wdNetwork, setWdNetwork] = useState<Network>("trc20");
  const [wdAddress, setWdAddress] = useState("");
  const [wdAmountBP, setWdAmountBP] = useState("");
  const [wdError, setWdError] = useState("");

  // P2P state

  const topPad = (isWeb ? 0 : insets.top) + 0;

  const wdNet = NETWORKS.find((n) => n.id === wdNetwork)!;
  const wdBp = parseFloat(wdAmountBP) || 0;
  const wdUsdt = wdBp * COMMISSION_RATES.crypto_usdt_per_bp;
  const wdReceive = Math.max(0, wdUsdt - wdNet.fee);

  const depUsdt = parseFloat(depAmount) || 0;
  const depBp = calcCryptoDepositBP(depUsdt);

  function copyAddress(addr: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Clipboard.setString(addr);
    Alert.alert("Kopyalandy!", "Kripto manzil panoya kopyalandy.");
  }

  async function submitDeposit() {
    if (!depTxHash.trim()) { setDepError("TX Hash girizmeli!"); return; }
    if (depUsdt <= 0) { setDepError("Mukdary girizmeli!"); return; }
    if (depTxHash.length < 20) { setDepError("TX Hash ýalňyş görünýär. Barlaň."); return; }
    setLoading(true); setDepError("");
    try {
      await saveOrder("crypto-orders", {
        type: "crypto-deposit", network: depNetwork,
        usdtAmount: depUsdt, bpAmount: depBp,
        txHash: depTxHash.trim(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccessMsg(`${depBp.toFixed(1)} BP balansynyza geçirildi!\n\nTX tassyklanandan soň (${NETWORKS.find((n) => n.id === depNetwork)?.time}) BP hasabynda görüner.`);
      setMode("success");
      setDepTxHash(""); setDepAmount("");
    } catch {
      setDepError("Ulgam ýalňyşlygy. Gaýtadan synanyşyň.");
    } finally { setLoading(false); }
  }

  async function submitWithdraw() {
    if (!wdAddress.trim()) { setWdError("Kripto manzil girizmeli!"); return; }
    if (wdBp <= 0) { setWdError("Mukdary girizmeli!"); return; }
    if (balance < wdBp) { setWdError(`BP ýetmezçilik. Balansiňiz: ${balance.toFixed(2)} BP`); return; }
    if (wdReceive <= 0) { setWdError("Mukdar komissiyadan az. Köpräk giriziň."); return; }
    setLoading(true); setWdError("");
    try {
      await saveOrder("crypto-orders", {
        type: "crypto-withdraw", network: wdNetwork,
        bpAmount: wdBp, usdtAmount: wdUsdt, fee: wdNet.fee,
        receiveAmount: wdReceive, walletAddress: wdAddress.trim(),
      });
      deduct(wdBp);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccessMsg(`Çykaryş talaby kabul edildi!\n\n${wdReceive.toFixed(4)} USDT ${wdAddress.trim().slice(0, 8)}... manziline iberilýär.\n\nGözlenýän wagt: ${wdNet.time}`);
      setMode("success");
      setWdAddress(""); setWdAmountBP("");
    } catch {
      setWdError("Ulgam ýalňyşlygy. Gaýtadan synanyşyň.");
    } finally { setLoading(false); }
  }


  function NetworkCard({ net, selected, onPress }: { net: typeof NETWORKS[0]; selected: boolean; onPress: () => void }) {
    return (
      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
        style={[
          s.networkCard,
          selected
            ? { backgroundColor: net.color + "15", borderColor: net.color, borderWidth: 2 }
            : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
        ]}
      >
        <View style={[s.networkIcon, { backgroundColor: net.color + "20" }]}>
          <Ionicons name={net.icon} size={20} color={net.color} />
        </View>
        <Text style={[s.networkName, { color: selected ? net.color : colors.foreground }]}>{net.name}</Text>
        <Text style={[s.networkFull, { color: colors.mutedForeground }]} numberOfLines={1}>{net.full}</Text>
        <View style={[s.networkFeeBadge, { backgroundColor: net.color + "18" }]}>
          <Text style={[s.networkFeeText, { color: net.color }]}>
            {net.fee === 0.05 ? "0.05" : net.fee} USDT
          </Text>
        </View>
        <Text style={[s.networkTime, { color: colors.mutedForeground }]}>{net.time}</Text>
        {selected && (
          <View style={[s.networkCheck, { backgroundColor: net.color }]}>
            <Ionicons name="checkmark" size={10} color="#fff" />
          </View>
        )}
      </Pressable>
    );
  }

  function DepositTab() {
    const net = NETWORKS.find((n) => n.id === depNetwork)!;
    const addr = WALLET_ADDRESSES[depNetwork];
    return (
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 120 : 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Rate banner */}
        <View style={[s.rateBanner, { backgroundColor: "#059669" + "12", borderColor: "#059669" }]}>
          <Ionicons name="trending-up-outline" size={20} color="#059669" />
          <View style={{ flex: 1 }}>
            <Text style={[s.rateBannerTitle, { color: colors.foreground }]}>
              1 USDT = <Text style={{ color: "#059669" }}>{COMMISSION_RATES.crypto_bp_per_usdt} BP</Text>
            </Text>
            <Text style={[s.rateBannerSub, { color: colors.mutedForeground }]}>Diňe USDT Stablecoin kabul edilýär</Text>
          </View>
        </View>

        {/* Network selector */}
        <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>Tarmogy saýlaň</Text>
        <View style={s.networkRow}>
          {NETWORKS.map((n) => (
            <NetworkCard key={n.id} net={n} selected={depNetwork === n.id} onPress={() => setDepNetwork(n.id)} />
          ))}
        </View>

        {/* Amount input */}
        <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>Iberjek USDT mukdaryňyz</Text>
        <View style={[s.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.inputPrefix, { color: colors.mutedForeground }]}>$</Text>
          <TextInput
            value={depAmount}
            onChangeText={setDepAmount}
            placeholder="0.00"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
            style={[s.input, { color: colors.foreground }]}
          />
          <Text style={[s.inputSuffix, { color: colors.mutedForeground }]}>USDT</Text>
        </View>
        {depUsdt > 0 && (
          <View style={[s.calcPreview, { backgroundColor: colors.primary + "10", borderColor: colors.primary }]}>
            <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
            <Text style={[s.calcText, { color: colors.primary }]}>
              {depUsdt} USDT → <Text style={{ fontWeight: "800" }}>{depBp.toFixed(1)} BP</Text> alarsyňyz
            </Text>
          </View>
        )}

        {/* Wallet address */}
        <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>
          Ýeňil USDT ({net.name}) Manzili
        </Text>
        <Pressable
          onPress={() => copyAddress(addr)}
          style={[s.addressCard, { backgroundColor: colors.card, borderColor: net.color }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[s.addressLabel, { color: colors.mutedForeground }]}>{net.name} • {net.full}</Text>
            <Text style={[s.addressText, { color: colors.foreground }]} selectable>{addr}</Text>
          </View>
          <View style={[s.copyBtn, { backgroundColor: net.color }]}>
            <Ionicons name="copy-outline" size={16} color="#fff" />
          </View>
        </Pressable>
        <Text style={[s.addressNote, { color: colors.mutedForeground }]}>
          Diňe {net.name} tarmagynyň USDT-sini iberiň. Başga token ibermek ýitgä sebäp bolar.
        </Text>

        {/* TX Hash */}
        <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>Tranzaksiýa haşy (TX ID)</Text>
        <View style={[s.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="receipt-outline" size={16} color={colors.mutedForeground} />
          <TextInput
            value={depTxHash}
            onChangeText={setDepTxHash}
            placeholder="0x... ýa-da tranzaksiýa ID"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            style={[s.input, { color: colors.foreground }]}
          />
        </View>
        <Text style={[s.addressNote, { color: colors.mutedForeground }]}>
          Gönderen TX haşyny{" "}
          <Text style={{ fontWeight: "700" }}>Explorer-de</Text>
          {" "}tapyp aşakda giriziň. BP {net.time} içinde geçirilýär.
        </Text>

        {depError ? (
          <View style={[s.errorBox, { backgroundColor: "#fee2e2" }]}>
            <Ionicons name="alert-circle-outline" size={16} color="#dc2626" />
            <Text style={s.errorText}>{depError}</Text>
          </View>
        ) : null}

        <PessimisticButton
          label="Tassyklamak we Ibermek"
          loadingLabel="Iberilýär..."
          loading={loading}
          disabled={loading}
          onPress={submitDeposit}
          color="#059669"
          size="lg"
          icon={<Ionicons name="cloud-upload-outline" size={19} color="#fff" />}
        />

        {/* Step guide */}
        <View style={[s.stepsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.stepsTitle, { color: colors.foreground }]}>Nädip depozit etmeli?</Text>
          {[
            { n: "1", t: "Ýokardan tarmagy saýlaň (TRC20 iň arzan)" },
            { n: "2", t: "Ýeňil manziline USDT iberiň" },
            { n: "3", t: "TX haşyny giriziň we tassyklaň" },
            { n: "4", t: "BP balansynyza awtomatik geçer" },
          ].map((step) => (
            <View key={step.n} style={s.stepRow}>
              <View style={[s.stepNum, { backgroundColor: colors.primary }]}>
                <Text style={s.stepNumText}>{step.n}</Text>
              </View>
              <Text style={[s.stepText, { color: colors.foreground }]}>{step.t}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  function WithdrawTab() {
    return (
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 120 : 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Balance display */}
        <View style={[s.balanceCard, { backgroundColor: colors.primary + "12", borderColor: colors.primary }]}>
          <Ionicons name="wallet-outline" size={22} color={colors.primary} />
          <View>
            <Text style={[s.balanceLabel, { color: colors.mutedForeground }]}>Häzirki balansiňiz</Text>
            <Text style={[s.balanceValue, { color: colors.primary }]}>{balance.toFixed(2)} BP</Text>
          </View>
          <View style={{ flex: 1 }} />
          <View style={[s.rateTag, { backgroundColor: colors.primary + "18" }]}>
            <Text style={[s.rateTagText, { color: colors.primary }]}>1 BP = {COMMISSION_RATES.crypto_usdt_per_bp} USDT</Text>
          </View>
        </View>

        {/* Network selector */}
        <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>Çykaryş tarmagyňyz</Text>
        <View style={s.networkRow}>
          {NETWORKS.map((n) => (
            <NetworkCard key={n.id} net={n} selected={wdNetwork === n.id} onPress={() => setWdNetwork(n.id)} />
          ))}
        </View>

        {/* BP amount */}
        <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>Näçe BP çykarmak isleýärsiňiz?</Text>
        <View style={[s.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="logo-bitcoin" size={16} color={colors.mutedForeground} />
          <TextInput
            value={wdAmountBP}
            onChangeText={setWdAmountBP}
            placeholder="0"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
            style={[s.input, { color: colors.foreground }]}
          />
          <Text style={[s.inputSuffix, { color: colors.mutedForeground }]}>BP</Text>
        </View>

        {/* Fee breakdown */}
        {wdBp > 0 && (
          <View style={[s.feeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.feeTitleText, { color: colors.foreground }]}>Töleg hasaplamasy</Text>
            {[
              { label: "Çykarylýan BP", value: `${wdBp} BP`, muted: false },
              { label: "USDT ýakynlaşdyrma", value: `${wdUsdt.toFixed(4)} USDT`, muted: false },
              { label: `${wdNet.name} Komissiya`, value: `-${wdNet.fee} USDT`, muted: true },
            ].map((row, i) => (
              <View key={i} style={s.feeRow}>
                <Text style={[s.feeRowLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                <Text style={[s.feeRowVal, { color: row.muted ? "#ef4444" : colors.foreground }]}>{row.value}</Text>
              </View>
            ))}
            <View style={[s.feeDivider, { backgroundColor: colors.border }]} />
            <View style={s.feeRow}>
              <Text style={[s.feeRowLabel, { color: colors.foreground, fontWeight: "700" }]}>Alarsyňyz</Text>
              <Text style={[s.feeRowVal, { color: "#059669", fontSize: 18, fontWeight: "800" }]}>
                {wdReceive.toFixed(4)} USDT
              </Text>
            </View>
          </View>
        )}

        {/* Wallet address */}
        <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>
          {wdNet.name} Kripto Manziliniz
        </Text>
        <View style={[s.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="wallet-outline" size={16} color={colors.mutedForeground} />
          <TextInput
            value={wdAddress}
            onChangeText={setWdAddress}
            placeholder={wdNetwork === "bep20" ? "0x..." : wdNetwork === "ton" ? "UQ..." : "T..."}
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            style={[s.input, { color: colors.foreground }]}
          />
        </View>
        <Text style={[s.addressNote, { color: colors.mutedForeground }]}>
          Manzil ýalňyş girizilse, pul yzyna gaýtarylmaýar. Üns bilen barlaň.
        </Text>

        {wdError ? (
          <View style={[s.errorBox, { backgroundColor: "#fee2e2" }]}>
            <Ionicons name="alert-circle-outline" size={16} color="#dc2626" />
            <Text style={s.errorText}>{wdError}</Text>
          </View>
        ) : null}

        <PessimisticButton
          label="Çykaryşy Tassyklamak"
          loadingLabel="Iberilýär..."
          loading={loading}
          disabled={loading}
          onPress={submitWithdraw}
          color={colors.primary}
          size="lg"
          icon={<Ionicons name="send-outline" size={19} color="#fff" />}
        />
      </ScrollView>
    );
  }


  if (mode === "success") {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={[colors.primary, colors.primary + "cc"]}
          style={[s.header, { paddingTop: topPad + 16 }]}
        >
          <Text style={s.headerTitle}>Kripto Töleg</Text>
          <Text style={s.headerSub}>USDT · TRC20 · BEP20 · TON</Text>
        </LinearGradient>
        <View style={s.successContainer}>
          <View style={[s.successIconWrap, { backgroundColor: "#059669" + "15" }]}>
            <Ionicons name="checkmark-circle" size={64} color="#059669" />
          </View>
          <Text style={[s.successTitle, { color: colors.foreground }]}>Üstünlikli!</Text>
          <Text style={[s.successText, { color: colors.mutedForeground }]}>{successMsg}</Text>
          <Pressable
            onPress={() => setMode("main")}
            style={({ pressed }) => [s.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1, marginTop: 8 }]}
          >
            <Ionicons name="home-outline" size={18} color="#fff" />
            <Text style={s.primaryBtnText}>Baş sahypa</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <LinearGradient
        colors={[colors.primary, colors.primary + "dd"]}
        style={[s.header, { paddingTop: topPad + 16 }]}
      >
        <View style={s.headerRow}>
          <View>
            <Text style={s.headerTitle}>Kripto Töleg</Text>
            <Text style={s.headerSub}>USDT · TRC20 · BEP20 · TON</Text>
          </View>
          <View style={s.usdtBadge}>
            <Ionicons name="logo-bitcoin" size={14} color="#f59e0b" />
            <Text style={s.usdtBadgeText}>USDT</Text>
          </View>
        </View>

        {/* Stats strip */}
        <View style={s.statsStrip}>
          {[
            { label: "BP kurs", value: `1 USDT = ${COMMISSION_RATES.crypto_bp_per_usdt} BP` },
            { label: "Çykaryş", value: `1 BP = ${COMMISSION_RATES.crypto_usdt_per_bp} USDT` },
            { label: "Min komissiya", value: "0.05 USDT (TON)" },
          ].map((stat, i) => (
            <View key={i} style={[s.statItem, i < 2 && { borderRightWidth: 1, borderRightColor: "rgba(255,255,255,0.2)" }]}>
              <Text style={s.statLabel}>{stat.label}</Text>
              <Text style={s.statValue}>{stat.value}</Text>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View style={s.tabRow}>
          {TABS.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTab(t.id); }}
              style={[s.tabBtn, tab === t.id && s.tabBtnActive]}
            >
              <Ionicons name={t.icon} size={15} color={tab === t.id ? colors.primary : "rgba(255,255,255,0.7)"} />
              <Text style={[s.tabLabel, { color: tab === t.id ? colors.primary : "rgba(255,255,255,0.85)" }]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </LinearGradient>

      {/* CONTENT */}
      {tab === "deposit" && <DepositTab />}
      {tab === "withdraw" && <WithdrawTab />}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 0 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 },
  usdtBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#f59e0b20", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: "#f59e0b50",
  },
  usdtBadgeText: { color: "#f59e0b", fontSize: 12, fontWeight: "700" },
  statsStrip: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 14, marginBottom: 14 },
  statItem: { flex: 1, alignItems: "center", paddingVertical: 9 },
  statLabel: { color: "rgba(255,255,255,0.65)", fontSize: 9, fontWeight: "600", marginBottom: 2 },
  statValue: { color: "#fff", fontSize: 10, fontWeight: "700" },
  tabRow: { flexDirection: "row", gap: 6, paddingBottom: 14 },
  tabBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
    paddingVertical: 9, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  tabBtnActive: { backgroundColor: "#fff" },
  tabLabel: { fontSize: 12, fontWeight: "700" },

  // Section label
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6, marginTop: 18, marginBottom: 8 },

  // Network cards
  networkRow: { flexDirection: "row", gap: 8 },
  networkCard: { flex: 1, borderRadius: 14, padding: 11, alignItems: "center", gap: 4, position: "relative" },
  networkIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  networkName: { fontSize: 13, fontWeight: "800" },
  networkFull: { fontSize: 9, textAlign: "center" },
  networkFeeBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  networkFeeText: { fontSize: 9, fontWeight: "700" },
  networkTime: { fontSize: 9, fontWeight: "600" },
  networkCheck: {
    position: "absolute", top: 7, right: 7,
    width: 16, height: 16, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },

  // Rate banner
  rateBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 14, borderWidth: 1, padding: 13,
  },
  rateBannerTitle: { fontSize: 14, fontWeight: "700" },
  rateBannerSub: { fontSize: 11, marginTop: 2 },

  // Input
  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
  },
  input: { flex: 1, fontSize: 15 },
  inputPrefix: { fontSize: 16, fontWeight: "700" },
  inputSuffix: { fontSize: 12, fontWeight: "600" },

  calcPreview: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, marginTop: 8,
  },
  calcText: { fontSize: 13, fontWeight: "600" },

  // Address
  addressCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 14, borderWidth: 1.5, padding: 14,
  },
  addressLabel: { fontSize: 11, fontWeight: "600", marginBottom: 4 },
  addressText: { fontSize: 12, fontFamily: "monospace", letterSpacing: 0.3, lineHeight: 18 },
  copyBtn: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  addressNote: { fontSize: 11, lineHeight: 16, marginTop: 7 },

  // Error
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, padding: 12, marginTop: 10 },
  errorText: { color: "#dc2626", fontSize: 13, flex: 1 },

  // Primary button
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 16, paddingVertical: 16, marginTop: 20,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  // Steps guide
  stepsCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 20, gap: 10 },
  stepsTitle: { fontSize: 13, fontWeight: "700", marginBottom: 4 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepNum: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  stepNumText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  stepText: { fontSize: 13, flex: 1 },

  // Balance card
  balanceCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 16, borderWidth: 1, padding: 14,
  },
  balanceLabel: { fontSize: 11, fontWeight: "600" },
  balanceValue: { fontSize: 22, fontWeight: "800", marginTop: 2 },
  rateTag: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  rateTagText: { fontSize: 11, fontWeight: "700" },

  // Fee card
  feeCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 12, gap: 8 },
  feeTitleText: { fontSize: 13, fontWeight: "700", marginBottom: 4 },
  feeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  feeRowLabel: { fontSize: 13 },
  feeRowVal: { fontSize: 13, fontWeight: "700" },
  feeDivider: { height: 1, marginVertical: 4 },


  orderPairText: { fontSize: 14, fontWeight: "700" },
  orderPrice: { fontSize: 16, fontWeight: "800" },
  orderPriceUnit: { fontSize: 12, fontWeight: "600" },
  orderBottomRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  orderMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  orderMetaText: { fontSize: 11 },
  orderLimit: { fontSize: 11, fontWeight: "600" },
  orderBtn: { borderRadius: 10, paddingVertical: 9, alignItems: "center" },
  orderBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  // Success
  successContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  successIconWrap: { width: 100, height: 100, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 26, fontWeight: "800" },
  successText: { fontSize: 14, lineHeight: 22, textAlign: "center" },
});
