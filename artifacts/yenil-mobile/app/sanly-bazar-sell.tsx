import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  Platform, Modal, TextInput, Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { PessimisticButton } from "@/components/PessimisticButton";
import { useBonusPul } from "@/contexts/BonusPulContext";
import {
  watchDigitalListings, createDigitalListing, buyDigitalListing, cancelDigitalListing,
  type DigitalListing, type DigitalCategory,
} from "@/lib/firebase";
import { getLevel, formatRelativeTime } from "@/lib/reputation";

const CATEGORIES: { id: DigitalCategory; label: string; icon: string; color: string; examples: string }[] = [
  { id: "vpn", label: "VPN", icon: "lock-closed-outline", color: "#0284c7", examples: "1 aý, 3 aý, ýyllyk" },
  { id: "gaming", label: "Oýun", icon: "game-controller-outline", color: "#7c3aed", examples: "PUBG UC, Free Fire, Steam" },
  { id: "software", label: "Programma", icon: "desktop-outline", color: "#059669", examples: "Antivirus, Office, ş.m." },
  { id: "education", label: "Bilim", icon: "book-outline", color: "#d97706", examples: "Kurslar, Kitaplar" },
  { id: "other", label: "Beýleki", icon: "ellipsis-horizontal-outline", color: "#6366f1", examples: "Islendik sanly haryt" },
];

