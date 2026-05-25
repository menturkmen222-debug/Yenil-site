import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  Modal,
  FlatList,
  Dimensions,
  ScrollView,
  Share,
} from "react-native";
import { router } from "expo-router";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  FadeOutUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  Easing,
  type SharedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";
import {
  saveUserProfile,
  getOrCreateReferralCode,
  setUserNickname,
} from "@/lib/firebase";
import { saveLocalProfile } from "@/lib/localProfile";
import { PessimisticButton } from "@/components/PessimisticButton";

const TOTAL_STEPS = 4;
const { width: SCREEN_W } = Dimensions.get("window");

const STEP_SUBTITLES = [
  "Bary-ýogy 2 minutda — mugt, çalt, ygtybarly",
  "Sizi tanaýarys — bu mümkinçilik siziňki",
  "Käriňiz — siziň güýjüňiz",
  "Tanyşlaryňyz bilen has güýçli boluň",
];

const WELAÝATLAR: { id: string; label: string }[] = [
  { id: "ashgabat", label: "Aşgabat" },
  { id: "ahal",     label: "Ahal welaýaty" },
  { id: "balkan",   label: "Balkan welaýaty" },
  { id: "dashoguz", label: "Daşoguz welaýaty" },
  { id: "lebap",    label: "Lebap welaýaty" },
  { id: "mary",     label: "Mary welaýaty" },
];

const TUMANLAR: Record<string, { id: string; label: string }[]> = {
  ashgabat: [
    { id: "buzmeyin",    label: "Büzmeýin" },
    { id: "berkararlyk", label: "Berkararlyk" },
    { id: "bagtyyarlyk", label: "Bagtyýarlyk" },
    { id: "kopetdag",    label: "Köpetdag" },
  ],
  ahal: [
    { id: "akbugday",   label: "Ak bugdaý" },
    { id: "anew",       label: "Änew" },
    { id: "babadayhan", label: "Babadaýhan" },
    { id: "baherden",   label: "Bäherden" },
    { id: "gokdepe",    label: "Gökdepe" },
    { id: "kaka",       label: "Kaka" },
    { id: "sarahs",     label: "Sarahs" },
    { id: "tejen",      label: "Tejen" },
  ],
  balkan: [
    { id: "balkanabat",   label: "Balkanabat" },
    { id: "bereket",      label: "Bereket" },
    { id: "etrek",        label: "Etrek" },
    { id: "hazar",        label: "Hazar" },
    { id: "magtymguly",   label: "Magtymguly" },
    { id: "serdar",       label: "Serdar" },
    { id: "turkmenbashy", label: "Türkmenbaşy" },
  ],
  dashoguz: [
    { id: "akdepe",     label: "Akdepe" },
    { id: "boldumsaz",  label: "Boldumsaz" },
    { id: "dashoguz",   label: "Daşoguz" },
    { id: "gorogly",    label: "Görogly" },
    { id: "gubadag",    label: "Gubadag" },
    { id: "gurbansoltan", label: "Gurbansoltan eje" },
    { id: "koneurgenc", label: "Köneürgenç" },
    { id: "ruhubelent", label: "Ruhubelent" },
  ],
  lebap: [
    { id: "atamyrat",     label: "Atamyrat" },
    { id: "carjew",       label: "Çärjew" },
    { id: "danew",        label: "Dänew" },
    { id: "dowletli",     label: "Döwletli" },
    { id: "farap",        label: "Farap" },
    { id: "garabekewul",  label: "Garabekewül" },
    { id: "halac",        label: "Halaç" },
    { id: "kerki",        label: "Kerki" },
    { id: "sayat",        label: "Saýat" },
    { id: "turkmenabat",  label: "Türkmenabat" },
  ],
  mary: [
    { id: "bayramaly",    label: "Baýramaly" },
    { id: "mary",         label: "Mary" },
    { id: "murgap",       label: "Murgap" },
    { id: "oguzhan",      label: "Oguzhan" },
    { id: "sakarcage",    label: "Sakarçäge" },
    { id: "serhetabat",   label: "Serhetabat" },
    { id: "tagtabazar",   label: "Tagtabazar" },
    { id: "turkmengala",  label: "Türkmengala" },
    { id: "yoloten",      label: "Ýolöten" },
  ],
};

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface Kar {
  id: string;
  label: string;
  icon: IoniconsName;
}

