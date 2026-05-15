import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  Alert, ActivityIndicator, Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { saveOrder } from "@/lib/firebase";
import { useBonusPul } from "@/contexts/BonusPulContext";

const PAYMENT_PHONES = ["+993 71 789091", "+993 64 629487", "+993 71 788546"];

interface AppService {
  id: string;
  name: string;
  color: string;
  description: string;
  planType: "subscription" | "topup";
  plans: Array<{ label: string; amount: number }>;
  inputLabel: string;
  firebaseKey: string;
}

const APPS: AppService[] = [
  {
    id: "aydym",
    name: "Aydym.com",
    color: "#7c3aed",
    description: "Aydym.com-da Premium hasap açmak isleseňiz, 3-den 12 aýa çenli açdyryp bilýäňiz. Premium artykmaçlyklary: reklamasyz diňlemek, internetsiz diňlemek, pleýlist internetsiz diňlemek.",
    planType: "subscription",
    plans: [{ label: "3 aýlyk", amount: 40 }, { label: "6 aýlyk", amount: 60 }, { label: "12 aýlyk", amount: 100 }],
    inputLabel: "Aýdym.com-da ulanýan telefon nomeriňiz",
    firebaseKey: "aydym",
  },
  {
    id: "hinlen",
    name: "Hiňlen",
    color: "#db2777",
    description: "Hiňlen-de Premium hasap açmak isleseňiz, 1-den 12 aýa çenli açdyryp bilýäňiz. Premium bilen aýdymlary reklamasyz we internetsiz diňläp bilersiňiz.",
    planType: "subscription",
    plans: [{ label: "1 aýlyk", amount: 25 }, { label: "3 aýlyk", amount: 45 }, { label: "6 aýlyk", amount: 65 }, { label: "12 aýlyk", amount: 100 }],
    inputLabel: "Hiňlen-de ulanýan telefon nomeriňiz",
    firebaseKey: "hinlen",
  },
  {
    id: "belet-film",
    name: "Belet film",
    color: "#dc2626",
    description: "Belet film-de hasabyňyza pul salyp bilýäňiz. Islän filmlerinizi we seriallaryňyzy rahatlyk bilen tomaşa ediň.",
    planType: "topup",
    plans: [{ label: "30 TMT", amount: 30 }, { label: "100 TMT", amount: 100 }, { label: "200 TMT", amount: 200 }],
    inputLabel: "Belet film hasabyňyzdaky telefon nomeriňiz",
    firebaseKey: "belet-film",
  },
  {
    id: "belet-music",
    name: "Belet music",
    color: "#0284c7",
    description: "Belet music-de hasabyňyza pul salyp bilýäňiz. Iň köp diňlenilýän aýdymlary premium hil bilen diňläň.",
    planType: "topup",
    plans: [{ label: "30 TMT", amount: 30 }, { label: "100 TMT", amount: 100 }, { label: "200 TMT", amount: 200 }],
    inputLabel: "Belet music hasabyňyzdaky telefon nomeriňiz",
    firebaseKey: "belet-music",
  },
];

