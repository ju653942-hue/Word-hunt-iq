import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useGame } from "@/context/GameContext";
import { playTapSound, playStartSound } from "@/utils/soundManager";
import {
  CATEGORIES,
  DAILY_REWARDS,
  Category,
  Difficulty,
  difficultyConfig,
  getDailyChallenge,
  getPlayerLevel,
  getXPThreshold,
  wordCategories,
} from "@/constants/wordData";

type RewardPhase = "entering" | "ready" | "claiming" | "claimed";

const drStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  card: {
    width: "100%",
    maxWidth: 390,
    backgroundColor: "#10042a",
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "#c8900a",
    overflow: "hidden",
    shadowColor: "#f5c518",
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -4 },
  },
  topAccent: {
    height: 3,
    backgroundColor: "#ffe066",
    borderRadius: 2,
    marginHorizontal: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2a1250",
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: "#ffe066",
    letterSpacing: 0.8,
  },
  dayBadge: {
    backgroundColor: "#2a1060",
    borderWidth: 1,
    borderColor: "#5a2a9e",
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  dayBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: "#9b6dff",
    letterSpacing: 1,
  },
  giftArea: {
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  giftEmoji: { fontSize: 52 },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#0a2a14",
    borderWidth: 3,
    borderColor: "#00e676",
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    fontSize: 38,
    color: "#00e676",
    lineHeight: 46,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2a0e00",
    borderWidth: 1,
    borderColor: "#ff6b35",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginHorizontal: 22,
  },
  streakFire: { fontSize: 14 },
  streakText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#ff8c55",
  },
  calendarRow: {
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 22,
  },
  calDot: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1e0840",
    backgroundColor: "#0a021a",
    minHeight: 30,
    justifyContent: "center",
  },
  calDotPast: {
    borderColor: "#1a4a1a",
    backgroundColor: "#060e06",
  },
  calDotToday: {
    borderColor: "#ffe066",
    backgroundColor: "#1e0e00",
  },
  calDotBonus: {
    borderColor: "#7c3aed",
    backgroundColor: "#0e0420",
  },
  calDotLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: "#3a1a6e",
  },
  calDotLabelToday: { color: "#ffe066" },
  rewardRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 22,
  },
  rewardCardCoin: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#c8780a",
    backgroundColor: "#160800",
    gap: 2,
  },
  rewardCardHint: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#007a96",
    backgroundColor: "#00101a",
    gap: 2,
  },
  rewardCardIcon: { fontSize: 26 },
  rewardCardValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: "#ffe066",
  },
  rewardCardLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    color: "#c8780a",
    letterSpacing: 1.5,
  },
  claimBtn: {
    marginHorizontal: 22,
    backgroundColor: "#4a1d96",
    borderWidth: 2,
    borderColor: "#ffe066",
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    overflow: "hidden",
  },
  claimBtnGlow: {
    backgroundColor: "#ffe066",
    borderRadius: 14,
  },
  claimBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#ffe066",
    letterSpacing: 1.5,
  },
  claimBtnArrow: {
    fontSize: 22,
    color: "#ffe066",
    lineHeight: 24,
  },
  playBtn: {
    marginHorizontal: 22,
    marginBottom: 22,
    backgroundColor: "#006e38",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#00e676",
    shadowColor: "#00e676",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  playBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#ffffff",
    letterSpacing: 1,
  },
  cardContent: {
    gap: 14,
    paddingBottom: 22,
  },
});

