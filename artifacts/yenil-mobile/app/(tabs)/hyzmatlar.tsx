import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";

export default function HyzmatlarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={[s.header, { paddingTop: (isWeb ? 0 : insets.top) + 14 }]}
      >
        <Text style={s.headerTitle}>Hyzmatlar</Text>
        <Text style={s.headerSub}>Ähli hyzmatlar bir ýerde</Text>
      </LinearGradient>

      <View
        style={[
          s.placeholderWrap,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        <View
          style={[
            s.iconWrap,
            { backgroundColor: colors.primary + "12" },
          ]}
        >
          <Ionicons name="construct-outline" size={44} color={colors.primary} />
        </View>
        <Text style={[s.title, { color: colors.foreground }]}>
          Tiz orada hyzmatlar goşulýar
        </Text>
        <Text style={[s.desc, { color: colors.mutedForeground }]}>
          Ulag, kuryer, usta, bazar we başga{"\n"}
          köp hyzmatlar bu bölümde ýerleşer.
        </Text>

        <View
          style={[
            s.infoRow,
            {
              backgroundColor: colors.primary + "10",
              borderColor: colors.primary + "30",
            },
          ]}
        >
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={colors.primary}
          />
          <Text style={[s.infoText, { color: colors.primary }]}>
            Häzirki wagtda işlenilýär
          </Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  headerSub: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    marginTop: 3,
  },
  placeholderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
  },
  desc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  infoText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