function AppPaymentFlow({ app, onBack, colors }: { app: AppService; onBack: () => void; colors: ReturnType<typeof useColors> }) {
  const { balance, deviceId, deduct } = useBonusPul();
  const [plan, setPlan] = useState<AppService["plans"][0] | null>(null);
  const [userPhone, setUserPhone] = useState("");
  const [payPhone, setPayPhone] = useState("");
  const [payMethod, setPayMethod] = useState<"terminal" | "bonus" | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (!plan || !userPhone.trim()) { Alert.alert("Ýalňyşlyk", "Ähli meýdançalary dolduryň!"); return; }
    if (!payMethod) { Alert.alert("Ýalňyşlyk", "Töleg usulyny saýlaň!"); return; }
    if (payMethod === "terminal" && !payPhone.trim()) { Alert.alert("Ýalňyşlyk", "Töleg nomeriňizi giriziň!"); return; }
    setLoading(true);
    try {
      if (payMethod === "bonus") {
        if (balance < plan.amount) {
          Alert.alert("Ýalňyşlyk", `Ýeterlik bonus pul ýok. Balansyňyz: ${balance} BP. Gerekli: ${plan.amount} BP`);
          setLoading(false); return;
        }
        const ok = await deduct(plan.amount);
        if (!ok) { Alert.alert("Ýalňyşlyk", "Bonus pul aýyrmak başartmady!"); setLoading(false); return; }
      }
      await saveOrder("app-payments", {
        app: app.firebaseKey, plan: plan.label, amount: plan.amount,
        userPhone, paymentPhone: payMethod === "terminal" ? payPhone : undefined,
        paymentMethod: payMethod, deviceId, status: "pending",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(true);
    } catch { Alert.alert("Ýalňyşlyk", "Bilinmeýän ýalňyşlyk"); }
    finally { setLoading(false); }
  }

  if (done) {
    return (
      <View style={{ alignItems: "center", gap: 14, paddingTop: 40 }}>
        <Ionicons name="checkmark-circle" size={64} color="#059669" />
        <Text style={[{ fontSize: 22, fontWeight: "800", color: colors.foreground }]}>Üstünlikli!</Text>
        <Text style={[{ color: colors.mutedForeground, fontSize: 14, textAlign: "center", lineHeight: 20 }]}>
          Iň tiz wagtda barlanar we size habar berler.
        </Text>
        <Pressable onPress={() => { setDone(false); setPlan(null); setShowPayment(false); setUserPhone(""); setPayPhone(""); }}
          style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}>
          <Text style={styles.primaryBtnText}>Täzeden</Text>
        </Pressable>
        <Pressable onPress={onBack} style={({ pressed }) => [styles.secondaryBtn, { opacity: pressed ? 0.85 : 1 }]}>
          <Feather name="arrow-left" size={16} color={colors.mutedForeground} />
          <Text style={[styles.secondaryBtnText, { color: colors.mutedForeground }]}>Hyzmatlar sanawyna</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.appInfoCard, { backgroundColor: app.color + "15", borderColor: app.color + "40" }]}>
        <View style={[styles.appIcon, { backgroundColor: app.color }]}>
          <Ionicons name="star-outline" size={24} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[{ fontWeight: "800", fontSize: 16, color: colors.foreground }]}>{app.name}</Text>
          <Text style={[{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18, marginTop: 4 }]}>{app.description}</Text>
        </View>
      </View>

      {!showPayment ? (
        <>
          <Text style={[styles.sectionHead, { color: colors.foreground }]}>Möçberi saýlaň</Text>
          <View style={styles.planGrid}>
            {app.plans.map(p => (
              <Pressable key={p.label} onPress={() => setPlan(p)}
                style={[styles.planCard, {
                  backgroundColor: plan?.label === p.label ? colors.primary + "15" : colors.card,
                  borderColor: plan?.label === p.label ? colors.primary : colors.border,
                  borderWidth: plan?.label === p.label ? 2 : 1,
                }]}>
                <Text style={[styles.planAmount, { color: plan?.label === p.label ? colors.primary : colors.foreground }]}>{p.amount}</Text>
                <Text style={[styles.planUnit, { color: colors.mutedForeground }]}>TMT</Text>
                <Text style={[styles.planLabel, { color: plan?.label === p.label ? colors.primary : colors.mutedForeground }]}>{p.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={{ marginTop: 16 }}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{app.inputLabel}</Text>
            <TextInput value={userPhone} onChangeText={setUserPhone}
              placeholder="+993 XX XXXXXX" placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            />
          </View>

          <Pressable onPress={() => { if (!plan || !userPhone) { Alert.alert("Ýalňyşlyk", "Sanawy saýlaň we nomeri giriziň!"); return; } setShowPayment(true); }}
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1, marginTop: 20 }]}>
            <Text style={styles.primaryBtnText}>Töleg usulyna geçmek</Text>
          </Pressable>
        </>
      ) : (
        <>
          <View style={[styles.summaryCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary }]}>
            <Text style={[{ color: colors.foreground, fontWeight: "700" }]}>{plan?.label} — <Text style={{ color: colors.primary }}>{plan?.amount} TMT</Text></Text>
            <Text style={[{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }]}>Nomer: {userPhone}</Text>
          </View>

          <Text style={[styles.sectionHead, { color: colors.foreground }]}>Töleg usulyny saýlaň</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {([{ id: "terminal" as const, icon: "phone-portrait-outline" as const, label: "TMCELL terminal" },
              { id: "bonus" as const, icon: "wallet-outline" as const, label: `Bonus pul (${balance} BP)` }]).map(m => (
              <Pressable key={m.id} onPress={() => setPayMethod(m.id)}
                style={[styles.payMethodCard, {
                  backgroundColor: payMethod === m.id ? colors.primary + "15" : colors.card,
                  borderColor: payMethod === m.id ? colors.primary : colors.border,
                }]}>
                <Ionicons name={m.icon} size={26} color={payMethod === m.id ? colors.primary : colors.mutedForeground} />
                <Text style={[{ fontWeight: "600", fontSize: 12, textAlign: "center", color: payMethod === m.id ? colors.primary : colors.foreground }]}>{m.label}</Text>
              </Pressable>
            ))}
          </View>

          {payMethod === "terminal" && (
            <>
              <View style={[{ backgroundColor: colors.primary + "10", borderRadius: 12, padding: 14, marginTop: 14 }]}>
                <Text style={[{ fontWeight: "700", color: colors.foreground, marginBottom: 8 }]}>Şu nomerleriň birine {plan?.amount} TMT geçirmeli:</Text>
                {PAYMENT_PHONES.map((p, i) => <Text key={i} style={{ color: colors.primary, fontWeight: "700", fontSize: 15, marginBottom: 4 }}>{p}</Text>)}
              </View>
              <View style={{ marginTop: 14 }}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Bize töleg geçirjek nomeriňiz</Text>
                <TextInput value={payPhone} onChangeText={setPayPhone}
                  placeholder="+993 XX XXXXXX" placeholderTextColor={colors.mutedForeground}
                  keyboardType="phone-pad"
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                />
              </View>
            </>
          )}

          {payMethod === "bonus" && balance < (plan?.amount || 0) && (
            <View style={[{ backgroundColor: "#fee2e2", borderRadius: 10, padding: 12, marginTop: 12 }]}>
              <Text style={{ color: "#dc2626" }}>Ýeterlik bonus pul ýok. Balansyňyz: {balance} BP. Gerekli: {plan?.amount} BP</Text>
            </View>
          )}

          <Pressable onPress={handleSubmit} disabled={loading}
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed || loading ? 0.7 : 1, marginTop: 20 }]}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.primaryBtnText}>Töleg geçirdim — Tassyklamak</Text>}
          </Pressable>
          <Pressable onPress={() => setShowPayment(false)} style={({ pressed }) => [styles.secondaryBtn, { opacity: pressed ? 0.85 : 1, marginTop: 8 }]}>
            <Feather name="arrow-left" size={16} color={colors.mutedForeground} />
            <Text style={[styles.secondaryBtnText, { color: colors.mutedForeground }]}>Yza</Text>
          </Pressable>
        </>
      )}
    </>
  );
}

