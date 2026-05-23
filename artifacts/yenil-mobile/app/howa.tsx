import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  Alert, Platform, Modal, FlatList,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";
import { PessimisticButton } from "@/components/PessimisticButton";
import { saveOrder, deductBalanceAtomic } from "@/lib/firebase";
import BPCheckoutModal from "@/components/BPCheckoutModal";
import { addToHistory, getHistory, type OrderHistoryItem } from "@/lib/orderHistory";

// ── Data ────────────────────────────────────────────────────────────
const DOMESTIC = [
  { code: "ASB", city: "Aşgabat", flag: "" },
  { code: "MYP", city: "Mary", flag: "" },
  { code: "KRW", city: "Türkmenbaşy", flag: "" },
  { code: "CRZ", city: "Türkmenabat", flag: "" },
  { code: "TAZ", city: "Daşoguz", flag: "" },
];

const INTERNATIONAL = [
  { code: "ASB", city: "Aşgabat (TM)", flag: "" },
  { code: "SVO", city: "Moskwa", flag: "" },
  { code: "IST", city: "Stambul", flag: "" },
  { code: "FRA", city: "Frankfurt", flag: "" },
  { code: "LHR", city: "Londra", flag: "" },
  { code: "PEK", city: "Pekin", flag: "" },
  { code: "DXB", city: "Dubaý", flag: "" },
  { code: "AUH", city: "Abu-Dabi", flag: "" },
  { code: "DEL", city: "Deli", flag: "" },
  { code: "MSQ", city: "Minskde", flag: "" },
  { code: "KBP", city: "Kiýew", flag: "" },
  { code: "GYD", city: "Baku", flag: "" },
  { code: "KZN", city: "Kazan", flag: "" },
  { code: "ATQ", city: "Amritsar", flag: "" },
  { code: "BHX", city: "Birmingem", flag: "" },
];

const INTL_CURRENCIES_UNUSED = [
  { code: "USD", name: "Dollar", flag: "🇺🇸", symbol: "$" },
  { code: "EUR", name: "Ýewro", flag: "🇪🇺", symbol: "€" },
  { code: "GBP", name: "Funt sterling", flag: "🇬🇧", symbol: "£" },
  { code: "RUB", name: "Rus rubly", flag: "🇷🇺", symbol: "₽" },
  { code: "TRY", name: "Türk lirasy", flag: "🇹🇷", symbol: "₺" },
  { code: "AED", name: "Dirhem", flag: "🇦🇪", symbol: "د.إ" },
  { code: "CNY", name: "Hytaý ýuany", flag: "🇨🇳", symbol: "¥" },
];

type OrderMode = "" | "tabshyr" | "goni";
type FlightType = "içerki" | "daşarky";
type TripType = "baryş" | "baryş-gelişli";
type Step = "method" | "search" | "passenger" | "payment" | "success";
type PayMethod = "" | "bonus";
type Picker = "from" | "to" | null;

interface City { code: string; city: string; flag: string; }

// ── City Picker Modal ────────────────────────────────────────────────
function CityModal({
  visible, cities, onSelect, onClose, title,
}: {
  visible: boolean;
  cities: City[];
  onSelect: (c: City) => void;
  onClose: () => void;
  title: string;
}) {
  const colors = useColors();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={cm.overlay} onPress={onClose} />
      <View style={[cm.sheet, { backgroundColor: colors.background }]}>
        <View style={[cm.handle, { backgroundColor: colors.border }]} />
        <Text style={[cm.title, { color: colors.foreground }]}>{title}</Text>
        <FlatList
          data={cities}
          keyExtractor={(c) => c.code}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelect(item); onClose(); }}
              style={({ pressed }) => [cm.cityRow, { backgroundColor: pressed ? colors.muted : "transparent" }]}
            >
              <Ionicons name="location-outline" size={18} color={colors.mutedForeground} />
              <View style={{ flex: 1 }}>
                <Text style={[cm.cityName, { color: colors.foreground }]}>{item.city}</Text>
                <Text style={[cm.cityCode, { color: colors.mutedForeground }]}>IATA: {item.code}</Text>
              </View>
              <View style={[cm.codePill, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[cm.codePillText, { color: colors.primary }]}>{item.code}</Text>
              </View>
            </Pressable>
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
  );
}

const cm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 40, maxHeight: "75%" },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "800", marginBottom: 16 },
  cityRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, paddingHorizontal: 4, borderRadius: 14 },
  cityFlag: { fontSize: 28 },
  cityName: { fontSize: 15, fontWeight: "700" },
  cityCode: { fontSize: 12, marginTop: 1 },
  codePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  codePillText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
});

