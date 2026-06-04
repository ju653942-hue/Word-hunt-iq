import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useGame } from "@/context/GameContext";
import { difficultyConfig } from "@/constants/wordData";
import { playTimerTickSound } from "@/utils/soundManager";

// ─── Thresholds ───────────────────────────────────────────────────────────────
const MID_THRESHOLD  = 0.45;   // ratio where bar turns amber
const LOW_THRESHOLD  = 0.22;   // ratio where urgency kicks in
const CRIT_THRESHOLD = 0.10;   // ratio for critical (final countdown)

export default function TimerBar() {
  const {
    timeLeft, difficulty, score, isPlaying,
    tick, comboCount, comboMultiplier, coins, hints,
  } = useGame();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Bar fill ─────────────────────────────────────────────────────────────
  const animWidth     = useRef(new Animated.Value(1)).current;

  // ── Timer chip glow (breathing, not flashing) ─────────────────────────
  const chipGlow      = useRef(new Animated.Value(0)).current;
  const chipGlowLoop  = useRef<Animated.CompositeAnimation | null>(null);

  // ── Bar glow intensity ────────────────────────────────────────────────
  const barGlowAnim   = useRef(new Animated.Value(0)).current;
  const barGlowLoop   = useRef<Animated.CompositeAnimation | null>(null);

  // ── Digit bounce (gentle, per-second at low time) ─────────────────────
  const digitScale    = useRef(new Animated.Value(1)).current;

  // ── Combo scale ───────────────────────────────────────────────────────
  const comboScale    = useRef(new Animated.Value(1)).current;
  const prevCombo     = useRef(comboCount);

  // ── Warning icon fade ────────────────────────────────────────────────
  const warnOpacity   = useRef(new Animated.Value(0)).current;

  const totalTime = difficultyConfig[difficulty].timeSeconds;
  const ratio     = timeLeft / totalTime;

  const isCrit = ratio <= CRIT_THRESHOLD;
  const isLow  = ratio <= LOW_THRESHOLD;
  const isMid  = ratio <= MID_THRESHOLD;

  // ── Bar color interpolation (smooth purple → amber → red) ────────────
  const barColorAnim  = useRef(new Animated.Value(0)).current; // 0=purple, 1=amber, 2=red

  // ── Tick interval ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => tick(), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, tick]);

  // ── Smooth bar width ──────────────────────────────────────────────────
  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: ratio,
      duration: 320,
      useNativeDriver: false,
    }).start();
  }, [ratio]);

  // ── Bar color phase ───────────────────────────────────────────────────
  useEffect(() => {
    const target = isCrit ? 2 : isLow ? 1.6 : isMid ? 0.8 : 0;
    Animated.timing(barColorAnim, {
      toValue: target,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [isCrit, isLow, isMid]);

  // ── Breathing glow loops start/stop based on urgency ─────────────────
  useEffect(() => {
    chipGlowLoop.current?.stop();
    barGlowLoop.current?.stop();

    if (isLow && isPlaying) {
      const speed = isCrit ? 520 : 880;

      chipGlowLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(chipGlow, { toValue: 1, duration: speed, useNativeDriver: false }),
          Animated.timing(chipGlow, { toValue: 0.15, duration: speed, useNativeDriver: false }),
        ])
      );
      chipGlowLoop.current.start();

      barGlowLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(barGlowAnim, { toValue: 1, duration: speed * 1.1, useNativeDriver: false }),
          Animated.timing(barGlowAnim, { toValue: 0.2, duration: speed * 1.1, useNativeDriver: false }),
        ])
      );
      barGlowLoop.current.start();
    } else {
      Animated.timing(chipGlow, { toValue: 0, duration: 400, useNativeDriver: false }).start();
      Animated.timing(barGlowAnim, { toValue: 0, duration: 400, useNativeDriver: false }).start();
    }

    return () => {
      chipGlowLoop.current?.stop();
      barGlowLoop.current?.stop();
    };
  }, [isLow, isCrit, isPlaying]);

  // ── Per-second digit bounce + tick sound + warning fade ───────────────
  useEffect(() => {
    if (!isPlaying) return;

    if (timeLeft <= 15 && timeLeft > 0) {
      // Tick every second from 15 down
      playTimerTickSound(timeLeft % 2 === 0);
      Animated.sequence([
        Animated.spring(digitScale, { toValue: timeLeft <= 10 ? 1.22 : 1.12, tension: 400, friction: 5, useNativeDriver: true }),
        Animated.spring(digitScale, { toValue: 1, tension: 280, friction: 8, useNativeDriver: true }),
      ]).start();
    } else {
      digitScale.setValue(1);
    }

    // Warning dot fades in at isLow
    Animated.timing(warnOpacity, {
      toValue: isLow && timeLeft > 0 ? 1 : 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [timeLeft, isPlaying]);

  // ── Combo scale burst ─────────────────────────────────────────────────
  useEffect(() => {
    if (comboCount > prevCombo.current && comboCount >= 3) {
      Animated.sequence([
        Animated.spring(comboScale, { toValue: 1.28, tension: 260, friction: 5, useNativeDriver: true }),
        Animated.spring(comboScale, { toValue: 1,    tension: 200, friction: 7, useNativeDriver: true }),
      ]).start();
    }
    prevCombo.current = comboCount;
  }, [comboCount]);

  // ── Derived display values ────────────────────────────────────────────
  const mins    = Math.floor(timeLeft / 60);
  const secs    = timeLeft % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;

  const showCombo  = comboCount >= 3;
  const comboLabel = comboCount >= 7 ? "⚡ ULTRA" : comboCount >= 5 ? "🔥 SUPER" : "✨ COMBO";

  // ── Interpolated colors ───────────────────────────────────────────────
  const barBg = barColorAnim.interpolate({
    inputRange: [0, 0.8, 1.6, 2],
    outputRange: ["#9b5fff", "#9b5fff", "#f5a623", "#ff3b5c"],
  });
  const chipBorderColor = barColorAnim.interpolate({
    inputRange: [0, 0.8, 1.6, 2],
    outputRange: ["#c8900a", "#c8900a", "#f5a623", "#ff3b5c"],
  });
  const chipBgColor = barColorAnim.interpolate({
    inputRange: [0, 0.8, 1.6, 2],
    outputRange: ["#1a0838", "#1a0838", "#2e1800", "#2e0010"],
  });
  const chipTextColor = barColorAnim.interpolate({
    inputRange: [0, 0.8, 1.6, 2],
    outputRange: ["#ffe066", "#ffe066", "#ffc060", "#ff6b80"],
  });
  const chipShadowRadius = chipGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [isLow ? 4 : 2, isCrit ? 18 : 10],
  });
  const chipShadowColor = barColorAnim.interpolate({
    inputRange: [0, 1.6, 2],
    outputRange: ["#000000", "#f5a623", "#ff3b5c"],
  });
  const barShadowRadius = barGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, isCrit ? 10 : 6],
  });

  return (
    <View style={styles.container}>
      {/* ── Top row ─────────────────────────────────────────────────────── */}
      <View style={styles.topRow}>

        {/* Timer chip */}
        <Animated.View style={[styles.timerChip, {
          backgroundColor: chipBgColor,
          borderColor: chipBorderColor,
          shadowColor: isLow ? (isCrit ? "#ff3b5c" : "#f5a623") : "#000",
          shadowOpacity: isLow ? 0.55 : 0.28,
          shadowRadius: chipShadowRadius,
          shadowOffset: { width: 0, height: 0 },
        }]}>
          {/* Timer icon — always visible */}
          <Animated.Text style={{
            fontSize: 15,
            color: chipTextColor,
          }}>⏱</Animated.Text>

          {/* Warning dot — fades in at low time */}
          <Animated.View style={[styles.warnDot, {
            backgroundColor: isCrit ? "#ff3b5c" : "#f5a623",
            opacity: warnOpacity,
          }]} />

          <Animated.Text style={[styles.timerText, {
            color: chipTextColor,
            transform: [{ scale: digitScale }],
          }]}>
            {timeStr}
          </Animated.Text>
        </Animated.View>

        {/* Combo badge */}
        {showCombo && (
          <Animated.View style={[styles.comboBadge, {
            backgroundColor: "#1e0038",
            borderColor: "#8030c8",
            shadowColor: "#9040d8",
            shadowOpacity: 0.25,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 0 },
            transform: [{ scale: comboScale }],
          }]}>
            <Text style={[styles.comboText, { color: "#cfa0ff" }]}>
              {comboLabel} ×{comboMultiplier % 1 === 0 ? comboMultiplier : comboMultiplier.toFixed(1)}
            </Text>
          </Animated.View>
        )}

        {/* Score chip */}
        <View style={[styles.scoreChip, {
          backgroundColor: "#1a0838",
          borderColor: "#c8900a",
        }]}>
          <Text style={{ fontSize: 14, color: "#ffe066" }}>★</Text>
          <Text style={[styles.scoreText, { color: "#ffe066" }]}>{score}</Text>
        </View>
      </View>

      {/* ── Progress bar ────────────────────────────────────────────────── */}
      <View style={styles.barTrack}>
        {/* Segment markers at 25 / 50 / 75% */}
        {[0.25, 0.5, 0.75].map((p) => (
          <View key={p} style={[styles.segmentMark, { left: `${p * 100}%` as any }]} />
        ))}

        {/* Fill */}
        <Animated.View style={[styles.barFill, {
          backgroundColor: barBg,
          width: animWidth.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
          shadowColor: isLow ? (isCrit ? "#ff3b5c" : "#f5a623") : "#9b5fff",
          shadowOpacity: isLow ? 0.85 : 0.45,
          shadowRadius: barShadowRadius,
          shadowOffset: { width: 0, height: 0 },
        }]}>
          {/* Shimmer stripe inside bar */}
          <View style={styles.barShimmer} />
        </Animated.View>
      </View>

      {/* ── Resource row ─────────────────────────────────────────────────── */}
      <View style={styles.resourceRow}>
        <View style={styles.resourceItem}>
          <Text style={styles.resourceIcon}>💰</Text>
          <Text style={[styles.resourceText, { color: "#d4920e" }]}>{coins}</Text>
        </View>
        <View style={styles.resourceItem}>
          <Text style={styles.resourceIcon}>💡</Text>
          <Text style={[styles.resourceText, { color: "#00c8f0" }]}>{hints}</Text>
        </View>

        {/* Time-remaining label on the right */}
        {isLow && (
          <Animated.Text style={[styles.urgencyLabel, {
            color: isCrit ? "#ff6b80" : "#ffa040",
            opacity: warnOpacity,
          }]}>
            {isCrit ? "HURRY!" : "Low time"}
          </Animated.Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  timerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    minWidth: 76,
  },
  timerText: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    letterSpacing: 0.5,
  },
  comboBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1.5,
    flex: 1,
    alignItems: "center",
  },
  comboText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  scoreChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    minWidth: 72,
    justifyContent: "flex-end",
  },
  scoreText: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
  },
  barTrack: {
    height: 8,
    borderRadius: 5,
    backgroundColor: "#0a0318",
    borderWidth: 1,
    borderColor: "#221058",
    overflow: "hidden",
    position: "relative",
  },
  segmentMark: {
    position: "absolute",
    top: 1,
    bottom: 1,
    width: 1,
    backgroundColor: "#221058",
    zIndex: 2,
  },
  barFill: {
    height: "100%",
    borderRadius: 5,
    overflow: "hidden",
  },
  barShimmer: {
    position: "absolute",
    top: 1,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  resourceRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  resourceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  resourceIcon: { fontSize: 12 },
  resourceText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
  },
  warnDot: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#0f041e",
  },
  urgencyLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1.2,
    marginLeft: "auto",
  },
});
