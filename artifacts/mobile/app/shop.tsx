import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGame } from "@/context/GameContext";
import { playTapSound, playSelectSound } from "@/utils/soundManager";

const PACKAGES = [
  {
    id: "pack1",
    hints: 1,
    cost: 500,
    label: "Starter Pack",
    badge: null,
    gradient: ["#1e0a40", "#2a1060"],
    border: "#7c3aed",
    glow: "#7c3aed",
  },
  {
    id: "pack2",
    hints: 4,
    cost: 1500,
    label: "Value Pack",
    badge: "BEST VALUE",
    gradient: ["#1a0838", "#2d1070"],
    border: "#c8900a",
    glow: "#e8a800",
  },
  {
    id: "pack3",
    hints: 7,
    cost: 2500,
    label: "Mega Pack",
    badge: "MOST HINTS",
    gradient: ["#160630", "#250d5e"],
    border: "#00d4ff",
    glow: "#00d4ff",
  },
] as const;

function PackageCard({
  pkg,
  coins,
  onBuy,
}: {
  pkg: (typeof PACKAGES)[number];
  coins: number;
  onBuy: (cost: number, hints: number) => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const canAfford = coins >= pkg.cost;

  const handlePress = () => {
    if (!canAfford) return;
    playSelectSound();
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.95, tension: 300, friction: 5, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 200, friction: 7, useNativeDriver: true }),
    ]).start();
    onBuy(pkg.cost, pkg.hints);
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.card,
          {
            borderColor: canAfford ? pkg.border : "#3a1a6e",
            opacity: canAfford ? 1 : 0.5,
            shadowColor: canAfford ? pkg.glow : "transparent",
          },
        ]}
      >
        {pkg.badge && (
          <View style={[styles.badge, { backgroundColor: pkg.glow + "33", borderColor: pkg.glow + "80" }]}>
            <Text style={[styles.badgeText, { color: pkg.glow }]}>{pkg.badge}</Text>
          </View>
        )}

        <View style={styles.cardBody}>
          {/* Hints section */}
          <View style={styles.hintsBlock}>
            <Text style={styles.bulbEmoji}>💡</Text>
            <Text style={styles.hintsCount}>{pkg.hints}</Text>
            <Text style={styles.hintsLabel}>hint{pkg.hints > 1 ? "s" : ""}</Text>
          </View>

          {/* Arrow */}
          <Feather name="arrow-right" size={20} color="#6a3a9e" style={{ marginHorizontal: 8 }} />

          {/* Cost section */}
          <View style={styles.costBlock}>
            <Text style={styles.coinEmoji}>💰</Text>
            <Text style={[styles.costText, { color: canAfford ? "#ffe066" : "#7a6030" }]}>
              {pkg.cost.toLocaleString()}
            </Text>
          </View>
        </View>

        <Text style={[styles.cardLabel, { color: canAfford ? "#c8a8f0" : "#5a3a7e" }]}>
          {pkg.label}
        </Text>

        {!canAfford && (
          <Text style={styles.notEnough}>Not enough coins</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const { coins, hints, spendCoins } = useGame();
  const [toast, setToast] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = (msg: string) => {
    setToast(msg);
    toastOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast(null));
  };

  const handleBuy = (cost: number, hintsToAdd: number) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const ok = spendCoins(cost, hintsToAdd);
    if (ok) {
      showToast(`✅ +${hintsToAdd} hint${hintsToAdd > 1 ? "s" : ""} added!`);
    } else {
      showToast("❌ Not enough coins");
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => { playTapSound(); router.back(); }} style={styles.backBtn} hitSlop={12}>
          <Feather name="arrow-left" size={22} color="#c8a8f0" />
        </Pressable>
        <Text style={styles.title}>🛒 Shop</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Current balance */}
      <View style={styles.balanceRow}>
        <View style={styles.balancePill}>
          <Text style={styles.balanceIcon}>💰</Text>
          <Text style={styles.balanceValue}>{coins.toLocaleString()}</Text>
          <Text style={styles.balanceLabel}>coins</Text>
        </View>
        <View style={styles.balancePill}>
          <Text style={styles.balanceIcon}>💡</Text>
          <Text style={[styles.balanceValue, { color: "#00d4ff" }]}>{hints}</Text>
          <Text style={styles.balanceLabel}>hints</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Buy Hints</Text>
      <Text style={styles.sectionSub}>Hints highlight a letter during gameplay</Text>

      {/* Packages */}
      <View style={styles.packages}>
        {PACKAGES.map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} coins={coins} onBuy={handleBuy} />
        ))}
      </View>

      {/* Earn more tip */}
      <View style={styles.tipBox}>
        <Text style={styles.tipText}>
          💡 Earn more coins by completing puzzles and collecting daily rewards!
        </Text>
      </View>

      {/* Toast */}
      {toast && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0f041e",
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#1e0a40",
    borderWidth: 1,
    borderColor: "#3a1a6e",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: "#ffe066",
  },
  balanceRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
    justifyContent: "center",
  },
  balancePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1e0a40",
    borderWidth: 1,
    borderColor: "#3a1a6e",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  balanceIcon: { fontSize: 18 },
  balanceValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#ffe066",
  },
  balanceLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#a888cc",
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#d4aaff",
    marginBottom: 4,
  },
  sectionSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#7a5a9e",
    marginBottom: 20,
  },
  packages: {
    gap: 14,
  },
  card: {
    backgroundColor: "#160630",
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 18,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -10,
    right: 14,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 0.5,
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  hintsBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bulbEmoji: { fontSize: 28 },
  hintsCount: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    color: "#00d4ff",
  },
  hintsLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#6090a0",
    alignSelf: "flex-end",
    marginBottom: 4,
  },
  costBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  coinEmoji: { fontSize: 22 },
  costText: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  cardLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    textAlign: "center",
  },
  notEnough: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#ff6060",
    textAlign: "center",
    marginTop: 4,
  },
  tipBox: {
    marginTop: 28,
    backgroundColor: "#1a0838",
    borderWidth: 1,
    borderColor: "#3a1a6e",
    borderRadius: 12,
    padding: 14,
  },
  tipText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#9070b8",
    textAlign: "center",
    lineHeight: 20,
  },
  toast: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "#1e0a40",
    borderWidth: 1,
    borderColor: "#7c3aed",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  toastText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#e0c8ff",
  },
});
