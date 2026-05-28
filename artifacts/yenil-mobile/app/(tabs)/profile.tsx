import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  Alert, Platform, ActivityIndicator, Animated,
} from "react-native";
import { router, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useColors } from "@/hooks/useColors";
import { RipplePress } from "@/components/RipplePress";
import { useBonusPul } from "@/contexts/BonusPulContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getUserProfile, getUserNickname, getReputation,
  setUserAvatar, getUserAvatar, watchUserAvatar,
  type UserProfile, type ReputationData,
} from "@/lib/firebase";
import { getLocalProfile, type LocalProfile } from "@/lib/localProfile";
import { getLevel, getProgressPercent, getNextLevel } from "@/lib/reputation";
import { clearDeviceId } from "@/lib/deviceId";

const isWeb = Platform.OS === "web";
const AVATAR_CACHE_KEY = "@yenil_avatar";

function InfoRow({
  icon, label, value, colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  if (!value) return null;
  return (
    <View style={[row.wrap, { borderBottomColor: colors.border }]}>
      <View style={[row.iconBox, { backgroundColor: colors.primary + "18" }]}>
        <Ionicons name={icon} size={17} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[row.label, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[row.value, { color: colors.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}

function SectionCard({
  title, children, colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[s.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>
      <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { balance, deviceId } = useBonusPul();
  const { t } = useLanguage();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [localProfile, setLocalProfile] = useState<LocalProfile | null>(null);
  const [nickname, setNickname] = useState("");
  const [repData, setRepData] = useState<ReputationData>({ score: 20, entries: [] });
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [goRegister, setGoRegister] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const cameraAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Load cached avatar immediately
    AsyncStorage.getItem(AVATAR_CACHE_KEY).then((v) => { if (v) setAvatarUri(v); });
  }, []);

  useEffect(() => {
    getLocalProfile().then(p => { if (p) setLocalProfile(p); });
  }, []);

  useEffect(() => {
    if (!deviceId) return;
    let cancelled = false;
    setLoading(true);

    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 8000);

    // Watch avatar in real-time
    const unsubAvatar = watchUserAvatar(deviceId, (uri) => {
      if (uri) {
        setAvatarUri(uri);
        AsyncStorage.setItem(AVATAR_CACHE_KEY, uri);
      }
    });

    Promise.all([
      getUserProfile(deviceId),
      getUserNickname(deviceId),
      getReputation(deviceId),
    ])
      .then(([prof, nick, rep]) => {
        clearTimeout(timeout);
        if (cancelled) return;
        if (prof) setProfile(prof);
        setNickname(nick);
        setRepData(rep);
        setLoading(false);
      })
      .catch(() => {
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      unsubAvatar();
    };
  }, [deviceId]);

  const pickAvatar = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animate camera button
    Animated.sequence([
      Animated.timing(cameraAnim, { toValue: 0.85, duration: 100, useNativeDriver: true }),
      Animated.timing(cameraAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("error"), "Surat galeresine girişe rugsat edilmedi.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.45,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const dataUri = asset.base64
      ? `data:image/jpeg;base64,${asset.base64}`
      : asset.uri;

    setUploadingAvatar(true);
    try {
      setAvatarUri(dataUri);
      await AsyncStorage.setItem(AVATAR_CACHE_KEY, dataUri);
      if (deviceId) await setUserAvatar(deviceId, dataUri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert(t("error"), "Surat ýüklenip bilmedi.");
    } finally {
      setUploadingAvatar(false);
    }
  }, [deviceId, t, cameraAnim]);

  const level = getLevel(repData.score);
  const pct = getProgressPercent(repData.score);
  const nextLv = getNextLevel(repData.score);

  const mergedName = profile?.name || localProfile?.name || "";
  const mergedSurname = profile?.surname || localProfile?.surname || "";
  const mergedPhone = profile?.phone || localProfile?.phone || "";
  const mergedRegion = profile?.region || localProfile?.region || "";
  const mergedDistrict = profile?.district || localProfile?.district || "";
  const mergedProfession = profile?.profession || localProfile?.profession || "";
  const mergedBio = profile?.bio || localProfile?.bio || "";

  const displayNickname = nickname || profile?.username || "";
  const displayInitial = (displayNickname || mergedName || "Ý").slice(0, 1).toUpperCase();
  const displayName = [mergedName, mergedSurname].filter(Boolean).join(" ") || displayNickname || "Ulanyjy";
  const hasAnyProfile = !!(mergedName || mergedSurname || localProfile || profile);

  async function handleLogout() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      t("logout"),
      t("logout_confirm"),
      [
        { text: t("no"), style: "cancel" },
        {
          text: t("logout_btn"),
          style: "destructive",
          onPress: async () => {
            setLoggingOut(true);
            try {
              await AsyncStorage.clear();
              await clearDeviceId();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.replace("/auth/register");
            } catch {
              setLoggingOut(false);
              Alert.alert(t("error"), "Çykyp bolmady. Gaýtadan synanyşyň.");
            }
          },
        },
      ]
    );
  }

  const topPad = (isWeb ? 0 : insets.top) + 14;

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd] as [string, string]}
        style={[s.header, { paddingTop: topPad }]}
      >
        <Text style={s.headerTitle}>{t("profile")}</Text>
        <Text style={s.headerSub}>{t("personal_info")}</Text>
      </LinearGradient>

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[s.loadingText, { color: colors.mutedForeground }]}>{t("loading")}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: 130 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Avatar hero card ── */}
          <LinearGradient
            colors={[colors.headerGradientStart, colors.headerGradientEnd] as [string, string]}
            style={s.heroCard}
          >
            {/* Avatar circle with upload button */}
            <Pressable onPress={pickAvatar} style={s.avatarWrap}>
              <View style={[s.avatar, { borderColor: "rgba(255,255,255,0.4)" }]}>
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={s.avatarImg}
                    contentFit="cover"
                    transition={300}
                  />
                ) : (
                  <Text style={s.avatarText}>{displayInitial}</Text>
                )}
              </View>
              {/* Online dot */}
              <View style={s.onlineDot} />
            </Pressable>

            {/* Name & nickname */}
            <Text style={s.heroName}>{displayName}</Text>
            <View style={s.nicknamePill}>
              <Ionicons name="at-outline" size={13} color={displayNickname ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.5)"} />
              <Text style={[s.nicknameText, !displayNickname && { color: "rgba(255,255,255,0.5)" }]}>
                {displayNickname || "belirlenmedik"}
              </Text>
            </View>
          </LinearGradient>

          {/* ── Device ID chip ── */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert("Ulanyjy ID", deviceId, [{ text: t("close") }]);
            }}
            style={({ pressed }) => [s.idChip, { backgroundColor: colors.muted, borderColor: colors.border, opacity: pressed ? 0.72 : 1 }]}
          >
            <Ionicons name="finger-print-outline" size={14} color={colors.mutedForeground} />
            <Text style={[s.idChipText, { color: colors.mutedForeground }]} numberOfLines={1}>
              ID: {deviceId ? deviceId.slice(0, 20) + "..." : "..."}
            </Text>
            <Ionicons name="copy-outline" size={13} color={colors.mutedForeground} />
          </Pressable>

          {/* ── Şahsy maglumatlar ── */}
          {hasAnyProfile ? (
            <>
              {/* Edit profile button */}
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/edit-profile"); }}
                style={({ pressed }) => [
                  s.editProfileBtn,
                  { backgroundColor: colors.card, borderColor: colors.primary + "50", opacity: pressed ? 0.75 : 1 },
                ]}
              >
                <View style={[s.editProfileIconBox, { backgroundColor: colors.primary + "15" }]}>
                  <Ionicons name="create-outline" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.editProfileLabel, { color: colors.foreground }]}>Profili Düzet</Text>
                  <Text style={[s.editProfileSub, { color: colors.mutedForeground }]}>Ady, ýeri, hünäri, bio...</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              </Pressable>

              <SectionCard title={t("personal_info").toUpperCase()} colors={colors}>
                {displayNickname ? <InfoRow icon="at-outline" label="Username" value={"@" + displayNickname} colors={colors} /> : null}
                {(mergedName || mergedSurname) ? (
                  <InfoRow
                    icon="person-outline"
                    label="Adyňyz Familýaňyz"
                    value={[mergedName, mergedSurname].filter(Boolean).join(" ")}
                    colors={colors}
                  />
                ) : null}
                {mergedPhone ? <InfoRow icon="call-outline" label={t("phone")} value={mergedPhone} colors={colors} /> : null}
                {(mergedRegion || mergedDistrict) ? (
                  <InfoRow
                    icon="location-outline"
                    label={t("region")}
                    value={[mergedRegion, mergedDistrict].filter(Boolean).join(", ")}
                    colors={colors}
                  />
                ) : null}
              </SectionCard>

              <SectionCard title={t("profession").toUpperCase()} colors={colors}>
                {mergedProfession ? <InfoRow icon="briefcase-outline" label={t("profession")} value={mergedProfession} colors={colors} /> : null}
                {mergedBio ? (
                  <View style={[row.wrap, { borderBottomColor: "transparent" }]}>
                    <View style={[row.iconBox, { backgroundColor: colors.primary + "18" }]}>
                      <Ionicons name="document-text-outline" size={17} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[row.label, { color: colors.mutedForeground }]}>{t("about_me")}</Text>
                      <Text style={[row.value, { color: colors.foreground, lineHeight: 20 }]}>{mergedBio}</Text>
                    </View>
                  </View>
                ) : null}
              </SectionCard>
            </>
          ) : (
            <View style={[s.noProfileBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="person-add-outline" size={36} color={colors.mutedForeground} />
              <Text style={[s.noProfileTitle, { color: colors.foreground }]}>{t("profile_not_filled")}</Text>
              <Text style={[s.noProfileDesc, { color: colors.mutedForeground }]}>{t("profile_not_filled_desc")}</Text>
            </View>
          )}

          {/* ── LOGOUT BUTTON ── */}
          <RipplePress
            onPress={handleLogout}
            disabled={loggingOut}
            style={[s.logoutBtn, { borderColor: "#ef4444", backgroundColor: "transparent", opacity: loggingOut ? 0.6 : 1 }]}
            borderRadius={16}
            rippleColor="#ef4444"
            rippleSize={160}
          >
            {loggingOut ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            )}
            <Text style={s.logoutText}>{t("logout")}</Text>
          </RipplePress>

          <Text style={[s.footerNote, { color: colors.mutedForeground }]}>
            Çykanyňyzda Firebase'daky maglumatlaryňyz saklanýar. Diňe bu enjamdan çykylýar.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const row = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 15,
    fontWeight: "500",
  },
});

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.72)", marginTop: 2 },
  scroll: { padding: 16 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14 },

  heroCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  avatarWrap: {
    position: "relative",
    marginBottom: 12,
    width: 84,
    height: 84,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: { fontSize: 32, fontWeight: "800", color: "#fff" },
  onlineDot: {
    position: "absolute",
    right: 3,
    bottom: 18,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4ade80",
    borderWidth: 2.5,
    borderColor: "#fff",
  },
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  heroName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    letterSpacing: -0.2,
  },
  nicknamePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  nicknameText: { fontSize: 13, color: "rgba(255,255,255,0.88)", fontWeight: "600" },
  uploadHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    marginBottom: 4,
  },
  uploadHintText: { fontSize: 11, color: "rgba(255,255,255,0.65)" },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    backgroundColor: "rgba(255,255,255,0.13)",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    width: "100%",
  },
  statItem: { flex: 1, alignItems: "center", gap: 5 },
  statNum: { fontSize: 18, fontWeight: "800", color: "#fff" },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.68)", fontWeight: "600", letterSpacing: 0.3 },
  statDivider: { width: 1, height: 36 },
  levelPill: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1.5,
  },
  levelPillText: { fontSize: 11, fontWeight: "700" },
  repBarWrap: { width: "100%", marginTop: 14 },
  repBarTrack: { height: 5, borderRadius: 3, overflow: "hidden" },
  repBarFill: { height: "100%", borderRadius: 3 },
  repBarHint: { marginTop: 5, fontSize: 11, color: "rgba(255,255,255,0.68)", textAlign: "center" },

  idChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 10, borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12, paddingVertical: 9, marginBottom: 20,
  },
  idChipText: { flex: 1, fontSize: 12, fontWeight: "500" },

  sectionTitle: {
    fontSize: 11, fontWeight: "700", letterSpacing: 0.8,
    marginBottom: 8, marginLeft: 4,
  },
  card: {
    borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },

  noProfileBox: {
    borderRadius: 16, borderWidth: StyleSheet.hairlineWidth,
    padding: 28, alignItems: "center", gap: 10, marginBottom: 20,
  },
  noProfileTitle: { fontSize: 16, fontWeight: "700" },
  noProfileDesc: { fontSize: 13, textAlign: "center", lineHeight: 19 },

  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, borderWidth: 1.5, borderRadius: 14, paddingVertical: 15, marginBottom: 12,
  },
  logoutText: { fontSize: 16, fontWeight: "700", color: "#ef4444", letterSpacing: 0.1 },
  footerNote: { fontSize: 11, textAlign: "center", lineHeight: 16, marginBottom: 4 },

  editProfileBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 14,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  editProfileIconBox: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
  },
  editProfileLabel: { fontSize: 14, fontWeight: "700" },
  editProfileSub: { fontSize: 12, marginTop: 1 },
});
