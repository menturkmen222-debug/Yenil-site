import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, Platform, Modal,
  TextInput, KeyboardAvoidingView, FlatList, Alert, ActivityIndicator,
  Animated,
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
import { getUserNickname } from "@/lib/firebase";

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

  const scrollViewRef = useRef<ScrollView>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [addHyzmatOpen, setAddHyzmatOpen] = useState(false);
  const [hyzmatlar, setHyzmatlar] = useState<HyzmatItem[]>([]);
  const [hyzmatFilter, setHyzmatFilter] = useState<HyzmatCategory | "all">("all");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [nickname, setNickname] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount] = useState(2);
  const bellAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    getDeviceIdAsync().then(async (id) => {
      setDeviceId(id);
      const nick = await getUserNickname(id).catch(() => "");
      setNickname(nick);
    });
  }, []);

  const ringBell = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(bellAnim, { toValue: 1.25, duration: 80, useNativeDriver: true }),
      Animated.timing(bellAnim, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.timing(bellAnim, { toValue: 1.15, duration: 60, useNativeDriver: true }),
      Animated.timing(bellAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
    ]).start(() => setNotifOpen(true));
  };

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

  const handleScroll = (e: any) => {
    setShowScrollTop(e.nativeEvent.contentOffset.y > 320);
  };

  return (
    <View style={{ flex: 1 }}>
      <AgentChatModal visible={chatOpen} onClose={() => setChatOpen(false)} />
      <AddHyzmatModal
        visible={addHyzmatOpen}
        onClose={() => setAddHyzmatOpen(false)}
        onAdded={() => {}}
      />

      {/* ── NOTIFICATION MODAL ── */}
      <Modal visible={notifOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setNotifOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[notifStyles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 16 }]}>
            <View style={[notifStyles.handle, { backgroundColor: colors.border }]} />
            <View style={notifStyles.headerRow}>
              <Text style={[notifStyles.title, { color: colors.foreground }]}>Bildirişler</Text>
              <Pressable onPress={() => setNotifOpen(false)} style={[notifStyles.closeBtn, { backgroundColor: colors.muted }]}>
                <Ionicons name="close" size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
            {[
              { icon: "checkmark-circle", color: "#16a34a", title: "Sargyt tamamlandy", desc: "Siziň №A-4821 sargydyňyz üstünlikli ýerine ýetirildi.", time: "5 min öň" },
              { icon: "gift-outline", color: "#7c3aed", title: "Bonus pul alındı!", desc: "Hasabyňyza +5.00 BP bonus goşuldy. Hoş geldiňiz!", time: "1 sagat öň" },
            ].map((n, i) => (
              <Pressable
                key={i}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={({ pressed }) => [notifStyles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.82 : 1 }]}
              >
                <View style={[notifStyles.iconWrap, { backgroundColor: n.color + "18" }]}>
                  <Ionicons name={n.icon as any} size={22} color={n.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[notifStyles.cardTitle, { color: colors.foreground }]}>{n.title}</Text>
                  <Text style={[notifStyles.cardDesc, { color: colors.mutedForeground }]}>{n.desc}</Text>
                  <Text style={[notifStyles.cardTime, { color: colors.mutedForeground }]}>{n.time}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <ScrollView
        ref={scrollViewRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO ── */}
        <View style={[styles.hero, { backgroundColor: colors.primary, paddingTop: topPad }]}>

          {/* ── HEADER ROW: Profile | [bell + balance] ── */}
          <View style={styles.heroTopRow}>
            {/* Left: Profile avatar → settings */}
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/sozlamalar" as Href); }}
              style={styles.profileBtn}
            >
              <LinearGradient
                colors={["rgba(255,255,255,0.30)", "rgba(255,255,255,0.12)"]}
                style={styles.profileAvatar}
              >
                {nickname ? (
                  <Text style={styles.profileInitial}>{nickname.charAt(0).toUpperCase()}</Text>
                ) : (
                  <Ionicons name="person" size={19} color="#fff" />
                )}
              </LinearGradient>
              <View style={styles.profileOnlineDot} />
            </Pressable>

            {/* Right: Bell + Balance grouped */}
            <View style={styles.heroRightGroup}>
              {/* Notification bell */}
              <Pressable onPress={ringBell} style={styles.bellBtn}>
                <Animated.View style={{ transform: [{ scale: bellAnim }] }}>
                  <Ionicons name="notifications" size={20} color="#fff" />
                </Animated.View>
                {notifCount > 0 && (
                  <View style={styles.bellBadge}>
                    <Text style={styles.bellBadgeText}>{notifCount}</Text>
                  </View>
                )}
              </Pressable>

              {/* Balance pill */}
              <Pressable
                style={styles.balancePill}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/tmcell" as Href); }}
              >
                <View style={styles.balanceIconWrap}>
                  <Ionicons name="wallet" size={12} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.balanceLabelText}>Balans</Text>
                  <Text style={styles.balanceText}>{balance.toFixed(2)} BP</Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* ── AI AGENT CARD (compact) ── */}
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setChatOpen(true); }}
            style={({ pressed }) => [styles.agentCard, { opacity: pressed ? 0.92 : 1 }]}
          >
            {/* Top row: icon + name + badge + online */}
            <View style={styles.agentTopRow}>
              <View style={styles.agentAvatarSmall}>
                <MaterialCommunityIcons name="robot-outline" size={17} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.agentName}>Ýeňil AI Agent</Text>
                  <View style={styles.synagBadge}>
                    <Text style={styles.synagText}>SYNAG</Text>
                  </View>
                </View>
                <Text style={styles.agentSub}>Intellektual AI kömekçi</Text>
              </View>
              <View style={styles.onlineChip}>
                <View style={styles.onlinePulse} />
                <Text style={styles.onlineText}>Onlaýn</Text>
              </View>
            </View>

            {/* Compact action bar */}
            <View style={styles.agentActions}>
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setChatOpen(true); }}
                style={styles.chatBtn}
              >
                <Ionicons name="add-circle-outline" size={15} color="#fff" />
                <Text style={styles.chatBtnText}>Täze söhbet</Text>
              </Pressable>
              <Pressable
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                style={styles.agentIconBtn}
              >
                <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.7)" />
              </Pressable>
              <Pressable
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                style={styles.agentIconBtn}
              >
                <Ionicons name="mic-outline" size={16} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>
          </Pressable>
        </View>

        <LinearGradient
          colors={[colors.primary, colors.background] as [string, string]}
          style={{ height: 36 }}
        />

        {/* ── ÝEŇIL HYZMATLARY ── */}
        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 2 }]}>Ýeňil hyzmatlary</Text>

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
            <View style={gatnawCardStyles.circleA} />
            <View style={gatnawCardStyles.circleB} />
            <View style={gatnawCardStyles.titleRow}>
              <Text style={gatnawCardStyles.title}>Gatnaw we Ulag</Text>
              <View style={gatnawCardStyles.arrowBtn}>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </View>
            </View>
            <Text style={gatnawCardStyles.desc}>
              Döwlet, hususy we logistika — 10 kategoriýa, 28 hyzmat bir ýerde
            </Text>
            <View style={gatnawCardStyles.infoRow}>
              <Ionicons name="git-network-outline" size={12} color="rgba(255,255,255,0.62)" />
              <Text style={gatnawCardStyles.infoText}>Transport Merkezi · Howa we Demir ýol işleýär</Text>
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
            <View style={tolegCardStyles.circle1} />
            <View style={tolegCardStyles.circle2} />
            <View style={tolegCardStyles.titleRow}>
              <Text style={tolegCardStyles.title}>Tölegler we Hyzmatlar</Text>
              <View style={tolegCardStyles.arrowBtn}>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </View>
            </View>
            <Text style={tolegCardStyles.desc}>
              Kommunal, döwlet, bilim we sanly tölegler — 11 kategoriýa, bir ýerde
            </Text>
            <View style={tolegCardStyles.infoRow}>
              <Ionicons name="card-outline" size={12} color="rgba(255,255,255,0.62)" />
              <Text style={tolegCardStyles.infoText}>Töleg Merkezi · TMCell işleýär</Text>
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
            <Ionicons name="school-outline" size={26} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>E-Bilim</Text>
            <Text style={styles.bannerDesc}>Kurslar · Testler · Makalalar</Text>
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

      {showScrollTop && (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
          }}
          style={{
            position: "absolute", bottom: 100, right: 18,
            width: 46, height: 46, borderRadius: 23,
            backgroundColor: colors.primary,
            alignItems: "center", justifyContent: "center",
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35, shadowRadius: 10,
            elevation: 10,
          }}
        >
          <Ionicons name="chevron-up" size={22} color="#fff" />
        </Pressable>
      )}
    </View>
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

  hero: { paddingHorizontal: 16, paddingBottom: 20 },

  heroTopRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 14,
  },

  profileBtn: { position: "relative", width: 44, height: 44 },
  profileAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.35)",
  },
  profileInitial: { color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  profileOnlineDot: {
    position: "absolute", bottom: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: "#4ade80",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.5)",
  },

  heroRightGroup: { flexDirection: "row", alignItems: "center", gap: 8 },

  bellBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  bellBadge: {
    position: "absolute", top: -2, right: -2,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: "#ef4444",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.8)",
  },
  bellBadgeText: { color: "#fff", fontSize: 8, fontWeight: "800" },

  balancePill: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 5, elevation: 3,
  },
  balanceIconWrap: {
    width: 24, height: 24, borderRadius: 7,
    backgroundColor: "rgba(22,163,74,0.13)",
    alignItems: "center", justifyContent: "center",
  },
  balanceLabelText: { fontSize: 8, fontWeight: "700", color: "rgba(0,0,0,0.38)", letterSpacing: 0.5, textTransform: "uppercase" },
  balanceText: { color: "#111", fontWeight: "800", fontSize: 12, letterSpacing: -0.2 },

  agentCard: {
    backgroundColor: "rgba(0,0,0,0.20)", borderRadius: 16,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.13)", overflow: "hidden",
  },
  agentTopRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 },
  agentAvatarSmall: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  agentName: { color: "#fff", fontSize: 13, fontWeight: "800" },
  agentSub: { color: "rgba(255,255,255,0.6)", fontSize: 10, marginTop: 1 },
  synagBadge: { backgroundColor: "rgba(251,191,36,0.18)", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1, borderColor: "rgba(251,191,36,0.35)" },
  synagText: { color: "#fbbf24", fontSize: 7, fontWeight: "800", letterSpacing: 0.8 },
  onlineChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(74,222,128,0.15)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  onlinePulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#4ade80" },
  onlineText: { color: "#4ade80", fontSize: 9, fontWeight: "700" },
  agentActions: { flexDirection: "row", gap: 6, paddingHorizontal: 12, paddingBottom: 12 },
  chatBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 12,
  },
  chatBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  agentIconBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },

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

