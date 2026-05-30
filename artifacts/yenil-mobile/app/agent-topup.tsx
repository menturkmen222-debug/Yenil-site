import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  Platform, Alert, Image,
} from "react-native";
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withSequence, FadeIn, FadeInDown, FadeInUp,
  ZoomIn, interpolate, Extrapolation,
} from "react-native-reanimated";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";
import {
  createAgentDeposit, watchAgentDeposits, saveReputationEntry,
  ADMIN_CARD_NUMBER, ADMIN_CARD_HOLDER, BP_BONUS_PERCENT,
  type AgentDeposit,
} from "@/lib/firebase";
import { formatRelativeTime } from "@/lib/reputation";
import { PessimisticButton } from "@/components/PessimisticButton";
import { uploadImage } from "@/lib/upload";

const MIN_TMT = 50;
const STATUS_MAP: Record<AgentDeposit["status"], { label: string; color: string; icon: string }> = {
  pending:   { label: "Garaşylýar", color: "#f59e0b", icon: "time-outline" },
  confirmed: { label: "Tassyklandy", color: "#059669", icon: "checkmark-circle-outline" },
  rejected:  { label: "Ret edildi",  color: "#ef4444", icon: "close-circle-outline" },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function StepBadge({ num, color, delay = 0 }: { num: string; color: string; delay?: number }) {
  return (
    <Animated.View
      entering={ZoomIn.delay(delay).springify().damping(12)}
      style={[ss.stepNum, { backgroundColor: color }]}
    >
      <Text style={ss.stepNumText}>{num}</Text>
    </Animated.View>
  );
}

function ReceiptUploader({
  receiptUri, onPick, onRemove, colors,
}: {
  receiptUri: string | null;
  onPick: () => void;
  onRemove: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function handlePress() {
    scale.value = withSequence(withTiming(0.95, { duration: 80 }), withSpring(1, { damping: 10 }));
    onPick();
  }

  if (receiptUri) {
    return (
      <Animated.View entering={ZoomIn.springify().damping(14)} style={ss.receiptPreviewWrap}>
        <Image source={{ uri: receiptUri }} style={ss.receiptPreview} resizeMode="cover" />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.55)"]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={ss.receiptOverlay}>
          <View style={ss.receiptOkBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
            <Text style={ss.receiptOkText}>Çek ýüklendi</Text>
          </View>
          <Pressable onPress={onRemove} style={ss.receiptRemoveBtn}>
            <Ionicons name="close" size={15} color="#fff" />
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  return (
    <AnimatedPressable onPress={handlePress} style={animStyle}>
      <View style={[ss.receiptPlaceholder, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <LinearGradient
          colors={["#059669" + "08", "#059669" + "18"]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[ss.receiptIconCircle, { backgroundColor: "#059669" + "20" }]}>
          <Ionicons name="camera-outline" size={26} color="#059669" />
        </View>
        <Text style={[ss.receiptPlaceholderTitle, { color: colors.foreground }]}>Çek / Kvitansiýa ýükle</Text>
        <Text style={[ss.receiptPlaceholderSub, { color: colors.mutedForeground }]}>
          Bank geçirmesiniň skrinşotyny goş
        </Text>
        <View style={[ss.receiptPillBtn, { backgroundColor: "#059669" }]}>
          <Ionicons name="image-outline" size={14} color="#fff" />
          <Text style={ss.receiptPillBtnText}>Surat saýla</Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

export default function AgentTopupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { deviceId, refreshBalance } = useBonusPul();
  const isWeb = Platform.OS === "web";

  const [amount, setAmount]         = useState("");
  const [loading, setLoading]       = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [copied, setCopied]         = useState(false);
  const [deposits, setDeposits]     = useState<AgentDeposit[]>([]);
  const [step, setStep]             = useState<1 | 2 | 3>(1);
  const [receiptUri, setReceiptUri] = useState<string | null>(null);

  // Track previous deposit statuses to detect rejection transitions
  const prevStatusesRef = useRef<Record<string, AgentDeposit["status"]>>({});

  const tmt         = parseFloat(amount) || 0;
  const bpEarned    = Math.round(tmt * (1 + BP_BONUS_PERCENT / 100) * 100) / 100;
  const bonusAmount = Math.round(tmt * (BP_BONUS_PERCENT / 100) * 100) / 100;
  const canSubmit   = tmt >= MIN_TMT;

  const successScale   = useSharedValue(0);
  const successOpacity = useSharedValue(0);
  const cardTilt       = useSharedValue(0);

  const successStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successOpacity.value,
  }));

  useEffect(() => {
    if (!deviceId) return;
    const unsub = watchAgentDeposits(deviceId, (newDeposits) => {
      setDeposits(newDeposits);

      // Detect transitions to "rejected" and reverse the reputation point
      newDeposits.forEach(async (dep) => {
        const prevStatus = prevStatusesRef.current[dep.id];
        if (prevStatus && prevStatus !== "rejected" && dep.status === "rejected") {
          try {
            await saveReputationEntry(deviceId, {
              type: "negative",
              reason: "Ret edilen agent depozit — Abraý gaýtaryldy",
              delta: -1,
              timestamp: new Date().toISOString(),
              isPublic: false,
            });
          } catch {
            // silently ignore
          }
        }
        prevStatusesRef.current[dep.id] = dep.status;
      });
    });
    return () => unsub();
  }, [deviceId]);

  useEffect(() => {
    if (step === 3) {
      successScale.value   = withSpring(1, { damping: 11, stiffness: 160 });
      successOpacity.value = withTiming(1, { duration: 280 });
    }
  }, [step]);

  async function handleCopyCard() {
    await Clipboard.setStringAsync(ADMIN_CARD_NUMBER.replace(/\s/g, ""));
    setCopied(true);
    cardTilt.value = withSequence(
      withTiming(1, { duration: 60 }),
      withSpring(0, { damping: 8 }),
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handlePickReceipt() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Rugsat gerek", "Galerýa rugsat berilmedi.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  async function handleSubmit() {
    if (!canSubmit) {
      Alert.alert("Ýalňyşlyk", `Minimum ${MIN_TMT} TMT geçirip bolýar`);
      return;
    }
    if (!receiptUri) {
      Alert.alert(
        "Çek gerek",
        "Göçürme tassyklamak üçin bank çekini (skrinşot) ýükläň.",
        [{ text: "Düşündim", style: "default" }]
      );
      return;
    }
    setLoading(true);
    try {
      setUploading(true);
      let screenshotUrl: string | undefined;
      try {
        const uploaded = await uploadImage(receiptUri, `agent-receipt-${Date.now()}.jpg`);
        screenshotUrl = uploaded ?? undefined;
      } catch {
      } finally {
        setUploading(false);
      }

      await createAgentDeposit(deviceId, tmt, screenshotUrl);
      await saveReputationEntry(deviceId, {
        type: "positive",
        reason: "Agent deposit sargyt iberildi",
        delta: 1,
        timestamp: new Date().toISOString(),
        isPublic: false,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep(3);
      setAmount("");
      setReceiptUri(null);
    } catch {
      Alert.alert("Ýalňyşlyk", "Sargyt döredilmedi. Täzeden synanyşyň.");
    } finally {
      setLoading(false);
    }
  }

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(cardTilt.value, [0, 1], [0, 1.5], Extrapolation.CLAMP)}deg` },
    ],
  }));

  return (
    <View style={[ss.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <LinearGradient colors={["#064e3b", "#059669"]} style={[ss.header, { paddingTop: (isWeb ? 0 : insets.top) + 14 }]}>
        <Pressable onPress={() => router.back()} style={ss.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={ss.headerTitle}>Agent — TMT → BP</Text>
          <Text style={ss.headerSub}>Admin kartasyna TMT geçiriň, +{BP_BONUS_PERCENT}% bonus BP alyň</Text>
        </View>
        <View style={ss.headerBadge}>
          <Text style={ss.headerBadgeText}>+{BP_BONUS_PERCENT}%</Text>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 72 }}
        keyboardShouldPersistTaps="handled"
      >
        {step === 3 ? (
          /* ── Success ── */
          <Animated.View style={[ss.successWrap, successStyle]}>
            <LinearGradient
              colors={["#059669" + "14", "#059669" + "04"]}
              style={ss.successGradientBg}
            />
            <Animated.View entering={ZoomIn.springify().damping(10)}>
              <View style={[ss.successCircle, { backgroundColor: "#059669" + "18" }]}>
                <Ionicons name="checkmark-circle" size={72} color="#059669" />
              </View>
            </Animated.View>
            <Animated.Text entering={FadeInDown.delay(160)} style={[ss.successTitle, { color: colors.foreground }]}>
              Sargyt iberildi!
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(220)} style={[ss.successDesc, { color: colors.mutedForeground }]}>
              Admin çekiňizi barlansoň, BP hasabyňyza otomatik geçirilýär. Adatda 5–30 minut içinde.
            </Animated.Text>
            <Animated.View entering={FadeInUp.delay(300).springify()} style={{ width: "100%", gap: 10 }}>
              <Pressable
                onPress={() => setStep(1)}
                style={[ss.btnPrimary, { backgroundColor: "#059669" }]}
              >
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={ss.btnPrimaryText}>Täze sargyt</Text>
              </Pressable>
              <Pressable
                onPress={() => router.back()}
                style={[ss.btnOutline, { borderColor: colors.border }]}
              >
                <Text style={[ss.btnOutlineText, { color: colors.foreground }]}>Yza dön</Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        ) : (
          <>
            {/* ── How it works ── */}
            <Animated.View
              entering={FadeInDown.delay(60).springify()}
              style={[ss.howCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[ss.howTitle, { color: colors.foreground }]}>Nähili işleýär?</Text>
              {[
                { num: "1", text: "Admin kartasyna TMT geçiriň", color: "#059669", delay: 80 },
                { num: "2", text: "Bank çekini (skrinşot) ýükläň", color: "#6366f1", delay: 140 },
                { num: "3", text: "Sargyt iberiň — admin tassyklar", color: "#f59e0b", delay: 200 },
                { num: "4", text: `${BP_BONUS_PERCENT}% bonus bilen BP alýarsyňyz`, color: "#ec4899", delay: 260 },
              ].map(item => (
                <View key={item.num} style={ss.stepRow}>
                  <StepBadge num={item.num} color={item.color} delay={item.delay} />
                  <Text style={[ss.stepText, { color: colors.foreground }]}>{item.text}</Text>
                </View>
              ))}
            </Animated.View>

            {/* ── Admin Card ── */}
            <Animated.Text
              entering={FadeIn.delay(100)}
              style={[ss.sectionLabel, { color: colors.mutedForeground }]}
            >
              ADMIN KARTAS
            </Animated.Text>

            <Animated.View entering={FadeInDown.delay(120).springify()} style={cardAnimStyle}>
              <Pressable onPress={handleCopyCard}>
                {({ pressed }) => (
                  <Animated.View style={[ss.cardDisplay, { opacity: pressed ? 0.9 : 1 }]}>
                    <LinearGradient
                      colors={["#064e3b", "#059669", "#34d399"]}
                      style={StyleSheet.absoluteFillObject}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    />
                    {/* shimmer strip */}
                    <View style={ss.cardShimmer} />
                    <View style={ss.cardChipRow}>
                      <Ionicons name="card-outline" size={24} color="rgba(255,255,255,0.65)" />
                      <Text style={ss.cardNetworkText}>Altyn Asyr</Text>
                    </View>
                    <Text style={ss.cardNumber}>{ADMIN_CARD_NUMBER}</Text>
                    <View style={ss.cardBottom}>
                      <View>
                        <Text style={ss.cardLabel}>KART EÝESI</Text>
                        <Text style={ss.cardHolder}>{ADMIN_CARD_HOLDER}</Text>
                      </View>
                      <View style={[ss.copyBtn, { backgroundColor: copied ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.18)" }]}>
                        <Ionicons name={copied ? "checkmark" : "copy-outline"} size={14} color="#fff" />
                        <Text style={ss.copyBtnText}>{copied ? "Gopçiklendy!" : "Kopirlä"}</Text>
                      </View>
                    </View>
                  </Animated.View>
                )}
              </Pressable>
            </Animated.View>

            {/* ── Amount Input ── */}
            <Animated.Text
              entering={FadeIn.delay(180)}
              style={[ss.sectionLabel, { color: colors.mutedForeground }]}
            >
              GEÇIRJEK MUKDARYŇYZ
            </Animated.Text>

            <Animated.View
              entering={FadeInDown.delay(200).springify()}
              style={[ss.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={ss.inputRow}>
                <TextInput
                  style={[ss.amountInput, { color: colors.foreground, borderColor: canSubmit ? "#059669" : colors.border }]}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder={`Min: ${MIN_TMT} TMT`}
                  placeholderTextColor={colors.mutedForeground}
                />
                <View style={[ss.currencyBadge, { backgroundColor: "#059669" + "18" }]}>
                  <Text style={[ss.currencyText, { color: "#059669" }]}>TMT</Text>
                </View>
              </View>

              {canSubmit && (
                <Animated.View
                  entering={FadeInDown.springify()}
                  style={[ss.calcBox, { backgroundColor: "#059669" + "08", borderColor: "#059669" + "25" }]}
                >
                  <View style={ss.calcRow}>
                    <Text style={[ss.calcLabel, { color: colors.mutedForeground }]}>Geçirilen TMT:</Text>
                    <Text style={[ss.calcValue, { color: colors.foreground }]}>{tmt} TMT</Text>
                  </View>
                  <View style={ss.calcRow}>
                    <Text style={[ss.calcLabel, { color: colors.mutedForeground }]}>{BP_BONUS_PERCENT}% bonus:</Text>
                    <Text style={[ss.calcValue, { color: "#059669" }]}>+{bonusAmount} BP</Text>
                  </View>
                  <View style={[ss.calcDivider, { backgroundColor: "#059669" + "22" }]} />
                  <View style={ss.calcRow}>
                    <Text style={[ss.calcLabelBig, { color: colors.foreground }]}>Jemi alýarsyňyz:</Text>
                    <Text style={[ss.calcValueBig, { color: "#059669" }]}>{bpEarned} BP</Text>
                  </View>
                </Animated.View>
              )}
            </Animated.View>

            {/* ── Receipt Upload ── */}
            <Animated.Text
              entering={FadeIn.delay(240)}
              style={[ss.sectionLabel, { color: colors.mutedForeground }]}
            >
              TÖLEG ISBOTY (ÇEK)
            </Animated.Text>

            <Animated.View entering={FadeInDown.delay(260).springify()} style={{ paddingHorizontal: 16 }}>
              <ReceiptUploader
                receiptUri={receiptUri}
                onPick={handlePickReceipt}
                onRemove={() => setReceiptUri(null)}
                colors={colors}
              />
              <View style={[ss.receiptInfoBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="information-circle-outline" size={16} color={colors.mutedForeground} />
                <Text style={[ss.receiptInfoText, { color: colors.mutedForeground }]}>
                  Çek bolmasa admin geçirmäni tapyp bilmez — bu maglumaty goraýar.
                </Text>
              </View>
            </Animated.View>

            {/* ── Submit ── */}
            <Animated.View
              entering={FadeInUp.delay(300).springify()}
              style={[ss.submitSection, { borderColor: colors.border }]}
            >
              <Text style={[ss.warningText, { color: colors.mutedForeground }]}>
                Pul geçireniňizden SOŇRA sargyt iberiň. Tassyklanmaz öň BP berilmez.
              </Text>

              {uploading && (
                <Animated.View entering={FadeIn} style={ss.uploadingRow}>
                  <Ionicons name="cloud-upload-outline" size={16} color="#059669" />
                  <Text style={[ss.uploadingText, { color: "#059669" }]}>Çek ýüklenýär...</Text>
                </Animated.View>
              )}

              <PessimisticButton
                label={receiptUri ? "Sargyt iber" : "Çek ýükläň (hökmany)"}
                loadingLabel="Iberilýär..."
                loading={loading}
                disabled={loading || !canSubmit}
                onPress={handleSubmit}
                color={receiptUri && canSubmit ? "#059669" : "#94a3b8"}
                size="lg"
                icon={<Ionicons name="send-outline" size={18} color="#fff" />}
              />
            </Animated.View>
          </>
        )}

        {/* ── Deposit History ── */}
        {deposits.length > 0 && (
          <Animated.View entering={FadeInDown.delay(80)}>
            <Text style={[ss.sectionLabel, { color: colors.mutedForeground }]}>SARGYT TARYHY</Text>
            <View style={{ paddingHorizontal: 16, gap: 10 }}>
              {deposits.slice(0, 10).map((dep, i) => {
                const st = STATUS_MAP[dep.status];
                return (
                  <Animated.View
                    key={dep.id}
                    entering={FadeInDown.delay(i * 50).springify()}
                    style={[ss.historyItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={[ss.historyIconWrap, { backgroundColor: st.color + "18" }]}>
                      <Ionicons name={st.icon as any} size={20} color={st.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={ss.historyTopRow}>
                        <Text style={[ss.historyAmount, { color: colors.foreground }]}>
                          {dep.tmtAmount} TMT → {dep.bpAmount} BP
                        </Text>
                        <View style={[ss.statusBadge, { backgroundColor: st.color + "15" }]}>
                          <Text style={[ss.statusText, { color: st.color }]}>{st.label}</Text>
                        </View>
                      </View>
                      <View style={ss.historyBottomRow}>
                        <Text style={[ss.historyTime, { color: colors.mutedForeground }]}>
                          {formatRelativeTime(dep.createdAt)}
                        </Text>
                        {dep.status === "rejected" && (
                          <View style={ss.rejectedNote}>
                            <Ionicons name="arrow-undo-outline" size={11} color="#ef4444" />
                            <Text style={ss.rejectedNoteText}>Abraý gaýtaryldy</Text>
                          </View>
                        )}
                        {dep.screenshotUrl ? (
                          <View style={ss.receiptAttachedBadge}>
                            <Ionicons name="image-outline" size={11} color="#059669" />
                            <Text style={ss.receiptAttachedText}>Çek bar</Text>
                          </View>
                        ) : (
                          <View style={ss.noReceiptBadge}>
                            <Ionicons name="image-outline" size={11} color="#94a3b8" />
                            <Text style={ss.noReceiptText}>Çeksiz</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 20,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  headerSub:   { color: "rgba(255,255,255,0.72)", fontSize: 11, marginTop: 2 },
  headerBadge: {
    backgroundColor: "rgba(255,255,255,0.22)", borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5, marginLeft: 8,
  },
  headerBadgeText: { color: "#fff", fontSize: 13, fontWeight: "800" },

  sectionLabel: {
    fontSize: 11, fontWeight: "700", letterSpacing: 0.9,
    marginLeft: 20, marginTop: 22, marginBottom: 10,
  },

  howCard: {
    marginHorizontal: 16, marginTop: 18, borderRadius: 18,
    borderWidth: 1, padding: 18, gap: 14,
  },
  howTitle:    { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  stepRow:     { flexDirection: "row", alignItems: "center", gap: 12 },
  stepNum:     { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  stepNumText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  stepText:    { flex: 1, fontSize: 13, lineHeight: 20 },

  cardDisplay: {
    marginHorizontal: 16, borderRadius: 22, padding: 22,
    overflow: "hidden", minHeight: 150,
    shadowColor: "#059669", shadowOpacity: 0.35, shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  cardShimmer: {
    position: "absolute", top: 0, right: -40,
    width: 90, height: "100%",
    backgroundColor: "rgba(255,255,255,0.07)",
    transform: [{ skewX: "-20deg" }],
  },
  cardChipRow:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22 },
  cardNetworkText: { color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  cardNumber:      { color: "#fff", fontSize: 22, fontWeight: "700", letterSpacing: 4, marginBottom: 22 },
  cardBottom:      { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  cardLabel:       { color: "rgba(255,255,255,0.5)", fontSize: 8, letterSpacing: 1.5, fontWeight: "700" },
  cardHolder:      { color: "#fff", fontSize: 14, fontWeight: "700", marginTop: 3 },
  copyBtn:         { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  copyBtnText:     { color: "#fff", fontSize: 11, fontWeight: "700" },

  inputCard: {
    marginHorizontal: 16, borderRadius: 18, borderWidth: 1, padding: 16, gap: 12,
  },
  inputRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  amountInput: {
    flex: 1, fontSize: 28, fontWeight: "800",
    borderWidth: 2, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  currencyBadge: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  currencyText:  { fontSize: 16, fontWeight: "800" },
  calcBox:       { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  calcRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  calcLabel:     { fontSize: 12 },
  calcValue:     { fontSize: 13, fontWeight: "700" },
  calcDivider:   { height: 1 },
  calcLabelBig:  { fontSize: 14, fontWeight: "700" },
  calcValueBig:  { fontSize: 20, fontWeight: "900" },

  receiptPreviewWrap: {
    borderRadius: 16, overflow: "hidden", height: 180, marginBottom: 10, position: "relative",
  },
  receiptPreview: { width: "100%", height: "100%" },
  receiptOverlay: {
    position: "absolute", bottom: 10, left: 10, right: 10,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  receiptOkBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(5,150,105,0.85)", borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  receiptOkText:    { color: "#fff", fontSize: 12, fontWeight: "700" },
  receiptRemoveBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center",
  },

  receiptPlaceholder: {
    borderRadius: 16, borderWidth: 2, borderStyle: "dashed",
    padding: 24, alignItems: "center", gap: 10, marginBottom: 10,
    overflow: "hidden",
  },
  receiptIconCircle: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  receiptPlaceholderTitle: { fontSize: 15, fontWeight: "700" },
  receiptPlaceholderSub:   { fontSize: 12, textAlign: "center" },
  receiptPillBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginTop: 4,
  },
  receiptPillBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  receiptInfoBanner: {
    flexDirection: "row", gap: 8, borderRadius: 12, borderWidth: 1,
    padding: 12, alignItems: "flex-start",
  },
  receiptInfoText: { flex: 1, fontSize: 12, lineHeight: 18 },

  submitSection: {
    marginHorizontal: 16, marginTop: 8, paddingTop: 16,
    borderTopWidth: 1, gap: 12,
  },
  warningText:  { fontSize: 12, textAlign: "center", lineHeight: 18 },
  uploadingRow: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" },
  uploadingText: { fontSize: 13, fontWeight: "600" },

  successWrap: {
    margin: 24, alignItems: "center", gap: 16, position: "relative",
    paddingVertical: 32, paddingHorizontal: 20,
  },
  successGradientBg: { ...StyleSheet.absoluteFillObject, borderRadius: 24 },
  successCircle: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 26, fontWeight: "900", textAlign: "center", letterSpacing: -0.5 },
  successDesc:  { fontSize: 13, textAlign: "center", lineHeight: 20 },
  btnPrimary: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 14, paddingVertical: 16,
  },
  btnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  btnOutline: {
    borderRadius: 14, paddingVertical: 14,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
  btnOutlineText: { fontWeight: "600", fontSize: 15 },

  historyItem: {
    flexDirection: "row", gap: 12, borderRadius: 16, borderWidth: 1, padding: 14,
  },
  historyIconWrap: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  historyTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  historyAmount: { fontSize: 13, fontWeight: "700", flex: 1 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText:  { fontSize: 10, fontWeight: "700" },
  historyBottomRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  historyTime: { fontSize: 11, flex: 1 },
  rejectedNote: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#ef444410", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  rejectedNoteText: { fontSize: 9, fontWeight: "700", color: "#ef4444" },
  receiptAttachedBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#05966910", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  receiptAttachedText: { fontSize: 9, fontWeight: "700", color: "#059669" },
  noReceiptBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#94a3b810", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  noReceiptText: { fontSize: 9, fontWeight: "700", color: "#94a3b8" },
});