// ── Main Screen ─────────────────────────────────────────────────────
export default function HowaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { balance, deviceId } = useBonusPul();
  const isWeb = Platform.OS === "web";
  const isIOS = Platform.OS === "ios";

  // Flight config
  const [flightType, setFlightType] = useState<FlightType>("içerki");
  const [tripType, setTripType] = useState<TripType>("baryş");
  const [from, setFrom] = useState<City | null>(null);
  const [to, setTo] = useState<City | null>(null);
  const [depDate, setDepDate] = useState("");
  const [retDate, setRetDate] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [picker, setPicker] = useState<Picker>(null);

  // Passenger info
  const [pasName, setPasName] = useState("");
  const [pasPassport, setPasPassport] = useState("");
  const [pasBirth, setPasBirth] = useState("");
  const [pasPhone, setPasPhone] = useState("");

  // Order mode
  const [orderMode, setOrderMode] = useState<OrderMode>("");

  // Payment — BP only
  const [payMethod, setPayMethod] = useState<PayMethod>("");
  const [showHowaTopUp, setShowHowaTopUp] = useState(false);

  const [step, setStep] = useState<Step>("method");
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState("");

  // ── Internal bottom tabs ──────────────────────────────────────────
  const [howaTab, setHowaTab] = useState<"book" | "myflights" | "info">("book");
  const [ucusHist, setUcusHist] = useState<OrderHistoryItem[]>([]);

  useEffect(() => {
    if (howaTab !== "myflights") return;
    getHistory().then((h) => setUcusHist(h.filter((x) => x.type === "howa-bilet")));
  }, [howaTab]);

  const cities = flightType === "içerki" ? DOMESTIC : INTERNATIONAL;

  function swapCities() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const tmp = from;
    setFrom(to);
    setTo(tmp);
  }

  function goToPassenger() {
    if (!from || !to) { Alert.alert("Ugur saýlaň", "Uçuş uguryny saýlaň!"); return; }
    if (from.code === to.code) { Alert.alert("Ýalňyşlyk", "Baryş we gelşik nokady birmeňzeş bolup bilmez!"); return; }
    if (!depDate.trim()) { Alert.alert("Senäni giriziň", "Uçuş senesini giriziň!"); return; }
    if (tripType === "baryş-gelişli" && !retDate.trim()) { Alert.alert("Sena giriziň", "Gaýdyş senesini giriziň!"); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep("passenger");
  }

  function goToPayment() {
    if (!pasName.trim()) { Alert.alert("Ýalňyşlyk", "Adyňyzy giriziň!"); return; }
    if (!pasPassport.trim()) { Alert.alert("Ýalňyşlyk", "Pasport belgiňizi giriziň!"); return; }
    if (!pasBirth.trim()) { Alert.alert("Ýalňyşlyk", "Doglan senäňizi giriziň!"); return; }
    if (!pasPhone.trim()) { Alert.alert("Ýalňyşlyk", "Telefon nomeriňizi giriziň!"); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep("payment");
  }

  async function handleBooking() {
    if (balance < 50) { setShowHowaTopUp(true); return; }
    const result = await deductBalanceAtomic(deviceId, 50);
    if (!result.success) { setShowHowaTopUp(true); return; }
    setLoading(true);
    try {
      const id = `HW-${Date.now().toString(36).toUpperCase()}`;
      await saveOrder("howa-bilet-orders", {
        deviceId, bookingId: id, orderMode, flightType, tripType,
        from: from?.code, fromCity: from?.city,
        to: to?.code, toCity: to?.city,
        depDate, retDate: tripType === "baryş-gelişli" ? retDate : null,
        passengers,
        passenger: { name: pasName, passport: pasPassport, birth: pasBirth, phone: pasPhone },
        payMethod: "bonus", status: "pending",
      });
      await addToHistory({
        type: "howa-bilet", title: "Howa biledi",
        details: `${from?.city} → ${to?.city} · ${depDate} · ${passengers} ýolagçy`,
        amount: 50, amountLabel: "-50 BP", phone: pasPhone,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setBookingId(id);
      setStep("success");
    } catch {
      Alert.alert("Ýalňyşlyk", "Haýyşnama iberilmedi. Gaýtadan synanyşyň.");
    } finally { setLoading(false); }
  }

  function resetAll() {
    setStep("method");
    setOrderMode("");
    setFrom(null); setTo(null);
    setDepDate(""); setRetDate("");
    setPassengers(1);
    setPasName(""); setPasPassport(""); setPasBirth(""); setPasPhone("");
    setPayMethod(""); setShowHowaTopUp(false);
    setBookingId("");
  }

  const ptop = (isWeb ? 0 : insets.top) + 12;

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* Hero Header */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={[s.hero, { paddingTop: ptop }]}>
        <View style={s.heroTop}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.heroTitle}>Howa Ýollary</Text>
            <Text style={s.heroSub}>Türkmenistan Howa Ýollary · T5</Text>
          </View>
          <View style={s.heroPlaneCircle}>
            <Ionicons name="airplane" size={24} color="#fff" />
          </View>
        </View>

        {/* Step indicators — hidden on method step */}
        {step !== "method" && step !== "success" && (
          <View style={s.steps}>
            {(["search", "passenger", "payment"] as Step[]).map((st, i) => {
              const labels = ["Gözleg", "Ýolagçy", "Töleg"];
              const order = ["search", "passenger", "payment"];
              const done = order.indexOf(step) > i;
              const active = step === st;
              return (
                <View key={st} style={s.stepItem}>
                  <View style={[s.stepDot, {
                    backgroundColor: active ? "#fff" : done ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)",
                    width: active ? 28 : 20,
                    height: active ? 28 : 20,
                  }]}>
                    {done
                      ? <Ionicons name="checkmark" size={12} color="#0ea5e9" />
                      : <Text style={[s.stepNum, { color: active ? "#0ea5e9" : "rgba(255,255,255,0.6)", fontSize: active ? 12 : 10 }]}>{i + 1}</Text>}
                  </View>
                  {active && <Text style={s.stepLabel}>{labels[i]}</Text>}
                </View>
              );
            })}
          </View>
        )}
      </LinearGradient>

      {howaTab === "book" && (
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 130 : 130 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── STEP: METHOD ── */}
        {step === "method" && (
          <>
            <Text style={[s.methodGreet, { color: colors.mutedForeground }]}>
              Uçuş biledini nähili almak isleýärsiňiz?
            </Text>

            {/* Tabşyrmak option */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setOrderMode("tabshyr");
                setStep("search");
              }}
              style={({ pressed }) => [s.methodCard, {
                backgroundColor: colors.card,
                borderColor: "#0ea5e9",
                opacity: pressed ? 0.92 : 1,
              }]}
            >
              <View style={[s.methodIconCircle, { backgroundColor: "#0ea5e920" }]}>
                <Ionicons name="people-outline" size={32} color="#0ea5e9" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.methodTitle, { color: colors.foreground }]}>Bize tabşyrmak</Text>
                <Text style={[s.methodDesc, { color: colors.mutedForeground }]}>
                  Bilet gözlegini we satyn almagyny hünärmenlerimiz ýerine ýetirer. Siz diňe zerur maglumatlary girizýärsiňiz.
                </Text>
                <View style={[s.methodBadge, { backgroundColor: "#0ea5e920" }]}>
                  <Ionicons name="checkmark-circle-outline" size={13} color="#0ea5e9" />
                  <Text style={[s.methodBadgeText, { color: "#0ea5e9" }]}>Töleg tassyklanandan soň bilet berilýär</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#0ea5e9" />
            </Pressable>

            {/* Göni almak option */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setOrderMode("goni");
                setStep("search");
              }}
              style={({ pressed }) => [s.methodCard, {
                backgroundColor: colors.card,
                borderColor: "#10b981",
                opacity: pressed ? 0.92 : 1,
              }]}
            >
              <View style={[s.methodIconCircle, { backgroundColor: "#10b98120" }]}>
                <Ionicons name="flash-outline" size={32} color="#10b981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.methodTitle, { color: colors.foreground }]}>Göni almak</Text>
                <Text style={[s.methodDesc, { color: colors.mutedForeground }]}>
                  Uçuş uguryny özüňiz saýlap, göni sargyt ediň. Tiz we ýönekeý tertip.
                </Text>
                <View style={[s.methodBadge, { backgroundColor: "#10b98120" }]}>
                  <Ionicons name="flash-outline" size={13} color="#10b981" />
                  <Text style={[s.methodBadgeText, { color: "#10b981" }]}>Tiz işlenip, habarlaşylýar</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#10b981" />
            </Pressable>

            <View style={[s.noticeBox, { backgroundColor: "#f59e0b10", borderColor: "#f59e0b40", marginTop: 8 }]}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#f59e0b" />
              <Text style={[s.noticeText, { color: "#f59e0b" }]}>
                Iki usulda hem sargydyňyz howpsuz saklanýar we işlenenden soň size habar berilýär.
              </Text>
            </View>
          </>
        )}

        {/* ── STEP: SEARCH ── */}
        {step === "search" && (
          <>
            {/* Flight type selector */}
            <View style={[s.segBox, { backgroundColor: colors.muted }]}>
              {(["içerki", "daşarky"] as FlightType[]).map((ft) => (
                <Pressable
                  key={ft}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFlightType(ft);
                    setFrom(null); setTo(null);
                  }}
                  style={[s.segBtn, {
                    backgroundColor: flightType === ft ? colors.card : "transparent",
                    shadowColor: flightType === ft ? "#000" : "transparent",
                    shadowOpacity: flightType === ft ? 0.12 : 0,
                    shadowRadius: 4, elevation: flightType === ft ? 3 : 0,
                    shadowOffset: { width: 0, height: 2 },
                  }]}
                >
                  <Ionicons
                    name={ft === "içerki" ? "home-outline" : "globe-outline"}
                    size={15}
                    color={flightType === ft ? colors.primary : colors.mutedForeground}
                  />
                  <Text style={[s.segText, { color: flightType === ft ? colors.foreground : colors.mutedForeground }]}>
                    {ft === "içerki" ? "Içerki" : "Daşarky"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Trip type */}
            <View style={[s.tripRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {(["baryş", "baryş-gelişli"] as TripType[]).map((tt) => (
                <Pressable
                  key={tt}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTripType(tt); }}
                  style={[s.tripBtn, {
                    borderColor: tripType === tt ? colors.primary : "transparent",
                    backgroundColor: tripType === tt ? colors.primary + "12" : "transparent",
                  }]}
                >
                  <Ionicons
                    name={tt === "baryş" ? "arrow-forward-outline" : "swap-horizontal-outline"}
                    size={16}
                    color={tripType === tt ? colors.primary : colors.mutedForeground}
                  />
                  <Text style={[s.tripText, { color: tripType === tt ? colors.primary : colors.mutedForeground }]}>
                    {tt === "baryş" ? "Bir taraply" : "Baryş-Gelişli"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Route selector */}
            <View style={[s.routeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Pressable onPress={() => setPicker("from")} style={s.routeField}>
                <View style={[s.routeIcon, { backgroundColor: "#0ea5e920" }]}>
                  <Ionicons name="airplane-outline" size={18} color="#0ea5e9" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.routeLabel, { color: colors.mutedForeground }]}>Ugur (baryş)</Text>
                  <Text style={[s.routeCity, { color: from ? colors.foreground : colors.mutedForeground }]}>
                    {from ? from.city : "Şäher saýlaň"}
                  </Text>
                  {from && <Text style={[s.routeCode, { color: colors.primary }]}>{from.code}</Text>}
                </View>
                <Ionicons name="chevron-down" size={18} color={colors.mutedForeground} />
              </Pressable>

              {/* Swap button */}
              <Pressable onPress={swapCities} style={[s.swapBtn, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="swap-vertical" size={18} color={colors.primary} />
              </Pressable>

              <View style={[s.routeDivider, { backgroundColor: colors.border }]} />

              <Pressable onPress={() => setPicker("to")} style={s.routeField}>
                <View style={[s.routeIcon, { backgroundColor: "#10b98120" }]}>
                  <Ionicons name="location-outline" size={18} color="#10b981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.routeLabel, { color: colors.mutedForeground }]}>Ugur (baryljak)</Text>
                  <Text style={[s.routeCity, { color: to ? colors.foreground : colors.mutedForeground }]}>
                    {to ? to.city : "Şäher saýlaň"}
                  </Text>
                  {to && <Text style={[s.routeCode, { color: "#10b981" }]}>{to.code}</Text>}
                </View>
                <Ionicons name="chevron-down" size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>

            {/* Dates */}
            <View style={[s.datesRow, { gap: tripType === "baryş-gelişli" ? 10 : 0 }]}>
              <View style={[s.dateCard, { backgroundColor: colors.card, borderColor: colors.border, flex: 1 }]}>
                <Ionicons name="calendar-outline" size={18} color="#0ea5e9" />
                <View style={{ flex: 1 }}>
                  <Text style={[s.dateLabel, { color: colors.mutedForeground }]}>Baryş senesi</Text>
                  <TextInput
                    value={depDate}
                    onChangeText={setDepDate}
                    placeholder="GG/AA/ÝÝÝÝ"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="numbers-and-punctuation"
                    style={[s.dateInput, { color: colors.foreground }]}
                  />
                </View>
              </View>
              {tripType === "baryş-gelişli" && (
                <View style={[s.dateCard, { backgroundColor: colors.card, borderColor: colors.border, flex: 1 }]}>
                  <Ionicons name="calendar-outline" size={18} color="#10b981" />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.dateLabel, { color: colors.mutedForeground }]}>Gaýdyş senesi</Text>
                    <TextInput
                      value={retDate}
                      onChangeText={setRetDate}
                      placeholder="GG/AA/ÝÝÝÝ"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="numbers-and-punctuation"
                      style={[s.dateInput, { color: colors.foreground }]}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Passenger count */}
            <View style={[s.passengerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[s.routeIcon, { backgroundColor: "#6366f120" }]}>
                <Ionicons name="people-outline" size={18} color="#6366f1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.routeLabel, { color: colors.mutedForeground }]}>Ýolagçy sany</Text>
                <Text style={[s.routeCity, { color: colors.foreground }]}>
                  {passengers} ýolagçy
                </Text>
              </View>
              <View style={s.counterRow}>
                <Pressable
                  onPress={() => { if (passengers > 1) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPassengers(p => p - 1); } }}
                  style={[s.counterBtn, { backgroundColor: passengers > 1 ? colors.primary + "15" : colors.muted }]}
                >
                  <Ionicons name="remove" size={18} color={passengers > 1 ? colors.primary : colors.mutedForeground} />
                </Pressable>
                <Text style={[s.counterNum, { color: colors.foreground }]}>{passengers}</Text>
                <Pressable
                  onPress={() => { if (passengers < 9) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPassengers(p => p + 1); } }}
                  style={[s.counterBtn, { backgroundColor: colors.primary + "15" }]}
                >
                  <Ionicons name="add" size={18} color={colors.primary} />
                </Pressable>
              </View>
            </View>

            {/* Info notice */}
            <View style={[s.noticeBox, { backgroundColor: "#0ea5e910", borderColor: "#0ea5e940" }]}>
              <Ionicons name="information-circle-outline" size={16} color="#0ea5e9" />
              <Text style={[s.noticeText, { color: "#0ea5e9" }]}>
                Bilet bahasyny administrator tassyklandan soň görkeziler. Sargytdan soň habarlaşarys.
              </Text>
            </View>

            <Pressable
              onPress={goToPassenger}
              style={({ pressed }) => [s.primaryBtn, { backgroundColor: "#0ea5e9", opacity: pressed ? 0.85 : 1 }]}
            >
              <Ionicons name="search-outline" size={18} color="#fff" />
              <Text style={s.primaryBtnText}>Gözleg & Dowam etmek</Text>
            </Pressable>

            <Pressable onPress={() => setStep("method")} style={s.backRow}>
              <Ionicons name="chevron-back" size={16} color={colors.mutedForeground} />
              <Text style={[s.backText, { color: colors.mutedForeground }]}>Yza</Text>
            </Pressable>
          </>
        )}

        {/* ── STEP: PASSENGER ── */}
        {step === "passenger" && (
          <>
            {/* Flight summary */}
            <View style={[s.summaryCard, { backgroundColor: "#0ea5e9" }]}>
              <View style={s.summaryRow}>
                <View style={s.summaryCity}>
                  <Text style={s.summaryCode}>{from?.code}</Text>
                  <Text style={s.summaryName}>{from?.city}</Text>
                </View>
                <View style={s.summaryMid}>
                  <Ionicons name="airplane" size={20} color="rgba(255,255,255,0.9)" />
                  <Text style={s.summaryDate}>{depDate}</Text>
                </View>
                <View style={[s.summaryCity, { alignItems: "flex-end" }]}>
                  <Text style={s.summaryCode}>{to?.code}</Text>
                  <Text style={s.summaryName}>{to?.city}</Text>
                </View>
              </View>
              <View style={s.summaryTags}>
                <View style={s.summaryTag}>
                  <Text style={s.summaryTagText}>{flightType === "içerki" ? "Içerki uçuş" : "Halkara uçuş"}</Text>
                </View>
                <View style={s.summaryTag}>
                  <Text style={s.summaryTagText}>{tripType === "baryş" ? "Bir taraply" : "Baryş-Gelişli"}</Text>
                </View>
                <View style={s.summaryTag}>
                  <Text style={s.summaryTagText}>{passengers} ýolagçy</Text>
                </View>
              </View>
            </View>

            <Text style={[s.sectionTitle, { color: colors.mutedForeground }]}>ÝOLAGÇY MAGLUMATLARY</Text>

            <View style={[s.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Name */}
              <View style={s.fieldWrap}>
                <View style={[s.fieldIcon, { backgroundColor: "#6366f120" }]}>
                  <Ionicons name="person-outline" size={16} color="#6366f1" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.fieldLabel2, { color: colors.mutedForeground }]}>Doly adyňyz (latynça)</Text>
                  <TextInput
                    value={pasName}
                    onChangeText={setPasName}
                    placeholder="MYSAL MYSAL MYSALOW"
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="characters"
                    style={[s.fieldInput, { color: colors.foreground, borderBottomColor: colors.border }]}
                  />
                </View>
              </View>

              <View style={[s.fieldDivider, { backgroundColor: colors.border }]} />

              {/* Passport */}
              <View style={s.fieldWrap}>
                <View style={[s.fieldIcon, { backgroundColor: "#f59e0b20" }]}>
                  <Ionicons name="card-outline" size={16} color="#f59e0b" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.fieldLabel2, { color: colors.mutedForeground }]}>Pasport belgisi</Text>
                  <TextInput
                    value={pasPassport}
                    onChangeText={setPasPassport}
                    placeholder="TM 1234567"
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="characters"
                    style={[s.fieldInput, { color: colors.foreground, borderBottomColor: colors.border }]}
                  />
                </View>
              </View>

              <View style={[s.fieldDivider, { backgroundColor: colors.border }]} />

              {/* Birth date */}
              <View style={s.fieldWrap}>
                <View style={[s.fieldIcon, { backgroundColor: "#ec489920" }]}>
                  <Ionicons name="calendar-number-outline" size={16} color="#ec4899" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.fieldLabel2, { color: colors.mutedForeground }]}>Doglan senesiz</Text>
                  <TextInput
                    value={pasBirth}
                    onChangeText={setPasBirth}
                    placeholder="GG/AA/ÝÝÝÝ"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="numbers-and-punctuation"
                    style={[s.fieldInput, { color: colors.foreground, borderBottomColor: colors.border }]}
                  />
                </View>
              </View>

              <View style={[s.fieldDivider, { backgroundColor: colors.border }]} />

              {/* Phone */}
              <View style={s.fieldWrap}>
                <View style={[s.fieldIcon, { backgroundColor: "#10b98120" }]}>
                  <Ionicons name="call-outline" size={16} color="#10b981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.fieldLabel2, { color: colors.mutedForeground }]}>Telefon nomeriňiz</Text>
                  <TextInput
                    value={pasPhone}
                    onChangeText={setPasPhone}
                    placeholder="+993 XX XXXXXX"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="phone-pad"
                    style={[s.fieldInput, { color: colors.foreground, borderBottomColor: colors.border }]}
                  />
                </View>
              </View>
            </View>

            {passengers > 1 && (
              <View style={[s.noticeBox, { backgroundColor: "#f59e0b10", borderColor: "#f59e0b40" }]}>
                <Ionicons name="information-circle-outline" size={16} color="#f59e0b" />
                <Text style={[s.noticeText, { color: "#f59e0b" }]}>
                  {passengers} ýolagçy üçin sargyt. Galan ýolagçylaryň maglumatlary telefon arkaly alnar.
                </Text>
              </View>
            )}

            <Pressable
              onPress={goToPayment}
              style={({ pressed }) => [s.primaryBtn, { backgroundColor: "#0ea5e9", opacity: pressed ? 0.85 : 1 }]}
            >
              <Ionicons name="arrow-forward-circle-outline" size={18} color="#fff" />
              <Text style={s.primaryBtnText}>Töleg usulyna geç</Text>
            </Pressable>

            <Pressable onPress={() => setStep("search")} style={s.backRow}>
              <Ionicons name="chevron-back" size={16} color={colors.mutedForeground} />
              <Text style={[s.backText, { color: colors.mutedForeground }]}>Yza</Text>
            </Pressable>
          </>
        )}

        {/* ── STEP: PAYMENT (BP only) ── */}
        {step === "payment" && (
          <>
            <Text style={[s.sectionTitle, { color: colors.mutedForeground }]}>BONUS PUL BILEN TÖLEG</Text>

            {/* Flight summary banner */}
            <View style={{ borderRadius: 18, backgroundColor: "#0ea5e9", padding: 18, marginBottom: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="airplane" size={22} color="#fff" />
                </View>
                <View>
                  <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 11 }}>Howa bilet sargydyňyz</Text>
                  <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>{from?.city} → {to?.city}</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 10, padding: 12 }}>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>Hyzmat tölegi</Text>
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>50 BP</Text>
              </View>
            </View>

            {/* Balance status */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12,
              backgroundColor: balance >= 50 ? "#f0fdf4" : "#fff7ed",
              borderColor: balance >= 50 ? "#86efac" : "#fed7aa" }}>
              <Ionicons name="wallet-outline" size={20} color={balance >= 50 ? "#059669" : "#d97706"} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700", fontSize: 13, color: balance >= 50 ? "#059669" : "#d97706" }}>
                  Siziň balansynyz: {balance.toFixed(2)} BP
                </Text>
                {balance < 50 && (
                  <Text style={{ fontSize: 12, color: "#d97706", marginTop: 2 }}>
                    Ýetmezçilik: {(50 - balance).toFixed(2)} BP • Düwme balansy doldurýar
                  </Text>
                )}
              </View>
              {balance >= 50
                ? <Ionicons name="checkmark-circle" size={20} color="#059669" />
                : <Ionicons name="alert-circle" size={20} color="#d97706" />
              }
            </View>

            <PessimisticButton
              label={balance >= 50 ? "50 BP bilen sargyt et" : "Balans doldur we sargyt et"}
              loadingLabel="Işlenýär..."
              loading={loading}
              disabled={loading}
              onPress={handleBooking}
              color="#0ea5e9"
              size="lg"
              icon={<Ionicons name="wallet-outline" size={18} color="#fff" />}
            />

            <BPCheckoutModal
              visible={showHowaTopUp}
              onClose={() => setShowHowaTopUp(false)}
              serviceName={`Howa biledi · ${from?.city ?? ""} → ${to?.city ?? ""}`}
              serviceAmount={50}
              currentBalance={balance}
              deviceId={deviceId}
              onPaymentComplete={() => {
                setShowHowaTopUp(false);
                const id = `HW-${Date.now().toString(36).toUpperCase()}`;
                setBookingId(id);
                Promise.all([
                  saveOrder("howa-bilet-orders", {
                    deviceId, bookingId: id, orderMode, flightType, tripType,
                    from: from?.code, fromCity: from?.city,
                    to: to?.code, toCity: to?.city, depDate,
                    retDate: tripType === "baryş-gelişli" ? retDate : null,
                    passengers,
                    passenger: { name: pasName, passport: pasPassport, birth: pasBirth, phone: pasPhone },
                    payMethod: "bonus", status: "pending",
                  }),
                  addToHistory({
                    type: "howa-bilet", title: "Howa biledi",
                    details: `${from?.city} → ${to?.city} · ${depDate}`,
                    amount: 50, amountLabel: "-50 BP", phone: pasPhone,
                  }),
                ]).then(() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setStep("success");
                }).catch(() => Alert.alert("Ýalňyşlyk", "Sargyt saklanyp bilinmedi."));
              }}
            />

            <Pressable onPress={() => setStep("passenger")} style={s.backRow}>
              <Ionicons name="chevron-back" size={16} color={colors.mutedForeground} />
              <Text style={[s.backText, { color: colors.mutedForeground }]}>Yza</Text>
            </Pressable>
          </>
        )}

        {/* ── STEP: SUCCESS ── */}
        {step === "success" && (
          <View style={s.successWrap}>
            <View style={[s.successCircle, { backgroundColor: "#d1fae5" }]}>
              <Ionicons name="checkmark-circle" size={56} color="#059669" />
            </View>
            <Text style={[s.successTitle, { color: colors.foreground }]}>Haýyşnama kabul edildi!</Text>
            <Text style={[s.successSub, { color: colors.mutedForeground }]}>
              Bilet sargydyňyz kabul edildi. Administrator {pasPhone} nomere habarlaşar.
            </Text>

            {/* Booking card */}
            <View style={[s.bookingCard, { backgroundColor: "#0ea5e9" }]}>
              <Text style={s.bookingCardLabel}>Bron kody</Text>
              <Text style={s.bookingCardId}>{bookingId}</Text>
              <View style={s.bookingDivider} />
              <View style={s.bookingRoute}>
                <View style={{ alignItems: "center" }}>
                  <Text style={s.bookingCode}>{from?.code}</Text>
                  <Text style={s.bookingCityName}>{from?.city}</Text>
                </View>
                <View style={s.bookingArrow}>
                  <Ionicons name="airplane" size={22} color="rgba(255,255,255,0.9)" />
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={s.bookingCode}>{to?.code}</Text>
                  <Text style={s.bookingCityName}>{to?.city}</Text>
                </View>
              </View>
              <View style={s.bookingMeta}>
                <Text style={s.bookingMetaText}>Senesi: {depDate}</Text>
                <Text style={s.bookingMetaText}>Ýolagçy: {passengers}</Text>
                <Text style={s.bookingMetaText}>BP</Text>
              </View>
            </View>

            <View style={[s.noticeBox, { backgroundColor: "#f0fdf4", borderColor: "#86efac" }]}>
              <Ionicons name="time-outline" size={16} color="#15803d" />
              <Text style={[s.noticeText, { color: "#15803d" }]}>
                Tassyklama 30 minut – 2 sagat içinde amala aşyrylýar.
              </Text>
            </View>

            <Pressable
              onPress={resetAll}
              style={({ pressed }) => [s.primaryBtn, { backgroundColor: "#0ea5e9", opacity: pressed ? 0.85 : 1 }]}
            >
              <Ionicons name="refresh-outline" size={18} color="#fff" />
              <Text style={s.primaryBtnText}>Täze bilet sargytlamak</Text>
            </Pressable>

            <Pressable onPress={() => router.back()} style={s.backRow}>
              <Ionicons name="home-outline" size={16} color={colors.mutedForeground} />
              <Text style={[s.backText, { color: colors.mutedForeground }]}>Baş sahypa</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
      )}

      {/* ── MY FLIGHTS TAB ── */}
      {howaTab === "myflights" && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
          {ucusHist.length === 0 ? (
            <View style={{ alignItems: "center", paddingTop: 60, gap: 12 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#0ea5e915", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="airplane-outline" size={40} color="#0ea5e9" />
              </View>
              <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "800", textAlign: "center" }}>Uçuş tapylmady</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 14, textAlign: "center", lineHeight: 20 }}>
                Bilet satyn alansoň,{"\n"}uçuşlaryňyz şu ýerde görüner.
              </Text>
            </View>
          ) : (
            ucusHist.map((item) => (
              <View key={item.id} style={{ backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: "#0ea5e920", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="airplane" size={22} color="#0ea5e9" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: "800" }}>{item.title}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>{item.details}</Text>
                  </View>
                  <View style={{ backgroundColor: "#f59e0b18", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ color: "#d97706", fontSize: 11, fontWeight: "700" }}>Garaşylýar</Text>
                  </View>
                </View>
                <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
                    {new Date(item.timestamp).toLocaleDateString("ru-RU")}
                  </Text>
                  {item.phone ? (
                    <Text style={{ color: "#0ea5e9", fontSize: 11, fontWeight: "700" }}>{item.phone}</Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* ── FLIGHT INFO TAB ── */}
      {howaTab === "info" && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
          <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 10 }}>
            AEROPORT MAGLUMAT
          </Text>
          {([
            { code: "ASB", name: "Aşgabat Halkara Aeroporty", terminal: "T1, T2" },
            { code: "MYP", name: "Mary Aeroporty", terminal: "T1" },
            { code: "CRZ", name: "Türkmenabat Aeroporty", terminal: "T1" },
            { code: "KRW", name: "Türkmenbaşy Aeroporty", terminal: "T1" },
            { code: "TAZ", name: "Daşoguz Aeroporty", terminal: "T1" },
          ] as const).map((ap) => (
            <View key={ap.code} style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 14 }}>
              <Ionicons name="airplane-outline" size={28} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "800" }}>{ap.name}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>Terminal: {ap.terminal}</Text>
              </View>
              <View style={{ backgroundColor: "#0ea5e918", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ color: "#0ea5e9", fontSize: 13, fontWeight: "900" }}>{ap.code}</Text>
              </View>
            </View>
          ))}

          <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginTop: 16, marginBottom: 10 }}>
            HABARLAŞMAK
          </Text>
          {([
            { label: "Bilet Merkezi", phone: "+993 12 390200", icon: "call-outline" as const },
            { label: "Ýük Hyzmaty", phone: "+993 12 390300", icon: "cube-outline" as const },
            { label: "Kömek Hyzmaty", phone: "+993 12 390100", icon: "help-circle-outline" as const },
          ] as const).map((c) => (
            <Pressable
              key={c.phone}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.muted : colors.card,
                borderRadius: 14, borderWidth: 1, borderColor: colors.border,
                padding: 14, marginBottom: 10,
                flexDirection: "row" as const, alignItems: "center" as const, gap: 12,
              })}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#0ea5e918", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={c.icon} size={20} color="#0ea5e9" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "700" }}>{c.label}</Text>
                <Text style={{ color: "#0ea5e9", fontSize: 13, fontWeight: "800", marginTop: 2 }}>{c.phone}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* ── HOWA INTERNAL TAB BAR ── */}
      <View style={[howaBarS.bar, {
        backgroundColor: isIOS ? "transparent" : colors.background,
        borderTopColor: "#0ea5e930",
        paddingBottom: isWeb ? 16 : insets.bottom > 0 ? insets.bottom : 12,
      }]}>
        {([
          { id: "book" as const, label: "Uçuş al", icon: "airplane-outline" as const, activeIcon: "airplane" as const },
          { id: "myflights" as const, label: "Uçuşlarym", icon: "ticket-outline" as const, activeIcon: "ticket" as const },
          { id: "info" as const, label: "Maglumat", icon: "information-circle-outline" as const, activeIcon: "information-circle" as const },
        ]).map((tab) => {
          const active = howaTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setHowaTab(tab.id);
              }}
              style={howaBarS.tabItem}
            >
              <Ionicons
                name={active ? tab.activeIcon : tab.icon}
                size={24}
                color={active ? "#0ea5e9" : colors.mutedForeground}
              />
              <Text style={[howaBarS.tabLabel, {
                color: active ? "#0ea5e9" : colors.mutedForeground,
                fontWeight: active ? "700" : "500",
              }]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* City picker modals */}
      <CityModal
        visible={picker === "from"}
        cities={cities}
        title={flightType === "içerki" ? "Içerki aeroporty saýlaň" : "Ugur şäherini saýlaň"}
        onSelect={setFrom}
        onClose={() => setPicker(null)}
      />
      <CityModal
        visible={picker === "to"}
        cities={cities}
        title={flightType === "içerki" ? "Barjak aeroporty saýlaň" : "Baryljak şäheri saýlaň"}
        onSelect={setTo}
        onClose={() => setPicker(null)}
      />
    </View>
  );
}

