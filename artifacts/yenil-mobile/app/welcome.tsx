import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: W } = Dimensions.get("window");

const FEATURES = [
  {
    icon: "train-outline" as const,
    title: "Demirýol biletleri",
    desc: "Nobatsyz, kartsyz, stressiz — sekuntlar içinde",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.14)",
  },
  {
    icon: "swap-horizontal-outline" as const,
    title: "Pul çalyşmak",
    desc: "Payeer, WebMoney — howpsuz we çalt",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.14)",
  },
  {
    icon: "diamond-outline" as const,
    title: "Bonus Pul — BP",
    desc: "Her amalyňda gazanarsyň. Hiç zat ýitmez!",
    color: "#f472b6",
    bg: "rgba(244,114,182,0.14)",
  },
];

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  const logoScale   = useSharedValue(0.25);
  const logoOpacity = useSharedValue(0);
  const logoPulse   = useSharedValue(1);
  const ringScale   = useSharedValue(0.6);
  const ringOpacity = useSharedValue(0);

  const orb1Y = useSharedValue(0);
  const orb2Y = useSharedValue(0);
  const orb3Y = useSharedValue(0);
  const orb1O = useSharedValue(0);
  const orb2O = useSharedValue(0);
  const orb3O = useSharedValue(0);

  const titleOpacity = useSharedValue(0);
  const titleY       = useSharedValue(28);
  const subOpacity   = useSharedValue(0);
  const subY         = useSharedValue(18);

  const f1X = useSharedValue(60); const f1O = useSharedValue(0);
  const f2X = useSharedValue(60); const f2O = useSharedValue(0);
  const f3X = useSharedValue(60); const f3O = useSharedValue(0);

  const btnScale   = useSharedValue(0.82);
  const btnOpacity = useSharedValue(0);
  const loginScale = useSharedValue(0.88);
  const loginO     = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withDelay(150, withTiming(1, { duration: 450 }));
    logoScale.value   = withDelay(150, withSpring(1, { damping: 9, stiffness: 90 }));

    logoPulse.value = withDelay(900, withRepeat(
      withSequence(
        withTiming(1.07, { duration: 1900, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.00, { duration: 1900, easing: Easing.inOut(Easing.sin) })
      ),
      -1, false
    ));

    ringOpacity.value = withDelay(400, withTiming(0.45, { duration: 600 }));
    ringScale.value   = withDelay(400, withSpring(1.0, { damping: 8 }));

    orb1O.value = withDelay(100, withTiming(1, { duration: 800 }));
    orb2O.value = withDelay(300, withTiming(1, { duration: 800 }));
    orb3O.value = withDelay(200, withTiming(1, { duration: 800 }));

    orb1Y.value = withRepeat(withSequence(
      withTiming(-20, { duration: 3400, easing: Easing.inOut(Easing.sin) }),
      withTiming(0,   { duration: 3400, easing: Easing.inOut(Easing.sin) })
    ), -1, false);
    orb2Y.value = withDelay(1100, withRepeat(withSequence(
      withTiming(-15, { duration: 2900, easing: Easing.inOut(Easing.sin) }),
      withTiming(0,   { duration: 2900, easing: Easing.inOut(Easing.sin) })
    ), -1, false));
    orb3Y.value = withDelay(500, withRepeat(withSequence(
      withTiming(-22, { duration: 3800, easing: Easing.inOut(Easing.sin) }),
      withTiming(0,   { duration: 3800, easing: Easing.inOut(Easing.sin) })
    ), -1, false));

    titleOpacity.value = withDelay(520, withTiming(1, { duration: 500 }));
    titleY.value       = withDelay(520, withSpring(0, { damping: 13 }));
    subOpacity.value   = withDelay(720, withTiming(1, { duration: 500 }));
    subY.value         = withDelay(720, withSpring(0, { damping: 13 }));

    f1X.value = withDelay(950,  withSpring(0, { damping: 13 }));
    f1O.value = withDelay(950,  withTiming(1, { duration: 320 }));
    f2X.value = withDelay(1110, withSpring(0, { damping: 13 }));
    f2O.value = withDelay(1110, withTiming(1, { duration: 320 }));
    f3X.value = withDelay(1270, withSpring(0, { damping: 13 }));
    f3O.value = withDelay(1270, withTiming(1, { duration: 320 }));

    btnScale.value   = withDelay(1450, withSpring(1, { damping: 9 }));
    btnOpacity.value = withDelay(1450, withTiming(1, { duration: 380 }));
    loginScale.value = withDelay(1650, withSpring(1, { damping: 9 }));
    loginO.value     = withDelay(1650, withTiming(1, { duration: 380 }));
  }, []);

  const logoAnim  = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value * logoPulse.value }],
  }));
  const ringAnim  = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));
  const orb1Anim  = useAnimatedStyle(() => ({ opacity: orb1O.value, transform: [{ translateY: orb1Y.value }] }));
  const orb2Anim  = useAnimatedStyle(() => ({ opacity: orb2O.value, transform: [{ translateY: orb2Y.value }] }));
  const orb3Anim  = useAnimatedStyle(() => ({ opacity: orb3O.value, transform: [{ translateY: orb3Y.value }] }));
  const titleAnim = useAnimatedStyle(() => ({ opacity: titleOpacity.value, transform: [{ translateY: titleY.value }] }));
  const subAnim   = useAnimatedStyle(() => ({ opacity: subOpacity.value,   transform: [{ translateY: subY.value }] }));
  const feat1Anim = useAnimatedStyle(() => ({ opacity: f1O.value, transform: [{ translateX: f1X.value }] }));
  const feat2Anim = useAnimatedStyle(() => ({ opacity: f2O.value, transform: [{ translateX: f2X.value }] }));
  const feat3Anim = useAnimatedStyle(() => ({ opacity: f3O.value, transform: [{ translateX: f3X.value }] }));
  const btnAnim   = useAnimatedStyle(() => ({ opacity: btnOpacity.value, transform: [{ scale: btnScale.value }] }));
  const loginAnim = useAnimatedStyle(() => ({ opacity: loginO.value,     transform: [{ scale: loginScale.value }] }));

  const featAnims = [feat1Anim, feat2Anim, feat3Anim];

  async function handleStart() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await AsyncStorage.setItem("onboarding_seen", "1");
    router.replace("/auth/register");
  }

  async function handleLogin() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/auth/login");
  }

  const isWeb = Platform.OS === "web";

  return (
    <LinearGradient
      colors={["#06291a", "#0b4228", "#10593a", "#1a7a4e"]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.6, y: 1 }}
      style={[s.root, {
        paddingTop:    (isWeb ? 0 : insets.top) + 20,
        paddingBottom: (isWeb ? 0 : insets.bottom) + 24,
      }]}
    >
      {/* Floating orbs */}
      <Animated.View style={[s.orb1, orb1Anim]} />
      <Animated.View style={[s.orb2, orb2Anim]} />
      <Animated.View style={[s.orb3, orb3Anim]} />

      {/* Logo section */}
      <View style={s.top}>
        <View style={s.logoContainer}>
          <Animated.View style={[s.logoRing, ringAnim]} />
          <Animated.View style={[s.logoRing2, ringAnim]} />
          <Animated.View style={logoAnim}>
            <LinearGradient
              colors={["rgba(255,255,255,0.22)", "rgba(255,255,255,0.08)"]}
              style={s.logoBox}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={s.logoLetter}>Ý</Text>
            </LinearGradient>
          </Animated.View>
        </View>

        <Animated.Text style={[s.appName, titleAnim]}>ÝEŇIL</Animated.Text>
        <Animated.Text style={[s.tagline, subAnim]}>
          Her kesiň eline sygýan{"\n"}güýçli mümkinçilikler
        </Animated.Text>
      </View>

      {/* Feature cards */}
      <View style={s.features}>
        {FEATURES.map((f, i) => (
          <Animated.View key={f.title} style={[s.featRow, featAnims[i]]}>
            <View style={[s.featIconBox, { backgroundColor: f.bg }]}>
              <Ionicons name={f.icon} size={20} color={f.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.featTitle}>{f.title}</Text>
              <Text style={s.featDesc}>{f.desc}</Text>
            </View>
            <View style={[s.checkDot, { backgroundColor: f.bg }]}>
              <Ionicons name="checkmark" size={12} color={f.color} />
            </View>
          </Animated.View>
        ))}
      </View>

      {/* Buttons */}
      <View style={s.bottom}>
        {/* Start button */}
        <Animated.View style={[{ width: "100%" }, btnAnim]}>
          <Pressable
            onPress={handleStart}
            style={({ pressed }) => [s.startBtn, pressed && { opacity: 0.88 }]}
          >
            <LinearGradient
              colors={["#ffffff", "#ddf0e8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.startBtnInner}
            >
              <Ionicons name="rocket-outline" size={19} color="#0b4228" />
              <Text style={s.startBtnText}>Häzir başla — mugt!</Text>
              <Ionicons name="arrow-forward" size={17} color="#0b4228" />
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Login button — proper card style */}
        <Animated.View style={[{ width: "100%" }, loginAnim]}>
          <Pressable
            onPress={handleLogin}
            style={({ pressed }) => [s.loginBtn, pressed && { opacity: 0.82 }]}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.12)", "rgba(255,255,255,0.06)"]}
              style={s.loginBtnInner}
            >
              <View style={s.loginIconWrap}>
                <Ionicons name="person-circle-outline" size={20} color="rgba(255,255,255,0.9)" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.loginBtnTitle}>Hasabym bar — girýän</Text>
                <Text style={s.loginBtnSub}>Telefon, Gmail ýa-da Mail.ru bilen</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.5)" />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },

  orb1: {
    position: "absolute", width: 320, height: 320, borderRadius: 160,
    backgroundColor: "rgba(52,211,153,0.08)", top: -80, right: -90,
  },
  orb2: {
    position: "absolute", width: 240, height: 240, borderRadius: 120,
    backgroundColor: "rgba(96,165,250,0.06)", bottom: 160, left: -70,
  },
  orb3: {
    position: "absolute", width: 170, height: 170, borderRadius: 85,
    backgroundColor: "rgba(167,139,250,0.06)", bottom: 340, right: 10,
  },

  top: { alignItems: "center", paddingTop: 10 },

  logoContainer: {
    width: 110, height: 110,
    alignItems: "center", justifyContent: "center", marginBottom: 20,
  },
  logoRing: {
    position: "absolute", width: 108, height: 108, borderRadius: 30,
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.14)",
  },
  logoRing2: {
    position: "absolute", width: 126, height: 126, borderRadius: 34,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
  },
  logoBox: {
    width: 92, height: 92, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.18)",
    shadowColor: "#4ade80", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 20, elevation: 12,
  },
  logoLetter: { fontSize: 50, fontWeight: "900", color: "#ffffff", letterSpacing: -1 },

  appName: {
    fontSize: 32, fontWeight: "900", color: "#ffffff", letterSpacing: 10, marginBottom: 8,
  },
  tagline: {
    fontSize: 14, color: "rgba(255,255,255,0.62)", textAlign: "center", lineHeight: 21,
  },

  features: { width: "100%", paddingHorizontal: 18, gap: 8 },
  featRow: {
    flexDirection: "row", alignItems: "center", gap: 13,
    backgroundColor: "rgba(255,255,255,0.065)",
    borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.09)",
  },
  featIconBox: { width: 40, height: 40, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  featTitle: { color: "#ffffff", fontWeight: "700", fontSize: 13, marginBottom: 2 },
  featDesc:  { color: "rgba(255,255,255,0.55)", fontSize: 11 },
  checkDot:  { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },

  bottom: { width: "100%", paddingHorizontal: 18, alignItems: "center", gap: 10 },

  startBtn: {
    width: "100%", borderRadius: 18, overflow: "hidden",
    shadowColor: "#ffffff", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 14, elevation: 8,
  },
  startBtnInner: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16, borderRadius: 18,
  },
  startBtnText: { fontSize: 16, fontWeight: "800", color: "#0b4228", letterSpacing: 0.3 },

  // Login button — premium card style
  loginBtn: {
    width: "100%", borderRadius: 16, overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 3,
  },
  loginBtnInner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 13, paddingHorizontal: 16, borderRadius: 16,
  },
  loginIconWrap: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  loginBtnTitle: { color: "rgba(255,255,255,0.92)", fontSize: 14, fontWeight: "700" },
  loginBtnSub:   { color: "rgba(255,255,255,0.48)", fontSize: 11, marginTop: 1 },
});
