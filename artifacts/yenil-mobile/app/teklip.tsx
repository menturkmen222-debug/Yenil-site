import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Alert, ActivityIndicator, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { saveOrder } from "@/lib/firebase";

export default function TeklipScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const [serviceName, setServiceName] = useState("");
  const [description, setDescription] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    if (!serviceName.trim() || !description.trim() || !contactPhone.trim()) {
      Alert.alert("Ýalňyşlyk", "Ähli meýdançalary dolduryň!"); return;
    }
    setLoading(true);
    try {
      await saveOrder("service-proposals", {
        serviceName, description, contactPhone,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
    } catch {
      Alert.alert("Ýalňyşlyk", "Bilinmeýän ýalňyşlyk, gaýtadan synanyşyň.");
    } finally { setLoading(false); }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: (isWeb ? 67 : insets.top) + 12, backgroundColor: colors.primary }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Teklip ibermek</Text>
      </View>

      {success ? (
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={64} color="#059669" />
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Alyndı!</Text>
          <Text style={[styles.successText, { color: colors.mutedForeground }]}>
            Siziň teklibiňiz kabul edildi. Iň tiz wagtda siz bilen habarlaşarys!
          </Text>
          <Pressable onPress={() => { setSuccess(false); setServiceName(""); setDescription(""); setContactPhone(""); }}
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}>
            <Text style={styles.primaryBtnText}>Täze teklip</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 34 : 100 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={[styles.heroBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary }]}>
            <Ionicons name="bulb-outline" size={32} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroTitle, { color: colors.primary }]}>Öz hyzmatyňyzy teklip ediň</Text>
              <Text style={[styles.heroDesc, { color: colors.mutedForeground }]}>
                Siziň hem hödürläp biljek hyzmatyňyz barmy? Bize ýazyň!
              </Text>
            </View>
          </View>

          <View style={{ gap: 14 }}>
            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Hyzmatyň ady</Text>
              <TextInput
                value={serviceName} onChangeText={setServiceName}
                placeholder="Meselem: Onlayn sargyt eltip bermek"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>

            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Düşündiriş</Text>
              <TextInput
                value={description} onChangeText={setDescription}
                placeholder="Hyzmatyňyz barada giňişleýin ýazyň..."
                placeholderTextColor={colors.mutedForeground}
                multiline numberOfLines={5}
                style={[styles.input, styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>

            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Habarlaşmak üçin nomer</Text>
              <TextInput
                value={contactPhone} onChangeText={setContactPhone}
                placeholder="+99361xxxxxx"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>
          </View>

          <Pressable onPress={handleSubmit} disabled={loading}
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed || loading ? 0.7 : 1, marginTop: 24 }]}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : (
              <>
                <Ionicons name="send-outline" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Teklip ibermek</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  heroBanner: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  heroTitle: { fontWeight: "700", fontSize: 15, marginBottom: 4 },
  heroDesc: { fontSize: 13, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  textarea: { height: 120, textAlignVertical: "top" },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 16 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  successContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  successTitle: { fontSize: 24, fontWeight: "800" },
  successText: { fontSize: 14, lineHeight: 22, textAlign: "center" },
});
