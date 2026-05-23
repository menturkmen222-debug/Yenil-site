import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, Alert,
  ActivityIndicator, Platform, Linking, Share, Animated,
} from "react-native";
import { router } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useColors } from "@/hooks/useColors";
import { PessimisticButton } from "@/components/PessimisticButton";
import { getDeviceIdAsync } from "@/lib/deviceId";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "";

const DAILY_LIMIT = 3;

interface ShareLink {
  id: string;
  token: string;
  status: "pending" | "active" | "expired";
  createdAt: string;
  expiresAt: string;
  lat: number | null;
  lon: number | null;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s öň`;
  return `${Math.floor(s / 60)}m öň`;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string; label: string }> = {
    pending:  { bg: "#fef3c7", text: "#b45309", label: "Garaşylýar" },
    active:   { bg: "#d1fae5", text: "#065f46", label: "Işjeň" },
    expired:  { bg: "#f3f4f6", text: "#6b7280", label: "Geçdi" },
  };
  const c = colors[status] ?? colors.pending;
  return (
    <View style={{ backgroundColor: c.bg, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Text style={{ color: c.text, fontSize: 11, fontWeight: "700" }}>{c.label}</Text>
    </View>
  );
}

export default function KonumScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const [tab, setTab] = useState<"create" | "live">("create");
  const [shares, setShares] = useState<ShareLink[]>([]);
  const [loadingShares, setLoadingShares] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const [liveToken, setLiveToken] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<"idle" | "requesting" | "tracking" | "error">("idle");
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lon: number; acc: number } | null>(null);
  const [updateCount, setUpdateCount] = useState(0);

  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startPulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  const stopPulse = useCallback(() => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  }, [pulseAnim]);

  const fetchShares = useCallback(async () => {
    try {
      const deviceId = await getDeviceIdAsync();
      const res = await fetch(`${API_BASE}/api/location/my-shares?deviceId=${encodeURIComponent(deviceId)}`);
      const data = await res.json();
      setShares(data.shares || []);
    } catch { setShares([]); }
    finally { setLoadingShares(false); }
  }, []);

  useEffect(() => { fetchShares(); }, [fetchShares]);

  async function createLink() {
    if (shares.length >= DAILY_LIMIT) { setShowPaywall(true); return; }
    setCreating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const deviceId = await getDeviceIdAsync();
      const res = await fetch(`${API_BASE}/api/location/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      });
      const data = await res.json();
      if (res.status === 429 || data.error === "daily_limit_reached") {
        setShowPaywall(true); return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await fetchShares();
    } catch {
      Alert.alert("Ýalňyşlyk", "Bilinmeýän ýalňyşlyk, gaýtadan synanyşyň.");
    } finally { setCreating(false); }
  }

  function getShareUrl(token: string): string {
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    if (domain) return `https://${domain}/konum/${token}`;
    return `/konum/${token}`;
  }

  async function copyLink(token: string) {
    const url = getShareUrl(token);
    try {
      await Share.share({ message: `Ýeňil — Ýer paýlaşma: ${url}`, url });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch { /* ignored */ }
  }

  async function startLiveTracking() {
    setLiveStatus("requesting");
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Rugsat berilmedi", "Sazlamalarda ýer rugsadyny açyň.");
      setLiveStatus("idle"); return;
    }

    if (shares.length >= DAILY_LIMIT && !liveToken) {
      setShowPaywall(true); setLiveStatus("idle"); return;
    }

    let token = liveToken;
    if (!token) {
      try {
        const deviceId = await getDeviceIdAsync();
        const res = await fetch(`${API_BASE}/api/location/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId }),
        });
        const data = await res.json();
        if (res.status === 429 || data.error === "daily_limit_reached") {
          setShowPaywall(true); setLiveStatus("idle"); return;
        }
        token = data.token;
        setLiveToken(token!);
        await fetchShares();
      } catch {
        Alert.alert("Ýalňyşlyk", "Link döretmek başartmady.");
        setLiveStatus("idle"); return;
      }
    }

    setLiveStatus("tracking");
    startPulse();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    watchRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 5 },
      async (loc) => {
        const lat = loc.coords.latitude;
        const lon = loc.coords.longitude;
        const acc = loc.coords.accuracy ?? 0;
        setLiveCoords({ lat, lon, acc });
        setUpdateCount(c => c + 1);
        try {
          await fetch(`${API_BASE}/api/location/share/${token}/live`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat, lon }),
          });
        } catch { /* silent */ }
      }
    );
  }

  async function stopLiveTracking() {
    watchRef.current?.remove();
    watchRef.current = null;
    stopPulse();
    setLiveStatus("idle");
    setLiveCoords(null);
    setUpdateCount(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }

  useEffect(() => () => { watchRef.current?.remove(); }, []);

  const usedCount = shares.length;
  const limitReached = usedCount >= DAILY_LIMIT;

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <LinearGradient colors={["#166534", "#15803d", "#16a34a"]} style={[s.header, { paddingTop: (isWeb ? 0 : insets.top) + 12 }]}>
        <View style={s.headerRow}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Feather name="arrow-left" size={20} color="#fff" />
          </Pressable>
          <View style={s.headerCenter}>
            <Ionicons name="location" size={20} color="rgba(255,255,255,0.9)" />
            <Text style={s.headerTitle}>Ýer paýlaşma</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <View style={[s.tabRow]}>
          <Pressable onPress={() => setTab("create")} style={[s.tabBtn, tab === "create" && s.tabActive]}>
            <Ionicons name="link-outline" size={15} color={tab === "create" ? "#15803d" : "rgba(255,255,255,0.75)"} />
            <Text style={[s.tabLabel, tab === "create" ? { color: "#15803d" } : { color: "rgba(255,255,255,0.75)" }]}>
              Link dörediň
            </Text>
          </Pressable>
          <Pressable onPress={() => setTab("live")} style={[s.tabBtn, tab === "live" && s.tabActive]}>
            <Ionicons name="radio-outline" size={15} color={tab === "live" ? "#15803d" : "rgba(255,255,255,0.75)"} />
            <Text style={[s.tabLabel, tab === "live" ? { color: "#15803d" } : { color: "rgba(255,255,255,0.75)" }]}>
              Canlý paýlaş
            </Text>
          </Pressable>
        </View>
      </LinearGradient>

      {tab === "create" ? (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 110 : 110 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.usageRow}>
              <Text style={[s.usageLabel, { color: colors.foreground }]}>Şu günki ulanyş</Text>
              <Text style={[s.usageCount, { color: limitReached ? "#dc2626" : colors.primary }]}>
                {usedCount} / {DAILY_LIMIT}
              </Text>
            </View>
            <View style={s.pillRow}>
              {Array.from({ length: DAILY_LIMIT }).map((_, i) => (
                <View key={i} style={[s.pill, {
                  backgroundColor: i < usedCount
                    ? (limitReached ? "#dc2626" : colors.primary)
                    : colors.border,
                }]} />
              ))}
            </View>
            <Text style={[s.usageHint, { color: colors.mutedForeground }]}>
              {limitReached
                ? "Günlik mugt çäge ýetdiňiz. Premium alyň."
                : `${DAILY_LIMIT - usedCount} link döretmek hukugyňyz bar.`}
            </Text>
          </View>

          <PessimisticButton
            label={limitReached ? "Premium al — Çäksiz link" : "Täze paýlaşma linki döret"}
            loadingLabel="Döredilýär..."
            loading={creating}
            disabled={creating}
            onPress={limitReached ? () => setShowPaywall(true) : createLink}
            color={limitReached ? "#7c3aed" : "#166534"}
            size="lg"
            icon={<Ionicons name={limitReached ? "arrow-up-circle-outline" : "add-circle-outline"} size={22} color="#fff" />}
          />

          {loadingShares ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : shares.length === 0 ? (
            <View style={s.emptyBox}>
              <Ionicons name="location-outline" size={44} color={colors.mutedForeground} />
              <Text style={[s.emptyText, { color: colors.mutedForeground }]}>Şu gün hiç link döretmediňiz.</Text>
            </View>
          ) : (
            <>
              <Text style={[s.sectionHead, { color: colors.mutedForeground }]}>ŞU GÜNKI LINKLER</Text>
              {shares.map(share => (
                <View key={share.token} style={[s.linkCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={s.linkTop}>
                    <View style={[s.tokenBadge, { backgroundColor: colors.primary + "14" }]}>
                      <Text style={[s.tokenText, { color: colors.primary }]}>{share.token}</Text>
                    </View>
                    <StatusBadge status={share.status} />
                    <Text style={[s.timeText, { color: colors.mutedForeground }]}>{formatTime(share.createdAt)}</Text>
                  </View>
                  {share.status === "active" && share.lat && share.lon && (
                    <View style={[s.coordRow, { backgroundColor: colors.primary + "0D" }]}>
                      <Ionicons name="navigate" size={12} color={colors.primary} />
                      <Text style={[s.coordText, { color: colors.primary }]}>
                        {share.lat.toFixed(4)}, {share.lon.toFixed(4)} · {formatAgo(share.createdAt)}
                      </Text>
                    </View>
                  )}
                  <View style={s.linkActions}>
                    <Pressable
                      onPress={() => copyLink(share.token)}
                      style={({ pressed }) => [s.actionBtn, { backgroundColor: colors.background, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
                    >
                      <Ionicons name="share-outline" size={16} color={colors.foreground} />
                      <Text style={[s.actionBtnText, { color: colors.foreground }]}>Paýlaş</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => Linking.openURL(getShareUrl(share.token))}
                      style={({ pressed }) => [s.actionBtnPrimary, { opacity: pressed ? 0.7 : 1 }]}
                    >
                      <LinearGradient colors={["#166534", "#16a34a"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.actionBtnPrimaryInner}>
                        <Ionicons name="open-outline" size={15} color="#fff" />
                        <Text style={s.actionBtnPrimaryText}>Aç</Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: isWeb ? 110 : 110 }}
          showsVerticalScrollIndicator={false}
        >
          {liveStatus === "idle" || liveStatus === "requesting" ? (
            <View style={s.liveIdleBox}>
              <Animated.View style={[s.livePulseOuter, { transform: [{ scale: pulseAnim }] }]}>
                <LinearGradient colors={["#166534", "#16a34a"]} style={s.livePulseInner}>
                  <Ionicons name="radio" size={44} color="#fff" />
                </LinearGradient>
              </Animated.View>
              <Text style={[s.liveTitle, { color: colors.foreground }]}>Canlý ýer yzarlama</Text>
              <Text style={[s.liveDesc, { color: colors.mutedForeground }]}>
                Başlatanyňyzda GPS pozisiýaňyz her 5 sekuntda awtomatik iberilýär. Alyjy haýsy ýerdedigiňizi canlý görüp biler.
              </Text>
              <View style={[s.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {[
                  { icon: "location", text: "Ýokary takyklykly GPS" },
                  { icon: "refresh", text: "Her 5 sekuntda täzelenýär" },
                  { icon: "link", text: "Paýlaşma linki awtomatik döredilýär" },
                  { icon: "shield-checkmark", text: "24 sagat soň awtomatik öçýär" },
                ].map((f, i) => (
                  <View key={i} style={s.infoRow}>
                    <View style={[s.infoIcon, { backgroundColor: colors.primary + "18" }]}>
                      <Ionicons name={f.icon as any} size={16} color={colors.primary} />
                    </View>
                    <Text style={[s.infoText, { color: colors.foreground }]}>{f.text}</Text>
                  </View>
                ))}
              </View>
              <PessimisticButton
                label="Canlý yzarlamany başlat"
                loadingLabel="Başlanýar..."
                loading={liveStatus === "requesting"}
                disabled={liveStatus === "requesting"}
                onPress={startLiveTracking}
                color="#166534"
                size="lg"
                icon={<Ionicons name="radio" size={22} color="#fff" />}
              />
            </View>
          ) : (
            <View style={s.liveActiveBox}>
              <View style={s.liveBadgeRow}>
                <View style={s.liveBadge}>
                  <View style={s.liveDot} />
                  <Text style={s.liveBadgeText}>CANLÝ YZARLANÝAR</Text>
                </View>
                <Text style={[s.updateCount, { color: colors.mutedForeground }]}>{updateCount} täzelenme</Text>
              </View>

              {liveCoords && (
                <View style={[s.coordCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={s.coordCardRow}>
                    <View style={[s.coordIcon, { backgroundColor: colors.primary + "18" }]}>
                      <Ionicons name="navigate" size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.coordCardTitle, { color: colors.foreground }]}>Häzirki pozisiýa</Text>
                      <Text style={[s.coordCardCoords, { color: colors.primary }]}>
                        {liveCoords.lat.toFixed(6)},  {liveCoords.lon.toFixed(6)}
                      </Text>
                      <Text style={[s.coordCardAcc, { color: colors.mutedForeground }]}>
                        Takyklyk: ±{Math.round(liveCoords.acc)}m
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {liveToken && (
                <View style={[s.liveTokenCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[s.liveTokenLabel, { color: colors.mutedForeground }]}>Paýlaşma linki</Text>
                  <Text style={[s.liveTokenUrl, { color: colors.primary }]} numberOfLines={1}>
                    {getShareUrl(liveToken)}
                  </Text>
                  <Pressable onPress={() => liveToken && copyLink(liveToken)} style={[s.shareLiveBtn, { borderColor: colors.border }]}>
                    <Ionicons name="share-social-outline" size={18} color={colors.primary} />
                    <Text style={[s.shareLiveBtnText, { color: colors.primary }]}>Linki paýlaş</Text>
                  </Pressable>
                </View>
              )}

              <Pressable
                onPress={stopLiveTracking}
                style={({ pressed }) => [s.stopBtn, { opacity: pressed ? 0.75 : 1 }]}
              >
                <View style={s.stopBtnInner}>
                  <Ionicons name="stop-circle" size={22} color="#dc2626" />
                  <Text style={s.stopBtnText}>Yzarlamany durdur</Text>
                </View>
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}

      {showPaywall && (
        <View style={s.paywallOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowPaywall(false)} />
          <View style={[s.paywallSheet, { backgroundColor: colors.card }]}>
            <View style={[s.paywallHandle, { backgroundColor: colors.border }]} />
            <Text style={[s.paywallTitle, { color: colors.foreground }]}>Tarif saýla</Text>
            <Text style={[s.paywallSub, { color: colors.mutedForeground }]}>
              Günlik mugt çäge ýetdiňiz.
            </Text>
            {[
              { tier: "Free", desc: "Günde 3 link", badge: "Çäge ýetdi", badgeBg: "#fee2e2", badgeText: "#dc2626" },
              { tier: "Plus", desc: "Çäksiz standart paýlaşma", badge: "Premium", badgeBg: "#d1fae5", badgeText: "#065f46", highlight: true },
              { tier: "VIP", desc: "Çäksiz + Canlý yzarlama", badge: "Ýakyn wagtda", badgeBg: "#ede9fe", badgeText: "#7c3aed", vip: true },
            ].map((t, i) => (
              <View key={i} style={[s.tierRow, {
                borderColor: t.highlight ? colors.primary : t.vip ? "#a855f7" : colors.border,
                borderWidth: t.highlight || t.vip ? 2 : 1.5,
                backgroundColor: t.highlight ? colors.primary + "08" : t.vip ? "#7c3aed08" : colors.background,
              }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.tierName, { color: t.highlight ? colors.primary : t.vip ? "#7c3aed" : colors.foreground }]}>
                    {t.tier}
                  </Text>
                  <Text style={[s.tierDesc, { color: colors.mutedForeground }]}>{t.desc}</Text>
                </View>
                <View style={[s.tierBadge, { backgroundColor: t.badgeBg }]}>
                  <Text style={[s.tierBadgeText, { color: t.badgeText }]}>{t.badge}</Text>
                </View>
              </View>
            ))}
            <Pressable onPress={() => setShowPaywall(false)} style={[s.paywallClose, { borderColor: colors.border }]}>
              <Text style={[s.paywallCloseText, { color: colors.mutedForeground }]}>Ýap</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 0 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  tabRow: { flexDirection: "row", gap: 10, paddingBottom: 16 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.15)" },
  tabActive: { backgroundColor: "#fff" },
  tabLabel: { fontSize: 13, fontWeight: "700" },

  card: { borderRadius: 18, borderWidth: 1.5, padding: 18, marginBottom: 14 },
  usageRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  usageLabel: { fontWeight: "700", fontSize: 14 },
  usageCount: { fontWeight: "800", fontSize: 16 },
  pillRow: { flexDirection: "row", gap: 6, marginBottom: 8 },
  pill: { flex: 1, height: 7, borderRadius: 99 },
  usageHint: { fontSize: 12, lineHeight: 17 },

  createBtn: { borderRadius: 16, marginBottom: 20, overflow: "hidden" },
  createBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, paddingHorizontal: 20 },
  createBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  emptyBox: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 14 },

  sectionHead: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 10 },

  linkCard: { borderRadius: 16, borderWidth: 1.5, padding: 14, marginBottom: 10, gap: 10 },
  linkTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  tokenBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tokenText: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontWeight: "700", fontSize: 13 },
  timeText: { marginLeft: "auto", fontSize: 12 },
  coordRow: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  coordText: { fontSize: 11, fontWeight: "600" },
  linkActions: { flexDirection: "row", gap: 8 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5 },
  actionBtnText: { fontSize: 13, fontWeight: "600" },
  actionBtnPrimary: { borderRadius: 12, overflow: "hidden" },
  actionBtnPrimaryInner: { paddingHorizontal: 20, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 5 },
  actionBtnPrimaryText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  liveIdleBox: { alignItems: "center", gap: 18 },
  livePulseOuter: { width: 110, height: 110, borderRadius: 55, alignItems: "center", justifyContent: "center", shadowColor: "#15803d", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 12 },
  livePulseInner: { width: 110, height: 110, borderRadius: 55, alignItems: "center", justifyContent: "center" },
  liveTitle: { fontSize: 20, fontWeight: "800", textAlign: "center" },
  liveDesc: { fontSize: 14, textAlign: "center", lineHeight: 21, maxWidth: 300 },
  infoCard: { borderRadius: 16, borderWidth: 1.5, padding: 16, width: "100%", gap: 12 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  infoText: { fontSize: 14, fontWeight: "600", flex: 1 },
  liveStartBtn: { width: "100%", borderRadius: 16, overflow: "hidden" },
  liveStartBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 17 },
  liveStartBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  liveActiveBox: { gap: 14 },
  liveBadgeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#fee2e2", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#dc2626" },
  liveBadgeText: { color: "#dc2626", fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  updateCount: { fontSize: 13 },
  coordCard: { borderRadius: 16, borderWidth: 1.5, padding: 16 },
  coordCardRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  coordIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  coordCardTitle: { fontSize: 13, fontWeight: "600", marginBottom: 3 },
  coordCardCoords: { fontSize: 14, fontWeight: "800", marginBottom: 2 },
  coordCardAcc: { fontSize: 12 },
  liveTokenCard: { borderRadius: 16, borderWidth: 1.5, padding: 16, gap: 8 },
  liveTokenLabel: { fontSize: 12, fontWeight: "600" },
  liveTokenUrl: { fontSize: 13, fontWeight: "700" },
  shareLiveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, borderWidth: 1.5, paddingVertical: 11 },
  shareLiveBtnText: { fontSize: 14, fontWeight: "700" },
  stopBtn: { marginTop: 8 },
  stopBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 15, borderRadius: 16, backgroundColor: "#fee2e2", borderWidth: 1.5, borderColor: "#fecaca" },
  stopBtnText: { color: "#dc2626", fontSize: 15, fontWeight: "700" },

  paywallOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end", zIndex: 9999 },
  paywallSheet: { borderRadius: 28, margin: 8, padding: 24, gap: 12 },
  paywallHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  paywallTitle: { fontSize: 20, fontWeight: "800", textAlign: "center" },
  paywallSub: { fontSize: 14, textAlign: "center", marginBottom: 4 },
  tierRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14 },
  tierName: { fontSize: 16, fontWeight: "800" },
  tierDesc: { fontSize: 12, marginTop: 2 },
  tierBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  tierBadgeText: { fontSize: 12, fontWeight: "700" },
  paywallClose: { borderRadius: 14, borderWidth: 1.5, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  paywallCloseText: { fontSize: 15, fontWeight: "600" },
});
