import React from "react";
import { Pressable, ActivityIndicator, Text, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface PessimisticButtonProps {
  onPress: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  label: string;
  loadingLabel?: string;
  icon?: React.ReactNode;
  color?: string;
  textColor?: string;
  style?: object;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export function PessimisticButton({
  onPress,
  loading = false,
  disabled = false,
  label,
  loadingLabel,
  icon,
  color,
  textColor = "#fff",
  style,
  size = "md",
  fullWidth = true,
}: PessimisticButtonProps) {
  const colors = useColors();
  const bg = color ?? colors.primary;
  const isDisabled = disabled || loading;

  const heights = { sm: 40, md: 52, lg: 58 };
  const fontSizes = { sm: 13, md: 15, lg: 16 };
  const radii = { sm: 12, md: 14, lg: 16 };

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        btn.base,
        {
          backgroundColor: isDisabled ? bg + "70" : bg,
          height: heights[size],
          borderRadius: radii[size],
          alignSelf: fullWidth ? "stretch" : "auto",
          opacity: pressed && !isDisabled ? 0.88 : 1,
          shadowColor: isDisabled ? "transparent" : bg,
          shadowOpacity: isDisabled ? 0 : 0.3,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: isDisabled ? 0 : 4,
        },
        style,
      ]}
    >
      {loading ? (
        <View style={btn.row}>
          <ActivityIndicator size="small" color={textColor} />
          {loadingLabel ? (
            <Text style={[btn.label, { color: textColor, fontSize: fontSizes[size] }]}>
              {loadingLabel}
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={btn.row}>
          {icon ? <View style={{ marginRight: 2 }}>{icon}</View> : null}
          <Text
            style={[
              btn.label,
              { color: isDisabled ? textColor + "99" : textColor, fontSize: fontSizes[size] },
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const btn = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontWeight: "700",
    letterSpacing: 0.1,
  },
});
