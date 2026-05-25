import React, { useState, useRef, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  Alert, ActivityIndicator, Platform, Dimensions,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Animated, {
  FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle,
  withSpring, withTiming, Easing,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import { saveOrder } from "@/lib/firebase";

const { width: SW } = Dimensions.get("window");

type Role = "buyer" | "seller";
type Step = "landing" | "buyer-form" | "seller-form" | "success";
type ServiceId = "designer" | "smm" | "reklama" | "trafik" | "fotovideo" | "webapp";

const SERVICES: Array<{
  id: ServiceId; label: string; subLabel: string;
  icon: string; color: string; bg: string; tags: string[];
}> = [
  { id: "designer", label: "Designer", subLabel: "Grafik, Logo, Brend", icon: "color-palette-outline", color: "#7c3aed", bg: "#ede9fe", tags: ["Logo", "Banner", "Brend", "UI/UX"] },
  { id: "smm", label: "SMM", subLabel: "Sosial media, content", icon: "trending-up-outline", color: "#0ea5e9", bg: "#e0f2fe", tags: ["Instagram", "TikTok", "Telegram"] },
  { id: "reklama", label: "Reklama", subLabel: "Meta, Google Ads", icon: "megaphone-outline", color: "#f59e0b", bg: "#fef3c7", tags: ["Meta Ads", "Google Ads"] },
  { id: "trafik", label: "Trafik / SEO", subLabel: "Organik trafik, SEO", icon: "bar-chart-outline", color: "#059669", bg: "#d1fae5", tags: ["SEO", "Google", "Backlink"] },
  { id: "fotovideo", label: "Foto / Video", subLabel: "Professional kontent", icon: "camera-outline", color: "#e11d48", bg: "#ffe4e6", tags: ["Fotosurat", "Reels", "Montaj"] },
  { id: "webapp", label: "Web / Ilova", subLabel: "Sayt, bot, mobil app", icon: "code-slash-outline", color: "#2563eb", bg: "#dbeafe", tags: ["Landing", "Bot", "App"] },
];

const BUSINESS_TYPES = [
  "Onlayn do'kon", "Restoran / Kafe", "Klinika / Salýon",
  "O'quv markazi", "Qurilish / Dizaýn", "IT / Texnologiya",
  "Moda / Kiyim", "Turizm / Sayohat", "Boshqa",
];

const BUDGETS = [
  { id: "b1", label: "< 500 TMT", desc: "Starter" },
  { id: "b2", label: "500–2000 TMT", desc: "Orta" },
  { id: "b3", label: "2000–5000 TMT", desc: "Pro" },
  { id: "b4", label: "> 5000 TMT", desc: "Enterprise" },
];

const EXP_LEVELS = [
  { id: "junior", label: "0–1 ýyl", icon: "leaf-outline" as const },
  { id: "middle", label: "1–3 ýyl", icon: "flash-outline" as const },
  { id: "senior", label: "3–6 ýyl", icon: "flame-outline" as const },
  { id: "expert", label: "6+ ýyl", icon: "diamond-outline" as const },
];

const CONTACT_PREFS = [
  { id: "telegram", icon: "paper-plane-outline", label: "Telegram" },
  { id: "whatsapp", icon: "logo-whatsapp", label: "WhatsApp" },
  { id: "call", icon: "call-outline", label: "Jaň" },
];

const BUYER_STATS = [
  { icon: "briefcase-outline", label: "Taslamalar", value: "1 240+", color: "#7c3aed" },
  { icon: "people-outline", label: "Hünärmenler", value: "86", color: "#0ea5e9" },
  { icon: "star-outline", label: "Baha", value: "4.9", color: "#f59e0b" },
];

const SELLER_STATS = [
  { icon: "cash-outline", label: "Ortalyk töleg", value: "850 TMT", color: "#059669" },
  { icon: "flash-outline", label: "Çalt başlaýar", value: "24 sagat", color: "#e11d48" },
  { icon: "shield-checkmark-outline", label: "Barlandy", value: "100%", color: "#2563eb" },
];

function ServiceIcon({ svc, size = 24, color }: { svc: typeof SERVICES[0]; size?: number; color: string }) {
  return <Ionicons name={svc.icon as any} size={size} color={color} />;
}

function BuyerForm({ colors, service, onSuccess }: { colors: ReturnType<typeof useColors>; service: typeof SERVICES[0]; onSuccess: () => void }) {
  const [bizName, setBizName] = useState("");
  const [bizType, setBizType] = useState("");
  const [social, setSocial] = useState("");
  const [goal, setGoal] = useState("");
  const [budget, setBudget] = useState("");
  const [phone, setPhone] = useState("");
  const [contactPref, setContactPref] = useState("telegram");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!bizName.trim()) { Alert.alert("Ýalňyşlyk", "Biznes adyny giriziň!"); return; }
    if (!bizType) { Alert.alert("Ýalňyşlyk", "Biznes turini saýlaň!"); return; }
    if (!goal.trim()) { Alert.alert("Ýalňyşlyk", "Maksadyňyzy ýazyň!"); return; }
    if (!phone.trim()) { Alert.alert("Ýalňyşlyk", "Telefon belgiňizi giriziň!"); return; }
    setLoading(true);
    try {
      await saveOrder("smm-buyer-requests", {
        type: "buyer", service: service.id, serviceLabel: service.label,
        bizName, bizType, social, goal, budget, phone, contactPref, status: "pending",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
    } catch {
      Alert.alert("Ýalňyşlyk", "Bilinmeýän ýalňyşlyk. Täzeden synaň!");
    } finally { setLoading(false); }
  }

  return (
    <View>
      <View style={[sf.serviceBadge, { backgroundColor: service.bg, borderColor: service.color + "40" }]}>
        <ServiceIcon svc={service} size={16} color={service.color} />
        <Text style={[sf.serviceBadgeText, { color: service.color }]}>{service.label} — Alyjy</Text>
      </View>
      <Text style={[sf.formTitle, { color: colors.foreground }]}>Biznesingiz hakynda</Text>
      <Text style={[sf.formSub, { color: colors.mutedForeground }]}>Maglumatlaryňyz barlanandan soň laýyk hünärmen tapylýar.</Text>

      <View style={sf.fieldBlock}>
        <Text style={[sf.label, { color: colors.mutedForeground }]}>Biznes ady / Brend</Text>
        <View style={[sf.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="briefcase-outline" size={16} color={colors.mutedForeground} style={sf.inputIcon} />
          <TextInput value={bizName} onChangeText={setBizName} placeholder="Mysal: Moda.tm, AşFood..." placeholderTextColor={colors.mutedForeground} style={[sf.input, { color: colors.foreground }]} returnKeyType="next" />
        </View>
      </View>

      <View style={sf.fieldBlock}>
        <Text style={[sf.label, { color: colors.mutedForeground }]}>Biznes turi</Text>
        <View style={sf.chipWrap}>
          {BUSINESS_TYPES.map(bt => (
            <Pressable key={bt} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setBizType(bt); }} style={[sf.chip, { backgroundColor: bizType === bt ? service.color : colors.card, borderColor: bizType === bt ? service.color : colors.border }]}>
              <Text style={[sf.chipText, { color: bizType === bt ? "#fff" : colors.foreground }]}>{bt}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={sf.fieldBlock}>
        <Text style={[sf.label, { color: colors.mutedForeground }]}>Saýt / Sosial media (isleg boýunça)</Text>
        <View style={[sf.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="globe-outline" size={16} color={colors.mutedForeground} style={sf.inputIcon} />
          <TextInput value={social} onChangeText={setSocial} placeholder="@username ýa-da sayt" placeholderTextColor={colors.mutedForeground} autoCapitalize="none" style={[sf.input, { color: colors.foreground }]} returnKeyType="next" />
        </View>
      </View>

      <View style={sf.fieldBlock}>
        <Text style={[sf.label, { color: colors.mutedForeground }]}>Näme gazanmak isleýärsiňiz?</Text>
        <View style={[sf.inputWrap, sf.textAreaWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput value={goal} onChangeText={setGoal} placeholder="Mysal: Satuwlary artdyrmak, täze müşderi çekmek..." placeholderTextColor={colors.mutedForeground} multiline numberOfLines={4} style={[sf.input, sf.textArea, { color: colors.foreground }]} />
        </View>
      </View>

      <View style={sf.fieldBlock}>
        <Text style={[sf.label, { color: colors.mutedForeground }]}>Býudjet (isleg boýunça)</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {BUDGETS.map(b => (
            <Pressable key={b.id} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setBudget(budget === b.id ? "" : b.id); }} style={[sf.budgetCard, { backgroundColor: budget === b.id ? service.color : colors.card, borderColor: budget === b.id ? service.color : colors.border }]}>
              <Text style={[sf.budgetLabel, { color: budget === b.id ? "#fff" : colors.foreground }]}>{b.label}</Text>
              <Text style={[sf.budgetDesc, { color: budget === b.id ? "rgba(255,255,255,0.75)" : colors.mutedForeground }]}>{b.desc}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={sf.fieldBlock}>
        <Text style={[sf.label, { color: colors.mutedForeground }]}>Telefon belgiňiz</Text>
        <View style={[sf.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="call-outline" size={16} color={colors.mutedForeground} style={sf.inputIcon} />
          <TextInput value={phone} onChangeText={setPhone} placeholder="+993 XX XXXXXX" placeholderTextColor={colors.mutedForeground} keyboardType="phone-pad" style={[sf.input, { color: colors.foreground }]} returnKeyType="done" />
        </View>
      </View>

      <View style={sf.fieldBlock}>
        <Text style={[sf.label, { color: colors.mutedForeground }]}>Aragatnaşyk usuly</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {CONTACT_PREFS.map(cp => (
            <Pressable key={cp.id} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setContactPref(cp.id); }} style={[sf.contactCard, { backgroundColor: contactPref === cp.id ? service.color + "15" : colors.card, borderColor: contactPref === cp.id ? service.color : colors.border }]}>
              <Ionicons name={cp.icon as any} size={20} color={contactPref === cp.id ? service.color : colors.mutedForeground} />
              <Text style={{ fontSize: 11, fontWeight: "700", color: contactPref === cp.id ? service.color : colors.foreground }}>{cp.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={service.color} size="large" style={{ marginTop: 24 }} />
      ) : (
        <Pressable onPress={submit} style={({ pressed }) => [sf.submitBtn, { backgroundColor: service.color, opacity: pressed ? 0.88 : 1 }]}>
          <Ionicons name="paper-plane-outline" size={18} color="#fff" />
          <Text style={sf.submitBtnText}>Haýyşnama ibermek</Text>
        </Pressable>
      )}

      <View style={[sf.infoNote, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="shield-checkmark-outline" size={15} color={service.color} />
        <Text style={[sf.infoNoteText, { color: colors.mutedForeground }]}>Siziň maglumatlaryňyz gizlin saklanýar. Admin 24 sagat içinde habarlaşýar.</Text>
      </View>
    </View>
  );
}

function SellerForm({ colors, service, onSuccess }: { colors: ReturnType<typeof useColors>; service: typeof SERVICES[0]; onSuccess: () => void }) {
  const [fullName, setFullName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [expLevel, setExpLevel] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [contactPref, setContactPref] = useState("telegram");
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  function toggleTag(tag: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  async function submit() {
    if (!fullName.trim()) { Alert.alert("Ýalňyşlyk", "Adyňyzy giriziň!"); return; }
    if (!specialty.trim()) { Alert.alert("Ýalňyşlyk", "Hünäriňizi ýazyň!"); return; }
    if (!expLevel) { Alert.alert("Ýalňyşlyk", "Tejribe derejesini saýlaň!"); return; }
    if (!phone.trim()) { Alert.alert("Ýalňyşlyk", "Telefon belgiňizi giriziň!"); return; }
    setLoading(true);
    try {
      await saveOrder("smm-seller-requests", {
        type: "seller", service: service.id, serviceLabel: service.label,
        fullName, specialty, expLevel, portfolio, priceRange, bio, phone, contactPref,
        skills: selectedTags, status: "pending",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
    } catch {
      Alert.alert("Ýalňyşlyk", "Bilinmeýän ýalňyşlyk. Täzeden synaň!");
    } finally { setLoading(false); }
  }

  return (
    <View>
      <View style={[sf.serviceBadge, { backgroundColor: service.bg, borderColor: service.color + "40" }]}>
        <ServiceIcon svc={service} size={16} color={service.color} />
        <Text style={[sf.serviceBadgeText, { color: service.color }]}>{service.label} — Hünärmen</Text>
      </View>
      <Text style={[sf.formTitle, { color: colors.foreground }]}>Özüňiz barada aýdyň</Text>
      <Text style={[sf.formSub, { color: colors.mutedForeground }]}>Profil barlanandan soň hünärmenler sanawyna goşularsyňyz.</Text>

      <View style={sf.fieldBlock}>
        <Text style={[sf.label, { color: colors.mutedForeground }]}>Doly adyňyz</Text>
        <View style={[sf.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="person-outline" size={16} color={colors.mutedForeground} style={sf.inputIcon} />
          <TextInput value={fullName} onChangeText={setFullName} placeholder="At Familiýa" placeholderTextColor={colors.mutedForeground} style={[sf.input, { color: colors.foreground }]} returnKeyType="next" />
        </View>
      </View>

      <View style={sf.fieldBlock}>
        <Text style={[sf.label, { color: colors.mutedForeground }]}>Hünäriňiz</Text>
        <View style={[sf.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="star-outline" size={16} color={colors.mutedForeground} style={sf.inputIcon} />
          <TextInput value={specialty} onChangeText={setSpecialty} placeholder="Mysal: Grafik dizaýner" placeholderTextColor={colors.mutedForeground} style={[sf.input, { color: colors.foreground }]} returnKeyType="next" />
        </View>
      </View>

      <View style={sf.fieldBlock}>
        <Text style={[sf.label, { color: colors.mutedForeground }]}>Ukyplaryňyz</Text>
        <View style={sf.chipWrap}>
          {service.tags.map(tag => (
            <Pressable key={tag} onPress={() => toggleTag(tag)} style={[sf.chip, { backgroundColor: selectedTags.includes(tag) ? service.color : colors.card, borderColor: selectedTags.includes(tag) ? service.color : colors.border }]}>
              {selectedTags.includes(tag) && <Ionicons name="checkmark" size={11} color="#fff" />}
              <Text style={[sf.chipText, { color: selectedTags.includes(tag) ? "#fff" : colors.foreground }]}>{tag}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={sf.fieldBlock}>
        <Text style={[sf.label, { color: colors.mutedForeground }]}>Tejribe derejesi</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {EXP_LEVELS.map(el => (
            <Pressable key={el.id} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setExpLevel(el.id); }} style={[sf.expCard, { backgroundColor: expLevel === el.id ? service.color : colors.card, borderColor: expLevel === el.id ? service.color : colors.border }]}>
              <Ionicons name={el.icon} size={16} color={expLevel === el.id ? "#fff" : service.color} />
              <Text style={[sf.expLabel, { color: expLevel === el.id ? "#fff" : colors.foreground }]}>{el.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={sf.fieldBlock}>
        <Text style={[sf.label, { color: colors.mutedForeground }]}>Portfolio (isleg boýunça)</Text>
        <View style={[sf.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="link-outline" size={16} color={colors.mutedForeground} style={sf.inputIcon} />
          <TextInput value={portfolio} onChangeText={setPortfolio} placeholder="Behance, Instagram..." placeholderTextColor={colors.mutedForeground} autoCapitalize="none" style={[sf.input, { color: colors.foreground }]} returnKeyType="next" />
        </View>
      </View>

      <View style={sf.fieldBlock}>
        <Text style={[sf.label, { color: colors.mutedForeground }]}>Nyrh çägi (isleg boýunça)</Text>
        <View style={[sf.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="cash-outline" size={16} color={colors.mutedForeground} style={sf.inputIcon} />
          <TextInput value={priceRange} onChangeText={setPriceRange} placeholder="Mysal: 300–1000 TMT / taslama" placeholderTextColor={colors.mutedForeground} style={[sf.input, { color: colors.foreground }]} returnKeyType="next" />
        </View>
      </View>

      <View style={sf.fieldBlock}>
        <Text style={[sf.label, { color: colors.mutedForeground }]}>Özüňiz barada gysgaça</Text>
        <View style={[sf.inputWrap, sf.textAreaWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput value={bio} onChangeText={setBio} placeholder="Tejribeniz, üstünlikli taslamalaryňyz..." placeholderTextColor={colors.mutedForeground} multiline numberOfLines={4} style={[sf.input, sf.textArea, { color: colors.foreground }]} />
        </View>
      </View>

      <View style={sf.fieldBlock}>
        <Text style={[sf.label, { color: colors.mutedForeground }]}>Telefon belgiňiz</Text>
        <View style={[sf.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="call-outline" size={16} color={colors.mutedForeground} style={sf.inputIcon} />
          <TextInput value={phone} onChangeText={setPhone} placeholder="+993 XX XXXXXX" placeholderTextColor={colors.mutedForeground} keyboardType="phone-pad" style={[sf.input, { color: colors.foreground }]} returnKeyType="done" />
        </View>
      </View>

      <View style={sf.fieldBlock}>
        <Text style={[sf.label, { color: colors.mutedForeground }]}>Aragatnaşyk usuly</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {CONTACT_PREFS.map(cp => (
            <Pressable key={cp.id} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setContactPref(cp.id); }} style={[sf.contactCard, { backgroundColor: contactPref === cp.id ? service.color + "15" : colors.card, borderColor: contactPref === cp.id ? service.color : colors.border }]}>
              <Ionicons name={cp.icon as any} size={20} color={contactPref === cp.id ? service.color : colors.mutedForeground} />
              <Text style={{ fontSize: 11, fontWeight: "700", color: contactPref === cp.id ? service.color : colors.foreground }}>{cp.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={service.color} size="large" style={{ marginTop: 24 }} />
      ) : (
        <Pressable onPress={submit} style={({ pressed }) => [sf.submitBtn, { backgroundColor: service.color, opacity: pressed ? 0.88 : 1 }]}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
          <Text style={sf.submitBtnText}>Profili ibermek</Text>
        </Pressable>
      )}

      <View style={[sf.infoNote, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="time-outline" size={15} color={service.color} />
        <Text style={[sf.infoNoteText, { color: colors.mutedForeground }]}>Admin profilinizi 24–48 sagat içinde barlar we hünärmenler sanawyna goşar.</Text>
      </View>
    </View>
  );
}

function SuccessScreen({ colors, role, service, onReset }: { colors: ReturnType<typeof useColors>; role: Role; service: typeof SERVICES[0]; onReset: () => void }) {
  return (
    <Animated.View entering={FadeInDown.duration(400).easing(Easing.out(Easing.back(1.2)))} style={sf.successWrap}>
      <LinearGradient colors={[service.bg, service.bg + "88"]} style={sf.successIconOuter}>
        <View style={[sf.successIconInner, { backgroundColor: service.color }]}>
          <Ionicons name="checkmark" size={38} color="#fff" />
        </View>
      </LinearGradient>
      <Text style={[sf.successTitle, { color: colors.foreground }]}>{role === "buyer" ? "Haýyşnama kabul edildi!" : "Profil iberildi!"}</Text>
      <Text style={[sf.successDesc, { color: colors.mutedForeground }]}>
        {role === "buyer"
          ? `${service.label} hünärmenimiz 24 sagat içinde siz bilen habarlaşar.`
          : `Admin siziň profilinizi ${service.label} hünärmenler sanawyna goşar.`}
      </Text>
      <View style={[sf.successDetail, { backgroundColor: colors.card, borderColor: service.color + "30" }]}>
        <View style={[{ width: 36, height: 36, borderRadius: 10, backgroundColor: service.bg, alignItems: "center", justifyContent: "center" }]}>
          <ServiceIcon svc={service} size={18} color={service.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "700", color: colors.foreground, fontSize: 14 }}>{service.label}</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>{role === "buyer" ? "Hyzmat alyjy" : "Hünärmen"}</Text>
        </View>
        <View style={{ backgroundColor: "#22c55e20", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
          <Text style={{ color: "#22c55e", fontSize: 11, fontWeight: "700" }}>Iberildi</Text>
        </View>
      </View>
      <Pressable onPress={onReset} style={({ pressed }) => [sf.submitBtn, { backgroundColor: service.color, opacity: pressed ? 0.88 : 1, marginTop: 24 }]}>
        <Ionicons name="refresh-outline" size={16} color="#fff" />
        <Text style={sf.submitBtnText}>Başa gaýdyp</Text>
      </Pressable>
      <Pressable onPress={() => router.back()} style={({ pressed }) => [sf.ghostBtn, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
        <Text style={[sf.ghostBtnText, { color: colors.mutedForeground }]}>Baş sahypasyna gaýt</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function SmmScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const [step, setStep] = useState<Step>("landing");
  const [activeRole, setActiveRole] = useState<Role>("buyer");
  const [selectedService, setSelectedService] = useState<typeof SERVICES[0] | null>(null);

  const topPad = (isWeb ? 0 : insets.top) + 14;

  const buyerTabScale = useSharedValue(1);
  const sellerTabScale = useSharedValue(1);

  const buyerTabStyle = useAnimatedStyle(() => ({ transform: [{ scale: buyerTabScale.value }] }));
  const sellerTabStyle = useAnimatedStyle(() => ({ transform: [{ scale: sellerTabScale.value }] }));

  function switchRole(role: Role) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (role === "buyer") {
      buyerTabScale.value = withSpring(0.95, { damping: 10, stiffness: 300 }, () => { buyerTabScale.value = withSpring(1); });
    } else {
      sellerTabScale.value = withSpring(0.95, { damping: 10, stiffness: 300 }, () => { sellerTabScale.value = withSpring(1); });
    }
    setActiveRole(role);
  }

  function selectService(svc: typeof SERVICES[0]) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedService(svc);
    setStep(activeRole === "buyer" ? "buyer-form" : "seller-form");
  }

  function goBack() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === "buyer-form" || step === "seller-form") {
      setStep("landing");
      setSelectedService(null);
    } else {
      router.back();
    }
  }

  const activeColor = selectedService?.color ?? colors.primary;

  const headerTitle =
    step === "landing" ? "SMM & Dizaýn" :
    step === "buyer-form" ? selectedService?.label ?? "" :
    step === "seller-form" ? selectedService?.label ?? "" :
    "Üstünlikli!";

  const headerSub =
    step === "landing" ? "Professional hünärmenler" :
    step === "buyer-form" ? "Alyjy haýyşnamasy" :
    step === "seller-form" ? "Hünärmen profili" :
    "Ýeňil";

  return (
    <View style={[sf.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={[sf.header, { paddingTop: topPad }]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
          <Pressable onPress={goBack} style={sf.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={sf.headerTitle}>{headerTitle}</Text>
            <Text style={sf.headerSub}>{headerSub}</Text>
          </View>
        </View>
      </LinearGradient>

      {step === "landing" && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* ── Alyjy / Beriji Segmented Control ── */}
          <View style={[sf.tabContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Animated.View style={[{ flex: 1 }, buyerTabStyle]}>
              <Pressable onPress={() => switchRole("buyer")} style={{ flex: 1 }}>
                <LinearGradient
                  colors={activeRole === "buyer" ? [colors.primary, colors.primary + "e0"] : ["transparent", "transparent"]}
                  style={[sf.tabBtn, activeRole === "buyer" && sf.tabBtnActive]}
                >
                  <Ionicons name="bag-handle-outline" size={16} color={activeRole === "buyer" ? "#fff" : colors.mutedForeground} />
                  <Text style={[sf.tabLabel, { color: activeRole === "buyer" ? "#fff" : colors.mutedForeground }]}>Alyjy</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>

            <Animated.View style={[{ flex: 1 }, sellerTabStyle]}>
              <Pressable onPress={() => switchRole("seller")} style={{ flex: 1 }}>
                <LinearGradient
                  colors={activeRole === "seller" ? [colors.primary, colors.primary + "e0"] : ["transparent", "transparent"]}
                  style={[sf.tabBtn, activeRole === "seller" && sf.tabBtnActive]}
                >
                  <Ionicons name="briefcase-outline" size={16} color={activeRole === "seller" ? "#fff" : colors.mutedForeground} />
                  <Text style={[sf.tabLabel, { color: activeRole === "seller" ? "#fff" : colors.mutedForeground }]}>Beriji</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </View>

          {/* ── Stats Row ── */}
          <Animated.View
            key={activeRole + "-stats"}
            entering={FadeInDown.duration(280).easing(Easing.out(Easing.quad))}
          >
            <View style={sf.statsRow}>
              {(activeRole === "buyer" ? BUYER_STATS : SELLER_STATS).map((stat, i) => (
                <View key={i} style={[sf.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[sf.statIconBox, { backgroundColor: stat.color + "18" }]}>
                    <Ionicons name={stat.icon as any} size={18} color={stat.color} />
                  </View>
                  <Text style={[sf.statValue, { color: colors.foreground }]}>{stat.value}</Text>
                  <Text style={[sf.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* ── Hero banner ── */}
          <Animated.View
            key={activeRole + "-hero"}
            entering={FadeInDown.duration(300).delay(60).easing(Easing.out(Easing.quad))}
            style={{ paddingHorizontal: 16, marginBottom: 6 }}
          >
            <LinearGradient
              colors={activeRole === "buyer" ? [colors.primary + "18", colors.primary + "08"] : ["#7c3aed18", "#7c3aed08"]}
              style={[sf.heroBanner, { borderColor: activeRole === "buyer" ? colors.primary + "22" : "#7c3aed22" }]}
            >
              <View style={[sf.heroBannerIcon, { backgroundColor: activeRole === "buyer" ? colors.primary + "22" : "#7c3aed22" }]}>
                <Ionicons
                  name={activeRole === "buyer" ? "search-outline" : "rocket-launch-outline" as any}
                  size={26}
                  color={activeRole === "buyer" ? colors.primary : "#7c3aed"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[sf.heroBannerTitle, { color: colors.foreground }]}>
                  {activeRole === "buyer" ? "Hünärmen tapyň" : "Hyzmat hödürläň"}
                </Text>
                <Text style={[sf.heroBannerDesc, { color: colors.mutedForeground }]}>
                  {activeRole === "buyer"
                    ? "Hizmat görnüşini saýlaň, haýyşnama iberiň — hünärmen siz bilen habarlaşar"
                    : "Hünäriňizi görkeziň, profil doldruň — müşderiler size ýetişer"}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ── Services Grid ── */}
          <Animated.View
            key={activeRole + "-grid"}
            entering={FadeInDown.duration(320).delay(100).easing(Easing.out(Easing.quad))}
            style={{ paddingHorizontal: 16 }}
          >
            <Text style={[sf.sectionLabel, { color: colors.foreground }]}>
              {activeRole === "buyer" ? "Hizmat görnüşini saýlaň" : "Hünäriňizi saýlaň"}
            </Text>

            <View style={sf.servicesGrid}>
              {SERVICES.map((svc, idx) => (
                <Animated.View
                  key={svc.id}
                  entering={FadeInDown.duration(280).delay(idx * 40).easing(Easing.out(Easing.quad))}
                  style={sf.svcCardWrap}
                >
                  <Pressable
                    onPress={() => selectService(svc)}
                    style={({ pressed }) => [sf.svcCard, {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      transform: [{ scale: pressed ? 0.96 : 1 }],
                      shadowColor: svc.color,
                      shadowOpacity: pressed ? 0.2 : 0.05,
                      shadowRadius: pressed ? 10 : 5,
                      shadowOffset: { width: 0, height: pressed ? 5 : 2 },
                      elevation: pressed ? 6 : 2,
                    }]}
                  >
                    {/* Top accent bar */}
                    <View style={[sf.svcAccentBar, { backgroundColor: svc.color }]} />

                    <View style={[sf.svcIconBg, { backgroundColor: svc.bg }]}>
                      <ServiceIcon svc={svc} size={26} color={svc.color} />
                    </View>

                    <Text style={[sf.svcLabel, { color: colors.foreground }]}>{svc.label}</Text>
                    <Text style={[sf.svcSub, { color: colors.mutedForeground }]} numberOfLines={2}>{svc.subLabel}</Text>

                    <View style={sf.tagRow}>
                      {svc.tags.slice(0, 2).map(tag => (
                        <View key={tag} style={[sf.tagPill, { backgroundColor: svc.bg }]}>
                          <Text style={[sf.tagText, { color: svc.color }]}>{tag}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={[sf.svcChevron, { backgroundColor: svc.bg }]}>
                      <Ionicons name="arrow-forward" size={13} color={svc.color} />
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* ── How it works ── */}
          <Animated.View
            entering={FadeInDown.duration(300).delay(200).easing(Easing.out(Easing.quad))}
            style={{ paddingHorizontal: 16, marginTop: 8 }}
          >
            <Text style={[sf.sectionLabel, { color: colors.foreground, marginBottom: 12 }]}>
              Nähili işleýär?
            </Text>
            {(activeRole === "buyer"
              ? [
                  { icon: "layers-outline", title: "Hizmat saýlaň", desc: "6 kategoriýadan gerekli hizmatyňyzy tapyň", color: "#7c3aed" },
                  { icon: "create-outline", title: "Haýyşnama dolduryň", desc: "Biznesiňiz barada gysgaça maglumatlary giriziň", color: "#0ea5e9" },
                  { icon: "people-outline", title: "Hünärmen tapylýar", desc: "24 sagat içinde hünärmen siz bilen habarlaşar", color: "#059669" },
                ]
              : [
                  { icon: "person-add-outline", title: "Profil doldruň", desc: "Hünäriňizi we tejribäňizi beýan ediň", color: "#7c3aed" },
                  { icon: "shield-checkmark-outline", title: "Admin barlar", desc: "Profiliniz 24–48 sagat içinde barlanýar", color: "#f59e0b" },
                  { icon: "cash-outline", title: "Müşderi alýarsyňyz", desc: "Tassyklananlar müşderi bilen baglanyşýar", color: "#059669" },
                ]
            ).map((item, i) => (
              <View key={i} style={[sf.howRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[sf.howIconBox, { backgroundColor: item.color + "18" }]}>
                  <Text style={[sf.howNum, { color: item.color }]}>{i + 1}</Text>
                </View>
                <View style={[sf.howIconBox, { backgroundColor: item.color + "15", marginLeft: -8 }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[sf.howTitle, { color: colors.foreground }]}>{item.title}</Text>
                  <Text style={[sf.howDesc, { color: colors.mutedForeground }]}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </Animated.View>
        </ScrollView>
      )}

      {(step === "buyer-form" || step === "seller-form") && selectedService && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 120 }}
          >
            {step === "buyer-form"
              ? <BuyerForm colors={colors} service={selectedService} onSuccess={() => setStep("success")} />
              : <SellerForm colors={colors} service={selectedService} onSuccess={() => setStep("success")} />
            }
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {step === "success" && selectedService && (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          <SuccessScreen
            colors={colors}
            role={activeRole}
            service={selectedService}
            onReset={() => { setStep("landing"); setSelectedService(null); }}
          />
        </ScrollView>
      )}
    </View>
  );
}

const sf = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16, paddingBottom: 16,
    flexDirection: "row", alignItems: "flex-end",
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  headerSub: { color: "rgba(255,255,255,0.72)", fontSize: 11, marginTop: 1 },
  backBtn: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },

  // Tab switcher
  tabContainer: {
    flexDirection: "row",
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 7, paddingVertical: 11, borderRadius: 12,
  },
  tabBtnActive: {
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  tabLabel: { fontSize: 14, fontWeight: "800" },

  // Stats
  statsRow: {
    flexDirection: "row", gap: 10,
    paddingHorizontal: 16, marginBottom: 14,
  },
  statCard: {
    flex: 1, borderRadius: 14, borderWidth: 1,
    padding: 12, alignItems: "center", gap: 5,
    shadowColor: "#000", shadowOpacity: 0.04,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  statIconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    marginBottom: 2,
  },
  statValue: { fontSize: 14, fontWeight: "800", letterSpacing: -0.3 },
  statLabel: { fontSize: 10, fontWeight: "600", textAlign: "center" },

  // Hero banner
  heroBanner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 18,
  },
  heroBannerIcon: {
    width: 50, height: 50, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  heroBannerTitle: { fontSize: 14, fontWeight: "800", marginBottom: 3 },
  heroBannerDesc: { fontSize: 12, lineHeight: 17 },

  // Section label
  sectionLabel: { fontSize: 16, fontWeight: "800", marginBottom: 14, letterSpacing: -0.2 },

  // Services grid
  servicesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  svcCardWrap: { width: (SW - 44) / 2 },
  svcCard: {
    borderRadius: 18, borderWidth: 1,
    padding: 14, gap: 7,
    overflow: "hidden",
    position: "relative",
  },
  svcAccentBar: {
    position: "absolute", top: 0, left: 0, right: 0, height: 3,
    borderTopLeftRadius: 18, borderTopRightRadius: 18,
  },
  svcIconBg: {
    width: 50, height: 50, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    marginTop: 4,
  },
  svcLabel: { fontSize: 14, fontWeight: "800", marginTop: 2 },
  svcSub: { fontSize: 11, lineHeight: 15 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  tagPill: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  tagText: { fontSize: 10, fontWeight: "700" },
  svcChevron: {
    position: "absolute", bottom: 12, right: 12,
    width: 22, height: 22, borderRadius: 7,
    alignItems: "center", justifyContent: "center",
  },

  // How it works
  howRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderRadius: 14, padding: 13, marginBottom: 9,
  },
  howIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  howNum: { fontSize: 13, fontWeight: "800" },
  howTitle: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  howDesc: { fontSize: 11, lineHeight: 16 },

  // Form
  serviceBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start", borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, marginBottom: 14,
  },
  serviceBadgeText: { fontSize: 12, fontWeight: "700" },
  formTitle: { fontSize: 20, fontWeight: "800", marginBottom: 6, letterSpacing: -0.3 },
  formSub: { fontSize: 13, lineHeight: 19, marginBottom: 20 },

  fieldBlock: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: "700", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.6 },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderRadius: 13, paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 13, fontSize: 15 },
  textAreaWrap: { alignItems: "flex-start", paddingTop: 12 },
  textArea: { height: 90, textAlignVertical: "top" },

  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 11, paddingVertical: 7,
  },
  chipText: { fontSize: 12, fontWeight: "600" },

  budgetCard: {
    flex: 1, borderWidth: 1.5, borderRadius: 12, padding: 11, alignItems: "center",
  },
  budgetLabel: { fontSize: 12, fontWeight: "800" },
  budgetDesc: { fontSize: 10, marginTop: 2 },

  expCard: {
    flex: 1, borderWidth: 1.5, borderRadius: 12, padding: 10, alignItems: "center", gap: 4,
  },
  expLabel: { fontSize: 10, fontWeight: "700", textAlign: "center" },

  contactCard: {
    flex: 1, borderWidth: 1.5, borderRadius: 13, padding: 12,
    alignItems: "center", gap: 5,
  },

  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 15, paddingVertical: 16, marginTop: 4,
  },
  submitBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  ghostBtn: {
    borderWidth: 1.5, borderRadius: 15, paddingVertical: 14,
    alignItems: "center", marginTop: 10,
  },
  ghostBtnText: { fontWeight: "600", fontSize: 15 },

  infoNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    borderWidth: 1, borderRadius: 13, padding: 12, marginTop: 14,
  },
  infoNoteText: { flex: 1, fontSize: 12, lineHeight: 18 },

  // Success
  successWrap: { alignItems: "center", paddingTop: 16 },
  successIconOuter: {
    width: 110, height: 110, borderRadius: 30,
    alignItems: "center", justifyContent: "center", marginBottom: 24,
  },
  successIconInner: {
    width: 76, height: 76, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  successTitle: { fontSize: 24, fontWeight: "800", marginBottom: 10, letterSpacing: -0.4, textAlign: "center" },
  successDesc: { fontSize: 14, lineHeight: 21, textAlign: "center", marginBottom: 24 },
  successDetail: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderRadius: 14, padding: 14, alignSelf: "stretch",
  },
});
