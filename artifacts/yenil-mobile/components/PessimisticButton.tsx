import React, { useRef, useState, useCallback } from "react";
import {
  Pressable,
  ActivityIndicator,
  Text,
  StyleSheet,
  View,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface PessimisticButtonProps {
  onPress: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  label: string;
  loadingLabel?: string;
  icon?: IoniconsName | React.ReactNode;
  iconSize?: number;
  color?: string;
  textColor?: string;
  style?: object;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  variant?: "primary" | "secondary" | "destructive" | "ghost";
  hapticStyle?: Haptics.ImpactFeedbackStyle;
}

export function PessimisticButton({
  onPress,
  loading = false,
  disabled = false,
  label,
  loadingLabel,
  icon,
  iconSize,
  color,
  textColor,
  style,
  size = "md",
  fullWidth = true,
  variant = "primary",
  hapticStyle = Haptics.ImpactFeedbackStyle.Medium,
}: PessimisticButtonProps) {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [internalLock, setInternalLock] = useState(false);

  const isDisabled = disabled || loading || internalLock;

  const bgColor = (() => {
    if (color) return color;
    switch (variant) {
      case "secondary":    return colors.secondary;
      case "destructive":  return colors.destructive;
      case "ghost":        return "transparent";
      default:             return colors.primary;
    }
  })();

  const labelColor = (() => {
    if (textColor) return textColor;
    switch (variant) {
      case "secondary": return colors.secondaryForeground;
      case "ghost":     return colors.primary;
      default:          return "#ffffff";
    }
  })();

  const heights    = { sm: 40, md: 52, lg: 58 } as const;
  const fontSizes  = { sm: 13, md: 15, lg: 16 } as const;
  const radii      = { sm: 12, md: 14, lg: 16 } as const;
  const iconSizes  = { sm: 16, md: 18, lg: 20 } as const;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(async () => {
    if (isDisabled) return;
    setInternalLock(true);
    Haptics.impactAsync(hapticStyle);
    try {
      await onPress();
    } finally {
      setInternalLock(false);
    }
  }, [isDisabled, hapticStyle, onPress]);

  const resolvedIconSize = iconSize ?? iconSizes[size];

  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === "string") {
      return (
        <Ionicons
          name={icon as IoniconsName}
          size={resolvedIconSize}
          color={isDisabled ? labelColor + "99" : labelColor}
        />
      );
    }
    return <View>{icon as React.ReactNode}</View>;
  };

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        fullWidth ? { alignSelf: "stretch" } : { alignSelf: "auto" },
        isDisabled && { opacity: 0.42 },
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          btn.base,
          {
            backgroundColor: bgColor,
            height: heights[size],
            borderRadius: radii[size],
            shadowColor: variant === "ghost" ? "transparent" : bgColor,
            shadowOpacity: isDisabled ? 0 : 0.28,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: isDisabled || variant === "ghost" ? 0 : 4,
          },
          style,
        ]}
      >
        {loading ? (
          <View style={btn.row}>
            <ActivityIndicator size="small" color={labelColor} />
            {loadingLabel ? (
              <Text
                style={[
                  btn.label,
                  { color: labelColor, fontSize: fontSizes[size] },
                ]}
              >
                {loadingLabel}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={btn.row}>
            {renderIcon()}
            <Text
              style={[
                btn.label,
                {
                  color: isDisabled ? labelColor + "99" : labelColor,
                  fontSize: fontSizes[size],
                },
              ]}
            >
              {label}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
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
