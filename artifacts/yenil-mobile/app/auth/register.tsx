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
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
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
  setUserAvatar,
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

  // ── Step 2: avatar ──
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const pickAvatar = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.45, base64: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const dataUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
    setAvatarUploading(true);
    setAvatarUri(dataUri);
    await AsyncStorage.setItem("@yenil_avatar", dataUri).catch(() => {});
    setAvatarUploading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

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
        if (avatarUri) { await setUserAvatar(deviceId, avatarUri).catch(() => {}); }
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
        {/* Inline header */}
        <View style={s.step3Header}>
          <LinearGradient colors={[colors.primary + "22", colors.primary + "08"]} style={s.step3HeaderIcon}>
            <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={[s.step3Title, { color: colors.foreground }]}>Ýeňile goşulyň</Text>
            <Text style={[s.step3Sub, { color: colors.mutedForeground }]}>Giriş usulyny saýlaň</Text>
          </View>
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
                ? [colors.primary, colors.primary + "dd"]
                : [colors.card, colors.card]}
              style={[
                s.socialBtn,
                {
                  borderColor: loginMethod === "phone" ? colors.primary : colors.border,
                  borderWidth: loginMethod === "phone" ? 2 : 1.5,
                  shadowColor: loginMethod === "phone" ? colors.primary : "#000",
                  shadowOpacity: loginMethod === "phone" ? 0.35 : 0.06,
                  shadowRadius: loginMethod === "phone" ? 14 : 4,
                  shadowOffset: { width: 0, height: loginMethod === "phone" ? 5 : 2 },
                  elevation: loginMethod === "phone" ? 10 : 2,
                },
              ]}
            >
              <View style={[
                s.socialIconBox,
                { backgroundColor: loginMethod === "phone" ? "rgba(255,255,255,0.22)" : colors.primary + "20" },
              ]}>
                <Ionicons name="phone-portrait-outline" size={20} color={loginMethod === "phone" ? "#fff" : colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.socialBtnTitle, { color: loginMethod === "phone" ? "#fff" : colors.foreground }]}>Telefon belgisi bilen</Text>
                <Text style={[s.socialBtnSub, { color: loginMethod === "phone" ? "rgba(255,255,255,0.75)" : colors.mutedForeground }]}>+993 TM nomer · Iň çalt usul</Text>
              </View>
              {loginMethod === "phone" ? (
                <Animated.View entering={FadeInDown.duration(200)}>
                  <View style={[s.checkCircle, { backgroundColor: "rgba(255,255,255,0.3)" }]}>
                    <Ionicons name="checkmark" size={15} color="#fff" />
                  </View>
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
              colors={loginMethod === "google" ? ["#EA4335", "#c0392b"] : [colors.card, colors.card]}
              style={[
                s.socialBtn,
                {
                  borderColor: loginMethod === "google" ? "#EA4335" : colors.border,
                  borderWidth: loginMethod === "google" ? 2 : 1.5,
                  shadowColor: loginMethod === "google" ? "#EA4335" : "#000",
                  shadowOpacity: loginMethod === "google" ? 0.35 : 0.06,
                  shadowRadius: loginMethod === "google" ? 14 : 4,
                  shadowOffset: { width: 0, height: loginMethod === "google" ? 5 : 2 },
                  elevation: loginMethod === "google" ? 10 : 2,
                },
              ]}
            >
              <View style={[s.socialIconBox, { backgroundColor: loginMethod === "google" ? "rgba(255,255,255,0.22)" : "#EA4335" + "20" }]}>
                <AntDesign name="google" size={20} color={loginMethod === "google" ? "#fff" : "#EA4335"} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.socialBtnTitle, { color: loginMethod === "google" ? "#fff" : colors.foreground }]}>Google bilen dowam et</Text>
                <Text style={[s.socialBtnSub, { color: loginMethod === "google" ? "rgba(255,255,255,0.75)" : colors.mutedForeground }]}>Gmail salgyňyz bilen</Text>
              </View>
              {loginMethod === "google" ? (
                <Animated.View entering={FadeInDown.duration(200)}>
                  <View style={[s.checkCircle, { backgroundColor: "rgba(255,255,255,0.3)" }]}>
                    <Ionicons name="checkmark" size={15} color="#fff" />
                  </View>
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
              colors={loginMethod === "mailru" ? ["#005FF9", "#0047cc"] : [colors.card, colors.card]}
              style={[
                s.socialBtn,
                {
                  borderColor: loginMethod === "mailru" ? "#005FF9" : colors.border,
                  borderWidth: loginMethod === "mailru" ? 2 : 1.5,
                  shadowColor: loginMethod === "mailru" ? "#005FF9" : "#000",
                  shadowOpacity: loginMethod === "mailru" ? 0.35 : 0.06,
                  shadowRadius: loginMethod === "mailru" ? 14 : 4,
                  shadowOffset: { width: 0, height: loginMethod === "mailru" ? 5 : 2 },
                  elevation: loginMethod === "mailru" ? 10 : 2,
                },
              ]}
            >
              <View style={[s.socialIconBox, { backgroundColor: loginMethod === "mailru" ? "rgba(255,255,255,0.22)" : "#005FF9" + "20" }]}>
                <Ionicons name="mail" size={20} color={loginMethod === "mailru" ? "#fff" : "#005FF9"} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.socialBtnTitle, { color: loginMethod === "mailru" ? "#fff" : colors.foreground }]}>Mail.ru bilen dowam et</Text>
                <Text style={[s.socialBtnSub, { color: loginMethod === "mailru" ? "rgba(255,255,255,0.75)" : colors.mutedForeground }]}>Mail.ru ýa-da @mail.ru</Text>
              </View>
              {loginMethod === "mailru" ? (
                <Animated.View entering={FadeInDown.duration(200)}>
                  <View style={[s.checkCircle, { backgroundColor: "rgba(255,255,255,0.3)" }]}>
                    <Ionicons name="checkmark" size={15} color="#fff" />
                  </View>
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
    const displayInitial = (username || fullName || "Ý").slice(0, 1).toUpperCase();
    return (
      <Animated.View
        key="step-2"
        entering={FadeInDown.duration(300).easing(Easing.out(Easing.quad))}
        exiting={FadeOutUp.duration(160).easing(Easing.in(Easing.quad))}
      >
        {/* Inline header */}
        <View style={s.step3Header}>
          <LinearGradient colors={[colors.primary + "22", colors.primary + "08"]} style={s.step3HeaderIcon}>
            <Ionicons name="person-outline" size={22} color={colors.primary} />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={[s.step3Title, { color: colors.foreground }]}>Şahsy maglumatlar</Text>
            <Text style={[s.step3Sub, { color: colors.mutedForeground }]}>Profiliňiz üçin</Text>
          </View>
        </View>

        {/* ── Avatar upload ── */}
        <View style={s.avatarSection}>
          <Pressable onPress={pickAvatar} style={s.avatarPickWrap}>
            <LinearGradient
              colors={[colors.primary + "40", colors.primary + "18"]}
              style={s.avatarPickCircle}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={s.avatarPickImg} contentFit="cover" />
              ) : (
                <Text style={[s.avatarPickInitial, { color: colors.primary }]}>{displayInitial}</Text>
              )}
            </LinearGradient>
            <LinearGradient
              colors={[colors.primary, colors.primary + "dd"]}
              style={s.avatarPickCamera}
            >
              {avatarUploading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="camera" size={14} color="#fff" />}
            </LinearGradient>
          </Pressable>
          <Text style={[s.avatarPickLabel, { color: colors.mutedForeground }]}>
            {avatarUri ? "Suraty üýtgetmek" : "Profil suraty goş"}
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

  function KarChip({ kar }: { kar: typeof KARLER[0] }) {
    const isSelected = profession === kar.id;
    const scale = useSharedValue(1);
    const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    function handlePress() {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scale.value = withSequence(
        withSpring(0.88, { damping: 14, stiffness: 500 }),
        withSpring(1.0, { damping: 10, stiffness: 350 }),
      );
      setProfession(kar.id);
    }

    return (
      <Pressable onPress={handlePress}>
        <Animated.View style={animStyle}>
          <LinearGradient
            colors={isSelected ? [colors.primary, colors.primary + "cc"] : [colors.card, colors.card]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[s.karChip, {
              borderColor: isSelected ? colors.primary : colors.border,
              borderWidth: isSelected ? 2 : 1.5,
              shadowColor: isSelected ? colors.primary : "transparent",
              shadowOpacity: isSelected ? 0.4 : 0,
              shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
              elevation: isSelected ? 6 : 0,
            }]}
          >
            <Ionicons name={kar.icon} size={14} color={isSelected ? "#fff" : colors.primary} />
            <Text style={[s.karChipText, { color: isSelected ? "#fff" : colors.foreground }]}>{kar.label}</Text>
            {isSelected && (
              <Animated.View entering={FadeInDown.duration(160)}>
                <Ionicons name="checkmark-circle" size={13} color="rgba(255,255,255,0.9)" />
              </Animated.View>
            )}
          </LinearGradient>
        </Animated.View>
      </Pressable>
    );
  }

  function renderStep3() {
    return (
      <Animated.View
        key="step-3"
        entering={FadeInDown.duration(300).easing(Easing.out(Easing.quad))}
        exiting={FadeOutUp.duration(160).easing(Easing.in(Easing.quad))}
      >
        {/* Compact header — smaller than default */}
        <View style={s.step3Header}>
          <LinearGradient colors={[colors.primary + "22", colors.primary + "08"]} style={s.step3HeaderIcon}>
            <Ionicons name="briefcase-outline" size={22} color={colors.primary} />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={[s.step3Title, { color: colors.foreground }]}>Hünär maglumatlar</Text>
            <Text style={[s.step3Sub, { color: colors.mutedForeground }]}>Käriňize laýyk teklifler alarys</Text>
          </View>
        </View>

        {/* Profession chips — compact wrap */}
        {label("Käriňiz")}
        <View style={s.karChipWrap}>
          {KARLER.map((kar) => <KarChip key={kar.id} kar={kar} />)}
        </View>

        {/* Bio — compact */}
        {label("Gysga tanyşdyryş (islege görä)")}
        <TextInput
          style={[...inputStyle, s.bioInput]}
          value={bio}
          onChangeText={(t) => setBio(t.slice(0, 200))}
          placeholder="Mysal: Aşgabatda sürüji, 5 ýyl tejribe..."
          placeholderTextColor={colors.mutedForeground}
          multiline numberOfLines={2} textAlignVertical="top"
        />

        {/* Persuasion tip */}
        <View style={[s.persuasionTip, { backgroundColor: "#f59e0b10", borderColor: "#f59e0b35" }]}>
          <Ionicons name="star" size={12} color="#f59e0b" />
          <Text style={[s.persuasionTipText, { color: colors.foreground }]}>
            Doly profil = <Text style={{ fontWeight: "800", color: "#f59e0b" }}>3× köp ynam</Text> — teklifler awtomatik gelýär
          </Text>
        </View>

        <View style={[s.btnWrap, { marginTop: 6 }]}>
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
        {/* Inline header */}
        <View style={s.step3Header}>
          <LinearGradient colors={[colors.primary + "22", colors.primary + "08"]} style={s.step3HeaderIcon}>
            <Ionicons name="people-outline" size={22} color={colors.primary} />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={[s.step3Title, { color: colors.foreground }]}>Ýakynlaryňy çagyr!</Text>
            <Text style={[s.step3Sub, { color: colors.mutedForeground }]}>Her çagyrylana bonus — ikimize!</Text>
          </View>
        </View>

        {/* Numbered benefit cards */}
        {[
          {
            num: "01",
            icon: "gift-outline" as IoniconsName,
            title: "1 BP bonus — ikimize",
            desc: "Tanyşyň goşulsa, ikimiz hem bonus alýarys",
            color: "#f59e0b",
            bg: "#fef3c710",
            border: "#f59e0b28",
          },
          {
            num: "02",
            icon: "trending-up-outline" as IoniconsName,
            title: "Abraý ýokarlanýar",
            desc: "Her çakylan tanyş abraý balyňy artdyrýar",
            color: colors.primary,
            bg: colors.primary + "0d",
            border: colors.primary + "28",
          },
          {
            num: "03",
            icon: "flash" as IoniconsName,
            title: "Bir basymda paýlaş",
            desc: "WhatsApp, Telegram, SMS — dessine",
            color: "#22c55e",
            bg: "#22c55e10",
            border: "#22c55e28",
          },
        ].map((item, i) => (
          <Animated.View
            key={i}
            entering={FadeInDown.duration(260).delay(i * 80)}
            style={[s.benefitCard, { backgroundColor: item.bg, borderColor: item.border }]}
          >
            {/* Number badge */}
            <View style={[s.benefitNum, { backgroundColor: item.color + "18" }]}>
              <Text style={[s.benefitNumText, { color: item.color }]}>{item.num}</Text>
            </View>
            {/* Icon */}
            <View style={[s.benefitIcon, { backgroundColor: item.color + "18" }]}>
              <Ionicons name={item.icon} size={20} color={item.color} />
            </View>
            {/* Text */}
            <View style={{ flex: 1 }}>
              <Text style={[s.benefitTitle, { color: colors.foreground }]}>{item.title}</Text>
              <Text style={[s.benefitDesc, { color: colors.mutedForeground }]}>{item.desc}</Text>
            </View>
          </Animated.View>
        ))}

        {/* Referral code preview */}
        <View style={[s.refCodeBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="link-outline" size={15} color={colors.mutedForeground} />
          <Text style={[s.refCodeText, { color: colors.mutedForeground }]}>
            Seniň çakylyş koduň: <Text style={{ color: colors.primary, fontWeight: "800" }}>ÝEŇIL-{deviceId?.slice(-5).toUpperCase()}</Text>
          </Text>
        </View>

        {/* Premium CTA */}
        <View style={[s.btnWrap, { marginTop: 12 }]}>
          <Pressable
            onPress={handleShareAndFinish}
            disabled={sharing || saving}
            style={({ pressed }) => ({ opacity: pressed || sharing || saving ? 0.85 : 1 })}
          >
            <Animated.View style={[inviteAnimStyle, invitePulseStyle]}>
              <LinearGradient
                colors={[colors.primary, "#047857"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.inviteBtn}
              >
                <View style={s.inviteBtnIconWrap}>
                  <Ionicons name="people" size={19} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.inviteBtnText}>
                    {sharing ? "Paýlaşylýar..." : "Ýakynlarymy çagyr"}
                  </Text>
                  <Text style={s.inviteBtnSub}>bonus gazan — ikimize!</Text>
                </View>
                <View style={s.inviteBtnArrow}>
                  <Ionicons name="arrow-forward" size={15} color="#fff" />
                </View>
              </LinearGradient>
            </Animated.View>
          </Pressable>

          {/* Skip — styled as conscious choice */}
          <Pressable onPress={handleFinish} style={s.skipBtn}>
            <Ionicons name="checkmark-done-outline" size={14} color={colors.mutedForeground} />
            <Text style={[s.skipText, { color: colors.mutedForeground }]}>
              Häzirlikçe geçirmek
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
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
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

  // ── Step 3 compact header ────────────────────────────────────────────────
  step3Header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, marginBottom: 12,
  },
  step3HeaderIcon: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  step3Title: { fontSize: 17, fontWeight: "800" },
  step3Sub:   { fontSize: 12, marginTop: 2 },

  // Compact profession chips (wrap row)
  karChipWrap: {
    flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14,
  },
  karChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 20, paddingVertical: 7, paddingHorizontal: 11,
  },
  karChipText: { fontSize: 13, fontWeight: "600" },

  // Bio
  bioInput: { height: 65, paddingTop: 10, marginBottom: 10 },

  // Persuasion tip
  persuasionTip: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: 11, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, marginBottom: 6,
  },
  persuasionTipText: { fontSize: 12, flex: 1, lineHeight: 17 },

  // ── Step 4 benefit cards ─────────────────────────────────────────────────
  benefitCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 16, borderWidth: 1,
    paddingVertical: 13, paddingHorizontal: 14,
    marginBottom: 9,
  },
  benefitNum: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  benefitNumText: { fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  benefitIcon: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
  },
  benefitTitle: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  benefitDesc:  { fontSize: 11, lineHeight: 16 },

  // Referral code preview
  refCodeBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 13, paddingVertical: 10,
    marginBottom: 4,
  },
  refCodeText: { fontSize: 12, flex: 1 },

  // Premium invite button
  inviteBtn: {
    flexDirection: "row", alignItems: "center",
    gap: 12, paddingVertical: 15, paddingHorizontal: 18,
    borderRadius: 20, overflow: "hidden",
    shadowColor: "#059669", shadowOpacity: 0.5, shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 }, elevation: 12,
  },
  inviteBtnIconWrap: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  inviteBtnText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  inviteBtnSub:  { color: "rgba(255,255,255,0.72)", fontSize: 11, marginTop: 1 },
  inviteBtnArrow: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },

  // Avatar picker in Step 2
  avatarSection: { alignItems: "center", paddingVertical: 16, marginBottom: 4 },
  avatarPickWrap: { position: "relative", width: 82, height: 82, marginBottom: 8 },
  avatarPickCircle: {
    width: 82, height: 82, borderRadius: 41,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  avatarPickImg: { width: 82, height: 82, borderRadius: 41 },
  avatarPickInitial: { fontSize: 30, fontWeight: "800" },
  avatarPickCamera: {
    position: "absolute", bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#fff",
  },
  avatarPickLabel: { fontSize: 12, fontWeight: "500" },

  btnWrap: { marginTop: 4 },
  retryBtn: { alignItems: "center", paddingVertical: 10 },
  retryText: { fontSize: 13 },
  skipBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 14,
  },
  skipText: { fontSize: 13, fontWeight: "500" },
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
