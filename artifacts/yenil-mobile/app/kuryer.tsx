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
  watchMicroTasks, createMicroTask, acceptMicroTask, completeMicroTask,
  type MicroTask,
} from "@/lib/firebase";
import { formatRelativeTime } from "@/lib/reputation";

const CITIES = ["Aşgabat", "Türkmenabat", "Mary", "Balkanabat", "Daşoguz", "Tejen", "Serdar", "Türkmenbaşy"];
const MIN_REWARD = 5;

const STATUS_META: Record<MicroTask["status"], { label: string; color: string; icon: string }> = {
  open: { label: "Açyk", color: "#059669", icon: "radio-button-on-outline" },
  taken: { label: "Kabul edildi", color: "#6366f1", icon: "bicycle-outline" },
  completed: { label: "Tamamlandy", color: "#94a3b8", icon: "checkmark-circle-outline" },
  cancelled: { label: "Ýatyryldy", color: "#ef4444", icon: "close-circle-outline" },
};

export default function KurYerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { deviceId, balance } = useBonusPul();
  const isWeb = Platform.OS === "web";

  const [tasks, setTasks] = useState<MicroTask[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [fromCity, setFromCity] = useState("Daşoguz");
  const [toCity, setToCity] = useState("Aşgabat");
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState("");
  const [weight, setWeight] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "mine" | "accepted">("all");

  useEffect(() => {
    const unsub = watchMicroTasks(setTasks);
    return () => unsub();
  }, []);

  const rewardNum = parseFloat(reward) || 0;

  const filteredTasks = tasks.filter(t => {
    if (activeTab === "mine") return t.posterDeviceId === deviceId;
    if (activeTab === "accepted") return t.courierDeviceId === deviceId;
    return true;
  });

  async function handleCreate() {
    if (rewardNum < MIN_REWARD) { Alert.alert("Ýalňyşlyk", `Minimum sylag ${MIN_REWARD} BP`); return; }
    if (!description.trim()) { Alert.alert("Ýalňyşlyk", "Beýany ýazyň"); return; }
    if (rewardNum > balance) { Alert.alert("Ýalňyşlyk", `Ýeterlik BP ýok (${balance.toFixed(2)} BP)`); return; }
    setSubmitting(true);
    const result = await createMicroTask(deviceId, fromCity, toCity, description, rewardNum, weight);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowModal(false);
      setDescription(""); setReward(""); setWeight("");
    } else {
      Alert.alert("Ýalňyşlyk", result.message);
    }
    setSubmitting(false);
  }

  async function handleAccept(taskId: string) {
    Alert.alert("Kabul et", "Bu tapşyrygy kabul etmek isleýärsiňizmi?", [
      { text: "Ýok" },
      {
        text: "Hawa, kabul et",
        onPress: async () => {
          setActingId(taskId);
          const result = await acceptMicroTask(taskId, deviceId);
          if (result.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("✅ Kabul edildi", result.message);
          } else {
            Alert.alert("Ýalňyşlyk", result.message);
          }
          setActingId(null);
        },
      },
    ]);
  }

  async function handleComplete(taskId: string) {
    Alert.alert("Tamamla", "Tapşyrygy tamamlandı diýip bellemek isleýärsiňizmi?", [
      { text: "Ýok" },
      {
        text: "Hawa, tamamlandy",
        onPress: async () => {
          setActingId(taskId);
          const result = await completeMicroTask(taskId, deviceId);
          if (result.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("🎉 Üstünlik!", result.message);
          } else {
            Alert.alert("Ýalňyşlyk", result.message);
          }
          setActingId(null);
        },
      },
    ]);
  }

  function TaskCard({ task }: { task: MicroTask }) {
    const meta = STATUS_META[task.status];
    const isMyTask = task.posterDeviceId === deviceId;
    const isMyCourier = task.courierDeviceId === deviceId;

    return (
      <View style={[tc.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Route */}
        <View style={tc.routeRow}>
          <View style={[tc.cityBadge, { backgroundColor: "#d97706" + "18" }]}>
            <Ionicons name="arrow-up-outline" size={10} color="#d97706" />
            <Text style={[tc.cityText, { color: "#d97706" }]}>{task.from}</Text>
          </View>
          <View style={tc.routeLine}>
            <View style={[tc.routeDot, { backgroundColor: colors.border }]} />
            <Ionicons name="bicycle-outline" size={16} color={colors.mutedForeground} />
            <View style={[tc.routeDot, { backgroundColor: colors.border }]} />
          </View>
          <View style={[tc.cityBadge, { backgroundColor: "#059669" + "18" }]}>
            <Ionicons name="arrow-down-outline" size={10} color="#059669" />
            <Text style={[tc.cityText, { color: "#059669" }]}>{task.to}</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={[tc.desc, { color: colors.foreground }]} numberOfLines={2}>{task.description}</Text>

        {/* Info row */}
        <View style={tc.infoRow}>
          <View style={[tc.rewardBadge, { backgroundColor: "#d97706" + "15" }]}>
            <Ionicons name="wallet-outline" size={12} color="#d97706" />
            <Text style={[tc.rewardText, { color: "#d97706" }]}>{task.reward} BP</Text>
          </View>
          {task.weight && (
            <View style={[tc.weightBadge, { backgroundColor: colors.muted }]}>
              <Ionicons name="barbell-outline" size={12} color={colors.mutedForeground} />
              <Text style={[tc.weightText, { color: colors.mutedForeground }]}>{task.weight}</Text>
            </View>
          )}
          <View style={[tc.statusBadge, { backgroundColor: meta.color + "15" }]}>
            <Ionicons name={meta.icon as any} size={11} color={meta.color} />
            <Text style={[tc.statusText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>

        {/* Poster + time */}
        <View style={tc.footer}>
          <View style={[tc.posterWrap, { backgroundColor: colors.muted }]}>
            <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
              {isMyTask ? "🙋 Siz" : task.posterNickname}
            </Text>
          </View>
          {task.courierNickname && (
            <View style={[tc.courierWrap, { backgroundColor: "#6366f1" + "12" }]}>
              <Ionicons name="bicycle-outline" size={11} color="#6366f1" />
              <Text style={{ fontSize: 11, color: "#6366f1" }}>
                {isMyCourier ? "Siz kabul etdiňiz" : task.courierNickname}
              </Text>
            </View>
          )}
          <Text style={[tc.time, { color: colors.mutedForeground }]}>{formatRelativeTime(task.createdAt)}</Text>
        </View>

        {/* Action buttons */}
        {!isMyTask && task.status === "open" && (
          <Pressable
            onPress={() => handleAccept(task.id)}
            disabled={actingId === task.id}
            style={[tc.actionBtn, { backgroundColor: "#d97706" }]}
          >
            {actingId === task.id
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="bicycle-outline" size={15} color="#fff" />
            }
            <Text style={tc.actionBtnText}>Kabul et — {task.reward} BP gazanyň</Text>
          </Pressable>
        )}

        {isMyCourier && task.status === "taken" && (
          <Pressable
            onPress={() => handleComplete(task.id)}
            disabled={actingId === task.id}
            style={[tc.actionBtn, { backgroundColor: "#059669" }]}
          >
            {actingId === task.id
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="checkmark-done-outline" size={15} color="#fff" />
            }
            <Text style={tc.actionBtnText}>Eltip berdim — {task.reward} BP al</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#92400e", "#d97706"]}
        style={[s.header, { paddingTop: (isWeb ? 0 : insets.top) + 14 }]}
      >
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.headerTitle}>Kuryer Tapşyryklar 📦</Text>
          <Text style={s.headerSub}>Ýol-ýolakay pul gazan ýa-da eltiş buýur</Text>
        </View>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowModal(true); }}
          style={s.addBtn}
        >
          <Ionicons name="add" size={22} color="#d97706" />
        </Pressable>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

        {/* ── Info ── */}
        <View style={[s.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
            <View style={[s.infoIcon, { backgroundColor: "#d97706" + "18" }]}>
              <Text style={{ fontSize: 24 }}>🚌</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.infoTitle, { color: colors.foreground }]}>Ýol-ýolakay Kuryer</Text>
              <Text style={[s.infoDesc, { color: colors.mutedForeground }]}>
                Çalt syýahat edýärsiňizmi? Başga adamyň bukjasyny eltip beripjek bolsaňyz BP gazanarsyňyz. Ýa öz bukjañyzy eltirmek üçin tapşyryk ýerleşdiriň.
              </Text>
            </View>
          </View>
        </View>

        {/* ── Tabs ── */}
        <View style={[s.tabRow, { backgroundColor: colors.muted }]}>
          {[
            { id: "all" as const, label: "Ähli" },
            { id: "mine" as const, label: "Meniňki" },
            { id: "accepted" as const, label: "Kabul edenlerim" },
          ].map(t => (
            <Pressable
              key={t.id}
              onPress={() => setActiveTab(t.id)}
              style={[s.tabBtn, activeTab === t.id && { backgroundColor: "#d97706" }]}
            >
              <Text style={[s.tabBtnText, { color: activeTab === t.id ? "#fff" : colors.mutedForeground }]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Task list ── */}
        {filteredTasks.length === 0 ? (
          <View style={[s.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ fontSize: 36, textAlign: "center" }}>📦</Text>
            <Text style={[s.emptyTitle, { color: colors.foreground }]}>Tapşyryk ýok</Text>
            <Text style={[s.emptyDesc, { color: colors.mutedForeground }]}>
              {activeTab === "all" ? "Tapşyryk ýerleşdiriň ýa-da biriniňkini kabul ediň" :
                activeTab === "mine" ? "Siz entek tapşyryk ýerleşdirmediňiz" :
                "Siz entek tapşyryk kabul etmediňiz"}
            </Text>
            {activeTab === "all" && (
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowModal(true); }}
                style={[s.emptyBtn, { backgroundColor: "#d97706" }]}
              >
                <Ionicons name="add-circle-outline" size={16} color="#fff" />
                <Text style={s.emptyBtnText}>Tapşyryk ýerleşdir</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, gap: 10 }}>
            {filteredTasks.map(t => <TaskCard key={t.id} task={t} />)}
          </View>
        )}
      </ScrollView>

      {/* ── FAB ── */}
      {filteredTasks.length > 0 && (
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowModal(true); }}
          style={[s.fab, { backgroundColor: "#d97706" }]}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </Pressable>
      )}

      {/* ── Modal ── */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <View style={[s.modalWrap, { backgroundColor: colors.background }]}>
          <View style={[s.modalHandle, { backgroundColor: colors.border }]} />
          <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[s.modalTitle, { color: colors.foreground }]}>Tapşyryk Ýerleşdir</Text>
              <Text style={[s.modalSub, { color: colors.mutedForeground }]}>Bakiýe: {balance.toFixed(2)} BP</Text>
            </View>
            <Pressable onPress={() => setShowModal(false)} style={[s.closeBtn, { backgroundColor: colors.muted }]}>
              <Ionicons name="close" size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
            {/* From */}
            <View style={{ gap: 6 }}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>Nireden *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {CITIES.map(c => (
                  <Pressable key={c} onPress={() => setFromCity(c)}
                    style={[s.cityBtn, { backgroundColor: fromCity === c ? "#d97706" : colors.card, borderColor: fromCity === c ? "#d97706" : colors.border }]}>
                    <Text style={[s.cityBtnText, { color: fromCity === c ? "#fff" : colors.foreground }]}>{c}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* To */}
            <View style={{ gap: 6 }}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>Nirä *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {CITIES.map(c => (
                  <Pressable key={c} onPress={() => setToCity(c)}
                    style={[s.cityBtn, { backgroundColor: toCity === c ? "#059669" : colors.card, borderColor: toCity === c ? "#059669" : colors.border }]}>
                    <Text style={[s.cityBtnText, { color: toCity === c ? "#fff" : colors.foreground }]}>{c}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Description */}
            <View style={{ gap: 6 }}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>Nämäni eltmeli? *</Text>
              <TextInput
                style={[s.textArea, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Ör: 1 ta A4 bukja, köýnek, resminamalar..."
                placeholderTextColor={colors.mutedForeground}
                multiline numberOfLines={3}
              />
            </View>

            {/* Weight (optional) */}
            <View style={{ gap: 6 }}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>Agramy (islege görä)</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
                value={weight}
                onChangeText={setWeight}
                placeholder="Ör: 0.5 kg, 2 kg..."
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            {/* Reward */}
            <View style={{ gap: 6 }}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>BP Sylag (min {MIN_REWARD} BP) *</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
                value={reward}
                onChangeText={setReward}
                keyboardType="numeric"
                placeholder="Ör: 50 BP"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            <View style={[s.warningBox, { backgroundColor: "#d97706" + "10", borderColor: "#d97706" + "28" }]}>
              <Ionicons name="information-circle-outline" size={15} color="#d97706" />
              <Text style={[s.warningText, { color: colors.foreground }]}>
                Sylag sum sargyt yerleshdirende balansyngyzdan alynar. Kuryer tapşyrygy tamamlandan soňra alýar.
              </Text>
            </View>

            <Pressable
              onPress={handleCreate}
              disabled={submitting || rewardNum < MIN_REWARD || !description.trim() || rewardNum > balance}
              style={[s.btnPrimary, { backgroundColor: "#d97706", opacity: (rewardNum < MIN_REWARD || !description.trim() || rewardNum > balance) ? 0.5 : 1 }]}
            >
              {submitting
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="send-outline" size={18} color="#fff" />
              }
              <Text style={s.btnPrimaryText}>{submitting ? "Iberilýär..." : "Tapşyrygy ýerleşdir"}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const tc = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  routeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cityBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  cityText: { fontSize: 12, fontWeight: "700" },
  routeLine: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
  routeDot: { width: 4, height: 4, borderRadius: 2 },
  desc: { fontSize: 13, lineHeight: 18 },
  infoRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
  rewardBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  rewardText: { fontSize: 12, fontWeight: "800" },
  weightBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  weightText: { fontSize: 11 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: "700" },
  footer: { flexDirection: "row", alignItems: "center", gap: 8 },
  posterWrap: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  courierWrap: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  time: { fontSize: 10, marginLeft: "auto" as any },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 12, paddingVertical: 12 },
  actionBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 18 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.72)", fontSize: 11, marginTop: 2 },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  infoCard: { marginHorizontal: 16, marginTop: 16, borderRadius: 16, borderWidth: 1, padding: 14 },
  infoIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  infoTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  infoDesc: { fontSize: 12, lineHeight: 18 },
  tabRow: { flexDirection: "row", marginHorizontal: 16, marginTop: 14, borderRadius: 12, padding: 3, gap: 2 },
  tabBtn: { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: "center" },
  tabBtnText: { fontSize: 11, fontWeight: "700" },
  empty: { marginHorizontal: 16, marginTop: 10, borderRadius: 18, borderWidth: 1, padding: 28, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyDesc: { fontSize: 13, textAlign: "center" },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11, marginTop: 8 },
  emptyBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  fab: { position: "absolute", bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", shadowColor: "#d97706", shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  modalWrap: { flex: 1 },
  modalHandle: { width: 38, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 8 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  modalSub: { fontSize: 12, marginTop: 2 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  inputLabel: { fontSize: 13, fontWeight: "600" },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  textArea: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, minHeight: 80, textAlignVertical: "top" },
  cityBtn: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5 },
  cityBtnText: { fontSize: 12, fontWeight: "600" },
  warningBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 12, borderWidth: 1, padding: 12 },
  warningText: { flex: 1, fontSize: 12, lineHeight: 17 },
  btnPrimary: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 15 },
  btnPrimaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
