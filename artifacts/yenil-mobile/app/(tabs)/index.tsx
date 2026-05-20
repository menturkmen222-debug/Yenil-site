import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, Platform, Modal,
  TextInput, KeyboardAvoidingView, FlatList, Alert, ActivityIndicator,
} from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";
import {
  listenHyzmatlar, addHyzmat, HYZMAT_CATEGORIES,
  type HyzmatItem, type HyzmatCategory,
} from "@/lib/hyzmatlar";
import { getDeviceIdAsync } from "@/lib/deviceId";

// ══════════════════════════════════════════════════════════════════
// Service card (Ýeňil built-in services)
// ══════════════════════════════════════════════════════════════════
function ServiceCard({ icon, title, desc, onPress, color }: {
  icon: React.ReactNode; title: string; desc: string; onPress: () => void; color: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.serviceCard,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.serviceIconBg, { backgroundColor: color + "20" }]}>{icon}</View>
      <Text style={[styles.serviceTitle, { color: colors.primary }]}>{title}</Text>
      <Text style={[styles.serviceDesc, { color: colors.mutedForeground }]}>{desc}</Text>
    </Pressable>
  );
}

// ══════════════════════════════════════════════════════════════════
// AI Chat Modal
// ══════════════════════════════════════════════════════════════════
type Msg = { id: string; role: "user" | "agent"; text: string };

function AgentChatModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Msg[]>([
    { id: "0", role: "agent", text: "Salam! Men Ýeňil AI Agenti. Size nädip kömek edip bilerin? 🤖" },
  ]);
  const [input, setInput] = useState("");
  const flatRef = useRef<FlatList>(null);

  const send = () => {
    if (!input.trim()) return;
    const userMsg: Msg = { id: Date.now().toString(), role: "user", text: input.trim() };
    const agentMsg: Msg = {
      id: (Date.now() + 1).toString(),
      role: "agent",
      text: "Bu synag görnüşi. Ýakyn wagtda doly işleýän AI kömekçi bolýar! 🚀",
    };
    setMessages((prev) => [...prev, userMsg, agentMsg]);
    setInput("");
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[chatStyles.header, { backgroundColor: colors.primary, paddingTop: insets.top + 8 }]}>
          <View style={chatStyles.agentInfo}>
            <View style={chatStyles.agentAvatarWrap}>
              <MaterialCommunityIcons name="robot-outline" size={22} color="#fff" />
              <View style={chatStyles.onlineDot} />
            </View>
            <View>
              <Text style={chatStyles.agentName}>Ýeňil AI Agent</Text>
              <Text style={chatStyles.agentStatus}>Synag görnüşi · Onlaýn</Text>
            </View>
          </View>
          <Pressable style={chatStyles.headerBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color="rgba(255,255,255,0.85)" />
          </Pressable>
        </View>
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => (
            <View
              style={[
                chatStyles.bubble,
                item.role === "user" ? chatStyles.bubbleUser : chatStyles.bubbleAgent,
                item.role === "user"
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
              ]}
            >
              {item.role === "agent" && (
                <View style={[chatStyles.agentBubbleIcon, { backgroundColor: colors.primary + "22" }]}>
                  <MaterialCommunityIcons name="robot-outline" size={14} color={colors.primary} />
                </View>
              )}
              <Text style={[chatStyles.bubbleText, { color: item.role === "user" ? "#fff" : colors.foreground }]}>
                {item.text}
              </Text>
            </View>
          )}
        />
        <View style={[chatStyles.inputRow, { borderTopColor: colors.border, backgroundColor: colors.background, paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Soragyňyzy ýazyň..."
            placeholderTextColor={colors.mutedForeground}
            style={[chatStyles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <Pressable
            onPress={send}
            style={[chatStyles.sendBtn, { backgroundColor: input.trim() ? colors.primary : colors.border }]}
          >
            <Ionicons name="send" size={16} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════
// Add Hyzmat (Service) Modal
// ══════════════════════════════════════════════════════════════════
function AddHyzmatModal({
  visible, onClose, onAdded,
}: {
  visible: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [ownerName, setOwnerName] = useState("");
  const [title, setTitle]         = useState("");
  const [description, setDesc]    = useState("");
  const [category, setCategory]   = useState<HyzmatCategory>("transport");
  const [phone, setPhone]         = useState("");
  const [location, setLocation]   = useState("");
  const [price, setPrice]         = useState("");
  const [saving, setSaving]       = useState(false);

  const reset = () => {
    setOwnerName(""); setTitle(""); setDesc(""); setCategory("transport");
    setPhone(""); setLocation(""); setPrice("");
  };

  const handleAdd = async () => {
    if (!title.trim() || !phone.trim()) {
      Alert.alert("Ýalňyşlyk", "Hyzmat ady we telefon belgisi hökmany!");
      return;
    }
    setSaving(true);
    try {
      await addHyzmat({
        ownerName: ownerName.trim() || "Bilinmeýän",
        title: title.trim(),
        description: description.trim(),
        category,
        phone: phone.trim(),
        location: location.trim(),
        price: price.trim(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      reset();
      onAdded();
      onClose();
    } catch {
      Alert.alert("Ýalňyşlyk", "Hyzmat goşup bolmady. Gaýtadan synanyşyň.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={[addStyles.header, { backgroundColor: colors.background, paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
          <View style={[addStyles.handle, { backgroundColor: colors.border }]} />
          <View style={addStyles.headerRow}>
            <View>
              <Text style={[addStyles.headerTitle, { color: colors.foreground }]}>Hyzmat goş</Text>
              <Text style={[addStyles.headerSub, { color: colors.mutedForeground }]}>
                Özüňiziň hyzmatyňyzy goşuň
              </Text>
            </View>
            <Pressable onPress={onClose} style={[addStyles.closeBtn, { backgroundColor: colors.muted }]}>
              <Ionicons name="close" size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[addStyles.body, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Category picker */}
          <Text style={[addStyles.label, { color: colors.foreground }]}>Kategoriýa *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", gap: 8, paddingVertical: 4 }}>
              {HYZMAT_CATEGORIES.map((cat) => {
                const isActive = category === cat.key;
                return (
                  <Pressable
                    key={cat.key}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCategory(cat.key); }}
                    style={[
                      addStyles.catChip,
                      {
                        backgroundColor: isActive ? cat.color : colors.muted,
                        borderColor: isActive ? cat.color : colors.border,
                      },
                    ]}
                  >
                    <Text style={addStyles.catEmoji}>{cat.emoji}</Text>
                    <Text style={[addStyles.catLabel, { color: isActive ? "#fff" : colors.foreground }]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Owner name */}
          <Text style={[addStyles.label, { color: colors.foreground }]}>Adyňyz</Text>
          <TextInput
            value={ownerName}
            onChangeText={setOwnerName}
            placeholder="Mysal: Atamyrat Ussaýew"
            placeholderTextColor={colors.mutedForeground}
            style={[addStyles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          />

          {/* Title */}
          <Text style={[addStyles.label, { color: colors.foreground }]}>Hyzmat ady *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Mysal: Aşgabat–Mary awtobus"
            placeholderTextColor={colors.mutedForeground}
            style={[addStyles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          />

          {/* Description */}
          <Text style={[addStyles.label, { color: colors.foreground }]}>Beýany</Text>
          <TextInput
            value={description}
            onChangeText={setDesc}
            placeholder="Hyzmatyňyz hakynda has köp maglumat beriň..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
            style={[addStyles.input, addStyles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          />

          {/* Phone */}
          <Text style={[addStyles.label, { color: colors.foreground }]}>Telefon belgisi *</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+993 XX XXXXXX"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="phone-pad"
            style={[addStyles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          />

          {/* Location */}
          <Text style={[addStyles.label, { color: colors.foreground }]}>Ýerleşýän ýeri</Text>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Mysal: Aşgabat, Büzmeýin"
            placeholderTextColor={colors.mutedForeground}
            style={[addStyles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          />

          {/* Price */}
          <Text style={[addStyles.label, { color: colors.foreground }]}>Bahasy</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder="Mysal: 20 TMT ýa-da Ylalaşyk"
            placeholderTextColor={colors.mutedForeground}
            style={[addStyles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          />

          {/* Submit */}
          <Pressable
            onPress={handleAdd}
            disabled={saving}
            style={({ pressed }) => [
              addStyles.submitBtn,
              { backgroundColor: colors.primary, opacity: pressed || saving ? 0.85 : 1 },
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={addStyles.submitText}>Hyzmat goş</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════
// Community Hyzmat Card
// ══════════════════════════════════════════════════════════════════
function HyzmatCard({ item }: { item: HyzmatItem }) {
  const colors = useColors();
  const cat = HYZMAT_CATEGORIES.find((c) => c.key === item.category) ?? HYZMAT_CATEGORIES[7];

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert(
          item.title,
          `${item.description || "Beýany ýok"}\n\n📍 ${item.location || "Ýer görkezilmedi"}\n💰 ${item.price || "Ylalaşyk"}\n📞 ${item.phone}`,
          [
            { text: "Ýap" },
            { text: "Jaň et", onPress: () => {} },
          ]
        );
      }}
      style={({ pressed }) => [
        hStyles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      {/* Category badge + emoji */}
      <LinearGradient
        colors={[cat.color + "cc", cat.color] as [string, string]}
        style={hStyles.cardTop}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={hStyles.cardEmoji}>{cat.emoji}</Text>
        <View style={hStyles.catBadge}>
          <Text style={hStyles.catBadgeText}>{cat.label}</Text>
        </View>
        {item.price ? (
          <View style={hStyles.priceBadge}>
            <Text style={hStyles.priceBadgeText}>{item.price}</Text>
          </View>
        ) : null}
      </LinearGradient>

      {/* Info */}
      <View style={hStyles.cardBody}>
        <Text style={[hStyles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
          {item.title}
        </Text>
        {item.description ? (
          <Text style={[hStyles.cardDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        {/* Footer */}
        <View style={hStyles.cardFooter}>
          <View style={hStyles.cardMeta}>
            {item.location ? (
              <View style={hStyles.metaRow}>
                <Ionicons name="location-outline" size={11} color={colors.mutedForeground} />
                <Text style={[hStyles.metaText, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {item.location}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={[hStyles.callBtn, { backgroundColor: cat.color + "18" }]}>
            <Ionicons name="call-outline" size={13} color={cat.color} />
            <Text style={[hStyles.callText, { color: cat.color }]}>Jaň</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ══════════════════════════════════════════════════════════════════
// Home Screen
// ══════════════════════════════════════════════════════════════════
export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { balance } = useBonusPul();
  const isWeb = Platform.OS === "web";

  const [chatOpen, setChatOpen] = useState(false);
  const [addHyzmatOpen, setAddHyzmatOpen] = useState(false);
  const [hyzmatlar, setHyzmatlar] = useState<HyzmatItem[]>([]);
  const [hyzmatFilter, setHyzmatFilter] = useState<HyzmatCategory | "all">("all");

  // Listen to community services in real-time
  useEffect(() => {
    const unsub = listenHyzmatlar(setHyzmatlar);
    return () => unsub();
  }, []);

  const nav = (path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as Href);
  };

  const topPad = (isWeb ? 0 : insets.top) + 20;

  const filteredHyzmatlar =
    hyzmatFilter === "all"
      ? hyzmatlar
      : hyzmatlar.filter((h) => h.category === hyzmatFilter);

  return (
    <>
      <AgentChatModal visible={chatOpen} onClose={() => setChatOpen(false)} />
      <AddHyzmatModal
        visible={addHyzmatOpen}
        onClose={() => setAddHyzmatOpen(false)}
        onAdded={() => {}}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO + AI AGENT ── */}
        <View style={[styles.hero, { backgroundColor: colors.primary, paddingTop: topPad }]}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroTitle}>Ýeňil</Text>
              <Text style={styles.heroSub}>Türkmenistanda iň ynamly onlayn hyzmatlar</Text>
            </View>
            <Pressable
              style={styles.balancePill}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <Ionicons name="wallet-outline" size={14} color="#fff" />
              <Text style={styles.balanceText}>{balance.toFixed(2)} BP</Text>
            </Pressable>
          </View>

          {/* AI Agent Card */}
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setChatOpen(true); }}
            style={({ pressed }) => [styles.agentCard, { opacity: pressed ? 0.92 : 1 }]}
          >
            <View style={styles.agentTopRow}>
              <View style={styles.agentAvatarOuter}>
                <View style={styles.agentAvatar}>
                  <MaterialCommunityIcons name="robot-outline" size={22} color={colors.primary} />
                </View>
                <View style={styles.agentOnlineDot} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                  <Text style={styles.agentName}>Ýeňil AI Agent</Text>
                  <View style={styles.synagBadge}>
                    <Text style={styles.synagText}>SYNAG</Text>
                  </View>
                </View>
                <Text style={styles.agentSub}>Intellektual AI kömekçi</Text>
              </View>
              <View style={styles.onlineRow}>
                <View style={styles.onlinePulse} />
                <Text style={styles.onlineText}>Onlaýn</Text>
              </View>
            </View>
            <View style={styles.agentDivider} />
            <View style={styles.agentActions}>
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setChatOpen(true); }}
                style={styles.chatBtn}
              >
                <Ionicons name="add-circle-outline" size={17} color="#fff" />
                <Text style={styles.chatBtnText}>Täze söhbet</Text>
              </Pressable>
              <Pressable
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                style={styles.agentIconBtn}
              >
                <Ionicons name="time-outline" size={18} color="rgba(255,255,255,0.7)" />
              </Pressable>
              <Pressable
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                style={styles.agentIconBtn}
              >
                <Ionicons name="mic-outline" size={18} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>
          </Pressable>
        </View>

        {/* ── ÝEŇIL HYZMATLARY ── */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Ýeňil hyzmatlary</Text>

        {/* ── GATNAW WE ULAG — Premium Transport Card ── */}
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); nav("/gatnaw"); }}
          style={({ pressed }) => [gatnawCardStyles.outer, { opacity: pressed ? 0.93 : 1 }]}
        >
          <LinearGradient
            colors={[colors.headerGradientStart, colors.headerGradientEnd] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={gatnawCardStyles.card}
          >
            <View style={gatnawCardStyles.patternOverlay} />
            <View style={gatnawCardStyles.topRow}>
              <View style={gatnawCardStyles.iconWrap}>
                <Ionicons name="git-network-outline" size={26} color="#fff" />
              </View>
              <View style={gatnawCardStyles.activeChip}>
                <View style={gatnawCardStyles.activePulse} />
                <Text style={gatnawCardStyles.activeChipText}>Howa · Demir ýol işleýär</Text>
              </View>
            </View>
            <Text style={gatnawCardStyles.title}>Gatnaw we Ulag</Text>
            <Text style={gatnawCardStyles.desc}>
              Döwlet, hususy we logistika — 10 kategoriýa, 28 hyzmat bir ýerde
            </Text>
            <View style={gatnawCardStyles.bottomRow}>
              <View style={gatnawCardStyles.statsRow}>
                {[{ n: "10", l: "Kat." }, { n: "28", l: "Hyzmat" }, { n: "2", l: "Işleýär" }].map((s, i) => (
                  <View key={i} style={gatnawCardStyles.statItem}>
                    <Text style={gatnawCardStyles.statNum}>{s.n}</Text>
                    <Text style={gatnawCardStyles.statLbl}>{s.l}</Text>
                  </View>
                ))}
              </View>
              <View style={gatnawCardStyles.arrowBtn}>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </View>
            </View>
          </LinearGradient>
        </Pressable>

        {/* ── TÖLEGLER WE HYZMATLAR — Premium Payment Card ── */}
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); nav("/toleglar"); }}
          style={({ pressed }) => [tolegCardStyles.outer, { opacity: pressed ? 0.93 : 1 }]}
        >
          <LinearGradient
            colors={["#4c1d95", "#7c3aed", "#a855f7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={tolegCardStyles.card}
          >
            {/* Decorative circles */}
            <View style={tolegCardStyles.circle1} />
            <View style={tolegCardStyles.circle2} />

            {/* Top row */}
            <View style={tolegCardStyles.topRow}>
              <View style={tolegCardStyles.iconWrap}>
                <Ionicons name="card-outline" size={26} color="#fff" />
              </View>
              <View style={tolegCardStyles.comingChip}>
                <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.85)" />
                <Text style={tolegCardStyles.comingChipText}>TMCell işleýär</Text>
              </View>
            </View>

            {/* Title */}
            <Text style={tolegCardStyles.title}>Tölegler we Hyzmatlar</Text>
            <Text style={tolegCardStyles.desc}>
              Kommunal, döwlet, bilim we sanly tölegler — 11 kategoriýa, bir ýerde
            </Text>

            {/* Stats + arrow */}
            <View style={tolegCardStyles.bottomRow}>
              <View style={tolegCardStyles.statsRow}>
                {[{ n: "11", l: "Kat." }, { n: "35+", l: "Hyzmat" }, { n: "Ýakynda", l: "" }].map((s, i) => (
                  <View key={i} style={tolegCardStyles.statItem}>
                    <Text style={tolegCardStyles.statNum}>{s.n}</Text>
                    {s.l ? <Text style={tolegCardStyles.statLbl}>{s.l}</Text> : null}
                  </View>
                ))}
              </View>
              <View style={tolegCardStyles.arrowBtn}>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </View>
            </View>
          </LinearGradient>
        </Pressable>

        {/* ── OTHER SERVICES GRID ── */}
        <View style={styles.servicesGrid}>
          <ServiceCard
            icon={<MaterialCommunityIcons name="currency-usd" size={28} color="#0ea5e9" />}
            title="Ýeňil Pay" desc="Walýuta çalyşmak"
            onPress={() => nav("/tmcell")} color="#0ea5e9"
          />
          <ServiceCard
            icon={<MaterialCommunityIcons name="bullhorn-outline" size={28} color="#e11d48" />}
            title="SMM & Dizaýn" desc="Marketing, Reklama, Designer"
            onPress={() => nav("/smm")} color="#e11d48"
          />
        </View>

        {/* E-KITAP BANNER */}
        <Pressable
          onPress={() => nav("/ekitap")}
          style={({ pressed }) => [styles.banner, { opacity: pressed ? 0.9 : 1, backgroundColor: "#6366f1" }]}
        >
          <View style={[styles.bannerIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Ionicons name="book-outline" size={26} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>E-kitap & Gollanmalar</Text>
            <Text style={styles.bannerDesc}>Okap öwren · 6 kitap elýeterli</Text>
          </View>
          <Feather name="arrow-right" size={20} color="#fff" />
        </Pressable>

        {/* SANLY BAZAR BANNER */}
        <Pressable
          onPress={() => nav("/bazar")}
          style={({ pressed }) => [
            styles.banner,
            { opacity: pressed ? 0.9 : 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
          ]}
        >
          <View style={[styles.bannerIcon, { backgroundColor: colors.primary + "20" }]}>
            <Ionicons name="storefront-outline" size={26} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: colors.foreground }]}>Sanly bazar</Text>
            <Text style={[styles.bannerDesc, { color: colors.mutedForeground }]}>Akkauntlar we sanly harytlar</Text>
          </View>
          <Feather name="arrow-right" size={20} color={colors.primary} />
        </Pressable>

        {/* ══════════════════════════════════════════════════
            HYZMATLAR MARKETPLACE
        ══════════════════════════════════════════════════ */}
        <View style={styles.hyzmatHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginLeft: 0, marginTop: 0 }]}>
              Halk hyzmatlary
            </Text>
            <Text style={[styles.hyzmatSubTitle, { color: colors.mutedForeground }]}>
              Ulag · Usta · Gözellik · Nahar we has köp
            </Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setAddHyzmatOpen(true);
            }}
            style={[styles.addHyzmatBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addHyzmatBtnText}>Goş</Text>
          </Pressable>
        </View>

        {/* Category filter for marketplace */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.hyzmatFilterScroll}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 4 }}
        >
          {[{ key: "all" as const, label: "Hemmesi", emoji: "✨", color: "#6366f1" }, ...HYZMAT_CATEGORIES].map((cat) => {
            const isActive = hyzmatFilter === cat.key;
            return (
              <Pressable
                key={cat.key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setHyzmatFilter(cat.key as any);
                }}
                style={[
                  styles.hyzmatFilterChip,
                  {
                    backgroundColor: isActive ? cat.color : colors.muted,
                    borderColor: isActive ? cat.color : colors.border,
                  },
                ]}
              >
                <Text style={styles.hyzmatFilterEmoji}>{cat.emoji}</Text>
                <Text style={[styles.hyzmatFilterLabel, { color: isActive ? "#fff" : colors.foreground }]}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Service listing */}
        {filteredHyzmatlar.length === 0 ? (
          <View style={[styles.hyzmatEmpty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.hyzmatEmptyEmoji}>🏪</Text>
            <Text style={[styles.hyzmatEmptyTitle, { color: colors.foreground }]}>
              Heniz hyzmat ýok
            </Text>
            <Text style={[styles.hyzmatEmptyDesc, { color: colors.mutedForeground }]}>
              Ilkinji bolup özüňiziň hyzmatyňyzy goşuň!
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setAddHyzmatOpen(true);
              }}
              style={[styles.hyzmatEmptyBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="add-circle-outline" size={16} color="#fff" />
              <Text style={styles.hyzmatEmptyBtnText}>Hyzmat goş</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingVertical: 4 }}
          >
            {filteredHyzmatlar.map((item) => (
              <HyzmatCard key={item.id} item={item} />
            ))}
            {/* "Goş" card at the end */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setAddHyzmatOpen(true);
              }}
              style={[styles.addCard, { backgroundColor: colors.muted, borderColor: colors.border }]}
            >
              <View style={[styles.addCardIcon, { backgroundColor: colors.primary + "18" }]}>
                <Ionicons name="add" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.addCardText, { color: colors.primary }]}>Hyzmat{"\n"}goş</Text>
            </Pressable>
          </ScrollView>
        )}
      </ScrollView>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
// Styles
// ══════════════════════════════════════════════════════════════════
const chatStyles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  agentInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  agentAvatarWrap: { position: "relative" },
  onlineDot: { position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: "#4ade80", borderWidth: 2, borderColor: "#fff" },
  agentName: { color: "#fff", fontWeight: "800", fontSize: 16 },
  agentStatus: { color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 1 },
  headerBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  bubble: { maxWidth: "80%", borderRadius: 18, padding: 12, flexDirection: "row", alignItems: "flex-start", gap: 8 },
  bubbleUser: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  bubbleAgent: { alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  agentBubbleIcon: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", marginTop: 1 },
  bubbleText: { fontSize: 14, lineHeight: 20, flex: 1 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, borderWidth: 1 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
});

const addStyles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 14 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  headerTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.4 },
  headerSub: { fontSize: 13, marginTop: 3 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  body: { padding: 20 },
  label: { fontSize: 13, fontWeight: "700", marginBottom: 8, marginTop: 14 },
  input: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, borderWidth: 1 },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  catChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  catEmoji: { fontSize: 16 },
  catLabel: { fontSize: 12, fontWeight: "600" },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 16, paddingVertical: 16, marginTop: 24 },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});

const hStyles = StyleSheet.create({
  card: { width: 200, borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  cardTop: { height: 110, padding: 12, justifyContent: "space-between" },
  cardEmoji: { fontSize: 36 },
  catBadge: { position: "absolute", top: 10, right: 10, backgroundColor: "rgba(0,0,0,0.25)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  catBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  priceBadge: { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.25)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  priceBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  cardBody: { padding: 12 },
  cardTitle: { fontSize: 14, fontWeight: "800", marginBottom: 4, lineHeight: 18 },
  cardDesc: { fontSize: 12, lineHeight: 16, marginBottom: 10 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardMeta: { flex: 1 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 10, flex: 1 },
  callBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  callText: { fontSize: 12, fontWeight: "700" },
});

const styles = StyleSheet.create({
  container: { flex: 1 },

  hero: { paddingHorizontal: 18, paddingBottom: 24 },
  heroTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 },
  heroTitle: { fontSize: 34, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  heroSub: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 3 },
  balancePill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.18)", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 50, marginTop: 4 },
  balanceText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  agentCard: { backgroundColor: "rgba(0,0,0,0.22)", borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", overflow: "hidden" },
  agentTopRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  agentAvatarOuter: { position: "relative" },
  agentAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center" },
  agentOnlineDot: { position: "absolute", bottom: 1, right: 1, width: 11, height: 11, borderRadius: 6, backgroundColor: "#4ade80", borderWidth: 2, borderColor: "rgba(0,0,0,0.3)" },
  agentName: { color: "#fff", fontSize: 15, fontWeight: "800" },
  agentSub: { color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 2 },
  synagBadge: { backgroundColor: "rgba(251,191,36,0.2)", borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: "rgba(251,191,36,0.4)" },
  synagText: { color: "#fbbf24", fontSize: 8, fontWeight: "800", letterSpacing: 0.8 },
  onlineRow: { alignItems: "center", gap: 3 },
  onlinePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4ade80" },
  onlineText: { color: "#4ade80", fontSize: 9, fontWeight: "700" },
  agentDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginHorizontal: 14 },
  agentActions: { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingBottom: 14, paddingTop: 12 },
  chatBtn: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14 },
  chatBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  agentIconBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },

  sectionTitle: { fontSize: 17, fontWeight: "700", marginLeft: 16, marginTop: 22, marginBottom: 12 },
  servicesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16, marginBottom: 16 },
  serviceCard: { width: "47%", borderRadius: 16, padding: 16, borderWidth: 1, gap: 8 },
  serviceIconBg: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  serviceTitle: { fontSize: 14, fontWeight: "700" },
  serviceDesc: { fontSize: 12 },

  banner: { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 14 },
  bannerIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  bannerTitle: { color: "#fff", fontWeight: "700", fontSize: 15 },
  bannerDesc: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 },

  // Halk hyzmatlary section
  hyzmatHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 16, marginTop: 24, marginBottom: 6 },
  hyzmatSubTitle: { fontSize: 12, marginTop: 2 },
  addHyzmatBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, marginTop: 2 },
  addHyzmatBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  hyzmatFilterScroll: { marginBottom: 10 },
  hyzmatFilterChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  hyzmatFilterEmoji: { fontSize: 14 },
  hyzmatFilterLabel: { fontSize: 12, fontWeight: "600" },

  hyzmatEmpty: { marginHorizontal: 16, borderRadius: 20, borderWidth: 1, padding: 32, alignItems: "center", marginBottom: 8 },
  hyzmatEmptyEmoji: { fontSize: 48, marginBottom: 12 },
  hyzmatEmptyTitle: { fontSize: 17, fontWeight: "800", marginBottom: 6 },
  hyzmatEmptyDesc: { fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 16 },
  hyzmatEmptyBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16 },
  hyzmatEmptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  addCard: { width: 120, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 16 },
  addCardIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  addCardText: { fontSize: 13, fontWeight: "700", textAlign: "center" },
});

const gatnawCardStyles = StyleSheet.create({
  outer: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    borderRadius: 22,
    padding: 20,
    overflow: "hidden",
  },
  patternOverlay: {
    position: "absolute",
    top: -30, right: -30,
    width: 160, height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  iconWrap: {
    width: 50, height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  activeChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 50, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  activePulse: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: "#4ade80",
  },
  activeChipText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 11, fontWeight: "700",
  },
  title: {
    color: "#fff",
    fontSize: 26, fontWeight: "900",
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  desc: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13, lineHeight: 19,
    marginBottom: 20,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statsRow: {
    flexDirection: "row", gap: 8,
  },
  statItem: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
  },
  statNum: {
    color: "#fff", fontSize: 17, fontWeight: "900", letterSpacing: -0.4,
  },
  statLbl: {
    color: "rgba(255,255,255,0.7)", fontSize: 9, fontWeight: "600", marginTop: 1,
  },
  arrowBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
});

const tolegCardStyles = StyleSheet.create({
  outer: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 22,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 10,
  },
  card: {
    borderRadius: 22,
    padding: 20,
    overflow: "hidden",
  },
  circle1: {
    position: "absolute",
    top: -50, right: -40,
    width: 170, height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  circle2: {
    position: "absolute",
    bottom: -30, left: -20,
    width: 120, height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  iconWrap: {
    width: 50, height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.22)",
  },
  comingChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 50, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  comingChipText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11, fontWeight: "700",
  },
  title: {
    color: "#fff",
    fontSize: 26, fontWeight: "900",
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  desc: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 13, lineHeight: 19,
    marginBottom: 20,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statsRow: { flexDirection: "row", gap: 8 },
  statItem: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
  },
  statNum: { color: "#fff", fontSize: 15, fontWeight: "900", letterSpacing: -0.3 },
  statLbl: { color: "rgba(255,255,255,0.7)", fontSize: 9, fontWeight: "600", marginTop: 1 },
  arrowBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.24)",
  },
});
