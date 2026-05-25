import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View, Text, StyleSheet, TextInput, Pressable, Platform,
  KeyboardAvoidingView, ScrollView, Modal, FlatList, Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withSequence,
  type SharedValue,
} from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";
import {
  getUserProfile, saveUserProfile, setUserNickname, setUserAvatar,
  getUserNickname, getUserAvatar,
} from "@/lib/firebase";
import { getLocalProfile, saveLocalProfile } from "@/lib/localProfile";
import { PessimisticButton } from "@/components/PessimisticButton";

const AVATAR_CACHE_KEY = "@yenil_avatar";

const WELAÝATLAR = [
  { id: "ashgabat", label: "Aşgabat" },
  { id: "ahal",     label: "Ahal welaýaty" },
  { id: "balkan",   label: "Balkan welaýaty" },
  { id: "dashoguz", label: "Daşoguz welaýaty" },
  { id: "lebap",    label: "Lebap welaýaty" },
  { id: "mary",     label: "Mary welaýaty" },
];

const TUMANLAR: Record<string, { id: string; label: string }[]> = {
  ashgabat: [
    { id: "buzmeyin", label: "Büzmeýin" }, { id: "berkararlyk", label: "Berkararlyk" },
    { id: "bagtyyarlyk", label: "Bagtyýarlyk" }, { id: "kopetdag", label: "Köpetdag" },
  ],
  ahal: [
    { id: "akbugday", label: "Ak bugdaý" }, { id: "anew", label: "Änew" },
    { id: "babadayhan", label: "Babadaýhan" }, { id: "baherden", label: "Bäherden" },
    { id: "gokdepe", label: "Gökdepe" }, { id: "kaka", label: "Kaka" },
    { id: "sarahs", label: "Sarahs" }, { id: "tejen", label: "Tejen" },
  ],
  balkan: [
    { id: "balkanabat", label: "Balkanabat" }, { id: "bereket", label: "Bereket" },
    { id: "etrek", label: "Etrek" }, { id: "hazar", label: "Hazar" },
    { id: "magtymguly", label: "Magtymguly" }, { id: "serdar", label: "Serdar" },
    { id: "turkmenbashy", label: "Türkmenbaşy" },
  ],
  dashoguz: [
    { id: "akdepe", label: "Akdepe" }, { id: "boldumsaz", label: "Boldumsaz" },
    { id: "dashoguz", label: "Daşoguz" }, { id: "gorogly", label: "Görogly" },
    { id: "gubadag", label: "Gubadag" }, { id: "gurbansoltan", label: "Gurbansoltan eje" },
    { id: "koneurgenc", label: "Köneürgenç" }, { id: "ruhubelent", label: "Ruhubelent" },
  ],
  lebap: [
    { id: "atamyrat", label: "Atamyrat" }, { id: "carjew", label: "Çärjew" },
    { id: "danew", label: "Dänew" }, { id: "dowletli", label: "Döwletli" },
    { id: "farap", label: "Farap" }, { id: "garabekewul", label: "Garabekewül" },
    { id: "halac", label: "Halaç" }, { id: "kerki", label: "Kerki" },
    { id: "sayat", label: "Saýat" }, { id: "turkmenabat", label: "Türkmenabat" },
  ],
  mary: [
    { id: "bayramaly", label: "Baýramaly" }, { id: "mary", label: "Mary" },
    { id: "murgap", label: "Murgap" }, { id: "oguzhan", label: "Oguzhan" },
    { id: "sakarcage", label: "Sakarçäge" }, { id: "serhetabat", label: "Serhetabat" },
    { id: "tagtabazar", label: "Tagtabazar" }, { id: "turkmengala", label: "Türkmengala" },
    { id: "yoloten", label: "Ýolöten" },
  ],
};

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const KARLER = [
  { id: "suruji",   label: "Sürüji",        icon: "car-outline" as IoniconsName },
  { id: "kuryer",   label: "Kuryer",         icon: "bicycle-outline" as IoniconsName },
  { id: "usta",     label: "Usta",           icon: "construct-outline" as IoniconsName },
  { id: "talyp",    label: "Talyp",          icon: "school-outline" as IoniconsName },
  { id: "telekeci", label: "Telekeçi",       icon: "briefcase-outline" as IoniconsName },
  { id: "mugallym", label: "Mugallym",       icon: "library-outline" as IoniconsName },
  { id: "lukman",   label: "Lukman",         icon: "medkit-outline" as IoniconsName },
  { id: "it",       label: "IT hünärmeni",   icon: "code-slash-outline" as IoniconsName },
  { id: "harby",    label: "Harby gullukçy", icon: "shield-outline" as IoniconsName },
  { id: "beyleki",  label: "Beýleki",        icon: "person-outline" as IoniconsName },
];

