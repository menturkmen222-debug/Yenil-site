import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const { width: W, height: H } = Dimensions.get("window");
const CX = W / 2;
const CY = H * 0.42;

const COUNT = 90;
const COLORS = [
  "#FFD700", "#FF4444", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FF6B9D", "#C3A6FF", "#FFB347", "#69D2E7", "#F9A825",
  "#A8E063", "#FF8C94", "#88D8B0", "#FD79A8", "#6C5CE7",
  "#00CEC9", "#FDCB6E", "#E17055", "#74B9FF", "#55EFC4",
];

function rnd(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

interface Particle {
  id: number;
  color: string;
  width: number;
  height: number;
  borderRadius: number;
  delay: number;
  dur: number;
  rotDeg: number;
  tx: Animated.Value;
  ty: Animated.Value;
  rot: Animated.Value;
  op: Animated.Value;
  scale: Animated.Value;
  targetTx: number;
  targetTy: number;
}

function createParticles(): Particle[] {
  return Array.from({ length: COUNT }, (_, i) => {
    const angle = rnd(0, Math.PI * 2);
    const distance = rnd(80, Math.max(W, H) * 0.78);
    const isCircle = Math.random() > 0.52;
    const isRect = !isCircle && Math.random() > 0.45;
    const size = rnd(7, 15);
    const w = isRect ? size * 2.8 : size;
    const h = isRect ? size * 0.52 : size;
    const br = isCircle ? size / 2 : isRect ? 2 : 3;
    const gravity = distance * 0.35;

    return {
      id: i,
      color: COLORS[Math.floor(rnd(0, COLORS.length))],
      width: w,
      height: h,
      borderRadius: br,
      delay: rnd(0, 250),
      dur: rnd(1400, 2800),
      rotDeg: rnd(360, 1260) * (Math.random() > 0.5 ? 1 : -1),
      tx: new Animated.Value(0),
      ty: new Animated.Value(0),
      rot: new Animated.Value(0),
      op: new Animated.Value(0),
      scale: new Animated.Value(0),
      targetTx: Math.cos(angle) * distance,
      targetTy: Math.sin(angle) * distance + gravity,
    };
  });
}

export function ConfettiOverlay({ onDone }: { onDone?: () => void }) {
  const particles = useRef<Particle[]>(createParticles()).current;

  useEffect(() => {
    const anims = particles.map((p) =>
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.parallel([
          Animated.timing(p.tx, {
            toValue: p.targetTx,
            duration: p.dur,
            useNativeDriver: true,
          }),
          Animated.timing(p.ty, {
            toValue: p.targetTy,
            duration: p.dur,
            useNativeDriver: true,
          }),
          Animated.timing(p.rot, {
            toValue: 1,
            duration: p.dur,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(p.scale, {
              toValue: 1,
              duration: 180,
              useNativeDriver: true,
            }),
            Animated.timing(p.op, {
              toValue: 1,
              duration: 80,
              useNativeDriver: true,
            }),
            Animated.delay(p.dur * 0.45),
            Animated.timing(p.op, {
              toValue: 0,
              duration: p.dur * 0.5,
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
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]} pointerEvents="none">
      {particles.map((p) => (
        <Animated.View
          key={p.id}
          style={{
            position: "absolute",
            top: CY - p.height / 2,
            left: CX - p.width / 2,
            width: p.width,
            height: p.height,
            borderRadius: p.borderRadius,
            backgroundColor: p.color,
            opacity: p.op,
            transform: [
              { translateX: p.tx },
              { translateY: p.ty },
              { scale: p.scale },
              {
                rotate: p.rot.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", `${p.rotDeg}deg`],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}
