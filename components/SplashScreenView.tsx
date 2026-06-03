import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

const PARTICLE_COUNT = 24;

const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  x: 0.04 + (i / PARTICLE_COUNT) * 0.92 + (Math.sin(i * 2.3) * 0.1),
  y: 0.05 + (Math.sin(i * 1.7 + 0.5) * 0.4 + 0.45),
  size: 2 + (i % 4),
  opacityTarget: 0.3 + (i % 5) * 0.12,
  duration: 1400 + (i % 7) * 200,
  delay: (i % 8) * 80,
  color: i % 3 === 0 ? "#f5c518" : i % 3 === 1 ? "#9b5fff" : "#00d4ff",
}));

interface Props {
  onFinish: () => void;
}

export default function SplashScreenView({ onFinish }: Props) {
  const bgOpacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.55)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const wordOpacity = useRef(new Animated.Value(0)).current;
  const wordY = useRef(new Animated.Value(16)).current;
  const huntOpacity = useRef(new Animated.Value(0)).current;
  const huntY = useRef(new Animated.Value(16)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.5)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const ring2Scale = useRef(new Animated.Value(0.3)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;

  const particleAnims = useRef(
    PARTICLES.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Particle float loops
    PARTICLES.forEach((p, i) => {
      const a = particleAnims[i];
      Animated.loop(
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.parallel([
            Animated.timing(a.opacity, { toValue: p.opacityTarget, duration: p.duration * 0.5, useNativeDriver: false }),
            Animated.timing(a.translateY, { toValue: -(10 + (i % 5) * 5), duration: p.duration, useNativeDriver: false }),
          ]),
          Animated.timing(a.opacity, { toValue: 0, duration: p.duration * 0.5, useNativeDriver: false }),
        ])
      ).start();
    });

    // Ring pulse
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ringScale, { toValue: 1.2, duration: 1000, useNativeDriver: false }),
          Animated.timing(ringOpacity, { toValue: 0.22, duration: 500, useNativeDriver: false }),
        ]),
        Animated.parallel([
          Animated.timing(ringScale, { toValue: 0.5, duration: 1000, useNativeDriver: false }),
          Animated.timing(ringOpacity, { toValue: 0, duration: 500, useNativeDriver: false }),
        ]),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.delay(350),
        Animated.parallel([
          Animated.timing(ring2Scale, { toValue: 1.4, duration: 1000, useNativeDriver: false }),
          Animated.timing(ring2Opacity, { toValue: 0.12, duration: 500, useNativeDriver: false }),
        ]),
        Animated.parallel([
          Animated.timing(ring2Scale, { toValue: 0.3, duration: 1000, useNativeDriver: false }),
          Animated.timing(ring2Opacity, { toValue: 0, duration: 500, useNativeDriver: false }),
        ]),
      ])
    ).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 750, useNativeDriver: false }),
        Animated.timing(glowPulse, { toValue: 0, duration: 750, useNativeDriver: false }),
      ])
    ).start();

    // Main entrance → hold → exit
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 55, friction: 7, useNativeDriver: false }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 480, useNativeDriver: false }),
      ]),
      Animated.parallel([
        Animated.timing(wordOpacity, { toValue: 1, duration: 260, useNativeDriver: false }),
        Animated.timing(wordY, { toValue: 0, duration: 280, useNativeDriver: false }),
      ]),
      Animated.parallel([
        Animated.timing(huntOpacity, { toValue: 1, duration: 260, useNativeDriver: false }),
        Animated.timing(huntY, { toValue: 0, duration: 280, useNativeDriver: false }),
      ]),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 320, useNativeDriver: false }),
      Animated.delay(920),
      Animated.timing(bgOpacity, { toValue: 0, duration: 400, useNativeDriver: false }),
    ]).start(() => onFinish());
  }, []);

  const glowRadius = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [12, 28] });

  return (
    <Animated.View style={[styles.container, { opacity: bgOpacity, pointerEvents: "none" }]}>
      {/* Particles */}
      {PARTICLES.map((p, i) => {
        const a = particleAnims[i];
        return (
          <Animated.View
            key={p.id}
            style={[
              styles.particle,
              {
                left: p.x * width,
                top: p.y * height,
                width: p.size,
                height: p.size,
                borderRadius: p.size / 2,
                backgroundColor: p.color,
                opacity: a.opacity,
                transform: [{ translateY: a.translateY }],
              },
            ]}
          />
        );
      })}

      <View style={styles.center}>
        {/* Pulse rings */}
        <Animated.View
          style={[styles.ring, {
            width: 220, height: 220, borderRadius: 110,
            borderColor: "#f5c518",
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          }]}
        />
        <Animated.View
          style={[styles.ring, {
            width: 310, height: 310, borderRadius: 155,
            borderColor: "#9b5fff",
            opacity: ring2Opacity,
            transform: [{ scale: ring2Scale }],
          }]}
        />

        {/* Logo block */}
        <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }], alignItems: "center" }}>
          {/* WORD */}
          <Animated.Text
            style={[
              styles.logoWord,
              {
                opacity: wordOpacity,
                transform: [{ translateY: wordY }],
              },
            ]}
          >
            WORD
          </Animated.Text>

          {/* HUNT */}
          <Animated.Text
            style={[
              styles.logoHunt,
              {
                opacity: huntOpacity,
                transform: [{ translateY: huntY }],
              },
            ]}
          >
            HUNT
          </Animated.Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          Find hidden words. Build your streak.
        </Animated.Text>

        {/* Loading dots */}
        <Animated.View style={[styles.dotsRow, { opacity: taglineOpacity }]}>
          <LoadingDot delay={0} />
          <LoadingDot delay={180} />
          <LoadingDot delay={360} />
        </Animated.View>
      </View>

      <Animated.Text style={[styles.bottomBrand, { opacity: taglineOpacity }]}>
        WORD HUNT
      </Animated.Text>
    </Animated.View>
  );
}

function LoadingDot({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 380, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 380, useNativeDriver: false }),
        Animated.delay(Math.max(0, 560 - delay)),
      ])
    ).start();
  }, []);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.4] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });

  return (
    <Animated.View style={[styles.dot, { opacity, transform: [{ scale }] }]} />
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0a0218",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  particle: {
    position: "absolute",
  },
  ring: {
    position: "absolute",
    borderWidth: 1.5,
  },
  center: {
    alignItems: "center",
    gap: 14,
  },
  logoWord: {
    fontFamily: "Inter_700Bold",
    fontSize: 60,
    letterSpacing: 10,
    lineHeight: 66,
    color: "#d4aaff",
  },
  logoHunt: {
    fontFamily: "Inter_700Bold",
    fontSize: 60,
    letterSpacing: 10,
    lineHeight: 66,
    color: "#f5c518",
  },
  tagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#8060a8",
    letterSpacing: 0.4,
    textAlign: "center",
  },
  dotsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#f5c518",
  },
  bottomBrand: {
    position: "absolute",
    bottom: 40,
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: "#3a1a60",
    letterSpacing: 5,
  },
});
