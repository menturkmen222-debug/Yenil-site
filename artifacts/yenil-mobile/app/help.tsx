import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Alert, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { PessimisticButton } from "@/components/PessimisticButton";
import { saveOrder } from "@/lib/firebase";

const faqs = [
  { q: "Bilet satyn almak näçe wagt alýar?", a: "Sargydyňyz kabul edilenden soň 1-4 sagadyň içinde bilet SMS arkaly iberilýär." },
  { q: "Nähili töleg usullary bar?", a: "TMCell arkaly pul geçiriş, SMS tassyklamasy ýa-da Bonus Pul arkaly töleg edip bilersiňiz." },
  { q: "Bonus pul nähili almaly?", a: "TMCell sahypasyna geçip, bonus pul satyn alyň. Töleg edenden soň balansynyz doldurylar." },
  { q: "Ýalňyş maglumatlary girizendim, näme etmeli?", a: "Dessine biziň bilen habarlaşyň: +993 71 789091 ýa-da +993 64 629487." },
  { q: "Daşary ýurt walýutasy näçeden çalşylýar?", a: "Satyn almak: 1 USD = 29 TMT. Satmak: 1 USD = 19 TMT." },
  { q: "Içerki ulgamlar nähili işleýär?", a: "Aydym, Hiňlen, Belet üçin premium abonelik satyn almak mümkin. Töleg edip, SMS arkaly bron koduňyzy iberiň." },
];

export default function HelpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [expanded, setExpanded] = useState<number | null>(null);
  const [question, setQuestion] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submitQuestion() {
    if (!question.trim() || !phone.trim()) {
      Alert.alert("Ýalňyşlyk", "Sorag we nomeri giriziň!"); return;
    }
    setLoading(true);
    try {
      await saveOrder("user-questions", { question, phone });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSent(true); setQuestion(""); setPhone("");
    } catch { Alert.alert("Ýalňyşlyk", "Bilinmeýän ýalňyşlyk"); }
    finally { setLoading(false); }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={[styles.header, { paddingTop: (isWeb ? 0 : insets.top) + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Kömek / FAQ</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 110 : 110 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Köp soralýan soraglar</Text>

        {faqs.map((f, i) => (
          <Pressable key={i} onPress={() => { setExpanded(expanded === i ? null : i); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={[styles.faqCard, { backgroundColor: colors.card, borderColor: expanded === i ? colors.primary : colors.border }]}>
            <View style={styles.faqHeader}>
              <Text style={[styles.faqQ, { color: colors.foreground }]}>{f.q}</Text>
              <Ionicons
                name={expanded === i ? "chevron-up-outline" : "chevron-down-outline"}
                size={18} color={colors.mutedForeground}
              />
            </View>
            {expanded === i && (
              <Text style={[styles.faqA, { color: colors.mutedForeground }]}>{f.a}</Text>
            )}
          </Pressable>
        ))}

        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 24 }]}>Soralyňyz barmy?</Text>

        {sent && (
          <View style={[styles.sentBadge, { backgroundColor: "#f0fdf4", borderColor: "#86efac" }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#059669" />
            <Text style={{ color: "#059669", fontWeight: "600" }}>Soralyňyz alyndy! Iň tiz wagtda jogaplanarys.</Text>
          </View>
        )}

        <View style={{ gap: 14 }}>
          <View>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Soralyňyz</Text>
            <TextInput
              value={question} onChangeText={setQuestion}
              placeholder="Soralyňyzy şu ýere ýazyň..."
              placeholderTextColor={colors.mutedForeground}
              multiline numberOfLines={4}
              style={[styles.input, styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            />
          </View>
          <View>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Siziň nomeriňiz</Text>
            <TextInput
              value={phone} onChangeText={setPhone}
              placeholder="+99361xxxxxx" placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            />
          </View>
        </View>

        <View style={{ marginTop: 20 }}>
          <PessimisticButton
            label="Sorag ibermek"
            loadingLabel="Iberilýär..."
            loading={loading}
            disabled={loading}
            onPress={submitQuestion}
            color={colors.primary}
            size="lg"
            icon={<Ionicons name="send-outline" size={18} color="#fff" />}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 14 },
  faqCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  faqHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  faqQ: { flex: 1, fontSize: 14, fontWeight: "700", lineHeight: 20 },
  faqA: { fontSize: 13, lineHeight: 20, marginTop: 10 },
  sentBadge: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  textarea: { height: 100, textAlignVertical: "top" },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 16 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
