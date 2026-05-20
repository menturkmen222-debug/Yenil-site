import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, Switch,
  Alert, Linking, Platform, Modal,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { router, type Href } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/contexts/ThemeContext";
import { useBonusPul } from "@/contexts/BonusPulContext";
import { type ThemeKey } from "@/constants/colors";

const APP_VERSION = "2.4.1";
const LATEST_VERSION = "2.4.1";

type Language = "tk" | "ru" | "en";
const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "tk", label: "Türkmençe", flag: "🇹🇲" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

const THEMES: {
  key: ThemeKey;
  label: string;
  sublabel: string;
  emoji: string;
  preview: [string, string];
  accent: string;
  dot: string;
}[] = [
  {
    key: "green",
    label: "Ýaşyl",
    sublabel: "Tebigy & Arassa",
    emoji: "🌿",
    preview: ["#166534", "#16a34a"],
    accent: "#16a34a",
    dot: "#4ade80",
  },
  {
    key: "dark",
    label: "Garaňky",
    sublabel: "Gijeki & Göz rahat",
    emoji: "🌙",
    preview: ["#111111", "#1e1e1e"],
    accent: "#22c55e",
    dot: "#22c55e",
  },
  {
    key: "white",
    label: "Ak",
    sublabel: "Arassa & Ýagty",
    emoji: "☀️",
    preview: ["#1d4ed8", "#3b82f6"],
    accent: "#3b82f6",
    dot: "#93c5fd",
  },
  {
    key: "girls",
    label: "Gyzlar",
    sublabel: "Romantic & Owadan",
    emoji: "🌸",
    preview: ["#9d174d", "#ec4899"],
    accent: "#ec4899",
    dot: "#f9a8d4",
  },
];