function DailyRewardModal() {
  const { showDailyReward, claimDailyReward, dismissDailyReward, streakDay, streak } = useGame();

  const [localVisible, setLocalVisible] = useState(false);
  const [phase, setPhase] = useState<RewardPhase>("entering");
  const [reward, setReward] = useState<{ coins: number; hints: number } | null>(null);
  const [countedCoins, setCountedCoins] = useState(0);
  const [countedHints, setCountedHints] = useState(0);

  // Entry / exit
  const backdropAnim    = useRef(new Animated.Value(0)).current;
  const slideY          = useRef(new Animated.Value(420)).current;
  const cardScale       = useRef(new Animated.Value(0.88)).current;
  // Gift
  const giftScale       = useRef(new Animated.Value(0)).current;
  const giftBob         = useRef(new Animated.Value(0)).current;
  const giftRotate      = useRef(new Animated.Value(0)).current;
  // Button
  const btnScale        = useRef(new Animated.Value(1)).current;
  const btnGlow         = useRef(new Animated.Value(0)).current;
  // Post-claim
  const checkScale      = useRef(new Animated.Value(0)).current;
  const checkOpacity    = useRef(new Animated.Value(0)).current;
  const rewardSlide     = useRef(new Animated.Value(36)).current;
  const rewardOpacity   = useRef(new Animated.Value(0)).current;
  const playBtnSlide    = useRef(new Animated.Value(44)).current;
  const playBtnOpacity  = useRef(new Animated.Value(0)).current;

  const bobLoopRef  = useRef<Animated.CompositeAnimation | null>(null);
  const glowLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const countRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const rewardIdx = streakDay % DAILY_REWARDS.length;

  useEffect(() => {
    if (showDailyReward) {
      // Reset everything
      setPhase("entering");
      setReward(null);
      setCountedCoins(0);
      setCountedHints(0);
      backdropAnim.setValue(0);
      slideY.setValue(420);
      cardScale.setValue(0.88);
      giftScale.setValue(0);
      giftBob.setValue(0);
      giftRotate.setValue(0);
      btnScale.setValue(1);
      btnGlow.setValue(0);
      checkScale.setValue(0);
      checkOpacity.setValue(0);
      rewardSlide.setValue(36);
      rewardOpacity.setValue(0);
      playBtnSlide.setValue(44);
      playBtnOpacity.setValue(0);
      setLocalVisible(true);

      // Slide up backdrop + card together
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideY, { toValue: 0, tension: 62, friction: 12, useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }),
      ]).start(() => {
        // Gift pops in
        Animated.spring(giftScale, { toValue: 1, tension: 260, friction: 7, useNativeDriver: true }).start(() => {
          setPhase("ready");

          bobLoopRef.current = Animated.loop(
            Animated.sequence([
              Animated.timing(giftBob, { toValue: -10, duration: 750, useNativeDriver: true }),
              Animated.timing(giftBob, { toValue: 0,   duration: 750, useNativeDriver: true }),
            ])
          );
          bobLoopRef.current.start();

          glowLoopRef.current = Animated.loop(
            Animated.sequence([
              Animated.timing(btnGlow, { toValue: 1,   duration: 850, useNativeDriver: true }),
              Animated.timing(btnGlow, { toValue: 0.2, duration: 850, useNativeDriver: true }),
            ])
          );
          glowLoopRef.current.start();
        });
      });
    }

    return () => {
      bobLoopRef.current?.stop();
      glowLoopRef.current?.stop();
      if (countRef.current) clearInterval(countRef.current);
    };
  }, [showDailyReward]);

  const handleClaim = () => {
    if (phase !== "ready") return;
    setPhase("claiming");
    bobLoopRef.current?.stop();
    glowLoopRef.current?.stop();
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    playTapSound();

    const r = claimDailyReward();
    setReward(r);

    // Gift shakes then bursts
    Animated.sequence([
      Animated.timing(giftRotate, { toValue: 14,  duration: 65,  useNativeDriver: true }),
      Animated.timing(giftRotate, { toValue: -14, duration: 65,  useNativeDriver: true }),
      Animated.timing(giftRotate, { toValue: 10,  duration: 55,  useNativeDriver: true }),
      Animated.timing(giftRotate, { toValue: -10, duration: 55,  useNativeDriver: true }),
      Animated.timing(giftRotate, { toValue: 0,   duration: 50,  useNativeDriver: true }),
      Animated.spring(giftScale,  { toValue: 1.45, tension: 280, friction: 5, useNativeDriver: true }),
      Animated.spring(giftScale,  { toValue: 0,    tension: 200, friction: 8, useNativeDriver: true }),
    ]).start();

    // 460ms after, show claimed state
    setTimeout(() => {
      setPhase("claimed");

      // Checkmark pops in
      Animated.parallel([
        Animated.spring(checkScale,   { toValue: 1, tension: 320, friction: 7, useNativeDriver: true }),
        Animated.timing(checkOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();

      // Reward cards slide up
      Animated.parallel([
        Animated.spring(rewardSlide,   { toValue: 0, tension: 160, friction: 11, useNativeDriver: true }),
        Animated.timing(rewardOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
      ]).start();

      // Play button slides up 300ms later
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(playBtnSlide,   { toValue: 0, tension: 120, friction: 11, useNativeDriver: true }),
          Animated.timing(playBtnOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
        ]).start();
      }, 300);

      // Count up numbers
      let step = 0;
      const STEPS = 22;
      countRef.current = setInterval(() => {
        step++;
        const t = step / STEPS;
        setCountedCoins(Math.round(t * r.coins));
        if (r.hints > 0) setCountedHints(Math.round(t * r.hints));
        if (step >= STEPS && countRef.current) {
          clearInterval(countRef.current);
          countRef.current = null;
        }
      }, 38);
    }, 460);
  };

  const handleDismiss = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    playTapSound();
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.timing(slideY, { toValue: 420, duration: 260, useNativeDriver: true }),
      Animated.timing(cardScale, { toValue: 0.88, duration: 260, useNativeDriver: true }),
    ]).start(() => {
      setLocalVisible(false);
      dismissDailyReward();
    });
  };

  if (!localVisible) return null;

  const giftRotateDeg = giftRotate.interpolate({ inputRange: [-15, 15], outputRange: ["-15deg", "15deg"] });
  const glowOpacity   = btnGlow.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.55] });

  return (
    <Modal transparent visible={localVisible} animationType="none" statusBarTranslucent>
      {/* Animated backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(4,0,18,0.92)", opacity: backdropAnim }]} />

      {/* Card anchored to bottom */}
      <View style={drStyles.overlay}>
        <Animated.View style={[drStyles.card, { transform: [{ translateY: slideY }, { scale: cardScale }] }]}>

          {/* Top gold accent line */}
          <View style={drStyles.topAccent} />

          {/* Header */}
          <View style={drStyles.header}>
            <Text style={drStyles.headerTitle}>
              {phase === "claimed" ? "🎉 CLAIMED!" : "🎁 DAILY REWARD"}
            </Text>
            <View style={drStyles.dayBadge}>
              <Text style={drStyles.dayBadgeText}>DAY {rewardIdx + 1}/7</Text>
            </View>
          </View>

          {/* Gift / Check area */}
          <View style={drStyles.giftArea}>
            {phase !== "claimed" ? (
              <Animated.View style={{
                transform: [{ translateY: giftBob }, { scale: giftScale }, { rotate: giftRotateDeg }],
              }}>
                <Text style={drStyles.giftEmoji}>🎁</Text>
              </Animated.View>
            ) : (
              <Animated.View style={[drStyles.checkCircle, { opacity: checkOpacity, transform: [{ scale: checkScale }] }]}>
                <Text style={drStyles.checkMark}>✓</Text>
              </Animated.View>
            )}
          </View>

          {/* Streak badge */}
          {streak > 0 && (
            <View style={drStyles.streakBadge}>
              <Text style={drStyles.streakFire}>🔥</Text>
              <Text style={drStyles.streakText}>{streak} day streak</Text>
            </View>
          )}

          {/* 7-day progress dots */}
          <View style={drStyles.calendarRow}>
            {DAILY_REWARDS.map((dr, i) => {
              const isToday  = i === rewardIdx;
              const isPast   = i < rewardIdx;
              const isBonus  = i === DAILY_REWARDS.length - 1;
              return (
                <View key={i} style={[
                  drStyles.calDot,
                  isPast  && drStyles.calDotPast,
                  isToday && drStyles.calDotToday,
                  isBonus && !isPast && !isToday && drStyles.calDotBonus,
                ]}>
                  <Text style={[drStyles.calDotLabel, isToday && drStyles.calDotLabelToday]}>
                    {isBonus ? "🌟" : isPast ? "✓" : `${i + 1}`}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Reward cards — always visible, animate on claim */}
          <Animated.View style={[
            drStyles.rewardRow,
            phase === "claimed"
              ? { opacity: rewardOpacity, transform: [{ translateY: rewardSlide }] }
              : { opacity: 1 },
          ]}>
            <View style={drStyles.rewardCardCoin}>
              <Text style={drStyles.rewardCardIcon}>💰</Text>
              <Text style={drStyles.rewardCardValue}>
                {phase === "claimed" ? `+${countedCoins}` : `+${DAILY_REWARDS[rewardIdx].coins}`}
              </Text>
              <Text style={drStyles.rewardCardLabel}>COINS</Text>
            </View>
            {DAILY_REWARDS[rewardIdx].hints > 0 && (
              <View style={drStyles.rewardCardHint}>
                <Text style={drStyles.rewardCardIcon}>💡</Text>
                <Text style={[drStyles.rewardCardValue, { color: "#00d4ff" }]}>
                  {phase === "claimed" ? `+${countedHints}` : `+${DAILY_REWARDS[rewardIdx].hints}`}
                </Text>
                <Text style={[drStyles.rewardCardLabel, { color: "#0096b0" }]}>HINTS</Text>
              </View>
            )}
          </Animated.View>

          {/* Action button */}
          {phase !== "claimed" ? (
            <Pressable
              onPress={handleClaim}
              onPressIn={() => Animated.spring(btnScale, { toValue: 0.94, tension: 300, friction: 8, useNativeDriver: true }).start()}
              onPressOut={() => Animated.spring(btnScale, { toValue: 1, tension: 220, friction: 8, useNativeDriver: true }).start()}
              disabled={phase !== "ready"}
            >
              <Animated.View style={[drStyles.claimBtn, { transform: [{ scale: btnScale }], opacity: phase === "ready" ? 1 : 0.55 }]}>
                <Animated.View style={[StyleSheet.absoluteFillObject, drStyles.claimBtnGlow, { opacity: glowOpacity }]} pointerEvents="none" />
                <Text style={drStyles.claimBtnText}>CLAIM REWARD</Text>
                <Text style={drStyles.claimBtnArrow}>›</Text>
              </Animated.View>
            </Pressable>
          ) : (
            <Animated.View style={{ width: "100%", opacity: playBtnOpacity, transform: [{ translateY: playBtnSlide }] }}>
              <Pressable onPress={handleDismiss} style={drStyles.playBtn}>
                <Text style={drStyles.playBtnText}>LET'S PLAY! 🚀</Text>
              </Pressable>
            </Animated.View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

function NameInputModal({
  visible,
  currentName,
  onSave,
  onClose,
}: {
  visible: boolean;
  currentName: string;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(currentName);

  useEffect(() => {
    if (visible) setDraft(currentName);
  }, [visible, currentName]);

  const handleSave = () => {
    const trimmed = draft.trim();
    if (trimmed.length === 0) return;
    onSave(trimmed);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <View style={styles.overlay}>
        <View style={[styles.nameModal, {
          backgroundColor: "#160630",
          borderColor: "#7c3aed",
          borderWidth: 1.5,
          shadowColor: "#9b5fff",
          shadowOpacity: 0.3,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 4 },
        }]}>
          <Text style={styles.nameModalEmoji}>✏️</Text>
          <Text style={[styles.nameModalTitle, { color: "#d4aaff" }]}>
            {currentName ? "Change Your Name" : "Enter Your Name"}
          </Text>
          <Text style={[styles.nameModalSub, { color: "#7a5a9e" }]}>
            This name appears in your top scores
          </Text>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            maxLength={20}
            placeholder="Your name..."
            placeholderTextColor="#4a2a7e"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSave}
            style={[styles.nameInput, {
              color: "#f5e6a0",
              backgroundColor: "#0f041e",
              borderColor: "#3a1a6e",
            }]}
          />
          <View style={{ flexDirection: "row", gap: 10, width: "100%" }}>
            {currentName.length > 0 && (
              <Pressable
                onPress={() => { playTapSound(); onClose(); }}
                style={({ pressed }) => [styles.nameBtn, {
                  flex: 1,
                  backgroundColor: "#1e0a40",
                  borderColor: "#3a1a6e",
                  opacity: pressed ? 0.8 : 1,
                }]}
              >
                <Text style={[styles.nameBtnText, { color: "#a888cc" }]}>Cancel</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => { playTapSound(); handleSave(); }}
              style={({ pressed }) => [styles.nameBtn, {
                flex: 2,
                backgroundColor: draft.trim().length === 0 ? "#1e0a40" : "#4a1d96",
                borderColor: draft.trim().length === 0 ? "#3a1a6e" : "#9b5fff",
                opacity: pressed ? 0.8 : 1,
              }]}
            >
              <Text style={[styles.nameBtnText, {
                color: draft.trim().length === 0 ? "#4a2a7e" : "#ffe066",
              }]}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function CategoryCard({
  id,
  label,
  emoji,
  selected,
  onPress,
}: {
  id: Category;
  label: string;
  emoji: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    playTapSound();
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.9, duration: 70, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.categoryCard,
          {
            backgroundColor: selected ? "#3a1570" : "#1e0a40",
            borderColor: selected ? "#ffe066" : "#3a1a6e",
            shadowColor: selected ? "#ffe066" : "#000",
            shadowOpacity: selected ? 0.2 : 0.2,
            shadowRadius: selected ? 4 : 2,
            shadowOffset: { width: 0, height: 2 },
          },
        ]}
      >
        <Text style={styles.categoryEmoji}>{emoji}</Text>
        <Text style={[styles.categoryLabel, {
          color: selected ? "#ffe066" : "#d4b8ff",
        }]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function DifficultyBtn({
  id,
  label,
  description,
  selected,
  onPress,
}: {
  id: Difficulty;
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const accentColor =
    id === "easy" ? "#00e676" : id === "medium" ? "#f5c518" : "#ff3b5c";

  return (
    <Pressable
      onPress={() => {
        playTapSound();
        onPress();
      }}
      style={[
        styles.diffBtn,
        {
          backgroundColor: selected ? "#2d1260" : "#1e0a40",
          borderColor: selected ? accentColor : "#3a1a6e",
          shadowColor: selected ? accentColor : "#000",
          shadowOpacity: selected ? 0.2 : 0.2,
          shadowRadius: selected ? 4 : 2,
          shadowOffset: { width: 0, height: 2 },
        },
      ]}
    >
      <View style={styles.diffLeft}>
        <Text style={[styles.diffLabel, {
          color: selected ? accentColor : "#d4b8ff",
        }]}>
          {label}
        </Text>
        <Text style={[styles.diffDesc, { color: colors.mutedForeground }]}>{description}</Text>
      </View>
      <View style={[styles.diffXpBadge, {
        backgroundColor: accentColor + "22",
        borderColor: selected ? accentColor : accentColor + "44",
      }]}>
        <Text style={[styles.diffXpText, { color: accentColor }]}>
          ×{difficultyConfig[id].xpMultiplier} XP
        </Text>
      </View>
    </Pressable>
  );
}

function XPBar() {
  const colors = useColors();
  const { xp, playerLevel } = useGame();
  const { current, next } = getXPThreshold(playerLevel);
  const ratio = next === Infinity ? 1 : (xp - current) / (next - current);
  const pct = Math.min(1, Math.max(0, ratio)) * 100;
  const xpAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(xpAnim, {
      toValue: pct,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View style={[styles.xpContainer, {
      backgroundColor: "#1a0838",
      borderColor: "#3a1a6e",
      shadowColor: "#7b3fcf",
      shadowOpacity: 0.15,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    }]}>
      <View style={styles.xpRow}>
        <View style={styles.xpLeft}>
          <View style={[styles.levelBadge, {
            backgroundColor: "#3a1570",
            borderColor: "#d4920e",
            shadowColor: "#d4920e",
            shadowOpacity: 0.15,
            shadowRadius: 3,
            shadowOffset: { width: 0, height: 1 },
          }]}>
            <Text style={[styles.levelText, { color: "#ffe066" }]}>Lv {playerLevel}</Text>
          </View>
          <Text style={[styles.xpLabel, { color: colors.mutedForeground }]}>
            {xp.toLocaleString()} XP
          </Text>
        </View>
        <Text style={[styles.xpNext, { color: colors.mutedForeground }]}>
          {next === Infinity ? "MAX" : `${next.toLocaleString()} XP`}
        </Text>
      </View>
      <View style={[styles.xpBarBg, { backgroundColor: "#0f041e" }]}>
        <Animated.View
          style={[
            styles.xpBarFill,
            {
              backgroundColor: "#9b5fff",
              width: xpAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
              shadowColor: "#9b5fff",
              shadowOpacity: 0.4,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 0 },
            },
          ]}
        />
      </View>
    </View>
  );
}

interface GlobalEntry {
  id: number;
  playerName: string;
  score: number;
  category: string;
  difficulty: string;
  xp: number;
  playedAt: string;
}

function GlobalLeaderboard() {
  const colors = useColors();
  const [entries, setEntries] = useState<GlobalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScores = useCallback(async () => {
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    if (!domain) { setLoading(false); return; }
    try {
      const res = await fetch(`https://${domain}/api/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        setEntries(Array.isArray(data) ? data.slice(0, 10) : []);
      }
    } catch { /* offline */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchScores(); }, [fetchScores]);

  if (loading) return (
    <View style={[styles.leaderboard, { backgroundColor: colors.card, borderColor: colors.border, alignItems: "center", paddingVertical: 20 }]}>
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>🌍 GLOBAL LEADERBOARD</Text>
      <Text style={{ color: colors.mutedForeground, marginTop: 12, fontSize: 13 }}>Loading...</Text>
    </View>
  );

  if (entries.length === 0) return (
    <View style={[styles.leaderboard, { backgroundColor: colors.card, borderColor: colors.border, alignItems: "center", paddingVertical: 20 }]}>
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>🌍 GLOBAL LEADERBOARD</Text>
      <Text style={{ color: colors.mutedForeground, marginTop: 12, fontSize: 13 }}>No scores yet — be the first!</Text>
    </View>
  );

  return (
    <View style={[styles.leaderboard, { backgroundColor: colors.card, borderColor: "#7c3aed" }]}>
      <View style={styles.leaderHeader}>
        <Text style={[styles.sectionLabel, { color: "#d4aaff" }]}>🌍 GLOBAL LEADERBOARD</Text>
        <Pressable onPress={fetchScores} hitSlop={8}>
          <Feather name="refresh-cw" size={13} color="#7c3aed" />
        </Pressable>
      </View>
      {entries.map((entry, i) => (
        <View key={entry.id} style={[styles.leaderRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.leaderRank, { color: i === 0 ? "#ffe066" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : colors.mutedForeground }]}>
            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
          </Text>
          <View style={styles.leaderInfo}>
            <Text style={[styles.leaderLabel, { color: colors.foreground }]} numberOfLines={1}>
              {entry.playerName}
            </Text>
            <Text style={[styles.leaderDate, { color: colors.mutedForeground }]}>
              {wordCategories[entry.category as keyof typeof wordCategories]?.emoji ?? "🔤"}{" "}
              {wordCategories[entry.category as keyof typeof wordCategories]?.label ?? entry.category}
              {" · "}{entry.difficulty}
            </Text>
          </View>
          <View style={styles.leaderRight}>
            <Text style={[styles.leaderScore, { color: "#ffe066" }]}>{entry.score}</Text>
            <Text style={[styles.leaderXp, { color: colors.xpBar }]}>+{entry.xp} xp</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    category, difficulty, setCategory, setDifficulty,
    startGame, highScores, coins, hints, streak,
    dailyChallengeDate, dailyChallengeCompleted,
    playerName, updatePlayerName,
  } = useGame();

  const [showNameModal, setShowNameModal] = useState(false);

  const topInset = insets.top > 0 ? insets.top : 24;
  const bottomInset = insets.bottom > 0 ? insets.bottom : 16;

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
  const dailyDone = dailyChallengeCompleted && dailyChallengeDate === today;
  const daily = getDailyChallenge();

  // Show name prompt after data loads if name is still empty
  useEffect(() => {
    if (playerName === "") {
      const t = setTimeout(() => setShowNameModal(true), 800);
      return () => clearTimeout(t);
    }
  }, [playerName]);

  const handlePlay = () => {
    
    startGame(false);
    router.push("/game");
  };

  const handleDailyPlay = () => {
    
    startGame(true);
    router.push("/game");
  };

  return (
    <View style={[styles.screen, { backgroundColor: "#0f041e" }]}>
      <DailyRewardModal />
      <NameInputModal
        visible={showNameModal}
        currentName={playerName}
        onSave={updatePlayerName}
        onClose={() => setShowNameModal(false)}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topInset + 4, paddingBottom: bottomInset + 8 },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={[styles.appTitle, {
              color: "#d4aaff",
              textShadowColor: "#9b5fff",
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 3,
            }]}>WORD</Text>
            <Text style={[styles.appTitle, {
              color: "#ffe066",
              textShadowColor: "#c87000",
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 3,
            }]}>HUNT</Text>
          </View>
          <Text style={[styles.appSubtitle, { color: colors.mutedForeground }]}>
            Find hidden words. Build your streak.
          </Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {/* Coins chip — tap to open Shop */}
          <Pressable
            onPress={() => { playTapSound(); router.push("/shop"); }}
            style={[styles.statChip, {
              backgroundColor: "#1e0a40",
              borderColor: "#d4920e",
              shadowColor: "#d4920e",
              shadowOpacity: 0.14,
              shadowRadius: 3,
              shadowOffset: { width: 0, height: 2 },
            }]}
            hitSlop={6}
          >
            <Text style={styles.statIcon}>💰</Text>
            <Text style={[styles.statValue, { color: "#ffe066" }]}>{coins}</Text>
            <Text style={{ fontSize: 9, color: "#c8900a", fontFamily: "Inter_500Medium", marginLeft: 2 }}>🛒</Text>
          </Pressable>

          <View style={[styles.statChip, {
            backgroundColor: "#1e0a40",
            borderColor: "#3a1a6e",
            shadowColor: "#000",
            shadowOpacity: 0.3,
            shadowRadius: 3,
            shadowOffset: { width: 0, height: 2 },
          }]}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={[styles.statValue, { color: "#ff8c55" }]}>{streak}</Text>
          </View>
          <View style={[styles.statChip, {
            backgroundColor: "#1e0a40",
            borderColor: "#3a1a6e",
            shadowColor: "#000",
            shadowOpacity: 0.3,
            shadowRadius: 3,
            shadowOffset: { width: 0, height: 2 },
          }]}>
            <Text style={styles.statIcon}>💡</Text>
            <Text style={[styles.statValue, { color: "#40e0ff" }]}>{hints}</Text>
          </View>
        </View>

        {/* XP bar */}
        <XPBar />

        {/* Daily Challenge */}
        <View style={[styles.dailyCard, { backgroundColor: colors.card, borderColor: dailyDone ? colors.success + "50" : colors.neonCyan + "50" }]}>
          <View style={styles.dailyHeader}>
            <View style={[styles.dailyBadge, { backgroundColor: dailyDone ? colors.success + "22" : colors.neonCyan + "22", borderColor: dailyDone ? colors.success + "50" : colors.neonCyan + "50" }]}>
              <Text style={[styles.dailyBadgeText, { color: dailyDone ? colors.success : colors.neonCyan }]}>
                {dailyDone ? "✓ COMPLETED" : "DAILY CHALLENGE"}
              </Text>
            </View>
          </View>
          <View style={styles.dailyBody}>
            <View style={styles.dailyInfo}>
              <Text style={styles.dailyEmoji}>{wordCategories[daily.category].emoji}</Text>
              <View>
                <Text style={[styles.dailyCategory, { color: colors.foreground }]}>
                  {wordCategories[daily.category].label}
                </Text>
                <Text style={[styles.dailyDiff, { color: colors.mutedForeground }]}>
                  {daily.difficulty.charAt(0).toUpperCase() + daily.difficulty.slice(1)} · +20 bonus coins
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => { if (!dailyDone) { playTapSound(); handleDailyPlay(); } }}
              disabled={dailyDone}
              style={({ pressed }) => [
                styles.dailyBtn,
                {
                  backgroundColor: dailyDone ? colors.secondary : colors.neonCyan,
                  opacity: pressed ? 0.85 : dailyDone ? 0.6 : 1,
                },
              ]}
            >
              <Text style={[styles.dailyBtnText, { color: dailyDone ? colors.mutedForeground : "#000" }]}>
                {dailyDone ? "Done" : "Play"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CATEGORY</Text>
          <View style={styles.categoryGrid}>
            {(CATEGORIES as Category[]).map((id) => (
              <CategoryCard
                key={id}
                id={id}
                label={wordCategories[id].label}
                emoji={wordCategories[id].emoji}
                selected={category === id}
                onPress={() => setCategory(id)}
              />
            ))}
          </View>
        </View>

        {/* Difficulty */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DIFFICULTY</Text>
          <View style={styles.diffList}>
            {(["easy", "medium", "hard"] as Difficulty[]).map((id) => (
              <DifficultyBtn
                key={id}
                id={id}
                label={difficultyConfig[id].label}
                description={difficultyConfig[id].description}
                selected={difficulty === id}
                onPress={() => setDifficulty(id)}
              />
            ))}
          </View>
        </View>

        {/* Local Leaderboard */}
        {highScores.length > 0 && (
          <View style={[styles.leaderboard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Header row with player name */}
            <View style={styles.leaderHeader}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>🏆 MY BEST SCORES</Text>
              <Pressable
                onPress={() => { playTapSound(); setShowNameModal(true); }}
                style={styles.nameTag}
                hitSlop={8}
              >
                <Text style={[styles.nameTagText, { color: "#d4aaff" }]} numberOfLines={1}>
                  {playerName || "Set name"}
                </Text>
                <Feather name="edit-2" size={11} color="#7c3aed" />
              </Pressable>
            </View>
            {highScores.slice(0, 5).map((hs, i) => (
              <View key={i} style={[styles.leaderRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.leaderRank, { color: i === 0 ? colors.accent : colors.mutedForeground }]}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </Text>
                <View style={styles.leaderInfo}>
                  <Text style={[styles.leaderLabel, { color: colors.foreground }]}>
                    {wordCategories[hs.category].emoji} {wordCategories[hs.category].label}{" "}
                    <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                      · {hs.difficulty}
                    </Text>
                  </Text>
                  <Text style={[styles.leaderDate, { color: colors.mutedForeground }]}>
                    {(hs.playerName || playerName) ? `${hs.playerName || playerName} · ` : ""}{hs.date}
                  </Text>
                </View>
                <View style={styles.leaderRight}>
                  <Text style={[styles.leaderScore, { color: colors.accent }]}>{hs.score}</Text>
                  <Text style={[styles.leaderXp, { color: colors.xpBar }]}>+{hs.xp} xp</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* START GAME — sticky at bottom, always visible */}
      <View style={[styles.stickyPlayWrapper, { paddingBottom: bottomInset + 8, backgroundColor: "#0f041e" }]}>
        <Pressable
          onPress={() => { playStartSound(); handlePlay(); }}
          style={({ pressed }) => [
            styles.playBtn,
            {
              backgroundColor: "#4a1d96",
              borderWidth: 1.5,
              borderColor: "#ffe066",
              opacity: pressed ? 0.88 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
              shadowColor: "#ffe066",
              shadowOpacity: 0.2,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
            },
          ]}
        >
          <Feather name="play" size={22} color="#ffe066" />
          <Text style={[styles.playBtnText, { color: "#ffe066" }]}>START GAME</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12, paddingBottom: 8 },
  header: { alignItems: "center", gap: 4, paddingTop: 4 },
  titleRow: { flexDirection: "row", gap: 8 },
  appTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    letterSpacing: 6,
    lineHeight: 36,
  },
  appSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
  },
  statIcon: { fontSize: 13 },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 13 },
  xpContainer: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  xpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  xpLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  levelBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  levelText: { fontFamily: "Inter_700Bold", fontSize: 12 },
  xpLabel: { fontFamily: "Inter_500Medium", fontSize: 11 },
  xpNext: { fontFamily: "Inter_400Regular", fontSize: 10 },
  xpBarBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  xpBarFill: { height: 6, borderRadius: 3 },
  dailyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  dailyHeader: { flexDirection: "row" },
  dailyBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  dailyBadgeText: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 1 },
  dailyBody: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dailyInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  dailyEmoji: { fontSize: 24 },
  dailyCategory: { fontFamily: "Inter_700Bold", fontSize: 14 },
  dailyDiff: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  dailyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  dailyBtnText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  section: { gap: 7 },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.5,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  categoryCard: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    gap: 4,
    minWidth: 74,
  },
  categoryEmoji: { fontSize: 20 },
  categoryLabel: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  diffList: { gap: 6 },
  diffBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  diffLeft: { gap: 2 },
  diffLabel: { fontFamily: "Inter_700Bold", fontSize: 14 },
  diffDesc: { fontFamily: "Inter_400Regular", fontSize: 11 },
  diffXpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  diffXpText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  stickyPlayWrapper: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#3a1a6e",
  },
  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 15,
    borderRadius: 16,
  },
  playBtnText: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    letterSpacing: 1.5,
  },
  leaderboard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  leaderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nameTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#1e0a40",
    borderWidth: 1,
    borderColor: "#3a1a6e",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: 140,
  },
  nameTagText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  nameModal: {
    width: "88%",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  nameModalEmoji: { fontSize: 36 },
  nameModalTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    textAlign: "center",
  },
  nameModalSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
  },
  nameInput: {
    width: "100%",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_500Medium",
    fontSize: 16,
  },
  nameBtn: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  nameBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  leaderRank: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    width: 28,
    textAlign: "center",
  },
  leaderInfo: { flex: 1, gap: 2 },
  leaderLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, textTransform: "capitalize" },
  leaderDate: { fontFamily: "Inter_400Regular", fontSize: 11 },
  leaderRight: { alignItems: "flex-end", gap: 2 },
  leaderScore: { fontFamily: "Inter_700Bold", fontSize: 16 },
  leaderXp: { fontFamily: "Inter_500Medium", fontSize: 11 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  rewardModal: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 28,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    gap: 14,
  },
  rewardEmoji: { fontSize: 52 },
  rewardTitle: { fontFamily: "Inter_700Bold", fontSize: 26 },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  streakEmoji: { fontSize: 14 },
  streakBadgeText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  rewardDesc: { fontFamily: "Inter_400Regular", fontSize: 14 },
  rewardItems: { flexDirection: "row", gap: 12 },
  rewardItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  rewardItemIcon: { fontSize: 20 },
  rewardItemValue: { fontFamily: "Inter_700Bold", fontSize: 20 },
  claimBtn: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
  },
  claimBtnText: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    letterSpacing: 1,
  },
});
