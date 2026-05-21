import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  Platform, Modal, TextInput, ActivityIndicator, Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";
import {
  createRoadReport, upvoteRoadReport, watchRoadReports,
  type RoadReport, type RoadReportType,
} from "@/lib/firebase";
import { formatRelativeTime } from "@/lib/reputation";

const REPORT_TYPES: { id: RoadReportType; label: string; icon: string; color: string; emoji: string }[] = [
  { id: "gai", label: "GAI / PÝGG Posti", icon: "shield-outline", color: "#ef4444", emoji: "🚔" },
  { id: "probka", label: "Sykylyk / Probka", icon: "car-outline", color: "#f59e0b", emoji: "🚗" },
  { id: "yopyk", label: "Ýol Ýapyk", icon: "close-circle-outline", color: "#7c3aed", emoji: "🚧" },
  { id: "basha", label: "Başga Duýduryş", icon: "warning-outline", color: "#0284c7", emoji: "⚠️" },
];

function ReportCard({
  report, deviceId, colors,
}: {
  report: RoadReport;
  deviceId: string;
  colors: ReturnType<typeof useColors>;
}) {
  const [voting, setVoting] = useState(false);
  const rType = REPORT_TYPES.find(t => t.id === report.type) ?? REPORT_TYPES[3];
  const hasVoted = !!report.upvotes?.[deviceId];
  const isOwn = report.reporterDeviceId === deviceId;
  const pct = Math.min(100, Math.round((report.upvoteCount / 3) * 100));

  async function handleUpvote() {
    if (hasVoted || isOwn || voting) return;
    setVoting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await upvoteRoadReport(report.id, deviceId);
    if (result.rewarded) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("🎉 Sylag!", "Bu habar tassyklandy! Habary beren 1 BP aldy.");
    }
    setVoting(false);
  }

  return (
    <View style={[rc.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Type badge + reward */}
      <View style={rc.topRow}>
        <View style={[rc.typeBadge, { backgroundColor: rType.color + "18" }]}>
          <Text style={{ fontSize: 14 }}>{rType.emoji}</Text>
          <Text style={[rc.typeBadgeText, { color: rType.color }]}>{rType.label}</Text>
        </View>
        {report.rewarded && (
          <View style={rc.rewardedBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#059669" />
            <Text style={rc.rewardedText}>+1 BP berildi</Text>
          </View>
        )}
        {isOwn && (
          <View style={[rc.ownBadge, { backgroundColor: colors.primary + "15" }]}>
            <Text style={[rc.ownBadgeText, { color: colors.primary }]}>Siziňki</Text>
          </View>
        )}
      </View>

      {/* Location + desc */}
      <View style={rc.bodyRow}>
        <Ionicons name="location-outline" size={14} color={colors.mutedForeground} />
        <Text style={[rc.location, { color: colors.foreground }]} numberOfLines={1}>{report.location}</Text>
      </View>
      {!!report.description && (
        <Text style={[rc.desc, { color: colors.mutedForeground }]} numberOfLines={2}>{report.description}</Text>
      )}

      {/* Progress to reward */}
      <View style={{ marginTop: 10 }}>
        <View style={[rc.progressBg, { backgroundColor: colors.border }]}>
          <View style={[rc.progressFill, { width: `${pct}%` as any, backgroundColor: rType.color }]} />
        </View>
        <Text style={[rc.progressLabel, { color: colors.mutedForeground }]}>
          {report.upvoteCount}/3 tassyklama {report.upvoteCount >= 3 ? "✅" : ""}
        </Text>
      </View>

      {/* Footer */}
      <View style={rc.footer}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <View style={[rc.avatar, { backgroundColor: rType.color + "20" }]}>
            <Text style={{ fontSize: 12 }}>{rType.emoji}</Text>
          </View>
          <Text style={[rc.reporter, { color: colors.mutedForeground }]}>{report.reporterNickname}</Text>
          <Text style={[rc.time, { color: colors.mutedForeground }]}>· {formatRelativeTime(report.createdAt)}</Text>
        </View>

        <Pressable
          onPress={handleUpvote}
          disabled={hasVoted || isOwn || voting || report.upvoteCount >= 3}
          style={[
            rc.upvoteBtn,
            {
              backgroundColor: hasVoted || report.upvoteCount >= 3
                ? "#05966918" : rType.color + "15",
              borderColor: hasVoted || report.upvoteCount >= 3
                ? "#05966930" : rType.color + "40",
              opacity: isOwn ? 0.4 : 1,
            },
          ]}
        >
          {voting ? (
            <ActivityIndicator size="small" color={rType.color} />
          ) : (
            <>
              <Ionicons
                name={hasVoted || report.upvoteCount >= 3 ? "checkmark-circle" : "thumbs-up-outline"}
                size={14}
                color={hasVoted || report.upvoteCount >= 3 ? "#059669" : rType.color}
              />
              <Text style={[rc.upvoteText, { color: hasVoted || report.upvoteCount >= 3 ? "#059669" : rType.color }]}>
                {hasVoted ? "Tassykladyňyz" : report.upvoteCount >= 3 ? "Tassyklandy" : "Tassykla"}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

export default function InformatorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { deviceId } = useBonusPul();
  const isWeb = Platform.OS === "web";

  const [reports, setReports] = useState<RoadReport[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selType, setSelType] = useState<RoadReportType>("gai");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = watchRoadReports(setReports);
    return () => unsub();
  }, []);

  async function handleSubmit() {
    if (!location.trim()) { Alert.alert("Ýalňyşlyk", "Ýeri giriziň"); return; }
    setSubmitting(true);
    try {
      await createRoadReport(deviceId, selType, location, description);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowModal(false);
      setLocation("");
      setDescription("");
      setSelType("gai");
    } catch {
      Alert.alert("Ýalňyşlyk", "Habar döredilmedi. Täzeden synanyşyň.");
    } finally {
      setSubmitting(false);
    }
  }

  const myReports = reports.filter(r => r.reporterDeviceId === deviceId);

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#78350f", "#f59e0b"]}
        style={[s.header, { paddingTop: (isWeb ? 0 : insets.top) + 14 }]}
      >
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.headerTitle}>Informator 🚦</Text>
          <Text style={s.headerSub}>Ýol ýagdaýyny habar beriň — 1 BP gazanyň</Text>
        </View>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowModal(true); }}
          style={s.addBtn}
        >
          <Ionicons name="add" size={22} color="#f59e0b" />
        </Pressable>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

        {/* ── My stats ── */}
        <View style={s.statsRow}>
          {[
            { label: "Habarlarym", value: myReports.length, icon: "document-text-outline", color: "#f59e0b" },
            { label: "Tassyklandy", value: myReports.filter(r => r.rewarded).length, icon: "checkmark-circle-outline", color: "#059669" },
            { label: "BP Gazanyldı", value: myReports.filter(r => r.rewarded).length, icon: "wallet-outline", color: "#6366f1" },
          ].map((st, i) => (
            <View key={i} style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[s.statIcon, { backgroundColor: st.color + "18" }]}>
                <Ionicons name={st.icon as any} size={18} color={st.color} />
              </View>
              <Text style={[s.statValue, { color: st.color }]}>{st.value}</Text>
              <Text style={[s.statLabel, { color: colors.mutedForeground }]}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Info box ── */}
        <View style={[s.infoBox, { backgroundColor: "#f59e0b" + "10", borderColor: "#f59e0b" + "28" }]}>
          <Text style={{ fontSize: 16 }}>💡</Text>
          <Text style={[s.infoText, { color: colors.foreground }]}>
            Habar bereniňizde ony başga 3 ulanyjy tassyklasa, size <Text style={{ color: "#059669", fontWeight: "800" }}>1 BP</Text> we <Text style={{ color: "#f59e0b", fontWeight: "800" }}>+2 abraý baly</Text> geçirilýär.
          </Text>
        </View>

        {/* ── Reports list ── */}
        <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>HÄZIRKI HABARLAR ({reports.length})</Text>

        {reports.length === 0 ? (
          <View style={[s.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ fontSize: 40, textAlign: "center", marginBottom: 8 }}>🛣️</Text>
            <Text style={[s.emptyTitle, { color: colors.foreground }]}>Heniz habar ýok</Text>
            <Text style={[s.emptyDesc, { color: colors.mutedForeground }]}>
              Ýoldaky ýagdaý barada ilkinji habar beriň we 1 BP gazanyň!
            </Text>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowModal(true); }}
              style={[s.emptyBtn, { backgroundColor: "#f59e0b" }]}
            >
              <Ionicons name="add-circle-outline" size={16} color="#fff" />
              <Text style={s.emptyBtnText}>Habar ber</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, gap: 10 }}>
            {reports.map(r => (
              <ReportCard key={r.id} report={r} deviceId={deviceId} colors={colors} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── FAB ── */}
      {reports.length > 0 && (
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowModal(true); }}
          style={[s.fab, { backgroundColor: "#f59e0b" }]}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </Pressable>
      )}

      {/* ── New Report Modal ── */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <View style={[s.modalWrap, { backgroundColor: colors.background }]}>
          <View style={[s.modalHandle, { backgroundColor: colors.border }]} />
          <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[s.modalTitle, { color: colors.foreground }]}>Täze Habar</Text>
              <Text style={[s.modalSub, { color: colors.mutedForeground }]}>Ýoldaky ýagdaýy habar beriň</Text>
            </View>
            <Pressable onPress={() => setShowModal(false)} style={[s.closeBtn, { backgroundColor: colors.muted }]}>
              <Ionicons name="close" size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
            {/* Type selector */}
            <View>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>Habar görnüşi *</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {REPORT_TYPES.map(t => (
                  <Pressable
                    key={t.id}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelType(t.id); }}
                    style={[
                      s.typeBtn,
                      {
                        backgroundColor: selType === t.id ? t.color : colors.card,
                        borderColor: selType === t.id ? t.color : colors.border,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 14 }}>{t.emoji}</Text>
                    <Text style={[s.typeBtnText, { color: selType === t.id ? "#fff" : colors.foreground }]}>
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Location */}
            <View style={{ gap: 6 }}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>Ýer *</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
                value={location}
                onChangeText={setLocation}
                placeholder="Ör: Görogly köçesi, Azatlyk meýdany..."
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            {/* Description */}
            <View style={{ gap: 6 }}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>Goşmaça maglumat (islege görä)</Text>
              <TextInput
                style={[s.textArea, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Jikme-jik beýan ediň..."
                placeholderTextColor={colors.mutedForeground}
                multiline numberOfLines={3}
              />
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={submitting || !location.trim()}
              style={[s.btnPrimary, { backgroundColor: "#f59e0b", opacity: !location.trim() ? 0.5 : 1 }]}
            >
              {submitting
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="paper-plane-outline" size={18} color="#fff" />
              }
              <Text style={s.btnPrimaryText}>{submitting ? "Iberilýär..." : "Habar iber"}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const rc = StyleSheet.create({
  card: {
    borderRadius: 16, borderWidth: 1, padding: 14, gap: 8,
  },
  topRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  typeBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  typeBadgeText: { fontSize: 11, fontWeight: "700" },
  rewardedBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#05966915", borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  rewardedText: { fontSize: 10, color: "#059669", fontWeight: "700" },
  ownBadge: { borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  ownBadgeText: { fontSize: 10, fontWeight: "700" },
  bodyRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  location: { fontSize: 13, fontWeight: "600" },
  desc: { fontSize: 12, lineHeight: 17 },
  progressBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  progressLabel: { fontSize: 10, marginTop: 4 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  avatar: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  reporter: { fontSize: 11 },
  time: { fontSize: 10 },
  upvoteBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6,
  },
  upvoteText: { fontSize: 11, fontWeight: "700" },
});

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 18,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.72)", fontSize: 11, marginTop: 2 },
  addBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
  },

  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: 16 },
  statCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: "center", gap: 5 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 9, textAlign: "center", fontWeight: "600" },

  infoBox: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 14, borderWidth: 1,
  },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },

  sectionLabel: {
    fontSize: 11, fontWeight: "700", letterSpacing: 0.8,
    marginLeft: 20, marginTop: 20, marginBottom: 8,
  },

  emptyBox: {
    marginHorizontal: 16, borderRadius: 18, borderWidth: 1,
    padding: 28, alignItems: "center", gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyDesc: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11, marginTop: 8 },
  emptyBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  fab: {
    position: "absolute", bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#f59e0b", shadowOpacity: 0.4, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },

  modalWrap: { flex: 1 },
  modalHandle: { width: 38, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 8 },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  modalSub: { fontSize: 12, marginTop: 2 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },

  inputLabel: { fontSize: 13, fontWeight: "600" },
  typeBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1.5,
  },
  typeBtnText: { fontSize: 12, fontWeight: "600" },
  input: {
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 14,
  },
  textArea: {
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, minHeight: 80, textAlignVertical: "top",
  },
  btnPrimary: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 14, paddingVertical: 15,
  },
  btnPrimaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
