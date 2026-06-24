import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useGame } from "@/context/GameContext";
import { useWatchAd } from "@/hooks/useWatchAd";
import { useInterstitialAd } from "@/hooks/useInterstitialAd";
import {
  getLevelNumber,
  getLevelsForDifficulty,
  getPlayerLevel,
  wordCategories,
} from "@/constants/wordData";
import GameGrid from "@/components/GameGrid";
import TimerBar from "@/components/TimerBar";
import WordList from "@/components/WordList";
import ConfettiView from "@/components/ConfettiView";
import { playComboSound, playGameOverSound, playLevelCompleteSound, playTapSound } from "@/utils/soundManager";

// ─── ScaleButton — spring press animation for all CTAs ────────────────────────

function ScaleButton({
  onPress,
  style,
  children,
  disabled,
}: {
  onPress: () => void;
  style?: any;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.91,
      tension: 400,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, []);

  const onPressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 300,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onPressIn={disabled ? undefined : onPressIn}
      onPressOut={disabled ? undefined : onPressOut}
      disabled={disabled}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const LEVEL_NAMES = [
  "Rookie", "Apprentice", "Scholar", "Word Nerd",
  "Linguist", "Wordsmith", "Lexicographer", "Master",
  "Grandmaster", "Word Legend",
];

function getLevelName(level: number) {
  return LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)];
}

function buildShareText(newLevel: number, score: number) {
  const levelName = getLevelName(newLevel);
  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://wordhunt.app";
  return (
    `🎉 I just reached Level ${newLevel} – ${levelName} in Word Hunt!\n` +
    `🏆 Score: ${score} pts\n` +
    `🧠 Think you can beat me? Play here: ${appUrl}`
  );
}

function shareResult(newLevel: number, score: number) {
  const text = buildShareText(newLevel, score);
  if (typeof navigator !== "undefined" && (navigator as any).share) {
    (navigator as any).share({ title: "Word Hunt – Level Up!", text }).catch(() => {
      if (typeof window !== "undefined")
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    });
  } else if (typeof window !== "undefined") {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }
}

function shareViaWhatsApp(newLevel: number, score: number) {
  const text = buildShareText(newLevel, score);
  if (typeof window !== "undefined")
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
}

function ComboOverlay() {
  const colors = useColors();
  const { comboCount, comboMultiplier } = useGame();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const glowLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const prevCombo = useRef(comboCount);

  useEffect(() => {
    if (comboCount >= 3 && comboCount > prevCombo.current) {
      playComboSound();
      translateY.setValue(0);
      scaleAnim.setValue(0);
      opacityAnim.setValue(1);
      glowAnim.setValue(0);

      // Start glow pulse loop
      glowLoopRef.current?.stop();
      glowLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 350, useNativeDriver: true }),
        ])
      );
      glowLoopRef.current.start();

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 260,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(800),
          Animated.parallel([
            Animated.timing(opacityAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: -40, duration: 400, useNativeDriver: true }),
          ]),
        ]),
      ]).start(() => {
        glowLoopRef.current?.stop();
        glowAnim.setValue(0);
      });
    }
    prevCombo.current = comboCount;
  }, [comboCount]);

  if (comboCount < 3) return null;

  const label = comboCount >= 7 ? "ULTRA COMBO" : comboCount >= 5 ? "MEGA COMBO" : "COMBO";
  const color = comboCount >= 7 ? colors.neonPink : comboCount >= 5 ? colors.neonCyan : colors.combo;

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.5] });

  return (
    <View style={styles.comboOverlay}>
      {/* Background glow halo */}
      <Animated.View
        style={[
          styles.comboHalo,
          {
            backgroundColor: color,
            opacity: glowOpacity,
            transform: [{ scale: scaleAnim }, { translateY }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.comboPill,
          {
            backgroundColor: color + "28",
            borderColor: color + "99",
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }, { translateY }],
          },
        ]}
      >
        <Text style={[styles.comboEmoji]}>
          {comboCount >= 7 ? "⚡" : comboCount >= 5 ? "🔥" : "✨"}
        </Text>
        <Text style={[styles.comboLabel, { color }]}>
          {label} ×{comboMultiplier % 1 === 0 ? comboMultiplier : comboMultiplier.toFixed(1)}
        </Text>
      </Animated.View>
    </View>
  );
}