export default function SanlyBazarSellScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { deviceId, balance } = useBonusPul();
  const isWeb = Platform.OS === "web";

  const [listings, setListings] = useState<DigitalListing[]>([]);
  const [activeCategory, setActiveCategory] = useState<DigitalCategory | "all">("all");
  const [activeTab, setActiveTab] = useState<"browse" | "sell" | "mine">("browse");
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<DigitalCategory>("vpn");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [delivery, setDelivery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = watchDigitalListings(setListings);
    return () => unsub();
  }, []);

  const priceNum = parseFloat(price) || 0;

  const filteredListings = listings.filter(l => {
    if (activeTab === "mine") return l.sellerDeviceId === deviceId;
    if (activeCategory !== "all") return l.category === activeCategory;
    return true;
  });

  async function handleCreate() {
    if (!title.trim()) { Alert.alert("Ýalňyşlyk", "Haryt adyny giriziň"); return; }
    if (!description.trim()) { Alert.alert("Ýalňyşlyk", "Beýany ýazyň"); return; }
    if (priceNum < 1) { Alert.alert("Ýalňyşlyk", "Baha 1 BP-den az bolmaz"); return; }
    if (!delivery.trim()) { Alert.alert("Ýalňyşlyk", "Eltip beriş usulyny giriziň"); return; }
    setSubmitting(true);
    const result = await createDigitalListing(deviceId, title, category, description, priceNum, delivery);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowModal(false);
      setTitle(""); setDescription(""); setPrice(""); setDelivery("");
      setActiveTab("mine");
    } else {
      Alert.alert("Ýalňyşlyk", result.message);
    }
    setSubmitting(false);
  }

  async function handleBuy(listingId: string, priceAmt: number, title: string) {
    if (priceAmt > balance) {
      Alert.alert("Ýeterlik BP ýok", `Siziň balansyňyz: ${balance.toFixed(2)} BP. Gerekli: ${priceAmt} BP`);
      return;
    }
    Alert.alert(
      "Satyn al",
      `"${title}" harydyny ${priceAmt} BP-a satyn almak isleýärsiňizmi?`,
      [
        { text: "Ýok" },
        {
          text: `${priceAmt} BP Töle`,
          onPress: async () => {
            setBuyingId(listingId);
            const result = await buyDigitalListing(listingId, deviceId);
            if (result.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Satyn alyndy!", result.message);
            } else {
              Alert.alert("Ýalňyşlyk", result.message);
            }
            setBuyingId(null);
          },
        },
      ]
    );
  }

  async function handleCancel(listingId: string) {
    Alert.alert("Haryt ýatyr", "Bu harydyňyzy ýatyrmagy isleýärsiňizmi?", [
      { text: "Ýok" },
      {
        text: "Ýatyr", style: "destructive",
        onPress: async () => {
          const result = await cancelDigitalListing(listingId, deviceId);
          if (!result.success) Alert.alert("Ýalňyşlyk", result.message);
          else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }

  function ListingCard({ listing }: { listing: DigitalListing }) {
    const cat = CATEGORIES.find(c => c.id === listing.category) ?? CATEGORIES[4];
    const lv = getLevel(listing.sellerRepScore);
    const isOwn = listing.sellerDeviceId === deviceId;

    return (
      <View style={[lc.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Header */}
        <View style={lc.cardHead}>
          <View style={[lc.catBadge, { backgroundColor: cat.color + "18" }]}>
            <Ionicons name={cat.icon as any} size={14} color={cat.color} />
            <Text style={[lc.catText, { color: cat.color }]}>{cat.label}</Text>
          </View>
          <View style={[lc.priceBadge, { backgroundColor: cat.color + "15" }]}>
            <Ionicons name="wallet-outline" size={13} color={cat.color} />
            <Text style={[lc.priceText, { color: cat.color }]}>{listing.price} BP</Text>
          </View>
        </View>

        {/* Title + desc */}
        <Text style={[lc.title, { color: colors.foreground }]}>{listing.title}</Text>
        <Text style={[lc.desc, { color: colors.mutedForeground }]} numberOfLines={2}>{listing.description}</Text>

        {/* Delivery */}
        <View style={[lc.deliveryRow, { backgroundColor: colors.muted }]}>
          <Ionicons name="send-outline" size={12} color={colors.mutedForeground} />
          <Text style={[lc.deliveryText, { color: colors.mutedForeground }]}>{listing.deliveryMethod}</Text>
        </View>

        {/* Seller */}
        <View style={lc.sellerRow}>
          <View style={[lc.sellerAvatar, { backgroundColor: lv.bg, borderColor: lv.border }]}>
            <Ionicons name={lv.icon as any} size={12} color={lv.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[lc.sellerName, { color: colors.foreground }]}>
              {isOwn ? "Siz" : listing.sellerNickname}
            </Text>
            <Text style={[lc.sellerRep, { color: lv.color }]}>{lv.labelTm} · {listing.sellerRepScore} bal</Text>
          </View>
          <Text style={[lc.time, { color: colors.mutedForeground }]}>{formatRelativeTime(listing.createdAt)}</Text>
        </View>

        {/* Action */}
        {isOwn ? (
          <Pressable onPress={() => handleCancel(listing.id)} style={lc.cancelBtn}>
            <Ionicons name="trash-outline" size={14} color="#ef4444" />
            <Text style={lc.cancelText}>Ýatyr</Text>
          </Pressable>
        ) : (
          <PessimisticButton
            label={`${listing.price} BP — Satyn al`}
            loadingLabel="Satyn alynýar..."
            loading={buyingId === listing.id}
            disabled={buyingId === listing.id}
            onPress={() => handleBuy(listing.id, listing.price, listing.title)}
            color={cat.color}
            size="sm"
            icon={<Ionicons name="cart-outline" size={16} color="#fff" />}
          />
        )}
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#831843", "#db2777"]}
        style={[s.header, { paddingTop: (isWeb ? 0 : insets.top) + 14 }]}
      >
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.headerTitle}>Sanly Bazar</Text>
          <Text style={s.headerSub}>Sanly haryt sat ýa-da satyn al — BP bilen</Text>
        </View>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowModal(true); }}
          style={s.addBtn}
        >
          <Ionicons name="add" size={22} color="#db2777" />
        </Pressable>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

        {/* ── Main tabs ── */}
        <View style={[s.mainTabs, { backgroundColor: colors.muted }]}>
          {[
            { id: "browse" as const, label: "Bazar", icon: "storefront-outline" },
            { id: "sell" as const, label: "Sat", icon: "add-circle-outline" },
            { id: "mine" as const, label: "Meniňki", icon: "person-outline" },
          ].map(t => (
            <Pressable
              key={t.id}
              onPress={() => {
                if (t.id === "sell") { setShowModal(true); return; }
                setActiveTab(t.id);
              }}
              style={[s.mainTabBtn, activeTab === t.id && { backgroundColor: "#db2777" }]}
            >
              <Ionicons name={t.icon as any} size={16} color={activeTab === t.id ? "#fff" : colors.mutedForeground} />
              <Text style={[s.mainTabText, { color: activeTab === t.id ? "#fff" : colors.mutedForeground }]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Category filter (browse only) ── */}
        {activeTab === "browse" && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, marginTop: 10 }}>
            <Pressable
              onPress={() => setActiveCategory("all")}
              style={[s.catFilterBtn, { backgroundColor: activeCategory === "all" ? "#db2777" : colors.card, borderColor: activeCategory === "all" ? "#db2777" : colors.border }]}
            >
              <Text style={[s.catFilterText, { color: activeCategory === "all" ? "#fff" : colors.foreground }]}>Ähli</Text>
            </Pressable>
            {CATEGORIES.map(c => (
              <Pressable
                key={c.id}
                onPress={() => setActiveCategory(c.id)}
                style={[s.catFilterBtn, { backgroundColor: activeCategory === c.id ? c.color : colors.card, borderColor: activeCategory === c.id ? c.color : colors.border }]}
              >
                <Text style={[s.catFilterText, { color: activeCategory === c.id ? "#fff" : colors.foreground }]}>{c.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* ── Listings ── */}
        {filteredListings.length === 0 ? (
          <View style={[s.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="storefront-outline" size={48} color={colors.mutedForeground} />
            <Text style={[s.emptyTitle, { color: colors.foreground }]}>
              {activeTab === "mine" ? "Siz entek haryt satmadyňyz" : "Bu kategoriýada haryt ýok"}
            </Text>
            <Text style={[s.emptyDesc, { color: colors.mutedForeground }]}>
              {activeTab === "mine" ? "Sanly haryt ýerleşdiriň we BP gazanyň" : "Ilkinji harydyňyzy ýerleşdiriň"}
            </Text>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowModal(true); }}
              style={[s.emptyBtn, { backgroundColor: "#db2777" }]}
            >
              <Ionicons name="add-circle-outline" size={16} color="#fff" />
              <Text style={s.emptyBtnText}>Haryt ýerleşdir</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, paddingTop: 10, gap: 10 }}>
            {filteredListings.map(l => <ListingCard key={l.id} listing={l} />)}
          </View>
        )}
      </ScrollView>

      {/* ── FAB ── */}
      {filteredListings.length > 0 && (
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowModal(true); }}
          style={[s.fab, { backgroundColor: "#db2777" }]}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </Pressable>
      )}

      {/* ── Create listing modal ── */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <View style={[s.modalWrap, { backgroundColor: colors.background }]}>
          <View style={[s.modalHandle, { backgroundColor: colors.border }]} />
          <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[s.modalTitle, { color: colors.foreground }]}>Täze Haryt</Text>
              <Text style={[s.modalSub, { color: colors.mutedForeground }]}>Sanly harydyňyzy ýerleşdiriň</Text>
            </View>
            <Pressable onPress={() => setShowModal(false)} style={[s.closeBtn, { backgroundColor: colors.muted }]}>
              <Ionicons name="close" size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
            {/* Category */}
            <View style={{ gap: 6 }}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>Kategoriýa</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {CATEGORIES.map(c => (
                  <Pressable
                    key={c.id}
                    onPress={() => setCategory(c.id)}
                    style={[
                      s.catBtn,
                      { backgroundColor: category === c.id ? c.color : colors.card, borderColor: category === c.id ? c.color : colors.border },
                    ]}
                  >
                    <Ionicons name={c.icon as any} size={14} color={category === c.id ? "#fff" : c.color} />
                    <Text style={[s.catBtnText, { color: category === c.id ? "#fff" : colors.foreground }]}>
                      {c.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[s.catHint, { color: colors.mutedForeground }]}>
                Ör: {CATEGORIES.find(c => c.id === category)?.examples}
              </Text>
            </View>

            {/* Title */}
            <View style={{ gap: 6 }}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>Haryt ady *</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
                value={title}
                onChangeText={setTitle}
                placeholder="Ör: PUBG UC 600, NordVPN 1 aý..."
                placeholderTextColor={colors.mutedForeground}
                maxLength={60}
              />
            </View>

            {/* Description */}
            <View style={{ gap: 6 }}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>Beýany *</Text>
              <TextInput
                style={[s.textArea, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Haryt barada jikme-jik ýazyň, näme alys bolar, nähili işlär..."
                placeholderTextColor={colors.mutedForeground}
                multiline numberOfLines={4}
                maxLength={300}
              />
            </View>

            {/* Price */}
            <View style={{ gap: 6 }}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>Bahasy (BP) *</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholder="Ör: 30 BP"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            {/* Delivery */}
            <View style={{ gap: 6 }}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>Eltip beriş usuly *</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
                value={delivery}
                onChangeText={setDelivery}
                placeholder="Ör: Telegram @meniňadym, Email, Şahsy duşuşyk"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            <View style={[s.tipBox, { backgroundColor: "#db2777" + "10", borderColor: "#db2777" + "25" }]}>
              <Ionicons name="information-circle-outline" size={16} color="#db2777" />
              <Text style={[s.tipText, { color: colors.foreground }]}>
                Haryt satylandan soňra <Text style={{ color: "#db2777", fontWeight: "800" }}>BP hasabyňyza</Text> geçirilýär. Abraý balyňyz hem ýokarlanýar.
              </Text>
            </View>

            <PessimisticButton
              label="Haryt ýerleşdir"
              loadingLabel="Ýerleşdirilýär..."
              loading={submitting}
              disabled={submitting || !title.trim() || !description.trim() || priceNum < 1 || !delivery.trim()}
              onPress={handleCreate}
              color="#db2777"
              size="lg"
              icon={<Ionicons name="storefront-outline" size={18} color="#fff" />}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const lc = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 10 },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  catBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  catText: { fontSize: 11, fontWeight: "700" },
  priceBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  priceText: { fontSize: 14, fontWeight: "800" },
  title: { fontSize: 15, fontWeight: "800" },
  desc: { fontSize: 12, lineHeight: 17 },
  deliveryRow: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  deliveryText: { fontSize: 11 },
  sellerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  sellerAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  sellerName: { fontSize: 12, fontWeight: "700" },
  sellerRep: { fontSize: 10, marginTop: 1 },
  time: { fontSize: 10 },
  buyBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 13 },
  buyBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  cancelBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, borderWidth: 1.5, borderColor: "#ef444430", paddingVertical: 9, backgroundColor: "#ef444408" },
  cancelText: { color: "#ef4444", fontSize: 13, fontWeight: "700" },
});

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 18 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.72)", fontSize: 11, marginTop: 2 },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  mainTabs: { flexDirection: "row", marginHorizontal: 16, marginTop: 14, borderRadius: 14, padding: 4, gap: 3 },
  mainTabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 11, paddingVertical: 9 },
  mainTabText: { fontSize: 12, fontWeight: "700" },
  catFilterBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1.5 },
  catFilterText: { fontSize: 12, fontWeight: "600" },
  empty: { marginHorizontal: 16, marginTop: 12, borderRadius: 18, borderWidth: 1, padding: 28, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: "700", textAlign: "center" },
  emptyDesc: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11, marginTop: 8 },
  emptyBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  fab: { position: "absolute", bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", shadowColor: "#db2777", shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  modalWrap: { flex: 1 },
  modalHandle: { width: 38, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 8 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  modalSub: { fontSize: 12, marginTop: 2 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  inputLabel: { fontSize: 13, fontWeight: "600" },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14 },
  textArea: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, minHeight: 90, textAlignVertical: "top" },
  catBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1.5 },
  catBtnText: { fontSize: 12, fontWeight: "600" },
  catHint: { fontSize: 11, marginTop: 2 },
  tipBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  tipText: { flex: 1, fontSize: 12, lineHeight: 18 },
  btnPrimary: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 15 },
  btnPrimaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
