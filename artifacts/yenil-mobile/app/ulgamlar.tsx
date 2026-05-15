import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Alert, ActivityIndicator, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { saveOrder } from "@/lib/firebase";

const PAYMENT_PHONES = ["+993 71 789091", "+993 64 629487", "+993 71 788546"];

const services = [
  {
    id: "aydym",
    name: "Aydym.com",
    desc: "Türkmen saz we aýdym hyzmatyna premium agzalyk",
    color: "#ef4444",
    plans: [{ label: "Aýlyk", price: 15 }, { label: "Ýyllyk", price: 120 }],
  },
  {
    id: "hinlen",
    name: "Hiňlen",
    desc: "Hiňlen hyzmatyna premium agzalyk",
    color: "#8b5cf6",
    plans: [{ label: "Aýlyk", price: 12 }, { label: "Ýyllyk", price: 100 }],
  },
  {
    id: "belet-film",
    name: "Belet Film",
    desc: "Belet kino hyzmatyna premium agzalyk",
    color: "#f59e0b",
    plans: [{ label: "Aýlyk", price: 20 }, { label: "Ýyllyk", price: 180 }],
  },
  {
    id: "belet-music",
    name: "Belet Music",
    desc: "Belet saz hyzmatyna premium agzalyk",
    color: "#0ea5e9",
    plans: [{ label: "Aýlyk", price: 10 }, { label: "Ýyllyk", price: 80 }],
  },
];

export default function UlgamlarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const [selected, setSelected] = useState<string | null>(null);
  const [plan, setPlan] = useState<number>(0);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const selectedSvc = services.find(s => s.id === selected);

  async function handleOrder() {
    if (!phone) { Alert.alert("Ýalňyşlyk", "Nomeriňizi giriziň!"); return; }
    setLoading(true);
    try {
      await saveOrder("service-payments", {
        service: selected, plan: selectedSvc?.plans[plan].label,
        price: selectedSvc?.plans[plan].price, phone,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
    } catch {
      Alert.alert("Ýalňyşlyk", "Bilinmeýän ýalňyşlyk");
    } finally { setLoading(false); }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: (isWeb ? 67 : insets.top) + 12, backgroundColor: colors.primary }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Içerki ulgamlar</Text>
      </View>

      {success ? (
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={64} color="#059669" />
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Üstünlikli!</Text>
          <Text style={[styles.successText, { color: colors.mutedForeground }]}>
            Sargydyňyz kabul edildi. Iň tiz wagtda siz bilen baglanarlar.
          </Text>
          <Pressable onPress={() => { setSuccess(false); setSelected(null); setPhone(""); }}
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}>
            <Text style={styles.primaryBtnText}>Yza</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 34 : 100 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {!selected ? (
            <>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                Premium agzalyk almak isleýän hyzmatyňyzy saýlaň
              </Text>
              {services.map(s => (
                <Pressable key={s.id} onPress={() => { setSelected(s.id); setPlan(0); }}
                  style={({ pressed }) => [styles.svcCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}>
                  <View style={[styles.svcIcon, { backgroundColor: s.color + "20" }]}>
                    <Ionicons name="star-outline" size={24} color={s.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.svcName, { color: colors.foreground }]}>{s.name}</Text>
                    <Text style={[styles.svcDesc, { color: colors.mutedForeground }]}>{s.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={18} color={colors.mutedForeground} />
                </Pressable>
              ))}
            </>
          ) : (
            <>
              <Pressable onPress={() => setSelected(null)} style={styles.breadcrumb}>
                <Feather name="arrow-left" size={16} color={colors.primary} />
                <Text style={[{ color: colors.primary, fontWeight: "600", fontSize: 14 }]}>Yzyna</Text>
              </Pressable>

              <Text style={[styles.sectionHead, { color: colors.foreground }]}>{selectedSvc?.name}</Text>

              {/* Plan selector */}
              <View style={styles.planRow}>
                {selectedSvc?.plans.map((p, i) => (
                  <Pressable key={i} onPress={() => setPlan(i)}
                    style={[styles.planCard, {
                      backgroundColor: plan === i ? colors.primary + "15" : colors.card,
                      borderColor: plan === i ? colors.primary : colors.border,
                    }]}>
                    <Text style={[styles.planLabel, { color: plan === i ? colors.primary : colors.foreground }]}>{p.label}</Text>
                    <Text style={[styles.planPrice, { color: plan === i ? colors.primary : colors.mutedForeground }]}>{p.price} TMT</Text>
                  </Pressable>
                ))}
              </View>

              {/* Payment info */}
              <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[{ color: colors.foreground, fontWeight: "700", marginBottom: 8 }]}>Töleg sanlary</Text>
                {PAYMENT_PHONES.map((p, i) => (
                  <Text key={i} style={[{ color: colors.primary, fontWeight: "700", fontSize: 15, marginBottom: 4 }]}>{p}</Text>
                ))}
                <Text style={[{ color: colors.primary, fontWeight: "800", marginTop: 8, fontSize: 17 }]}>
                  Jemi: {selectedSvc?.plans[plan].price} TMT
                </Text>
              </View>

              <View style={{ marginTop: 14 }}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Siziň nomeriňiz</Text>
                <TextInput
                  value={phone} onChangeText={setPhone}
                  placeholder="+99361xxxxxx" placeholderTextColor={colors.mutedForeground}
                  keyboardType="phone-pad"
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                />
              </View>

              <Pressable onPress={handleOrder} disabled={loading}
                style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed || loading ? 0.7 : 1, marginTop: 20 }]}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> :
                  <Text style={styles.primaryBtnText}>Sargyt ibermek</Text>}
              </Pressable>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  subtitle: { fontSize: 13, marginBottom: 16 },
  svcCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  svcIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  svcName: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  svcDesc: { fontSize: 12 },
  breadcrumb: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  sectionHead: { fontSize: 20, fontWeight: "800", marginBottom: 16 },
  planRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  planCard: { flex: 1, borderRadius: 14, borderWidth: 2, padding: 16, alignItems: "center", gap: 4 },
  planLabel: { fontSize: 14, fontWeight: "700" },
  planPrice: { fontSize: 18, fontWeight: "800" },
  infoCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8 },
  fieldLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 16 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  successContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  successTitle: { fontSize: 24, fontWeight: "800" },
  successText: { fontSize: 14, lineHeight: 22, textAlign: "center" },
});