function ResultModal() {
  const colors = useColors();
  const {
    isFinished, didWin, score, foundWords, puzzle,
    startGame, startNextLevel, nextLevel, difficulty,
    category, xpGained, coinsGained, comboCount, isDaily,
    xp, playerLevel, currentLevelIdx, puzzleKey,
    addCoins, resumeWithExtraTime, completedLevelsCount,
  } = useGame();

  const prevLevel = getPlayerLevel(xp - xpGained);
  const didLevelUp = didWin && playerLevel > prevLevel;

  // ── Entry animations ──────────────────────────────────────────────────────
  const backdropOpacity  = useRef(new Animated.Value(0)).current;
  const modalScale       = useRef(new Animated.Value(0.72)).current;
  const modalOpacity     = useRef(new Animated.Value(0)).current;
  const emojiScale       = useRef(new Animated.Value(0)).current;
  const titleSlide       = useRef(new Animated.Value(22)).current;
  const titleOpacity     = useRef(new Animated.Value(0)).current;
  const scoreSlide       = useRef(new Animated.Value(28)).current;
  const scoreOpacity     = useRef(new Animated.Value(0)).current;
  const rewardsSlide     = useRef(new Animated.Value(24)).current;
  const rewardsOpacity   = useRef(new Animated.Value(0)).current;
  const comboSlide       = useRef(new Animated.Value(20)).current;
  const comboOpacity     = useRef(new Animated.Value(0)).current;
  const levelUpSlide     = useRef(new Animated.Value(20)).current;
  const levelUpOpacity   = useRef(new Animated.Value(0)).current;
  const btnsSlide        = useRef(new Animated.Value(30)).current;
  const btnsOpacity      = useRef(new Animated.Value(0)).current;

  // ── XP bar ────────────────────────────────────────────────────────────────
  const xpBarWidth       = useRef(new Animated.Value(0)).current;

  // ── Counted values ────────────────────────────────────────────────────────
  const [countedXP, setCountedXP]       = useState(0);
  const [countedCoins, setCountedCoins] = useState(0);
  const [countedScore, setCountedScore] = useState(0);

  // ── Combo glow pulse ──────────────────────────────────────────────────────
  const comboGlow        = useRef(new Animated.Value(0)).current;
  const comboGlowLoop    = useRef<Animated.CompositeAnimation | null>(null);

  // ── Level-up pulse ────────────────────────────────────────────────────────
  const levelUpPulse     = useRef(new Animated.Value(1)).current;
  const levelUpGlow      = useRef(new Animated.Value(0)).current;
  const levelUpLoop      = useRef<Animated.CompositeAnimation | null>(null);

  // ── Border glow pulse (win) ───────────────────────────────────────────────
  const borderGlow       = useRef(new Animated.Value(0)).current;
  const borderGlowLoop   = useRef<Animated.CompositeAnimation | null>(null);

  const [showConfetti, setShowConfetti] = useState(false);
  const [coinsDoubled, setCoinsDoubled] = useState(false);
  const [extraTimeUsed, setExtraTimeUsed] = useState(false);
  const rewardPurposeRef = useRef<"coins" | "time">("coins");

  // Reset extra-time gate whenever a fresh puzzle loads (new game or next level)
  useEffect(() => {
    setExtraTimeUsed(false);
  }, [puzzleKey]);

  const onAdRewarded = useCallback(() => {
    if (rewardPurposeRef.current === "coins") {
      addCoins(coinsGained);
      setCoinsDoubled(true);
      setCountedCoins((c) => c + coinsGained);
    } else {
      setExtraTimeUsed(true);   // lock out button so it can't be used twice in one game
      resumeWithExtraTime(30);
    }
  }, [addCoins, coinsGained, resumeWithExtraTime]);

  const {
    isAdReady: isRewardAdReady,
    isAdLoading: isRewardAdLoading,
    isSupported: isRewardAdSupported,
    showAd: showRewardAd,
  } = useWatchAd(onAdRewarded);
  const { showAd: showInterstitialAd } = useInterstitialAd();

  const countUpRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function runCountUp() {
    let step = 0;
    const STEPS = 28;
    const INTERVAL = 36;
    if (countUpRef.current) clearInterval(countUpRef.current);
    countUpRef.current = setInterval(() => {
      step++;
      const t = step / STEPS;
      const ease = 1 - Math.pow(1 - t, 3);
      setCountedXP(Math.round(ease * xpGained));
      setCountedCoins(Math.round(ease * coinsGained));
      setCountedScore(Math.round(ease * score));
      if (step >= STEPS) {
        clearInterval(countUpRef.current!);
        countUpRef.current = null;
      }
    }, INTERVAL);
  }

  useEffect(() => {
    if (isFinished) {
      // Reset all
      backdropOpacity.setValue(0);
      modalScale.setValue(0.72);
      modalOpacity.setValue(0);
      emojiScale.setValue(0);
      titleSlide.setValue(22);
      titleOpacity.setValue(0);
      scoreSlide.setValue(28);
      scoreOpacity.setValue(0);
      rewardsSlide.setValue(24);
      rewardsOpacity.setValue(0);
      comboSlide.setValue(20);
      comboOpacity.setValue(0);
      levelUpSlide.setValue(20);
      levelUpOpacity.setValue(0);
      btnsSlide.setValue(30);
      btnsOpacity.setValue(0);
      xpBarWidth.setValue(0);
      setCountedXP(0);
      setCountedCoins(0);
      setCountedScore(0);
      setCoinsDoubled(false);
      // extraTimeUsed is NOT reset here — it resets per new puzzle (see puzzleKey effect)

      if (didWin) {
        playLevelCompleteSound();
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3500);
      } else {
        playGameOverSound();
      }

      // Staggered entrance sequence
      Animated.sequence([
        // 1. Backdrop + modal pop in together
        Animated.parallel([
          Animated.timing(backdropOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
          Animated.spring(modalScale, { toValue: 1, tension: 120, friction: 9, useNativeDriver: true }),
          Animated.timing(modalOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        ]),
        // 2. Emoji burst
        Animated.spring(emojiScale, { toValue: 1, tension: 320, friction: 6, useNativeDriver: true }),
        // 3. Title
        Animated.parallel([
          Animated.spring(titleSlide, { toValue: 0, tension: 180, friction: 10, useNativeDriver: true }),
          Animated.timing(titleOpacity, { toValue: 1, duration: 240, useNativeDriver: true }),
        ]),
        // 4. Score box
        Animated.parallel([
          Animated.spring(scoreSlide, { toValue: 0, tension: 160, friction: 11, useNativeDriver: true }),
          Animated.timing(scoreOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
        ]),
        // 5. Rewards (XP + Coins) — count-up fires here
        Animated.parallel([
          Animated.spring(rewardsSlide, { toValue: 0, tension: 160, friction: 11, useNativeDriver: true }),
          Animated.timing(rewardsOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
          Animated.timing(xpBarWidth, { toValue: 1, duration: 900, useNativeDriver: false }),
        ]),
      ]).start(() => {
        // Count-up after rewards reveal
        runCountUp();

        // Combo badge
        if (comboCount >= 3) {
          Animated.parallel([
            Animated.spring(comboSlide, { toValue: 0, tension: 140, friction: 10, useNativeDriver: true }),
            Animated.timing(comboOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
          ]).start(() => {
            comboGlowLoop.current = Animated.loop(
              Animated.sequence([
                Animated.timing(comboGlow, { toValue: 1, duration: 700, useNativeDriver: true }),
                Animated.timing(comboGlow, { toValue: 0.2, duration: 700, useNativeDriver: true }),
              ])
            );
            comboGlowLoop.current.start();
          });
        }

        // Level-up banner
        if (didLevelUp) {
          Animated.parallel([
            Animated.spring(levelUpSlide, { toValue: 0, tension: 120, friction: 9, useNativeDriver: true }),
            Animated.timing(levelUpOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          ]).start(() => {
            levelUpLoop.current = Animated.loop(
              Animated.sequence([
                Animated.parallel([
                  Animated.spring(levelUpPulse, { toValue: 1.03, tension: 200, friction: 6, useNativeDriver: true }),
                  Animated.timing(levelUpGlow, { toValue: 1, duration: 600, useNativeDriver: true }),
                ]),
                Animated.parallel([
                  Animated.spring(levelUpPulse, { toValue: 1, tension: 200, friction: 6, useNativeDriver: true }),
                  Animated.timing(levelUpGlow, { toValue: 0.3, duration: 600, useNativeDriver: true }),
                ]),
              ])
            );
            levelUpLoop.current.start();
          });
        }

        // Buttons always last
        Animated.parallel([
          Animated.spring(btnsSlide, { toValue: 0, tension: 130, friction: 11, useNativeDriver: true }),
          Animated.timing(btnsOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
        ]).start();

        // Border glow loop for win
        if (didWin) {
          borderGlowLoop.current = Animated.loop(
            Animated.sequence([
              Animated.timing(borderGlow, { toValue: 1, duration: 900, useNativeDriver: false }),
              Animated.timing(borderGlow, { toValue: 0.2, duration: 900, useNativeDriver: false }),
            ])
          );
          borderGlowLoop.current.start();
        }
      });
    } else {
      // Reset on dismiss
      borderGlowLoop.current?.stop();
      comboGlowLoop.current?.stop();
      levelUpLoop.current?.stop();
      if (countUpRef.current) clearInterval(countUpRef.current);
      setShowConfetti(false);
    }

    return () => {
      borderGlowLoop.current?.stop();
      comboGlowLoop.current?.stop();
      levelUpLoop.current?.stop();
      if (countUpRef.current) clearInterval(countUpRef.current);
    };
  }, [isFinished, didWin]);

  if (!isFinished || !puzzle) return null;

  const total = puzzle.placedWords.length;
  const found = foundWords.length;
  const levelNum = getLevelNumber(currentLevelIdx);
  const totalLevels = getLevelsForDifficulty(difficulty);
  const isLastLevel = nextLevel === null;

  const comboGlowOpacity = comboGlow.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.38] });
  const levelUpGlowOpacity = levelUpGlow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.8] });
  const borderShadowRadius = borderGlow.interpolate({ inputRange: [0, 1], outputRange: [10, 28] });
  const comboLabel = comboCount >= 7 ? "ULTRA COMBO" : comboCount >= 5 ? "MEGA COMBO" : "HOT COMBO";
  const comboColor = comboCount >= 7 ? "#ff3bff" : comboCount >= 5 ? "#00d4ff" : colors.combo;

  return (
    <Modal transparent visible={isFinished} animationType="none" statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(4,0,18,0.90)", opacity: backdropOpacity }]} />
      <ConfettiView visible={showConfetti} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.overlay}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        overScrollMode="never"
      >
        <Animated.View
            style={[
              styles.modal,
              {
                backgroundColor: "#120428",
                borderColor: didWin ? "#c8900a" : "#ff3b5c",
                borderWidth: 1.5,
                shadowColor: didWin ? "#f5c518" : "#ff3b5c",
                shadowOpacity: didWin ? 0.5 : 0.35,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 0 },
                transform: [{ scale: modalScale }],
                opacity: modalOpacity,
              },
            ]}
          >
            {/* Top accent bar */}
            <View style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 3,
              backgroundColor: didWin ? "#f5c518" : "#ff3b5c",
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
            }} />

            {/* Emoji */}
            <Animated.Text style={[styles.resultEmoji, { transform: [{ scale: emojiScale }] }]}>
              {didWin ? (isLastLevel ? "🏆" : "🎉") : "⏰"}
            </Animated.Text>

            {/* Title */}
            <Animated.Text style={[styles.resultTitle, {
              color: didWin ? "#f5c518" : "#f5e6a0",
              opacity: titleOpacity,
              transform: [{ translateY: titleSlide }],
            }]}>
              {didWin ? (isLastLevel ? "All Done!" : "Level Clear!") : "Time's Up!"}
            </Animated.Text>

            {/* Badge + subtitle */}
            <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleSlide }], alignItems: "center", gap: 6 }}>
              <View style={[styles.levelBadge, { backgroundColor: "#2a0a50", borderColor: "#5a2a9e" }]}>
                <Text style={[styles.levelBadgeText, { color: "#8a6aaa" }]}>
                  Level {levelNum}/{totalLevels} · {wordCategories[category].emoji}{" "}
                  <Text style={{ textTransform: "capitalize" }}>{difficulty}</Text>
                </Text>
              </View>
              <Text style={[styles.resultSubtitle, { color: "#8a6aaa" }]}>
                {didWin
                  ? isLastLevel ? "You've conquered every level!" : `All ${total} words found!`
                  : `Found ${found} of ${total} words`}
              </Text>
            </Animated.View>

            {/* Score box */}
            <Animated.View style={[styles.scoreBox, {
              backgroundColor: "#0a0118",
              borderWidth: 1,
              borderColor: "#3a1a6e",
              borderRadius: 18,
              opacity: scoreOpacity,
              transform: [{ translateY: scoreSlide }],
            }]}>
              <View style={styles.scoreMain}>
                <Text style={{ fontSize: 22, color: "#f5c518" }}>★</Text>
                <Text style={[styles.finalScore, {
                  color: "#f5c518",
                  textShadowColor: "#e8a000",
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 6,
                }]}>{countedScore}</Text>
                <Text style={[styles.finalScoreLabel, { color: "#8a6aaa" }]}>pts</Text>
              </View>
            </Animated.View>

            {/* XP + Coins reward cards */}
            <Animated.View style={[rStyles.rewardCards, {
              opacity: rewardsOpacity,
              transform: [{ translateY: rewardsSlide }],
            }]}>
              {/* XP card */}
              <View style={rStyles.rewardCard}>
                <View style={rStyles.rewardCardInner}>
                  <Text style={rStyles.rewardCardIcon}>⚡</Text>
                  <Text style={[rStyles.rewardCardValue, { color: "#a78bfa" }]}>+{countedXP}</Text>
                  <Text style={rStyles.rewardCardLabel}>XP</Text>
                  {/* XP bar */}
                  <View style={rStyles.xpBarTrack}>
                    <Animated.View style={[rStyles.xpBarFill, {
                      width: xpBarWidth.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
                    }]} />
                  </View>
                </View>
              </View>

              {/* Coins card */}
              <View style={[rStyles.rewardCard, { borderColor: "#a0660a" }]}>
                <View style={rStyles.rewardCardInner}>
                  <Text style={rStyles.rewardCardIcon}>💰</Text>
                  <Text style={[rStyles.rewardCardValue, { color: "#f5c518" }]}>+{countedCoins}</Text>
                  <Text style={rStyles.rewardCardLabel}>COINS</Text>
                  <View style={[rStyles.xpBarTrack, { backgroundColor: "#2a1000" }]}>
                    <Animated.View style={[rStyles.xpBarFill, {
                      backgroundColor: "#f5c518",
                      width: xpBarWidth.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
                    }]} />
                  </View>
                </View>
              </View>

              {isDaily && (
                <View style={[rStyles.rewardCard, { borderColor: "#008080" }]}>
                  <View style={rStyles.rewardCardInner}>
                    <Text style={rStyles.rewardCardIcon}>🌟</Text>
                    <Text style={[rStyles.rewardCardValue, { color: "#00d4ff", fontSize: 14 }]}>DAILY</Text>
                    <Text style={rStyles.rewardCardLabel}>BONUS</Text>
                  </View>
                </View>
              )}
            </Animated.View>

            {/* Combo celebration badge */}
            {comboCount >= 3 && (
              <Animated.View style={{
                opacity: comboOpacity,
                transform: [{ translateY: comboSlide }],
                width: "100%",
              }}>
                <Animated.View style={[rStyles.comboCelebration, {
                  borderColor: comboColor + "80",
                  backgroundColor: comboColor + "12",
                }]}>
                  <Animated.View style={[StyleSheet.absoluteFillObject, {
                    borderRadius: 14, backgroundColor: comboColor, opacity: comboGlowOpacity,
                  }]} />
                  <Text style={{ fontSize: 22 }}>
                    {comboCount >= 7 ? "⚡" : comboCount >= 5 ? "🔥" : "✨"}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[rStyles.comboCelebrationTitle, { color: comboColor }]}>
                      {comboLabel}
                    </Text>
                    <Text style={rStyles.comboCelebrationSub}>
                      {comboCount} words in a row!
                    </Text>
                  </View>
                  <Text style={[rStyles.comboMultiplier, { color: comboColor }]}>×{comboCount >= 7 ? "3" : comboCount >= 5 ? "2.5" : "2"}</Text>
                </Animated.View>
              </Animated.View>
            )}

            {/* Level-up banner */}
            {didLevelUp && (
              <Animated.View style={{
                opacity: levelUpOpacity,
                transform: [{ translateY: levelUpSlide }, { scale: levelUpPulse }],
                width: "100%",
              }}>
                <View style={[rStyles.levelUpBanner]}>
                  <Animated.View style={[StyleSheet.absoluteFillObject, {
                    borderRadius: 16, backgroundColor: "#f5c518", opacity: levelUpGlowOpacity,
                  }]} />
                  <Text style={{ fontSize: 28 }}>⬆️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={rStyles.levelUpTitle}>LEVEL UP!</Text>
                    <Text style={rStyles.levelUpNew}>→ Level {playerLevel} · {getLevelName(playerLevel)}</Text>
                  </View>
                  <Text style={rStyles.levelUpStars}>✦✦✦</Text>
                </View>
              </Animated.View>
            )}

            {/* Share buttons on level-up */}
            {didLevelUp && (
              <Animated.View style={[styles.shareRow, { opacity: levelUpOpacity }]}>
                <Pressable
                  onPress={() => shareViaWhatsApp(playerLevel, score)}
                  style={({ pressed }) => [styles.shareBtn, styles.whatsappBtn, { opacity: pressed ? 0.8 : 1 }]}
                >
                  <Text style={styles.shareBtnIcon}>💬</Text>
                  <Text style={[styles.shareBtnText, { color: "#ffffff" }]}>WhatsApp</Text>
                </Pressable>
                <Pressable
                  onPress={() => shareResult(playerLevel, score)}
                  style={({ pressed }) => [styles.shareBtn, styles.genericShareBtn, { opacity: pressed ? 0.8 : 1 }]}
                >
                  <Text style={styles.shareBtnIcon}>↗</Text>
                  <Text style={[styles.shareBtnText, { color: "#d4aaff" }]}>Share</Text>
                </Pressable>
              </Animated.View>
            )}

            {/* Next-level preview */}
            {didWin && nextLevel && (
              <Animated.View style={[styles.nextHint, {
                backgroundColor: colors.primary + "15",
                borderColor: colors.primary + "35",
                opacity: btnsOpacity,
              }]}>
                <Text style={{ fontSize: 14, color: colors.primary }}>»</Text>
                <Text style={[styles.nextHintText, { color: colors.primary }]}>
                  Next:{" "}
                  <Text style={{ fontFamily: "Inter_700Bold" }}>{wordCategories[nextLevel.category].label}</Text>
                  {" · "}
                  <Text style={{ textTransform: "capitalize" }}>{nextLevel.difficulty}</Text>
                </Text>
              </Animated.View>
            )}

            {/* Action buttons */}
            <Animated.View style={[styles.modalBtns, { opacity: btnsOpacity, transform: [{ translateY: btnsSlide }] }]}>
              {/* ── Ad reward row ─────────────────────────────────────────── */}
              {isRewardAdSupported && (
                <>
                  {didWin && !coinsDoubled && (
                    <ScaleButton
                      onPress={() => {
                        rewardPurposeRef.current = "coins";
                        playTapSound();
                        showRewardAd();
                      }}
                      disabled={!isRewardAdReady}
                      style={[styles.modalBtn, {
                        backgroundColor: "#002218",
                        borderWidth: 1.5,
                        borderColor: isRewardAdReady ? "#00c97a" : "#1a4a30",
                        opacity: isRewardAdReady ? 1 : 0.55,
                      }]}
                    >
                      <Text style={{ fontSize: 16 }}>📺</Text>
                      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 14, color: "#00e88a" }}>
                        {isRewardAdLoading ? "Loading ad..." : "2× Coins"}
                      </Text>
                      {isRewardAdReady && (
                        <View style={{ backgroundColor: "#00c97a", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginLeft: "auto" }}>
                          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 11, color: "#001a11" }}>+{coinsGained} 💰</Text>
                        </View>
                      )}
                    </ScaleButton>
                  )}
                  {!didWin && !extraTimeUsed && (
                    <ScaleButton
                      onPress={() => {
                        rewardPurposeRef.current = "time";
                        playTapSound();
                        showRewardAd();
                      }}
                      disabled={!isRewardAdReady}
                      style={[styles.modalBtn, {
                        backgroundColor: "#001828",
                        borderWidth: 1.5,
                        borderColor: isRewardAdReady ? "#00a0c8" : "#1a2a4a",
                        opacity: isRewardAdReady ? 1 : 0.55,
                      }]}
                    >
                      <Text style={{ fontSize: 16 }}>📺</Text>
                      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 14, color: "#00c8f0" }}>
                        {isRewardAdLoading ? "Loading ad..." : "Continue +30s"}
                      </Text>
                      {isRewardAdReady && (
                        <View style={{ backgroundColor: "#00a0c8", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginLeft: "auto" }}>
                          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 11, color: "#00101a" }}>FREE ⏱</Text>
                        </View>
                      )}
                    </ScaleButton>
                  )}
                </>
              )}
              {didWin && nextLevel ? (
                <>
                  <ScaleButton
                    onPress={() => {
                      playTapSound();
                      if (completedLevelsCount > 0 && completedLevelsCount % 4 === 0) {
                        showInterstitialAd(startNextLevel);
                      } else {
                        startNextLevel();
                      }
                    }}
                    style={[styles.modalBtn, styles.primaryBtn, {
                      backgroundColor: "#4a1d96",
                      borderWidth: 2,
                      borderColor: "#f5c518",
                      shadowColor: "#f5c518",
                      shadowOpacity: 0.3,
                      shadowRadius: 10,
                      shadowOffset: { width: 0, height: 0 },
                    }]}
                  >
                    <Text style={{ fontSize: 20, color: "#f5c518" }}>▶</Text>
                    <Text style={[styles.primaryBtnText, { color: "#f5c518" }]}>Next Level</Text>
                  </ScaleButton>
                  <View style={styles.btnRow}>
                    <ScaleButton
                      onPress={() => { playTapSound(); startGame(); }}
                      style={[styles.modalBtn, styles.secondaryBtn, styles.flex1, { backgroundColor: "#1e0a40", borderColor: "#3a1a6e" }]}
                    >
                      <Text style={{ fontSize: 17, color: "#c8a8f0" }}>↺</Text>
                      <Text style={[styles.secondaryBtnText, { color: "#c8a8f0" }]}>Replay</Text>
                    </ScaleButton>
                    <ScaleButton
                      onPress={() => { playTapSound(); router.back(); }}
                      style={[styles.modalBtn, styles.secondaryBtn, styles.flex1, { backgroundColor: "#1e0a40", borderColor: "#3a1a6e" }]}
                    >
                      <Text style={{ fontSize: 17, color: "#c8a8f0" }}>⌂</Text>
                      <Text style={[styles.secondaryBtnText, { color: "#c8a8f0" }]}>Home</Text>
                    </ScaleButton>
                  </View>
                </>
              ) : didWin && isLastLevel ? (
                <>
                  <ScaleButton
                    onPress={() => { playTapSound(); startGame(); }}
                    style={[styles.modalBtn, styles.primaryBtn, {
                      backgroundColor: "#4a1d96", borderWidth: 2, borderColor: "#f5c518",
                      shadowColor: "#f5c518", shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 0 },
                    }]}
                  >
                    <Text style={{ fontSize: 18, color: "#f5c518" }}>↺</Text>
                    <Text style={[styles.primaryBtnText, { color: "#f5c518" }]}>Play Again</Text>
                  </ScaleButton>
                  <ScaleButton
                    onPress={() => { playTapSound(); router.back(); }}
                    style={[styles.modalBtn, styles.secondaryBtn, { backgroundColor: "#1e0a40", borderColor: "#3a1a6e" }]}
                  >
                    <Text style={{ fontSize: 18, color: "#c8a8f0" }}>⌂</Text>
                    <Text style={[styles.secondaryBtnText, { color: "#c8a8f0" }]}>Home</Text>
                  </ScaleButton>
                </>
              ) : (
                <>
                  <ScaleButton
                    onPress={() => { playTapSound(); startGame(); }}
                    style={[styles.modalBtn, styles.primaryBtn, {
                      backgroundColor: "#4a1d96", borderWidth: 2, borderColor: "#c8900a",
                      shadowColor: "#f5c518", shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
                    }]}
                  >
                    <Text style={{ fontSize: 18, color: "#f5c518" }}>↺</Text>
                    <Text style={[styles.primaryBtnText, { color: "#f5c518" }]}>Try Again</Text>
                  </ScaleButton>
                  <ScaleButton
                    onPress={() => { playTapSound(); router.back(); }}
                    style={[styles.modalBtn, styles.secondaryBtn, { backgroundColor: "#1e0a40", borderColor: "#3a1a6e" }]}
                  >
                    <Text style={{ fontSize: 18, color: "#c8a8f0" }}>⌂</Text>
                    <Text style={[styles.secondaryBtnText, { color: "#c8a8f0" }]}>Home</Text>
                  </ScaleButton>
                </>
              )}
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </Modal>
  );
}

