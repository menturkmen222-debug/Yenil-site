import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, Switch,
  Alert, Linking, Platform, useColorScheme,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";

const APP_VERSION = "2.4.1";
const LATEST_VERSION = "2.4.1";

type Language = "tk" | "ru" | "en";
const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "tk", label: "Türkmençe", flag: "🇹🇲" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

export default function SozlamalarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { balance, deviceId } = useBonusPul();
  const colorScheme = useColorScheme();
  const isWeb = Platform.OS === "web";
  const isDark = colorScheme === "dark";

  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState<Language>("tk");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  function section(title: string) {
    return <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>{title}</Text>;
  }

  function SettingRow({
    icon, iconColor = colors.primary, label, desc, value, onPress, right,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    label: string;
    desc?: string;
    value?: string;
    onPress?: () => void;
    right?: React.ReactNode;
  }) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.row, { opacity: pressed && onPress ? 0.8 : 1 }]}
      >
        <View style={[styles.rowIcon, { backgroundColor: iconColor + "20" }]}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
          {desc ? <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>{desc}</Text> : null}
        </View>
        {right ? right : value ? (
          <Text style={[styles.rowValue, { color: colors.primary }]}>{value}</Text>
        ) : onPress ? (
          <Ionicons name="chevron-forward-outline" size={16} color={colors.mutedForeground} />
        ) : null}
      </Pressable>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: (isWeb ? 0 : insets.top) + 12, backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>Sozlamalar</Text>
        <Text style={styles.headerSub}>Programma sazlamalary</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 110 : 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Card */}
        <View style={[styles.accountCard, { backgroundColor: colors.primary }]}>
          <View style={styles.accountAvatar}>
            <Ionicons name="person-outline" size={32} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.accountName}>Myhman ulanyjy</Text>
            <Text style={styles.accountId}>ID: {deviceId ? deviceId.slice(0, 12) + "..." : "Ýüklenýär..."}</Text>
            <View style={styles.accountBalance}>
              <Ionicons name="wallet-outline" size={14} color="rgba(255,255,255,0.9)" />
              <Text style={styles.accountBalanceText}>{balance.toFixed(2)} BP</Text>
            </View>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert("Akkaunt", "Akkaunt dolandyryşy ýakyn wagtda elýeterli bolar.");
            }}
            style={styles.editBtn}
          >
            <Feather name="edit-3" size={16} color="#fff" />
          </Pressable>
        </View>

        {section("GÖRÜNIŞ")}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            icon={isDark ? "moon-outline" : "sunny-outline"}
            iconColor={isDark ? "#6366f1" : "#f59e0b"}
            label="Tema"
            desc={isDark ? "Garaňky tema işjeň" : "Ýagtylyk tema işjeň"}
            right={
              <View style={[styles.themeBadge, { backgroundColor: isDark ? "#6366f120" : "#f59e0b20" }]}>
                <Text style={[styles.themeBadgeText, { color: isDark ? "#6366f1" : "#f59e0b" }]}>
                  {isDark ? "Garaňky" : "Ýagtylyk"}
                </Text>
              </View>
            }
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert("Tema", "Tema üýtgetmek üçin enjamyňyzyň ulgam sazlamalaryna giriň.");
            }}
          />
        </View>

        {section("DIL / TIL")}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            icon="language-outline"
            iconColor="#0ea5e9"
            label="Dil saýlaň"
            desc={LANGUAGES.find((l) => l.code === language)?.label}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowLangPicker(!showLangPicker); }}
            right={
              <View style={styles.langRight}>
                <Text style={styles.langFlag}>{LANGUAGES.find((l) => l.code === language)?.flag}</Text>
                <Ionicons name={showLangPicker ? "chevron-up-outline" : "chevron-down-outline"} size={16} color={colors.mutedForeground} />
              </View>
            }
          />
          {showLangPicker && (
            <View style={[styles.langPicker, { borderTopColor: colors.border }]}>
              {LANGUAGES.map((lang) => (
                <Pressable
                  key={lang.code}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setLanguage(lang.code);
                    setShowLangPicker(false);
                  }}
                  style={[
                    styles.langOption,
                    language === lang.code && { backgroundColor: colors.primary + "15" },
                  ]}
                >
                  <Text style={styles.langOptionFlag}>{lang.flag}</Text>
                  <Text style={[styles.langOptionLabel, { color: colors.foreground }]}>{lang.label}</Text>
                  {language === lang.code && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {section("HABARNAMALAR")}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            icon="notifications-outline"
            iconColor="#ef4444"
            label="Habarnamalar"
            desc="Täzelikleri we sargyt habarlaryny al"
            right={
              <Switch
                value={notifications}
                onValueChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNotifications(v); }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            }
          />
        </View>

        {section("PROGRAMMA")}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            icon="refresh-outline"
            iconColor="#10b981"
            label="Täze wersiýa barla"
            desc={`Häzirki wersiýa: ${APP_VERSION}`}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert(
                "Wersiýa barlagy",
                APP_VERSION === LATEST_VERSION
                  ? `Siz iň täze wersiýany ulanýarsyňyz (${APP_VERSION})`
                  : `Täze wersiýa elýeterli: ${LATEST_VERSION}`,
                [
                  { text: "Ýap" },
                  APP_VERSION !== LATEST_VERSION ? {
                    text: "Täzele",
                    onPress: () => Linking.openURL("https://yenil.tm"),
                  } : undefined,
                ].filter(Boolean) as any[]
              );
            }}
            right={
              <View style={[styles.versionBadge, { backgroundColor: "#10b98120" }]}>
                <Text style={[styles.versionBadgeText, { color: "#10b981" }]}>v{APP_VERSION}</Text>
              </View>
            }
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="star-outline"
            iconColor="#f59e0b"
            label="Baha ber"
            desc="Programmamyzy App Store-da bahalandyryň"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert("Baha ber", "Siziň pikiriňiz biziň üçin gymmatly! App Store-a geçeýlimi?", [
                { text: "Soň" },
                { text: "Hawa", onPress: () => Linking.openURL("https://yenil.tm") },
              ]);
            }}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="share-social-outline"
            iconColor="#6366f1"
            label="Dostlaryňa paýlaş"
            desc="Ýeňil programmany doslaryňa tanyşdyr"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert("Paýlaş", "Programma baglanyşygyny göçürmek isleýärsiňizmi?", [
                { text: "Ýok" },
                { text: "Kopirle", onPress: () => Alert.alert("Üstünlikli", "Baglanyşyk kopirlenildi!") },
              ]);
            }}
          />
        </View>

        {section("GOLDAW")}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            icon="help-circle-outline"
            iconColor="#0ea5e9"
            label="Kömek / FAQ"
            desc="Köp soralýan soraglar"
            onPress={() => Linking.openURL("https://yenil.tm/help")}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="logo-telegram"
            iconColor="#0088cc"
            label="Telegram goldawy"
            desc="@yenil_tm"
            onPress={() => Linking.openURL("http://t.me/yenil_tm")}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="call-outline"
            iconColor="#15803d"
            label="Jaň et"
            desc="+993 71 789091"
            onPress={() => Linking.openURL("tel:+99371789091")}
          />
        </View>

        {section("BIZ HAKYNDA")}
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAbout(!showAbout); }}
          style={[styles.aboutCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.aboutHeader}>
            <View style={[styles.rowIcon, { backgroundColor: colors.primary + "20" }]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Ýeňil hakynda</Text>
            <Ionicons name={showAbout ? "chevron-up-outline" : "chevron-down-outline"} size={16} color={colors.mutedForeground} />
          </View>
          {showAbout && (
            <View style={styles.aboutContent}>
              <View style={[styles.aboutLogoCircle, { backgroundColor: colors.primary }]}>
                <Text style={styles.aboutLogoText}>Ý</Text>
              </View>
              <Text style={[styles.aboutTitle, { color: colors.foreground }]}>Ýeňil</Text>
              <Text style={[styles.aboutSubtitle, { color: colors.mutedForeground }]}>
                Türkmenistanda iň ynamly onlayn hyzmat platformasy
              </Text>
              <Text style={[styles.aboutDesc, { color: colors.mutedForeground }]}>
                2022-nji ýyldan bäri müşderilere demirýol bilet, walýuta çalyşmak, bonus pul we beýleki onlayn hyzmatlary hödürleýäris.
              </Text>
              <View style={styles.aboutStats}>
                {[
                  { num: "500+", label: "Müşderi" },
                  { num: "1200+", label: "Sargyt" },
                  { num: "98%", label: "Kanagatlanma" },
                ].map((s, i) => (
                  <View key={i} style={[styles.aboutStat, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.aboutStatNum, { color: colors.primary }]}>{s.num}</Text>
                    <Text style={[styles.aboutStatLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.aboutContacts}>
                {[
                  { icon: "logo-instagram" as const, label: "@yenil_tm", url: "https://www.instagram.com/yenil_tm" },
                  { icon: "paper-plane-outline" as const, label: "Telegram", url: "http://t.me/yenil_tm" },
                ].map((c, i) => (
                  <Pressable key={i} onPress={() => Linking.openURL(c.url)}
                    style={[styles.aboutContact, { backgroundColor: colors.muted }]}>
                    <Ionicons name={c.icon} size={16} color={colors.primary} />
                    <Text style={[{ color: colors.foreground, fontSize: 13, fontWeight: "600" }]}>{c.label}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[styles.aboutVersion, { color: colors.mutedForeground }]}>
                Wersiýa {APP_VERSION} · © 2022–2026 Ýeňil
              </Text>
            </View>
          )}
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Alert.alert("Çykmak", "Akkauntdan çykmagy isleýärsiňizmi?", [
              { text: "Ýok" },
              { text: "Hawa, çyk", style: "destructive", onPress: () => Alert.alert("Çykyldy", "Üstünlikli çykyldy!") },
            ]);
          }}
          style={({ pressed }) => [styles.logoutBtn, { opacity: pressed ? 0.8 : 1, borderColor: "#ef4444" }]}
        >
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          <Text style={styles.logoutText}>Akkauntdan çyk</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 },
  accountCard: { borderRadius: 20, padding: 18, flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 4 },
  accountAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  accountName: { color: "#fff", fontSize: 16, fontWeight: "800", marginBottom: 2 },
  accountId: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginBottom: 6 },
  accountBalance: { flexDirection: "row", alignItems: "center", gap: 6 },
  accountBalanceText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  editBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  groupTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 8, marginTop: 20, marginLeft: 4 },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14 },
  rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontSize: 14, fontWeight: "600", marginBottom: 1 },
  rowDesc: { fontSize: 12 },
  rowValue: { fontSize: 13, fontWeight: "700" },
  divider: { height: 1, marginLeft: 68 },
  themeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  themeBadgeText: { fontSize: 12, fontWeight: "700" },
  langRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  langFlag: { fontSize: 20 },
  langPicker: { borderTopWidth: 1 },
  langOption: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  langOptionFlag: { fontSize: 22 },
  langOptionLabel: { flex: 1, fontSize: 14, fontWeight: "600" },
  versionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  versionBadgeText: { fontSize: 12, fontWeight: "700" },
  aboutCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 4 },
  aboutHeader: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14 },
  aboutContent: { padding: 16, paddingTop: 0, alignItems: "center" },
  aboutLogoCircle: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  aboutLogoText: { color: "#fff", fontSize: 32, fontWeight: "800" },
  aboutTitle: { fontSize: 22, fontWeight: "800", marginBottom: 4 },
  aboutSubtitle: { fontSize: 13, textAlign: "center", marginBottom: 12, lineHeight: 18 },
  aboutDesc: { fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 16 },
  aboutStats: { flexDirection: "row", gap: 10, marginBottom: 16 },
  aboutStat: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12 },
  aboutStatNum: { fontSize: 18, fontWeight: "800" },
  aboutStatLabel: { fontSize: 10, marginTop: 2 },
  aboutContacts: { flexDirection: "row", gap: 10, marginBottom: 16 },
  aboutContact: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12 },
  aboutVersion: { fontSize: 11 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 16, marginTop: 20, borderWidth: 2 },
  logoutText: { color: "#ef4444", fontWeight: "700", fontSize: 15 },
});
