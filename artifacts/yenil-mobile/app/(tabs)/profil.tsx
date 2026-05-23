import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";
import { getUserProfile, type UserProfile } from "@/lib/firebase";

// ─── Profil satyr bölümleri ───────────────────────────────────────────────────

interface InfoRowProps {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  borderColor: string;
  foreground: string;
  mutedForeground: string;
  primary: string;
}

function InfoRow({
  icon,
  label,
  value,
  borderColor,
  foreground,
  mutedForeground,
  primary,
}: InfoRowProps) {
  return (
    <View style={[ir.row, { borderBottomColor: borderColor }]}>
      <View style={[ir.iconWrap, { backgroundColor: primary + "12" }]}>
        <Ionicons name={icon} size={18} color={primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[ir.label, { color: mutedForeground }]}>{label}</Text>
        <Text style={[ir.value, { color: foreground }]}>{value || "—"}</Text>
      </View>
    </View>
  );
}

const ir = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 11, fontWeight: "600", marginBottom: 2, letterSpacing: 0.3 },
  value: { fontSize: 15, fontWeight: "600" },
});

// ─── Esasy ekran ──────────────────────────────────────────────────────────────

export default function ProfilScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { balanceBP, reputationPoints, deviceId } = useBonusPul();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!deviceId) return;
    setLoading(true);
    getUserProfile(deviceId)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [deviceId]);

  const handleLogout = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Ulgamdan çykmak",
      "Lokal maglumatlar arassalanar we hasaba giriş ekranyna geçersiňiz. Firebase'daky profilyňyz saklanyp galar.",
      [
        { text: "Ýok", style: "cancel" },
        {
          text: "Tassykla",
          style: "destructive",
          onPress: async () => {
            setLoggingOut(true);
            await new Promise((res) => setTimeout(res, 600));
            router.replace("/auth/register" as never);
          },
        },
      ]
    );
  }, []);

  const fullName =
    profile?.name && profile?.surname
      ? `${profile.name} ${profile.surname}`
      : profile?.name || "Bilinmeýän";

  const shortId = deviceId ? deviceId.slice(-8).toUpperCase() : "--------";

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* ── Gradient sarlavha ─────────────────────────────────────── */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={[s.header, { paddingTop: (isWeb ? 0 : insets.top) + 14 }]}
      >
        <Text style={s.headerTitle}>Profilim</Text>
        <Text style={s.headerSub}>Şahsy maglumatlaryňyz</Text>
      </LinearGradient>

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[s.loadingText, { color: colors.mutedForeground }]}>
            Ýüklenýär...
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            s.content,
            { paddingBottom: insets.bottom + 120 },
          ]}
        >
          {/* ── Avatar + at ───────────────────────────────────────── */}
          <View style={s.avatarSection}>
            <LinearGradient
              colors={["#0d4222", "#1B6B3A"]}
              style={s.avatarCircle}
            >
              <Ionicons name="person" size={38} color="#fff" />
            </LinearGradient>
            <Text style={[s.fullName, { color: colors.foreground }]}>
              {fullName}
            </Text>
            {profile?.profession && (
              <Text style={[s.professionBadge, { color: colors.primary }]}>
                {profile.profession}
              </Text>
            )}
            <Text style={[s.shortId, { color: colors.mutedForeground }]}>
              ID: {shortId}
            </Text>
          </View>

          {/* ── Statistika hatar ──────────────────────────────────── */}
          <View
            style={[
              s.statsRow,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: colors.primary }]}>
                {balanceBP.toLocaleString("tk-TM", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
              <Text style={[s.statLabel, { color: colors.mutedForeground }]}>
                BP Balansy
              </Text>
            </View>
            <View style={[s.statDivider, { backgroundColor: colors.border }]} />
            <View style={s.statItem}>
              <View style={s.repRow}>
                <Ionicons name="star" size={16} color="#f59e0b" />
                <Text style={[s.statValue, { color: colors.foreground }]}>
                  {reputationPoints}
                </Text>
              </View>
              <Text style={[s.statLabel, { color: colors.mutedForeground }]}>
                Abraý baly
              </Text>
            </View>
          </View>

          {/* ── Profil maglumatlary ───────────────────────────────── */}
          <View
            style={[
              s.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[s.cardTitle, { color: colors.foreground }]}>
              Şahsy maglumatlar
            </Text>
            <InfoRow
              icon="person-outline"
              label="Ady we familiýasy"
              value={fullName}
              borderColor={colors.border}
              foreground={colors.foreground}
              mutedForeground={colors.mutedForeground}
              primary={colors.primary}
            />
            <InfoRow
              icon="call-outline"
              label="Telefon belgisi"
              value={profile?.phone ? `+993 ${profile.phone}` : ""}
              borderColor={colors.border}
              foreground={colors.foreground}
              mutedForeground={colors.mutedForeground}
              primary={colors.primary}
            />
            <InfoRow
              icon="location-outline"
              label="Welaýat"
              value={profile?.region ?? ""}
              borderColor={colors.border}
              foreground={colors.foreground}
              mutedForeground={colors.mutedForeground}
              primary={colors.primary}
            />
            <InfoRow
              icon="map-outline"
              label="Tuman / Şäher"
              value={profile?.district ?? ""}
              borderColor={colors.border}
              foreground={colors.foreground}
              mutedForeground={colors.mutedForeground}
              primary={colors.primary}
            />
            <InfoRow
              icon="briefcase-outline"
              label="Käri"
              value={profile?.profession ?? ""}
              borderColor={colors.border}
              foreground={colors.foreground}
              mutedForeground={colors.mutedForeground}
              primary={colors.primary}
            />
            {profile?.bio ? (
              <InfoRow
                icon="chatbubble-outline"
                label="Bio"
                value={profile.bio}
                borderColor="transparent"
                foreground={colors.foreground}
                mutedForeground={colors.mutedForeground}
                primary={colors.primary}
              />
            ) : null}
          </View>

          {/* ── Profil doldurmak duýduryşy ────────────────────────── */}
          {!profile && (
            <View
              style={[
                s.warningBox,
                {
                  backgroundColor: colors.warning + "14",
                  borderColor: colors.warning + "40",
                },
              ]}
            >
              <Ionicons
                name="warning-outline"
                size={18}
                color={colors.warning}
              />
              <Text style={[s.warningText, { color: colors.warning }]}>
                Profil maglumatlary tapylmady. Hasaba girmek üçin aşakdaky
                düwmä basyň.
              </Text>
            </View>
          )}

          {/* ── Çykmak we arassalamak (Destruktiv) ───────────────── */}
          <Pressable
            onPress={loggingOut ? undefined : handleLogout}
            disabled={loggingOut}
            style={({ pressed }) => [
              s.logoutBtn,
              {
                backgroundColor: loggingOut
                  ? colors.muted
                  : pressed
                  ? "#dc2626"
                  : colors.destructive,
                opacity: loggingOut ? 0.7 : 1,
              },
            ]}
          >
            {loggingOut ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="log-out-outline" size={20} color="#fff" />
            )}
            <Text style={s.logoutText}>
              {loggingOut
                ? "Çykylyýar..."
                : "Ulgamdan çykmak we arassalamak"}
            </Text>
          </Pressable>

          <Text style={[s.logoutHint, { color: colors.mutedForeground }]}>
            Bu düwme lokal maglumatlaryny arassalar we hasaba giriş ekranyna
            gaýtarar. Firebase profil maglumatyňyz saklanyp galar.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

// ─── Stiller ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  headerSub: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    marginTop: 3,
  },

  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14 },

  content: {
    padding: 16,
    gap: 16,
  },

  avatarSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: "#1B6B3A",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  fullName: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
    textAlign: "center",
  },
  professionBadge: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  shortId: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
  },

  statsRow: {
    flexDirection: "row",
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 18,
    gap: 4,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    marginVertical: 14,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  repRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  card: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: 0.2,
  },

  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 8,
    shadowColor: "#ef4444",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  logoutText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.1,
  },

  logoutHint: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 17,
    paddingHorizontal: 8,
  },
});