const rStyles = StyleSheet.create({
  rewardCards: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  rewardCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#5a2a9e",
    backgroundColor: "#0d0224",
    overflow: "hidden",
  },
  rewardCardInner: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 4,
  },
  rewardCardIcon: { fontSize: 22 },
  rewardCardValue: { fontFamily: "Inter_700Bold", fontSize: 22, lineHeight: 26 },
  rewardCardLabel: { fontFamily: "Inter_700Bold", fontSize: 9, color: "#6040a0", letterSpacing: 1.4 },
  xpBarTrack: {
    width: "88%",
    height: 4,
    backgroundColor: "#1e0840",
    borderRadius: 2,
    marginTop: 4,
    overflow: "hidden",
  },
  xpBarFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#9b5fff",
  },
  comboCelebration: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  comboCelebrationTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    letterSpacing: 1,
  },
  comboCelebrationSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#7a5a9e",
    marginTop: 1,
  },
  comboMultiplier: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: -0.5,
  },
  levelUpBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#f5c518",
    backgroundColor: "#1a0a08",
    overflow: "hidden",
  },
  levelUpTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#ffe066",
    letterSpacing: 1.5,
  },
  levelUpNew: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: "#c8a060",
    marginTop: 2,
  },
  levelUpStars: {
    fontSize: 14,
    color: "#f5c518",
    letterSpacing: 3,
  },
});

