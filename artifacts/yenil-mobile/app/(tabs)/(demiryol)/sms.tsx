import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  Platform, Alert, Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

const OPERATORS = [
  { id: "tmcell", label: "TMCell", color: "#15803d", icon: "phone-portrait-outline" as const },
  { id: "altyn", label: "Altyn Asyr", color: "#f59e0b", icon: "cellular-outline" as const },
  { id: "mts", label: "MTS", color: "#ef4444", icon: "radio-outline" as const },
];

const ROUTES = [
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

const SMS_NUMBERS = ["+993 71 789091", "+993 64 629487", "+993 71 788546"];

export default function SmsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [operator, setOperator] = useState("tmcell");
  const [passengers, setPassengers] = useState("1");
  const [route, setRoute] = useState("a1");
  const [trainType, setTrainType] = useState("passenger");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [showRouteList, setShowRouteList] = useState(false);

  const selectedRoute = ROUTES.find((r) => r.id === route);

  function smsText() {
    const op = OPERATORS.find((o) => o.id === operator)?.label ?? "";
    const tr = TRAIN_TYPES.find((t) => t.id === trainType)?.label ?? "";
    return `Sargyt:\nAd: ${name}\nNomer: ${phone} (${op})\nUgruň: ${selectedRoute?.label}\nGün: ${date}\nOtly: ${tr}\nÝolagçy: ${passengers}\n${notes ? "Bellik: " + notes : ""}`.trim();
  }

  function sendSms(number: string) {
    const msg = encodeURIComponent(smsText());
    Linking.openURL(`sms:${number}?body=${msg}`);
  }

  function Section({ title }: { title: string }) {
    return <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{title}</Text>;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: (isWeb ? 0 : insets.top) + 50, backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>SMS arkaly sargyt</Text>
        <Text style={styles.headerSub}>Internetsiz bilet sargyt ediň</Text>
        {/* Step indicator */}
        <View style={styles.stepRow}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={styles.stepWrap}>
              <View style={[
                styles.stepDot,
                step >= s ? { backgroundColor: "#fff" } : { backgroundColor: "rgba(255,255,255,0.3)" },
              ]}>
                {step > s
                  ? <Ionicons name="checkmark" size={12} color={colors.primary} />
                  : <Text style={[styles.stepNum, { color: step >= s ? colors.primary : "rgba(255,255,255,0.6)" }]}>{s}</Text>
                }
              </View>
              {s < 3 && <View style={[styles.stepLine, { backgroundColor: step > s ? "#fff" : "rgba(255,255,255,0.3)" }]} />}
            </View>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 40 : 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && (
          <>
            <Section title="ŞAHSY MAGLUMAT" />
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Adyňyz</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Doly adyňyz"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Telefon nomeriňiz</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+993 XX XXXXXX"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
              />
            </View>

            <Section title="OPERATORYŇYZ" />
            <View style={styles.optionRow}>
              {OPERATORS.map((op) => (
                <Pressable
                  key={op.id}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setOperator(op.id); }}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: operator === op.id ? op.color : colors.card,
                      borderColor: operator === op.id ? op.color : colors.border,
                    },
                  ]}
                >
                  <Ionicons name={op.icon} size={20} color={operator === op.id ? "#fff" : op.color} />
                  <Text style={[styles.optionLabel, { color: operator === op.id ? "#fff" : colors.foreground }]}>
                    {op.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() => {
                if (!name.trim() || !phone.trim()) {
                  Alert.alert("Doldurylmadyk", "Ad we telefon nomeri girizmelisiniz!");
                  return;
                }
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setStep(2);
              }}
              style={[styles.nextBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.nextBtnText}>Indiki</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>
          </>
        )}

        {step === 2 && (
          <>
            <Section title="UGUR" />
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowRouteList(!showRouteList); }}
              style={[styles.selectBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name="train-outline" size={20} color={colors.primary} />
              <Text style={[styles.selectBtnText, { color: colors.foreground }]}>{selectedRoute?.label}</Text>
              <Ionicons name={showRouteList ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
            </Pressable>
            {showRouteList && (
              <View style={[styles.routeList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {ROUTES.map((r) => (
                  <Pressable
                    key={r.id}
                    onPress={() => { setRoute(r.id); setShowRouteList(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={[styles.routeItem, route === r.id && { backgroundColor: colors.primary + "15" }]}
                  >
                    <Text style={[styles.routeLabel, { color: route === r.id ? colors.primary : colors.foreground }]}>
                      {r.label}
                    </Text>
                    {route === r.id && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                  </Pressable>
                ))}
              </View>
            )}

            <Section title="OTLY GÖRNÜŞI" />
            {TRAIN_TYPES.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTrainType(t.id); }}
                style={[
                  styles.trainCard,
                  {
                    backgroundColor: trainType === t.id ? colors.primary + "12" : colors.card,
                    borderColor: trainType === t.id ? colors.primary : colors.border,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.trainLabel, { color: trainType === t.id ? colors.primary : colors.foreground }]}>
                    {t.label}
                  </Text>
                  <Text style={[styles.trainDesc, { color: colors.mutedForeground }]}>{t.desc}</Text>
                </View>
                <View style={[
                  styles.radioOuter,
                  { borderColor: trainType === t.id ? colors.primary : colors.border },
                ]}>
                  {trainType === t.id && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                </View>
              </Pressable>
            ))}

            <Section title="GÜN WE ÝOLAGÇY SANY" />
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Sargyt güni (MM.GG.ÝÝÝÝ)</Text>
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="mysal: 20.06.2025"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Ýolagçy sany</Text>
              <View style={styles.counterRow}>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPassengers((p) => String(Math.max(1, parseInt(p) - 1))); }}
                  style={[styles.counterBtn, { backgroundColor: colors.primary + "20", borderColor: colors.border }]}
                >
                  <Ionicons name="remove" size={20} color={colors.primary} />
                </Pressable>
                <Text style={[styles.counterNum, { color: colors.foreground }]}>{passengers}</Text>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPassengers((p) => String(Math.min(8, parseInt(p) + 1))); }}
                  style={[styles.counterBtn, { backgroundColor: colors.primary + "20", borderColor: colors.border }]}
                >
                  <Ionicons name="add" size={20} color={colors.primary} />
                </Pressable>
              </View>
            </View>

            <View style={styles.btnRow}>
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStep(1); }}
                style={[styles.backBtn, { borderColor: colors.border }]}
              >
                <Ionicons name="arrow-back" size={18} color={colors.foreground} />
                <Text style={[styles.backBtnText, { color: colors.foreground }]}>Yza</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!date.trim()) { Alert.alert("Doldurylmadyk", "Sargyt günini giriziň!"); return; }
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setStep(3);
                }}
                style={[styles.nextBtn, { backgroundColor: colors.primary, flex: 1 }]}
              >
                <Text style={styles.nextBtnText}>Indiki</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </Pressable>
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <Section title="GOŞMAÇA BELLIK (ISLEGE GÖRÄ)" />
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Goşmaça islegleriňiz bar bolsa ýazyň..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={3}
                style={[
                  styles.input,
                  styles.textarea,
                  { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background },
                ]}
              />
            </View>

            <Section title="SARGYT JIKME-JIKLERI" />
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {[
                { icon: "person-outline" as const, label: "Ad", value: name },
                { icon: "call-outline" as const, label: "Nomer", value: `${phone} (${OPERATORS.find((o) => o.id === operator)?.label})` },
                { icon: "train-outline" as const, label: "Ugur", value: selectedRoute?.label ?? "" },
                { icon: "calendar-outline" as const, label: "Gün", value: date },
                { icon: "flash-outline" as const, label: "Otly", value: TRAIN_TYPES.find((t) => t.id === trainType)?.label ?? "" },
                { icon: "people-outline" as const, label: "Ýolagçy", value: `${passengers} adam` },
              ].map((row, i) => (
                <View key={i}>
                  {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                  <View style={styles.summaryRow}>
                    <View style={[styles.summaryIcon, { backgroundColor: colors.primary + "15" }]}>
                      <Ionicons name={row.icon} size={16} color={colors.primary} />
                    </View>
                    <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                    <Text style={[styles.summaryValue, { color: colors.foreground }]} numberOfLines={1}>{row.value}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Section title="SMS IBERJEK NOMERI SAÝLAŇ" />
            {SMS_NUMBERS.map((num, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  sendSms(num);
                }}
                style={({ pressed }) => [
                  styles.smsBtn,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <View style={styles.smsBtnIcon}>
                  <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.smsBtnNum}>{num}</Text>
                  <Text style={styles.smsBtnLabel}>SMS ibermek üçin basyň</Text>
                </View>
                <Ionicons name="send-outline" size={18} color="#fff" />
              </Pressable>
            ))}

            <View style={[styles.noteBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={16} color={colors.mutedForeground} />
              <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
                SMS iberilenden soň operator sizi 15-30 minut içinde yzyna jaň eder we sargydyňyzy tassyklar.
              </Text>
            </View>

            <View style={styles.btnRow}>
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStep(2); }}
                style={[styles.backBtn, { borderColor: colors.border }]}
              >
                <Ionicons name="arrow-back" size={18} color={colors.foreground} />
                <Text style={[styles.backBtnText, { color: colors.foreground }]}>Yza</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setStep(1);
                  setName(""); setPhone(""); setDate(""); setNotes(""); setPassengers("1");
                  Alert.alert("Üstünlikli!", "Sargydyňyz iberildi! Operator siziň bilen habarlaşar.");
                }}
                style={[styles.nextBtn, { backgroundColor: "#10b981", flex: 1 }]}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={styles.nextBtnText}>Tamamla</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 2 },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginBottom: 14 },
  stepRow: { flexDirection: "row", alignItems: "center" },
  stepWrap: { flexDirection: "row", alignItems: "center" },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  stepNum: { fontSize: 12, fontWeight: "800" },
  stepLine: { width: 40, height: 2, marginHorizontal: 4 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginTop: 20, marginBottom: 8, marginLeft: 2 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  fieldLabel: { fontSize: 12, fontWeight: "600", marginBottom: 2 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14 },
  textarea: { height: 80, textAlignVertical: "top" },
  divider: { height: 1 },
  optionRow: { flexDirection: "row", gap: 10 },
  optionCard: { flex: 1, alignItems: "center", borderRadius: 14, borderWidth: 2, padding: 12, gap: 6 },
  optionLabel: { fontSize: 12, fontWeight: "700", textAlign: "center" },
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
  summaryCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  summaryIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  summaryLabel: { width: 70, fontSize: 12 },
  summaryValue: { flex: 1, fontSize: 13, fontWeight: "700", textAlign: "right" },
  smsBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 16, padding: 16, marginBottom: 10,
  },
  smsBtnIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
  },
  smsBtnNum: { color: "#fff", fontSize: 15, fontWeight: "800" },
  smsBtnLabel: { color: "rgba(255,255,255,0.8)", fontSize: 11, marginTop: 2 },
  noteBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12, marginTop: 4 },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18 },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, paddingVertical: 16 },
  nextBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20, borderWidth: 1 },
  backBtnText: { fontSize: 15, fontWeight: "700" },
});
