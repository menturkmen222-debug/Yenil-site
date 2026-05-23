import React, { useState, useRef } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  Alert, ActivityIndicator, Platform, Animated, Dimensions,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { saveOrder } from "@/lib/firebase";

const { width: SW } = Dimensions.get("window");

// ── Service definitions ────────────────────────────────────────────
type ServiceId = "designer" | "smm" | "reklama" | "trafik" | "fotovideo" | "webapp";

const SERVICES: Array<{
  id: ServiceId;
  label: string;
  subLabel: string;
  icon: string;
  iconLib: "ion" | "mci";
  color: string;
  bg: string;
  tags: string[];
}> = [
  {
    id: "designer",
    label: "Designer",
    subLabel: "Grafik, Logo, Brend dizaýny",
    icon: "color-palette-outline",
    iconLib: "ion",
    color: "#7c3aed",
    bg: "#ede9fe",
    tags: ["Logo", "Banner", "Brend", "UI/UX", "Afisha"],
  },
  {
    id: "smm",
    label: "SMM / Marketing",
    subLabel: "Sosial media, content, trafik",
    icon: "trending-up-outline",
    iconLib: "ion",
    color: "#0ea5e9",
    bg: "#e0f2fe",
    tags: ["Instagram", "TikTok", "Telegram", "Content plan", "Reels"],
  },
  {
    id: "reklama",
    label: "Reklama",
    subLabel: "Targeted, Google, Meta Ads",
    icon: "megaphone-outline",
    iconLib: "ion",
    color: "#f59e0b",
    bg: "#fef3c7",
    tags: ["Meta Ads", "Google Ads", "TikTok Ads", "Remarketing"],
  },
  {
    id: "trafik",
    label: "Trafik / SEO",
    subLabel: "Organik trafik, sayt SEO",
    icon: "bar-chart-outline",
    iconLib: "ion",
    color: "#059669",
    bg: "#d1fae5",
    tags: ["SEO", "Google", "Yandex", "Backlink", "Audit"],
  },
  {
    id: "fotovideo",
    label: "Foto / Video",
    subLabel: "Professional kontent ishlab chiqarish",
    icon: "camera-outline",
    iconLib: "ion",
    color: "#e11d48",
    bg: "#ffe4e6",
    tags: ["Fotosurat", "Reels", "Montaj", "Motion", "Product foto"],
  },
  {
    id: "webapp",
    label: "Web / Ilova",
    subLabel: "Sayt, bot, mobil ilova",
    icon: "code-slash-outline",
    iconLib: "ion",
    color: "#2563eb",
    bg: "#dbeafe",
    tags: ["Landing", "E-commerce", "Telegram bot", "Mobil app"],
  },
];

// ── Business types ─────────────────────────────────────────────────
const BUSINESS_TYPES = [
  "Onlayn do'kon", "Restoran / Kafe", "Klinika / Salýon",
  "O'quv markazi", "Qurilish / Dizaýn", "IT / Texnologiya",
  "Moda / Kiyim", "Turizm / Sayohat", "Boshqa",
];

// ── Budget ranges ──────────────────────────────────────────────────
const BUDGETS = [
  { id: "b1", label: "< 500 TMT", desc: "Starter" },
  { id: "b2", label: "500–2000 TMT", desc: "Orta" },
  { id: "b3", label: "2000–5000 TMT", desc: "Pro" },
  { id: "b4", label: "> 5000 TMT", desc: "Enterprise" },
];

// ── Experience levels ──────────────────────────────────────────────
const EXP_LEVELS = [
  { id: "junior", label: "0–1 ýyl", icon: "leaf-outline" as const },
  { id: "middle", label: "1–3 ýyl", icon: "flash-outline" as const },
  { id: "senior", label: "3–6 ýyl", icon: "flame-outline" as const },
  { id: "expert", label: "6+ ýyl", icon: "diamond-outline" as const },
];

// ── Contact prefs ──────────────────────────────────────────────────
const CONTACT_PREFS = [
  { id: "telegram", icon: "paper-plane-outline", label: "Telegram" },
  { id: "whatsapp", icon: "logo-whatsapp", label: "WhatsApp" },
  { id: "call", icon: "call-outline", label: "Jaň" },
];

