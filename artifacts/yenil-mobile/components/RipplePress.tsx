import React, { useRef, useCallback } from "react";
import {
  Pressable, View, Animated, StyleSheet, ViewStyle, StyleProp,
  GestureResponderEvent, PressableStateCallbackType,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface Ripple {
  id: number;
  x: number;
  y: number;
  scale: Animated.Value;
  opacity: Animated.Value;
}

type PressableStyle = StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);

interface RipplePressProps {
  children: React.ReactNode;
  onPress?: (e?: GestureResponderEvent) => void;
  onLongPress?: () => void;
  style?: PressableStyle;
  disabled?: boolean;
  rippleColor?: string;
  borderRadius?: number;
  rippleSize?: number;
}

export function RipplePress({
  children,
  onPress,
  onLongPress,
  style,
  disabled,
  rippleColor,
  borderRadius = 12,
  rippleSize = 80,
}: RipplePressProps) {
  const colors = useColors();
  const ripples = useRef<Ripple[]>([]);
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  const containerRef = useRef<View>(null);

  const rColor = rippleColor ?? colors.primary;

  const triggerRipple = useCallback((x: number, y: number) => {
    const id = Date.now() + Math.random();
    const scale = new Animated.Value(0);
    const opacity = new Animated.Value(0.45);

    const ripple: Ripple = { id, x, y, scale, opacity };
    ripples.current = [...ripples.current, ripple];
    forceUpdate();

    // Spawn a few satellite dots for the "water bubble" effect
    const dotCount = 5;
    const dotAnims: { scale: Animated.Value; opacity: Animated.Value }[] = [];
    for (let i = 0; i < dotCount; i++) {
      dotAnims.push({
        scale: new Animated.Value(0),
        opacity: new Animated.Value(0.55),
      });
    }

    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 520,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 520,
        useNativeDriver: true,
      }),
    ]).start(() => {
      ripples.current = ripples.current.filter((r) => r.id !== id);
      forceUpdate();
    });
  }, []);

  const handlePressIn = useCallback((e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    triggerRipple(locationX, locationY);
  }, [triggerRipple]);

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      style={({ pressed, hovered }) => [
        { overflow: "hidden", borderRadius },
        typeof style === "function"
          ? (style as (s: PressableStateCallbackType) => StyleProp<ViewStyle>)({ pressed, hovered })
          : style,
      ]}
    >
      {/* Ripple layer */}
      <View style={[StyleSheet.absoluteFill, { borderRadius }]} pointerEvents="none">
        {ripples.current.map((r) => (
          <Animated.View
            key={r.id}
            style={{
              position: "absolute",
              left: r.x - rippleSize / 2,
              top: r.y - rippleSize / 2,
              width: rippleSize,
              height: rippleSize,
              borderRadius: rippleSize / 2,
              backgroundColor: rColor,
              opacity: r.opacity,
              transform: [{ scale: r.scale }],
            }}
          />
        ))}
      </View>

      {/* Dot particles layer */}
      <View style={[StyleSheet.absoluteFill, { borderRadius }]} pointerEvents="none">
        {ripples.current.map((r) =>
          [-1, 0, 1, 2, 3].map((i) => {
            const angle = (i / 5) * Math.PI * 2;
            const dist = 28;
            const dx = Math.cos(angle) * dist;
            const dy = Math.sin(angle) * dist;
            return (
              <Animated.View
                key={`${r.id}-dot-${i}`}
                style={{
                  position: "absolute",
                  left: r.x + dx - 4,
                  top: r.y + dy - 4,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: rColor,
                  opacity: r.opacity,
                  transform: [{ scale: r.scale }],
                }}
              />
            );
          })
        )}
      </View>

      {children}
    </Pressable>
  );
}