function SelectModal({
  visible, title, items, selectedId, onSelect, onClose,
}: {
  visible: boolean; title: string;
  items: { id: string; label: string }[];
  selectedId: string;
  onSelect: (id: string, label: string) => void;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={sm.overlay} onPress={onClose}>
        <Pressable style={[sm.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]} onPress={() => {}}>
          <View style={[sm.handle, { backgroundColor: colors.border }]} />
          <Text style={[sm.title, { color: colors.foreground }]}>{title}</Text>
          <FlatList
            data={items} keyExtractor={(i) => i.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const sel = item.id === selectedId;
              return (
                <Pressable
                  onPress={() => { onSelect(item.id, item.label); onClose(); }}
                  style={[sm.item, { borderBottomColor: colors.border }, sel && { backgroundColor: colors.primary + "12" }]}
                >
                  <Text style={[sm.itemText, { color: sel ? colors.primary : colors.foreground }]}>{item.label}</Text>
                  {sel && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                </Pressable>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function EditProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { deviceId } = useBonusPul();
  const isWeb = Platform.OS === "web";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── Fields ──
  const [avatarUri, setAvatarUri]         = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [username, setUsername]           = useState("");
  const [usernameEdited, setUsernameEdited] = useState(false);
  const [fullName, setFullName]           = useState("");
  const [welaýatId, setWelaýatId]         = useState("");
  const [welaýatLabel, setWelaýatLabel]   = useState("");
  const [tumanId, setTumanId]             = useState("");
  const [tumanLabel, setTumanLabel]       = useState("");
  const [profession, setProfession]       = useState("");
  const [professionText, setProfessionText] = useState("");
  const [bio, setBio]                     = useState("");

  // ── Phone change flow ──
  const [currentPhone, setCurrentPhone]   = useState("");
  const [changingPhone, setChangingPhone] = useState(false);
  const [newPhone, setNewPhone]           = useState("");
  const [otp, setOtp]                     = useState("");
  const [otpSent, setOtpSent]             = useState(false);
  const [sendingOtp, setSendingOtp]       = useState(false);
  const otpRef = useRef<TextInput>(null);

  // ── Modals ──
  const [showWelaýat, setShowWelaýat] = useState(false);
  const [showTuman, setShowTuman]     = useState(false);

  const tumanItems = welaýatId ? (TUMANLAR[welaýatId] ?? []) : [];
  const usernameValid = /^[a-z0-9_.]{3,20}$/.test(username.trim());

  // ── Load current profile ──
  useEffect(() => {
    if (!deviceId) return;
    Promise.all([
      getUserProfile(deviceId),
      getUserNickname(deviceId),
      AsyncStorage.getItem(AVATAR_CACHE_KEY),
    ]).then(([prof, nick, av]) => {
      const local = getLocalProfile();
      if (av) setAvatarUri(av);
      if (nick) { setUsername(nick); setUsernameEdited(true); }
      if (prof) {
        setFullName([prof.name, prof.surname].filter(Boolean).join(" "));
        setCurrentPhone(prof.phone || "");
        // Map region to welaýat ID
        const found = WELAÝATLAR.find(w => w.label === prof.region);
        if (found) { setWelaýatId(found.id); setWelaýatLabel(found.label); }
        // Map district to tuman ID
        const tumanList = found ? (TUMANLAR[found.id] ?? []) : [];
        const foundT = tumanList.find(t => t.label === prof.district);
        if (foundT) { setTumanId(foundT.id); setTumanLabel(foundT.label); }
        setProfession(prof.profession || "");
        setBio(prof.bio || "");
        if (!nick && prof.username) { setUsername(prof.username); setUsernameEdited(true); }
      }
      setLoading(false);
    }).catch(() => setLoading(false));

    getUserAvatar(deviceId).then(av => { if (av) { setAvatarUri(av); AsyncStorage.setItem(AVATAR_CACHE_KEY, av); } });
  }, [deviceId]);

  // Auto-suggest username from fullName if not manually edited
  useEffect(() => {
    if (usernameEdited || !fullName.trim()) return;
    const base = fullName.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    if (base.length >= 2) setUsername(base);
  }, [fullName, usernameEdited]);

  // ── Avatar pick ──
  const pickAvatar = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Rugsat ýok", "Surat galeresine girmäge rugsat ediň."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.45, base64: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const dataUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
    setUploadingAvatar(true);
    setAvatarUri(dataUri);
    await AsyncStorage.setItem(AVATAR_CACHE_KEY, dataUri);
    if (deviceId) await setUserAvatar(deviceId, dataUri).catch(() => {});
    setUploadingAvatar(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [deviceId]);

  // ── Phone OTP ──
  const handleSendOtp = useCallback(async () => {
    if (newPhone.replace(/\s/g, "").length < 8) return;
    setSendingOtp(true);
    await new Promise(r => setTimeout(r, 900));
    setSendingOtp(false);
    setOtpSent(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => otpRef.current?.focus(), 200);
  }, [newPhone]);

  const handleVerifyPhone = useCallback(() => {
    if (otp.length < 4) return;
    setCurrentPhone("+993" + newPhone.replace(/\s/g, ""));
    setChangingPhone(false);
    setNewPhone(""); setOtp(""); setOtpSent(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [otp, newPhone]);

  // ── Save ──
  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const parts = fullName.trim().split(/\s+/);
      const name = parts[0] || "";
      const surname = parts.slice(1).join(" ") || "";
      const profVal = profession === "beyleki" && professionText.trim()
        ? professionText.trim()
        : profession;

      const data = {
        name, surname,
        phone: currentPhone,
        region: welaýatLabel,
        district: tumanLabel,
        profession: profVal,
        bio: bio.trim(),
        username: username.trim(),
      };

      await Promise.all([
        deviceId ? saveUserProfile(deviceId, data) : Promise.resolve(),
        deviceId && username.trim() ? setUserNickname(deviceId, username.trim()) : Promise.resolve(),
        saveLocalProfile(data).catch(() => {}),
      ]);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      Alert.alert("Ýalňyşlyk", "Ýatda saklanmady. Gaýtadan synanyşyň.");
      setSaving(false);
    }
  }, [saving, deviceId, fullName, currentPhone, welaýatLabel, tumanLabel, profession, professionText, bio, username]);

  const displayInitial = (username || fullName || "Ý").slice(0, 1).toUpperCase();

  const inputStyle = [
    s.input,
    { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground },
  ];

  const lbl = (text: string) => (
    <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>{text}</Text>
  );

  if (loading) {
    return (
      <View style={[s.root, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={[s.header, { paddingTop: (isWeb ? 0 : insets.top) + 14 }]}
      >
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.headerTitle}>Profili Düzet</Text>
          <Text style={s.headerSub}>Maglumatlarňyzy täzeläň</Text>
        </View>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={[s.saveHeaderBtn, { opacity: saving ? 0.6 : 1 }]}
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={s.saveHeaderText}>Sakla</Text>}
        </Pressable>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* ── Avatar ── */}
        <View style={s.avatarSection}>
          <Pressable onPress={pickAvatar} style={s.avatarWrap}>
            <LinearGradient
              colors={[colors.primary + "40", colors.primary + "20"]}
              style={s.avatar}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={s.avatarImg} contentFit="cover" />
              ) : (
                <Text style={[s.avatarInitial, { color: colors.primary }]}>{displayInitial}</Text>
              )}
            </LinearGradient>
            <View style={[s.cameraOverlay, { backgroundColor: colors.primary }]}>
              {uploadingAvatar
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="camera" size={14} color="#fff" />}
            </View>
          </Pressable>
          <Text style={[s.changePhotoText, { color: colors.mutedForeground }]}>Profiil suratyny üýtget</Text>
        </View>

        {/* ── Username ── */}
        <View style={s.section}>
          <Text style={[s.sectionHeader, { color: colors.foreground }]}>Şahsy maglumatlar</Text>

          {lbl("Ulanyjy ady (@username)")}
          <View style={[s.usernameRow, { backgroundColor: colors.input, borderColor: usernameValid || !username ? colors.border : "#ef4444" }]}>
            <View style={[s.atPrefix, { borderRightColor: colors.border }]}>
              <Text style={[s.atText, { color: colors.primary }]}>@</Text>
            </View>
            <TextInput
              style={[s.usernameInput, { color: colors.foreground }]}
              value={username}
              onChangeText={t => { setUsername(t.toLowerCase().replace(/[^a-z0-9_.]/g, "").slice(0, 20)); setUsernameEdited(true); }}
              placeholder="mysal_ady"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none" autoCorrect={false} returnKeyType="next"
            />
            {username.length >= 3 && (
              <View style={{ paddingRight: 12 }}>
                {usernameValid
                  ? <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                  : <Ionicons name="close-circle" size={18} color="#ef4444" />}
              </View>
            )}
          </View>

          {lbl("Adyňyz Familýaňyz")}
          <TextInput
            style={inputStyle}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Merdan Durdyýew"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="words" returnKeyType="done"
          />
        </View>

        {/* ── Phone ── */}
        <View style={s.section}>
          <Text style={[s.sectionHeader, { color: colors.foreground }]}>Telefon belgisi</Text>
          <View style={[s.currentPhoneRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[s.phoneIconBox, { backgroundColor: colors.primary + "18" }]}>
              <Ionicons name="call-outline" size={18} color={colors.primary} />
            </View>
            <Text style={[s.currentPhoneText, { color: colors.foreground }]}>
              {currentPhone || "Belgi ýok"}
            </Text>
            {!changingPhone && (
              <Pressable
                onPress={() => { setChangingPhone(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[s.changeBtn, { backgroundColor: colors.primary + "18" }]}
              >
                <Text style={[s.changeBtnText, { color: colors.primary }]}>Üýtget</Text>
              </Pressable>
            )}
          </View>

          {changingPhone && (
            <View style={{ marginTop: 10 }}>
              <View style={[s.phoneRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
                <View style={[s.phonePrefix, { borderRightColor: colors.border }]}>
                  <Text style={[s.phonePrefixText, { color: colors.mutedForeground }]}>+993</Text>
                </View>
                <TextInput
                  style={[s.phoneInputInner, { color: colors.foreground }]}
                  value={newPhone}
                  onChangeText={t => setNewPhone(t.replace(/[^0-9\s]/g, "").slice(0, 10))}
                  placeholder="6X XXX XX XX"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="phone-pad" maxLength={10} editable={!otpSent}
                />
              </View>
              {!otpSent ? (
                <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                  <Pressable onPress={() => setChangingPhone(false)} style={[s.cancelBtn, { borderColor: colors.border }]}>
                    <Text style={{ color: colors.mutedForeground, fontWeight: "600" }}>Bes et</Text>
                  </Pressable>
                  <View style={{ flex: 1 }}>
                    <PessimisticButton
                      label={sendingOtp ? "Iberilýär..." : "SMS Kody Iber"}
                      loading={sendingOtp}
                      disabled={newPhone.replace(/\s/g, "").length < 8}
                      onPress={handleSendOtp}
                      icon="send-outline"
                    />
                  </View>
                </View>
              ) : (
                <View style={{ marginTop: 10 }}>
                  <View style={[s.otpInfo, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
                    <Ionicons name="checkmark-circle" size={15} color={colors.primary} />
                    <Text style={[s.otpInfoText, { color: colors.primary }]}>+993 {newPhone} — SMS iberildi</Text>
                  </View>
                  <TextInput
                    ref={otpRef}
                    style={[...inputStyle, s.otpInput]}
                    value={otp}
                    onChangeText={t => setOtp(t.replace(/\D/g, "").slice(0, 6))}
                    placeholder="XXXXXX"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="number-pad" maxLength={6}
                    returnKeyType="done" onSubmitEditing={handleVerifyPhone}
                  />
                  <PessimisticButton
                    label="Tassykla we üýtget"
                    disabled={otp.length < 4}
                    onPress={handleVerifyPhone}
                    icon="checkmark-circle-outline"
                  />
                </View>
              )}
            </View>
          )}
        </View>

        {/* ── Location ── */}
        <View style={s.section}>
          <Text style={[s.sectionHeader, { color: colors.foreground }]}>Ýaşaýan ýeri</Text>
          {lbl("Welaýat / Tuman")}
          <View style={s.locationRow}>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowWelaýat(true); }}
              style={[s.locationBtn, { backgroundColor: colors.input, borderColor: welaýatId ? colors.primary : colors.border }]}
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
                { backgroundColor: !welaýatId ? colors.muted : colors.input, borderColor: tumanId ? colors.primary : colors.border, opacity: !welaýatId ? 0.5 : 1 },
              ]}
            >
              <Text style={[s.locationBtnText, { color: tumanId ? colors.foreground : colors.mutedForeground }]} numberOfLines={1}>
                {tumanLabel || "Tuman"}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>

        {/* ── Profession ── */}
        <View style={s.section}>
          <Text style={[s.sectionHeader, { color: colors.foreground }]}>Hünär</Text>
          {lbl("Käriňizi saýlaň")}
          <View style={s.karGrid}>
            {KARLER.map(kar => {
              const isSelected = profession === kar.id;
              return (
                <Pressable
                  key={kar.id}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setProfession(kar.id); }}
                  style={[
                    s.karCard,
                    { backgroundColor: isSelected ? colors.primary + "18" : colors.card, borderColor: isSelected ? colors.primary : colors.border },
                  ]}
                >
                  <Ionicons name={kar.icon} size={18} color={isSelected ? colors.primary : colors.mutedForeground} />
                  <Text style={[s.karLabel, { color: isSelected ? colors.primary : colors.foreground }]}>{kar.label}</Text>
                  {isSelected && (
                    <View style={[s.karCheck, { backgroundColor: colors.primary }]}>
                      <Ionicons name="checkmark" size={9} color="#fff" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {lbl("Hünäriňizi özüňiz ýazyň (islege görä)")}
          <TextInput
            style={inputStyle}
            value={professionText}
            onChangeText={setProfessionText}
            placeholder="Mysal: Dizaýner, Programmist, Terjimeçi..."
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="done"
          />
          {professionText.trim() && (
            <View style={[s.profTextHint, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "25" }]}>
              <Ionicons name="information-circle-outline" size={13} color={colors.primary} />
              <Text style={[s.profTextHintText, { color: colors.primary }]}>
                Bu metin saýlanan käre goşmaça hökmünde saklanar
              </Text>
            </View>
          )}
        </View>

        {/* ── Bio ── */}
        <View style={s.section}>
          <Text style={[s.sectionHeader, { color: colors.foreground }]}>Özüňiz hakda</Text>
          {lbl("Gysga tanyşdyryş (300 harp)")}
          <TextInput
            style={[...inputStyle, s.bioInput]}
            value={bio}
            onChangeText={t => setBio(t.slice(0, 300))}
            placeholder="Gysga, gyzykly tanyşdyryş ýazyň..."
            placeholderTextColor={colors.mutedForeground}
            multiline numberOfLines={4} textAlignVertical="top"
          />
          <Text style={[s.charCount, { color: colors.mutedForeground }]}>{bio.length} / 300</Text>
        </View>

        {/* ── Save button ── */}
        <View style={{ marginTop: 8 }}>
          <PessimisticButton
            label={saving ? "Ýatda saklanýar..." : "Üýtgeşmeleri sakla"}
            loading={saving}
            onPress={handleSave}
            icon="checkmark-circle-outline"
          />
        </View>

        <SelectModal
          visible={showWelaýat} title="Welaýat saýlaň"
          items={WELAÝATLAR} selectedId={welaýatId}
          onSelect={(id, label) => { setWelaýatId(id); setWelaýatLabel(label); setTumanId(""); setTumanLabel(""); }}
          onClose={() => setShowWelaýat(false)}
        />
        <SelectModal
          visible={showTuman} title="Tuman / Şäher saýlaň"
          items={tumanItems} selectedId={tumanId}
          onSelect={(id, label) => { setTumanId(id); setTumanLabel(label); }}
          onClose={() => setShowTuman(false)}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 19, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.72)", fontSize: 11, marginTop: 1 },
  saveHeaderBtn: {
    backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12,
  },
  saveHeaderText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  content: { padding: 18 },

  avatarSection: { alignItems: "center", paddingVertical: 20 },
  avatarWrap: { position: "relative", width: 90, height: 90, marginBottom: 8 },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  avatarImg: { width: 90, height: 90, borderRadius: 45 },
  avatarInitial: { fontSize: 36, fontWeight: "800" },
  cameraOverlay: {
    position: "absolute", bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#fff",
  },
  changePhotoText: { fontSize: 12, fontWeight: "500" },

  section: { marginBottom: 24 },
  sectionHeader: { fontSize: 16, fontWeight: "800", marginBottom: 14, letterSpacing: -0.2 },

  fieldLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3, marginBottom: 7, textTransform: "uppercase" },

  usernameRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 12, borderWidth: 1.5, marginBottom: 14, overflow: "hidden",
  },
  atPrefix: { paddingHorizontal: 14, paddingVertical: 14, borderRightWidth: 1.5 },
  atText: { fontSize: 17, fontWeight: "800" },
  usernameInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15 },

  input: {
    borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 12, fontSize: 15, marginBottom: 14,
  },

  currentPhoneRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 12,
  },
  phoneIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  currentPhoneText: { flex: 1, fontSize: 15, fontWeight: "500" },
  changeBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  changeBtnText: { fontSize: 13, fontWeight: "700" },

  phoneRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 12, borderWidth: 1.5, overflow: "hidden",
  },
  phonePrefix: {
    paddingHorizontal: 14, paddingVertical: Platform.OS === "ios" ? 14 : 12, borderRightWidth: 1.5,
  },
  phonePrefixText: { fontSize: 15, fontWeight: "600" },
  phoneInputInner: { flex: 1, paddingHorizontal: 14, paddingVertical: Platform.OS === "ios" ? 14 : 12, fontSize: 16 },
  cancelBtn: {
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
  },

  otpInfo: {
    flexDirection: "row", alignItems: "center", gap: 7,
    borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 12,
  },
  otpInfoText: { fontSize: 12, fontWeight: "600", flex: 1 },
  otpInput: { letterSpacing: 6, fontSize: 20, fontWeight: "700", textAlign: "center" },

  locationRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  locationBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 13,
  },
  locationBtnText: { fontSize: 13, flex: 1 },

  karGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  karCard: {
    width: "47%", flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 13, borderWidth: 1.5, padding: 11, position: "relative",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  karLabel: { fontSize: 12, fontWeight: "600", flex: 1 },
  karCheck: {
    position: "absolute", top: 7, right: 7,
    width: 15, height: 15, borderRadius: 8, alignItems: "center", justifyContent: "center",
  },

  profTextHint: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, borderWidth: 1, marginTop: -8, marginBottom: 14,
  },
  profTextHintText: { fontSize: 12, flex: 1 },

  bioInput: { height: 100, paddingTop: 12 },
  charCount: { fontSize: 11, textAlign: "right", marginTop: -10, marginBottom: 14 },
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
    paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemText: { fontSize: 15 },
});
