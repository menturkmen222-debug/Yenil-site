import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  Alert, ActivityIndicator, Modal, Platform, Image,
} from "react-native";
import { router } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useColors } from "@/hooks/useColors";
import { db, ref, onValue, saveOrder } from "@/lib/firebase";
import { useBonusPul } from "@/contexts/BonusPulContext";
import { uploadImage } from "@/lib/upload";

const PAYMENT_PHONES = ["+993 71 789091", "+993 64 629487", "+993 71 788546"];

const CATEGORIES = [
  { id: "all", label: "Hemmesi" },
  { id: "accounts", label: "Akkauntlar" },
  { id: "digital", label: "Sanly harytlar" },
  { id: "services", label: "Hyzmatlar" },
  { id: "other", label: "Beýleki" },
];

interface MarketItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  sellerName: string;
  sellerPhone: string;
  status: string;
}

function BuyModal({ item, onClose, colors }: { item: MarketItem; onClose: () => void; colors: ReturnType<typeof useColors> }) {
  const { balance, deviceId, deduct } = useBonusPul();
  const [payMethod, setPayMethod] = useState<"terminal" | "bonus" | null>(null);
  const [buyerPhone, setBuyerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleBuy() {
    if (!payMethod) { Alert.alert("Saýlaň", "Töleg usulyny saýlaň!"); return; }
    if (payMethod === "terminal" && !buyerPhone) { Alert.alert("Ýalňyşlyk", "Nomeriňizi giriziň!"); return; }
    setLoading(true);
    try {
      if (payMethod === "bonus") {
        if (balance < item.price) { Alert.alert("Ýalňyşlyk", `Ýeterlik bonus pul ýok. Balansyňyz: ${balance} BP`); setLoading(false); return; }
        await deduct(item.price);
      }
      await saveOrder("marketplace-orders", {
        itemId: item.id, itemTitle: item.title, price: item.price,
        payMethod, buyerPhone: payMethod === "terminal" ? buyerPhone : undefined,
        sellerPhone: item.sellerPhone, deviceId, status: "pending",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(true);
    } catch { Alert.alert("Ýalňyşlyk", "Bilinmeýän ýalňyşlyk"); }
    finally { setLoading(false); }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={st.backdrop} onPress={onClose} />
      <View style={[st.sheet, { backgroundColor: colors.card }]}>
        <View style={[st.handle, { backgroundColor: colors.border }]} />
        {done ? (
          <View style={{ alignItems: "center", gap: 12 }}>
            <Ionicons name="checkmark-circle" size={56} color="#059669" />
            <Text style={[st.sheetTitle, { color: colors.foreground }]}>Sargyt kabul edildi!</Text>
            <Text style={[{ color: colors.mutedForeground, textAlign: "center", lineHeight: 20, fontSize: 13 }]}>
              Satyjy siz bilen {item.sellerPhone} arkaly habarlaşar.
            </Text>
            <Pressable onPress={onClose} style={({ pressed }) => [st.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1, marginTop: 8 }]}>
              <Text style={st.primaryBtnText}>Düşündim</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={[st.sheetTitle, { color: colors.foreground }]}>{item.title}</Text>
            <Text style={[{ color: colors.primary, fontWeight: "800", fontSize: 22, marginBottom: 4 }]}>{item.price} TMT</Text>
            <Text style={[{ color: colors.mutedForeground, fontSize: 12, marginBottom: 16 }]}>Satyjy: {item.sellerName}</Text>

            <Text style={[st.fieldLabel, { color: colors.mutedForeground }]}>Töleg usulyny saýlaň</Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
              {([{ id: "terminal" as const, label: "TMCELL terminal", icon: "phone-portrait-outline" as const },
                { id: "bonus" as const, label: `Bonus pul (${balance} BP)`, icon: "wallet-outline" as const }]).map(m => (
                <Pressable key={m.id} onPress={() => setPayMethod(m.id)}
                  style={[st.proofCard, {
                    backgroundColor: payMethod === m.id ? colors.primary + "15" : colors.background,
                    borderColor: payMethod === m.id ? colors.primary : colors.border,
                  }]}>
                  <Ionicons name={m.icon} size={20} color={payMethod === m.id ? colors.primary : colors.mutedForeground} />
                  <Text style={[st.proofLabel, { color: payMethod === m.id ? colors.primary : colors.foreground, fontSize: 12 }]}>{m.label}</Text>
                </Pressable>
              ))}
            </View>

            {payMethod === "terminal" && (
              <>
                <View style={[{ backgroundColor: colors.primary + "10", borderRadius: 12, padding: 12, marginBottom: 12 }]}>
                  <Text style={[{ fontWeight: "700", color: colors.foreground, marginBottom: 6 }]}>Töleg sanlary ({item.price} TMT):</Text>
                  {PAYMENT_PHONES.map((p, i) => <Text key={i} style={{ color: colors.primary, fontWeight: "700", fontSize: 14 }}>{p}</Text>)}
                </View>
                <View style={{ marginBottom: 12 }}>
                  <Text style={[st.fieldLabel, { color: colors.mutedForeground }]}>Siziň nomeriňiz</Text>
                  <TextInput value={buyerPhone} onChangeText={setBuyerPhone}
                    placeholder="+99361xxxxxx" placeholderTextColor={colors.mutedForeground}
                    keyboardType="phone-pad"
                    style={[st.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  />
                </View>
              </>
            )}

            <Pressable onPress={handleBuy} disabled={loading}
              style={({ pressed }) => [st.primaryBtn, { backgroundColor: colors.primary, opacity: pressed || loading ? 0.7 : 1 }]}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={st.primaryBtnText}>Satyn aldym</Text>}
            </Pressable>
          </>
        )}
      </View>
    </Modal>
  );
}

function AddItemModal({ onClose, colors }: { onClose: () => void; colors: ReturnType<typeof useColors> }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("other");
  const [seller, setSeller] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [catIdx, setCatIdx] = useState(1);
  const cats = ["other", "accounts", "digital", "services"];

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
  }

  async function submit() {
    if (!title || !desc || !price || !seller || !sellerPhone) { Alert.alert("Ýalňyşlyk", "Ähli meýdançalary dolduryň!"); return; }
    setLoading(true);
    try {
      const imageUrl = imageUri ? await uploadImage(imageUri, "item.jpg") : null;
      await saveOrder("marketplace-items", {
        title, description: desc, price: parseFloat(price), category,
        sellerName: seller, sellerPhone, imageUrl, status: "pending",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Üstünlikli!", "Haryt goşmak haýyşnamasy iberildi!");
      onClose();
    } catch { Alert.alert("Ýalňyşlyk", "Bilinmeýän ýalňyşlyk"); }
    finally { setLoading(false); }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={st.backdrop} onPress={onClose} />
      <ScrollView style={[st.sheetScroll, { backgroundColor: colors.card }]} keyboardShouldPersistTaps="handled">
        <View style={[st.handle, { backgroundColor: colors.border, alignSelf: "center" }]} />
        <Text style={[st.sheetTitle, { color: colors.foreground, marginHorizontal: 24, marginTop: 8 }]}>Haryt goşmak</Text>
        <View style={{ padding: 24, gap: 14 }}>
          {[
            { label: "Harydyň ady", val: title, set: setTitle, ph: "Harydyň ady" },
            { label: "Bahaňyz (TMT)", val: price, set: setPrice, ph: "0.00", num: true },
            { label: "Satyjynyň ady", val: seller, set: setSeller, ph: "Adyňyz" },
            { label: "Telefon nomeriňiz", val: sellerPhone, set: setSellerPhone, ph: "+993 XX XXXXXX", phone: true },
          ].map((f, i) => (
            <View key={i}>
              <Text style={[st.fieldLabel, { color: colors.mutedForeground }]}>{f.label}</Text>
              <TextInput value={f.val} onChangeText={f.set} placeholder={f.ph} placeholderTextColor={colors.mutedForeground}
                keyboardType={f.num ? "decimal-pad" : f.phone ? "phone-pad" : "default"}
                style={[st.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>
          ))}

          <View>
            <Text style={[st.fieldLabel, { color: colors.mutedForeground }]}>Kategoriýa</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {cats.map((c, i) => (
                <Pressable key={c} onPress={() => { setCategory(c); setCatIdx(i); }}
                  style={[st.catChip, { backgroundColor: catIdx === i ? colors.primary : colors.background, borderColor: catIdx === i ? colors.primary : colors.border }]}>
                  <Text style={{ color: catIdx === i ? "#fff" : colors.foreground, fontWeight: "600", fontSize: 12 }}>
                    {["Beýleki", "Akkauntlar", "Sanly harytlar", "Hyzmatlar"][i]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View>
            <Text style={[st.fieldLabel, { color: colors.mutedForeground }]}>Düşündiriş</Text>
            <TextInput value={desc} onChangeText={setDesc} placeholder="Haryt barada jikme-jik gürrüň beriň..."
              placeholderTextColor={colors.mutedForeground} multiline numberOfLines={4}
              style={[st.input, st.textarea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            />
          </View>

          <Pressable onPress={pickImage}
            style={[{ borderWidth: 2, borderStyle: "dashed", borderColor: colors.primary, borderRadius: 12, padding: 16, alignItems: "center" }]}>
            <Ionicons name="image-outline" size={28} color={colors.primary} />
            <Text style={[{ color: colors.primary, fontWeight: "600", marginTop: 6 }]}>{imageUri ? "Surat saýlandy ✓" : "Surat saýlaň (islege görä)"}</Text>
          </Pressable>
          {imageUri && <Image source={{ uri: imageUri }} style={{ height: 120, borderRadius: 10, resizeMode: "cover" }} />}

          <Pressable onPress={submit} disabled={loading}
            style={({ pressed }) => [st.primaryBtn, { backgroundColor: colors.primary, opacity: pressed || loading ? 0.7 : 1 }]}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={st.primaryBtnText}>Ibermek</Text>}
          </Pressable>
          <View style={{ height: 24 }} />
        </View>
      </ScrollView>
    </Modal>
  );
}

export default function BazarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [filter, setFilter] = useState("all");
  const [buyItem, setBuyItem] = useState<MarketItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    const itemsRef = ref(db, "marketplace-items");
    const unsub = onValue(itemsRef, snap => {
      if (snap.exists()) {
        const data = snap.val();
        const arr: MarketItem[] = Object.entries(data)
          .map(([id, val]: [string, any]) => ({ id, ...val }))
          .filter(item => item.status === "approved");
        setItems(arr.reverse());
      } else { setItems([]); }
      setLoadingItems(false);
    });
    return () => unsub();
  }, []);

  const filtered = filter === "all" ? items : items.filter(i => i.category === filter);

  return (
    <View style={[{ flex: 1 }, { backgroundColor: colors.background }]}>
      <View style={[st.header, { paddingTop: (isWeb ? 0 : insets.top) + 12, backgroundColor: colors.primary }]}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
              <Feather name="arrow-left" size={20} color="#fff" />
            </Pressable>
            <Text style={st.headerTitle}>Sanly bazar</Text>
          </View>
          <Pressable onPress={() => setShowAdd(true)}
            style={[{ backgroundColor: "rgba(255,255,255,0.2)", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }]}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Haryt goşmak</Text>
          </Pressable>
        </View>
      </View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: colors.card, borderBottomColor: colors.border, borderBottomWidth: 1 }}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: "row" }}>
        {CATEGORIES.map(c => (
          <Pressable key={c.id} onPress={() => setFilter(c.id)}
            style={[st.catChip, { backgroundColor: filter === c.id ? colors.primary : colors.background, borderColor: filter === c.id ? colors.primary : colors.border }]}>
            <Text style={{ color: filter === c.id ? "#fff" : colors.foreground, fontWeight: "600", fontSize: 12 }}>{c.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {loadingItems ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 }}>
          <Ionicons name="storefront-outline" size={56} color={colors.mutedForeground} />
          <Text style={[{ color: colors.mutedForeground, fontSize: 15, textAlign: "center" }]}>
            Heniz haryt ýok. Ilkinji bolup goşuň!
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 34 : 100 }} showsVerticalScrollIndicator={false}>
          {filtered.map(item => (
            <Pressable key={item.id} onPress={() => setBuyItem(item)}
              style={({ pressed }) => [st.itemCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={st.itemImg} />
              ) : (
                <View style={[st.itemImgPlaceholder, { backgroundColor: colors.muted }]}>
                  <Ionicons name="cube-outline" size={24} color={colors.mutedForeground} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <Text style={[st.itemTitle, { color: colors.foreground }]} numberOfLines={2}>{item.title}</Text>
                  <View style={[st.priceBadge, { backgroundColor: colors.primary }]}>
                    <Text style={st.priceBadgeText}>{item.price} TMT</Text>
                  </View>
                </View>
                <Text style={[{ color: colors.mutedForeground, fontSize: 12, lineHeight: 17 }]} numberOfLines={2}>{item.description}</Text>
                <Text style={[{ color: colors.mutedForeground, fontSize: 11, marginTop: 4 }]}>👤 {item.sellerName}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {buyItem && <BuyModal item={buyItem} onClose={() => setBuyItem(null)} colors={colors} />}
      {showAdd && <AddItemModal onClose={() => setShowAdd(false)} colors={colors} />}
    </View>
  );
}

const st = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sheetScroll: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "90%" },
  handle: { width: 40, height: 4, borderRadius: 2, marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: "800", marginBottom: 8 },
  fieldLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  textarea: { height: 90, textAlignVertical: "top" },
  proofCard: { flex: 1, borderRadius: 12, borderWidth: 2, padding: 12, alignItems: "center", gap: 6 },
  proofLabel: { fontWeight: "600", textAlign: "center" },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 16, marginTop: 4 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  catChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  itemCard: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10, alignItems: "flex-start" },
  itemImg: { width: 72, height: 72, borderRadius: 10 },
  itemImgPlaceholder: { width: 72, height: 72, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  itemTitle: { fontSize: 14, fontWeight: "700", flex: 1, marginRight: 8 },
  priceBadge: { borderRadius: 50, paddingHorizontal: 10, paddingVertical: 3, flexShrink: 0 },
  priceBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
