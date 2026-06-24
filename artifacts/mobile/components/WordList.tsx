import React, { memo, useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import { useGame } from "@/context/GameContext";
import { Feather } from "@expo/vector-icons";

interface WordChipProps {
  word: string;
  isFound: boolean;
  puzzleKey: string;
  isBonus: boolean;
}

const WordChip = memo(function WordChip({
  word, isFound, puzzleKey: _puzzleKey, isBonus,
}: WordChipProps) {
  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const flashAnim  = useRef(new Animated.Value(0)).current;
  const glowAnim   = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const prevFound  = useRef(isFound);

  useEffect(() => {
    if (isFound && !prevFound.current) {
      flashAnim.setValue(1);
      checkScale.setValue(0);

      Animated.parallel([
        Animated.timing(flashAnim, {
          toValue: 0, duration: 450, useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 1.38,
            tension: 320,
            friction: 4,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 240,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(checkScale, {
          toValue: 1,
          tension: 400,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 130, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.2, duration: 200, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.7, duration: 150, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 480, useNativeDriver: true }),
        ]),
      ]).start();
    }
    prevFound.current = isFound;
  }, [isFound]);

  const glowBorderOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const displayText = word;

  return (
    <Animated.View style={[styles.chipOuter, { transform: [{ scale: scaleAnim }] }]}>
      {isFound && (
        <Animated.View
          style={[styles.chipGlow, { opacity: glowBorderOpacity, pointerEvents: "none" } as any]}
        />
      )}

      <View
        style={[
          styles.wordChip,
          isFound ? styles.wordChipFound : styles.wordChipPending,
          isBonus && !isFound ? styles.wordChipBonus : null,
          { overflow: "hidden" },
        ]}
      >
        <Animated.View
          style={[StyleSheet.absoluteFillObject, styles.flashOverlay, { opacity: flashAnim, pointerEvents: "none" } as any]}
        />

        {isFound && (
          <Animated.View style={{ transform: [{ scale: checkScale }], marginRight: 4 }}>
            <Feather name="check" size={12} color="#ffe066" />
          </Animated.View>
        )}

        {isBonus && !isFound && (
          <Text style={styles.bonusBadge}>⚡</Text>
        )}

        <Text
          style={[
            styles.wordText,
            isFound ? styles.wordTextFound : styles.wordTextPending,
          ]}
        >
          {displayText}
        </Text>
      </View>
    </Animated.View>
  );
});

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function AnimatedProgressBar({ pct }: { pct: number }) {
  const widthAnim = useRef(new Animated.Value(pct)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const prevPct   = useRef(pct);

  useEffect(() => {
    if (pct !== prevPct.current) {
      const wasLower = pct > prevPct.current;
      prevPct.current = pct;

      Animated.parallel([
        Animated.timing(widthAnim, {
          toValue: pct,
          duration: 450,
          useNativeDriver: false,
        }),
        wasLower
          ? Animated.sequence([
              Animated.spring(pulseAnim, {
                toValue: 1.08,
                tension: 400,
                friction: 5,
                useNativeDriver: true,
              }),
              Animated.spring(pulseAnim, {
                toValue: 1,
                tension: 280,
                friction: 7,
                useNativeDriver: true,
              }),
            ])
          : Animated.timing(pulseAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
      ]).start();
    }
  }, [pct]);

  const widthInterp = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  return (
    <Animated.View style={[styles.progressPill, { transform: [{ scaleX: pulseAnim }] }]}>
      <Animated.View style={[styles.progressFill, { width: widthInterp }]} />
    </Animated.View>
  );
}

// ─── WordList ─────────────────────────────────────────────────────────────────

export default function WordList() {
  const { puzzle, foundWords, puzzleKey, difficulty, bonusWord } = useGame();

  if (!puzzle) return null;

  const total   = puzzle.placedWords.length;
  const found   = foundWords.length;
  const pct     = Math.round((found / total) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>WORDS</Text>
        </View>
        <View style={styles.progressRow}>
          <AnimatedProgressBar pct={pct} />
          <Text style={styles.counter}>{found}/{total}</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {puzzle.placedWords.map((pw) => (
          <WordChip
            key={`${puzzleKey}-${pw.word}`}
            word={pw.word}
            isFound={pw.found}
            puzzleKey={puzzleKey}
            isBonus={!!(bonusWord && pw.word.toUpperCase() === bonusWord.toUpperCase())}
          />
        ))}
      </ScrollView>
      {difficulty === "medium" && bonusWord && (
        <Text style={styles.bonusHint}>⚡ Find the bonus word for +10s!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8, gap: 8 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.5,
    color: "#a888cc",
  },
  hardBadge: {
    backgroundColor: "#7c0000",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  hardBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 8,
    color: "#ff8888",
    letterSpacing: 1,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressPill: {
    width: 70,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#1e0a40",
    borderWidth: 1,
    borderColor: "#3a1a6e",
  },
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 4,
    backgroundColor: "#9b5fff",
  },
  counter: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: "#f5e6a0",
    minWidth: 34,
    textAlign: "right",
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  chipOuter: {
    position: "relative",
  },
  chipGlow: {
    position: "absolute",
    top: -4, left: -4, right: -4, bottom: -4,
    borderRadius: 24,
    backgroundColor: "#ffe066",
    opacity: 0.3,
  },
  wordChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  wordChipPending: {
    backgroundColor: "#1e0a40",
    borderColor: "#5a3a9e",
  },
  wordChipBonus: {
    backgroundColor: "#1a1200",
    borderColor: "#f59e0b",
    borderWidth: 2,
  },
  wordChipFound: {
    backgroundColor: "#2d1400",
    borderColor: "#d4920e",
  },
  flashOverlay: {
    borderRadius: 18,
    backgroundColor: "#ffe066",
  },
  bonusBadge: {
    fontSize: 12,
    marginRight: 3,
  },
  wordText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  wordTextPending: { color: "#e8d8ff" },
  wordTextFound: {
    color: "#ffe066",
    textDecorationLine: "line-through",
    textDecorationColor: "#ffe066",
  },
  wordTextHidden: {
    color: "#6633aa",
    letterSpacing: 2,
    fontSize: 10,
  },
  bonusHint: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "#f59e0b",
    textAlign: "center",
    opacity: 0.8,
    letterSpacing: 0.5,
  },
});
