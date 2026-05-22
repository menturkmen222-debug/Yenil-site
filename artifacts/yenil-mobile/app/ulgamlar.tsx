import React, { useState, useRef } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  ActivityIndicator, Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { saveOrder, deductBalanceAtomic } from "@/lib/firebase";
import { useBonusPul } from "@/contexts/BonusPulContext";
import BPCheckoutModal from "@/components/BPCheckoutModal";

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
  const { balance, deviceId } = useBonusPul();
  const [plan, setPlan] = useState<AppService["plans"][0] | null>(null);
  const [userPhone, setUserPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const idempotencyKeyRef = useRef<string>("");

  function generateIdempotencyKey() {
    idempotencyKeyRef.current = `pay-${deviceId}-${app.firebaseKey}-${Date.now()}`;
  }

  async function handlePay() {
    if (!plan || !userPhone.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    generateIdempotencyKey();
    if (balance >= plan.amount) {
      setLoading(true);
      try {
        const result = await deductBalanceAtomic(deviceId, plan.amount);
        if (!result.success) {
          setShowModal(true);
          setLoading(false);
          return;
        }
        await saveOrder("app-payments", {
          app: app.firebaseKey, plan: plan.label, amount: plan.amount,
          userPhone, paymentMethod: "bonus", deviceId, status: "pending",
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setDone(true);
      } catch {
        setShowModal(true);
      } finally {
        setLoading(false);
      }
    } else {
      setShowModal(true);
    }
  }

  async function handleModalComplete() {
    setShowModal(false);
    await saveOrder("app-payments", {
      app: app.firebaseKey, plan: plan?.label, amount: plan?.amount,
      userPhone, paymentMethod: "inline-topup", deviceId, status: "pending",
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDone(true);
  }

  if (done) {
    return (
      <View style={{ alignItems: "center", gap: 14, paddingTop: 40 }}>
        <View style={[styles.successIcon, { backgroundColor: "#d1fae5" }]}>
          <Ionicons name="checkmark-circle" size={48} color="#059669" />
        </View>
        <Text style={[{ fontSize: 22, fontWeight: "800", color: colors.foreground }]}>Üstünlikli!</Text>
        <Text style={[{ color: colors.mutedForeground, fontSize: 14, textAlign: "center", lineHeight: 20 }]}>
          Iň tiz wagtda barlanar we size habar berler.
        </Text>
        <Pressable
          onPress={() => { setDone(false); setPlan(null); setUserPhone(""); }}
          style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
        >
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

      <Text style={[styles.sectionHead, { color: colors.foreground }]}>Möçberi saýlaň</Text>
      <View style={styles.planGrid}>
        {app.plans.map(p => (
          <Pressable
            key={p.label}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPlan(p); }}
            style={[styles.planCard, {
              backgroundColor: plan?.label === p.label ? colors.primary + "15" : colors.card,
              borderColor: plan?.label === p.label ? colors.primary : colors.border,
              borderWidth: plan?.label === p.label ? 2 : 1,
            }]}
          >
            <Text style={[styles.planAmount, { color: plan?.label === p.label ? colors.primary : colors.foreground }]}>{p.amount}</Text>
            <Text style={[styles.planUnit, { color: colors.mutedForeground }]}>BP</Text>
            <Text style={[styles.planLabel, { color: plan?.label === p.label ? colors.primary : colors.mutedForeground }]}>{p.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ marginTop: 16 }}>
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{app.inputLabel}</Text>
        <TextInput
          value={userPhone}
          onChangeText={setUserPhone}
          placeholder="+993 XX XXXXXX"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="phone-pad"
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        />
      </View>

      <View style={[styles.bpInfoCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
        <Ionicons name="wallet-outline" size={16} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={[{ color: colors.primary, fontWeight: "700", fontSize: 13 }]}>
            Balans: {balance.toFixed(2)} BP
          </Text>
          {plan && (
            <Text style={[{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }]}>
              {balance >= plan.amount
                ? `✓ ${plan.amount} BP aýrylar`
                : `⚡ ${(plan.amount - balance).toFixed(2)} BP ýetmez — doldurma mümkin`}
            </Text>
          )}
        </View>
      </View>

      <Pressable
        onPress={handlePay}
        disabled={loading || !plan || !userPhone.trim()}
        style={({ pressed }) => [
          styles.primaryBtn,
          {
            backgroundColor: colors.primary,
            opacity: loading || !plan || !userPhone.trim() || pressed ? 0.65 : 1,
            marginTop: 20,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="wallet-outline" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>
              {plan ? `${plan.amount} BP bilen tölemek` : "Tölemek"}
            </Text>
          </>
        )}
      </Pressable>

      <BPCheckoutModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        serviceName={`${app.name} — ${plan?.label ?? ""}`}
        serviceAmount={plan?.amount ?? 0}
        currentBalance={balance}
        deviceId={deviceId}
        onPaymentComplete={handleModalComplete}
      />
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
      <View style={[styles.header, { paddingTop: (isWeb ? 0 : insets.top) + 12, backgroundColor: colors.primary }]}>
        <Pressable onPress={activeApp ? () => setActiveApp(null) : () => router.back()} style={{ padding: 4 }}>
          <Feather name="arrow-left" size={20} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>{activeApp ? activeApp.name : "Içerki ulgamlar"}</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 110 : 110 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!activeApp ? (
          <>
            <View style={[styles.infoBar, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "25" }]}>
              <Ionicons name="wallet-outline" size={18} color={colors.primary} />
              <Text style={[{ color: colors.mutedForeground, fontSize: 13, flex: 1, lineHeight: 20 }]}>
                Ähli tölegler Bonus Pul (BP) bilen amala aşyrylýar. Balans ýetmese, amatly usul bilen doldursa bolýar.
              </Text>
            </View>
            <View style={styles.appsGrid}>
              {APPS.map(app => (
                <Pressable
                  key={app.id}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setActiveApp(app); }}
                  style={({ pressed }) => [styles.appCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
                >
                  <View style={[styles.appCardIcon, { backgroundColor: app.color }]}>
                    <Ionicons name="star-outline" size={24} color="#fff" />
                  </View>
                  <Text style={[styles.appCardName, { color: colors.foreground }]}>{app.name}</Text>
                  <Text style={[styles.appCardType, { color: colors.mutedForeground }]}>
                    {app.planType === "subscription" ? "Premium abonement" : "Hasaby doldurmak"}
                  </Text>
                  <View style={[styles.bpOnlyBadge, { backgroundColor: colors.primary + "15" }]}>
                    <Ionicons name="wallet-outline" size={11} color={colors.primary} />
                    <Text style={[{ color: colors.primary, fontSize: 10, fontWeight: "700" }]}>BP bilen töle</Text>
                  </View>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6, justifyContent: "center" }}>
                    {app.plans.slice(0, 3).map(p => (
                      <View key={p.label} style={[styles.planBadge, { backgroundColor: colors.muted }]}>
                        <Text style={[{ color: colors.mutedForeground, fontSize: 11, fontWeight: "600" }]}>{p.amount} BP</Text>
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
  infoBar: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16, alignItems: "flex-start" },
  appsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  appCard: { width: "47%", borderRadius: 16, borderWidth: 1, padding: 16, alignItems: "center", gap: 8 },
  appCardIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  appCardName: { fontSize: 15, fontWeight: "700", textAlign: "center" },
  appCardType: { fontSize: 11, textAlign: "center" },
  bpOnlyBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4 },
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
  bpInfoCard: { flexDirection: "row", gap: 10, borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 14, alignItems: "flex-start" },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 16 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  secondaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12 },
  secondaryBtnText: { fontWeight: "600", fontSize: 15 },
  successIcon: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
});