function WatchAdBar() {
  const { rewardHint, isPlaying } = useGame();
  const { adState, isAdReady, isAdLoading, isSupported, showAd } = useWatchAd(rewardHint);
  const [showMsg, setShowMsg] = useState<string | null>(null);
  const msgAnim = useRef(new Animated.Value(0)).current;

  const flashMsg = (msg: string) => {
    setShowMsg(msg);
    Animated.sequence([
      Animated.timing(msgAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(msgAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setShowMsg(null));
  };

  const handlePress = async () => {
    if (!isAdReady) return;
    playTapSound();
    const ok = await showAd();
    if (!ok) flashMsg("Ad load nahi hua, thodi der baad try karein 🙏");
  };

  if (!isSupported || !isPlaying) return null;

  const isError = adState === "error";
  const label = isAdLoading
    ? "📺  Ad load ho raha hai..."
    : isError
    ? "📺  Ad unavailable"
    : adState === "showing"
    ? "📺  Watching..."
    : "📺  Watch Ad · Free Hint";

  const bg = isAdReady ? "#003322" : "#1a0838";
  const border = isAdReady ? "#00c97a" : "#3a1a6e";
  const textColor = isAdReady ? "#00e88a" : "#6040a0";

  return (
    <View style={{ paddingHorizontal: 14, paddingVertical: 5 }}>
      <Pressable
        onPress={handlePress}
        disabled={!isAdReady}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: bg,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: border,
          paddingVertical: 7,
          paddingHorizontal: 14,
          gap: 6,
          opacity: isAdReady ? 1 : 0.6,
        }}
      >
        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: textColor }}>
          {label}
        </Text>
        {isAdReady && (
          <View style={{ backgroundColor: "#00c97a", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 10, color: "#001a11" }}>+1 💡</Text>
          </View>
        )}
      </Pressable>
      {showMsg && (
        <Animated.Text style={{
          opacity: msgAnim,
          textAlign: "center",
          color: "#ff6060",
          fontFamily: "Inter_500Medium",
          fontSize: 11,
          marginTop: 4,
        }}>
          {showMsg}
        </Animated.Text>
      )}
    </View>
  );
}

