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
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";
import { saveUserProfile } from "@/lib/firebase";
import { PessimisticButton } from "@/components/PessimisticButton";

WebBrowser.maybeCompleteAuthSession();

// Google Web Client ID — Firebase Console → Authentication → Sign-in method → Google → Web SDK configuration → Web client ID
const GOOGLE_WEB_CLIENT_ID = "405972999183-PLACEHOLDER.apps.googleusercontent.com";

// ─── Konstantalar ─────────────────────────────────────────────────────────────

const TOTAL_STEPS = 4;
const { width: SCREEN_W } = Dimensions.get("window");

const STEP_SUBTITLES = [
  "Hasaby açmak üçin usuly saýlaň",
  "Şahsy maglumatlaryňyz",
  "Hünär maglumatlaryňyz",
  "Ynamdar adamlar toruňyz",
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

// ─── SelectModal ──────────────────────────────────────────────────────────────

interface SelectModalProps {
  visible: boolean;
  title: string;
  items: { id: string; label: string }[];
  selectedId: string;
  onSelect: (id: string, label: string) => void;
  onClose: () => void;
}

function SelectModal({
  visible,
  title,
  items,
  selectedId,
  onSelect,
  onClose,
}: SelectModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={sm.overlay} onPress={onClose}>
        <Pressable
          style={[
            sm.sheet,
            { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 },
          ]}
          onPress={() => {}}
        >
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
                  <Text
                    style={[
                      sm.itemText,
                      { color: isSelected ? colors.primary : colors.foreground },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Esasy ekran ──────────────────────────────────────────────────────────────

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { deviceId } = useBonusPul();

  // ── Google OAuth ──
  const [googleLoading, setGoogleLoading] = useState(false);
  const [_request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    scopes: ["openid", "profile", "email"],
  });

  // ── Ädim nawigasiýasy ──
  const [step, setStep] = useState(0);
  const progressAnim = useSharedValue(1 / TOTAL_STEPS);

  const progressStyle = useAnimatedStyle(() => ({
    width: progressAnim.value * SCREEN_W,
  }));

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

  // ── Google OAuth handlers (goToStep declared above) ──
  const handleGoogleSuccess = useCallback(
    async (accessToken: string) => {
      try {
        const res = await fetch("https://www.googleapis.com/userinfo/v2/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const info = await res.json() as {
          email?: string; given_name?: string; family_name?: string;
        };
        if (info.email) setEmail(info.email);
        if (info.given_name) setName(info.given_name);
        if (info.family_name) setSurname(info.family_name);
        setLoginMethod("google");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        goToStep(1);
      } catch {
        setGoogleLoading(false);
      }
    },
    [goToStep]
  );

  useEffect(() => {
    if (response?.type === "success") {
      const token = response.authentication?.accessToken;
      if (token) handleGoogleSuccess(token);
      else setGoogleLoading(false);
    } else if (response?.type === "error" || response?.type === "cancel") {
      setGoogleLoading(false);
    }
  }, [response, handleGoogleSuccess]);

  const handleGooglePress = useCallback(async () => {
    setGoogleLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await promptAsync();
  }, [promptAsync]);

  // ── 1-ädim: Giriş usuly ──
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

  // ── 1-ädim: Telefon + OTP ──
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

  // ── 2-ädim: Şahsy maglumatlar ──
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [welaýatId, setWelaýatId] = useState("");
  const [welaýatLabel, setWelaýatLabel] = useState("");
  const [tumanId, setTumanId] = useState("");
  const [tumanLabel, setTumanLabel] = useState("");
  const [showWelaýat, setShowWelaýat] = useState(false);
  const [showTuman, setShowTuman] = useState(false);
  const surnameRef = useRef<TextInput>(null);

  const tumanItems = welaýatId ? (TUMANLAR[welaýatId] ?? []) : [];

  const handleWelaýatSelect = useCallback(
    (id: string, label: string) => {
      setWelaýatId(id);
      setWelaýatLabel(label);
      setTumanId("");
      setTumanLabel("");
    },
    []
  );

  const step2Valid =
    name.trim().length > 0 &&
    surname.trim().length > 0 &&
    welaýatId.length > 0 &&
    tumanId.length > 0;

  // ── 3-ädim: Hünär maglumatlar ──
  const [profession, setProfession] = useState("");
  const [bio, setBio] = useState("");

  // ── 4-ädim: Ynamdar adamlar + Saklamak ──
  const [saving, setSaving] = useState(false);

  const handleFinish = useCallback(async () => {
    if (!deviceId || saving) return;
    setSaving(true);
    try {
      const contact = loginMethod === "phone"
        ? phone.replace(/\s/g, "")
        : email.trim();
      await saveUserProfile(deviceId, {
        name: name.trim(),
        surname: surname.trim(),
        phone: contact,
        region: welaýatLabel,
        district: tumanLabel,
        profession,
        bio: bio.trim(),
      });
      router.replace("/(tabs)");
    } catch {
      setSaving(false);
    }
  }, [
    deviceId,
    saving,
    loginMethod,
    name,
    surname,
    phone,
    email,
    welaýatLabel,
    tumanLabel,
    profession,
    bio,
  ]);

  // ─── Stil kömekçileri ──────────────────────────────────────────────────────

  const inputStyle = [
    s.input,
    {
      backgroundColor: colors.input,
      borderColor: colors.border,
      color: colors.foreground,
    },
  ];

  const sectionTitle = (text: string) => (
    <Text style={[s.sectionTitle, { color: colors.foreground }]}>{text}</Text>
  );

  // ─── 1-ädim mazmuny ───────────────────────────────────────────────────────

  function renderStep1() {
    return (
      <Animated.View
        key="step-1"
        entering={FadeInDown.duration(320).easing(Easing.out(Easing.quad))}
        exiting={FadeOutUp.duration(180).easing(Easing.in(Easing.quad))}
      >
        {/* Header card */}
        <View style={s.stepCard}>
          <View style={[s.stepIconWrap, { backgroundColor: colors.primary + "15" }]}>
            <Ionicons name="shield-checkmark-outline" size={32} color={colors.primary} />
          </View>
          <Text style={[s.stepCardTitle, { color: colors.foreground }]}>
            Hasaby açmak
          </Text>
          <Text style={[s.stepCardDesc, { color: colors.mutedForeground }]}>
            Aşakdaky usullaryň birini saýlaň
          </Text>
        </View>

        {/* ── Social buttons ── */}
        <Pressable
          onPress={handleGooglePress}
          disabled={googleLoading}
          style={({ pressed }) => [
            s.socialBtn,
            {
              backgroundColor: loginMethod === "google"
                ? "#EA4335" + "15"
                : colors.card,
              borderColor: loginMethod === "google" ? "#EA4335" : colors.border,
              opacity: pressed || googleLoading ? 0.7 : 1,
            },
          ]}
        >
          <View style={[s.socialIconBox, { backgroundColor: "#EA4335" + "18" }]}>
            <AntDesign name="google" size={20} color="#EA4335" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.socialBtnTitle, { color: colors.foreground }]}>
              {googleLoading ? "Açylýar..." : "Google bilen dowam et"}
            </Text>
            <Text style={[s.socialBtnSub, { color: colors.mutedForeground }]}>
              Gmail salgyňyz bilen
            </Text>
          </View>
          {googleLoading
            ? <Ionicons name="reload-outline" size={20} color="#EA4335" />
            : loginMethod === "google"
              ? <Ionicons name="checkmark-circle" size={20} color="#EA4335" />
              : null
          }
        </Pressable>

        <Pressable
          onPress={() => handleSelectMethod("mailru")}
          style={({ pressed }) => [
            s.socialBtn,
            {
              backgroundColor: loginMethod === "mailru"
                ? "#005FF9" + "15"
                : colors.card,
              borderColor: loginMethod === "mailru" ? "#005FF9" : colors.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <View style={[s.socialIconBox, { backgroundColor: "#005FF9" + "18" }]}>
            <Ionicons name="mail" size={20} color="#005FF9" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.socialBtnTitle, { color: colors.foreground }]}>
              Mail.ru bilen dowam et
            </Text>
            <Text style={[s.socialBtnSub, { color: colors.mutedForeground }]}>
              Mail.ru ýa-da @mail.ru
            </Text>
          </View>
          {loginMethod === "mailru" && (
            <Ionicons name="checkmark-circle" size={20} color="#005FF9" />
          )}
        </Pressable>

        {/* Email input (shown for google/mailru) */}
        {loginMethod !== "phone" && (
          <Animated.View entering={FadeInDown.duration(260)} style={{ marginTop: 4 }}>
            {sectionTitle(
              loginMethod === "google"
                ? "Gmail salgyňyz"
                : "Mail.ru salgyňyz"
            )}
            <TextInput
              ref={emailRef}
              style={[
                ...inputStyle,
                { borderColor: emailValid ? colors.primary : colors.border },
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder={
                loginMethod === "google"
                  ? "mysal@gmail.com"
                  : "mysal@mail.ru"
              }
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleEmailContinue}
            />
            <View style={s.btnWrap}>
              <PessimisticButton
                label="Dowam et"
                disabled={!emailValid}
                onPress={handleEmailContinue}
                icon="arrow-forward-outline"
              />
            </View>
          </Animated.View>
        )}

        {/* Divider */}
        <View style={s.divider}>
          <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[s.dividerText, { color: colors.mutedForeground }]}>
            ýa-da telefon bilen
          </Text>
          <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Phone button (tap to switch) */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setLoginMethod("phone");
            setEmail("");
          }}
          style={({ pressed }) => [
            s.socialBtn,
            {
              backgroundColor: loginMethod === "phone"
                ? colors.primary + "12"
                : colors.card,
              borderColor: loginMethod === "phone" ? colors.primary : colors.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <View style={[s.socialIconBox, { backgroundColor: colors.primary + "18" }]}>
            <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.socialBtnTitle, { color: colors.foreground }]}>
              Telefon belgisi bilen
            </Text>
            <Text style={[s.socialBtnSub, { color: colors.mutedForeground }]}>
              +993 TM nomer
            </Text>
          </View>
          {loginMethod === "phone" && (
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          )}
        </Pressable>

        {/* Phone + OTP section (shown only when phone method selected) */}
        {loginMethod === "phone" && (
          <Animated.View entering={FadeInDown.duration(260)} style={{ marginTop: 4 }}>
            {sectionTitle("Telefon belgisi")}
            <View
              style={[
                s.phoneRow,
                { backgroundColor: colors.input, borderColor: colors.border },
              ]}
            >
              <View style={[s.phonePrefix, { borderRightColor: colors.border }]}>
                <Text style={[s.phonePrefixText, { color: colors.mutedForeground }]}>
                  +993
                </Text>
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
              <Animated.View entering={FadeInDown.duration(280)} style={s.otpSection}>
                <View
                  style={[
                    s.otpInfoRow,
                    { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" },
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                  <Text style={[s.otpInfoText, { color: colors.primary }]}>
                    +993 {phone} belgisine SMS iberildi
                  </Text>
                </View>

                {sectionTitle("SMS kody")}
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

                <Pressable
                  onPress={() => { setOtpSent(false); setOtp(""); }}
                  style={s.retryBtn}
                >
                  <Text style={[s.retryText, { color: colors.mutedForeground }]}>
                    Belgimi üýtget
                  </Text>
                </Pressable>
              </Animated.View>
            )}
          </Animated.View>
        )}
      </Animated.View>
    );
  }

  // ─── 2-ädim mazmuny ───────────────────────────────────────────────────────

  function renderStep2() {
    return (
      <Animated.View
        key="step-2"
        entering={FadeInDown.duration(320).easing(Easing.out(Easing.quad))}
        exiting={FadeOutUp.duration(180).easing(Easing.in(Easing.quad))}
      >
        <View style={s.stepCard}>
          <View
            style={[
              s.stepIconWrap,
              { backgroundColor: colors.primary + "15" },
            ]}
          >
            <Ionicons name="person-outline" size={32} color={colors.primary} />
          </View>
          <Text style={[s.stepCardTitle, { color: colors.foreground }]}>
            Şahsy maglumatlar
          </Text>
          <Text style={[s.stepCardDesc, { color: colors.mutedForeground }]}>
            Bu maglumatlar profiliňizde görkezilendir
          </Text>
        </View>

        {sectionTitle("Adyňyz")}
        <TextInput
          style={inputStyle}
          value={name}
          onChangeText={setName}
          placeholder="Mysal: Merdan"
          placeholderTextColor={colors.mutedForeground}
          returnKeyType="next"
          onSubmitEditing={() => surnameRef.current?.focus()}
          autoCapitalize="words"
        />

        {sectionTitle("Familiýaňyz")}
        <TextInput
          ref={surnameRef}
          style={inputStyle}
          value={surname}
          onChangeText={setSurname}
          placeholder="Mysal: Durdyýew"
          placeholderTextColor={colors.mutedForeground}
          returnKeyType="done"
          autoCapitalize="words"
        />

        {sectionTitle("Welaýat")}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowWelaýat(true);
          }}
          style={[
            s.selectBtn,
            {
              backgroundColor: colors.input,
              borderColor: welaýatId ? colors.primary : colors.border,
            },
          ]}
        >
          <Text
            style={[
              s.selectBtnText,
              { color: welaýatId ? colors.foreground : colors.mutedForeground },
            ]}
          >
            {welaýatLabel || "Welaýaty saýlaň"}
          </Text>
          <Ionicons
            name="chevron-down"
            size={18}
            color={colors.mutedForeground}
          />
        </Pressable>

        {sectionTitle("Tuman / Şäher")}
        <Pressable
          onPress={() => {
            if (!welaýatId) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowTuman(true);
          }}
          style={[
            s.selectBtn,
            {
              backgroundColor: !welaýatId ? colors.muted : colors.input,
              borderColor: tumanId ? colors.primary : colors.border,
              opacity: !welaýatId ? 0.5 : 1,
            },
          ]}
        >
          <Text
            style={[
              s.selectBtnText,
              { color: tumanId ? colors.foreground : colors.mutedForeground },
            ]}
          >
            {tumanLabel || (welaýatId ? "Tumany saýlaň" : "Ilki welaýat saýlaň")}
          </Text>
          <Ionicons
            name="chevron-down"
            size={18}
            color={colors.mutedForeground}
          />
        </Pressable>

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
          onSelect={(id, label) => {
            setTumanId(id);
            setTumanLabel(label);
          }}
          onClose={() => setShowTuman(false)}
        />
      </Animated.View>
    );
  }

  // ─── 3-ädim mazmuny ───────────────────────────────────────────────────────

  function renderStep3() {
    return (
      <Animated.View
        key="step-3"
        entering={FadeInDown.duration(320).easing(Easing.out(Easing.quad))}
        exiting={FadeOutUp.duration(180).easing(Easing.in(Easing.quad))}
      >
        <View style={s.stepCard}>
          <View
            style={[
              s.stepIconWrap,
              { backgroundColor: colors.primary + "15" },
            ]}
          >
            <Ionicons name="briefcase-outline" size={32} color={colors.primary} />
          </View>
          <Text style={[s.stepCardTitle, { color: colors.foreground }]}>
            Hünär maglumatlar
          </Text>
          <Text style={[s.stepCardDesc, { color: colors.mutedForeground }]}>
            Käriňizi saýlaň we özüňiz hakda gysga ýazyň
          </Text>
        </View>

        {sectionTitle("Käriňiz")}
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
                    backgroundColor: isSelected
                      ? colors.primary + "15"
                      : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={kar.icon}
                  size={22}
                  color={isSelected ? colors.primary : colors.mutedForeground}
                />
                <Text
                  style={[
                    s.karLabel,
                    {
                      color: isSelected
                        ? colors.primary
                        : colors.foreground,
                    },
                  ]}
                >
                  {kar.label}
                </Text>
                {isSelected && (
                  <View
                    style={[
                      s.karCheck,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Ionicons name="checkmark" size={10} color="#fff" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {sectionTitle("Özüňiz hakda (islege bagly)")}
        <TextInput
          style={[...inputStyle, s.bioInput]}
          value={bio}
          onChangeText={(t) => setBio(t.slice(0, 200))}
          placeholder="Gysga tanytma ýazyň..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Text style={[s.charCount, { color: colors.mutedForeground }]}>
          {bio.length} / 200
        </Text>

        <View style={s.btnWrap}>
          <PessimisticButton
            label="Dowam et"
            disabled={!profession}
            onPress={() => goToStep(3)}
            icon="arrow-forward-outline"
          />
        </View>
      </Animated.View>
    );
  }

  // ─── 4-ädim mazmuny ───────────────────────────────────────────────────────

  function renderStep4() {
    return (
      <Animated.View
        key="step-4"
        entering={FadeInDown.duration(320).easing(Easing.out(Easing.quad))}
        exiting={FadeOutUp.duration(180).easing(Easing.in(Easing.quad))}
      >
        <View style={s.stepCard}>
          <View
            style={[
              s.stepIconWrap,
              { backgroundColor: colors.primary + "15" },
            ]}
          >
            <Ionicons name="people-outline" size={32} color={colors.primary} />
          </View>
          <Text style={[s.stepCardTitle, { color: colors.foreground }]}>
            Ynamdar adamlar toruňyz
          </Text>
          <Text style={[s.stepCardDesc, { color: colors.mutedForeground }]}>
            Ynamdar adamlaryňyz bilen has uly ynamlylyga eýe boluň
          </Text>
        </View>

        {[
          {
            icon: "shield-checkmark-outline" as IoniconsName,
            title: "Abraý artýar",
            desc: "Ynamdar adamlaryňyz sizi tassyklasa, abraý balyňyz ýokarlanýar.",
          },
          {
            icon: "lock-closed-outline" as IoniconsName,
            title: "Howpsuz amallar",
            desc: "Uly möçberli P2P amallar üçin ynamdar tor hökman bolýar.",
          },
          {
            icon: "notifications-outline" as IoniconsName,
            title: "Öz wagtynda habarlar",
            desc: "Toruňyzdaky adamlar amal habarnamalarynda ilki görkezilýär.",
          },
        ].map((item, i) => (
          <View
            key={i}
            style={[
              s.featureRow,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                s.featureIcon,
                { backgroundColor: colors.primary + "15" },
              ]}
            >
              <Ionicons name={item.icon} size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.featureTitle, { color: colors.foreground }]}>
                {item.title}
              </Text>
              <Text style={[s.featureDesc, { color: colors.mutedForeground }]}>
                {item.desc}
              </Text>
            </View>
          </View>
        ))}

        <View style={[s.btnWrap, { gap: 10 }]}>
          <PessimisticButton
            label="Hasaby açyp tamamla"
            loading={saving}
            onPress={handleFinish}
            icon="checkmark-circle-outline"
          />
          <Pressable
            onPress={handleFinish}
            disabled={saving}
            style={s.skipBtn}
          >
            <Text style={[s.skipText, { color: colors.mutedForeground }]}>
              Geçmek
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Gradient sarlavha */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={[s.header, { paddingTop: (isWeb ? 0 : insets.top) + 14 }]}
      >
        {step > 0 && (
          <Pressable
            onPress={() => goToStep(step - 1)}
            style={s.backBtn}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
        )}
        <View style={{ flex: 1, marginLeft: step > 0 ? 12 : 0 }}>
          <Text style={s.headerTitle}>Ulgama Girmek</Text>
          <Text style={s.headerSub}>{STEP_SUBTITLES[step]}</Text>
        </View>
        <View
          style={[
            s.stepBadge,
            { backgroundColor: "rgba(255,255,255,0.18)" },
          ]}
        >
          <Text style={s.stepBadgeText}>
            {step + 1} / {TOTAL_STEPS}
          </Text>
        </View>
      </LinearGradient>

      {/* Progress bar */}
      <View style={[s.progressBg, { backgroundColor: colors.border }]}>
        <Animated.View
          style={[
            s.progressFill,
            { backgroundColor: colors.primary },
            progressStyle,
          ]}
        />
      </View>

      {/* Mazmun */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          s.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
      >
        {step === 0 && renderStep1()}
        {step === 1 && renderStep2()}
        {step === 2 && renderStep3()}
        {step === 3 && renderStep4()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Stiller ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  headerSub: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    marginTop: 2,
  },
  stepBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  stepBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  progressBg: {
    height: 3,
    width: "100%",
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },

  content: {
    padding: 20,
  },

  stepCard: {
    alignItems: "center",
    paddingVertical: 24,
    marginBottom: 24,
  },
  stepIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  stepCardTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
    textAlign: "center",
  },
  stepCardDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 4,
  },

  input: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    fontSize: 15,
    marginBottom: 16,
  },

  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 16,
    overflow: "hidden",
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
    fontSize: 16,
    letterSpacing: 1,
  },

  otpSection: { marginTop: 4 },
  otpInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  otpInfoText: { fontSize: 13, fontWeight: "600", flex: 1 },
  otpInput: {
    letterSpacing: 6,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },

  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    marginBottom: 16,
  },
  selectBtnText: { fontSize: 15 },

  karGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  karCard: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  karLabel: { fontSize: 13, fontWeight: "600", flex: 1 },
  karCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  bioInput: {
    height: 100,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 11,
    textAlign: "right",
    marginTop: -10,
    marginBottom: 16,
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 3,
  },
  featureDesc: {
    fontSize: 12,
    lineHeight: 18,
  },

  btnWrap: { marginTop: 8 },

  retryBtn: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 4,
  },
  retryText: { fontSize: 14 },

  skipBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  skipText: { fontSize: 14 },

  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  socialIconBox: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  socialBtnTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  socialBtnSub: {
    fontSize: 12,
  },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

// ─── SelectModal stilleri ─────────────────────────────────────────────────────

const sm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingHorizontal: 0,
    maxHeight: "70%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
    marginTop: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemText: { fontSize: 15 },
});
