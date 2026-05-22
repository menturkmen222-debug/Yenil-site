import React, { useState } from "react";
import {
  Modal, View, Text, Pressable, ActivityIndicator,
  StyleSheet, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { addBalance, deductBalanceAtomic, saveOrder } from "@/lib/firebase";

export interface BPCheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  serviceName: string;
  serviceAmount: number;
  currentBalance: number;
  deviceId: string;
  onPaymentComplete: () => void;
}

const TMCELL_COMMISSION = 0.30;
const CARD_COMMISSION = 0.15;

export default function BPCheckoutModal({
  visible, onClose, serviceName, serviceAmount, currentBalance, deviceId, onPaymentComplete,
}: BPCheckoutModalProps) {
  const colors = useColors();
  const [selected, setSelected] = useState<"card" | "tmcell" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const missingBP = Math.max(0, parseFloat((serviceAmount - currentBalance).toFixed(2)));
  const cardTotal = parseFloat((missingBP * (1 + CARD_COMMISSION)).toFixed(2));
  const tmcellTotal = parseFloat((missingBP * (1 + TMCELL_COMMISSION)).toFixed(2));

  function handleClose() {
    if (loading) return;
    setSelected(null);
    setError("");
    onClose();
  }

  async function handleConfirm() {
    if (!selected || loading) return;
    setLoading(true);
    setError("");
    try {
      await addBalance(deviceId, missingBP);
      const commissionRate = selected === "card" ? CARD_COMMISSION : TMCELL_COMMISSION;
      const tmtPaid = selected === "card" ? cardTotal : tmcellTotal;
      await saveOrder("inline-topup-orders", {
        deviceId,
        missingBP,
        method: selected,
        tmtAmount: tmtPaid,
        commissionRate,
        serviceName,
        serviceCost: serviceAmount,
        status: "pending",
      });
      const result = await deductBalanceAtomic(deviceId, serviceAmount);
      if (!result.success) {
        setError("BP aýyrmak başartmady. Gaýtadan synanyşyň.");
        setLoading(false);
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSelected(null);
      setError("");
      onPaymentComplete();
    } catch {
      setError("Ulgam ýalňyşlygy. Gaýtadan synanyşyň.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Pressable style={st.overlay} onPress={handleClose}>
        <Pressable style={[st.sheet, { backgroundColor: colors.card }]} onPress={() => {}}>
          <View style={[st.handle, { backgroundColor: colors.border }]} />

          <View style={st.iconRow}>
            <View style={[st.warningCircle, { backgroundColor: "#fef3c710" }]}>
              <Ionicons name="wallet-outline" size={28} color="#d97706" />
            </View>
          </View>

          <Text style={[st.title, { color: colors.foreground }]}>Balans ýetmez</Text>
          <Text style={[st.subtitle, { color: colors.mutedForeground }]}>
            {serviceName} üçin goşmaça BP gerek
          </Text>

          <View style={[st.balanceCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            {[
              { label: "Häzirki balans", value: `${currentBalance.toFixed(2)} BP`, color: colors.foreground },
              { label: "Gerekli mukdar", value: `${serviceAmount} BP`, color: colors.foreground },
              { label: "Ýetmeýän BP", value: `${missingBP} BP`, color: "#ef4444" },
            ].map((row, i) => (
              <View key={i} style={[st.balRow, i < 2 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <Text style={[st.balLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                <Text style={[st.balVal, { color: row.color }]}>{row.value}</Text>
              </View>
            ))}
          </View>

          <Text style={[st.methodLabel, { color: colors.mutedForeground }]}>
            Ýetmeýän {missingBP} BP üçin töleg usulyny saýlaň:
          </Text>

          {([
            {
              id: "card" as const,
              icon: "card-outline" as const,
              iconBg: "#6366f115",
              iconColor: "#6366f1",
              label: "Bank kartasy",
              sublabel: `+15% komissiya`,
              total: cardTotal,
              badge: "15%",
            },
            {
              id: "tmcell" as const,
              icon: "phone-portrait-outline" as const,
              iconBg: "#059669" + "15",
              iconColor: "#059669",
              label: "TMCell balans",
              sublabel: "+30% komissiya",
              total: tmcellTotal,
              badge: "30%",
            },
          ] as const).map((m) => {
            const isSelected = selected === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => { if (!loading) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelected(m.id); }}}
                style={[
                  st.methodCard,
                  {
                    backgroundColor: isSelected ? colors.primary + "12" : colors.background,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <View style={[st.methodIcon, { backgroundColor: isSelected ? colors.primary + "20" : m.iconBg }]}>
                  <Ionicons name={m.icon} size={20} color={isSelected ? colors.primary : m.iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[st.methodName, { color: colors.foreground }]}>{m.label}</Text>
                  <Text style={[st.methodSub, { color: colors.mutedForeground }]}>{m.sublabel}</Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 3 }}>
                  <Text style={[st.methodTotal, { color: isSelected ? colors.primary : colors.foreground }]}>
                    {m.total} TMT
                  </Text>
                  <View style={[st.commBadge, { backgroundColor: isSelected ? colors.primary : colors.muted }]}>
                    <Text style={[st.commBadgeTxt, { color: isSelected ? "#fff" : colors.mutedForeground }]}>
                      {m.badge}
                    </Text>
                  </View>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={st.checkIcon} />
                )}
              </Pressable>
            );
          })}

          {error ? (
            <View style={st.errBox}>
              <Ionicons name="alert-circle-outline" size={15} color="#dc2626" />
              <Text style={st.errText}>{error}</Text>
            </View>
          ) : null}

          <View style={st.actions}>
            <Pressable
              onPress={handleClose}
              disabled={loading}
              style={({ pressed }) => [st.cancelBtn, { borderColor: colors.border, opacity: pressed || loading ? 0.5 : 1 }]}
            >
              <Text style={[st.cancelTxt, { color: colors.mutedForeground }]}>Ýatyr</Text>
            </Pressable>

            <Pressable
              onPress={handleConfirm}
              disabled={!selected || loading}
              style={({ pressed }) => [
                st.confirmBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: !selected || loading || pressed ? 0.6 : 1,
                  flex: 1,
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={st.confirmTxt}>Tassyklamak</Text>
                </>
              )}
            </Pressable>
          </View>

          <Text style={[st.notice, { color: colors.mutedForeground }]}>
            Tölegi tassyklap, töleg geçirilenden soň hyzmat işleniler.
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const st = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    gap: 0,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: "center", marginBottom: 16,
  },
  iconRow: {
    alignItems: "center", marginBottom: 12,
  },
  warningCircle: {
    width: 60, height: 60, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#fef3c720",
    borderWidth: 1.5,
    borderColor: "#d9770640",
  },
  title: {
    fontSize: 20, fontWeight: "800", textAlign: "center", marginBottom: 4,
  },
  subtitle: {
    fontSize: 13, textAlign: "center", marginBottom: 16, lineHeight: 18,
  },
  balanceCard: {
    borderRadius: 14, borderWidth: 1, marginBottom: 16, overflow: "hidden",
  },
  balRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 10,
  },
  balLabel: { fontSize: 13 },
  balVal: { fontSize: 13, fontWeight: "700" },
  methodLabel: {
    fontSize: 12, fontWeight: "600", marginBottom: 10,
  },
  methodCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 10,
    position: "relative",
  },
  methodIcon: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  methodName: { fontSize: 14, fontWeight: "700" },
  methodSub: { fontSize: 11, marginTop: 2 },
  methodTotal: { fontSize: 16, fontWeight: "800" },
  commBadge: {
    borderRadius: 50, paddingHorizontal: 7, paddingVertical: 2,
  },
  commBadgeTxt: { fontSize: 10, fontWeight: "700" },
  checkIcon: {
    position: "absolute", top: 10, right: 10,
  },
  errBox: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#fee2e2", borderRadius: 10, padding: 10, marginBottom: 10,
  },
  errText: { color: "#dc2626", fontSize: 12, flex: 1 },
  actions: {
    flexDirection: "row", gap: 10, marginTop: 6, marginBottom: 10,
  },
  cancelBtn: {
    borderRadius: 12, borderWidth: 1.5,
    paddingVertical: 14, paddingHorizontal: 18,
    alignItems: "center", justifyContent: "center",
  },
  cancelTxt: { fontSize: 15, fontWeight: "600" },
  confirmBtn: {
    borderRadius: 12, paddingVertical: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
  },
  confirmTxt: { color: "#fff", fontSize: 15, fontWeight: "700" },
  notice: {
    fontSize: 11, textAlign: "center", lineHeight: 16,
  },
});
