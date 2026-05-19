import React from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const steps = [
  { num: "1", title: "Bron koduňyzy taýynlaň", desc: "Demirýol stansiyasyndan ýa-da öňünden bilet bron ediň we siziň 6 harply bron koduňyz bolar." },
  { num: "2", title: "Töleg ediň", desc: "Aşakdaky sanlara TMCell arkaly töleg ediň: +993 71 789091 / +993 64 629487 / +993 71 788546" },
  { num: "3", title: "SMS iberiň", desc: "Töleg hakynda SMS screenshotyny ýa-da habary +993 71 789091 nomere iberiň." },
  { num: "4", title: "Bilet alyndy!", desc: "Biletçi siz bilen iň tiz wagtda habarlaşar we bron koduňyzy tassyklar." },
];

export default function SmsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: (isWeb ? 0 : insets.top) + 12, backgroundColor: colors.primary }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>SMS arkaly sargyt</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 34 : 100 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary }]}>
          <Ionicons name="chatbubble-ellipses-outline" size={32} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: colors.primary }]}>Offline sargyt usuly</Text>
            <Text style={[styles.heroDesc, { color: colors.mutedForeground }]}>
              Internet bağlantynyz ýok bolsa hem SMS arkaly sargyt edip bilersiňiz.
            </Text>
          </View>
        </View>

        {steps.map((s, i) => (
          <View key={i} style={[styles.stepCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepNumText}>{s.num}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>{s.title}</Text>
              <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>{s.desc}</Text>
            </View>
          </View>
        ))}

        <View style={[styles.noteCard, { backgroundColor: "#fef3c7", borderColor: "#f59e0b" }]}>
          <Ionicons name="warning-outline" size={20} color="#d97706" />
          <Text style={{ color: "#92400e", fontSize: 13, flex: 1, lineHeight: 20 }}>
            Töleg edeniňizden soň 15 minut içinde SMS ibermegi unutmaň. Giç iberilen sargytlar gaýra goýulup bilner.
          </Text>
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
  heroBanner: { flexDirection: "row", alignItems: "flex-start", gap: 14, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  heroTitle: { fontWeight: "700", fontSize: 15, marginBottom: 4 },
  heroDesc: { fontSize: 13, lineHeight: 18 },
  stepCard: { flexDirection: "row", alignItems: "flex-start", gap: 14, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  stepNum: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  stepNumText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  stepTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  stepDesc: { fontSize: 13, lineHeight: 20 },
  noteCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, borderLeftWidth: 4, marginTop: 8 },
});