// ── Howa Internal Tab Bar Styles ────────────────────────────────────
const howaBarS = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.1,
  },
});

// ── Styles ───────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },

  // Hero
  hero: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  heroTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  heroSub: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 1 },
  heroPlaneCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },

  // Steps
  steps: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepDot: { borderRadius: 99, alignItems: "center", justifyContent: "center" },
  stepNum: { fontWeight: "800" },
  stepLabel: { color: "#fff", fontSize: 12, fontWeight: "700" },

  // Segment
  segBox: { flexDirection: "row", borderRadius: 14, padding: 4, marginBottom: 14 },
  segBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10, borderRadius: 10 },
  segText: { fontSize: 14, fontWeight: "700" },

  // Trip type
  tripRow: { flexDirection: "row", gap: 10, borderRadius: 16, padding: 12, borderWidth: 1, marginBottom: 16 },
  tripBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10, borderRadius: 12, borderWidth: 2 },
  tripText: { fontSize: 13, fontWeight: "700" },

  // Route card
  routeCard: { borderRadius: 20, borderWidth: 1, overflow: "visible", marginBottom: 16, position: "relative" },
  routeField: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  routeIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  routeLabel: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
  routeCity: { fontSize: 16, fontWeight: "700" },
  routeCode: { fontSize: 12, fontWeight: "800", marginTop: 2 },
  routeDivider: { height: 1, marginLeft: 68 },
  swapBtn: { position: "absolute", right: 16, top: "50%", marginTop: -20, width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center", zIndex: 10, backgroundColor: "#fff" },

  // Dates
  datesRow: { flexDirection: "row", marginBottom: 16 },
  dateCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 16, borderWidth: 1, padding: 14 },
  dateLabel: { fontSize: 11, fontWeight: "600", marginBottom: 4 },
  dateInput: { fontSize: 16, fontWeight: "700", padding: 0 },

  // Passenger counter
  passengerCard: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 16 },
  counterRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  counterBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  counterNum: { fontSize: 18, fontWeight: "800", minWidth: 24, textAlign: "center" },

  // Notice
  noticeBox: { flexDirection: "row", gap: 10, alignItems: "flex-start", borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 16 },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 18, fontWeight: "600" },

  // Primary button
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 18, paddingVertical: 18, marginBottom: 12 },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  // Section title
  sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 10, marginTop: 8, marginLeft: 4 },

  // Summary card
  summaryCard: { borderRadius: 22, padding: 18, marginBottom: 20 },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  summaryCity: { alignItems: "flex-start" },
  summaryCode: { color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: 1 },
  summaryName: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "600", marginTop: 2 },
  summaryMid: { alignItems: "center", gap: 6 },
  summaryDate: { color: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: "700" },
  summaryTags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  summaryTag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99, backgroundColor: "rgba(255,255,255,0.2)" },
  summaryTagText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  // Form card
  formCard: { borderRadius: 20, borderWidth: 1, overflow: "hidden", marginBottom: 16 },
  fieldWrap: { flexDirection: "row", alignItems: "flex-start", gap: 14, padding: 16 },
  fieldIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 4 },
  fieldLabel2: { fontSize: 11, fontWeight: "600", marginBottom: 6 },
  fieldInput: { fontSize: 15, fontWeight: "600", padding: 0, flex: 1 },
  fieldDivider: { height: 1, marginLeft: 66 },

  // Back row
  backRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12 },
  backText: { fontSize: 14, fontWeight: "600" },

  // Payment
  payCard: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 18, padding: 16, marginBottom: 12 },
  payIconCircle: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  payLabel: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  payDesc: { fontSize: 12 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioInner: { width: 12, height: 12, borderRadius: 6 },

  // Detail cards
  detailCard: { borderRadius: 18, borderWidth: 1.5, padding: 16, marginBottom: 16 },
  detailCardTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  detailCardSub: { fontSize: 12, lineHeight: 18, marginBottom: 12 },
  phonePill: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginBottom: 8 },
  phonePillText: { fontSize: 15, fontWeight: "800" },
  bonusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  // Merchant card (card payment)
  merchantCard: { borderRadius: 16, padding: 18, marginVertical: 4 },
  merchantCardLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "700", marginBottom: 8 },
  merchantCardNum: { color: "#fff", fontSize: 20, fontWeight: "800", letterSpacing: 2, marginBottom: 6 },
  merchantCardBank: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
  bankGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  bankPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1 },
  bankPillText: { fontSize: 12, fontWeight: "700" },
  cardLast4Input: { borderRadius: 14, borderWidth: 2, paddingHorizontal: 20, paddingVertical: 14, fontSize: 24, fontWeight: "800", letterSpacing: 8, textAlign: "center" },

  // Success
  successWrap: { alignItems: "center", paddingTop: 8 },
  successCircle: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: "800", marginBottom: 8, textAlign: "center" },
  successSub: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 24, paddingHorizontal: 16 },
  bookingCard: { width: "100%", borderRadius: 22, padding: 20, marginBottom: 20 },
  bookingCardLabel: { color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "700", textAlign: "center", marginBottom: 4 },
  bookingCardId: { color: "#fff", fontSize: 22, fontWeight: "900", textAlign: "center", letterSpacing: 2, marginBottom: 16 },
  bookingDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.25)", marginBottom: 16 },
  bookingRoute: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  bookingCode: { color: "#fff", fontSize: 26, fontWeight: "900", letterSpacing: 1 },
  bookingCityName: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "600", marginTop: 2 },
  bookingArrow: { alignItems: "center", justifyContent: "center" },
  bookingMeta: { flexDirection: "row", justifyContent: "space-between" },
  bookingMetaText: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "700" },

  // Method selection step
  methodGreet: { fontSize: 14, fontWeight: "600", textAlign: "center", marginBottom: 20, marginTop: 4 },
  methodCard: {
    flexDirection: "row", alignItems: "center", gap: 16,
    borderRadius: 22, borderWidth: 2, padding: 18, marginBottom: 16,
  },
  methodIconCircle: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  methodTitle: { fontSize: 18, fontWeight: "800", marginBottom: 6 },
  methodDesc: { fontSize: 13, lineHeight: 18, marginBottom: 10 },
  methodBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, alignSelf: "flex-start" },
  methodBadgeText: { fontSize: 11, fontWeight: "700" },

  // Currency grid (walýuta payment)
  currencyGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 4 },
  currencyPill: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5, minWidth: 80 },
  currencyFlag: { fontSize: 20 },
  currencyCode: { fontSize: 13, fontWeight: "800" },
  currencySymbol: { fontSize: 11, fontWeight: "600" },
});
