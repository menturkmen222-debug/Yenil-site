import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, Platform,
  TextInput, Modal, Alert, ActivityIndicator, FlatList, Linking,
  KeyboardAvoidingView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import {
  HyzmatItem, HyzmatCategory, HYZMAT_CATEGORIES,
  listenHyzmatlar, addHyzmat,
} from "@/lib/hyzmatlar";

const ALL_KEY = "all";
type FilterKey = HyzmatCategory | typeof ALL_KEY;

const FILTER_TABS: { key: FilterKey; label: string; icon: string; color: string }[] = [
  { key: ALL_KEY, label: "Ählisi", icon: "apps-outline", color: "#6366f1" },
  ...HYZMAT_CATEGORIES,
];

function timeSince(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Az öň";
  if (m < 60) return `${m} min öň`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sagat öň`;
  return `${Math.floor(h / 24)} gün öň`;
}

export default function HyzmatlarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const [items, setItems] = useState<HyzmatItem[]>([]);
  const [filter, setFilter] = useState<FilterKey>(ALL_KEY);
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    ownerName: "", title: "", description: "",
    category: "other" as HyzmatCategory,
    phone: "", location: "", price: "",
  });

  useEffect(() => {
    const unsub = listenHyzmatlar(setItems);
    return unsub;
  }, []);

  const filtered = items.filter((h) => {
    const matchCat = filter === ALL_KEY || h.category === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || h.title.toLowerCase().includes(q) ||
      h.description.toLowerCase().includes(q) ||
      h.ownerName.toLowerCase().includes(q) ||
      h.location.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const catMeta = useCallback((key: HyzmatCategory) =>
    HYZMAT_CATEGORIES.find((c) => c.key === key) ?? HYZMAT_CATEGORIES[HYZMAT_CATEGORIES.length - 1],
    []);

  async function handleSubmit() {
    if (!form.ownerName.trim() || !form.title.trim() || !form.phone.trim()) {
      Alert.alert("Doldurylmadyk", "Ady, başlyk we telefon hökman!"); return;
    }
    setSubmitting(true);
    try {
      await addHyzmat({
        ownerName: form.ownerName.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        phone: form.phone.trim(),
        location: form.location.trim(),
        price: form.price.trim(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModalVisible(false);
      setForm({ ownerName: "", title: "", description: "", category: "other", phone: "", location: "", price: "" });
      Alert.alert("Üstünlikli!", "Hyzmadyňyz goşuldy.");
    } catch {
      Alert.alert("Ýalňyşlyk", "Hyzmat goşup bolmady. Gaýtadan synanyşyň.");
    } finally {
      setSubmitting(false);
    }
  }

  function renderItem({ item }: { item: HyzmatItem }) {
    const meta = catMeta(item.category);
    return (
      <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={s.cardTop}>
          <View style={[s.catBadge, { backgroundColor: meta.color + "20" }]}>
            <Ionicons name={meta.icon as any} size={14} color={meta.color} />
            <Text style={[s.catLabel, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <Text style={[s.timeAgo, { color: colors.mutedForeground }]}>{timeSince(item.timestamp)}</Text>
        </View>

        <Text style={[s.cardTitle, { color: colors.foreground }]} numberOfLines={2}>{item.title}</Text>
        {!!item.description && (
          <Text style={[s.cardDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{item.description}</Text>
        )}

        <View style={s.cardMeta}>
          {!!item.location && (
            <View style={s.metaRow}>
              <Ionicons name="location-outline" size={13} color={colors.mutedForeground} />
              <Text style={[s.metaText, { color: colors.mutedForeground }]} numberOfLines={1}>{item.location}</Text>
            </View>
          )}
          {!!item.price && (
            <View style={s.metaRow}>
              <Ionicons name="pricetag-outline" size={13} color="#10b981" />
              <Text style={[s.priceText, { color: "#10b981" }]}>{item.price}</Text>
            </View>
          )}
        </View>

        <View style={s.cardFooter}>
          <View style={s.metaRow}>
            <Ionicons name="person-outline" size={13} color={colors.mutedForeground} />
            <Text style={[s.metaText, { color: colors.mutedForeground }]}>{item.ownerName}</Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Linking.openURL(`tel:${item.phone.replace(/\s/g, "")}`);
            }}
            style={[s.callBtn, { backgroundColor: "#10b981" }]}
          >
            <Ionicons name="call-outline" size={14} color="#fff" />
            <Text style={s.callText}>{item.phone}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={["#065f46", "#10b981"]}
        style={[s.header, { paddingTop: (isWeb ? 0 : insets.top) + 12 }]}
      >
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.headerTitle}>Halk Hyzmatlary</Text>
          <Text style={s.headerSub}>
            {items.length > 0 ? `${items.length} hyzmat bar` : "Ulag · Usta · Gözellik · Nahar"}
          </Text>
        </View>
        <Pressable
          style={s.addBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setModalVisible(true);
          }}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </LinearGradient>

      {/* Search */}
      <View style={[s.searchRow, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={[s.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Hyzmat gözle..."
            placeholderTextColor={colors.mutedForeground}
            style={[s.searchInput, { color: colors.foreground }]}
          />
          {!!search && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.tabs}
        style={[s.tabsBar, { borderBottomColor: colors.border }]}
      >
        {FILTER_TABS.map((t) => {
          const active = filter === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter(t.key);
              }}
              style={[s.tab, active && { backgroundColor: t.color }, !active && { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
            >
              <Ionicons name={t.icon as any} size={14} color={active ? "#fff" : t.color} />
              <Text style={[s.tabText, { color: active ? "#fff" : colors.foreground }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* List */}
      {filtered.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="storefront-outline" size={48} color={colors.mutedForeground} />
          <Text style={[s.emptyTitle, { color: colors.foreground }]}>Hyzmat tapylmady</Text>
          <Text style={[s.emptyDesc, { color: colors.mutedForeground }]}>
            {search ? "Başga açar söz synanyşyň" : "Ilkinji boluň we hyzmatyňyzy goşuň!"}
          </Text>
          {!search && (
            <Pressable style={s.emptyBtn} onPress={() => setModalVisible(true)}>
              <Text style={s.emptyBtnText}>+ Hyzmat goş</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: colors.background }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={[s.modalHeader, { borderBottomColor: colors.border, paddingTop: (isWeb ? 0 : insets.top) + 12 }]}>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>Hyzmat Goş</Text>
            <Pressable onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>
            {/* Category picker */}
            <Text style={[s.fieldLabel, { color: colors.foreground }]}>Kategoriýa</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {HYZMAT_CATEGORIES.map((c) => {
                const sel = form.category === c.key;
                return (
                  <Pressable
                    key={c.key}
                    onPress={() => setForm(f => ({ ...f, category: c.key }))}
                    style={[s.catPill, sel && { backgroundColor: c.color }, !sel && { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
                  >
                    <Ionicons name={c.icon as any} size={14} color={sel ? "#fff" : c.color} />
                    <Text style={[s.catPillText, { color: sel ? "#fff" : colors.foreground }]}>{c.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {[
              { key: "ownerName", label: "Adyňyz *", placeholder: "Meselem: Myrat Oraz" },
              { key: "title", label: "Hyzmatyň ady *", placeholder: "Meselem: Awtoulag abatlamak" },
              { key: "description", label: "Düşündiriş", placeholder: "Hyzmatyňyz barada gysgaça" },
              { key: "phone", label: "Telefon *", placeholder: "+993 60 000000" },
              { key: "location", label: "Ýerleşýän ýeri", placeholder: "Meselem: Aşgabat, Büzmeýin" },
              { key: "price", label: "Baha", placeholder: "Meselem: 50 TMT / sagat" },
            ].map(({ key, label, placeholder }) => (
              <View key={key}>
                <Text style={[s.fieldLabel, { color: colors.foreground }]}>{label}</Text>
                <TextInput
                  value={form[key as keyof typeof form]}
                  onChangeText={(v) => setForm(f => ({ ...f, [key]: v }))}
                  placeholder={placeholder}
                  placeholderTextColor={colors.mutedForeground}
                  multiline={key === "description"}
                  numberOfLines={key === "description" ? 3 : 1}
                  style={[
                    s.fieldInput,
                    { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
                    key === "description" && { height: 80, textAlignVertical: "top" },
                  ]}
                />
              </View>
            ))}

            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={[s.submitBtn, submitting && { opacity: 0.6 }]}
            >
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.submitText}>Hyzmat Goş</Text>
              }
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  searchRow: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 40 },
  searchInput: { flex: 1, fontSize: 14 },
  tabsBar: { maxHeight: 52, borderBottomWidth: 1 },
  tabs: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: "center" },
  tab: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tabText: { fontSize: 12, fontWeight: "600" },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  catBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  catLabel: { fontSize: 11, fontWeight: "600" },
  timeAgo: { fontSize: 11 },
  cardTitle: { fontSize: 16, fontWeight: "700", lineHeight: 22 },
  cardDesc: { fontSize: 13, lineHeight: 18 },
  cardMeta: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12 },
  priceText: { fontSize: 13, fontWeight: "700" },
  callBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  callText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginTop: 8 },
  emptyDesc: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  emptyBtn: { backgroundColor: "#10b981", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, marginTop: 8 },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  fieldLabel: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  fieldInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  catPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  catPillText: { fontSize: 12, fontWeight: "600" },
  submitBtn: { backgroundColor: "#10b981", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
