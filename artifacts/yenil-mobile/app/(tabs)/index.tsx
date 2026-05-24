import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, Platform, Modal,
  TextInput, KeyboardAvoidingView, FlatList, Alert,
  Animated, Linking,
} from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PessimisticButton } from "@/components/PessimisticButton";
import { RipplePress } from "@/components/RipplePress";
import {
  listenHyzmatlar, addHyzmat, HYZMAT_CATEGORIES,
  type HyzmatItem, type HyzmatCategory,
} from "@/lib/hyzmatlar";
import { getDeviceIdAsync } from "@/lib/deviceId";
import { getUserNickname, watchCompletedLessons } from "@/lib/firebase";
import { CATEGORIES, LESSONS } from "@/lib/ebilimData";

function formatNotifTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Az öň";
  if (mins < 60) return `${mins} min öň`;
  if (hours < 24) return `${hours} sag öň`;
  return `${days} gün öň`;
}

// ══════════════════════════════════════════════════════════════════
// Service card (Ýeňil built-in services)
// ══════════════════════════════════════════════════════════════════
function ServiceCard({ icon, title, desc, onPress, color }: {
  icon: React.ReactNode; title: string; desc: string; onPress: () => void; color: string;
}) {
  const colors = useColors();
  return (
    <RipplePress
      onPress={onPress}
      style={[styles.serviceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      borderRadius={20}
      rippleSize={120}
    >
      <View style={[styles.serviceIconBg, { backgroundColor: color + "20" }]}>{icon}</View>
      <Text style={[styles.serviceTitle, { color: colors.primary }]}>{title}</Text>
      <Text style={[styles.serviceDesc, { color: colors.mutedForeground }]}>{desc}</Text>
    </RipplePress>
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
    { id: "0", role: "agent", text: "Salam! Men Ýeňil AI Agenti. Size nädip kömek edip bilerin?" },
  ]);
  const [input, setInput] = useState("");
  const flatRef = useRef<FlatList>(null);

  const send = () => {
    if (!input.trim()) return;
    const userMsg: Msg = { id: Date.now().toString(), role: "user", text: input.trim() };
    const agentMsg: Msg = {
      id: (Date.now() + 1).toString(),
      role: "agent",
      text: "Bu synag görnüşi. Ýakyn wagtda doly işleýän AI kömekçi bolýar!",
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
                    <Ionicons name={cat.icon as any} size={13} color={isActive ? "#fff" : cat.color} />
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
          <PessimisticButton
            label="Hyzmat goş"
            loadingLabel="Goşulýar..."
            loading={saving}
            disabled={saving}
            onPress={handleAdd}
            color={colors.primary}
            size="lg"
            icon={<Ionicons name="checkmark-circle-outline" size={20} color="#fff" />}
          />
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

  const handleCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`tel:${item.phone}`).catch(() =>
      Alert.alert("Jaň etmek mümkin däl", item.phone)
    );
  };

  return (
    <RipplePress
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert(
          item.title,
          `${item.description || "Beýany ýok"}\n\nÝer: ${item.location || "Ýer görkezilmedi"}\nBaha: ${item.price || "Ylalaşyk"}\nTelefon: ${item.phone}`,
          [
            { text: "Ýap" },
            { text: "Jaň et", onPress: handleCall },
          ]
        );
      }}
      style={[hStyles.card, { backgroundColor: colors.card, borderColor: cat.color + "33" }]}
      borderRadius={16}
      rippleColor={cat.color}
    >
      {/* Left accent bar */}
      <View style={[hStyles.accentBar, { backgroundColor: cat.color }]} />

      {/* Icon */}
      <View style={[hStyles.iconWrap, { backgroundColor: cat.color + "18" }]}>
        <Ionicons name={cat.icon as any} size={24} color={cat.color} />
      </View>

      {/* Content */}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <Text style={[hStyles.cardTitle, { color: colors.foreground, flex: 1 }]} numberOfLines={1}>
            {item.title}
          </Text>
          {item.price ? (
            <View style={[hStyles.pricePill, { backgroundColor: "#10b98118" }]}>
              <Text style={{ color: "#10b981", fontSize: 11, fontWeight: "800" }}>{item.price}</Text>
            </View>
          ) : null}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
          <View style={[hStyles.catPill, { backgroundColor: cat.color + "18" }]}>
            <Text style={{ color: cat.color, fontSize: 10, fontWeight: "700" }}>{cat.label}</Text>
          </View>
          {item.location ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
              <Ionicons name="location-outline" size={10} color={colors.mutedForeground} />
              <Text style={{ color: colors.mutedForeground, fontSize: 10 }} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
          ) : null}
        </View>

        {item.description ? (
          <Text style={[hStyles.cardDesc, { color: colors.mutedForeground, marginTop: 4 }]} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </View>

      {/* Call button */}
      <Pressable
        onPress={handleCall}
        style={({ pressed }) => [hStyles.callBtn, { backgroundColor: cat.color, opacity: pressed ? 0.8 : 1 }]}
      >
        <Ionicons name="call" size={16} color="#fff" />
      </Pressable>
    </RipplePress>
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

  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
  const { t } = useLanguage();

  const scrollViewRef = useRef<ScrollView>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [addHyzmatOpen, setAddHyzmatOpen] = useState(false);
  const [hyzmatlar, setHyzmatlar] = useState<HyzmatItem[]>([]);
  const [hyzmatFilter, setHyzmatFilter] = useState<HyzmatCategory | "all">("all");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [nickname, setNickname] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [hyzmatSearch, setHyzmatSearch] = useState("");
  const [eBilimCompleted, setEBilimCompleted] = useState<number>(0);
  const bellAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    getDeviceIdAsync().then(async (id) => {
      setDeviceId(id);
      const nick = await getUserNickname(id).catch(() => "");
      setNickname(nick);
    });
  }, []);

  useEffect(() => {
    if (!deviceId) return;
    const unsub = watchCompletedLessons(deviceId, ids => setEBilimCompleted(ids.length));
    return () => unsub();
  }, [deviceId]);

  const ringBell = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(bellAnim, { toValue: 1.25, duration: 80, useNativeDriver: true }),
      Animated.timing(bellAnim, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.timing(bellAnim, { toValue: 1.15, duration: 60, useNativeDriver: true }),
      Animated.timing(bellAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
    ]).start(() => {
      setNotifOpen(true);
      markAllRead();
    });
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

  const filteredHyzmatlar = hyzmatlar.filter((h) => {
    const matchCat = hyzmatFilter === "all" || h.category === hyzmatFilter;
    const s = hyzmatSearch.toLowerCase();
    const matchS =
      !s ||
      h.title.toLowerCase().includes(s) ||
      (h.description || "").toLowerCase().includes(s) ||
      (h.location || "").toLowerCase().includes(s);
    return matchCat && matchS;
  });

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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={[notifStyles.title, { color: colors.foreground }]}>{t("notifications")}</Text>
                {unreadCount > 0 && (
                  <View style={[notifStyles.badge, { backgroundColor: colors.primary }]}>
                    <Text style={notifStyles.badgeText}>{unreadCount}</Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {notifications.some((n) => !n.read) && (
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); markAllRead(); }}
                    style={[notifStyles.markReadBtn, { backgroundColor: colors.primary + "15" }]}
                  >
                    <Text style={[notifStyles.markReadText, { color: colors.primary }]}>{t("notif_mark_read")}</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => setNotifOpen(false)} style={[notifStyles.closeBtn, { backgroundColor: colors.muted }]}>
                  <Ionicons name="close" size={18} color={colors.mutedForeground} />
                </Pressable>
              </View>
            </View>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
            {notifications.length === 0 ? (
              <View style={[notifStyles.emptyWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="notifications-off-outline" size={40} color={colors.mutedForeground} />
                <Text style={[notifStyles.emptyTitle, { color: colors.foreground }]}>{t("notif_no_items")}</Text>
                <Text style={[notifStyles.emptyDesc, { color: colors.mutedForeground }]}>{t("notif_no_items_desc")}</Text>
              </View>
            ) : (
              notifications.map((n) => {
                const iconMap: Record<string, { icon: string; color: string }> = {
                  order: { icon: "checkmark-circle", color: "#16a34a" },
                  bp: { icon: "gift-outline", color: "#7c3aed" },
                  system: { icon: "information-circle-outline", color: "#0ea5e9" },
                  promo: { icon: "megaphone-outline", color: "#f59e0b" },
                };
                const meta = iconMap[n.type ?? "system"] ?? iconMap.system;
                const iconColor = n.iconColor ?? meta.color;
                const iconName = n.icon ?? meta.icon;
                return (
                  <Pressable
                    key={n.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      markRead(n.id);
                    }}
                    style={({ pressed }) => [
                      notifStyles.card,
                      {
                        backgroundColor: n.read ? colors.card : colors.primary + "08",
                        borderColor: n.read ? colors.border : colors.primary + "40",
                        opacity: pressed ? 0.82 : 1,
                      },
                    ]}
                  >
                    <View style={[notifStyles.iconWrap, { backgroundColor: iconColor + "18" }]}>
                      <Ionicons name={iconName as any} size={22} color={iconColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={[notifStyles.cardTitle, { color: colors.foreground, flex: 1 }]}>{n.title}</Text>
                        {!n.read && (
                          <View style={[notifStyles.unreadDot, { backgroundColor: colors.primary }]} />
                        )}
                      </View>
                      <Text style={[notifStyles.cardDesc, { color: colors.mutedForeground }]}>{n.body}</Text>
                      <Text style={[notifStyles.cardTime, { color: colors.mutedForeground }]}>{formatNotifTime(n.timestamp)}</Text>
                    </View>
                  </Pressable>
                );
              })
            )}
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
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/profile" as Href); }}
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
                {unreadCount > 0 && (
                  <View style={styles.bellBadge}>
                    <Text style={styles.bellBadgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
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

        {/* ── E-BILIM PREMIUM SECTION ── */}
        <View style={eb.sectionHead}>
          <View style={{ flex: 1 }}>
            <Text style={[eb.sectionTitle, { color: colors.foreground }]}>E-Bilim Ekosistemi</Text>
            <Text style={[eb.sectionSub, { color: colors.mutedForeground }]}>O'qi, test ber, BP gazan</Text>
          </View>
          <Pressable
            onPress={() => nav("/e-bilim")}
            style={[eb.seeAllBtn, { backgroundColor: "#6366f1" + "18", borderColor: "#6366f1" + "40" }]}
          >
            <Text style={eb.seeAllText}>Barchasi</Text>
            <Ionicons name="arrow-forward" size={12} color="#6366f1" />
          </Pressable>
        </View>

        <Pressable
          onPress={() => nav("/e-bilim")}
          style={({ pressed }) => [
            styles.banner,
            { opacity: pressed ? 0.9 : 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
          ]}
        >
          <View style={[styles.bannerIcon, { backgroundColor: "#6366f1" + "20" }]}>
            <Ionicons name="school-outline" size={26} color="#6366f1" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: colors.foreground }]}>E-Bilim</Text>
            <Text style={[styles.bannerDesc, { color: colors.mutedForeground }]}>O'qi, test ber, BP gazan</Text>
          </View>
          <Feather name="arrow-right" size={20} color="#6366f1" />
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
            HALK HYZMATLARY MARKETPLACE
        ══════════════════════════════════════════════════ */}

        {/* Section header */}
        <View style={mktStyles.sectionHead}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={[mktStyles.sectionIcon, { backgroundColor: "#6366f118" }]}>
              <Ionicons name="storefront-outline" size={18} color="#6366f1" />
            </View>
            <View>
              <Text style={[mktStyles.sectionTitle, { color: colors.foreground }]}>Halk hyzmatlary</Text>
              <Text style={[mktStyles.sectionSub, { color: colors.mutedForeground }]}>
                {hyzmatlar.length > 0 ? `${hyzmatlar.length} hyzmat bar` : "Ulag · Usta · Gözellik · Nahar"}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setAddHyzmatOpen(true); }}
            style={[mktStyles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={mktStyles.addBtnText}>Goş</Text>
          </Pressable>
        </View>

        {/* Search bar */}
        <View style={[mktStyles.searchBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
          <TextInput
            value={hyzmatSearch}
            onChangeText={setHyzmatSearch}
            placeholder="Hyzmat gözle..."
            placeholderTextColor={colors.mutedForeground}
            style={[mktStyles.searchInput, { color: colors.foreground }]}
          />
          {hyzmatSearch.length > 0 && (
            <Pressable onPress={() => setHyzmatSearch("")}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        {/* Category filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 4 }}
        >
          {[{ key: "all" as const, label: "Hemmesi", icon: "apps-outline", color: "#6366f1" }, ...HYZMAT_CATEGORIES].map((cat) => {
            const isActive = hyzmatFilter === cat.key;
            const count = cat.key === "all" ? hyzmatlar.length : hyzmatlar.filter((h) => h.category === cat.key).length;
            return (
              <Pressable
                key={cat.key}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setHyzmatFilter(cat.key as any); }}
                style={[
                  mktStyles.filterChip,
                  { backgroundColor: isActive ? cat.color : colors.muted, borderColor: isActive ? cat.color : colors.border },
                ]}
              >
                <Text style={[mktStyles.filterLabel, { color: isActive ? "#fff" : colors.foreground }]}>
                  {cat.label}
                </Text>
                {count > 0 && (
                  <View style={[mktStyles.filterBadge, { backgroundColor: isActive ? "rgba(255,255,255,0.25)" : colors.border }]}>
                    <Text style={{ color: isActive ? "#fff" : colors.mutedForeground, fontSize: 9, fontWeight: "700" }}>{count}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Service listing */}
        {filteredHyzmatlar.length === 0 ? (
          <View style={[mktStyles.emptyWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="storefront-outline" size={48} color={colors.mutedForeground} />
            <Text style={[mktStyles.emptyTitle, { color: colors.foreground }]}>
              {hyzmatSearch ? "Netije tapylmady" : "Heniz hyzmat ýok"}
            </Text>
            <Text style={[mktStyles.emptySub, { color: colors.mutedForeground }]}>
              {hyzmatSearch ? `"${hyzmatSearch}" boýunça hyzmat tapylmady` : "Ilkinji bolup özüňiziň hyzmatyňyzy goşuň!"}
            </Text>
            {!hyzmatSearch && (
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setAddHyzmatOpen(true); }}
                style={[mktStyles.emptyBtn, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="add-circle-outline" size={15} color="#fff" />
                <Text style={mktStyles.emptyBtnText}>Hyzmat goş</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, gap: 10, marginTop: 4 }}>
            {filteredHyzmatlar.map((item) => (
              <HyzmatCard key={item.id} item={item} />
            ))}
            {/* Add service row */}
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setAddHyzmatOpen(true); }}
              style={[mktStyles.addRowBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={[mktStyles.addRowText, { color: colors.primary }]}>Täze hyzmat goş</Text>
            </Pressable>
          </View>
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
  card: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 18, borderWidth: 1,
    padding: 14, overflow: "hidden", position: "relative",
  },
  accentBar: { width: 4, position: "absolute", left: 0, top: 0, bottom: 0, borderTopLeftRadius: 18, borderBottomLeftRadius: 18 },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", marginLeft: 6 },
  cardTitle: { fontSize: 14, fontWeight: "800", lineHeight: 18 },
  cardDesc: { fontSize: 12, lineHeight: 16 },
  catPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  pricePill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  callBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginLeft: 10 },
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

});

// ── E-Bilim Section Styles ────────────────────────────────────────────
const eb = StyleSheet.create({
  sectionHead: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, marginTop: 22, marginBottom: 12,
  },
  sectionTitle: { fontSize: 19, fontWeight: "800", letterSpacing: -0.4 },
  sectionSub: { fontSize: 11, marginTop: 2 },
  seeAllBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  seeAllText: { color: "#6366f1", fontSize: 12, fontWeight: "700" },

  outer: {
    marginHorizontal: 16, marginBottom: 16, borderRadius: 24,
    shadowColor: "#6366f1", shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35, shadowRadius: 22, elevation: 14,
  },
  card: { borderRadius: 24, padding: 22, overflow: "hidden" },

  circleA: {
    position: "absolute", top: -55, right: -35,
    width: 190, height: 190, borderRadius: 95,
    backgroundColor: "rgba(255,255,255,0.055)",
  },
  circleB: {
    position: "absolute", bottom: -45, left: -35,
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: "rgba(139,92,246,0.28)",
  },
  circleC: {
    position: "absolute", top: 40, right: 70,
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  titleRow: {
    flexDirection: "row", alignItems: "flex-start",
    gap: 12, marginBottom: 18,
  },
  title: { color: "#fff", fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  earnBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(251,191,36,0.18)",
    borderWidth: 1, borderColor: "rgba(251,191,36,0.35)",
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4,
    alignSelf: "flex-start",
  },
  earnBadgeText: { color: "#fbbf24", fontSize: 8, fontWeight: "800", letterSpacing: 0.6 },
  desc: { color: "rgba(255,255,255,0.72)", fontSize: 13, lineHeight: 19 },
  arrowBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
    marginTop: 2,
  },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  statItem: {
    flex: 1, alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  statValue: { color: "#fff", fontSize: 20, fontWeight: "900", letterSpacing: -0.3 },
  statLabel: { color: "rgba(255,255,255,0.58)", fontSize: 10, fontWeight: "600" },

  progressBlock: { marginBottom: 16 },
  progressTopRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 6,
  },
  progressText: { color: "rgba(255,255,255,0.68)", fontSize: 11, fontWeight: "600" },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.15)" },
  progressFill: { height: 5, borderRadius: 3, backgroundColor: "#4ade80" },

  catRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  catBubble: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
});

// ── Marketplace (Halk Hyzmatlary) Styles ─────────────────────────────
const mktStyles = StyleSheet.create({
  sectionHead: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16, marginTop: 24, marginBottom: 10,
  },
  sectionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  sectionSub: { fontSize: 11, marginTop: 1 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 16, marginBottom: 10,
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },

  filterChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterLabel: { fontSize: 12, fontWeight: "600" },
  filterBadge: { width: 17, height: 17, borderRadius: 9, alignItems: "center", justifyContent: "center" },

  emptyWrap: { marginHorizontal: 16, borderRadius: 20, borderWidth: 1, padding: 32, alignItems: "center", marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "800", marginBottom: 6 },
  emptySub: { fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 16 },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 16 },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  addRowBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, borderWidth: 1, paddingVertical: 14, marginTop: 2, marginBottom: 8 },
  addRowText: { fontSize: 14, fontWeight: "700" },
});

const notifStyles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 14 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 20, fontWeight: "800", letterSpacing: -0.4 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  badge: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, minWidth: 20, alignItems: "center" },
  badgeText: { fontSize: 11, fontWeight: "800", color: "#fff" },
  markReadBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  markReadText: { fontSize: 11, fontWeight: "700" },
  card: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    borderRadius: 16, borderWidth: 1, padding: 14,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 14, fontWeight: "700", marginBottom: 3 },
  cardDesc: { fontSize: 12, lineHeight: 17 },
  cardTime: { fontSize: 11, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  emptyWrap: {
    alignItems: "center", padding: 40, borderRadius: 16,
    borderWidth: 1, marginTop: 20, gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyDesc: { fontSize: 13, textAlign: "center", lineHeight: 19 },
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