const notifStyles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 14 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 22, fontWeight: "800", letterSpacing: -0.4 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  card: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    borderRadius: 16, borderWidth: 1, padding: 14,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 14, fontWeight: "700", marginBottom: 3 },
  cardDesc: { fontSize: 12, lineHeight: 17 },
  cardTime: { fontSize: 11, marginTop: 4 },
});

const gatnawCardStyles = StyleSheet.create({
  outer: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  card: { borderRadius: 22, padding: 20, overflow: "hidden" },
  circleA: {
    position: "absolute", top: -40, right: -40,
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  circleB: {
    position: "absolute", bottom: -20, left: -20,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  titleRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 10,
  },
  title: { color: "#fff", fontSize: 24, fontWeight: "900", letterSpacing: -0.5, flex: 1 },
  desc: { color: "rgba(255,255,255,0.78)", fontSize: 13, lineHeight: 19, marginBottom: 14 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoText: { color: "rgba(255,255,255,0.62)", fontSize: 11, fontWeight: "600" },
  arrowBtn: {
    width: 40, height: 40, borderRadius: 12,
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
    shadowOpacity: 0.26,
    shadowRadius: 18,
    elevation: 10,
  },
  card: { borderRadius: 22, padding: 20, overflow: "hidden" },
  circle1: {
    position: "absolute", top: -50, right: -40,
    width: 170, height: 170, borderRadius: 85,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  circle2: {
    position: "absolute", bottom: -30, left: -20,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  titleRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 10,
  },
  title: { color: "#fff", fontSize: 24, fontWeight: "900", letterSpacing: -0.5, flex: 1 },
  desc: { color: "rgba(255,255,255,0.76)", fontSize: 13, lineHeight: 19, marginBottom: 14 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoText: { color: "rgba(255,255,255,0.62)", fontSize: 11, fontWeight: "600" },
  arrowBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.24)",
  },
});
