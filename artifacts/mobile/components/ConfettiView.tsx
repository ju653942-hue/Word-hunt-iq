import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const { width: W, height: H } = Dimensions.get("window");

const COLORS = [
  "#9b6dff", "#f59e0b", "#00d4ff", "#ff006e",
  "#00e676", "#ff6b35", "#ffffff", "#ffdd00",
];

const PARTICLE_COUNT = 24;

interface ParticleData {
  startX: number;
  y: Animated.Value;
  x: Animated.Value;
  rotation: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
  isSquare: boolean;
}

export default function ConfettiView({ visible }: { visible: boolean }) {
  const particles = useRef<ParticleData[]>(
    Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const startX = Math.random() * W;
      return {
        startX,
        x: new Animated.Value(startX),
        y: new Animated.Value(-30 - Math.random() * 150),
        rotation: new Animated.Value(0),
        opacity: new Animated.Value(0),
        color: COLORS[i % COLORS.length],
        size: 7 + Math.random() * 9,
        isSquare: Math.random() > 0.4,
      };
    })
  ).current;

  useEffect(() => {
    if (!visible) {
      particles.forEach((p) => p.opacity.setValue(0));
      return;
    }

    particles.forEach((p) => {
      const newX = Math.random() * W;
      p.startX = newX;
      p.x.setValue(newX);
      p.y.setValue(-30 - Math.random() * 150);
      p.rotation.setValue(0);
      p.opacity.setValue(1);
    });

    const animations = particles.map((p, i) => {
      const delay = i * 45;
      const duration = 2200 + Math.random() * 1200;
      const drift = (Math.random() - 0.5) * 120;
      const spins = (Math.random() > 0.5 ? 1 : -1) * (3 + Math.random() * 4);

      return Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(p.y, {
            toValue: H + 60,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(p.x, {
            toValue: p.startX + drift,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(p.rotation, {
            toValue: spins * 360,
            duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(duration * 0.55),
            Animated.timing(p.opacity, {
              toValue: 0,
              duration: duration * 0.45,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]);
    });

    Animated.parallel(animations).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFillObject, { pointerEvents: "none" } as any]}>
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.isSquare ? 2 : p.size / 2,
            opacity: p.opacity,
            transform: [
              { translateX: p.x },
              { translateY: p.y },
              {
                rotate: p.rotation.interpolate({
                  inputRange: [-1440, 1440],
                  outputRange: ["-1440deg", "1440deg"],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}
