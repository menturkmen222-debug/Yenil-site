import React, { useState, useEffect, useRef, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View, Text, ScrollView, StyleSheet, Pressable, Switch,
  Alert, Linking, Platform, Modal, TextInput,
  ActivityIndicator, Animated,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { router, type Href } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { PessimisticButton } from "@/components/PessimisticButton";
import { RipplePress } from "@/components/RipplePress";
import { useTheme } from "@/contexts/ThemeContext";
import { useBonusPul } from "@/contexts/BonusPulContext";
import { useLanguage, LANGUAGES } from "@/contexts/LanguageContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { type ThemeKey } from "@/constants/colors";
import {
  getReputation, watchReputation, watchFriends, addFriend, removeFriend,
  getBPTransferHistory, saveDispute, setUserNickname, getUserNickname,
  getReputation as fetchReputation, seedTestAccount,
  type ReputationData, type FriendEntry, type BPTransfer,
} from "@/lib/firebase";
import { getLocalProfile, type LocalProfile } from "@/lib/localProfile";
import {
  getLevel, getNextLevel, getProgressPercent, getImprovementTips,
  getWhyDescription, formatRelativeTime, LEVELS,
} from "@/lib/reputation";

const APP_VERSION = "2.4.1";

const THEMES: {
  key: ThemeKey; label: string; sublabel: string; icon: string;
  preview: [string, string]; accent: string; dot: string;
}[] = [
  { key: "green", label: "Ýaşyl", sublabel: "Tebigy & Arassa", icon: "leaf-outline", preview: ["#166534", "#16a34a"], accent: "#16a34a", dot: "#4ade80" },
  { key: "dark", label: "Garaňky", sublabel: "Gijeki & Göz rahat", icon: "moon-outline", preview: ["#111111", "#1e1e1e"], accent: "#22c55e", dot: "#22c55e" },
  { key: "white", label: "Ak", sublabel: "Arassa & Ýagty", icon: "sunny-outline", preview: ["#1d4ed8", "#3b82f6"], accent: "#3b82f6", dot: "#93c5fd" },
  { key: "girls", label: "Gyzlar", sublabel: "Romantic & Owadan", icon: "flower-outline", preview: ["#9d174d", "#ec4899"], accent: "#ec4899", dot: "#f9a8d4" },
];

// ─── Shared UI helpers ────────────────────────────────────────────────────────

function SectionTitle({ title, colors }: { title: string; colors: ReturnType<typeof useColors> }) {
  return (
    <Text style={[s.groupTitle, { color: colors.mutedForeground }]}>{title}</Text>
  );
}

function Divider({ colors }: { colors: ReturnType<typeof useColors> }) {
  return <View style={[s.divider, { backgroundColor: colors.border }]} />;
}

function SettingRow({
  icon, iconColor, label, desc, value, onPress, right, colors,
}: {
  icon: keyof typeof Ionicons.glyphMap; iconColor?: string;
  label: string; desc?: string; value?: string;
  onPress?: () => void; right?: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  const ic = iconColor ?? colors.primary;
  return (
    <RipplePress
      onPress={onPress}
      style={s.row}
      borderRadius={14}
      rippleSize={140}
      disabled={!onPress}
    >
      <View style={[s.rowIcon, { backgroundColor: ic + "22" }]}>
        <Ionicons name={icon} size={20} color={ic} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowLabel, { color: colors.foreground }]}>{label}</Text>
        {desc ? <Text style={[s.rowDesc, { color: colors.mutedForeground }]}>{desc}</Text> : null}
      </View>
      {right ?? (value
        ? <Text style={[s.rowValue, { color: colors.primary }]}>{value}</Text>
        : onPress
          ? <Ionicons name="chevron-forward-outline" size={16} color={colors.mutedForeground} />
          : null)}
    </RipplePress>
  );
}

// ─── Reputation level badge ───────────────────────────────────────────────────

function LevelBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const level = getLevel(score);
  const fs = size === "sm" ? 11 : size === "lg" ? 15 : 12;
  const efs = size === "sm" ? 14 : size === "lg" ? 20 : 16;
  const px = size === "sm" ? 8 : 12;
  const py = size === "sm" ? 4 : 7;
  return (
    <View style={{
      flexDirection: "row", alignItems: "center", gap: 5,
      backgroundColor: level.bg, borderRadius: 50,
      paddingHorizontal: px, paddingVertical: py,
      borderWidth: 1.5, borderColor: level.border,
    }}>
      <Ionicons name={level.icon as any} size={efs} color={level.color} />
      <Text style={{ fontSize: fs, fontWeight: "700", color: level.color }}>{level.labelTm}</Text>
    </View>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ScoreBar({ score, primary }: { score: number; primary: string }) {
  const pct = getProgressPercent(score);
  const next = getNextLevel(score);
  return (
    <View>
      <View style={[s.progressWrap]}>
        <Animated.View
          style={[s.progressBar, { width: `${score}%`, backgroundColor: primary }]}
        />
      </View>
      {next && (
        <Text style={[s.nextLevelHint, { color: primary }]}>
          {next.label} derejesine {next.minScore - score} bal galdy ({pct}%)
        </Text>
      )}
    </View>
  );
}

// ─════════════════════════════════════════════════════════
//  REPUTATION MODAL
// ══════════════════════════════════════════════════════════

function ReputationModal({
  visible, onClose, repData, deviceId, colors,
}: {
  visible: boolean; onClose: () => void;
  repData: ReputationData; deviceId: string;
  colors: ReturnType<typeof useColors>;
}) {
  const [tab, setTab] = useState<"info" | "history" | "search" | "dispute">("info");
  const [searchId, setSearchId] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{ rep: ReputationData; nickname: string } | null>(null);
  const [searchErr, setSearchErr] = useState("");
  const [dispDesc, setDispDesc] = useState("");
  const [dispEv, setDispEv] = useState("");
  const [dispSending, setDispSending] = useState(false);
  const [dispDone, setDispDone] = useState(false);

  const level = getLevel(repData.score);
  const tips = getImprovementTips(repData.score);
  const why = getWhyDescription(repData.score);

  async function doSearch() {
    const id = searchId.trim();
    if (!id) return;
    setSearching(true); setSearchResult(null); setSearchErr("");
    try {
      const [rep, nick] = await Promise.all([
        fetchReputation(id),
        getUserNickname(id).catch(() => ""),
      ]);
      setSearchResult({ rep, nickname: nick });
    } catch {
      setSearchErr("Gözleg wagtynda ýalňyşlyk");
    } finally {
      setSearching(false);
    }
  }

  async function doDispute() {
    if (!dispDesc.trim()) { Alert.alert("Ýalňyşlyk", "Beýany ýazyň"); return; }
    setDispSending(true);
    try {
      await saveDispute({ reporterDeviceId: deviceId, targetDeviceId: deviceId, description: dispDesc.trim(), evidence: dispEv.trim(), status: "pending" });
      setDispDone(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Ýalňyşlyk", "Ýüz tutma iberilmedi");
    } finally {
      setDispSending(false);
    }
  }

  const TABS: { id: typeof tab; label: string }[] = [
    { id: "info", label: "Maglumat" },
    { id: "history", label: "Taryh" },
    { id: "search", label: "Gözle" },
    { id: "dispute", label: "Ýüz tut" },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.modalWrap, { backgroundColor: colors.background }]}>
        {/* Handle */}
        <View style={[s.modalHandle, { backgroundColor: colors.border }]} />

        {/* Header */}
        <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>Abraý / Ynam ulgamy</Text>
            <Text style={[s.modalSub, { color: colors.mutedForeground }]}>Siziň platforma derejeniz</Text>
          </View>
          <Pressable onPress={onClose} style={[s.modalCloseBtn, { backgroundColor: colors.muted }]}>
            <Ionicons name="close" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {/* Score hero */}
        <View style={[s.repHero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <View>
              <Text style={[s.scoreNum, { color: colors.primary }]}>{repData.score}</Text>
              <Text style={[s.scoreLabel, { color: colors.mutedForeground }]}>/ 100 bal</Text>
            </View>
            <LevelBadge score={repData.score} size="lg" />
          </View>
          <ScoreBar score={repData.score} primary={colors.primary} />

          {/* Level strip */}
          <View style={s.levelStrip}>
            {LEVELS.map(lv => {
              const active = lv.id === level.id;
              const reached = repData.score >= lv.minScore;
              return (
                <View key={lv.id} style={[s.levelDot, { opacity: active ? 1 : reached ? 0.55 : 0.25 }]}>
                  <Ionicons name={lv.icon as any} size={18} color={lv.color} />
                  <Text style={{ fontSize: 9, fontWeight: "700", color: lv.color, marginTop: 2 }}>{lv.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Tabs */}
        <View style={[s.tabRow, { backgroundColor: colors.muted }]}>
          {TABS.map(t => (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={[s.tabBtn, tab === t.id && { backgroundColor: colors.primary }]}
            >
              <Text style={[s.tabBtnText, { color: tab === t.id ? "#fff" : colors.mutedForeground }]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

          {/* ── INFO ── */}
          {tab === "info" && (
            <View style={{ gap: 14 }}>
              <View style={[s.infoBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "28" }]}>
                <Text style={[s.infoBoxText, { color: colors.foreground }]}>{why}</Text>
              </View>

              <Text style={[s.subHead, { color: colors.foreground }]}>Abraýy nädip ýokarlatmaly?</Text>
              {tips.map((t, i) => (
                <View key={i} style={[s.tipRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Ionicons name={t.icon as any} size={20} color={colors.primary} />
                  <Text style={[s.tipText, { color: colors.foreground }]}>{t.text}</Text>
                </View>
              ))}

              <View style={[s.warnBox, { backgroundColor: colors.warning + "12", borderColor: colors.warning + "30" }]}>
                <Ionicons name="warning-outline" size={16} color={colors.warning} />
                <Text style={[s.warnText, { color: colors.foreground }]}>
                  Abraýyňyz siziň platformadaky hereketleriňize görä awtomatik hasaplanýar. Dogrylyk we jogapkärçilik esasynda ýokary bal gazanyp bilersiňiz.
                </Text>
              </View>
            </View>
          )}

          {/* ── HISTORY ── */}
          {tab === "history" && (
            <View style={{ gap: 8 }}>
              {repData.entries.length === 0 ? (
                <View style={s.emptyWrap}>
                  <Ionicons name="document-text-outline" size={36} color={colors.mutedForeground} />
                  <Text style={[s.emptyText, { color: colors.mutedForeground }]}>Heniz taryh ýok</Text>
                  <Text style={[s.emptySubText, { color: colors.mutedForeground }]}>
                    Platformada amal edeniňizde bu ýerde görüner
                  </Text>
                </View>
              ) : repData.entries.map((e, i) => (
                <View key={i} style={[s.historyItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[s.deltaBadge, {
                    backgroundColor: e.type === "positive" ? "#05966912" : e.type === "negative" ? "#dc262612" : "#64748b12",
                  }]}>
                    <Text style={[s.deltaText, {
                      color: e.type === "positive" ? "#059669" : e.type === "negative" ? "#dc2626" : "#64748b",
                    }]}>
                      {e.delta > 0 ? `+${e.delta}` : e.delta}
                    </Text>
                  </View>
                  <Text style={[s.historyReason, { color: colors.foreground }]}>{e.reason}</Text>
                  <Text style={[s.historyTime, { color: colors.mutedForeground }]}>{formatRelativeTime(e.timestamp)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── SEARCH ── */}
          {tab === "search" && (
            <View style={{ gap: 12 }}>
              <Text style={[s.subHead, { color: colors.foreground }]}>Başga ulanyjyny gözle</Text>
              <Text style={[s.subDesc, { color: colors.mutedForeground }]}>
                Islendik ulanyjynyň ID-sini giriziň we onuň abraý derejesini görüň
              </Text>
              <View style={s.searchRow}>
                <TextInput
                  style={[s.searchInput, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="Ulanyjy ID-ni giriz..."
                  placeholderTextColor={colors.mutedForeground}
                  value={searchId}
                  onChangeText={setSearchId}
                  onSubmitEditing={doSearch}
                  autoCapitalize="none"
                />
                <PessimisticButton
                  label=""
                  loadingLabel=""
                  loading={searching}
                  disabled={searching || !searchId.trim()}
                  onPress={doSearch}
                  color={colors.primary}
                  size="sm"
                  icon={<Ionicons name="search-outline" size={18} color="#fff" />}
                />
              </View>

              {searchErr ? (
                <View style={[s.infoBox, { backgroundColor: "#dc262610", borderColor: "#dc262630" }]}>
                  <Text style={{ color: "#dc2626", fontSize: 13 }}>{searchErr}</Text>
                </View>
              ) : null}

              {searchResult && (() => {
                const lvl = getLevel(searchResult.rep.score);
                return (
                  <View style={[s.searchResultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <View style={[s.friendAvatar, { backgroundColor: lvl.bg, borderColor: lvl.border }]}>
                          <Ionicons name={lvl.icon as any} size={20} color={lvl.color} />
                        </View>
                        <View>
                          <Text style={[s.friendName, { color: colors.foreground }]}>
                            {searchResult.nickname || searchId.slice(0, 14) + "..."}
                          </Text>
                          <Text style={[s.friendIdText, { color: colors.mutedForeground }]}>
                            {searchId.slice(0, 20)}...
                          </Text>
                        </View>
                      </View>
                      <View>
                        <Text style={[s.scoreNum, { fontSize: 24, color: colors.primary }]}>{searchResult.rep.score}</Text>
                        <Text style={[s.scoreLabel, { color: colors.mutedForeground, textAlign: "right" }]}>/100</Text>
                      </View>
                    </View>
                    <LevelBadge score={searchResult.rep.score} />
                    <Text style={[s.infoBoxText, { color: colors.mutedForeground, marginTop: 10, fontSize: 12 }]}>
                      {getWhyDescription(searchResult.rep.score)}
                    </Text>
                    {searchResult.rep.entries.filter(e => e.isPublic).length > 0 && (
                      <View style={{ marginTop: 12, gap: 6 }}>
                        <Text style={[s.subHead, { color: colors.foreground, fontSize: 12 }]}>Açyk taryh</Text>
                        {searchResult.rep.entries.filter(e => e.isPublic).slice(0, 3).map((e, i) => (
                          <View key={i} style={[s.historyItem, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                            <View style={[s.deltaBadge, { backgroundColor: e.type === "positive" ? "#05966912" : "#dc262612" }]}>
                              <Text style={[s.deltaText, { color: e.type === "positive" ? "#059669" : "#dc2626", fontSize: 10 }]}>
                                {e.delta > 0 ? `+${e.delta}` : e.delta}
                              </Text>
                            </View>
                            <Text style={[s.historyReason, { color: colors.foreground, fontSize: 11 }]}>{e.reason}</Text>
                            <Text style={[s.historyTime, { color: colors.mutedForeground }]}>{formatRelativeTime(e.timestamp)}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })()}
            </View>
          )}

          {/* ── DISPUTE ── */}
          {tab === "dispute" && (
            <View style={{ gap: 14 }}>
              {dispDone ? (
                <View style={[s.successBox, { backgroundColor: colors.success + "10", borderColor: colors.success + "28" }]}>
                  <Ionicons name="checkmark-circle-outline" size={40} color={colors.success} />
                  <Text style={[s.subHead, { color: colors.foreground, textAlign: "center" }]}>Iberildi!</Text>
                  <Text style={[s.subDesc, { color: colors.mutedForeground, textAlign: "center", marginTop: 6 }]}>
                    Siziň ýüz tutmanyňyz alyndy. Toparymyz iň gysga wagtda seredip jogap berer.
                  </Text>
                  <Pressable
                    onPress={() => setDispDone(false)}
                    style={[s.btnSecondary, { borderColor: colors.border, marginTop: 14 }]}
                  >
                    <Text style={[s.btnSecText, { color: colors.foreground }]}>Täzeden ýaz</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <View style={[s.infoBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "28" }]}>
                    <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
                    <Text style={[s.infoBoxText, { color: colors.foreground }]}>
                      Siziň abraý balynyz ýalňyş hasaplandy öýdýäňizmi? Delilleriňiz bilen bize ýüz tutuň.
                    </Text>
                  </View>

                  <View style={{ gap: 6 }}>
                    <Text style={[s.inputLabel, { color: colors.foreground }]}>Ýagdaýy düşündiriň *</Text>
                    <TextInput
                      style={[s.textArea, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
                      placeholder="Ýagdaýy jikme-jik beýan ediň..."
                      placeholderTextColor={colors.mutedForeground}
                      value={dispDesc}
                      onChangeText={setDispDesc}
                      multiline numberOfLines={3}
                    />
                  </View>

                  <View style={{ gap: 6 }}>
                    <Text style={[s.inputLabel, { color: colors.foreground }]}>Delilleriniz (islege görä)</Text>
                    <TextInput
                      style={[s.textArea, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
                      placeholder="Sargyt ID-leri, seneler, ş.m..."
                      placeholderTextColor={colors.mutedForeground}
                      value={dispEv}
                      onChangeText={setDispEv}
                      multiline numberOfLines={2}
                    />
                  </View>

                  <PessimisticButton
                    label="Iberiň"
                    loadingLabel="Iberilýär..."
                    loading={dispSending}
                    disabled={dispSending || !dispDesc.trim()}
                    onPress={doDispute}
                    color={colors.primary}
                    size="md"
                    icon={<Ionicons name="paper-plane-outline" size={16} color="#fff" />}
                  />
                </>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─════════════════════════════════════════════════════════
//  FRIENDS MODAL
// ══════════════════════════════════════════════════════════

function FriendsModal({
  visible, onClose, deviceId, colors,
}: {
  visible: boolean; onClose: () => void; deviceId: string;
  colors: ReturnType<typeof useColors>;
}) {
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [friendReps, setFriendReps] = useState<Record<string, number>>({});
  const [addId, setAddId] = useState("");
  const [addNick, setAddNick] = useState("");
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (!visible || !deviceId) return;
    const unsub = watchFriends(deviceId, setFriends);
    return () => unsub();
  }, [visible, deviceId]);

  useEffect(() => {
    friends.forEach(f => {
      getReputation(f.deviceId).then(r => {
        setFriendReps(prev => ({ ...prev, [f.deviceId]: r.score }));
      });
    });
  }, [friends]);

  async function handleAdd() {
    const id = addId.trim();
    if (!id) { Alert.alert("Ýalňyşlyk", "ID giriziň"); return; }
    if (id === deviceId) { Alert.alert("Ýalňyşlyk", "Özüňizi goşup bilmersiňiz"); return; }
    setAdding(true);
    try {
      await addFriend(deviceId, id, addNick || undefined);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAddId(""); setAddNick(""); setShowAddForm(false);
    } catch {
      Alert.alert("Ýalňyşlyk", "Nädogry ID ýa-da ulgam ýalňyşlygy");
    } finally {
      setAdding(false);
    }
  }

  function handleRemove(f: FriendEntry) {
    Alert.alert("Aýyr", `"${f.nickname}" tanyşlar sanawyndan aýyrylsyn my?`, [
      { text: "Ýok" },
      {
        text: "Hawa, aýyr", style: "destructive",
        onPress: async () => {
          await removeFriend(deviceId, f.deviceId);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      },
    ]);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.modalWrap, { backgroundColor: colors.background }]}>
        <View style={[s.modalHandle, { backgroundColor: colors.border }]} />

        <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>Tanyşlar</Text>
            <Text style={[s.modalSub, { color: colors.mutedForeground }]}>{friends.length} tanyş</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAddForm(f => !f); }}
              style={[s.addFriendBtn, { backgroundColor: showAddForm ? colors.destructive + "15" : colors.primary + "18", borderColor: showAddForm ? colors.destructive + "40" : colors.primary + "40" }]}
            >
              <Ionicons name={showAddForm ? "close-outline" : "person-add-outline"} size={15} color={showAddForm ? colors.destructive : colors.primary} />
              <Text style={[s.addFriendBtnText, { color: showAddForm ? colors.destructive : colors.primary }]}>
                {showAddForm ? "Ýap" : "Goş"}
              </Text>
            </Pressable>
            <Pressable onPress={onClose} style={[s.modalCloseBtn, { backgroundColor: colors.muted }]}>
              <Ionicons name="close" size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

          {/* Add form */}
          {showAddForm && (
            <View style={[s.addForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.subHead, { color: colors.foreground }]}>Tanyş goş</Text>
              <View style={{ gap: 6, marginTop: 8 }}>
                <Text style={[s.inputLabel, { color: colors.foreground }]}>Tanyşyňyzyň ID-si *</Text>
                <TextInput
                  style={[s.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="dev_... ID giriz"
                  placeholderTextColor={colors.mutedForeground}
                  value={addId}
                  onChangeText={setAddId}
                  autoCapitalize="none"
                />
              </View>
              <View style={{ gap: 6, marginTop: 10 }}>
                <Text style={[s.inputLabel, { color: colors.foreground }]}>At (islege görä)</Text>
                <TextInput
                  style={[s.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="Tanyşyňyzyň adyny ýazyň..."
                  placeholderTextColor={colors.mutedForeground}
                  value={addNick}
                  onChangeText={setAddNick}
                />
              </View>
              <View style={{ marginTop: 12 }}>
                <PessimisticButton
                  label="Tanyş goş"
                  loadingLabel="Goşulýar..."
                  loading={adding}
                  disabled={adding || !addId.trim()}
                  onPress={handleAdd}
                  color={colors.primary}
                  size="md"
                  icon={<Ionicons name="person-add-outline" size={16} color="#fff" />}
                />
              </View>
            </View>
          )}

          {/* Friends list */}
          {friends.length === 0 ? (
            <View style={s.emptyWrap}>
              <Ionicons name="people-outline" size={44} color={colors.mutedForeground} />
              <Text style={[s.emptyText, { color: colors.mutedForeground }]}>Heniz tanyşlaryňyz ýok</Text>
              <Text style={[s.emptySubText, { color: colors.mutedForeground }]}>
                «Goş» düwmesini basyp ID bilen tanyş goşuň
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {friends.map(f => {
                const repScore = friendReps[f.deviceId] ?? 20;
                const lv = getLevel(repScore);
                return (
                  <View key={f.deviceId} style={[s.friendCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[s.friendAvatar, { backgroundColor: lv.bg, borderColor: lv.border }]}>
                      <Ionicons name={lv.icon as any} size={18} color={lv.color} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[s.friendName, { color: colors.foreground }]}>{f.nickname}</Text>
                      <Text style={[s.friendIdText, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {f.deviceId.slice(0, 18)}...
                      </Text>
                      <LevelBadge score={repScore} size="sm" />
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 8 }}>
                      <Text style={[s.friendScore, { color: colors.primary }]}>{repScore}<Text style={{ fontSize: 10, opacity: 0.5 }}>/100</Text></Text>
                      <Pressable
                        onPress={() => handleRemove(f)}
                        style={[s.removeBtn, { backgroundColor: "#ef444412" }]}
                      >
                        <Ionicons name="trash-outline" size={14} color="#ef4444" />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─════════════════════════════════════════════════════════
//  BP TRANSFER MODAL
// ══════════════════════════════════════════════════════════

function BPTransferModal({
  visible, onClose, deviceId, balance, sendBP, colors,
}: {
  visible: boolean; onClose: () => void; deviceId: string;
  balance: number; sendBP: (toId: string, amount: number, note?: string) => Promise<{ success: boolean; message: string }>;
  colors: ReturnType<typeof useColors>;
}) {
  const [tab, setTab] = useState<"send" | "history">("send");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<BPTransfer[]>([]);
  const [loadingHist, setLoadingHist] = useState(true);

  useEffect(() => {
    if (!visible || !deviceId) return;
    setLoadingHist(true);
    getBPTransferHistory(deviceId).then(h => { setHistory(h); setLoadingHist(false); });
  }, [visible, deviceId]);

  async function handleSend() {
    const id = toId.trim();
    const amt = parseFloat(amount);
    if (!id) { Alert.alert("Ýalňyşlyk", "Alyjynyň ID-ni giriziň"); return; }
    if (!amt || amt <= 0) { Alert.alert("Ýalňyşlyk", "Nädogry mukdar"); return; }
    if (amt > balance) { Alert.alert("Ýalňyşlyk", `Ýeterlik BP ýok (${balance.toFixed(2)} BP)`); return; }

    Alert.alert("Tassykla", `${amt} BP ${id.slice(0, 14)}... ID-li ulanyjya iberilsin my?`, [
      { text: "Ýok" },
      {
        text: "Hawa, iber",
        onPress: async () => {
          setSending(true);
          try {
            const result = await sendBP(id, amt, note);
            if (result.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Üstünlikli", result.message);
              setToId(""); setAmount(""); setNote("");
              const h = await getBPTransferHistory(deviceId);
              setHistory(h);
            } else {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert("Ýalňyşlyk", result.message);
            }
          } catch {
            Alert.alert("Ýalňyşlyk", "Geçirme başa barmady");
          } finally {
            setSending(false);
          }
        },
      },
    ]);
  }

  const QUICK = [10, 25, 50, 100];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.modalWrap, { backgroundColor: colors.background }]}>
        <View style={[s.modalHandle, { backgroundColor: colors.border }]} />

        <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>BP Geçirmek</Text>
            <Text style={[s.modalSub, { color: colors.mutedForeground }]}>Balans: {balance.toFixed(2)} BP</Text>
          </View>
          <Pressable onPress={onClose} style={[s.modalCloseBtn, { backgroundColor: colors.muted }]}>
            <Ionicons name="close" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {/* Tabs */}
        <View style={[s.tabRow, { backgroundColor: colors.muted }]}>
          {([{ id: "send", label: "Geçir" }, { id: "history", label: "Taryh" }] as const).map(t => (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={[s.tabBtn, tab === t.id && { backgroundColor: colors.primary }]}
            >
              <Text style={[s.tabBtnText, { color: tab === t.id ? "#fff" : colors.mutedForeground }]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

          {tab === "send" && (
            <View style={{ gap: 14 }}>
              {/* Balance chip */}
              <LinearGradient
                colors={[colors.headerGradientStart, colors.headerGradientEnd] as [string, string]}
                style={s.balanceChip}
              >
                <Ionicons name="wallet-outline" size={18} color="rgba(255,255,255,0.85)" />
                <Text style={s.balanceChipText}>{balance.toFixed(2)} BP</Text>
                <Text style={s.balanceChipLabel}>mowjut</Text>
              </LinearGradient>

              <View style={{ gap: 6 }}>
                <Text style={[s.inputLabel, { color: colors.foreground }]}>Alyjynyň ID-si *</Text>
                <TextInput
                  style={[s.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="dev_... ID giriz"
                  placeholderTextColor={colors.mutedForeground}
                  value={toId}
                  onChangeText={setToId}
                  autoCapitalize="none"
                />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={[s.inputLabel, { color: colors.foreground }]}>Mukdar (BP) *</Text>
                <TextInput
                  style={[s.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="Geçirjek BP mukdaryňyz"
                  placeholderTextColor={colors.mutedForeground}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />
                {/* Quick amounts */}
                <View style={s.quickRow}>
                  {QUICK.map(q => (
                    <Pressable
                      key={q}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAmount(String(q)); }}
                      style={[s.quickBtn, {
                        backgroundColor: amount === String(q) ? colors.primary : colors.input,
                        borderColor: amount === String(q) ? colors.primary : colors.border,
                      }]}
                    >
                      <Text style={[s.quickBtnText, { color: amount === String(q) ? "#fff" : colors.foreground }]}>{q}</Text>
                      <Text style={[s.quickBtnSub, { color: amount === String(q) ? "rgba(255,255,255,0.7)" : colors.mutedForeground }]}>BP</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={{ gap: 6 }}>
                <Text style={[s.inputLabel, { color: colors.foreground }]}>Bellik (islege görä)</Text>
                <TextInput
                  style={[s.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="Meselem: sagbol..."
                  placeholderTextColor={colors.mutedForeground}
                  value={note}
                  onChangeText={setNote}
                  maxLength={80}
                />
              </View>

              <PessimisticButton
                label={amount && parseFloat(amount) > 0 ? `${amount} BP Geçir` : "Geçir"}
                loadingLabel="Geçirilýär..."
                loading={sending}
                disabled={sending || !toId.trim() || !amount || parseFloat(amount) <= 0}
                onPress={handleSend}
                color={colors.primary}
                size="md"
                icon={<Ionicons name="paper-plane-outline" size={16} color="#fff" />}
              />
            </View>
          )}

          {tab === "history" && (
            <View style={{ gap: 8 }}>
              {loadingHist ? (
                <View style={s.emptyWrap}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : history.length === 0 ? (
                <View style={s.emptyWrap}>
                  <Ionicons name="cash-outline" size={36} color={colors.mutedForeground} />
                  <Text style={[s.emptyText, { color: colors.mutedForeground }]}>Heniz geçirme ýok</Text>
                </View>
              ) : history.map(t => {
                const isOut = t.from === deviceId;
                return (
                  <View key={t.id} style={[s.transferItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[s.transferIcon, { backgroundColor: isOut ? "#ef444412" : "#05966912" }]}>
                      <Ionicons
                        name={isOut ? "arrow-up-outline" : "arrow-down-outline"}
                        size={16}
                        color={isOut ? "#ef4444" : "#059669"}
                      />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[s.transferWho, { color: colors.foreground }]}>
                        {isOut
                          ? `→ ${t.toNickname || t.to.slice(0, 12) + "..."}`
                          : `← ${t.fromNickname || t.from.slice(0, 12) + "..."}`}
                      </Text>
                      {t.note ? <Text style={[s.transferNote, { color: colors.mutedForeground }]}>{t.note}</Text> : null}
                      <Text style={[s.historyTime, { color: colors.mutedForeground }]}>{formatRelativeTime(t.timestamp)}</Text>
                    </View>
                    <Text style={[s.transferAmount, { color: isOut ? "#ef4444" : "#059669" }]}>
                      {isOut ? "-" : "+"}{t.amount} BP
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─════════════════════════════════════════════════════════
//  NICKNAME EDIT MODAL
// ══════════════════════════════════════════════════════════

function NicknameModal({
  visible, onClose, deviceId, current, onSaved, colors,
}: {
  visible: boolean; onClose: () => void; deviceId: string;
  current: string; onSaved: (n: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [val, setVal] = useState(current);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (visible) setVal(current); }, [visible, current]);

  async function save() {
    if (!val.trim()) { onClose(); return; }
    setSaving(true);
    try {
      await setUserNickname(deviceId, val.trim());
      onSaved(val.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch {
      Alert.alert("Ýalňyşlyk", "At üýtgedilmedi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={s.nickOverlay}>
        <View style={[s.nickModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.modalTitle, { color: colors.foreground, marginBottom: 12 }]}>Adyňyzy üýtgediň</Text>
          <TextInput
            style={[s.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
            value={val}
            onChangeText={setVal}
            placeholder="Adyňyz..."
            placeholderTextColor={colors.mutedForeground}
            maxLength={32}
            autoFocus
          />
          <View style={s.nickBtns}>
            <Pressable onPress={onClose} style={[s.btnSecondary, { flex: 1, borderColor: colors.border }]}>
              <Text style={[s.btnSecText, { color: colors.foreground }]}>Ýap</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <PessimisticButton
                label="Saklat"
                loadingLabel="Saklanýar..."
                loading={saving}
                disabled={saving}
                onPress={save}
                color={colors.primary}
                size="md"
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN SCREEN
// ═══════════════════════════════════════════════════════════

export default function SozlamalarScreen() {
  const colors = useColors();
  const { themeKey, setTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { balance, deviceId, sendBP } = useBonusPul();
  const { addNotification } = useNotifications();
  const isWeb = Platform.OS === "web";

  // Language context
  const { lang, setLang, t } = useLanguage();

  // Existing state
  const [notifications, setNotifications] = useState(true);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  // New feature state
  const [repData, setRepData] = useState<ReputationData>({ score: 20, entries: [] });
  const [nickname, setNickname] = useState("");
  const [localProfile, setLocalProfile] = useState<LocalProfile | null>(null);
  const [showRepModal, setShowRepModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showBPModal, setShowBPModal] = useState(false);
  const [showNickModal, setShowNickModal] = useState(false);

  // PIN state
  const [pinEnabled, setPinEnabled] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinStage, setPinStage] = useState<"enter" | "confirm">("enter");
  const [newPin, setNewPin] = useState("");
  const [confirmPinVal, setConfirmPinVal] = useState("");
  const [pinError, setPinError] = useState("");

  // Load PIN status + notifications toggle
  useEffect(() => {
    AsyncStorage.getItem("app_pin_enabled").then(v => { if (v === "true") setPinEnabled(true); });
    AsyncStorage.getItem("@yenil_notifications_enabled").then(v => {
      if (v === "false") setNotifications(false);
    });
  }, []);

  // Load local profile from AsyncStorage
  useEffect(() => {
    getLocalProfile().then(p => { if (p) setLocalProfile(p); });
  }, []);

  // Load nickname + watch reputation
  useEffect(() => {
    if (!deviceId) return;
    getUserNickname(deviceId).then(n => { if (n) setNickname(n); });
    const unsub = watchReputation(deviceId, setRepData);
    return () => unsub();
  }, [deviceId]);

  function openPinModal() {
    setPinStage("enter"); setNewPin(""); setConfirmPinVal(""); setPinError("");
    setShowPinModal(true);
  }

  function handlePinKey(key: string) {
    if (key === "⌫") {
      if (pinStage === "enter") setNewPin(p => p.slice(0, -1));
      else setConfirmPinVal(p => p.slice(0, -1));
      return;
    }
    if (key === "") return;
    if (pinStage === "enter") {
      const next = newPin + key;
      setNewPin(next);
      if (next.length === 4) setTimeout(() => { setPinStage("confirm"); setPinError(""); }, 180);
    } else {
      const next = confirmPinVal + key;
      setConfirmPinVal(next);
      if (next.length === 4) {
        if (next === newPin) {
          setTimeout(async () => {
            await AsyncStorage.setItem("app_pin", next);
            await AsyncStorage.setItem("app_pin_enabled", "true");
            setPinEnabled(true);
            setShowPinModal(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Üstünlikli", "Gizlin kod bellendi!");
          }, 180);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setPinError("Parollar gabat gelmeýär!");
          setTimeout(() => { setPinStage("enter"); setNewPin(""); setConfirmPinVal(""); setPinError(""); }, 1000);
        }
      }
    }
  }

  async function disablePin() {
    Alert.alert("Paroly aýyr", "Gizlin kody aýyrmagy isleýärsiňizmi?", [
      { text: "Ýok" },
      { text: "Hawa, aýyr", style: "destructive", onPress: async () => {
        await AsyncStorage.removeItem("app_pin");
        await AsyncStorage.removeItem("app_pin_enabled");
        setPinEnabled(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }},
    ]);
  }

  const level = getLevel(repData.score);
  const pct = getProgressPercent(repData.score);
  const nextLv = getNextLevel(repData.score);
  const currentTheme = THEMES.find((t) => t.key === themeKey) ?? THEMES[0];
  const fullName = localProfile
    ? [localProfile.name, localProfile.surname].filter(Boolean).join(" ").trim()
    : "";
  const displayName = fullName || nickname || (deviceId ? deviceId.slice(0, 10) + "..." : "Ýüklenýär...");

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd] as [string, string]}
        style={[s.header, { paddingTop: (isWeb ? 0 : insets.top) + 14 }]}
      >
        <Text style={s.headerTitle}>{t("settings_title")}</Text>
        <Text style={s.headerSub}>{t("settings_sub")}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>

        {/* ══════════ ACCOUNT CARD ══════════ */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/(tabs)/profile" as Href);
          }}
          style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
        >
          <LinearGradient
            colors={[colors.headerGradientStart, colors.headerGradientEnd] as [string, string]}
            style={s.accountCard}
          >
            <View style={[s.accountAvatar, { borderColor: "rgba(255,255,255,0.35)" }]}>
              <Text style={{ fontSize: 24, color: "white" }}>
                {(fullName || nickname || "Y").slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.accountName}>{displayName}</Text>
              <Text style={s.accountId}>
                ID: {deviceId ? deviceId.slice(0, 14) + "..." : "..."}
              </Text>
              <View style={s.accountBalance}>
                <Ionicons name="wallet-outline" size={13} color="rgba(255,255,255,0.9)" />
                <Text style={s.accountBalanceText}>{balance.toFixed(2)} BP</Text>
              </View>
            </View>
            <View style={[s.editBtn, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </View>
          </LinearGradient>
        </Pressable>

        {/* ══════════ 1. REPUTATION ══════════ */}
        <SectionTitle title="ABRAÝ / YNAM ULGAMY" colors={colors} />
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowRepModal(true);
          }}
          style={({ pressed }) => [
            s.repCard,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.88 : 1 },
          ]}
        >
          {/* Score row */}
          <View style={s.repCardTop}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4, marginBottom: 2 }}>
                <Text style={[s.repScore, { color: colors.primary }]}>{repData.score}</Text>
                <Text style={[s.repScoreSub, { color: colors.mutedForeground }]}>/100 bal</Text>
              </View>
              <Text style={[s.repDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                {getWhyDescription(repData.score)}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 8 }}>
              <LevelBadge score={repData.score} size="md" />
              <View style={[s.repGearBtn, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "35" }]}>
                <Ionicons name="settings-outline" size={14} color={colors.primary} />
                <Text style={[s.repGearText, { color: colors.primary }]}>Jikme-jik</Text>
              </View>
            </View>
          </View>

          {/* Progress bar */}
          <View style={[s.progressWrap, { marginTop: 12 }]}>
            <View style={[s.progressBar, { width: `${repData.score}%`, backgroundColor: colors.primary }]} />
          </View>
          {nextLv && (
            <Text style={[s.nextLevelHint, { color: colors.primary }]}>
              {nextLv.label} derejesine {nextLv.minScore - repData.score} bal galdy
            </Text>
          )}

          {/* Recent history preview */}
          {repData.entries.length > 0 && (
            <View style={{ marginTop: 12, gap: 6 }}>
              {repData.entries.slice(0, 2).map((e, i) => (
                <View key={i} style={[s.historyItemSmall, { backgroundColor: colors.muted }]}>
                  <View style={[s.deltaBadge, {
                    backgroundColor: e.type === "positive" ? "#05966912" : e.type === "negative" ? "#dc262612" : "#64748b12",
                  }]}>
                    <Text style={[s.deltaText, {
                      color: e.type === "positive" ? "#059669" : e.type === "negative" ? "#dc2626" : "#64748b",
                      fontSize: 10,
                    }]}>
                      {e.delta > 0 ? `+${e.delta}` : e.delta}
                    </Text>
                  </View>
                  <Text style={[s.historyReason, { color: colors.foreground, fontSize: 11 }]} numberOfLines={1}>{e.reason}</Text>
                  <Text style={[s.historyTime, { color: colors.mutedForeground }]}>{formatRelativeTime(e.timestamp)}</Text>
                </View>
              ))}
            </View>
          )}
        </Pressable>

        {/* ══════════ 2. TANYŞLAR ══════════ */}
        <SectionTitle title="TANYŞLAR" colors={colors} />
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowFriendsModal(true);
          }}
          style={({ pressed }) => [
            s.featureCard,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.88 : 1 },
          ]}
        >
          <View style={[s.featureIconWrap, { backgroundColor: "#2563eb" + "18" }]}>
            <Ionicons name="people-outline" size={24} color="#2563eb" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.featureTitle, { color: colors.foreground }]}>Tanyşlar sanaw</Text>
            <Text style={[s.featureDesc, { color: colors.mutedForeground }]}>
              Tanyşlaryňyzy goşuň we olaryň abraý derejesini görüň
            </Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={18} color={colors.mutedForeground} />
        </Pressable>

        {/* ══════════ HOWPSUZLYK ══════════ */}
        <SectionTitle title="HOWPSUZLYK" colors={colors} />
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            icon="lock-closed-outline" iconColor="#ef4444"
            label="Gizlin kod (PIN)"
            desc={pinEnabled ? "4 sanly gizlin kod işjeň" : "Programma üçin gizlin kod bel"}
            right={
              <Switch
                value={pinEnabled}
                onValueChange={(v) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  if (v) openPinModal(); else disablePin();
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            }
            colors={colors}
          />
          {pinEnabled && (
            <>
              <Divider colors={colors} />
              <SettingRow
                icon="key-outline" iconColor="#f59e0b"
                label="Paroly üýtget"
                desc="Täze 4 sanly gizlin kod bel"
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); openPinModal(); }}
                colors={colors}
              />
            </>
          )}
        </View>

        {/* ══════════ TEMA ══════════ */}
        <SectionTitle title="GÖRÜNIŞ / TEMA" colors={colors} />
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowThemePicker(true); }}
          style={({ pressed }) => [s.themeCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.88 : 1 }]}
        >
          <LinearGradient colors={currentTheme.preview as [string, string]} style={s.themeCardGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name={currentTheme.icon as any} size={20} color={currentTheme.accent} />
          </LinearGradient>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[s.themeCardLabel, { color: colors.foreground }]}>{currentTheme.label} tema</Text>
            <Text style={[s.themeCardSub, { color: colors.mutedForeground }]}>{currentTheme.sublabel}</Text>
          </View>
          <View style={[s.themeChangeBtn, { backgroundColor: colors.primary + "18" }]}>
            <Text style={[s.themeChangeBtnText, { color: colors.primary }]}>Üýtget</Text>
          </View>
        </Pressable>

        {/* ══════════ DIL ══════════ */}
        <SectionTitle title={t("language")} colors={colors} />
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            icon="language-outline" iconColor="#0ea5e9"
            label={t("choose_language")}
            desc={LANGUAGES.find((l) => l.code === lang)?.label}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowLangPicker(!showLangPicker); }}
            right={
              <View style={s.langRight}>
                <Text style={s.langFlag}>{LANGUAGES.find((l) => l.code === lang)?.flag}</Text>
                <Ionicons name={showLangPicker ? "chevron-up-outline" : "chevron-down-outline"} size={16} color={colors.mutedForeground} />
              </View>
            }
            colors={colors}
          />
          {showLangPicker && (
            <View style={[s.langPicker, { borderTopColor: colors.border }]}>
              {LANGUAGES.map((langItem) => (
                <Pressable
                  key={langItem.code}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setLang(langItem.code); setShowLangPicker(false); }}
                  style={[s.langOption, lang === langItem.code && { backgroundColor: colors.primary + "12" }]}
                >
                  <Text style={s.langOptionFlag}>{langItem.flag}</Text>
                  <Text style={[s.langOptionLabel, { color: colors.foreground }]}>{langItem.label}</Text>
                  {lang === langItem.code && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* ══════════ HABARNAMALAR ══════════ */}
        <SectionTitle title={t("notifications_toggle")} colors={colors} />
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            icon="notifications-outline" iconColor="#ef4444"
            label={t("notifications_toggle")}
            desc={t("notifications_desc")}
            right={
              <Switch
                value={notifications}
                onValueChange={(v) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setNotifications(v);
                  AsyncStorage.setItem("@yenil_notifications_enabled", v ? "true" : "false");
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            }
            colors={colors}
          />
        </View>

        {/* ══════════ PROGRAMMA ══════════ */}
        <SectionTitle title="PROGRAMMA" colors={colors} />
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow icon="information-circle-outline" iconColor="#0284c7" label="Programmany barada" desc="Wersiýa, şertler we maglumat" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/about" as Href); }} colors={colors} />
          <Divider colors={colors} />
          <SettingRow icon="help-circle-outline" iconColor="#059669" label="Goldaw & Kömek" desc="Soraglar we jogaplar" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/help" as Href); }} colors={colors} />
          <Divider colors={colors} />
          <SettingRow
            icon="refresh-outline" iconColor="#10b981"
            label="Täze wersiýa barla" desc={`Häzirki wersiýa: ${APP_VERSION}`}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); Alert.alert("Wersiýa barlagy", `Siz iň täze wersiýany ulanýarsyňyz (${APP_VERSION})`); }}
            right={<View style={[s.versionBadge, { backgroundColor: "#10b98118" }]}><Text style={[s.versionBadgeText, { color: "#10b981" }]}>v{APP_VERSION}</Text></View>}
            colors={colors}
          />
          <Divider colors={colors} />
          <SettingRow icon="star-outline" iconColor="#f59e0b" label="Baha ber" desc="Programmamyzy App Store-da bahalandyryň" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); Alert.alert("Baha ber", "Siziň pikiriňiz biziň üçin gymmatly!", [{ text: "Soň" }, { text: "Hawa", onPress: () => Linking.openURL("https://yenil.tm") }]); }} colors={colors} />
          <Divider colors={colors} />
          <SettingRow icon="share-social-outline" iconColor="#6366f1" label="Dostlaryňa paýlaş" desc="Referal koduňyzy paýlaşyň, her dost üçin 0.5 BP + passiv daromad gazanyň" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/referal" as Href); }} colors={colors} />
        </View>

        {/* ══════════ GOLDAW ══════════ */}
        <SectionTitle title="GOLDAW" colors={colors} />
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow icon="help-circle-outline" iconColor="#0ea5e9" label="Kömek / FAQ" desc="Köp soralýan soraglar" onPress={() => Linking.openURL("https://yenil.tm/help")} colors={colors} />
          <Divider colors={colors} />
          <SettingRow icon="paper-plane-outline" iconColor="#0088cc" label="Telegram goldawy" desc="@yenil_tm" onPress={() => Linking.openURL("http://t.me/yenil_tm")} colors={colors} />
          <Divider colors={colors} />
          <SettingRow icon="call-outline" iconColor="#15803d" label="Jaň et" desc="+993 71 789091" onPress={() => Linking.openURL("tel:+99371789091")} colors={colors} />
        </View>

        {/* ══════════ BIZ HAKYNDA ══════════ */}
        <SectionTitle title="BIZ HAKYNDA" colors={colors} />
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAbout(!showAbout); }}
          style={[s.aboutCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={s.aboutHeader}>
            <View style={[s.rowIcon, { backgroundColor: colors.primary + "22" }]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[s.rowLabel, { color: colors.foreground }]}>Ýeňil hakynda</Text>
            <Ionicons name={showAbout ? "chevron-up-outline" : "chevron-down-outline"} size={16} color={colors.mutedForeground} />
          </View>
          {showAbout && (
            <View style={s.aboutContent}>
              <LinearGradient colors={[colors.headerGradientStart, colors.headerGradientEnd] as [string, string]} style={s.aboutLogoCircle}>
                <Text style={s.aboutLogoText}>Ý</Text>
              </LinearGradient>
              <Text style={[s.aboutTitle, { color: colors.foreground }]}>Ýeňil</Text>
              <Text style={[s.aboutSubtitle, { color: colors.mutedForeground }]}>Türkmenistanda iň ynamly onlayn hyzmat platformasy</Text>
              <Text style={[s.aboutDesc, { color: colors.mutedForeground }]}>2022-nji ýyldan bäri müşderilere demirýol bilet, walýuta çalyşmak, bonus pul we beýleki onlayn hyzmatlary hödürleýäris.</Text>
              <View style={s.aboutStats}>
                {[{ num: "500+", label: "Müşderi" }, { num: "1200+", label: "Sargyt" }, { num: "98%", label: "Kanagatlanma" }].map((st, i) => (
                  <View key={i} style={[s.aboutStat, { backgroundColor: colors.muted }]}>
                    <Text style={[s.aboutStatNum, { color: colors.primary }]}>{st.num}</Text>
                    <Text style={[s.aboutStatLabel, { color: colors.mutedForeground }]}>{st.label}</Text>
                  </View>
                ))}
              </View>
              <Text style={[s.aboutVersion, { color: colors.mutedForeground }]}>Wersiýa {APP_VERSION} · © 2022–2026 Ýeňil</Text>
            </View>
          )}
        </Pressable>

        {/* ══════════ SYNAG REJIMI ══════════ */}
        <SectionTitle title="SYNAG REJIMI" colors={colors} />
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            icon="flask-outline"
            iconColor="#7c3aed"
            label="1000 BP + Abraý 80 ber"
            desc="Test hasaby üçin balans we abraý nokat goş"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert(
                "Synag maglumaty",
                "Hasabyňyza 1000 BP we 80 abraý baly goşuljakmy?",
                [
                  { text: "Ýatyr", style: "cancel" },
                  {
                    text: "Hawa, goş",
                    onPress: async () => {
                      try {
                        await seedTestAccount(deviceId);
                        await addNotification({
                          title: "Synag Bildirnama",
                          body: "1000 BP we 80 abraý baly balansynyza üstünlikli goşuldy! 🎉",
                          type: "bp",
                        });
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        Alert.alert("Üstünlikli", "1000 BP we 80 abraý baly goşuldy!");
                      } catch {
                        Alert.alert("Ýalňyşlyk", "Synag maglumaty goşup bolmady.");
                      }
                    },
                  },
                ]
              );
            }}
            colors={colors}
          />
        </View>

      </ScrollView>

      {/* ─── MODALS ─── */}
      <ReputationModal visible={showRepModal} onClose={() => setShowRepModal(false)} repData={repData} deviceId={deviceId} colors={colors} />
      <FriendsModal visible={showFriendsModal} onClose={() => setShowFriendsModal(false)} deviceId={deviceId} colors={colors} />
      <BPTransferModal visible={showBPModal} onClose={() => setShowBPModal(false)} deviceId={deviceId} balance={balance} sendBP={sendBP} colors={colors} />
      <NicknameModal visible={showNickModal} onClose={() => setShowNickModal(false)} deviceId={deviceId} current={nickname} onSaved={setNickname} colors={colors} />

      {/* PIN SETUP MODAL */}
      <Modal visible={showPinModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPinModal(false)}>
        <View style={[s.modalWrap, { backgroundColor: colors.background }]}>
          <View style={[s.modalHandle, { backgroundColor: colors.border }]} />
          <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[s.modalTitle, { color: colors.foreground }]}>
                {pinStage === "enter" ? "Täze gizlin kod" : "Tassyklaň"}
              </Text>
              <Text style={[s.modalSub, { color: colors.mutedForeground }]}>
                {pinStage === "enter" ? "4 sanly gizlin kod giriziň" : "Kody gaýtadan giriziň"}
              </Text>
            </View>
            <Pressable onPress={() => setShowPinModal(false)} style={[s.modalCloseBtn, { backgroundColor: colors.muted }]}>
              <Ionicons name="close" size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <View style={{ flex: 1, alignItems: "center", paddingTop: 48, paddingHorizontal: 32 }}>
            {/* PIN dots */}
            <View style={{ flexDirection: "row", gap: 20, marginBottom: 16 }}>
              {[0, 1, 2, 3].map(i => {
                const filled = (pinStage === "enter" ? newPin : confirmPinVal).length > i;
                return (
                  <View key={i} style={{
                    width: 22, height: 22, borderRadius: 11,
                    backgroundColor: filled ? colors.primary : "transparent",
                    borderWidth: 2.5, borderColor: filled ? colors.primary : colors.border,
                  }} />
                );
              })}
            </View>

            {pinError ? (
              <Text style={{ color: "#ef4444", fontSize: 13, textAlign: "center", marginBottom: 8 }}>{pinError}</Text>
            ) : (
              <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 8 }}>
                {pinStage === "enter" ? "Täze 4 sanly PIN giriziň" : "PIN-i gaýtadan giriziň"}
              </Text>
            )}

            {/* Numpad */}
            <View style={{ marginTop: 32, gap: 14, width: "100%" }}>
              {[["1","2","3"],["4","5","6"],["7","8","9"],["","0","⌫"]].map((row, ri) => (
                <View key={ri} style={{ flexDirection: "row", justifyContent: "center", gap: 20 }}>
                  {row.map((key, ki) => (
                    <Pressable
                      key={ki}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handlePinKey(key); }}
                      style={({ pressed }) => ({
                        width: 80, height: 80, borderRadius: 40,
                        backgroundColor: key === "" ? "transparent" : key === "⌫" ? colors.muted : colors.card,
                        borderWidth: key === "" || key === "⌫" ? 0 : 1,
                        borderColor: colors.border,
                        alignItems: "center", justifyContent: "center",
                        opacity: pressed && key !== "" ? 0.65 : 1,
                        shadowColor: key !== "" && key !== "⌫" ? "#000" : "transparent",
                        shadowOpacity: 0.06, shadowRadius: 4,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: key !== "" && key !== "⌫" ? 2 : 0,
                      })}
                    >
                      {key === "⌫" ? (
                        <Ionicons name="backspace-outline" size={24} color={colors.foreground} />
                      ) : (
                        <Text style={{ fontSize: 26, fontWeight: "600", color: key === "" ? "transparent" : colors.foreground }}>{key}</Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* THEME PICKER MODAL */}
      <Modal visible={showThemePicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowThemePicker(false)}>
        <View style={[s.modalWrap, { backgroundColor: colors.background }]}>
          <View style={[s.modalHandle, { backgroundColor: colors.border }]} />
          <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[s.modalTitle, { color: colors.foreground }]}>Tema saýlaň</Text>
              <Text style={[s.modalSub, { color: colors.mutedForeground }]}>Programmanyň reňk temasyny üýtgediň</Text>
            </View>
            <Pressable onPress={() => setShowThemePicker(false)} style={[s.modalCloseBtn, { backgroundColor: colors.muted }]}>
              <Ionicons name="close" size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={s.themeGrid} showsVerticalScrollIndicator={false}>
            {THEMES.map((theme) => {
              const isActive = themeKey === theme.key;
              return (
                <Pressable
                  key={theme.key}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setTheme(theme.key); setTimeout(() => setShowThemePicker(false), 280); }}
                  style={({ pressed }) => [s.themeOption, { backgroundColor: colors.card, borderColor: isActive ? theme.accent : colors.border, borderWidth: isActive ? 2.5 : 1, opacity: pressed ? 0.85 : 1 }]}
                >
                  <LinearGradient colors={theme.preview as [string, string]} style={s.themePreviewGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Ionicons name={theme.icon as any} size={14} color={theme.accent} />
                    <View style={s.mockUi}>
                      <View style={[s.mockBar, { backgroundColor: "rgba(255,255,255,0.4)", width: "68%" }]} />
                      <View style={[s.mockBar, { backgroundColor: "rgba(255,255,255,0.22)", width: "44%", marginTop: 6 }]} />
                      <View style={[s.mockCardRow, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                        <View style={[s.mockDot, { backgroundColor: theme.dot }]} />
                        <View style={[s.mockBar, { backgroundColor: "rgba(255,255,255,0.28)", flex: 1 }]} />
                      </View>
                    </View>
                  </LinearGradient>
                  <View style={s.themeOptionBody}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <View>
                        <Text style={[s.themeOptionLabel, { color: colors.foreground }]}>{theme.label}</Text>
                        <Text style={[s.themeOptionSub, { color: colors.mutedForeground }]}>{theme.sublabel}</Text>
                      </View>
                      {isActive && (
                        <View style={[s.themeCheck, { backgroundColor: theme.accent }]}>
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════

const s = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: { paddingHorizontal: 20, paddingBottom: 18 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 2 },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.7)" },

  // Account card
  accountCard: { borderRadius: 18, padding: 18, flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
  accountAvatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 2, alignItems: "center", justifyContent: "center" },
  accountName: { fontSize: 15, fontWeight: "800", color: "#fff", marginBottom: 3 },
  accountId: { fontSize: 11, color: "rgba(255,255,255,0.65)", marginBottom: 6 },
  accountBalance: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  accountBalanceText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  editBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },

  // Section title
  groupTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", marginTop: 20, marginBottom: 8, marginLeft: 4 },

  // Reputation card
  repCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 4 },
  repCardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  repScore: { fontSize: 34, fontWeight: "900", lineHeight: 36 },
  repScoreSub: { fontSize: 12, fontWeight: "500", marginBottom: 4 },
  repDesc: { fontSize: 12, lineHeight: 17 },
  repGearBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 50, paddingHorizontal: 9, paddingVertical: 5, borderWidth: 1 },
  repGearText: { fontSize: 11, fontWeight: "700" },

  // Progress
  progressWrap: { height: 7, borderRadius: 50, backgroundColor: "rgba(100,116,139,0.12)", overflow: "hidden" },
  progressBar: { height: "100%", borderRadius: 50 },
  nextLevelHint: { fontSize: 10, fontWeight: "600", textAlign: "right", marginTop: 4, opacity: 0.7 },

  // History
  historyItem: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  historyItemSmall: { flexDirection: "row", alignItems: "center", gap: 8, padding: 8, borderRadius: 8 },
  deltaBadge: { borderRadius: 50, paddingHorizontal: 8, paddingVertical: 3, minWidth: 36, alignItems: "center" },
  deltaText: { fontSize: 11, fontWeight: "800" },
  historyReason: { flex: 1, fontSize: 12, lineHeight: 16 },
  historyTime: { fontSize: 10, opacity: 0.5 },

  // Feature cards (friends, bp transfer)
  featureCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 4 },
  featureIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  featureTitle: { fontSize: 14, fontWeight: "800", marginBottom: 3 },
  featureDesc: { fontSize: 12, lineHeight: 16 },

  // Cards
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },

  // Row
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  rowIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontSize: 14, fontWeight: "600" },
  rowDesc: { fontSize: 11, marginTop: 1 },
  rowValue: { fontSize: 13, fontWeight: "600" },
  divider: { height: 1, marginLeft: 64 },

  // Theme card
  themeCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 16, borderWidth: 1 },
  themeCardGradient: { width: 54, height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  themeCardEmoji: { fontSize: 26 },
  themeCardLabel: { fontSize: 14, fontWeight: "700" },
  themeCardSub: { fontSize: 11, marginTop: 2 },
  themeChangeBtn: { borderRadius: 50, paddingHorizontal: 12, paddingVertical: 6 },
  themeChangeBtnText: { fontSize: 12, fontWeight: "700" },

  // Language
  langRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  langFlag: { fontSize: 18 },
  langPicker: { borderTopWidth: 1 },
  langOption: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  langOptionFlag: { fontSize: 22 },
  langOptionLabel: { flex: 1, fontSize: 14, fontWeight: "600" },

  // Version badge
  versionBadge: { borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4 },
  versionBadgeText: { fontSize: 12, fontWeight: "700" },

  // About
  aboutCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  aboutHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  aboutContent: { padding: 16, alignItems: "center" },
  aboutLogoCircle: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  aboutLogoText: { fontSize: 24, fontWeight: "900", color: "#fff" },
  aboutTitle: { fontSize: 18, fontWeight: "900", marginBottom: 4 },
  aboutSubtitle: { fontSize: 12, marginBottom: 10, textAlign: "center" },
  aboutDesc: { fontSize: 12, lineHeight: 18, textAlign: "center", marginBottom: 16 },
  aboutStats: { flexDirection: "row", gap: 10, marginBottom: 16 },
  aboutStat: { flex: 1, borderRadius: 12, padding: 12, alignItems: "center" },
  aboutStatNum: { fontSize: 18, fontWeight: "900" },
  aboutStatLabel: { fontSize: 10, marginTop: 2 },
  aboutContacts: { flexDirection: "row", gap: 10, marginBottom: 14 },
  aboutContact: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 50, paddingHorizontal: 14, paddingVertical: 8 },
  aboutVersion: { fontSize: 11 },

  // Logout
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderRadius: 14, padding: 14, marginTop: 20 },
  logoutText: { fontSize: 14, fontWeight: "700" },

  // Modal
  modalWrap: { flex: 1, borderRadius: 20 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 4 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 18, borderBottomWidth: 1 },
  modalTitle: { fontSize: 17, fontWeight: "800" },
  modalSub: { fontSize: 12, marginTop: 2 },
  modalCloseBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },

  // Rep modal hero
  repHero: { margin: 16, padding: 16, borderRadius: 14, borderWidth: 1 },
  scoreNum: { fontSize: 40, fontWeight: "900", lineHeight: 42 },
  scoreLabel: { fontSize: 12 },
  levelStrip: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  levelDot: { flex: 1, alignItems: "center" },

  // Tabs
  tabRow: { flexDirection: "row", marginHorizontal: 16, borderRadius: 10, padding: 4, gap: 2, marginBottom: 4 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  tabBtnText: { fontSize: 12, fontWeight: "700" },

  // Info box
  infoBox: { flexDirection: "row", gap: 8, alignItems: "flex-start", padding: 12, borderRadius: 12, borderWidth: 1 },
  infoBoxText: { flex: 1, fontSize: 13, lineHeight: 19 },
  warnBox: { flexDirection: "row", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: "flex-start" },
  warnText: { flex: 1, fontSize: 12, lineHeight: 18 },
  successBox: { padding: 20, borderRadius: 16, borderWidth: 1 },

  // Tips
  subHead: { fontSize: 14, fontWeight: "800" },
  subDesc: { fontSize: 12, lineHeight: 18 },
  tipRow: { flexDirection: "row", gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: "flex-start" },
  tipText: { flex: 1, fontSize: 13, lineHeight: 19 },

  // Search
  searchRow: { flexDirection: "row", gap: 8 },
  searchInput: { flex: 1, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13 },
  searchBtn: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  searchResultCard: { padding: 14, borderRadius: 14, borderWidth: 1 },

  // Friend
  friendCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  friendAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  friendName: { fontSize: 13, fontWeight: "700" },
  friendIdText: { fontSize: 10 },
  friendScore: { fontSize: 20, fontWeight: "900" },
  removeBtn: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },

  // Transfer
  balanceChip: { flexDirection: "row", alignItems: "center", gap: 8, padding: 16, borderRadius: 14 },
  balanceChipText: { fontSize: 22, fontWeight: "900", color: "#fff", flex: 1 },
  balanceChipLabel: { fontSize: 12, color: "rgba(255,255,255,0.65)" },
  transferItem: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  transferIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  transferWho: { fontSize: 13, fontWeight: "600" },
  transferNote: { fontSize: 11 },
  transferAmount: { fontSize: 14, fontWeight: "800" },

  // Empty
  emptyWrap: { alignItems: "center", padding: 40 },
  emptyText: { fontSize: 15, fontWeight: "700" },
  emptySubText: { fontSize: 12, marginTop: 6, textAlign: "center" },

  // Input
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  textArea: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, textAlignVertical: "top" },
  inputLabel: { fontSize: 13, fontWeight: "600" },
  quickRow: { flexDirection: "row", gap: 8 },
  quickBtn: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  quickBtnText: { fontSize: 15, fontWeight: "800" },
  quickBtnSub: { fontSize: 9, fontWeight: "600" },

  // Buttons
  btnPrimary: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 12 },
  btnPrimaryText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  btnSecondary: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  btnSecText: { fontSize: 13, fontWeight: "600" },

  // Add friend
  addFriendBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 50, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  addFriendBtnText: { fontSize: 12, fontWeight: "700" },
  addForm: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16 },

  // Nickname modal
  nickOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", padding: 24 },
  nickModal: { borderRadius: 20, padding: 24, borderWidth: 1 },
  nickBtns: { flexDirection: "row", gap: 10, marginTop: 16 },

  // Theme grid
  themeGrid: { padding: 16, gap: 14 },
  themeOption: { borderRadius: 18, overflow: "hidden" },
  themePreviewGradient: { height: 120, padding: 14, justifyContent: "flex-start" },
  themePreviewEmoji: { fontSize: 22, marginBottom: 4 },
  mockUi: { gap: 4 },
  mockBar: { height: 6, borderRadius: 3 },
  mockCardRow: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 6, padding: 7, marginTop: 8 },
  mockDot: { width: 8, height: 8, borderRadius: 4 },
  themeOptionBody: { padding: 14 },
  themeOptionLabel: { fontSize: 15, fontWeight: "800" },
  themeOptionSub: { fontSize: 11, marginTop: 2 },
  themeCheck: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
});