export default function SozlamalarScreen() {
  const colors = useColors();
  const { themeKey, setTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { balance, deviceId } = useBonusPul();
  const isWeb = Platform.OS === "web";

  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState<Language>("tk");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const currentTheme = THEMES.find((t) => t.key === themeKey) ?? THEMES[0];

  function section(title: string) {
    return (
      <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>
        {title}
      </Text>
    );
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
        style={({ pressed }) => [
          styles.row,
          { opacity: pressed && onPress ? 0.75 : 1 },
        ]}
      >
        <View style={[styles.rowIcon, { backgroundColor: iconColor + "22" }]}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
          {desc ? (
            <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>{desc}</Text>
          ) : null}
        </View>
        {right
          ? right
          : value
          ? <Text style={[styles.rowValue, { color: colors.primary }]}>{value}</Text>
          : onPress
          ? <Ionicons name="chevron-forward-outline" size={16} color={colors.mutedForeground} />
          : null}
      </Pressable>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd] as [string, string]}
        style={[styles.header, { paddingTop: (isWeb ? 0 : insets.top) + 14 }]}
      >
        <Text style={styles.headerTitle}>Sozlamalar</Text>
        <Text style={styles.headerSub}>Programma sazlamalary</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Card */}
        <LinearGradient
          colors={[colors.headerGradientStart, colors.headerGradientEnd] as [string, string]}
          style={styles.accountCard}
        >
          <View style={styles.accountAvatar}>
            <Ionicons name="person-outline" size={30} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.accountName}>Myhman ulanyjy</Text>
            <Text style={styles.accountId}>
              ID: {deviceId ? deviceId.slice(0, 12) + "..." : "Ýüklenýär..."}
            </Text>
            <View style={styles.accountBalance}>
              <Ionicons name="wallet-outline" size={13} color="rgba(255,255,255,0.9)" />
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
            <Feather name="edit-3" size={15} color="#fff" />
          </Pressable>
        </LinearGradient>

        {/* ─── THEME ─── */}
        {section("GÖRÜNIŞ / TEMA")}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowThemePicker(true);
          }}
          style={({ pressed }) => [
            styles.themeCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
        >
          <LinearGradient
            colors={currentTheme.preview as [string, string]}
            style={styles.themeCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.themeCardEmoji}>{currentTheme.emoji}</Text>
          </LinearGradient>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[styles.themeCardLabel, { color: colors.foreground }]}>
              {currentTheme.label} tema
            </Text>
            <Text style={[styles.themeCardSub, { color: colors.mutedForeground }]}>
              {currentTheme.sublabel}
            </Text>
          </View>
          <View style={[styles.themeChangeBtn, { backgroundColor: colors.primary + "18" }]}>
            <Text style={[styles.themeChangeBtnText, { color: colors.primary }]}>Üýtget</Text>
          </View>
        </Pressable>

        {/* ─── LANGUAGE ─── */}
        {section("DIL / TIL")}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            icon="language-outline"
            iconColor="#0ea5e9"
            label="Dil saýlaň"
            desc={LANGUAGES.find((l) => l.code === language)?.label}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowLangPicker(!showLangPicker);
            }}
            right={
              <View style={styles.langRight}>
                <Text style={styles.langFlag}>
                  {LANGUAGES.find((l) => l.code === language)?.flag}
                </Text>
                <Ionicons
                  name={showLangPicker ? "chevron-up-outline" : "chevron-down-outline"}
                  size={16}
                  color={colors.mutedForeground}
                />
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
                    language === lang.code && { backgroundColor: colors.primary + "12" },
                  ]}
                >
                  <Text style={styles.langOptionFlag}>{lang.flag}</Text>
                  <Text style={[styles.langOptionLabel, { color: colors.foreground }]}>
                    {lang.label}
                  </Text>
                  {language === lang.code && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* ─── NOTIFICATIONS ─── */}
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
                onValueChange={(v) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setNotifications(v);
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            }
          />
        </View>

        {/* ─── APP ─── */}
        {section("PROGRAMMA")}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            icon="information-circle-outline"
            iconColor="#0284c7"
            label="Programmany barada"
            desc="Wersiýa, şertler we maglumat"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/about" as Href);
            }}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="help-circle-outline"
            iconColor="#059669"
            label="Goldaw & Kömek"
            desc="Soraglar we jogaplar"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/help" as Href);
            }}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
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
                  APP_VERSION !== LATEST_VERSION
                    ? { text: "Täzele", onPress: () => Linking.openURL("https://yenil.tm") }
                    : undefined,
                ].filter(Boolean) as any[],
              );
            }}
            right={
              <View style={[styles.versionBadge, { backgroundColor: "#10b98118" }]}>
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
              Alert.alert("Baha ber", "Siziň pikiriňiz biziň üçin gymmatly!", [
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
              Alert.alert("Paýlaş", "Baglanyşygy göçürmek isleýärsiňizmi?", [
                { text: "Ýok" },
                {
                  text: "Kopirle",
                  onPress: () => Alert.alert("Üstünlikli", "Baglanyşyk kopirlenildi!"),
                },
              ]);
            }}
          />
        </View>

        {/* ─── SUPPORT ─── */}
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
            icon="paper-plane-outline"
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

        {/* ─── ABOUT ─── */}
        {section("BIZ HAKYNDA")}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowAbout(!showAbout);
          }}
          style={[styles.aboutCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.aboutHeader}>
            <View style={[styles.rowIcon, { backgroundColor: colors.primary + "22" }]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Ýeňil hakynda</Text>
            <Ionicons
              name={showAbout ? "chevron-up-outline" : "chevron-down-outline"}
              size={16}
              color={colors.mutedForeground}
            />
          </View>
          {showAbout && (
            <View style={styles.aboutContent}>
              <LinearGradient
                colors={[colors.headerGradientStart, colors.headerGradientEnd] as [string, string]}
                style={styles.aboutLogoCircle}
              >
                <Text style={styles.aboutLogoText}>Ý</Text>
              </LinearGradient>
              <Text style={[styles.aboutTitle, { color: colors.foreground }]}>Ýeňil</Text>
              <Text style={[styles.aboutSubtitle, { color: colors.mutedForeground }]}>
                Türkmenistanda iň ynamly onlayn hyzmat platformasy
              </Text>
              <Text style={[styles.aboutDesc, { color: colors.mutedForeground }]}>
                2022-nji ýyldan bäri müşderilere demirýol bilet, walýuta çalyşmak, bonus pul we
                beýleki onlayn hyzmatlary hödürleýäris.
              </Text>
              <View style={styles.aboutStats}>
                {[
                  { num: "500+", label: "Müşderi" },
                  { num: "1200+", label: "Sargyt" },
                  { num: "98%", label: "Kanagatlanma" },
                ].map((s, i) => (
                  <View key={i} style={[styles.aboutStat, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.aboutStatNum, { color: colors.primary }]}>{s.num}</Text>
                    <Text style={[styles.aboutStatLabel, { color: colors.mutedForeground }]}>
                      {s.label}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.aboutContacts}>
                {[
                  {
                    icon: "logo-instagram" as const,
                    label: "@yenil_tm",
                    url: "https://www.instagram.com/yenil_tm",
                  },
                  {
                    icon: "paper-plane-outline" as const,
                    label: "Telegram",
                    url: "http://t.me/yenil_tm",
                  },
                ].map((c, i) => (
                  <Pressable
                    key={i}
                    onPress={() => Linking.openURL(c.url)}
                    style={[styles.aboutContact, { backgroundColor: colors.muted }]}
                  >
                    <Ionicons name={c.icon} size={16} color={colors.primary} />
                    <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "600" }}>
                      {c.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[styles.aboutVersion, { color: colors.mutedForeground }]}>
                Wersiýa {APP_VERSION} · © 2022–2026 Ýeňil
              </Text>
            </View>
          )}
        </Pressable>

        {/* Logout */}
        <Pressable
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Alert.alert("Çykmak", "Akkauntdan çykmagy isleýärsiňizmi?", [
              { text: "Ýok" },
              {
                text: "Hawa, çyk",
                style: "destructive",
                onPress: () => Alert.alert("Çykyldy", "Üstünlikli çykyldy!"),
              },
            ]);
          }}
          style={({ pressed }) => [
            styles.logoutBtn,
            { opacity: pressed ? 0.8 : 1, borderColor: colors.destructive },
          ]}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>Akkauntdan çyk</Text>
        </Pressable>
      </ScrollView>

      {/* ══════════════════════════════════════
          TEMA SAÝLAMA MODALY  (iOS sheet)
         ══════════════════════════════════════ */}
      <Modal
        visible={showThemePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowThemePicker(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Handle */}
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />

          {/* Modal header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Tema saýlaň</Text>
              <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
                Programmanyň reňk temasyny üýtgediň
              </Text>
            </View>
            <Pressable
              onPress={() => setShowThemePicker(false)}
              style={[styles.modalCloseBtn, { backgroundColor: colors.muted }]}
            >
              <Ionicons name="close" size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {/* Theme cards */}
          <ScrollView
            contentContainerStyle={styles.themeGrid}
            showsVerticalScrollIndicator={false}
          >
            {THEMES.map((theme) => {
              const isActive = themeKey === theme.key;
              return (
                <Pressable
                  key={theme.key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setTheme(theme.key);
                    setTimeout(() => setShowThemePicker(false), 280);
                  }}
                  style={({ pressed }) => [
                    styles.themeOption,
                    {
                      backgroundColor: colors.card,
                      borderColor: isActive ? theme.accent : colors.border,
                      borderWidth: isActive ? 2.5 : 1,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  {/* Gradient preview area */}
                  <LinearGradient
                    colors={theme.preview as [string, string]}
                    style={styles.themePreviewGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {/* Emoji top-right */}
                    <Text style={styles.themePreviewEmoji}>{theme.emoji}</Text>

                    {/* Mock phone UI skeleton */}
                    <View style={styles.mockUi}>
                      <View
                        style={[
                          styles.mockBar,
                          { backgroundColor: "rgba(255,255,255,0.4)", width: "68%" },
                        ]}
                      />
                      <View
                        style={[
                          styles.mockBar,
                          {
                            backgroundColor: "rgba(255,255,255,0.22)",
                            width: "44%",
                            marginTop: 6,
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.mockCardRow,
                          { backgroundColor: "rgba(255,255,255,0.15)" },
                        ]}
                      >
                        <View style={[styles.mockDot, { backgroundColor: theme.dot }]} />
                        <View
                          style={[
                            styles.mockBar,
                            { backgroundColor: "rgba(255,255,255,0.28)", flex: 1 },
                          ]}
                        />
                      </View>
                      <View
                        style={[
                          styles.mockCardRow,
                          { backgroundColor: "rgba(255,255,255,0.10)" },
                        ]}
                      >
                        <View
                          style={[
                            styles.mockDot,
                            { backgroundColor: "rgba(255,255,255,0.4)" },
                          ]}
                        />
                        <View
                          style={[
                            styles.mockBar,
                            { backgroundColor: "rgba(255,255,255,0.18)", flex: 1 },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Active checkmark */}
                    {isActive && (
                      <View style={styles.activeCheckBadge}>
                        <Ionicons name="checkmark-circle" size={28} color="#fff" />
                      </View>
                    )}
                  </LinearGradient>

                  {/* Info row */}
                  <View style={styles.themeInfoRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.themeLabel, { color: colors.foreground }]}>
                        {theme.label}
                      </Text>
                      <Text style={[styles.themeSublabel, { color: colors.mutedForeground }]}>
                        {theme.sublabel}
                      </Text>
                    </View>
                    {isActive ? (
                      <View style={[styles.activePill, { backgroundColor: theme.accent }]}>
                        <Text style={styles.activePillText}>Işjeň</Text>
                      </View>
                    ) : (
                      <View style={[styles.selectPill, { borderColor: colors.border }]}>
                        <Text style={[styles.selectPillText, { color: colors.mutedForeground }]}>
                          Saýla
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={{ height: insets.bottom + 16 }} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  headerSub: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 3 },

  accountCard: {
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 4,
  },
  accountAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  accountName: { color: "#fff", fontSize: 16, fontWeight: "800", marginBottom: 2 },
  accountId: { color: "rgba(255,255,255,0.65)", fontSize: 11, marginBottom: 6 },
  accountBalance: { flexDirection: "row", alignItems: "center", gap: 5 },
  accountBalanceText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  groupTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 22,
    marginLeft: 4,
  },

  themeCard: {
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  themeCardGradient: {
    width: 56,
    height: 56,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  themeCardEmoji: { fontSize: 28 },
  themeCardLabel: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  themeCardSub: { fontSize: 12 },
  themeChangeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 12,
  },
  themeChangeBtnText: { fontSize: 13, fontWeight: "700" },

  card: { borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14 },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { fontSize: 14, fontWeight: "600", marginBottom: 1 },
  rowDesc: { fontSize: 12 },
  rowValue: { fontSize: 13, fontWeight: "700" },
  divider: { height: 0.8, marginLeft: 68 },

  langRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  langFlag: { fontSize: 20 },
  langPicker: { borderTopWidth: 0.8 },
  langOption: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  langOptionFlag: { fontSize: 22 },
  langOptionLabel: { flex: 1, fontSize: 14, fontWeight: "600" },

  versionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  versionBadgeText: { fontSize: 12, fontWeight: "700" },

  aboutCard: { borderRadius: 18, borderWidth: 1, overflow: "hidden", marginBottom: 4 },
  aboutHeader: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14 },
  aboutContent: { padding: 16, paddingTop: 0, alignItems: "center" },
  aboutLogoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  aboutLogoText: { color: "#fff", fontSize: 32, fontWeight: "800" },
  aboutTitle: { fontSize: 22, fontWeight: "800", marginBottom: 4 },
  aboutSubtitle: { fontSize: 13, textAlign: "center", marginBottom: 12, lineHeight: 18 },
  aboutDesc: { fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 16 },
  aboutStats: { flexDirection: "row", gap: 10, marginBottom: 16 },
  aboutStat: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12 },
  aboutStatNum: { fontSize: 18, fontWeight: "800" },
  aboutStatLabel: { fontSize: 10, marginTop: 2 },
  aboutContacts: { flexDirection: "row", gap: 10, marginBottom: 16 },
  aboutContact: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  aboutVersion: { fontSize: 11 },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 22,
    borderWidth: 2,
  },
  logoutText: { fontWeight: "700", fontSize: 15 },

  /* ── Modal ── */
  modalContainer: { flex: 1, paddingTop: 12 },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.4 },
  modalSub: { fontSize: 13, marginTop: 3 },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  themeGrid: { paddingHorizontal: 16, gap: 14, paddingBottom: 20 },
  themeOption: { borderRadius: 22, overflow: "hidden" },

  themePreviewGradient: {
    height: 156,
    padding: 16,
    justifyContent: "flex-end",
  },
  themePreviewEmoji: {
    fontSize: 34,
    position: "absolute",
    top: 14,
    right: 16,
  },
  mockUi: { gap: 0 },
  mockBar: { height: 8, borderRadius: 4 },
  mockCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    padding: 8,
    borderRadius: 10,
  },
  mockDot: { width: 10, height: 10, borderRadius: 5 },
  activeCheckBadge: { position: "absolute", top: 12, left: 14 },

  themeInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  themeLabel: { fontSize: 16, fontWeight: "800", marginBottom: 2 },
  themeSublabel: { fontSize: 12 },
  activePill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  activePillText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  selectPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  selectPillText: { fontSize: 12, fontWeight: "600" },
});
