import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  Alert, ActivityIndicator, Platform, Image,
} from "react-native";
import { router } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useColors } from "@/hooks/useColors";
import { saveOrder } from "@/lib/firebase";
import { uploadImage } from "@/lib/upload";

export default function TeklipScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [desc, setDesc] = useState("");
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function pickFile() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setFileUri(result.assets[0].uri);
  }

  async function handleSubmit() {
    if (!name.trim() || !phone.trim() || !serviceName.trim() || !desc.trim()) {
      Alert.alert("Ýalňyşlyk", "Ähli meýdançalary dolduryň!"); return;
    }
    setLoading(true);
    try {
      const fileUrl = fileUri ? await uploadImage(fileUri, "teklip.jpg") : null;
      await saveOrder("service-proposals", {
        name, phone, serviceName, description: desc, fileUrl, status: "pending",
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
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Alyndy!</Text>
          <Text style={[styles.successText, { color: colors.mutedForeground }]}>
            Siziň teklibiňiz kabul edildi. Iň tiz wagtda siz bilen habarlaşarys!
          </Text>
          <Pressable onPress={() => { setSuccess(false); setName(""); setPhone(""); setServiceName(""); setDesc(""); setFileUri(null); }}
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}>
            <Text style={styles.primaryBtnText}>Täze teklip</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 34 : 100 }}
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Adyňyz</Text>
              <TextInput value={name} onChangeText={setName} placeholder="Adyňyz"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>

            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Telefon belgiňiz</Text>
              <TextInput value={phone} onChangeText={setPhone} placeholder="+993 XX XXXXXX"
                placeholderTextColor={colors.mutedForeground} keyboardType="phone-pad"
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>

            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Hyzmatyňyzyň ady</Text>
              <TextInput value={serviceName} onChangeText={setServiceName}
                placeholder="Meseläň: Web dizaýn, Terjime..."
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>

            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Düşündiriş</Text>
              <TextInput value={desc} onChangeText={setDesc}
                placeholder="Hyzmatyňyz barada giňişleýin ýazyň..."
                placeholderTextColor={colors.mutedForeground} multiline numberOfLines={5}
                style={[styles.input, styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>

            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Surat (islege görä)</Text>
              <Pressable onPress={pickFile}
                style={[styles.filePicker, { borderColor: colors.primary, backgroundColor: colors.card }]}>
                <Ionicons name="image-outline" size={24} color={colors.primary} />
                <Text style={[{ color: colors.primary, fontWeight: "600", fontSize: 14 }]}>
                  {fileUri ? "Surat saýlandy ✓" : "Surat ýüklemek üçin basyň"}
                </Text>
              </Pressable>
              {fileUri && (
                <Image source={{ uri: fileUri }} style={{ height: 140, borderRadius: 10, marginTop: 10, resizeMode: "cover" }} />
              )}
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
  filePicker: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 2, borderStyle: "dashed", borderRadius: 12, padding: 16, justifyContent: "center" },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 16 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  successContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  successTitle: { fontSize: 24, fontWeight: "800" },
  successText: { fontSize: 14, lineHeight: 22, textAlign: "center" },
});
