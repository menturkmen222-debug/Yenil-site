import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const { width: W, height: H } = Dimensions.get("window");

const COUNT = 60;
const COLORS = [
  "#FFD700", "#FF4444", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FF6B9D", "#C3A6FF", "#FFB347", "#69D2E7", "#F9A825",
  "#A8E063", "#FF8C94", "#88D8B0", "#FFAAA5", "#FF6F61",
];

function rnd(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

interface Particle {
  id: number;
  x: number;
  color: string;
  size: number;
  isCircle: boolean;
  isRect: boolean;
  delay: number;
  dur: number;
  ty: Animated.Value;
  tx: Animated.Value;
  rot: Animated.Value;
  op: Animated.Value;
}

function createParticles(): Particle[] {
  return Array.from({ length: COUNT }, (_, i) => ({
    id: i,
    x: rnd(-10, W),
    color: COLORS[Math.floor(rnd(0, COLORS.length))],
    size: rnd(7, 15),
    isCircle: Math.random() > 0.6,
    isRect: Math.random() > 0.7,
    delay: rnd(0, 1200),
    dur: rnd(2000, 3800),
    ty: new Animated.Value(-40),
    tx: new Animated.Value(0),
    rot: new Animated.Value(0),
    op: new Animated.Value(1),
  }));
}

export function ConfettiOverlay({ onDone }: { onDone?: () => void }) {
  const particles = useRef<Particle[]>(createParticles()).current;

  useEffect(() => {
    const anims = particles.map((p) =>
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.parallel([
          Animated.timing(p.ty, {
            toValue: H + 60,
            duration: p.dur,
            useNativeDriver: true,
          }),
          Animated.timing(p.tx, {
            toValue: rnd(-80, 80),
            duration: p.dur,
            useNativeDriver: true,
          }),
          Animated.timing(p.rot, {
            toValue: 1,
            duration: p.dur,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(p.op, {
              toValue: 1,
              duration: p.dur * 0.65,
              useNativeDriver: true,
            }),
            Animated.timing(p.op, {
              toValue: 0,
              duration: p.dur * 0.35,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ])
    );

    Animated.parallel(anims).start(() => {
      onDone?.();
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => {
        const w = p.isRect ? p.size * 2.8 : p.size;
        const h = p.isRect ? p.size * 0.55 : p.size;
        const br = p.isCircle ? p.size / 2 : p.isRect ? 2 : 3;

        return (
          <Animated.View
            key={p.id}
            style={{
              position: "absolute",
              top: 0,
              left: p.x,
              width: w,
              height: h,
              borderRadius: br,
              backgroundColor: p.color,
              opacity: p.op,
              transform: [
                { translateY: p.ty },
                { translateX: p.tx },
                {
                  rotate: p.rot.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", `${rnd(360, 1080)}deg`],
                  }),
                },
              ],
            }}
          />
        );
      })}
    </View>
  );
}
