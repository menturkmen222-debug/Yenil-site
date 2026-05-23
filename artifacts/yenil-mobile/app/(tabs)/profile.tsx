import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  Alert, Platform, ActivityIndicator,
} from "react-native";
import { router, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";
import { getUserProfile, getUserNickname, getReputation, type UserProfile, type ReputationData } from "@/lib/firebase";
import { getLevel, getProgressPercent, getNextLevel } from "@/lib/reputation";
import { clearDeviceId } from "@/lib/deviceId";

const isWeb = Platform.OS === "web";

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

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nickname, setNickname] = useState("");
  const [repData, setRepData] = useState<ReputationData>({ score: 20, entries: [] });
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [goRegister, setGoRegister] = useState(false);

  useEffect(() => {
    if (!deviceId) return;
    let cancelled = false;
    setLoading(true);

    const timeout = setTimeout(() => {
      if (!cancelled) setGoRegister(true);
    }, 8000);

    Promise.all([
      getUserProfile(deviceId),
      getUserNickname(deviceId),
      getReputation(deviceId),
    ])
      .then(([prof, nick, rep]) => {
        clearTimeout(timeout);
        if (cancelled) return;
        if (!prof) {
          setGoRegister(true);
          return;
        }
        setProfile(prof);
        setNickname(nick);
        setRepData(rep);
        setLoading(false);
      })
      .catch(() => {
        clearTimeout(timeout);
        if (!cancelled) setGoRegister(true);
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [deviceId]);

  if (goRegister) return <Redirect href="/auth/register" />;

  const level = getLevel(repData.score);
  const pct = getProgressPercent(repData.score);
  const nextLv = getNextLevel(repData.score);

  const displayInitial = (nickname || profile?.name || "Ý").slice(0, 1).toUpperCase();
  const displayName = profile
    ? `${profile.name} ${profile.surname}`.trim()
    : nickname || "Ulanyjy";

  async function handleLogout() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Ulgamdan çykmak",
      "Çykanyňyzdan soň täzeden hasaba alynmaly bolarsyňyz. Dowam etmekmi?",
      [
        { text: "Ýok", style: "cancel" },
        {
          text: "Hawa, çyk",
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
              Alert.alert("Ýalňyşlyk", "Çykyp bolmady. Gaýtadan synanyşyň.");
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
        <Text style={s.headerTitle}>Profilim</Text>
        <Text style={s.headerSub}>Şahsy maglumatlar</Text>
      </LinearGradient>

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[s.loadingText, { color: colors.mutedForeground }]}>Ýüklenýär...</Text>
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
            {/* Avatar circle */}
            <View style={s.avatarWrap}>
              <View style={[s.avatar, { borderColor: "rgba(255,255,255,0.4)" }]}>
                <Text style={s.avatarText}>{displayInitial}</Text>
              </View>
              {/* Online dot */}
              <View style={s.onlineDot} />
            </View>

            {/* Name & nickname */}
            <Text style={s.heroName}>{displayName}</Text>
            {nickname ? (
              <View style={s.nicknamePill}>
                <Ionicons name="at-outline" size={13} color="rgba(255,255,255,0.85)" />
                <Text style={s.nicknameText}>{nickname}</Text>
              </View>
            ) : null}

            {/* Stats row */}
            <View style={s.statsRow}>
              <View style={s.statItem}>
                <Text style={s.statNum}>{balance.toFixed(2)}</Text>
                <Text style={s.statLabel}>BP</Text>
              </View>
              <View style={[s.statDivider, { backgroundColor: "rgba(255,255,255,0.25)" }]} />
              <View style={s.statItem}>
                <Text style={s.statNum}>{repData.score}</Text>
                <Text style={s.statLabel}>Abraý</Text>
              </View>
              <View style={[s.statDivider, { backgroundColor: "rgba(255,255,255,0.25)" }]} />
              <View style={s.statItem}>
                <View style={[s.levelPill, { backgroundColor: level.bg, borderColor: level.border }]}>
                  <Ionicons name={level.icon as any} size={12} color={level.color} />
                  <Text style={[s.levelPillText, { color: level.color }]}>{level.labelTm}</Text>
                </View>
                <Text style={s.statLabel}>Dereje</Text>
              </View>
            </View>

            {/* Reputation progress bar */}
            <View style={s.repBarWrap}>
              <View style={[s.repBarTrack, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                <View style={[s.repBarFill, { width: `${repData.score}%` as any, backgroundColor: "rgba(255,255,255,0.9)" }]} />
              </View>
              {nextLv ? (
                <Text style={s.repBarHint}>
                  {nextLv.label} derejesine {nextLv.minScore - repData.score} bal galdy ({pct}%)
                </Text>
              ) : (
                <Text style={s.repBarHint}>Iň ýokary dereje — {pct}%</Text>
              )}
            </View>
          </LinearGradient>

          {/* ── Device ID chip ── */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert("Ulanyjy ID", deviceId, [{ text: "Ýap" }]);
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
          {profile ? (
            <>
              <SectionCard title="ŞAHSY MAGLUMATLAR" colors={colors}>
                <InfoRow icon="person-outline" label="Ady" value={profile.name} colors={colors} />
                <InfoRow icon="person-circle-outline" label="Familiýasy" value={profile.surname} colors={colors} />
                <InfoRow icon="call-outline" label="Telefon belgi" value={profile.phone} colors={colors} />
                <InfoRow icon="location-outline" label="Welaýat" value={profile.region} colors={colors} />
                <InfoRow icon="map-outline" label="Etrap / Şäher" value={profile.district} colors={colors} />
              </SectionCard>

              <SectionCard title="HÜNÄR MAGLUMATLARY" colors={colors}>
                <InfoRow icon="briefcase-outline" label="Hünäri / Käri" value={profile.profession} colors={colors} />
                {profile.bio ? (
                  <View style={[row.wrap, { borderBottomColor: "transparent" }]}>
                    <View style={[row.iconBox, { backgroundColor: colors.primary + "18" }]}>
                      <Ionicons name="document-text-outline" size={17} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[row.label, { color: colors.mutedForeground }]}>Özüm hakynda</Text>
                      <Text style={[row.value, { color: colors.foreground, lineHeight: 20 }]}>{profile.bio}</Text>
                    </View>
                  </View>
                ) : null}
              </SectionCard>
            </>
          ) : (
            /* Profile not set yet */
            <View style={[s.noProfileBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="person-add-outline" size={36} color={colors.mutedForeground} />
              <Text style={[s.noProfileTitle, { color: colors.foreground }]}>Profil doldurylmady</Text>
              <Text style={[s.noProfileDesc, { color: colors.mutedForeground }]}>
                Hasaba alynmak arkaly profiliňizi doluň
              </Text>
            </View>
          )}

          {/* ── Hasap maglumaty ── */}
          <SectionCard title="HASAP" colors={colors}>
            <View style={[row.wrap, { borderBottomColor: colors.border }]}>
              <View style={[row.iconBox, { backgroundColor: "#f59e0b18" }]}>
                <Ionicons name="wallet-outline" size={17} color="#f59e0b" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[row.label, { color: colors.mutedForeground }]}>BonusPul balansy</Text>
                <Text style={[row.value, { color: colors.foreground, fontWeight: "700" }]}>{balance.toFixed(2)} BP</Text>
              </View>
            </View>
            <View style={[row.wrap, { borderBottomColor: "transparent" }]}>
              <View style={[row.iconBox, { backgroundColor: level.bg + "80" }]}>
                <Ionicons name={level.icon as any} size={17} color={level.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[row.label, { color: colors.mutedForeground }]}>Abraý derejesi</Text>
                <Text style={[row.value, { color: colors.foreground }]}>
                  {repData.score}/100 · {level.labelTm}
                </Text>
              </View>
            </View>
          </SectionCard>

          {/* ── SYNAG / TEST section ── */}
          <Text style={[s.sectionTitle, { color: colors.mutedForeground }]}>SYNAG</Text>
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 24 }]}>
            <View style={[row.wrap, { borderBottomColor: "transparent" }]}>
              <View style={[row.iconBox, { backgroundColor: "#7c3aed18" }]}>
                <Ionicons name="flask-outline" size={17} color="#7c3aed" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[row.label, { color: colors.mutedForeground }]}>Synag rejimi</Text>
                <Text style={[row.value, { color: colors.foreground }]}>
                  Täze ulanyjy hökmünde başlamak üçin ulgamdan çykyň
                </Text>
              </View>
            </View>
          </View>

          {/* ── LOGOUT BUTTON ── */}
          <Pressable
            onPress={handleLogout}
            disabled={loggingOut}
            style={({ pressed }) => [
              s.logoutBtn,
              {
                borderColor: "#ef4444",
                backgroundColor: pressed ? "#ef444410" : "transparent",
                opacity: loggingOut ? 0.6 : 1,
              },
            ]}
          >
            {loggingOut ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            )}
            <Text style={s.logoutText}>Ulgamdan çykmak</Text>
          </Pressable>

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
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.72)",
    marginTop: 2,
  },
  scroll: {
    padding: 16,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },

  /* Hero card */
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
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
  },
  onlineDot: {
    position: "absolute",
    right: 3,
    bottom: 3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4ade80",
    borderWidth: 2.5,
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
  nicknameText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.88)",
    fontWeight: "600",
  },

  /* Stats row */
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
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 5,
  },
  statNum: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.68)",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 36,
  },
  levelPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  levelPillText: {
    fontSize: 11,
    fontWeight: "700",
  },

  /* Reputation bar */
  repBarWrap: {
    width: "100%",
    marginTop: 14,
  },
  repBarTrack: {
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
  },
  repBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  repBarHint: {
    marginTop: 5,
    fontSize: 11,
    color: "rgba(255,255,255,0.68)",
    textAlign: "center",
  },

  /* ID chip */
  idChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 20,
  },
  idChipText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
  },

  /* Section */
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  /* No profile */
  noProfileBox: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 28,
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  noProfileTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  noProfileDesc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },

  /* Logout */
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 12,
    shadowColor: "#ef4444",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ef4444",
    letterSpacing: 0.1,
  },
  footerNote: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 4,
  },
});
