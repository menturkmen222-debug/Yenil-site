import React, { useState, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, TextInput, Pressable,
  Platform, KeyboardAvoidingView, ScrollView,
} from "react-native";
import { router } from "expo-router";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle, withSpring, withSequence,
  type SharedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useColors } from "@/hooks/useColors";
import { PessimisticButton } from "@/components/PessimisticButton";

type Method = "phone" | "google" | "mailru";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const [method, setMethod] = useState<Method>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [email, setEmail] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const otpRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);

  // Button animations
  const phoneScale  = useSharedValue(1);
  const googleScale = useSharedValue(1);
  const mailruScale = useSharedValue(1);

  const phoneAnimStyle  = useAnimatedStyle(() => ({ transform: [{ scale: phoneScale.value }] }));
  const googleAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: googleScale.value }] }));
  const mailruAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: mailruScale.value }] }));

  function pressAnim(sv: SharedValue<number>) {
    sv.value = withSequence(
      withSpring(0.95, { damping: 14, stiffness: 300 }),
      withSpring(1.0,  { damping: 12, stiffness: 260 }),
    );
  }

  const selectMethod = useCallback((m: Method) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMethod(m);
    setPhone(""); setOtp(""); setOtpSent(false); setEmail("");
    if (m !== "phone") setTimeout(() => emailRef.current?.focus(), 200);
  }, []);

  const handleSendOtp = useCallback(async () => {
    if (phone.replace(/\s/g, "").length < 8) return;
    setSendingOtp(true);
    await new Promise((r) => setTimeout(r, 900));
    setSendingOtp(false);
    setOtpSent(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => otpRef.current?.focus(), 200);
  }, [phone]);

  const handleLogin = useCallback(async () => {
    setLoggingIn(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await AsyncStorage.setItem("onboarding_seen", "1");
    await AsyncStorage.setItem("@yenil_show_confetti", "1");
    router.replace("/(tabs)");
    setLoggingIn(false);
  }, []);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const inputStyle = [
    s.input,
    { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground },
  ];

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={[s.header, { paddingTop: (isWeb ? 0 : insets.top) + 14 }]}
      >
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.headerTitle}>Hasabyma Girmek</Text>
          <Text style={s.headerSub}>Öň nähili ulgama girdiňiz?</Text>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}
      >
        {/* Icon + title */}
        <View style={s.hero}>
          <LinearGradient
            colors={[colors.primary + "22", colors.primary + "08"]}
            style={s.heroIcon}
          >
            <Ionicons name="person-circle-outline" size={34} color={colors.primary} />
          </LinearGradient>
          <Text style={[s.heroTitle, { color: colors.foreground }]}>Hoş geldiňiz!</Text>
          <Text style={[s.heroSub, { color: colors.mutedForeground }]}>
            Ulgama girmek üçin hasabyňyzdaky usuly saýlaň
          </Text>
        </View>

        {/* ── Phone ── */}
        <Pressable onPress={() => { pressAnim(phoneScale); selectMethod("phone"); }}>
          <Animated.View style={phoneAnimStyle}>
            <LinearGradient
              colors={method === "phone" ? [colors.primary, colors.primary + "dd"] : [colors.card, colors.card]}
              style={[s.methodBtn, {
                borderColor: method === "phone" ? colors.primary : colors.border,
                borderWidth: method === "phone" ? 2 : 1.5,
                shadowColor: method === "phone" ? colors.primary : "#000",
                shadowOpacity: method === "phone" ? 0.35 : 0.06,
                shadowRadius: method === "phone" ? 14 : 4,
                shadowOffset: { width: 0, height: method === "phone" ? 5 : 2 },
                elevation: method === "phone" ? 10 : 2,
              }]}
            >
              <View style={[s.methodIcon, { backgroundColor: method === "phone" ? "rgba(255,255,255,0.22)" : colors.primary + "20" }]}>
                <Ionicons name="phone-portrait-outline" size={20} color={method === "phone" ? "#fff" : colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.methodTitle, { color: method === "phone" ? "#fff" : colors.foreground }]}>Telefon belgisi</Text>
                <Text style={[s.methodSub, { color: method === "phone" ? "rgba(255,255,255,0.75)" : colors.mutedForeground }]}>+993 TM nomer bilen</Text>
              </View>
              {method === "phone"
                ? <View style={[s.checkCircle, { backgroundColor: "rgba(255,255,255,0.3)" }]}><Ionicons name="checkmark" size={15} color="#fff" /></View>
                : <View style={[s.emptyCircle, { borderColor: colors.border }]} />}
            </LinearGradient>
          </Animated.View>
        </Pressable>

        {/* Phone fields */}
        {method === "phone" && (
          <Animated.View entering={FadeInDown.duration(260)}>
            <View style={[s.phoneRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <View style={[s.phonePrefix, { borderRightColor: colors.border }]}>
                <Text style={[s.phonePrefixText, { color: colors.mutedForeground }]}>+993</Text>
              </View>
              <TextInput
                style={[s.phoneInput, { color: colors.foreground }]}
                value={phone}
                onChangeText={(t) => setPhone(t.replace(/[^0-9\s]/g, "").slice(0, 10))}
                placeholder="6X XXX XX XX"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
                maxLength={10}
                editable={!otpSent}
                returnKeyType="done"
                onSubmitEditing={handleSendOtp}
              />
            </View>
            {!otpSent ? (
              <PessimisticButton
                label={sendingOtp ? "Iberilýär..." : "SMS Kody Iber"}
                loading={sendingOtp}
                disabled={phone.replace(/\s/g, "").length < 8}
                onPress={handleSendOtp}
                icon="send-outline"
              />
            ) : (
              <Animated.View entering={FadeInDown.duration(260)}>
                <View style={[s.otpInfo, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
                  <Ionicons name="checkmark-circle" size={15} color={colors.primary} />
                  <Text style={[s.otpInfoText, { color: colors.primary }]}>+993 {phone} — SMS iberildi</Text>
                </View>
                <TextInput
                  ref={otpRef}
                  style={[...inputStyle, s.otpInput]}
                  value={otp}
                  onChangeText={(t) => setOtp(t.replace(/\D/g, "").slice(0, 6))}
                  placeholder="XXXXXX"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="number-pad"
                  maxLength={6}
                  returnKeyType="done"
                  onSubmitEditing={otp.length >= 4 ? handleLogin : undefined}
                />
                <PessimisticButton
                  label={loggingIn ? "Girilýär..." : "Girmek"}
                  loading={loggingIn}
                  disabled={otp.length < 4}
                  onPress={handleLogin}
                  icon="log-in-outline"
                />
                <Pressable onPress={() => { setOtpSent(false); setOtp(""); }} style={s.retryBtn}>
                  <Text style={[s.retryText, { color: colors.mutedForeground }]}>Belgimi üýtget</Text>
                </Pressable>
              </Animated.View>
            )}
          </Animated.View>
        )}

        {/* Divider */}
        <View style={s.divider}>
          <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[s.dividerText, { color: colors.mutedForeground }]}>ýa-da</Text>
          <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* ── Google ── */}
        <Pressable onPress={() => { pressAnim(googleScale); selectMethod("google"); }}>
          <Animated.View style={googleAnimStyle}>
            <LinearGradient
              colors={method === "google" ? ["#EA4335", "#c0392b"] : [colors.card, colors.card]}
              style={[s.methodBtn, {
                borderColor: method === "google" ? "#EA4335" : colors.border,
                borderWidth: method === "google" ? 2 : 1.5,
                shadowColor: method === "google" ? "#EA4335" : "#000",
                shadowOpacity: method === "google" ? 0.35 : 0.06,
                shadowRadius: method === "google" ? 14 : 4,
                shadowOffset: { width: 0, height: method === "google" ? 5 : 2 },
                elevation: method === "google" ? 10 : 2,
              }]}
            >
              <View style={[s.methodIcon, { backgroundColor: method === "google" ? "rgba(255,255,255,0.22)" : "#EA4335" + "20" }]}>
                <AntDesign name="google" size={20} color={method === "google" ? "#fff" : "#EA4335"} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.methodTitle, { color: method === "google" ? "#fff" : colors.foreground }]}>Google hesaby</Text>
                <Text style={[s.methodSub, { color: method === "google" ? "rgba(255,255,255,0.75)" : colors.mutedForeground }]}>Gmail salgyňyz bilen</Text>
              </View>
              {method === "google"
                ? <View style={[s.checkCircle, { backgroundColor: "rgba(255,255,255,0.3)" }]}><Ionicons name="checkmark" size={15} color="#fff" /></View>
                : <View style={[s.emptyCircle, { borderColor: colors.border }]} />}
            </LinearGradient>
          </Animated.View>
        </Pressable>

        {/* ── Mail.ru ── */}
        <Pressable onPress={() => { pressAnim(mailruScale); selectMethod("mailru"); }}>
          <Animated.View style={mailruAnimStyle}>
            <LinearGradient
              colors={method === "mailru" ? ["#005FF9", "#0047cc"] : [colors.card, colors.card]}
              style={[s.methodBtn, {
                borderColor: method === "mailru" ? "#005FF9" : colors.border,
                borderWidth: method === "mailru" ? 2 : 1.5,
                shadowColor: method === "mailru" ? "#005FF9" : "#000",
                shadowOpacity: method === "mailru" ? 0.35 : 0.06,
                shadowRadius: method === "mailru" ? 14 : 4,
                shadowOffset: { width: 0, height: method === "mailru" ? 5 : 2 },
                elevation: method === "mailru" ? 10 : 2,
              }]}
            >
              <View style={[s.methodIcon, { backgroundColor: method === "mailru" ? "rgba(255,255,255,0.22)" : "#005FF9" + "20" }]}>
                <Ionicons name="mail" size={20} color={method === "mailru" ? "#fff" : "#005FF9"} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.methodTitle, { color: method === "mailru" ? "#fff" : colors.foreground }]}>Mail.ru hesaby</Text>
                <Text style={[s.methodSub, { color: method === "mailru" ? "rgba(255,255,255,0.75)" : colors.mutedForeground }]}>Mail.ru ýa-da @mail.ru</Text>
              </View>
              {method === "mailru"
                ? <View style={[s.checkCircle, { backgroundColor: "rgba(255,255,255,0.3)" }]}><Ionicons name="checkmark" size={15} color="#fff" /></View>
                : <View style={[s.emptyCircle, { borderColor: colors.border }]} />}
            </LinearGradient>
          </Animated.View>
        </Pressable>

        {/* Email input */}
        {(method === "google" || method === "mailru") && (
          <Animated.View entering={FadeInDown.duration(260)} style={{ marginTop: 6 }}>
            <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>
              {method === "google" ? "Gmail salgyňyz" : "Mail.ru salgyňyz"}
            </Text>
            <TextInput
              ref={emailRef}
              style={[...inputStyle, { borderColor: emailValid ? colors.primary : colors.border }]}
              value={email}
              onChangeText={setEmail}
              placeholder={method === "google" ? "mysal@gmail.com" : "mysal@mail.ru"}
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={emailValid ? handleLogin : undefined}
            />
            <PessimisticButton
              label={loggingIn ? "Girilýär..." : "Girmek"}
              loading={loggingIn}
              disabled={!emailValid}
              onPress={handleLogin}
              icon="log-in-outline"
            />
          </Animated.View>
        )}

        {/* Register link */}
        <Pressable onPress={() => router.replace("/auth/register")} style={s.registerLink}>
          <Ionicons name="person-add-outline" size={15} color={colors.mutedForeground} />
          <Text style={[s.registerLinkText, { color: colors.mutedForeground }]}>
            Hasabym ýok — hasap açmak
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 19, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.72)", fontSize: 11, marginTop: 1 },

  content: { padding: 18 },

  hero: { alignItems: "center", paddingVertical: 20, marginBottom: 16 },
  heroIcon: {
    width: 68, height: 68, borderRadius: 22,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  heroTitle: { fontSize: 22, fontWeight: "800", marginBottom: 5 },
  heroSub: { fontSize: 13, textAlign: "center", lineHeight: 19 },

  methodBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 16, borderWidth: 1.5, padding: 14, marginBottom: 10,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  methodIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  methodTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  methodSub:   { fontSize: 12 },
  checkCircle: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
  },
  emptyCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5 },

  phoneRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 12, borderWidth: 1.5, marginBottom: 12, overflow: "hidden",
  },
  phonePrefix: {
    paddingHorizontal: 14, paddingVertical: Platform.OS === "ios" ? 14 : 12,
    borderRightWidth: 1.5,
  },
  phonePrefixText: { fontSize: 15, fontWeight: "600" },
  phoneInput: {
    flex: 1, paddingHorizontal: 14, paddingVertical: Platform.OS === "ios" ? 14 : 12,
    fontSize: 16, letterSpacing: 1,
  },

  otpInfo: {
    flexDirection: "row", alignItems: "center", gap: 7,
    borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 12,
  },
  otpInfoText: { fontSize: 12, fontWeight: "600", flex: 1 },
  otpInput: { letterSpacing: 6, fontSize: 20, fontWeight: "700", textAlign: "center" },

  input: {
    borderRadius: 12, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: Platform.OS === "ios" ? 14 : 12,
    fontSize: 15, marginBottom: 12,
  },

  fieldLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 0.3, marginBottom: 7, textTransform: "uppercase" },

  divider: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 10 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { fontSize: 12, fontWeight: "600" },

  retryBtn: { alignItems: "center", paddingVertical: 10 },
  retryText: { fontSize: 13 },

  registerLink: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, marginTop: 20, paddingVertical: 10,
  },
  registerLinkText: { fontSize: 13, fontWeight: "500" },
});
