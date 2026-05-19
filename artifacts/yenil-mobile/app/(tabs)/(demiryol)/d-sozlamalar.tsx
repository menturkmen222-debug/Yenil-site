import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, Switch,
  Alert, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

export default function DemiryolSozlamalarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const [smsNotif, setSmsNotif] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [remindBefore, setRemindBefore] = useState(true);
  const [defaultCity, setDefaultCity] = useState("Aşgabat");

  const cities = ["Aşgabat", "Daşoguz", "Balkanabat", "Türkmenbaşy", "Mary", "Lebap"];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: (isWeb ? 0 : insets.top) + 12, backgroundColor: colors.primary }]}>
        <View style={styles.headerRow}>
          <Ionicons name="settings-outline" size={22} color="#fff" />
          <Text style={styles.headerTitle}>Demirýol sozlamalary</Text>
        </View>
        <Text style={styles.headerSub}>Bilet hyzmatyna degişli sazlamalar</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 110 : 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>HABARNAMALAR</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBg, { backgroundColor: colors.primary + "20" }]}>
                <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: colors.foreground }]}>SMS habarnamasy</Text>
                <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>Bilet taýyn bolanda habar gel</Text>
              </View>
            </View>
            <Switch
              value={smsNotif}
              onValueChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSmsNotif(v); }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBg, { backgroundColor: "#f59e0b20" }]}>
                <Ionicons name="alarm-outline" size={20} color="#f59e0b" />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: colors.foreground }]}>Sapa ýatlatma</Text>
                <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>Sapadan 1 gün öň ýatlatma</Text>
              </View>
            </View>
            <Switch
              value={remindBefore}
              onValueChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setRemindBefore(v); }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>AWTOMATIK SAZLAMALAR</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBg, { backgroundColor: "#8b5cf620" }]}>
                <Ionicons name="save-outline" size={20} color="#8b5cf6" />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: colors.foreground }]}>Biletleri ýatda sakla</Text>
                <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>Sargyt taryhy awtomatik saklansyn</Text>
              </View>
            </View>
            <Switch
              value={autoSave}
              onValueChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAutoSave(v); }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>ÜLKE SAZLAMALARY</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Adatça ugraýan şäher</Text>
          <View style={styles.citiesGrid}>
            {cities.map((city) => (
              <Pressable
                key={city}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDefaultCity(city); }}
                style={[
                  styles.cityBtn,
                  {
                    backgroundColor: defaultCity === city ? colors.primary : colors.muted,
                    borderColor: defaultCity === city ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.cityBtnText, { color: defaultCity === city ? "#fff" : colors.foreground }]}>
                  {city}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>MAGLUMAT</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { icon: "time-outline", label: "Bilet taýynlyk wagty", value: "1–4 sagat", color: "#0ea5e9" },
            { icon: "cash-outline", label: "Baha aralygy", value: "60–80 TMT", color: "#10b981" },
            { icon: "phone-portrait-outline", label: "Töleg ýoly", value: "TMCell", color: "#8b5cf6" },
          ].map((item, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={[styles.iconBg, { backgroundColor: item.color + "20" }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <Text style={[styles.rowTitle, { color: colors.foreground }]}>{item.label}</Text>
                </View>
                <Text style={[styles.valueText, { color: colors.primary }]}>{item.value}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        <Pressable
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Alert.alert("Taryhy aýyr", "Ähli bron taryhyňyzy aýyrmagy isleýärsiňizmi?", [
              { text: "Ýok" },
              { text: "Hawa, aýyr", style: "destructive", onPress: () => Alert.alert("Üstünlikli", "Taryh aýyryldy!") },
            ]);
          }}
          style={({ pressed }) => [styles.dangerBtn, { opacity: pressed ? 0.8 : 1, borderColor: "#ef4444" }]}
        >
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
          <Text style={styles.dangerBtnText}>Sargyt taryhyny aýyr</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 },
  groupTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 8, marginTop: 20, marginLeft: 4 },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  cardLabel: { fontSize: 12, fontWeight: "600", padding: 14, paddingBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  iconBg: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  rowTitle: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  rowDesc: { fontSize: 12 },
  valueText: { fontSize: 14, fontWeight: "700" },
  divider: { height: 1 },
  citiesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 14, paddingTop: 0 },
  cityBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  cityBtnText: { fontSize: 13, fontWeight: "600" },
  dangerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 16, marginTop: 20, borderWidth: 2 },
  dangerBtnText: { color: "#ef4444", fontWeight: "700", fontSize: 15 },
});