export default function GameScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { puzzle, category, difficulty, hints, useHint, isPlaying, foundWords } = useGame();

  const topInset = insets.top > 0 ? insets.top : 24;
  const bottomInset = insets.bottom > 0 ? insets.bottom : 16;

  const hintScale = useRef(new Animated.Value(1)).current;

  const handleHint = () => {
    if (hints <= 0) return;
    playTapSound();
    Animated.sequence([
      Animated.spring(hintScale, { toValue: 0.85, tension: 300, friction: 5, useNativeDriver: true }),
      Animated.spring(hintScale, { toValue: 1, tension: 200, friction: 7, useNativeDriver: true }),
    ]).start();
    useHint();
  };

  return (
    <View style={[styles.screen, { backgroundColor: "#0f041e" }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topInset + 4,
            backgroundColor: "#0f041e",
            borderBottomColor: "#3a1a6e",
          },
        ]}
      >
        <ScaleButton
          onPress={() => { playTapSound(); router.back(); }}
          style={[styles.headerBtn, {
            backgroundColor: "#1a0838",
            borderColor: "#4a2080",
            shadowColor: "#000",
            shadowOpacity: 0.35,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
          }]}
        >
          <Text style={{ fontSize: 24, color: "#c8a8f0", lineHeight: 26 }}>←</Text>
        </ScaleButton>

        <View style={styles.headerTitle}>
          <Text style={[styles.categoryText, { color: "#e8d8ff" }]}>
            {wordCategories[category].emoji} {category.charAt(0).toUpperCase() + category.slice(1)}
          </Text>
          <Text style={[styles.difficultyBadge, { color: "#a080c8" }]}>
            {difficulty} · {foundWords.length}/{puzzle?.placedWords.length ?? 0} found
          </Text>
        </View>

        {/* Hint button */}
        <Animated.View style={{ transform: [{ scale: hintScale }] }}>
          <Pressable
            onPress={handleHint}
            disabled={!isPlaying || hints <= 0}
            style={[
              styles.headerBtn,
              {
                backgroundColor: hints > 0 && isPlaying ? "#002a3a" : "#1a0838",
                borderColor: hints > 0 && isPlaying ? "#00b8d8" : "#3a1a6e",
                shadowColor: "#000",
                shadowOpacity: 0.3,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
              },
            ]}
          >
            <Text style={{ fontSize: 16 }}>💡</Text>
            {hints > 0 && (
              <Text style={[styles.hintCount, { color: "#00d4ff" }]}>{hints}</Text>
            )}
          </Pressable>
        </Animated.View>
      </View>

      {/* Timer + Score */}
      <TimerBar />

      {/* Watch Ad for Free Hint */}
      <WatchAdBar />

      {/* Game area — scroll disabled while playing to prevent grid shifting during drag */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(bottomInset, 8) }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.gridContainer}>
          <GameGrid />
        </View>
        <WordList />
      </ScrollView>

      <ResultModal />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: "space-between",
    gap: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    flexDirection: "row",
    gap: 2,
  },
  hintCount: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
  },
  headerTitle: { alignItems: "center", gap: 2, flex: 1 },
  categoryText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  difficultyBadge: { fontFamily: "Inter_500Medium", fontSize: 11, textTransform: "capitalize" },
  scrollContent: { gap: 10, paddingTop: 8 },
  gridContainer: { paddingHorizontal: 12, alignItems: "center" },
  overlay: {
    flexGrow: 1,
    backgroundColor: "rgba(0,0,0,0.82)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    gap: 10,
  },
  resultEmoji: { fontSize: 54 },
  resultTitle: { fontFamily: "Inter_700Bold", fontSize: 26 },
  resultSubtitle: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  levelBadgeText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  scoreBox: {
    width: "100%",
    borderRadius: 14,
    padding: 14,
    gap: 10,
    alignItems: "center",
  },
  scoreMain: { flexDirection: "row", alignItems: "center", gap: 8 },
  finalScore: { fontFamily: "Inter_700Bold", fontSize: 38 },
  finalScoreLabel: { fontFamily: "Inter_400Regular", fontSize: 14, alignSelf: "flex-end", marginBottom: 4 },
  rewardRow: { flexDirection: "row", gap: 16 },
  rewardItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  rewardIcon: { fontSize: 14 },
  rewardValue: { fontFamily: "Inter_700Bold", fontSize: 13 },
  comboBadge: {
    width: "100%",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  comboBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  levelUpBanner: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  levelUpEmoji: { fontSize: 24 },
  levelUpTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
  levelUpSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  shareRow: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
  },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  whatsappBtn: {
    backgroundColor: "#128c7e",
    borderColor: "#25d366",
  },
  genericShareBtn: {
    backgroundColor: "#1e0a40",
    borderColor: "#7c3aed",
  },
  shareBtnIcon: { fontSize: 16 },
  shareBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  nextHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: "stretch",
  },
  nextHintText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  modalBtns: { width: "100%", gap: 8, marginTop: 2 },
  btnRow: { flexDirection: "row", gap: 8 },
  flex1: { flex: 1 },
  modalBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
  },
  primaryBtn: {},
  primaryBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 },
  secondaryBtn: { borderWidth: 1 },
  secondaryBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  comboOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  comboHalo: {
    position: "absolute",
    width: 220,
    height: 70,
    borderRadius: 35,
    opacity: 0.3,
  },
  comboPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 30,
    borderWidth: 1.5,
  },
  comboEmoji: { fontSize: 22 },
  comboLabel: { fontFamily: "Inter_700Bold", fontSize: 19, letterSpacing: 0.5 },
});