export default function UlgamlarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [activeApp, setActiveApp] = useState<AppService | null>(null);

  return (
    <View style={[{ flex: 1 }, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: (isWeb ? 67 : insets.top) + 12, backgroundColor: colors.primary }]}>
        <Pressable onPress={activeApp ? () => setActiveApp(null) : () => router.back()} style={{ padding: 4 }}>
          <Feather name="arrow-left" size={20} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>{activeApp ? activeApp.name : "Içerki ulgamlar"}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 34 : 100 }}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {!activeApp ? (
          <>
            <View style={[{ backgroundColor: colors.primary + "10", borderRadius: 12, padding: 14, marginBottom: 16, flexDirection: "row", gap: 10 }]}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
              <Text style={[{ color: colors.mutedForeground, fontSize: 13, flex: 1, lineHeight: 20 }]}>
                Türkmenistanyň sosial ulgamlaryna TMCELL üsti bilen töleg ediň.
              </Text>
            </View>
            <View style={styles.appsGrid}>
              {APPS.map(app => (
                <Pressable key={app.id} onPress={() => setActiveApp(app)}
                  style={({ pressed }) => [styles.appCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}>
                  <View style={[styles.appCardIcon, { backgroundColor: app.color }]}>
                    <Ionicons name="star-outline" size={24} color="#fff" />
                  </View>
                  <Text style={[styles.appCardName, { color: colors.foreground }]}>{app.name}</Text>
                  <Text style={[styles.appCardType, { color: colors.mutedForeground }]}>
                    {app.planType === "subscription" ? "Premium abonement" : "Hasaby doldurmak"}
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 8, justifyContent: "center" }}>
                    {app.plans.slice(0, 3).map(p => (
                      <View key={p.label} style={[styles.planBadge, { backgroundColor: colors.primary + "15" }]}>
                        <Text style={[{ color: colors.primary, fontSize: 11, fontWeight: "600" }]}>{p.amount} TMT</Text>
                      </View>
                    ))}
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <AppPaymentFlow app={activeApp} onBack={() => setActiveApp(null)} colors={colors} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  appsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  appCard: { width: "47%", borderRadius: 16, borderWidth: 1, padding: 16, alignItems: "center", gap: 8 },
  appCardIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  appCardName: { fontSize: 15, fontWeight: "700", textAlign: "center" },
  appCardType: { fontSize: 11, textAlign: "center" },
  planBadge: { borderRadius: 50, paddingHorizontal: 8, paddingVertical: 2 },
  appInfoCard: { flexDirection: "row", gap: 14, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 16, alignItems: "flex-start" },
  appIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  sectionHead: { fontSize: 16, fontWeight: "700", marginTop: 16, marginBottom: 12 },
  planGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  planCard: { width: "30%", borderRadius: 14, padding: 12, alignItems: "center", gap: 2 },
  planAmount: { fontSize: 22, fontWeight: "800" },
  planUnit: { fontSize: 11 },
  planLabel: { fontSize: 11, fontWeight: "600", textAlign: "center" },
  fieldLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  summaryCard: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 8 },
  payMethodCard: { flex: 1, borderRadius: 12, borderWidth: 2, padding: 14, alignItems: "center", gap: 8 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 16 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  secondaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12 },
  secondaryBtnText: { fontWeight: "600", fontSize: 15 },
});
