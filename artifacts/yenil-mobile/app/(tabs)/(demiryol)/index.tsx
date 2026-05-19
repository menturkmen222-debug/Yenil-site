import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  Alert, ActivityIndicator, Platform, Image, Linking,
} from "react-native";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";
import { uploadImage } from "@/lib/upload";

const BACKENDLESS_URL = `https://api.backendless.com/C3BB5032-1DCC-4DB3-888F-AEDA785F26CB/9A8CACA4-5889-4D47-903E-BF12F059E175`;
const PAYMENT_PHONES = ["+993 71 789091", "+993 64 629487", "+993 71 788546"];
const DEMIRYOL_API = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api/demiryol`
  : "/api/demiryol";
const SMS_NUMBERS = ["+993 71 789091", "+993 64 629487", "+993 71 788546"];

interface TicketBooking {
  passenger_name?: string;
  route?: string;
  departure_date?: string;
  train_number?: string;
}

const CITIES: Record<string, string> = {
  ashgabat: "Aşgabat",
  dashoguz: "Daşoguz",
  balkanabat: "Balkanabat",
  turkmenbasy: "Türkmenbaşy",
  mary: "Mary",
  lebap: "Lebap",
};
const CITY_KEYS = Object.keys(CITIES);

const ROUTES_SMS = [
  { id: "a1", label: "Aşgabat → Mary" },
  { id: "a2", label: "Aşgabat → Türkmenabat" },
  { id: "a3", label: "Aşgabat → Daşoguz" },
  { id: "a4", label: "Aşgabat → Balkanabat" },
  { id: "a5", label: "Mary → Türkmenabat" },
  { id: "a6", label: "Mary → Aşgabat" },
  { id: "a7", label: "Türkmenabat → Aşgabat" },
  { id: "a8", label: "Daşoguz → Aşgabat" },
];

const TRAIN_TYPES = [
  { id: "express", label: "Ekspress (çalt)", desc: "Iň çalt ulag" },
  { id: "passenger", label: "Ýolagçy", desc: "Kadaly tizlik" },
  { id: "economy", label: "Ykdysady", desc: "Arzan nyrh" },
];

type MainSection = "choose" | "direct" | "agent" | "sms";
type DirectSection = "form" | "payment" | "confirm" | "success";
type ProofType = "screenshot" | "sms" | "bonus";

function PickerRow({ label, value, onNext, onPrev }: { label: string; value: string; onNext: () => void; onPrev: () => void }) {
  const colors = useColors();
  return (
    <View style={[pr.row, { borderBottomColor: colors.border }]}>
      <Text style={[pr.label, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={pr.ctrl}>
        <Pressable onPress={onPrev} style={[pr.btn, { backgroundColor: colors.muted }]}>
          <Feather name="chevron-left" size={18} color={colors.primary} />
        </Pressable>
        <Text style={[pr.val, { color: colors.foreground }]}>{value}</Text>
        <Pressable onPress={onNext} style={[pr.btn, { backgroundColor: colors.muted }]}>
          <Feather name="chevron-right" size={18} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}
const pr = StyleSheet.create({
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

  // Main navigation
  const [main, setMain] = useState<MainSection>("choose");

  // ── Direct buy state ──
  const [directStep, setDirectStep] = useState<DirectSection>("form");
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
  const [proofType, setProofType] = useState<ProofType | null>(null);
  const [smsText, setSmsText] = useState("");
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Agent order state ──
  const [agentName, setAgentName] = useState("");
  const [agentPhone, setAgentPhone] = useState("");
  const [agentRoute, setAgentRoute] = useState("");
  const [agentDate, setAgentDate] = useState("");
  const [agentNote, setAgentNote] = useState("");
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentDone, setAgentDone] = useState(false);

  // ── SMS order state ──
  const [smsName, setSmsName] = useState("");
  const [smsPhone, setSmsPhone] = useState("");
  const [smsPassengers, setSmsPassengers] = useState("1");
  const [smsRoute, setSmsRoute] = useState("a1");
  const [smsTrainType, setSmsTrainType] = useState("passenger");
  const [smsDate, setSmsDate] = useState("");
  const [smsNotes, setSmsNotes] = useState("");
  const [smsStep, setSmsStep] = useState(1);
  const [showRouteList, setShowRouteList] = useState(false);
  const selectedSmsRoute = ROUTES_SMS.find(r => r.id === smsRoute);

  function smsSendText() {
    const tr = TRAIN_TYPES.find(t => t.id === smsTrainType)?.label ?? "";
    return `Sargyt:\nAd we Familýa: ${smsName}\nNomer: ${smsPhone} (TMCell)\nUgruň: ${selectedSmsRoute?.label}\nGün: ${smsDate}\nOtly: ${tr}\nÝolagçy: ${smsPassengers}\n${smsNotes ? "Bellik: " + smsNotes : ""}`.trim();
  }
  function sendSms(number: string) {
    Linking.openURL(`sms:${number}?body=${encodeURIComponent(smsSendText())}`);
  }

  function calcPrice() {
    if (!travelDate) return 60;
    const diff = Math.ceil((new Date(travelDate).getTime() - Date.now()) / 86400000);
    let base = diff <= 1 ? 80 : diff <= 3 ? 70 : 60;
    let addons = 0;
    if (secondClass) addons += diff <= 4 ? 10 : 5;
    if (mediaPortal) addons += 5;
    if (firstClass) addons += diff <= 4 ? 15 : 10;
    return base + addons;
  }
  const price = calcPrice();

  async function pickScreenshot() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setScreenshotUri(result.assets[0].uri);
  }

  function validateForm() {
    if (!name || !surname || !birthdate || !passport || !travelDate || !clientPhone) {
      Alert.alert("Ýalňyşlyk", "Ähli meýdançalary dolduryň!"); return false;
    }
    if (fromIdx === toIdx) { Alert.alert("Ýalňyşlyk", "Nirden we Nira tapawutly bolmaly!"); return false; }
    return true;
  }

  function validateProof() {
    if (!proofType) { Alert.alert("Ýalňyşlyk", "Töleg usulyny saýlaň!"); return false; }
    if (proofType === "sms" && !smsText.trim()) { Alert.alert("Ýalňyşlyk", "SMS habary giriziň!"); return false; }
    if (proofType === "screenshot" && !screenshotUri) { Alert.alert("Ýalňyşlyk", "Skrinshot saýlanmady!"); return false; }
    if (proofType === "bonus" && balance < price) { Alert.alert("Ýalňyşlyk", `Ýeterlik bonus pul ýok. Balansyňyz: ${balance} BP. Gerekli: ${price} BP`); return false; }
    return true;
  }

  async function handleDirectSubmit() {
    if (!validateProof()) return;
    setLoading(true); setError("");
    try {
      if (proofType === "bonus") {
        const ok = await deduct(price);
        if (!ok) { setError("Bonus pul aýyrmak başartmady!"); setLoading(false); return; }
      }
      const screenshotUrl = proofType === "screenshot" && screenshotUri
        ? await uploadImage(screenshotUri, "proof.jpg") : null;
      const orderData = {
        type: "demiryol", name, surname, passport, birthdate,
        route: `${CITY_KEYS[fromIdx]}-${CITY_KEYS[toIdx]}`,
        travelDate, totalPrice: price, clientPhone,
        proofType, paymentMethod: proofType,
        deviceId: proofType === "bonus" ? deviceId : undefined,
        smsText: proofType === "sms" ? smsText : null,
        screenshotUrl, firstClass, secondClass, mediaPortal,
        timestamp: new Date().toISOString(),
        created: new Date().toISOString(), updated: new Date().toISOString(),
      };
      const response = await fetch(`${BACKENDLESS_URL}/data/orders`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDirectStep("success");
    } catch (e: any) {
      setError("Ýalňyşlyk: " + (e.message || "Bilinmeýän ýalňyşlyk"));
    } finally { setLoading(false); }
  }

  async function handleAgentSubmit() {
    if (!agentName.trim() || !agentPhone.trim() || !agentRoute.trim() || !agentDate.trim()) {
      Alert.alert("Doldurylmadyk", "Ähli hökmany meýdançalary dolduryň!"); return;
    }
    setAgentLoading(true);
    try {
      await fetch(`${BACKENDLESS_URL}/data/orders`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "agent_monitor", name: agentName, phone: agentPhone,
          route: agentRoute, date: agentDate, note: agentNote,
          timestamp: new Date().toISOString(),
          created: new Date().toISOString(), updated: new Date().toISOString(),
        }),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAgentDone(true);
    } catch {
      Alert.alert("Ýalňyşlyk", "Soragy ibermek başartmady. Gaýtadan synanyşyň.");
    } finally { setAgentLoading(false); }
  }

  const topPad = (isWeb ? 0 : insets.top) + 12;

  const goBack = (to: MainSection) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMain(to);
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* ── HEADER ── */}
      <View style={[s.header, { paddingTop: topPad, backgroundColor: colors.primary }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {main !== "choose" && (
            <Pressable onPress={() => {
              goBack("choose");
              if (main === "direct") setDirectStep("form");
              if (main === "sms") setSmsStep(1);
            }} style={s.backBtn}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </Pressable>
          )}
          <Ionicons name="train-outline" size={22} color="#fff" />
          <Text style={s.headerTitle}>
            {main === "choose" ? "Demirýol biletleri" :
             main === "direct" ? "Göni bilet almak" :
             main === "agent" ? "Agent arkaly sargyt" :
             "SMS zaýawka"}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 110 : 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ══════════════════════════════════════════
            CHOOSE SCREEN — 3 service cards
        ══════════════════════════════════════════ */}
        {main === "choose" && (
          <View>
            {/* Subtitle */}
            <Text style={[s.chooseTitle, { color: colors.foreground }]}>Hyzmat saýlaň</Text>
            <Text style={[s.chooseSub, { color: colors.mutedForeground }]}>
              Size laýyk görnüşde bilet alyberiş hyzmatyny saýlaň
            </Text>

            {/* Card 1 — Direct */}
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setMain("direct"); }}
              style={({ pressed }) => [s.serviceCard, {
                backgroundColor: colors.card, borderColor: colors.primary + "50",
                borderWidth: 1.5, opacity: pressed ? 0.9 : 1,
                shadowColor: colors.primary, shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 4,
              }]}
            >
              {/* Accent stripe */}
              <View style={[s.cardStripe, { backgroundColor: colors.primary }]} />
              <View style={{ flex: 1, paddingLeft: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <View style={[s.cardIconBg, { backgroundColor: colors.primary + "18" }]}>
                    <Ionicons name="flash-outline" size={26} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.cardTitle, { color: colors.foreground }]}>Göni özim almakçy</Text>
                    <View style={[s.cardBadge, { backgroundColor: colors.primary + "18" }]}>
                      <Text style={[s.cardBadgeText, { color: colors.primary }]}>Dessine</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                </View>
                <Text style={[s.cardDesc, { color: colors.mutedForeground }]}>
                  Bilet çykan dessine özüňiz alyp bilersiňiz. Garaşmazdan, bilet satışa çykandan şol bada al.
                </Text>
                <View style={[s.cardFeatures, { borderTopColor: colors.border }]}>
                  {["Şol bada sargyt", "Töleg öňünden", "1 sagat içinde SMS"].map((f, i) => (
                    <View key={i} style={s.cardFeatureItem}>
                      <Ionicons name="checkmark-circle" size={13} color={colors.primary} />
                      <Text style={[s.cardFeatureText, { color: colors.mutedForeground }]}>{f}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Pressable>

            {/* Card 2 — Agent */}
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setMain("agent"); setAgentDone(false); }}
              style={({ pressed }) => [s.serviceCard, {
                backgroundColor: colors.card, borderColor: "#8b5cf6" + "50",
                borderWidth: 1.5, opacity: pressed ? 0.9 : 1,
                shadowColor: "#8b5cf6", shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 4,
              }]}
            >
              <View style={[s.cardStripe, { backgroundColor: "#8b5cf6" }]} />
              <View style={{ flex: 1, paddingLeft: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <View style={[s.cardIconBg, { backgroundColor: "#8b5cf6" + "18" }]}>
                    <MaterialCommunityIcons name="robot-outline" size={26} color="#8b5cf6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.cardTitle, { color: colors.foreground }]}>Size tabşyrmakçy</Text>
                    <View style={[s.cardBadge, { backgroundColor: "#8b5cf6" + "18" }]}>
                      <Text style={[s.cardBadgeText, { color: "#8b5cf6" }]}>7/24 kuzatuw</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#8b5cf6" />
                </View>
                <Text style={[s.cardDesc, { color: colors.mutedForeground }]}>
                  Bilet maglumatlaryňyzy bize aýdyň — biz tarifymyza görä 7/24 kuzatyp, ýer çykandan dessine alyp bereris.
                </Text>
                <View style={[s.cardFeatures, { borderTopColor: colors.border }]}>
                  {["7/24 awtomat kuzatuw", "Ýer çyksa dessine alýas", "Tarife görä hyzmat"].map((f, i) => (
                    <View key={i} style={s.cardFeatureItem}>
                      <Ionicons name="checkmark-circle" size={13} color="#8b5cf6" />
                      <Text style={[s.cardFeatureText, { color: colors.mutedForeground }]}>{f}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Pressable>

            {/* Card 3 — SMS */}
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setMain("sms"); setSmsStep(1); }}
              style={({ pressed }) => [s.serviceCard, {
                backgroundColor: colors.card, borderColor: "#0ea5e9" + "50",
                borderWidth: 1.5, opacity: pressed ? 0.9 : 1,
                shadowColor: "#0ea5e9", shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 4,
              }]}
            >
              <View style={[s.cardStripe, { backgroundColor: "#0ea5e9" }]} />
              <View style={{ flex: 1, paddingLeft: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <View style={[s.cardIconBg, { backgroundColor: "#0ea5e9" + "18" }]}>
                    <Ionicons name="chatbubble-ellipses-outline" size={26} color="#0ea5e9" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.cardTitle, { color: colors.foreground }]}>SMS zaýawka</Text>
                    <View style={[s.cardBadge, { backgroundColor: "#0ea5e9" + "18" }]}>
                      <Text style={[s.cardBadgeText, { color: "#0ea5e9" }]}>Internetsiz</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#0ea5e9" />
                </View>
                <Text style={[s.cardDesc, { color: colors.mutedForeground }]}>
                  Internet bolmanda hem SMS arkaly bilet sargyt ediň. Maglumatlarňyzy dolduryň, SMS ugradyň.
                </Text>
                <View style={[s.cardFeatures, { borderTopColor: colors.border }]}>
                  {["Internetsiz işleýär", "SMS arkaly tassyklanýar", "15-30 min içinde jaň"].map((f, i) => (
                    <View key={i} style={s.cardFeatureItem}>
                      <Ionicons name="checkmark-circle" size={13} color="#0ea5e9" />
                      <Text style={[s.cardFeatureText, { color: colors.mutedForeground }]}>{f}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Pressable>
          </View>
        )}

        {/* ══════════════════════════════════════════
            DIRECT BUY FLOW
        ══════════════════════════════════════════ */}
        {main === "direct" && directStep === "form" && (
          <View>
            <Text style={[s.sectionHead, { color: colors.foreground }]}>Ugur we şahsy maglumatlar</Text>
            <PickerRow label="Nirden" value={CITIES[CITY_KEYS[fromIdx]]}
              onPrev={() => setFromIdx(i => (i - 1 + CITY_KEYS.length) % CITY_KEYS.length)}
              onNext={() => setFromIdx(i => (i + 1) % CITY_KEYS.length)} />
            <PickerRow label="Nira" value={CITIES[CITY_KEYS[toIdx]]}
              onPrev={() => setToIdx(i => (i - 1 + CITY_KEYS.length) % CITY_KEYS.length)}
              onNext={() => setToIdx(i => (i + 1) % CITY_KEYS.length)} />
            {[
              { label: "Adyňyz", value: name, set: setName, ph: "Adyňyz" },
              { label: "Familýaňyz", value: surname, set: setSurname, ph: "Familýaňyz" },
              { label: "Pasport ID", value: passport, set: (v: string) => setPassport(v.toUpperCase()), ph: "I-DZ 123456" },
              { label: "Doglan senesi (YYYY-MM-DD)", value: birthdate, set: setBirthdate, ph: "1990-01-15" },
              { label: "Sapar senesi (YYYY-MM-DD)", value: travelDate, set: setTravelDate, ph: new Date().toISOString().split("T")[0] },
              { label: "Siziň nomeriňiz", value: clientPhone, set: setClientPhone, ph: "+99361xxxxxx", phone: true },
            ].map((f, i) => (
              <View key={i} style={{ marginTop: 14 }}>
                <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>{f.label}</Text>
                <TextInput value={f.value} onChangeText={f.set} placeholder={f.ph}
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType={(f as any).phone ? "phone-pad" : "default"}
                  style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                />
              </View>
            ))}
            <Text style={[s.sectionHead, { color: colors.foreground, marginTop: 20 }]}>Goşmaça hyzmatlar</Text>
            {[
              { label: "1-nji gat", val: firstClass, set: (v: boolean) => { setFirstClass(v); if (v) setSecondClass(false); } },
              { label: "2-nji gat", val: secondClass, set: (v: boolean) => { setSecondClass(v); if (v) setFirstClass(false); } },
              { label: "Media portal (+5 TMT)", val: mediaPortal, set: setMediaPortal },
            ].map((a, i) => (
              <Pressable key={i} onPress={() => a.set(!a.val)}
                style={[s.checkRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[s.checkbox, { borderColor: colors.primary, backgroundColor: a.val ? colors.primary : "transparent" }]}>
                  {a.val && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}>{a.label}</Text>
              </Pressable>
            ))}
            <View style={[s.priceBadge, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}>
              <Ionicons name="cash-outline" size={20} color={colors.primary} />
              <Text style={[s.priceText, { color: colors.primary }]}>Jemi: {price} TMT</Text>
            </View>
            <Pressable onPress={() => { if (validateForm()) setDirectStep("payment"); }}
              style={({ pressed }) => [s.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}>
              <Text style={s.primaryBtnText}>Töleg usulyna geçmek</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </Pressable>
          </View>
        )}

        {main === "direct" && directStep === "payment" && (
          <View>
            <Text style={[s.sectionHead, { color: colors.foreground }]}>Töleg maglumatlary</Text>
            <View style={[s.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                {PAYMENT_PHONES.map((p, i) => (
                  <Text key={i} style={{ color: colors.foreground, fontWeight: "700", fontSize: 15, marginBottom: 2 }}>{p}</Text>
                ))}
                <Text style={{ color: colors.primary, fontWeight: "700", marginTop: 8 }}>Jemi: {price} TMT</Text>
              </View>
            </View>
            <Text style={[s.sectionHead, { color: colors.foreground }]}>Töleg usulyny saýlaň</Text>
            {([
              { id: "screenshot" as ProofType, icon: "camera-outline" as const, label: "Skrinshot" },
              { id: "sms" as ProofType, icon: "chatbubble-outline" as const, label: "SMS habary" },
              { id: "bonus" as ProofType, icon: "wallet-outline" as const, label: `Bonus pul (${balance} BP)` },
            ]).map(t => (
              <Pressable key={t.id} onPress={() => setProofType(t.id)}
                style={[s.proofCard, {
                  backgroundColor: proofType === t.id ? colors.primary + "15" : colors.card,
                  borderColor: proofType === t.id ? colors.primary : colors.border,
                }]}>
                <Ionicons name={t.icon} size={22} color={proofType === t.id ? colors.primary : colors.mutedForeground} />
                <Text style={[s.proofLabel, { color: proofType === t.id ? colors.primary : colors.foreground }]}>{t.label}</Text>
              </Pressable>
            ))}
            {proofType === "bonus" && balance < price && (
              <View style={[s.warnBox, { backgroundColor: "#fee2e2", borderColor: "#ef4444" }]}>
                <Ionicons name="warning-outline" size={16} color="#ef4444" />
                <Text style={{ color: "#dc2626", fontSize: 13, flex: 1 }}>Ýeterlik bonus pul ýok ({balance} BP / {price} BP gerek)</Text>
              </View>
            )}
            {proofType === "sms" && (
              <View style={{ marginTop: 12 }}>
                <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>SMS habaryňyzy giriziň</Text>
                <TextInput value={smsText} onChangeText={setSmsText}
                  placeholder="SMS haty şu ýere ýazyň..." placeholderTextColor={colors.mutedForeground}
                  multiline numberOfLines={4}
                  style={[s.input, s.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                />
              </View>
            )}
            {proofType === "screenshot" && (
              <Pressable onPress={pickScreenshot}
                style={{ borderWidth: 2, borderStyle: "dashed", borderColor: colors.primary, borderRadius: 12, padding: 20, alignItems: "center", marginTop: 12, gap: 6 }}>
                <Ionicons name="cloud-upload-outline" size={32} color={colors.primary} />
                <Text style={{ color: colors.primary, fontWeight: "600" }}>Suraty ýüklemek üçin üstünden basyň</Text>
                <Text style={{ color: "#f59e0b", fontSize: 12 }}>JPG, PNG (maksimum 5 MB)</Text>
              </Pressable>
            )}
            {screenshotUri && proofType === "screenshot" && (
              <Image source={{ uri: screenshotUri }} style={{ height: 160, borderRadius: 12, marginTop: 10, resizeMode: "cover" }} />
            )}
            <Pressable onPress={() => { if (!proofType) { Alert.alert("Saýlaň", "Töleg tassyklamasyny saýlaň!"); return; } setDirectStep("confirm"); }}
              style={({ pressed }) => [s.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}>
              <Text style={s.primaryBtnText}>Tassyklamaga geçmek</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </Pressable>
            <Pressable onPress={() => setDirectStep("form")} style={s.secondaryBtn}>
              <Feather name="arrow-left" size={16} color={colors.mutedForeground} />
              <Text style={[s.secondaryBtnText, { color: colors.mutedForeground }]}>Yza</Text>
            </Pressable>
          </View>
        )}

        {main === "direct" && directStep === "confirm" && (
          <View>
            <Text style={[s.sectionHead, { color: colors.foreground }]}>Tassyklaň</Text>
            <View style={[s.confirmCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {[
                ["Ad", name], ["Familýa", surname], ["Pasport", passport],
                ["Ugur", `${CITIES[CITY_KEYS[fromIdx]]} → ${CITIES[CITY_KEYS[toIdx]]}`],
                ["Sapar senesi", travelDate], ["Töleg", `${price} TMT`],
                ["Nomeriňiz", clientPhone],
                ["Tassyklama", proofType === "screenshot" ? "Skrinshot" : proofType === "sms" ? "SMS habary" : "Bonus pul"],
              ].map(([k, v], i) => (
                <View key={i} style={[s.confirmRow, { borderBottomColor: colors.border }]}>
                  <Text style={[s.confirmKey, { color: colors.mutedForeground }]}>{k}</Text>
                  <Text style={[s.confirmVal, { color: colors.foreground }]}>{v}</Text>
                </View>
              ))}
            </View>
            {error ? (
              <View style={{ backgroundColor: "#fee2e2", borderRadius: 10, padding: 12, marginBottom: 8 }}>
                <Text style={{ color: "#dc2626" }}>{error}</Text>
              </View>
            ) : null}
            <Pressable onPress={handleDirectSubmit} disabled={loading}
              style={({ pressed }) => [s.primaryBtn, { backgroundColor: colors.primary, opacity: pressed || loading ? 0.7 : 1 }]}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={s.primaryBtnText}>Hawa, tassyklaýyn</Text>
                </>
              )}
            </Pressable>
            <Pressable onPress={() => setDirectStep("payment")} style={s.secondaryBtn}>
              <Feather name="arrow-left" size={16} color={colors.mutedForeground} />
              <Text style={[s.secondaryBtnText, { color: colors.mutedForeground }]}>Yza</Text>
            </Pressable>
          </View>
        )}

        {main === "direct" && directStep === "success" && (
          <View style={[s.successCard, { backgroundColor: "#f0fdf4", borderColor: "#86efac" }]}>
            <Ionicons name="trophy-outline" size={48} color="#059669" />
            <Text style={[s.successTitle, { color: "#065f46" }]}>Üstünlikli!</Text>
            <Text style={[s.successText, { color: "#047857" }]}>
              Iň tiz wagtda siz bilen baglanarlar we bron kody bilen bilet nusgasyny iberärler.
            </Text>
            <Pressable onPress={() => {
              setMain("choose"); setDirectStep("form");
              setName(""); setSurname(""); setPassport(""); setBirthdate(""); setTravelDate("");
              setClientPhone(""); setProofType(null); setSmsText(""); setScreenshotUri(null);
              setFirstClass(false); setSecondClass(false); setMediaPortal(false); setError("");
            }}
              style={({ pressed }) => [s.primaryBtn, { backgroundColor: "#059669", opacity: pressed ? 0.85 : 1 }]}>
              <Ionicons name="home-outline" size={18} color="#fff" />
              <Text style={s.primaryBtnText}>Baş sahypa</Text>
            </Pressable>
          </View>
        )}

        {/* ══════════════════════════════════════════
            AGENT ORDER FLOW
        ══════════════════════════════════════════ */}
        {main === "agent" && !agentDone && (
          <View>
            <View style={[s.agentHero, { backgroundColor: "#8b5cf6" + "12", borderColor: "#8b5cf6" + "30" }]}>
              <MaterialCommunityIcons name="robot-outline" size={32} color="#8b5cf6" />
              <View style={{ flex: 1 }}>
                <Text style={[s.agentHeroTitle, { color: "#7c3aed" }]}>7/24 Agent Hyzmat</Text>
                <Text style={[s.agentHeroDesc, { color: "#6d28d9" + "cc" }]}>
                  Bilet maglumatlaryňyzy giriziň. Bilet çykan dessine alyp bereris.
                </Text>
              </View>
            </View>

            {[
              { label: "Adyňyz we Familýaňyz", value: agentName, set: setAgentName, ph: "Doly adyňyz" },
              { label: "Telefon nomeriňiz", value: agentPhone, set: setAgentPhone, ph: "+99361xxxxxx", phone: true },
              { label: "Ugur (Nirden → Nira)", value: agentRoute, set: setAgentRoute, ph: "Mysal: Aşgabat → Mary" },
              { label: "Sapar güni", value: agentDate, set: setAgentDate, ph: "Mysal: 25.06.2025" },
            ].map((f, i) => (
              <View key={i} style={{ marginTop: 14 }}>
                <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>{f.label}</Text>
                <TextInput value={f.value} onChangeText={f.set} placeholder={f.ph}
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType={(f as any).phone ? "phone-pad" : "default"}
                  style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                />
              </View>
            ))}

            <View style={{ marginTop: 14 }}>
              <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Goşmaça bellik (islege görä)</Text>
              <TextInput value={agentNote} onChangeText={setAgentNote}
                placeholder="Mysal: 1-nji gat, 2 adam, ýa başga islegi..." placeholderTextColor={colors.mutedForeground}
                multiline numberOfLines={3}
                style={[s.input, s.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>

            <View style={[s.warnBox, { backgroundColor: "#ede9fe", borderColor: "#8b5cf6", marginTop: 16 }]}>
              <Ionicons name="information-circle-outline" size={16} color="#7c3aed" />
              <Text style={{ color: "#5b21b6", fontSize: 13, flex: 1, lineHeight: 18 }}>
                Sargydyňyz alynandan soň operatorymyz size jaň eder we töleg we tassyklama barada habar berer.
              </Text>
            </View>

            <Pressable onPress={handleAgentSubmit} disabled={agentLoading}
              style={({ pressed }) => [s.primaryBtn, { backgroundColor: "#8b5cf6", opacity: pressed || agentLoading ? 0.75 : 1 }]}>
              {agentLoading ? <ActivityIndicator color="#fff" size="small" /> : (
                <>
                  <MaterialCommunityIcons name="robot-outline" size={18} color="#fff" />
                  <Text style={s.primaryBtnText}>Tabşyrmak</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {main === "agent" && agentDone && (
          <View style={[s.successCard, { backgroundColor: "#faf5ff", borderColor: "#c4b5fd" }]}>
            <MaterialCommunityIcons name="robot-outline" size={48} color="#8b5cf6" />
            <Text style={[s.successTitle, { color: "#5b21b6" }]}>Tabşyryldy!</Text>
            <Text style={[s.successText, { color: "#6d28d9" }]}>
              Agentimiz 7/24 bilet ýerini kuzatýar. Bilet çykan dessine alyp, size habar ederis.
            </Text>
            <Pressable onPress={() => { setMain("choose"); setAgentDone(false); setAgentName(""); setAgentPhone(""); setAgentRoute(""); setAgentDate(""); setAgentNote(""); }}
              style={({ pressed }) => [s.primaryBtn, { backgroundColor: "#8b5cf6", opacity: pressed ? 0.85 : 1 }]}>
              <Ionicons name="home-outline" size={18} color="#fff" />
              <Text style={s.primaryBtnText}>Baş sahypa</Text>
            </Pressable>
          </View>
        )}

        {/* ══════════════════════════════════════════
            SMS ZAÝAWKA FLOW
        ══════════════════════════════════════════ */}
        {main === "sms" && (
          <View>
            {/* Step indicator */}
            <View style={s.stepRow}>
              {[1, 2, 3].map(step => (
                <View key={step} style={s.stepWrap}>
                  <View style={[s.stepDot, smsStep >= step ? { backgroundColor: "#0ea5e9" } : { backgroundColor: colors.border }]}>
                    {smsStep > step
                      ? <Ionicons name="checkmark" size={12} color="#fff" />
                      : <Text style={[s.stepNum, { color: smsStep >= step ? "#fff" : colors.mutedForeground }]}>{step}</Text>
                    }
                  </View>
                  {step < 3 && <View style={[s.stepLine, { backgroundColor: smsStep > step ? "#0ea5e9" : colors.border }]} />}
                </View>
              ))}
            </View>

            {/* Step 1 — Personal info */}
            {smsStep === 1 && (
              <>
                <Text style={[s.sectionHead, { color: colors.foreground }]}>Şahsy maglumat</Text>
                <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Adyňyz we Familýaňyz</Text>
                  <TextInput value={smsName} onChangeText={setSmsName}
                    placeholder="Doly adyňyz we familýaňyz" placeholderTextColor={colors.mutedForeground}
                    style={[s.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                  />
                  <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 6 }} />
                  <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Telefon nomeriňiz</Text>
                  <TextInput value={smsPhone} onChangeText={setSmsPhone}
                    placeholder="+993 XX XXXXXX" placeholderTextColor={colors.mutedForeground}
                    keyboardType="phone-pad"
                    style={[s.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                  />
                </View>
                <Pressable onPress={() => {
                  if (!smsName.trim() || !smsPhone.trim()) { Alert.alert("Doldurylmadyk", "Ad we telefon nomeri girizmelisiniz!"); return; }
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setSmsStep(2);
                }}
                  style={[s.primaryBtn, { backgroundColor: "#0ea5e9" }]}>
                  <Text style={s.primaryBtnText}>Indiki</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </Pressable>
              </>
            )}

            {/* Step 2 — Route */}
            {smsStep === 2 && (
              <>
                <Text style={[s.sectionHead, { color: colors.foreground }]}>Ugur we sene</Text>
                <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowRouteList(!showRouteList); }}
                  style={[s.selectBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Ionicons name="train-outline" size={20} color="#0ea5e9" />
                  <Text style={[s.selectBtnText, { color: colors.foreground }]}>{selectedSmsRoute?.label}</Text>
                  <Ionicons name={showRouteList ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
                </Pressable>
                {showRouteList && (
                  <View style={[s.routeList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {ROUTES_SMS.map(r => (
                      <Pressable key={r.id} onPress={() => { setSmsRoute(r.id); setShowRouteList(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                        style={[s.routeItem, smsRoute === r.id && { backgroundColor: "#0ea5e9" + "15" }]}>
                        <Text style={[s.routeLabel, { color: smsRoute === r.id ? "#0ea5e9" : colors.foreground }]}>{r.label}</Text>
                        {smsRoute === r.id && <Ionicons name="checkmark" size={16} color="#0ea5e9" />}
                      </Pressable>
                    ))}
                  </View>
                )}
                <Text style={[s.sectionHead, { color: colors.foreground, marginTop: 16 }]}>Otly görnüşi</Text>
                {TRAIN_TYPES.map(t => (
                  <Pressable key={t.id} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSmsTrainType(t.id); }}
                    style={[s.trainCard, { backgroundColor: smsTrainType === t.id ? "#0ea5e9" + "12" : colors.card, borderColor: smsTrainType === t.id ? "#0ea5e9" : colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.trainLabel, { color: smsTrainType === t.id ? "#0ea5e9" : colors.foreground }]}>{t.label}</Text>
                      <Text style={[s.trainDesc, { color: colors.mutedForeground }]}>{t.desc}</Text>
                    </View>
                    <View style={[s.radioOuter, { borderColor: smsTrainType === t.id ? "#0ea5e9" : colors.border }]}>
                      {smsTrainType === t.id && <View style={[s.radioInner, { backgroundColor: "#0ea5e9" }]} />}
                    </View>
                  </Pressable>
                ))}
                <Text style={[s.sectionHead, { color: colors.foreground }]}>Gün we ýolagçy sany</Text>
                <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Sargyt güni (MM.GG.ÝÝÝÝ)</Text>
                  <TextInput value={smsDate} onChangeText={setSmsDate}
                    placeholder="mysal: 20.06.2025" placeholderTextColor={colors.mutedForeground} keyboardType="numeric"
                    style={[s.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                  />
                  <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 6 }} />
                  <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Ýolagçy sany</Text>
                  <View style={s.counterRow}>
                    <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSmsPassengers(p => String(Math.max(1, parseInt(p) - 1))); }}
                      style={[s.counterBtn, { backgroundColor: "#0ea5e9" + "20", borderColor: colors.border }]}>
                      <Ionicons name="remove" size={20} color="#0ea5e9" />
                    </Pressable>
                    <Text style={[s.counterNum, { color: colors.foreground }]}>{smsPassengers}</Text>
                    <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSmsPassengers(p => String(Math.min(8, parseInt(p) + 1))); }}
                      style={[s.counterBtn, { backgroundColor: "#0ea5e9" + "20", borderColor: colors.border }]}>
                      <Ionicons name="add" size={20} color="#0ea5e9" />
                    </Pressable>
                  </View>
                </View>
                <View style={s.btnRow}>
                  <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSmsStep(1); }}
                    style={[s.backBtnRow, { borderColor: colors.border }]}>
                    <Ionicons name="arrow-back" size={18} color={colors.foreground} />
                    <Text style={[s.secondaryBtnText, { color: colors.foreground }]}>Yza</Text>
                  </Pressable>
                  <Pressable onPress={() => {
                    if (!smsDate.trim()) { Alert.alert("Doldurylmadyk", "Sargyt günini giriziň!"); return; }
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setSmsStep(3);
                  }}
                    style={[s.primaryBtn, { backgroundColor: "#0ea5e9", flex: 1 }]}>
                    <Text style={s.primaryBtnText}>Indiki</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </Pressable>
                </View>
              </>
            )}

            {/* Step 3 — Send SMS */}
            {smsStep === 3 && (
              <>
                <Text style={[s.sectionHead, { color: colors.foreground }]}>Goşmaça bellik</Text>
                <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput value={smsNotes} onChangeText={setSmsNotes}
                    placeholder="Goşmaça islegleriňiz bar bolsa ýazyň..."
                    placeholderTextColor={colors.mutedForeground} multiline numberOfLines={3}
                    style={[s.input, s.textarea, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                  />
                </View>
                <Text style={[s.sectionHead, { color: colors.foreground }]}>Sargyt jikme-jikleri</Text>
                <View style={[s.confirmCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {[
                    { icon: "person-outline" as const, label: "Ad", value: smsName },
                    { icon: "call-outline" as const, label: "Nomer", value: `${smsPhone} (TMCell)` },
                    { icon: "train-outline" as const, label: "Ugur", value: selectedSmsRoute?.label ?? "" },
                    { icon: "calendar-outline" as const, label: "Gün", value: smsDate },
                    { icon: "flash-outline" as const, label: "Otly", value: TRAIN_TYPES.find(t => t.id === smsTrainType)?.label ?? "" },
                    { icon: "people-outline" as const, label: "Ýolagçy", value: `${smsPassengers} adam` },
                  ].map((row, i) => (
                    <View key={i}>
                      {i > 0 && <View style={{ height: 1, backgroundColor: colors.border }} />}
                      <View style={s.summaryRow}>
                        <View style={[s.summaryIcon, { backgroundColor: "#0ea5e9" + "15" }]}>
                          <Ionicons name={row.icon} size={16} color="#0ea5e9" />
                        </View>
                        <Text style={[s.summaryLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                        <Text style={[s.summaryValue, { color: colors.foreground }]} numberOfLines={1}>{row.value}</Text>
                      </View>
                    </View>
                  ))}
                </View>
                <Text style={[s.sectionHead, { color: colors.foreground }]}>SMS iberjek nomeri saýlaň</Text>
                {SMS_NUMBERS.map((num, i) => (
                  <Pressable key={i} onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); sendSms(num); }}
                    style={({ pressed }) => [s.smsBtn, { backgroundColor: "#0ea5e9", opacity: pressed ? 0.85 : 1 }]}>
                    <View style={s.smsBtnIcon}>
                      <Ionicons name="chatbubble-ellipses-outline" size={20} color="#0ea5e9" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.smsBtnNum}>{num}</Text>
                      <Text style={s.smsBtnLabel}>SMS ibermek üçin basyň</Text>
                    </View>
                    <Ionicons name="send-outline" size={18} color="#fff" />
                  </Pressable>
                ))}
                <View style={[s.noteBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.mutedForeground} />
                  <Text style={[s.noteText, { color: colors.mutedForeground }]}>
                    SMS iberilenden soň operator sizi 15-30 minut içinde yzyna jaň eder we sargydyňyzy tassyklar.
                  </Text>
                </View>
                <View style={s.btnRow}>
                  <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSmsStep(2); }}
                    style={[s.backBtnRow, { borderColor: colors.border }]}>
                    <Ionicons name="arrow-back" size={18} color={colors.foreground} />
                    <Text style={[s.secondaryBtnText, { color: colors.foreground }]}>Yza</Text>
                  </Pressable>
                  <Pressable onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setSmsStep(1); setSmsName(""); setSmsPhone(""); setSmsDate(""); setSmsNotes(""); setSmsPassengers("1");
                    setMain("choose");
                    Alert.alert("Üstünlikli!", "Sargydyňyz iberildi! Operator siziň bilen habarlaşar.");
                  }}
                    style={[s.primaryBtn, { backgroundColor: "#10b981", flex: 1 }]}>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={s.primaryBtnText}>Tamamla</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },

  // Choose screen
  chooseTitle: { fontSize: 20, fontWeight: "800", marginBottom: 6, marginTop: 4 },
  chooseSub: { fontSize: 13, lineHeight: 18, marginBottom: 20 },
  serviceCard: {
    borderRadius: 20, marginBottom: 14, overflow: "hidden",
    flexDirection: "row",
  },
  cardStripe: { width: 5 },
  cardIconBg: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 16, fontWeight: "800", marginBottom: 5 },
  cardBadge: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  cardBadgeText: { fontSize: 10, fontWeight: "700" },
  cardDesc: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  cardFeatures: { borderTopWidth: 1, paddingTop: 10, gap: 5, paddingBottom: 14 },
  cardFeatureItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardFeatureText: { fontSize: 12 },

  // Agent hero
  agentHero: { flexDirection: "row", gap: 12, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16, alignItems: "flex-start" },
  agentHeroTitle: { fontSize: 15, fontWeight: "800", marginBottom: 4 },
  agentHeroDesc: { fontSize: 13, lineHeight: 18 },

  // SMS steps
  stepRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  stepWrap: { flexDirection: "row", alignItems: "center" },
  stepDot: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  stepNum: { fontSize: 13, fontWeight: "800" },
  stepLine: { width: 44, height: 2, marginHorizontal: 4 },

  // Shared
  sectionHead: { fontSize: 15, fontWeight: "800", marginTop: 18, marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14 },
  textarea: { height: 80, textAlignVertical: "top" },
  infoBox: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12, alignItems: "flex-start" },
  warnBox: { flexDirection: "row", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderLeftWidth: 4, marginBottom: 12, alignItems: "flex-start" },
  priceBadge: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 16, marginBottom: 4 },
  priceText: { fontWeight: "700", fontSize: 16 },
  proofCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 14, borderWidth: 1.5, marginBottom: 10 },
  proofLabel: { fontSize: 14, fontWeight: "600" },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  selectBtn: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  selectBtnText: { flex: 1, fontSize: 14, fontWeight: "600" },
  routeList: { borderRadius: 14, borderWidth: 1, marginTop: 4, overflow: "hidden" },
  routeItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 13 },
  routeLabel: { fontSize: 14, fontWeight: "600" },
  trainCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 2, padding: 14, marginBottom: 8 },
  trainLabel: { fontSize: 14, fontWeight: "700" },
  trainDesc: { fontSize: 12, marginTop: 2 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  counterRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  counterBtn: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  counterNum: { fontSize: 22, fontWeight: "800", width: 32, textAlign: "center" },
  confirmCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 16 },
  confirmRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1 },
  confirmKey: { fontSize: 12, width: 90 },
  confirmVal: { fontSize: 13, fontWeight: "700", flex: 1, textAlign: "right" },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  summaryIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  summaryLabel: { width: 70, fontSize: 12 },
  summaryValue: { flex: 1, fontSize: 13, fontWeight: "700", textAlign: "right" },
  smsBtn: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 16, marginBottom: 10 },
  smsBtnIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  smsBtnNum: { color: "#fff", fontSize: 15, fontWeight: "800" },
  smsBtnLabel: { color: "rgba(255,255,255,0.8)", fontSize: 11, marginTop: 2 },
  noteBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12, marginTop: 4 },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18 },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, paddingVertical: 16, marginTop: 14 },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  secondaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, marginTop: 4 },
  secondaryBtnText: { fontSize: 14, fontWeight: "600" },
  backBtnRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20, borderWidth: 1 },
  successCard: { borderRadius: 20, borderWidth: 1.5, padding: 28, alignItems: "center", gap: 12, marginTop: 16 },
  successTitle: { fontSize: 22, fontWeight: "800" },
  successText: { fontSize: 14, lineHeight: 20, textAlign: "center" },
});
