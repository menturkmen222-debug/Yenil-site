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
  const btnGlow    = useSharedValue(1);

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

    btnGlow.value = withDelay(1800, withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.00, { duration: 1600, easing: Easing.inOut(Easing.sin) })
      ),
      -1, false
    ));
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
  const btnAnim   = useAnimatedStyle(() => ({ opacity: btnOpacity.value, transform: [{ scale: btnScale.value * btnGlow.value }] }));
  const loginAnim = useAnimatedStyle(() => ({ opacity: loginO.value, transform: [{ scale: loginScale.value }] }));

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
        paddingBottom: (isWeb ? 0 : insets.bottom) + 20,
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

      {/* ── Buttons ── */}
      <View style={s.bottom}>

        {/* Primary CTA — premium emerald gradient */}
        <Animated.View style={[{ width: "100%" }, btnAnim]}>
          <Pressable onPress={handleStart} style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
            <LinearGradient
              colors={["#10b981", "#059669", "#047857"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.startBtn}
            >
              {/* Inner top sheen */}
              <View style={s.startBtnSheen} />
              {/* Icon circle */}
              <View style={s.startBtnIconWrap}>
                <Ionicons name="rocket" size={21} color="#fff" />
              </View>
              {/* Text block */}
              <View style={{ flex: 1, marginLeft: 4 }}>
                <Text style={s.startBtnText}>Häzir başla — mugt!</Text>
                <Text style={s.startBtnSub}>30 sekuntda · Kart gerek däl</Text>
              </View>
              {/* Arrow badge */}
              <View style={s.startBtnArrow}>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Divider */}
        <View style={s.orDivider}>
          <View style={s.orLine} />
          <Text style={s.orText}>ýa-da</Text>
          <View style={s.orLine} />
        </View>

        {/* Login — ghost pill */}
        <Animated.View style={[{ width: "100%" }, loginAnim]}>
          <Pressable onPress={handleLogin} style={({ pressed }) => [s.loginBtn, pressed && { opacity: 0.72 }]}>
            <View style={s.loginIconWrap}>
              <Ionicons name="log-in-outline" size={18} color="rgba(255,255,255,0.88)" />
            </View>
            <Text style={s.loginBtnText}>Hasabym bar — girýän</Text>
            <Ionicons name="chevron-forward" size={15} color="rgba(255,255,255,0.38)" />
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

  bottom: { width: "100%", paddingHorizontal: 18, alignItems: "center", gap: 0 },

  // ── Premium CTA button ──────────────────────────────────────────
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.60,
    shadowRadius: 22,
    elevation: 16,
  },
  startBtnSheen: {
    position: "absolute", top: 0, left: 0, right: 0,
    height: "42%",
    backgroundColor: "rgba(255,255,255,0.17)",
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  startBtnIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center", justifyContent: "center",
  },
  startBtnText: {
    fontSize: 16, fontWeight: "900", color: "#fff", letterSpacing: 0.2,
  },
  startBtnSub: {
    fontSize: 11, color: "rgba(255,255,255,0.72)", marginTop: 2,
  },
  startBtnArrow: {
    width: 34, height: 34, borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },

  // ── Divider ─────────────────────────────────────────────────────
  orDivider: {
    flexDirection: "row", alignItems: "center",
    width: "100%", gap: 10,
    marginVertical: 12,
  },
  orLine: {
    flex: 1, height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  orText: {
    fontSize: 11, fontWeight: "600",
    color: "rgba(255,255,255,0.38)",
    letterSpacing: 0.5,
  },

  // ── Ghost login button ──────────────────────────────────────────
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
    backgroundColor: "rgba(255,255,255,0.07)",
    width: "100%",
  },
  loginIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  loginBtnText: {
    flex: 1,
    color: "rgba(255,255,255,0.88)",
    fontSize: 14, fontWeight: "700",
  },
});
