import React, { useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";
import { useRates } from "@/contexts/RatesContext";
import { addBalance, saveOrder } from "@/lib/firebase";
import { calcMissingBP } from "@/lib/payments";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];
type TopUpMethod = "card" | "tmcell";

export interface BPCheckoutModalProps {
  visible: boolean;
  serviceName: string;
  serviceIcon?: IoniconsName;
  serviceColor?: string;
  amount?: number;
  serviceId?: string;
  description?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  /** @deprecated onCancel ishlet */
  onClose?: () => void;
  /** @deprecated amount ishlet */
  serviceAmount?: number;
  /** @deprecated context'den awtomatik olinýar */
  currentBalance?: number;
  /** @deprecated context'den awtomatik olinýar */
  deviceId?: string;
  /** @deprecated onSuccess ishlet */
  onPaymentComplete?: () => void;
}

export function BPCheckoutModal({
  visible,
  serviceName,
  serviceIcon = "wallet-outline",
  serviceColor = "#1B6B3A",
  amount: amountProp,
  serviceAmount,
  serviceId = "unknown",
  description = "",
  onSuccess,
  onPaymentComplete,
  onCancel,
  onClose,
}: BPCheckoutModalProps) {
  const amount = amountProp ?? serviceAmount ?? 0;
  const resolvedOnSuccess = onSuccess ?? onPaymentComplete ?? (() => {});
  const resolvedOnCancel = onCancel ?? onClose ?? (() => {});
  const colors = useColors();
  const { balance, deviceId, paymentLocked, payWithBP, checkInsufficientAmount } =
    useBonusPul();

  const [selectedMethod, setSelectedMethod] = useState<TopUpMethod | null>(null);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [error, setError] = useState("");

  const rates = useRates();
  const missingBP = checkInsufficientAmount(amount);
  const isSufficient = missingBP === 0;

  const cardTotal    = parseFloat((missingBP * (1 + rates.bank_topup)).toFixed(2));
  const tmcellTotal  = parseFloat((missingBP * (1 + rates.tmcell_topup)).toFixed(2));

  const handleClose = useCallback(() => {
    if (paymentLocked || topUpLoading) return;
    setSelectedMethod(null);
    setError("");
    resolvedOnCancel();
  }, [paymentLocked, topUpLoading, resolvedOnCancel]);

  const handleDirectPay = useCallback(async () => {
    if (paymentLocked) return;
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await payWithBP(amount, serviceId, description);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSelectedMethod(null);
      setError("");
      resolvedOnSuccess();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.message);
    }
  }, [paymentLocked, amount, serviceId, description, payWithBP, resolvedOnSuccess]);

  const handleTopUpAndPay = useCallback(async () => {
    if (!selectedMethod || topUpLoading || paymentLocked) return;
    setTopUpLoading(true);
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const tmtPaid = selectedMethod === "card" ? cardTotal : tmcellTotal;

      await addBalance(deviceId, missingBP);
      await saveOrder("inline-topup-orders", {
        deviceId,
        missingBP,
        method: selectedMethod,
        tmtAmount: tmtPaid,
        commissionRate:
          selectedMethod === "card"
            ? rates.bank_topup
            : rates.tmcell_topup,
        serviceName,
        serviceCost: amount,
        status: "pending",
        createdAt: Date.now(),
      });

      const result = await payWithBP(amount, serviceId, description);

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSelectedMethod(null);
        setError("");
        resolvedOnSuccess();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError(result.message);
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError("Ulgam ýalňyşlygy. Gaýtadan synanyşyň.");
    } finally {
      setTopUpLoading(false);
    }
  }, [
    selectedMethod,
    topUpLoading,
    paymentLocked,
    cardTotal,
    tmcellTotal,
    deviceId,
    missingBP,
    serviceName,
    amount,
    serviceId,
    description,
    payWithBP,
    resolvedOnSuccess,
  ]);

  const isProcessing = paymentLocked || topUpLoading;

  const topUpMethods = [
    {
      id: "card" as const,
      icon: "card-outline" as IoniconsName,
      iconBg: "#6366f115",
      iconColor: "#6366f1",
      label: "Bank kartasy",
      sublabel: `+${(rates.bank_topup * 100).toFixed(0)}% komissiýa`,
      total: cardTotal,
      badge: `${(rates.bank_topup * 100).toFixed(0)}%`,
    },
    {
      id: "tmcell" as const,
      icon: "phone-portrait-outline" as IoniconsName,
      iconBg: "#05966915",
      iconColor: "#059669",
      label: "TMCell balans",
      sublabel: `+${(rates.tmcell_topup * 100).toFixed(0)}% komissiýa`,
      total: tmcellTotal,
      badge: `${(rates.tmcell_topup * 100).toFixed(0)}%`,
    },
  ] as const;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Pressable style={st.overlay} onPress={handleClose}>
        <Pressable
          style={[st.sheet, { backgroundColor: colors.card }]}
          onPress={() => {}}
        >
          <View style={[st.handle, { backgroundColor: colors.border }]} />

          {isSufficient ? (
            <>
              <View style={st.iconRow}>
                <View
                  style={[
                    st.serviceCircle,
                    { backgroundColor: serviceColor + "18" },
                  ]}
                >
                  <Ionicons name={serviceIcon} size={28} color={serviceColor} />
                </View>
              </View>

              <Text style={[st.title, { color: colors.foreground }]}>
                {serviceName}
              </Text>
              <Text style={[st.subtitle, { color: colors.mutedForeground }]}>
                {description}
              </Text>

              <View
                style={[
                  st.balanceCard,
                  {
                    backgroundColor: colors.muted,
                    borderColor: colors.border,
                  },
                ]}
              >
                {[
                  {
                    label: "Hyzmat bahasy",
                    value: `${amount} BP`,
                    color: colors.foreground,
                  },
                  {
                    label: "Häzirki balans",
                    value: `${balance.toFixed(2)} BP`,
                    color: colors.success,
                  },
                  {
                    label: "Tölegden soňky balans",
                    value: `${Math.max(0, balance - amount).toFixed(2)} BP`,
                    color: colors.primary,
                  },
                ].map((row, i) => (
                  <View
                    key={i}
                    style={[
                      st.balRow,
                      i < 2 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[st.balLabel, { color: colors.mutedForeground }]}
                    >
                      {row.label}
                    </Text>
                    <Text style={[st.balVal, { color: row.color }]}>
                      {row.value}
                    </Text>
                  </View>
                ))}
              </View>

              {error ? (
                <View style={st.errBox}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={15}
                    color="#dc2626"
                  />
                  <Text style={st.errText}>{error}</Text>
                </View>
              ) : null}

              <View style={st.actions}>
                <Pressable
                  onPress={handleClose}
                  disabled={isProcessing}
                  style={({ pressed }) => [
                    st.cancelBtn,
                    {
                      borderColor: colors.border,
                      opacity: pressed || isProcessing ? 0.5 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[st.cancelTxt, { color: colors.mutedForeground }]}
                  >
                    Ýatyr
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleDirectPay}
                  disabled={isProcessing}
                  style={({ pressed }) => [
                    st.confirmBtn,
                    {
                      backgroundColor: colors.primary,
                      opacity: isProcessing || pressed ? 0.6 : 1,
                      flex: 1,
                    },
                  ]}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={18}
                        color="#fff"
                      />
                      <Text style={st.confirmTxt}>Tölemek</Text>
                    </>
                  )}
                </Pressable>
              </View>

              <Text style={[st.notice, { color: colors.mutedForeground }]}>
                Tölegi tassyklap, balans awtomatik aýrylar.
              </Text>
            </>
          ) : (
            <>
              <View style={st.iconRow}>
                <View
                  style={[
                    st.warningCircle,
                    { backgroundColor: "#fef3c720" },
                  ]}
                >
                  <Ionicons
                    name="wallet-outline"
                    size={28}
                    color="#d97706"
                  />
                </View>
              </View>

              <Text style={[st.title, { color: colors.foreground }]}>
                Balans ýetmez
              </Text>
              <Text style={[st.subtitle, { color: colors.mutedForeground }]}>
                {serviceName} üçin goşmaça BP gerek
              </Text>

              <View
                style={[
                  st.balanceCard,
                  {
                    backgroundColor: colors.muted,
                    borderColor: colors.border,
                  },
                ]}
              >
                {[
                  {
                    label: "Häzirki balans",
                    value: `${balance.toFixed(2)} BP`,
                    color: colors.foreground,
                  },
                  {
                    label: "Gerekli mukdar",
                    value: `${amount} BP`,
                    color: colors.foreground,
                  },
                  {
                    label: "Ýetmeýän BP",
                    value: `${missingBP} BP`,
                    color: "#ef4444",
                  },
                ].map((row, i) => (
                  <View
                    key={i}
                    style={[
                      st.balRow,
                      i < 2 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[st.balLabel, { color: colors.mutedForeground }]}
                    >
                      {row.label}
                    </Text>
                    <Text style={[st.balVal, { color: row.color }]}>
                      {row.value}
                    </Text>
                  </View>
                ))}
              </View>

              <Text
                style={[st.methodLabel, { color: colors.mutedForeground }]}
              >
                Ýetmeýän {missingBP} BP üçin töleg usulyny saýlaň:
              </Text>

              {topUpMethods.map((m) => {
                const isSelected = selectedMethod === m.id;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => {
                      if (!isProcessing) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedMethod(m.id);
                        setError("");
                      }
                    }}
                    style={[
                      st.methodCard,
                      {
                        backgroundColor: isSelected
                          ? colors.primary + "12"
                          : colors.background,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        st.methodIcon,
                        {
                          backgroundColor: isSelected
                            ? colors.primary + "20"
                            : m.iconBg,
                        },
                      ]}
                    >
                      <Ionicons
                        name={m.icon}
                        size={20}
                        color={isSelected ? colors.primary : m.iconColor}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[st.methodName, { color: colors.foreground }]}
                      >
                        {m.label}
                      </Text>
                      <Text
                        style={[
                          st.methodSub,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {m.sublabel}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 3 }}>
                      <Text
                        style={[
                          st.methodTotal,
                          {
                            color: isSelected
                              ? colors.primary
                              : colors.foreground,
                          },
                        ]}
                      >
                        {m.total} TMT
                      </Text>
                      <View
                        style={[
                          st.commBadge,
                          {
                            backgroundColor: isSelected
                              ? colors.primary
                              : colors.muted,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            st.commBadgeTxt,
                            {
                              color: isSelected
                                ? "#fff"
                                : colors.mutedForeground,
                            },
                          ]}
                        >
                          {m.badge}
                        </Text>
                      </View>
                    </View>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={colors.primary}
                        style={st.checkIcon}
                      />
                    )}
                  </Pressable>
                );
              })}

              {error ? (
                <View style={st.errBox}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={15}
                    color="#dc2626"
                  />
                  <Text style={st.errText}>{error}</Text>
                </View>
              ) : null}

              <View style={st.actions}>
                <Pressable
                  onPress={handleClose}
                  disabled={isProcessing}
                  style={({ pressed }) => [
                    st.cancelBtn,
                    {
                      borderColor: colors.border,
                      opacity: pressed || isProcessing ? 0.5 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[st.cancelTxt, { color: colors.mutedForeground }]}
                  >
                    Ýatyr
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleTopUpAndPay}
                  disabled={!selectedMethod || isProcessing}
                  style={({ pressed }) => [
                    st.confirmBtn,
                    {
                      backgroundColor: colors.primary,
                      opacity:
                        !selectedMethod || isProcessing || pressed ? 0.6 : 1,
                      flex: 1,
                    },
                  ]}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={18}
                        color="#fff"
                      />
                      <Text style={st.confirmTxt}>Tassyklamak</Text>
                    </>
                  )}
                </Pressable>
              </View>

              <Text style={[st.notice, { color: colors.mutedForeground }]}>
                Tölegi tassyklap, töleg geçirilenden soň hyzmat işleniler.
              </Text>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export { BPCheckoutModal as SeamlessCheckout };
export default BPCheckoutModal;

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
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  iconRow: {
    alignItems: "center",
    marginBottom: 12,
  },
  serviceCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  warningCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#d9770640",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 18,
  },
  balanceCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  balRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  balLabel: { fontSize: 13 },
  balVal: { fontSize: 13, fontWeight: "700" },
  methodLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 10,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 10,
    position: "relative",
  },
  methodIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  methodName: { fontSize: 14, fontWeight: "700" },
  methodSub: { fontSize: 11, marginTop: 2 },
  methodTotal: { fontSize: 16, fontWeight: "800" },
  commBadge: {
    borderRadius: 50,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  commBadgeTxt: { fontSize: 10, fontWeight: "700" },
  checkIcon: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  errBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fee2e2",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  errText: { color: "#dc2626", fontSize: 12, flex: 1 },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
    marginBottom: 10,
  },
  cancelBtn: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelTxt: { fontSize: 15, fontWeight: "600" },
  confirmBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  confirmTxt: { color: "#fff", fontSize: 15, fontWeight: "700" },
  notice: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
});