type Step = "service" | "role" | "buyer-form" | "seller-form" | "success";
type Role = "buyer" | "seller";

// ── Icon renderer ──────────────────────────────────────────────────
function ServiceIcon({ svc, size = 26, color }: { svc: typeof SERVICES[0]; size?: number; color: string }) {
  return <Ionicons name={svc.icon as any} size={size} color={color} />;
}

// ── Step indicator ─────────────────────────────────────────────────
function StepDots({ current, total, color }: { current: number; total: number; color: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === current ? 20 : 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: i === current ? color : color + "30",
          }}
        />
      ))}
    </View>
  );
}

// ── Buyer form ─────────────────────────────────────────────────────
function BuyerForm({
  colors, service, onSuccess,
}: {
  colors: ReturnType<typeof useColors>;
  service: typeof SERVICES[0];
  onSuccess: () => void;
}) {
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
        type: "buyer",
        service: service.id,
        serviceLabel: service.label,
        bizName, bizType, social, goal, budget, phone, contactPref,
        status: "pending",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
    } catch {
      Alert.alert("Ýalňyşlyk", "Bilinmeýän ýalňyşlyk. Täzeden synaň!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Service badge */}
        <View style={[sf.serviceBadge, { backgroundColor: service.bg, borderColor: service.color + "40" }]}>
          <ServiceIcon svc={service} size={18} color={service.color} />
          <Text style={[sf.serviceBadgeText, { color: service.color }]}>{service.label}</Text>
        </View>

        <Text style={[sf.formTitle, { color: colors.foreground }]}>Biznesingiz hakkynda aýdyň</Text>
        <Text style={[sf.formSub, { color: colors.mutedForeground }]}>
          Maglumatlaryňyz admin tarapyndan barlanyp, size laýyk hünärmen saýlanýar.
        </Text>

        {/* Biznes ady */}
        <View style={sf.fieldBlock}>
          <Text style={[sf.label, { color: colors.mutedForeground }]}>Biznes ady / Brend</Text>
          <View style={[sf.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="briefcase-outline" size={18} color={colors.mutedForeground} style={sf.inputIcon} />
            <TextInput
              value={bizName} onChangeText={setBizName}
              placeholder="Mysal: Moda.tm, AşFood..."
              placeholderTextColor={colors.mutedForeground}
              style={[sf.input, { color: colors.foreground }]}
            />
          </View>
        </View>

        {/* Biznes turi */}
        <View style={sf.fieldBlock}>
          <Text style={[sf.label, { color: colors.mutedForeground }]}>Biznes turi</Text>
          <View style={sf.chipWrap}>
            {BUSINESS_TYPES.map(bt => (
              <Pressable
                key={bt}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setBizType(bt); }}
                style={[sf.chip, {
                  backgroundColor: bizType === bt ? service.color : colors.card,
                  borderColor: bizType === bt ? service.color : colors.border,
                }]}
              >
                <Text style={[sf.chipText, { color: bizType === bt ? "#fff" : colors.foreground }]}>{bt}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Social / sayt */}
        <View style={sf.fieldBlock}>
          <Text style={[sf.label, { color: colors.mutedForeground }]}>Saýt / Instagram / Telegram (ihtiyarsy)</Text>
          <View style={[sf.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="globe-outline" size={18} color={colors.mutedForeground} style={sf.inputIcon} />
            <TextInput
              value={social} onChangeText={setSocial}
              placeholder="@username ýa-da sayt salgysy"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              style={[sf.input, { color: colors.foreground }]}
            />
          </View>
        </View>

        {/* Maksat */}
        <View style={sf.fieldBlock}>
          <Text style={[sf.label, { color: colors.mutedForeground }]}>Näme gazanmak isleýärsiňiz?</Text>
          <View style={[sf.inputWrap, sf.textAreaWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              value={goal} onChangeText={setGoal}
              placeholder={`Mysal: ${service.id === "smm" ? "Instagram sahypamy ösdürip, satuw artdyrmak" : service.id === "designer" ? "Brendim üçin täze logo we stilistika gerek" : "Biznesime müşderi çekmek, trafik artdyrmak"}`}
              placeholderTextColor={colors.mutedForeground}
              multiline numberOfLines={4}
              style={[sf.input, sf.textArea, { color: colors.foreground }]}
            />
          </View>
        </View>

        {/* Býudžet */}
        <View style={sf.fieldBlock}>
          <Text style={[sf.label, { color: colors.mutedForeground }]}>Býudjet (ihtiyarsy)</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {BUDGETS.map(b => (
              <Pressable
                key={b.id}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setBudget(budget === b.id ? "" : b.id); }}
                style={[sf.budgetCard, {
                  backgroundColor: budget === b.id ? service.color : colors.card,
                  borderColor: budget === b.id ? service.color : colors.border,
                }]}
              >
                <Text style={[sf.budgetLabel, { color: budget === b.id ? "#fff" : colors.foreground }]}>{b.label}</Text>
                <Text style={[sf.budgetDesc, { color: budget === b.id ? "rgba(255,255,255,0.75)" : colors.mutedForeground }]}>{b.desc}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Telefon */}
        <View style={sf.fieldBlock}>
          <Text style={[sf.label, { color: colors.mutedForeground }]}>Telefon belgiňiz</Text>
          <View style={[sf.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="call-outline" size={18} color={colors.mutedForeground} style={sf.inputIcon} />
            <TextInput
              value={phone} onChangeText={setPhone}
              placeholder="+993 XX XXXXXX"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
              style={[sf.input, { color: colors.foreground }]}
            />
          </View>
        </View>

        {/* Aragatnaşyk usuly */}
        <View style={sf.fieldBlock}>
          <Text style={[sf.label, { color: colors.mutedForeground }]}>Aragatnaşyk usuly</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {CONTACT_PREFS.map(cp => (
              <Pressable
                key={cp.id}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setContactPref(cp.id); }}
                style={[sf.contactCard, {
                  backgroundColor: contactPref === cp.id ? service.color + "15" : colors.card,
                  borderColor: contactPref === cp.id ? service.color : colors.border,
                }]}
              >
                <Ionicons name={cp.icon as any} size={22} color={contactPref === cp.id ? service.color : colors.mutedForeground} />
                <Text style={[{ fontSize: 11, fontWeight: "700", color: contactPref === cp.id ? service.color : colors.foreground }]}>{cp.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Submit */}
        {loading ? (
          <ActivityIndicator color={service.color} size="large" style={{ marginTop: 24 }} />
        ) : (
          <Pressable
            onPress={submit}
            style={({ pressed }) => [sf.submitBtn, { backgroundColor: service.color, opacity: pressed ? 0.88 : 1 }]}
          >
            <Ionicons name="paper-plane-outline" size={20} color="#fff" />
            <Text style={sf.submitBtnText}>Haýyşnama ibermek</Text>
          </Pressable>
        )}

        <View style={[sf.infoNote, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark-outline" size={16} color={service.color} />
          <Text style={[sf.infoNoteText, { color: colors.mutedForeground }]}>
            Siziň maglumatlaryňyz gizlin saklanýar. Admin 24 sagat içinde siz bilen habarlaşýar.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Seller form ────────────────────────────────────────────────────
function SellerForm({
  colors, service, onSuccess,
}: {
  colors: ReturnType<typeof useColors>;
  service: typeof SERVICES[0];
  onSuccess: () => void;
}) {
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
        type: "seller",
        service: service.id,
        serviceLabel: service.label,
        fullName, specialty, expLevel, portfolio, priceRange, bio, phone, contactPref,
        skills: selectedTags,
        status: "pending",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
    } catch {
      Alert.alert("Ýalňyşlyk", "Bilinmeýän ýalňyşlyk. Täzeden synaň!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Service badge */}
        <View style={[sf.serviceBadge, { backgroundColor: service.bg, borderColor: service.color + "40" }]}>
          <ServiceIcon svc={service} size={18} color={service.color} />
          <Text style={[sf.serviceBadgeText, { color: service.color }]}>{service.label} hünärmeni</Text>
        </View>

        <Text style={[sf.formTitle, { color: colors.foreground }]}>Özüňiz barada aýdyň</Text>
        <Text style={[sf.formSub, { color: colors.mutedForeground }]}>
          Profiliňiz admin tarapyndan barlanandan soň hünärmenler sanawyna goşularsyňyz.
        </Text>

        {/* Full name */}
        <View style={sf.fieldBlock}>
          <Text style={[sf.label, { color: colors.mutedForeground }]}>Doly adyňyz</Text>
          <View style={[sf.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="person-outline" size={18} color={colors.mutedForeground} style={sf.inputIcon} />
            <TextInput
              value={fullName} onChangeText={setFullName}
              placeholder="At Familiýa"
              placeholderTextColor={colors.mutedForeground}
              style={[sf.input, { color: colors.foreground }]}
            />
          </View>
        </View>

        {/* Specialty */}
        <View style={sf.fieldBlock}>
          <Text style={[sf.label, { color: colors.mutedForeground }]}>Hünäriňiz / Ihtisasyňyz</Text>
          <View style={[sf.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="star-outline" size={18} color={colors.mutedForeground} style={sf.inputIcon} />
            <TextInput
              value={specialty} onChangeText={setSpecialty}
              placeholder={`Mysal: ${service.id === "designer" ? "Grafik dizaýner, Illustrator" : service.id === "smm" ? "SMM hünärmeni, Content maker" : "Hünäriňizi ýazyň"}`}
              placeholderTextColor={colors.mutedForeground}
              style={[sf.input, { color: colors.foreground }]}
            />
          </View>
        </View>

        {/* Skills / Tags */}
        <View style={sf.fieldBlock}>
          <Text style={[sf.label, { color: colors.mutedForeground }]}>Ukyplaryňyz (birnäçesini saýlaň)</Text>
          <View style={sf.chipWrap}>
            {service.tags.map(tag => (
              <Pressable
                key={tag}
                onPress={() => toggleTag(tag)}
                style={[sf.chip, {
                  backgroundColor: selectedTags.includes(tag) ? service.color : colors.card,
                  borderColor: selectedTags.includes(tag) ? service.color : colors.border,
                }]}
              >
                {selectedTags.includes(tag) && (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                )}
                <Text style={[sf.chipText, { color: selectedTags.includes(tag) ? "#fff" : colors.foreground }]}>{tag}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Experience level */}
        <View style={sf.fieldBlock}>
          <Text style={[sf.label, { color: colors.mutedForeground }]}>Tejribe derejesi</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {EXP_LEVELS.map(el => (
              <Pressable
                key={el.id}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setExpLevel(el.id); }}
                style={[sf.expCard, {
                  backgroundColor: expLevel === el.id ? service.color : colors.card,
                  borderColor: expLevel === el.id ? service.color : colors.border,
                }]}
              >
                <Ionicons name={el.icon} size={18} color={expLevel === el.id ? "#fff" : service?.color ?? "#6366f1"} />
                <Text style={[sf.expLabel, { color: expLevel === el.id ? "#fff" : colors.foreground }]}>{el.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Portfolio */}
        <View style={sf.fieldBlock}>
          <Text style={[sf.label, { color: colors.mutedForeground }]}>Portfolio / Işleriňiziň salgysy (ihtiyarsy)</Text>
          <View style={[sf.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="link-outline" size={18} color={colors.mutedForeground} style={sf.inputIcon} />
            <TextInput
              value={portfolio} onChangeText={setPortfolio}
              placeholder="Behance, Dribbble, Instagram..."
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              style={[sf.input, { color: colors.foreground }]}
            />
          </View>
        </View>

        {/* Price range */}
        <View style={sf.fieldBlock}>
          <Text style={[sf.label, { color: colors.mutedForeground }]}>Nyrh çägi (ihtiyarsy)</Text>
          <View style={[sf.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="cash-multiple" size={18} color={colors.mutedForeground} style={sf.inputIcon} />
            <TextInput
              value={priceRange} onChangeText={setPriceRange}
              placeholder="Mysal: 300–1000 TMT / taslama"
              placeholderTextColor={colors.mutedForeground}
              style={[sf.input, { color: colors.foreground }]}
            />
          </View>
        </View>

        {/* Bio */}
        <View style={sf.fieldBlock}>
          <Text style={[sf.label, { color: colors.mutedForeground }]}>Özüňiz barada gysgaça</Text>
          <View style={[sf.inputWrap, sf.textAreaWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              value={bio} onChangeText={setBio}
              placeholder="Tejribeniz, işleýiş usulňyz, üstünlikli taslamalaryňyz..."
              placeholderTextColor={colors.mutedForeground}
              multiline numberOfLines={4}
              style={[sf.input, sf.textArea, { color: colors.foreground }]}
            />
          </View>
        </View>

        {/* Phone */}
        <View style={sf.fieldBlock}>
          <Text style={[sf.label, { color: colors.mutedForeground }]}>Telefon belgiňiz</Text>
          <View style={[sf.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="call-outline" size={18} color={colors.mutedForeground} style={sf.inputIcon} />
            <TextInput
              value={phone} onChangeText={setPhone}
              placeholder="+993 XX XXXXXX"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
              style={[sf.input, { color: colors.foreground }]}
            />
          </View>
        </View>

        {/* Contact pref */}
        <View style={sf.fieldBlock}>
          <Text style={[sf.label, { color: colors.mutedForeground }]}>Aragatnaşyk usuly</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {CONTACT_PREFS.map(cp => (
              <Pressable
                key={cp.id}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setContactPref(cp.id); }}
                style={[sf.contactCard, {
                  backgroundColor: contactPref === cp.id ? service.color + "15" : colors.card,
                  borderColor: contactPref === cp.id ? service.color : colors.border,
                }]}
              >
                <Ionicons name={cp.icon as any} size={22} color={contactPref === cp.id ? service.color : colors.mutedForeground} />
                <Text style={[{ fontSize: 11, fontWeight: "700", color: contactPref === cp.id ? service.color : colors.foreground }]}>{cp.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={service.color} size="large" style={{ marginTop: 24 }} />
        ) : (
          <Pressable
            onPress={submit}
            style={({ pressed }) => [sf.submitBtn, { backgroundColor: service.color, opacity: pressed ? 0.88 : 1 }]}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={sf.submitBtnText}>Profili ibermek</Text>
          </Pressable>
        )}

        <View style={[sf.infoNote, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="time-outline" size={16} color={service.color} />
          <Text style={[sf.infoNoteText, { color: colors.mutedForeground }]}>
            Admin profilinizi 24–48 sagat içinde barlar we hünärmenler sanawyna goşar.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Success screen ─────────────────────────────────────────────────
function SuccessScreen({
  colors, role, service, onReset,
}: {
  colors: ReturnType<typeof useColors>;
  role: Role;
  service: typeof SERVICES[0];
  onReset: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }).start();
  }, []);

  return (
    <View style={[sf.successWrap]}>
      <Animated.View style={[sf.successIconOuter, { backgroundColor: service.bg, transform: [{ scale: scaleAnim }] }]}>
        <View style={[sf.successIconInner, { backgroundColor: service.color }]}>
          <Ionicons name="checkmark" size={40} color="#fff" />
        </View>
      </Animated.View>

      <Text style={[sf.successTitle, { color: colors.foreground }]}>
        {role === "buyer" ? "Haýyşnama kabul edildi!" : "Profil iberildi!"}
      </Text>
      <Text style={[sf.successDesc, { color: colors.mutedForeground }]}>
        {role === "buyer"
          ? `${service.label} hünärmenimiz siziň haýyşnamaňyzy barlar we 24 sagat içinde siz bilen habarlaşar.`
          : `Admin siziň profilinizi ${service.label} hünärmenler sanawyna goşmak üçin barlar. 24–48 sagat garaşyň.`}
      </Text>

      <View style={[sf.successDetail, { backgroundColor: colors.card, borderColor: service.color + "30" }]}>
        <View style={[{ width: 36, height: 36, borderRadius: 10, backgroundColor: service.bg, alignItems: "center", justifyContent: "center" }]}>
          <ServiceIcon svc={service} size={18} color={service.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[{ fontWeight: "700", color: colors.foreground, fontSize: 14 }]}>{service.label}</Text>
          <Text style={[{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }]}>
            {role === "buyer" ? "Hyzmat alyjy" : "Hünärmen"}
          </Text>
        </View>
        <View style={[{ backgroundColor: colors.success + "20", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }]}>
          <Text style={[{ color: colors.success, fontSize: 11, fontWeight: "700" }]}>Iberildi</Text>
        </View>
      </View>

      <Pressable
        onPress={onReset}
        style={({ pressed }) => [sf.submitBtn, { backgroundColor: service.color, opacity: pressed ? 0.88 : 1, marginTop: 24 }]}
      >
        <Ionicons name="refresh-outline" size={18} color="#fff" />
        <Text style={sf.submitBtnText}>Başa gaýdyp</Text>
      </Pressable>

      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [sf.ghostBtn, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
      >
        <Text style={[sf.ghostBtnText, { color: colors.mutedForeground }]}>Baş sahypasyna gaýt</Text>
      </Pressable>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────
export default function SmmScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<typeof SERVICES[0] | null>(null);
  const [role, setRole] = useState<Role | null>(null);

  const topPad = (isWeb ? 0 : insets.top) + 14;

  const activeColor = selectedService?.color ?? "#6366f1";
  const activeBg = selectedService?.bg ?? "#ede9fe";

  function selectService(svc: typeof SERVICES[0]) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedService(svc);
    setStep("role");
  }

  function selectRole(r: Role) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRole(r);
    setStep(r === "buyer" ? "buyer-form" : "seller-form");
  }

  function goBack() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === "role") { setStep("service"); setSelectedService(null); }
    else if (step === "buyer-form" || step === "seller-form") setStep("role");
    else router.back();
  }

  function handleSuccess() {
    setStep("success");
  }

  function handleReset() {
    setStep("service");
    setSelectedService(null);
    setRole(null);
  }

  const stepNum = step === "service" ? 0 : step === "role" ? 1 : step === "success" ? 3 : 2;

  return (
    <View style={[{ flex: 1 }, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={[sf.header, { paddingTop: topPad }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
          {step !== "service" && step !== "success" ? (
            <Pressable onPress={goBack} style={sf.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </Pressable>
          ) : step === "success" ? null : (
            <Pressable onPress={() => router.back()} style={sf.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </Pressable>
          )}
          <View style={{ flex: 1 }}>
            <Text style={sf.headerTitle}>
              {step === "service" ? "SMM & Dizaýn" :
                step === "role" ? selectedService?.label ?? "" :
                  step === "buyer-form" ? "Haýyşnama" :
                    step === "seller-form" ? "Hünärmen Profil" : "Üstünlikli!"}
            </Text>
            <Text style={sf.headerSub}>
              {step === "service" ? "Hizmat ýa-da hünärmen" :
                step === "role" ? selectedService?.subLabel ?? "" :
                  step === "buyer-form" ? "Alyjy — biznes maglumatlary" :
                    step === "seller-form" ? "Beriji — hünärmen profili" : "Ýeňil"}
            </Text>
          </View>
        </View>
        {step !== "success" && (
          <StepDots
            current={stepNum}
            total={step === "buyer-form" || step === "seller-form" ? 3 : 3}
            color="#fff"
          />
        )}
      </LinearGradient>

      {/* ── Content ── */}
      {step === "service" && (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero banner */}
          <View style={[sf.heroBanner, { backgroundColor: activeColor + "10", borderColor: activeColor + "25" }]}>
            <View style={[sf.heroBannerIcon, { backgroundColor: activeColor + "20" }]}>
              <MaterialCommunityIcons name="rocket-launch-outline" size={28} color={activeColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[sf.heroBannerTitle, { color: colors.foreground }]}>Professional hünärmenler bilen işle</Text>
              <Text style={[sf.heroBannerDesc, { color: colors.mutedForeground }]}>
                Hizmat görnüşini saýlaň — alyjy ýa-da beriji bolsaňyz hem ýer taparsyňyz
              </Text>
            </View>
          </View>

          <Text style={[sf.sectionLabel, { color: colors.foreground }]}>Hizmat görnüşini saýlaň</Text>

          <View style={sf.servicesGrid}>
            {SERVICES.map(svc => (
              <Pressable
                key={svc.id}
                onPress={() => selectService(svc)}
                style={({ pressed }) => [sf.svcCard, {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.88 : 1,
                  shadowColor: svc.color,
                  shadowOpacity: pressed ? 0.15 : 0,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                }]}
              >
                {/* Icon */}
                <View style={[sf.svcIconBg, { backgroundColor: svc.bg }]}>
                  <ServiceIcon svc={svc} size={26} color={svc.color} />
                </View>

                {/* Text */}
                <Text style={[sf.svcLabel, { color: colors.foreground }]}>{svc.label}</Text>
                <Text style={[sf.svcSub, { color: colors.mutedForeground }]}>{svc.subLabel}</Text>

                {/* Tags */}
                <View style={sf.tagRow}>
                  {svc.tags.slice(0, 2).map(tag => (
                    <View key={tag} style={[sf.tagPill, { backgroundColor: svc.bg }]}>
                      <Text style={[sf.tagText, { color: svc.color }]}>{tag}</Text>
                    </View>
                  ))}
                </View>

                {/* Arrow */}
                <View style={[sf.svcArrow, { backgroundColor: svc.bg }]}>
                  <Ionicons name="chevron-forward" size={14} color={svc.color} />
                </View>
              </Pressable>
            ))}
          </View>

          {/* Bottom note */}
          <View style={[sf.bottomNote, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="information-circle-outline" size={18} color={colors.mutedForeground} />
            <Text style={[sf.bottomNoteText, { color: colors.mutedForeground }]}>
              Hünärmen ýa-da müşderi — ikisi-de bu ýerde. Hizmat satyp ýa-da satyn alyp bilersiňiz.
            </Text>
          </View>
        </ScrollView>
      )}

      {step === "role" && selectedService && (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Question */}
          <Text style={[sf.roleQuestion, { color: colors.foreground }]}>
            Siz kim bolýarsyňyz?
          </Text>
          <Text style={[sf.roleSub, { color: colors.mutedForeground }]}>
            {selectedService.label} hyzmatyny almak ýa-da hödürlemek isleýärsiňizmi?
          </Text>

          {/* Buyer card */}
          <Pressable
            onPress={() => selectRole("buyer")}
            style={({ pressed }) => [sf.roleCard, {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.9 : 1,
            }]}
          >
            <View style={[sf.roleIconBg, { backgroundColor: "#dbeafe" }]}>
              <Ionicons name="bag-handle-outline" size={28} color="#2563eb" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Text style={[sf.roleCardTitle, { color: colors.foreground }]}>Men alyjy</Text>
                <View style={[sf.roleBadge, { backgroundColor: "#dbeafe" }]}>
                  <Text style={[sf.roleBadgeText, { color: "#2563eb" }]}>Hizmat satyn al</Text>
                </View>
              </View>
              <Text style={[sf.roleCardDesc, { color: colors.mutedForeground }]}>
                {selectedService.label} hyzmatyny gerek edýärin. Biznesim üçin hünärmen tapmak isleýärin.
              </Text>
              <View style={sf.roleFeatures}>
                {["Öz islegimi beýan ederin", "Hünärmen teklip eder", "Razy bolsam işe başlarys"].map(f => (
                  <View key={f} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <Ionicons name="checkmark-circle" size={14} color="#2563eb" />
                    <Text style={[{ fontSize: 12, color: colors.mutedForeground }]}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
          </Pressable>

          {/* Seller card */}
          <Pressable
            onPress={() => selectRole("seller")}
            style={({ pressed }) => [sf.roleCard, {
              backgroundColor: colors.card,
              borderColor: colors.border,
              marginTop: 14,
              opacity: pressed ? 0.9 : 1,
            }]}
          >
            <View style={[sf.roleIconBg, { backgroundColor: selectedService.bg }]}>
              <Ionicons name="briefcase-outline" size={28} color={selectedService.color} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Text style={[sf.roleCardTitle, { color: colors.foreground }]}>Men beriji</Text>
                <View style={[sf.roleBadge, { backgroundColor: selectedService.bg }]}>
                  <Text style={[sf.roleBadgeText, { color: selectedService.color }]}>Hizmat hödürle</Text>
                </View>
              </View>
              <Text style={[sf.roleCardDesc, { color: colors.mutedForeground }]}>
                {selectedService.label} hünärmeni hökmünde hyzmat hödürlemek isleýärin.
              </Text>
              <View style={sf.roleFeatures}>
                {["Profil doldurýaryn", "Admin barlap goşar", "Müşderi bilen baglanyşarys"].map(f => (
                  <View key={f} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <Ionicons name="checkmark-circle" size={14} color={selectedService.color} />
                    <Text style={[{ fontSize: 12, color: colors.mutedForeground }]}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
          </Pressable>
        </ScrollView>
      )}

      {step === "buyer-form" && selectedService && (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BuyerForm colors={colors} service={selectedService} onSuccess={handleSuccess} />
        </ScrollView>
      )}

      {step === "seller-form" && selectedService && (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SellerForm colors={colors} service={selectedService} onSuccess={handleSuccess} />
        </ScrollView>
      )}

      {step === "success" && selectedService && role && (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          <SuccessScreen
            colors={colors}
            role={role}
            service={selectedService}
            onReset={handleReset}
          />
        </ScrollView>
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────
const sf = StyleSheet.create({
  // Header
  header: {
    paddingHorizontal: 16, paddingBottom: 16,
    flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12,
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 1 },
  backBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },

  // Service grid
  heroBanner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 20,
  },
  heroBannerIcon: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  heroBannerTitle: { fontSize: 14, fontWeight: "700", marginBottom: 3 },
  heroBannerDesc: { fontSize: 12, lineHeight: 17 },

  sectionLabel: { fontSize: 17, fontWeight: "800", marginBottom: 14, letterSpacing: -0.2 },

  servicesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  svcCard: {
    width: (SW - 44) / 2,
    borderRadius: 18, borderWidth: 1,
    padding: 14, gap: 8,
    elevation: 0,
  },
  svcIconBg: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  svcLabel: { fontSize: 14, fontWeight: "800" },
  svcSub: { fontSize: 11, lineHeight: 15 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  tagPill: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  tagText: { fontSize: 10, fontWeight: "700" },
  svcArrow: {
    position: "absolute", top: 12, right: 12,
    width: 22, height: 22, borderRadius: 7,
    alignItems: "center", justifyContent: "center",
  },

  bottomNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 16,
  },
  bottomNoteText: { flex: 1, fontSize: 12, lineHeight: 18 },

  // Role selection
  roleQuestion: { fontSize: 24, fontWeight: "800", marginBottom: 8, letterSpacing: -0.4 },
  roleSub: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  roleCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 14,
    borderWidth: 1.5, borderRadius: 18, padding: 16,
  },
  roleIconBg: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  roleCardTitle: { fontSize: 17, fontWeight: "800" },
  roleCardDesc: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  roleBadge: { borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
  roleBadgeText: { fontSize: 11, fontWeight: "700" },
  roleFeatures: { gap: 2 },

  // Form styles
  serviceBadge: {
    flexDirection: "row", alignItems: "center", gap: 7,
    alignSelf: "flex-start",
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    marginBottom: 14,
  },
  serviceBadgeText: { fontSize: 13, fontWeight: "700" },
  formTitle: { fontSize: 20, fontWeight: "800", marginBottom: 6, letterSpacing: -0.3 },
  formSub: { fontSize: 13, lineHeight: 19, marginBottom: 22 },

  fieldBlock: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: "700", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
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
  chipText: { fontSize: 13, fontWeight: "600" },

  budgetCard: {
    flex: 1, borderWidth: 1.5, borderRadius: 12, padding: 12, alignItems: "center",
  },
  budgetLabel: { fontSize: 13, fontWeight: "800" },
  budgetDesc: { fontSize: 10, marginTop: 2 },

  expCard: {
    flex: 1, borderWidth: 1.5, borderRadius: 12, padding: 10, alignItems: "center", gap: 4,
  },
  expEmoji: { fontSize: 20 },
  expLabel: { fontSize: 11, fontWeight: "700", textAlign: "center" },

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
  successWrap: { alignItems: "center", paddingTop: 20 },
  successIconOuter: {
    width: 110, height: 110, borderRadius: 30,
    alignItems: "center", justifyContent: "center", marginBottom: 24,
  },
  successIconInner: {
    width: 76, height: 76, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  successTitle: { fontSize: 24, fontWeight: "800", marginBottom: 10, letterSpacing: -0.4 },
  successDesc: { fontSize: 14, lineHeight: 21, textAlign: "center", marginBottom: 24 },
  successDetail: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderRadius: 14, padding: 14,
    alignSelf: "stretch",
  },
});
