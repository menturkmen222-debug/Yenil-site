import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Alert, ActivityIndicator, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { saveOrder } from "@/lib/firebase";

const sampleItems = [
  { id: 1, title: "Netflix Premium Akkount", price: 50, desc: "1 aýlyk premium erişim", category: "Streaming" },
  { id: 2, title: "Spotify Premium", price: 25, desc: "1 aýlyk premium agzalyk", category: "Saz" },
  { id: 3, title: "YouTube Premium", price: 35, desc: "1 aýlyk reklamasyz görüş", category: "Video" },
  { id: 4, title: "Steam Wallet 10$", price: 300, desc: "Steam hasabyna goşulmak", category: "Oýun" },
  { id: 5, title: "Discord Nitro", price: 80, desc: "1 aýlyk Nitro abonelik", category: "Sosial" },
];

type Tab = "browse" | "sell";

export default function BazarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [tab, setTab] = useState<Tab>("browse");
  const [selected, setSelected] = useState<typeof sampleItems[0] | null>(null);
  const [buyPhone, setBuyPhone] = useState("");
  const [buyLoading, setBuyLoading] = useState(false);

  // Sell form
  const [sellTitle, setSellTitle] = useState("");
  const [sellDesc, setSellDesc] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [sellPhone, setSellPhone] = useState("");
  const [sellLoading, setSellLoading] = useState(false);
  const [sellSuccess, setSellSuccess] = useState(false);

  async function handleBuy() {
    if (!buyPhone) { Alert.alert("Ýalňyşlyk", "Nomeriňizi giriziň!"); return; }
    setBuyLoading(true);
    try {
      await saveOrder("marketplace-orders", {
        itemId: selected?.id, itemTitle: selected?.title, price: selected?.price, buyerPhone: buyPhone,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Üstünlikli!", "Sargydyňyz kabul edildi. Iň tiz wagtda siz bilen baglanarlar.");
      setSelected(null); setBuyPhone("");
    } catch { Alert.alert("Ýalňyşlyk", "Bilinmeýän ýalňyşlyk"); }
    finally { setBuyLoading(false); }
  }

  async function handleSell() {
    if (!sellTitle || !sellDesc || !sellPrice || !sellPhone) {
      Alert.alert("Ýalňyşlyk", "Ähli meýdançalary dolduryň!"); return;
    }
    setSellLoading(true);
    try {
      await saveOrder("marketplace-items", {
        title: sellTitle, description: sellDesc, price: parseFloat(sellPrice), sellerPhone: sellPhone, status: "pending",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSellSuccess(true);
    } catch { Alert.alert("Ýalňyşlyk", "Bilinmeýän ýalňyşlyk"); }
    finally { setSellLoading(false); }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: (isWeb ? 67 : insets.top) + 12, backgroundColor: colors.primary }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Sanly bazar</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {[{ id: "browse" as Tab, label: "Harytlar" }, { id: "sell" as Tab, label: "Satmak" }].map(t => (
          <Pressable key={t.id} onPress={() => setTab(t.id)}
            style={[styles.tabBtn, { borderBottomColor: tab === t.id ? colors.primary : "transparent" }]}>
            <Text style={[styles.tabLabel, { color: tab === t.id ? colors.primary : colors.mutedForeground }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === "browse" ? (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 34 : 100 }} showsVerticalScrollIndicator={false}>
          {selected ? (
            <View>
              <Pressable onPress={() => setSelected(null)} style={styles.breadcrumb}>
                <Feather name="arrow-left" size={16} color={colors.primary} />
                <Text style={[{ color: colors.primary, fontWeight: "600" }]}>Yzyna</Text>
              </Pressable>
              <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.detailIconBg, { backgroundColor: colors.primary + "15" }]}>
                  <Ionicons name="storefront-outline" size={32} color={colors.primary} />
                </View>
                <Text style={[styles.detailTitle, { color: colors.foreground }]}>{selected.title}</Text>
                <Text style={[{ color: colors.mutedForeground, fontSize: 14, marginBottom: 12 }]}>{selected.desc}</Text>
                <Text style={[styles.detailPrice, { color: colors.primary }]}>{selected.price} TMT</Text>
              </View>
              <View style={{ marginTop: 16 }}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>Siziň nomeriňiz</Text>
                <TextInput
                  value={buyPhone} onChangeText={setBuyPhone}
                  placeholder="+99361xxxxxx" placeholderTextColor={colors.mutedForeground}
                  keyboardType="phone-pad"
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                />
              </View>
              <Pressable onPress={handleBuy} disabled={buyLoading}
                style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed || buyLoading ? 0.7 : 1, marginTop: 20 }]}>
                {buyLoading ? <ActivityIndicator color="#fff" size="small" /> :
                  <Text style={styles.primaryBtnText}>Satyn almak</Text>}
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Elýeter sanly harytlar</Text>
              {sampleItems.map(item => (
                <Pressable key={item.id} onPress={() => setSelected(item)}
                  style={({ pressed }) => [styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}>
                  <View style={[styles.itemIconBg, { backgroundColor: colors.primary + "15" }]}>
                    <Ionicons name="cube-outline" size={22} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitle, { color: colors.foreground }]}>{item.title}</Text>
                    <Text style={[styles.itemDesc, { color: colors.mutedForeground }]}>{item.desc}</Text>
                    <Text style={[styles.itemCat, { color: colors.accent }]}>{item.category}</Text>
                  </View>
                  <Text style={[styles.itemPrice, { color: colors.primary }]}>{item.price} T</Text>
                </Pressable>
              ))}
            </>
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 34 : 100 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {sellSuccess ? (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#059669" />
              <Text style={[styles.successTitle, { color: colors.foreground }]}>Üstünlikli!</Text>
              <Text style={[styles.successText, { color: colors.mutedForeground }]}>Harydyňyz barlagdan soň çap edilýär.</Text>
              <Pressable onPress={() => { setSellSuccess(false); setSellTitle(""); setSellDesc(""); setSellPrice(""); setSellPhone(""); }}
                style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}>
                <Text style={styles.primaryBtnText}>Täze haryt goşmak</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Öz harydyňyzy satmak üçin maglumatlary giriziň</Text>
              {[
                { label: "Harydyň ady", val: sellTitle, set: setSellTitle, placeholder: "Meselem: Netflix Premium" },
                { label: "Düşündiriş", val: sellDesc, set: setSellDesc, placeholder: "Harydyňyz barada ýazyň...", multi: true },
                { label: "Bahasy (TMT)", val: sellPrice, set: setSellPrice, placeholder: "0", num: true },
                { label: "Siziň nomeriňiz", val: sellPhone, set: setSellPhone, placeholder: "+99361xxxxxx", phone: true },
              ].map((f, i) => (
                <View key={i} style={{ marginBottom: 14 }}>
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>{f.label}</Text>
                  <TextInput
                    value={f.val} onChangeText={f.set}
                    placeholder={f.placeholder} placeholderTextColor={colors.mutedForeground}
                    multiline={f.multi} numberOfLines={f.multi ? 4 : 1}
                    keyboardType={f.num ? "decimal-pad" : f.phone ? "phone-pad" : "default"}
                    style={[styles.input, f.multi && styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  />
                </View>
              ))}
              <Pressable onPress={handleSell} disabled={sellLoading}
                style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed || sellLoading ? 0.7 : 1 }]}>
                {sellLoading ? <ActivityIndicator color="#fff" size="small" /> :
                  <Text style={styles.primaryBtnText}>Haryt çap etmek</Text>}
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
  tabRow: { flexDirection: "row", borderBottomWidth: 1 },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 14, borderBottomWidth: 2 },
  tabLabel: { fontSize: 14, fontWeight: "700" },
  subtitle: { fontSize: 13, marginBottom: 16 },
  itemCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  itemIconBg: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  itemTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  itemDesc: { fontSize: 12, marginBottom: 2 },
  itemCat: { fontSize: 11, fontWeight: "600" },
  itemPrice: { fontSize: 16, fontWeight: "800" },
  breadcrumb: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  detailCard: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: "center", gap: 8 },
  detailIconBg: { width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  detailTitle: { fontSize: 20, fontWeight: "800", textAlign: "center" },
  detailPrice: { fontSize: 28, fontWeight: "800" },
  label: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  textarea: { height: 100, textAlignVertical: "top" },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 16 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  successContainer: { alignItems: "center", paddingTop: 60, gap: 16 },
  successTitle: { fontSize: 24, fontWeight: "800" },
  successText: { fontSize: 14, textAlign: "center" },
});