const KARLER: Kar[] = [
  { id: "suruji",   label: "Sürüji",        icon: "car-outline" },
  { id: "kuryer",   label: "Kuryer",         icon: "bicycle-outline" },
  { id: "usta",     label: "Usta",           icon: "construct-outline" },
  { id: "talyp",    label: "Talyp",          icon: "school-outline" },
  { id: "telekeci", label: "Telekeçi",       icon: "briefcase-outline" },
  { id: "mugallym", label: "Mugallym",       icon: "library-outline" },
  { id: "lukman",   label: "Lukman",         icon: "medkit-outline" },
  { id: "it",       label: "IT hünärmeni",   icon: "code-slash-outline" },
  { id: "harby",    label: "Harby gullukçy", icon: "shield-outline" },
  { id: "beyleki",  label: "Beýleki",        icon: "person-outline" },
];

interface SelectModalProps {
  visible: boolean;
  title: string;
  items: { id: string; label: string }[];
  selectedId: string;
  onSelect: (id: string, label: string) => void;
  onClose: () => void;
}

function SelectModal({ visible, title, items, selectedId, onSelect, onClose }: SelectModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={sm.overlay} onPress={onClose}>
        <Pressable style={[sm.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]} onPress={() => {}}>
          <View style={[sm.handle, { backgroundColor: colors.border }]} />
          <Text style={[sm.title, { color: colors.foreground }]}>{title}</Text>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = item.id === selectedId;
              return (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onSelect(item.id, item.label);
                    onClose();
                  }}
                  style={({ pressed }) => [
                    sm.item,
                    { borderBottomColor: colors.border },
                    isSelected && { backgroundColor: colors.primary + "12" },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={[sm.itemText, { color: isSelected ? colors.primary : colors.foreground }]}>{item.label}</Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                </Pressable>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { deviceId } = useBonusPul();

  // ── Step nav ──
  const [step, setStep] = useState(0);
  const progressAnim = useSharedValue((1 / TOTAL_STEPS) * SCREEN_W);
  const progressStyle = useAnimatedStyle(() => ({ width: progressAnim.value }));

  // ── Button press animations ──
  const phoneScale = useSharedValue(1);
  const googleScale = useSharedValue(1);
  const mailruScale = useSharedValue(1);
  const inviteScale = useSharedValue(1);

  const phoneAnimStyle  = useAnimatedStyle(() => ({ transform: [{ scale: phoneScale.value }] }));
  const googleAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: googleScale.value }] }));
  const mailruAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: mailruScale.value }] }));
  const inviteAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: inviteScale.value }] }));

  // Invite button pulse
  const invitePulse = useSharedValue(1);
  const invitePulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: invitePulse.value }] }));

  useEffect(() => {
    if (step === 3) {
      invitePulse.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 900, easing: Easing.inOut(Easing.sin) }),
          withTiming(1.00, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        ),
        -1, false
      );
    }
  }, [step]);

  function pressBtn(sv: SharedValue<number>) {
    sv.value = withSequence(
      withSpring(0.95, { damping: 14, stiffness: 300 }),
      withSpring(1.0,  { damping: 12, stiffness: 260 }),
    );
  }

  const goToStep = useCallback(
    (nextStep: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(nextStep);
      progressAnim.value = withTiming(
        ((nextStep + 1) / TOTAL_STEPS) * SCREEN_W,
        { duration: 420, easing: Easing.out(Easing.cubic) }
      );
    },
    [progressAnim]
  );

  // ── Step 1: login method ──
  const [loginMethod, setLoginMethod] = useState<"phone" | "google" | "mailru">("phone");
  const [email, setEmail] = useState("");
  const emailRef = useRef<TextInput>(null);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSelectMethod = useCallback((method: "phone" | "google" | "mailru") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoginMethod(method);
    setEmail("");
    setPhone("");
    setOtp("");
    setOtpSent(false);
    setTimeout(() => emailRef.current?.focus(), 200);
  }, []);

  const handleEmailContinue = useCallback(() => {
    if (!emailValid) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    goToStep(1);
  }, [emailValid, goToStep]);

  // ── Step 1: phone + OTP ──
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const otpRef = useRef<TextInput>(null);

  const handleSendOtp = useCallback(async () => {
    if (phone.replace(/\s/g, "").length < 8) return;
    setSendingOtp(true);
    await new Promise((res) => setTimeout(res, 900));
    setSendingOtp(false);
    setOtpSent(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => otpRef.current?.focus(), 200);
  }, [phone]);

  const handleVerifyOtp = useCallback(async () => {
    if (otp.length < 4) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    goToStep(1);
  }, [otp, goToStep]);

  // ── Step 2: personal info ──
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameEdited, setUsernameEdited] = useState(false);
  const [welaýatId, setWelaýatId] = useState("");
  const [welaýatLabel, setWelaýatLabel] = useState("");
  const [tumanId, setTumanId] = useState("");
  const [tumanLabel, setTumanLabel] = useState("");
  const [showWelaýat, setShowWelaýat] = useState(false);
  const [showTuman, setShowTuman] = useState(false);
  const fullNameRef = useRef<TextInput>(null);
  const usernameRef = useRef<TextInput>(null);

  const tumanItems = welaýatId ? (TUMANLAR[welaýatId] ?? []) : [];

  // Auto-suggest username from fullName
  useEffect(() => {
    if (usernameEdited || !fullName.trim()) return;
    const base = fullName.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    if (base.length >= 2) setUsername(base);
  }, [fullName, usernameEdited]);

  const handleWelaýatSelect = useCallback((id: string, label: string) => {
    setWelaýatId(id);
    setWelaýatLabel(label);
    setTumanId("");
    setTumanLabel("");
  }, []);

  const usernameValid = /^[a-z0-9_.]{3,20}$/.test(username.trim());
  const step2Valid =
    fullName.trim().length >= 2 &&
    usernameValid &&
    welaýatId.length > 0 &&
    tumanId.length > 0;

  // ── Step 3: profession ──
  const [profession, setProfession] = useState("");
  const [bio, setBio] = useState("");

  // ── Step 4: save + share ──
  const [saving, setSaving] = useState(false);

  const handleFinish = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const parts = fullName.trim().split(/\s+/);
      const nameVal = parts[0] || "";
      const surnameVal = parts.slice(1).join(" ") || "";

      if (deviceId) {
        const contact = loginMethod === "phone" ? phone.replace(/\s/g, "") : email.trim();
        const profileData = {
          name: nameVal,
          surname: surnameVal,
          phone: contact,
          region: welaýatLabel,
          district: tumanLabel,
          profession,
          bio: bio.trim(),
          username: username.trim(),
        };
        const savePromise = Promise.all([
          saveUserProfile(deviceId, profileData),
          username.trim() ? setUserNickname(deviceId, username.trim()) : Promise.resolve(),
        ]);
        await Promise.race([savePromise, new Promise<void>((_, r) => setTimeout(() => r(new Error("timeout")), 5000))]).catch(() => {});
        await saveLocalProfile({ ...profileData }).catch(() => {});
      }
    } catch {}
    setSaving(false);
    await AsyncStorage.setItem("@yenil_show_confetti", "1").catch(() => {});
    router.replace("/(tabs)");
  }, [saving, deviceId, loginMethod, phone, email, fullName, welaýatLabel, tumanLabel, profession, bio, username]);

  const handleSkip = useCallback(async () => {
    await AsyncStorage.setItem("@yenil_show_confetti", "1").catch(() => {});
    router.replace("/(tabs)");
  }, []);

  const [sharing, setSharing] = useState(false);

  const handleShareAndFinish = useCallback(async () => {
    if (sharing || saving) return;
    setSharing(true);
    pressBtn(inviteScale);
    try {
      const code = deviceId ? await getOrCreateReferralCode(deviceId).catch(() => "") : "";
      const msg = [
        "🎉 Ýeňil programmasyna goşulyň!",
        code ? `Meniň çakylyk kodum: ${code}\n(Ikimiz hem 1 BP bonus gazanarys!)` : "",
        "",
        "✅ Bank kartsyz demirýol bileti",
        "✅ Payeer / WebMoney çalyşmak",
        "✅ Bonus Pul (BP) ulgamy",
        "",
        "👉 App Store ýa-da Google Play-dan häzir ýükle!",
      ].filter(Boolean).join("\n");
      await Share.share({ message: msg, title: "Ýeňile goşulyň!" }).catch(() => {});
    } catch {}
    setSharing(false);
    await handleFinish();
  }, [sharing, saving, deviceId, handleFinish]);

  const inputStyle = [
    s.input,
    { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground },
  ];

  const label = (text: string) => (
    <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>{text}</Text>
  );

  // ─── Step 1 ────────────────────────────────────────────────────────────────

  function renderStep1() {
    return (
      <Animated.View
        key="step-1"
        entering={FadeInDown.duration(300).easing(Easing.out(Easing.quad))}
        exiting={FadeOutUp.duration(160).easing(Easing.in(Easing.quad))}
      >
        {/* Compact header */}
        <View style={s.compactHeader}>
          <LinearGradient
            colors={[colors.primary + "22", colors.primary + "08"]}
            style={s.compactHeaderIcon}
          >
            <Ionicons name="shield-checkmark" size={26} color={colors.primary} />
          </LinearGradient>
          <Text style={[s.compactHeaderTitle, { color: colors.foreground }]}>Ýeňile goşulyň</Text>
          <Text style={[s.compactHeaderSub, { color: colors.mutedForeground }]}>
            Giriş usulyny saýlaň
          </Text>
        </View>

        {/* ── Phone button ── */}
        <Pressable
          onPress={() => {
            pressBtn(phoneScale);
            setLoginMethod("phone");
            setEmail(""); setPhone(""); setOtp(""); setOtpSent(false);
          }}
        >
          <Animated.View style={phoneAnimStyle}>
            <LinearGradient
              colors={loginMethod === "phone"
                ? [colors.primary + "18", colors.primary + "08"]
                : ["transparent", "transparent"]}
              style={[
                s.socialBtn,
                {
                  borderColor: loginMethod === "phone" ? colors.primary : colors.border,
                  backgroundColor: loginMethod === "phone" ? "transparent" : colors.card,
                },
              ]}
            >
              <LinearGradient
                colors={[colors.primary + "30", colors.primary + "15"]}
                style={s.socialIconBox}
              >
                <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[s.socialBtnTitle, { color: colors.foreground }]}>Telefon belgisi bilen</Text>
                <Text style={[s.socialBtnSub, { color: colors.mutedForeground }]}>+993 TM nomer · Iň çalt usul</Text>
              </View>
              {loginMethod === "phone" ? (
                <Animated.View entering={FadeInDown.duration(200)}>
                  <LinearGradient colors={[colors.primary, colors.primary + "cc"]} style={s.checkCircle}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </LinearGradient>
                </Animated.View>
              ) : (
                <View style={[s.emptyCircle, { borderColor: colors.border }]} />
              )}
            </LinearGradient>
          </Animated.View>
        </Pressable>

        {/* Phone + OTP inline */}
        {loginMethod === "phone" && (
          <Animated.View entering={FadeInDown.duration(260)} style={{ marginBottom: 4 }}>
            <View style={[s.phoneRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <View style={[s.phonePrefix, { borderRightColor: colors.border }]}>
                <Text style={[s.phonePrefixText, { color: colors.mutedForeground }]}>+993</Text>
              </View>
              <TextInput
                style={[s.phoneInput, { color: colors.foreground }]}
                value={phone}
                onChangeText={(t) => setPhone(t.replace(/[^0-9\s]/g, "").slice(0, 10))}
                placeholder="6X XXX XX XX"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
                maxLength={10}
                editable={!otpSent}
                returnKeyType="done"
                onSubmitEditing={handleSendOtp}
              />
            </View>
            {!otpSent ? (
              <View style={s.btnWrap}>
                <PessimisticButton
                  label={sendingOtp ? "Iberilýär..." : "SMS Iber"}
                  loading={sendingOtp}
                  disabled={phone.replace(/\s/g, "").length < 8}
                  onPress={handleSendOtp}
                  icon="send-outline"
                />
              </View>
            ) : (
              <Animated.View entering={FadeInDown.duration(280)}>
                <View style={[s.otpInfoRow, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
                  <Ionicons name="checkmark-circle" size={15} color={colors.primary} />
                  <Text style={[s.otpInfoText, { color: colors.primary }]}>+993 {phone} belgisine SMS iberildi</Text>
                </View>
                <TextInput
                  ref={otpRef}
                  style={[...inputStyle, s.otpInput]}
                  value={otp}
                  onChangeText={(t) => setOtp(t.replace(/\D/g, "").slice(0, 6))}
                  placeholder="XXXXXX"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="number-pad"
                  maxLength={6}
                  returnKeyType="done"
                  onSubmitEditing={handleVerifyOtp}
                />
                <View style={s.btnWrap}>
                  <PessimisticButton
                    label="Tassykla"
                    disabled={otp.length < 4}
                    onPress={handleVerifyOtp}
                    icon="checkmark-circle-outline"
                  />
                </View>
                <Pressable onPress={() => { setOtpSent(false); setOtp(""); }} style={s.retryBtn}>
                  <Text style={[s.retryText, { color: colors.mutedForeground }]}>Belgimi üýtget</Text>
                </Pressable>
              </Animated.View>
            )}
          </Animated.View>
        )}

        {/* Divider */}
        <View style={s.divider}>
          <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[s.dividerText, { color: colors.mutedForeground }]}>ýa-da e-poçta bilen</Text>
          <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* ── Google button ── */}
        <Pressable onPress={() => { pressBtn(googleScale); handleSelectMethod("google"); }}>
          <Animated.View style={googleAnimStyle}>
            <LinearGradient
              colors={loginMethod === "google" ? ["#EA4335" + "18", "#EA4335" + "06"] : ["transparent", "transparent"]}
              style={[
                s.socialBtn,
                {
                  borderColor: loginMethod === "google" ? "#EA4335" : colors.border,
                  backgroundColor: loginMethod === "google" ? "transparent" : colors.card,
                },
              ]}
            >
              <View style={[s.socialIconBox, { backgroundColor: "#EA4335" + "20" }]}>
                <AntDesign name="google" size={20} color="#EA4335" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.socialBtnTitle, { color: colors.foreground }]}>Google bilen dowam et</Text>
                <Text style={[s.socialBtnSub, { color: colors.mutedForeground }]}>Gmail salgyňyz bilen</Text>
              </View>
              {loginMethod === "google" ? (
                <Animated.View entering={FadeInDown.duration(200)}>
                  <LinearGradient colors={["#EA4335", "#EA4335cc"]} style={s.checkCircle}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </LinearGradient>
                </Animated.View>
              ) : (
                <View style={[s.emptyCircle, { borderColor: colors.border }]} />
              )}
            </LinearGradient>
          </Animated.View>
        </Pressable>

        {/* ── Mail.ru button ── */}
        <Pressable onPress={() => { pressBtn(mailruScale); handleSelectMethod("mailru"); }}>
          <Animated.View style={mailruAnimStyle}>
            <LinearGradient
              colors={loginMethod === "mailru" ? ["#005FF9" + "18", "#005FF9" + "06"] : ["transparent", "transparent"]}
              style={[
                s.socialBtn,
                {
                  borderColor: loginMethod === "mailru" ? "#005FF9" : colors.border,
                  backgroundColor: loginMethod === "mailru" ? "transparent" : colors.card,
                },
              ]}
            >
              <View style={[s.socialIconBox, { backgroundColor: "#005FF9" + "20" }]}>
                <Ionicons name="mail" size={20} color="#005FF9" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.socialBtnTitle, { color: colors.foreground }]}>Mail.ru bilen dowam et</Text>
                <Text style={[s.socialBtnSub, { color: colors.mutedForeground }]}>Mail.ru ýa-da @mail.ru</Text>
              </View>
              {loginMethod === "mailru" ? (
                <Animated.View entering={FadeInDown.duration(200)}>
                  <LinearGradient colors={["#005FF9", "#005FF9cc"]} style={s.checkCircle}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </LinearGradient>
                </Animated.View>
              ) : (
                <View style={[s.emptyCircle, { borderColor: colors.border }]} />
              )}
            </LinearGradient>
          </Animated.View>
        </Pressable>

        {/* Email input for google/mailru */}
        {loginMethod !== "phone" && (
          <Animated.View entering={FadeInDown.duration(260)} style={{ marginTop: 6 }}>
            {label(loginMethod === "google" ? "Gmail salgyňyz" : "Mail.ru salgyňyz")}
            <TextInput
              ref={emailRef}
              style={[...inputStyle, { borderColor: emailValid ? colors.primary : colors.border }]}
              value={email}
              onChangeText={setEmail}
              placeholder={loginMethod === "google" ? "mysal@gmail.com" : "mysal@mail.ru"}
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleEmailContinue}
            />
            <View style={s.btnWrap}>
              <PessimisticButton label="Dowam et" disabled={!emailValid} onPress={handleEmailContinue} icon="arrow-forward-outline" />
            </View>
          </Animated.View>
        )}

        {/* Already have account */}
        <Pressable onPress={() => router.replace("/auth/login")} style={s.alreadyHaveAccount}>
          <Ionicons name="person-circle-outline" size={16} color={colors.primary} />
          <Text style={[s.alreadyHaveAccountText, { color: colors.primary }]}>
            Hasabym bar — girýän
          </Text>
        </Pressable>
      </Animated.View>
    );
  }

  // ─── Step 2 ────────────────────────────────────────────────────────────────

  function renderStep2() {
    return (
      <Animated.View
        key="step-2"
        entering={FadeInDown.duration(300).easing(Easing.out(Easing.quad))}
        exiting={FadeOutUp.duration(160).easing(Easing.in(Easing.quad))}
      >
        {/* Compact header */}
        <View style={s.compactHeader}>
          <LinearGradient
            colors={[colors.primary + "22", colors.primary + "08"]}
            style={s.compactHeaderIcon}
          >
            <Ionicons name="person-outline" size={24} color={colors.primary} />
          </LinearGradient>
          <Text style={[s.compactHeaderTitle, { color: colors.foreground }]}>Şahsy maglumatlar</Text>
          <Text style={[s.compactHeaderSub, { color: colors.mutedForeground }]}>
            Profiliňiz üçin
          </Text>
        </View>

        {/* @Username */}
        {label("Ulanyjy ady (Username)")}
        <View style={[s.usernameRow, { backgroundColor: colors.input, borderColor: usernameValid || !username ? colors.border : "#ef4444" }]}>
          <View style={[s.atPrefix, { borderRightColor: colors.border }]}>
            <Text style={[s.atText, { color: colors.primary }]}>@</Text>
          </View>
          <TextInput
            ref={usernameRef}
            style={[s.usernameInput, { color: colors.foreground }]}
            value={username}
            onChangeText={(t) => {
              setUsername(t.toLowerCase().replace(/[^a-z0-9_.]/g, "").slice(0, 20));
              setUsernameEdited(true);
            }}
            placeholder="mysal_ady"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => fullNameRef.current?.focus()}
          />
          {username.length >= 3 && (
            <View style={{ paddingRight: 12 }}>
              {usernameValid
                ? <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                : <Ionicons name="close-circle" size={18} color="#ef4444" />}
            </View>
          )}
        </View>
        {username.length > 0 && !usernameValid && (
          <Text style={[s.usernameHint, { color: "#ef4444" }]}>3–20 harp, diňe: a–z 0–9 _ .</Text>
        )}

        {/* Full name */}
        {label("Adyňyz Familýaňyz")}
        <TextInput
          ref={fullNameRef}
          style={inputStyle}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Merdan Durdyýew"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="words"
          returnKeyType="done"
        />

        {/* Welaýat + Tuman side by side */}
        {label("Welaýat / Tuman")}
        <View style={s.locationRow}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowWelaýat(true);
            }}
            style={[
              s.locationBtn,
              { backgroundColor: colors.input, borderColor: welaýatId ? colors.primary : colors.border },
            ]}
          >
            <Text style={[s.locationBtnText, { color: welaýatId ? colors.foreground : colors.mutedForeground }]} numberOfLines={1}>
              {welaýatLabel || "Welaýat"}
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.mutedForeground} />
          </Pressable>

          <Pressable
            onPress={() => {
              if (!welaýatId) return;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowTuman(true);
            }}
            style={[
              s.locationBtn,
              {
                backgroundColor: !welaýatId ? colors.muted : colors.input,
                borderColor: tumanId ? colors.primary : colors.border,
                opacity: !welaýatId ? 0.5 : 1,
              },
            ]}
          >
            <Text style={[s.locationBtnText, { color: tumanId ? colors.foreground : colors.mutedForeground }]} numberOfLines={1}>
              {tumanLabel || (welaýatId ? "Tuman" : "Tuman")}
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <View style={s.btnWrap}>
          <PessimisticButton
            label="Dowam et"
            disabled={!step2Valid}
            onPress={() => goToStep(2)}
            icon="arrow-forward-outline"
          />
        </View>

        <SelectModal
          visible={showWelaýat}
          title="Welaýat saýlaň"
          items={WELAÝATLAR}
          selectedId={welaýatId}
          onSelect={handleWelaýatSelect}
          onClose={() => setShowWelaýat(false)}
        />
        <SelectModal
          visible={showTuman}
          title="Tuman / Şäher saýlaň"
          items={tumanItems}
          selectedId={tumanId}
          onSelect={(id, label) => { setTumanId(id); setTumanLabel(label); }}
          onClose={() => setShowTuman(false)}
        />
      </Animated.View>
    );
  }

  // ─── Step 3 ────────────────────────────────────────────────────────────────

  function renderStep3() {
    return (
      <Animated.View
        key="step-3"
        entering={FadeInDown.duration(300).easing(Easing.out(Easing.quad))}
        exiting={FadeOutUp.duration(160).easing(Easing.in(Easing.quad))}
      >
        <View style={s.compactHeader}>
          <LinearGradient colors={[colors.primary + "22", colors.primary + "08"]} style={s.compactHeaderIcon}>
            <Ionicons name="briefcase-outline" size={24} color={colors.primary} />
          </LinearGradient>
          <Text style={[s.compactHeaderTitle, { color: colors.foreground }]}>Hünär maglumatlar</Text>
          <Text style={[s.compactHeaderSub, { color: colors.mutedForeground }]}>Käriňizi saýlaň</Text>
        </View>

        {label("Käriňiz")}
        <View style={s.karGrid}>
          {KARLER.map((kar) => {
            const isSelected = profession === kar.id;
            return (
              <Pressable
                key={kar.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setProfession(kar.id);
                }}
                style={[
                  s.karCard,
                  {
                    backgroundColor: isSelected ? colors.primary + "15" : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Ionicons name={kar.icon} size={20} color={isSelected ? colors.primary : colors.mutedForeground} />
                <Text style={[s.karLabel, { color: isSelected ? colors.primary : colors.foreground }]}>{kar.label}</Text>
                {isSelected && (
                  <View style={[s.karCheck, { backgroundColor: colors.primary }]}>
                    <Ionicons name="checkmark" size={10} color="#fff" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {label("Özüňizi tanyşdyryň")}
        <TextInput
          style={[...inputStyle, s.bioInput]}
          value={bio}
          onChangeText={(t) => setBio(t.slice(0, 300))}
          placeholder="Gysga, gyzykly tanyşdyryş..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Text style={[s.charCount, { color: colors.mutedForeground }]}>{bio.length} / 300</Text>

        <View style={[s.bioTip, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "25" }]}>
          <Ionicons name="trending-up-outline" size={13} color={colors.primary} />
          <Text style={[s.bioTipText, { color: colors.primary }]}>
            Doly profilli ulanyjylar 3× köp ynam we teklip gazanýarlar
          </Text>
        </View>

        <View style={s.btnWrap}>
          <PessimisticButton label="Dowam et" disabled={!profession} onPress={() => goToStep(3)} icon="arrow-forward-outline" />
        </View>
      </Animated.View>
    );
  }

  // ─── Step 4 ────────────────────────────────────────────────────────────────

  function renderStep4() {
    return (
      <Animated.View
        key="step-4"
        entering={FadeInDown.duration(300).easing(Easing.out(Easing.quad))}
        exiting={FadeOutUp.duration(160).easing(Easing.in(Easing.quad))}
      >
        <View style={s.compactHeader}>
          <LinearGradient colors={[colors.primary + "22", colors.primary + "08"]} style={s.compactHeaderIcon}>
            <Ionicons name="people-outline" size={24} color={colors.primary} />
          </LinearGradient>
          <Text style={[s.compactHeaderTitle, { color: colors.foreground }]}>Ýakynlaryňy çagyr!</Text>
          <Text style={[s.compactHeaderSub, { color: colors.mutedForeground }]}>
            Her çagyrylana bonus — ikimize!
          </Text>
        </View>

        {/* Feature rows */}
        {[
          {
            icon: "gift-outline" as IoniconsName,
            title: "1 BP bonus — ikimize",
            desc: "Tanyşyň goşulsa, ikimiz hem bonus alýarys",
            color: "#f59e0b",
          },
          {
            icon: "shield-checkmark-outline" as IoniconsName,
            title: "Abraý ýokarlanýar",
            desc: "Her çakylan tanyş abraý balyňy artdyrýar",
            color: colors.primary,
          },
          {
            icon: "flash-outline" as IoniconsName,
            title: "Çalt paýlaşmak",
            desc: "WhatsApp, Telegram, SMS — bir basymda",
            color: "#22c55e",
          },
        ].map((item, i) => (
          <View
            key={i}
            style={[s.featureRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[s.featureIcon, { backgroundColor: item.color + "18" }]}>
              <Ionicons name={item.icon} size={18} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.featureTitle, { color: colors.foreground }]}>{item.title}</Text>
              <Text style={[s.featureDesc, { color: colors.mutedForeground }]}>{item.desc}</Text>
            </View>
          </View>
        ))}

        {/* Premium invite button */}
        <View style={[s.btnWrap, { marginTop: 16 }]}>
          <Pressable
            onPress={handleShareAndFinish}
            disabled={sharing || saving}
            style={{ opacity: sharing || saving ? 0.8 : 1 }}
          >
            <Animated.View style={[inviteAnimStyle, invitePulseStyle]}>
              <LinearGradient
                colors={[colors.primary, colors.primary + "cc"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.inviteBtn}
              >
                {/* Shimmer overlay */}
                <View style={s.inviteBtnShimmer} />
                <Ionicons name="people" size={20} color="#fff" />
                <Text style={s.inviteBtnText}>
                  {sharing ? "Paýlaşylýar..." : "🎉 Ýakynlarymy çagyr — bonus gazan!"}
                </Text>
                <Ionicons name="arrow-forward" size={17} color="rgba(255,255,255,0.8)" />
              </LinearGradient>
            </Animated.View>
          </Pressable>

          <Pressable onPress={handleFinish} style={s.skipBtn}>
            <Text style={[s.skipText, { color: colors.mutedForeground }]}>
              Çakyryşsyz tamamla
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={[s.header, { paddingTop: (isWeb ? 0 : insets.top) + 14 }]}
      >
        {step > 0 && (
          <Pressable onPress={() => goToStep(step - 1)} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
        )}
        <View style={{ flex: 1, marginLeft: step > 0 ? 12 : 0 }}>
          <Text style={s.headerTitle}>Ulgama Girmek</Text>
          <Text style={s.headerSub}>{STEP_SUBTITLES[step]}</Text>
        </View>
        <View style={[s.stepBadge, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
          <Text style={s.stepBadgeText}>{step + 1} / {TOTAL_STEPS}</Text>
        </View>
      </LinearGradient>

      <View style={[s.progressBg, { backgroundColor: colors.border }]}>
        <Animated.View style={[s.progressFill, { backgroundColor: colors.primary }, progressStyle]} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}
      >
        {step === 0 && renderStep1()}
        {step === 1 && renderStep2()}
        {step === 2 && renderStep3()}
        {step === 3 && renderStep4()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 19, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.72)", fontSize: 11, marginTop: 1 },
  stepBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  stepBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  progressBg: { height: 3, width: "100%" },
  progressFill: { height: 3, borderRadius: 2 },

  content: { padding: 18 },

  // Compact header (replaces large stepCard)
  compactHeader: {
    alignItems: "center",
    paddingVertical: 16,
    marginBottom: 18,
  },
  compactHeaderIcon: {
    width: 56, height: 56, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    marginBottom: 10,
  },
  compactHeaderTitle: {
    fontSize: 20, fontWeight: "800", marginBottom: 3, textAlign: "center",
  },
  compactHeaderSub: {
    fontSize: 13, textAlign: "center",
  },

  fieldLabel: {
    fontSize: 12, fontWeight: "700", letterSpacing: 0.3,
    marginBottom: 7, marginTop: 2, textTransform: "uppercase",
  },

  // Animated social buttons
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  socialIconBox: {
    width: 42, height: 42, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
  },
  socialBtnTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  socialBtnSub:   { fontSize: 12 },
  checkCircle: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
  },
  emptyCircle: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5,
  },

  // Phone
  phoneRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 12, borderWidth: 1.5, marginBottom: 14, overflow: "hidden",
  },
  phonePrefix: {
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    borderRightWidth: 1.5,
  },
  phonePrefixText: { fontSize: 15, fontWeight: "600" },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    fontSize: 16, letterSpacing: 1,
  },

  otpInfoRow: {
    flexDirection: "row", alignItems: "center", gap: 7,
    borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 12,
  },
  otpInfoText: { fontSize: 12, fontWeight: "600", flex: 1 },
  otpInput: {
    letterSpacing: 6, fontSize: 20, fontWeight: "700", textAlign: "center",
  },

  // Divider
  divider: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 12 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { fontSize: 12, fontWeight: "600" },

  // Already have account
  alreadyHaveAccount: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, marginTop: 16, paddingVertical: 10,
  },
  alreadyHaveAccountText: { fontSize: 14, fontWeight: "600" },

  // Username
  usernameRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 12, borderWidth: 1.5, marginBottom: 14, overflow: "hidden",
  },
  atPrefix: {
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    borderRightWidth: 1.5,
  },
  atText: { fontSize: 17, fontWeight: "800" },
  usernameInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    fontSize: 15, letterSpacing: 0.5,
  },
  usernameHint: { fontSize: 11, marginTop: -10, marginBottom: 12, marginLeft: 2 },

  // Location row (side by side)
  locationRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  locationBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderRadius: 12, borderWidth: 1.5,
    paddingHorizontal: 12, paddingVertical: Platform.OS === "ios" ? 14 : 12,
  },
  locationBtnText: { fontSize: 13, flex: 1 },

  // Inputs
  input: {
    borderRadius: 12, borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    fontSize: 15, marginBottom: 14,
  },
  selectBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderRadius: 12, borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    marginBottom: 14,
  },
  selectBtnText: { fontSize: 15 },

  // Profession grid
  karGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  karCard: {
    width: "47%", flexDirection: "row", alignItems: "center",
    gap: 8, borderRadius: 13, borderWidth: 1.5, padding: 12,
    position: "relative",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  karLabel: { fontSize: 12, fontWeight: "600", flex: 1 },
  karCheck: {
    position: "absolute", top: 7, right: 7,
    width: 15, height: 15, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },

  bioInput: { height: 90, paddingTop: 12 },
  charCount: { fontSize: 11, textAlign: "right", marginTop: -8, marginBottom: 12 },
  bioTip: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: 12, paddingVertical: 9,
    borderRadius: 10, borderWidth: 1, marginBottom: 8,
  },
  bioTipText: { fontSize: 12, fontWeight: "500", flex: 1, lineHeight: 17 },

  // Feature rows (step 4)
  featureRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 13, marginBottom: 9,
    shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  featureIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  featureTitle: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  featureDesc:  { fontSize: 11, lineHeight: 17 },

  // Premium invite button
  inviteBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 17, paddingHorizontal: 20,
    borderRadius: 18, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  inviteBtnShimmer: {
    position: "absolute", top: 0, left: 0, right: 0,
    height: "50%",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderTopLeftRadius: 18, borderTopRightRadius: 18,
  },
  inviteBtnText: {
    color: "#fff", fontSize: 15, fontWeight: "800", flex: 1, textAlign: "center",
  },

  btnWrap: { marginTop: 4 },
  retryBtn: { alignItems: "center", paddingVertical: 10 },
  retryText: { fontSize: 13 },
  skipBtn: { alignItems: "center", paddingVertical: 12 },
  skipText: { fontSize: 14 },
});

const sm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 8, paddingHorizontal: 0, maxHeight: "70%",
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 12, marginTop: 4 },
  title: { fontSize: 17, fontWeight: "800", paddingHorizontal: 20, paddingBottom: 12 },
  item: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemText: { fontSize: 15 },
});
