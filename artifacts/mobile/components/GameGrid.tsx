import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, memo, useState, useMemo } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Polyline } from "react-native-svg";
import { useGame } from "@/context/GameContext";
import { CellCoord, cellKey, getLineCells } from "@/utils/puzzleGenerator";
import { playSelectSound, playCorrectSound, playCellTickSound } from "@/utils/soundManager";

const SCREEN_WIDTH = Dimensions.get("window").width;
const OUTER_PADDING = 12;
const INNER_PADDING = 4;

const WORD_COLORS = ["#7c3aed", "#d97706"];
const WORD_TEXT_COLORS = ["#e9d5ff", "#fef3c7"];

// ─── Swipe Trail ──────────────────────────────────────────────────────────────

const SelectionTrail = memo(function SelectionTrail({
  selectedCells,
  cellSize,
}: {
  selectedCells: CellCoord[];
  cellSize: number;
}) {
  if (selectedCells.length < 2) return null;
  const points = selectedCells
    .map(
      (c) =>
        `${(c.col + 0.5) * cellSize + INNER_PADDING},${
          (c.row + 0.5) * cellSize + INNER_PADDING
        }`
    )
    .join(" ");
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Polyline points={points} stroke="#9b5fff" strokeWidth={cellSize * 0.52} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.22} />
      <Polyline points={points} stroke="#c084fc" strokeWidth={cellSize * 0.28} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.45} />
      <Polyline points={points} stroke="#ffe066" strokeWidth={cellSize * 0.09} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.85} />
    </Svg>
  );
});

// ─── Floating Score + Label ───────────────────────────────────────────────────

const FloatingFeedback = memo(function FloatingFeedback({
  lastFoundCells,
  score,
}: {
  lastFoundCells: Set<string>;
  score: number;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.4)).current;
  const [content, setContent] = useState<{ score: string; label: string } | null>(null);

  const prevFoundCells = useRef<Set<string>>(new Set());
  const prevScore = useRef(score);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const size = lastFoundCells.size;
    const delta = score - prevScore.current;
    if (size > 0 && lastFoundCells !== prevFoundCells.current) {
      const label =
        size >= 9 ? "🔥 INCREDIBLE!" : size >= 7 ? "⚡ AMAZING!" : size >= 5 ? "✨ GREAT!" : "👍 NICE!";
      setContent({ score: delta > 0 ? `+${delta}` : "", label });

      translateY.setValue(12);
      opacity.setValue(1);
      scale.setValue(0.4);

      animRef.current?.stop();
      animRef.current = Animated.parallel([
        Animated.spring(scale, { toValue: 1, tension: 320, friction: 6, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -65, duration: 950, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(480),
          Animated.timing(opacity, { toValue: 0, duration: 420, useNativeDriver: true }),
        ]),
      ]);
      animRef.current.start(() => setContent(null));
    }
    prevFoundCells.current = lastFoundCells;
    prevScore.current = score;
  }, [lastFoundCells, score]);

  if (!content) return null;

  return (
    <View style={feedbackStyles.container} pointerEvents="none">
      <Animated.View style={[feedbackStyles.bubble, { opacity, transform: [{ translateY }, { scale }] }]}>
        {content.score ? (
          <Text style={feedbackStyles.scoreText}>{content.score}</Text>
        ) : null}
        <Text style={feedbackStyles.labelText}>{content.label}</Text>
      </Animated.View>
    </View>
  );
});

const feedbackStyles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  } as any,
  bubble: {
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(20,4,50,0.72)",
    borderWidth: 1.5,
    borderColor: "#ffe06660",
  },
  scoreText: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: "#ffe066",
    textShadowColor: "#f5c518cc",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
    letterSpacing: 1,
  },
  labelText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#e8d8ff",
    letterSpacing: 0.5,
  },
});

// ─── Particle Burst ───────────────────────────────────────────────────────────

const PARTICLE_COUNT = 8;
const P_COLORS = ["#ffe066", "#c084fc", "#00d4ff", "#ff6b9d", "#ffffff", "#a3e635", "#fb923c", "#60a5fa"];

const ParticleBurst = memo(function ParticleBurst({ trigger }: { trigger: number }) {
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      op: new Animated.Value(0),
      s: new Animated.Value(0),
    }))
  ).current;
  const prevTrigger = useRef(0);

  useEffect(() => {
    if (trigger === 0 || trigger === prevTrigger.current) return;
    prevTrigger.current = trigger;
    particles.forEach((p, i) => {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
      const dist = 30 + Math.random() * 20;
      p.x.setValue(0); p.y.setValue(0); p.op.setValue(1); p.s.setValue(0.8);
      Animated.parallel([
        Animated.timing(p.x, { toValue: Math.cos(angle) * dist, duration: 500, useNativeDriver: true }),
        Animated.timing(p.y, { toValue: Math.sin(angle) * dist, duration: 500, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(p.s, { toValue: 1.4, duration: 200, useNativeDriver: true }),
          Animated.timing(p.s, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.delay(200),
          Animated.timing(p.op, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ]).start();
    });
  }, [trigger]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={{ position: "absolute", top: "50%", left: "50%" }}>
        {particles.map((p, i) => (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              width: 7, height: 7, borderRadius: 3.5,
              backgroundColor: P_COLORS[i % P_COLORS.length],
              transform: [{ translateX: p.x }, { translateY: p.y }, { scale: p.s }],
              opacity: p.op,
            }}
          />
        ))}
      </View>
    </View>
  );
});

// ─── GridCell ─────────────────────────────────────────────────────────────────

interface GridCellProps {
  letter: string;
  isSelected: boolean;
  isLastSelected: boolean;
  isFound: boolean;
  isJustFound: boolean;
  isHint: boolean;
  isStartCell: boolean;
  foundColorIdx?: number;
  foundOrder: number;
  cellSize: number;
}

const GridCell = memo(function GridCell({
  letter, isSelected, isLastSelected, isFound, isJustFound,
  isHint, isStartCell, foundColorIdx, foundOrder, cellSize,
}: GridCellProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;
  const prevFound = useRef(isFound);
  const activeAnim = useRef<Animated.CompositeAnimation | null>(null);

  // Simple spring scale on selection state (replaces expensive pulse loop)
  useEffect(() => {
    if (isSelected) {
      activeAnim.current?.stop();
      activeAnim.current = Animated.spring(scaleAnim, {
        toValue: isLastSelected ? 1.1 : 1.05,
        tension: 400,
        friction: 8,
        useNativeDriver: true,
      });
      activeAnim.current.start();
    } else if (!isJustFound) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }
  }, [isSelected, isLastSelected, isJustFound]);

  // Flash → bounce → glow pulse on word found
  useEffect(() => {
    if (isJustFound && !prevFound.current) {
      const delay = (foundOrder % 7) * 35;

      flashAnim.setValue(0.85);

      const t = setTimeout(() => {
        activeAnim.current?.stop();
        activeAnim.current = Animated.parallel([
          Animated.timing(flashAnim, {
            toValue: 0, duration: 350, useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.spring(scaleAnim, { toValue: 1.5, tension: 300, friction: 4, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1.0, tension: 220, friction: 7, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(glowAnim, { toValue: 0.5, duration: 130, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 0.1, duration: 180, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 0.35, duration: 150, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]),
        ]);
        activeAnim.current.start();
      }, delay);
      return () => clearTimeout(t);
    }
    prevFound.current = isFound;
  }, [isJustFound, foundOrder]);

  const r        = Math.max(4, Math.round(cellSize * 0.16));
  const pad      = Math.max(1, Math.round(cellSize * 0.05));
  const fontSize = Math.round(cellSize * 0.4);

  let bgColor     = "#3d1a7a";
  let borderColor = "#b87a0c";
  let textColor   = "#ffe066";
  let borderWidth = 1.5;

  if (isFound && foundColorIdx !== undefined) {
    bgColor     = WORD_COLORS[foundColorIdx % WORD_COLORS.length];
    borderColor = WORD_COLORS[foundColorIdx % WORD_COLORS.length];
    textColor   = WORD_TEXT_COLORS[foundColorIdx % WORD_TEXT_COLORS.length];
  } else if (isLastSelected) {
    bgColor     = "#3a0a90dd";
    borderColor = "#ffe066";
    borderWidth = 2.5;
    textColor   = "#ffffff";
  } else if (isSelected) {
    bgColor     = "#250a60cc";
    borderColor = "#c084fc";
    borderWidth = 2;
    textColor   = "#ffe066";
  } else if (isHint) {
    bgColor     = "#164e63";
    borderColor = "#22d3ee";
    textColor   = "#67e8f9";
  }

  const webStyle =
    Platform.OS === "web" && isSelected
      ? ({
          filter: isLastSelected
            ? "drop-shadow(0 0 8px #ffe066cc) drop-shadow(0 0 4px #9b5fff)"
            : "drop-shadow(0 0 5px #9b5fffbb)",
        } as any)
      : {};

  const glowColor = foundColorIdx !== undefined
    ? WORD_COLORS[foundColorIdx % WORD_COLORS.length]
    : "#ffe066";

  return (
    <Animated.View
      style={[
        { width: cellSize, height: cellSize, padding: pad, transform: [{ scale: scaleAnim }] },
        webStyle,
      ]}
    >
      {/* Glow ring layer (behind cell) */}
      <Animated.View
        style={{
          position: "absolute",
          top: pad - 4, left: pad - 4,
          right: pad - 4, bottom: pad - 4,
          borderRadius: r + 4,
          backgroundColor: glowColor,
          opacity: glowAnim,
          pointerEvents: "none",
        } as any}
      />

      <View
        style={{
          flex: 1,
          borderRadius: r,
          backgroundColor: bgColor,
          borderWidth,
          borderColor,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          ...(Platform.OS !== "web" && isSelected
            ? {
                shadowColor: isLastSelected ? "#ffe066" : "#9b5fff",
                shadowOpacity: 0.8,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 0 },
              }
            : {}),
        }}
      >
        <Text
          style={{
            fontSize, color: textColor,
            fontFamily: "Inter_700Bold",
            textAlign: "center",
            includeFontPadding: false,
          }}
          numberOfLines={1}
        >
          {letter}
        </Text>

        {/* Gold flash overlay */}
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            borderRadius: r,
            backgroundColor: "#ffe066",
            opacity: flashAnim,
          }}
          pointerEvents="none"
        />
      </View>
    </Animated.View>
  );
});

// ─── GameGrid ─────────────────────────────────────────────────────────────────

export default function GameGrid() {
  const {
    puzzle, puzzleKey, markWordFound, lastFoundCells, hintCells, score, difficulty,
  } = useGame();

  // selectedCells lives locally — never touches context on every drag
  const [selectedCells, setSelectedCells] = useState<CellCoord[]>([]);

  const [particleTrigger, setParticleTrigger] = useState(0);
  const prevFoundCells = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (lastFoundCells.size > 0 && lastFoundCells !== prevFoundCells.current) {
      setParticleTrigger((n) => n + 1);
    }
    prevFoundCells.current = lastFoundCells;
  }, [lastFoundCells]);

  const puzzleRef        = useRef(puzzle);
  const markWordFoundRef = useRef(markWordFound);
  // Stable ref to local setter — PanResponder is created once, needs ref to latest setter
  const setSelectedCellsRef = useRef(setSelectedCells);

  useEffect(() => { puzzleRef.current = puzzle; }, [puzzle]);
  useEffect(() => { markWordFoundRef.current = markWordFound; }, [markWordFound]);
  useEffect(() => { setSelectedCellsRef.current = setSelectedCells; }, [setSelectedCells]);

  const gridRef             = useRef<View>(null);
  const currentSelectionRef = useRef<CellCoord[]>([]);
  const lastEndCellRef      = useRef<string | null>(null);
  // Derived view origin in page coords (computed once on grant — reliable on all Android versions)
  const viewOriginRef       = useRef({ x: 0, y: 0 });

  const gridSize    = puzzle?.gridSize ?? 8;
  const gridSizeRef = useRef(gridSize);
  useEffect(() => { gridSizeRef.current = puzzle?.gridSize ?? 8; }, [puzzle]);

  const cellSizeRef = useRef(0);

  const availableWidth = SCREEN_WIDTH - OUTER_PADDING * 2;
  const cellSize       = Math.floor(availableWidth / gridSize);
  const gridTotalSize  = gridSize * cellSize + INNER_PADDING * 2;
  cellSizeRef.current  = cellSize;

  const getCellFromClient = (clientX: number, clientY: number): CellCoord | null => {
    const node = gridRef.current as any;
    if (!node || typeof node.getBoundingClientRect !== "function") return null;
    const rect = node.getBoundingClientRect();
    const size = rect.width / gridSizeRef.current;
    const col  = Math.floor((clientX - rect.left) / size);
    const row  = Math.floor((clientY - rect.top)  / size);
    if (row >= 0 && row < gridSizeRef.current && col >= 0 && col < gridSizeRef.current)
      return { row, col };
    return null;
  };

  const checkWord = (cells: CellCoord[]) => {
    const p = puzzleRef.current;
    if (!p || cells.length === 0) return;
    const letters    = cells.map((c) => p.grid[c.row]?.[c.col] ?? "").join("").toUpperCase();
    const revLetters = letters.split("").reverse().join("");
    const found = p.placedWords.find(
      (pw) => !pw.found && (pw.word.toUpperCase() === letters || pw.word.toUpperCase() === revLetters)
    );
    if (found) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playCorrectSound();
      markWordFoundRef.current(found);
    }
  };

  // Web touch events
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const node = gridRef.current as any;
    if (!node) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      if (!t) return;
      const cell = getCellFromClient(t.clientX, t.clientY);
      if (cell) {
        playSelectSound();
        lastEndCellRef.current = `${cell.row}-${cell.col}`;
        currentSelectionRef.current = [cell];
        setSelectedCellsRef.current([cell]);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      if (!t) return;
      const cell = getCellFromClient(t.clientX, t.clientY);
      if (!cell) return;
      const start = currentSelectionRef.current[0];
      if (!start) return;
      const cellStr = `${cell.row}-${cell.col}`;
      if (cellStr === lastEndCellRef.current) return;
      lastEndCellRef.current = cellStr;
      playCellTickSound();
      const lineCells = getLineCells(start, cell);
      if (lineCells) {
        currentSelectionRef.current = lineCells;
        setSelectedCellsRef.current([...lineCells]);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      const cells = currentSelectionRef.current;
      if (cells.length >= 2) checkWord(cells);
      lastEndCellRef.current = null;
      setSelectedCellsRef.current([]);
      currentSelectionRef.current = [];
    };

    node.addEventListener("touchstart", onTouchStart, { passive: false });
    node.addEventListener("touchmove",  onTouchMove,  { passive: false });
    node.addEventListener("touchend",   onTouchEnd,   { passive: false });
    return () => {
      node.removeEventListener("touchstart", onTouchStart);
      node.removeEventListener("touchmove",  onTouchMove);
      node.removeEventListener("touchend",   onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzleKey]);

  // Native PanResponder
  // Uses locationX/locationY (relative to the PanResponder view) — no measureInWindow needed.
  // This eliminates the Android status-bar coordinate mismatch that caused touch offset.
  const getCellFromLocation = (locX: number, locY: number): CellCoord | null => {
    const cSize = cellSizeRef.current;
    const gSize = gridSizeRef.current;
    if (cSize === 0) return null;
    const col = Math.floor((locX - INNER_PADDING) / cSize);
    const row = Math.floor((locY - INNER_PADDING) / cSize);
    if (row >= 0 && row < gSize && col >= 0 && col < gSize) return { row, col };
    return null;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (evt) => {
        const { pageX, pageY, locationX, locationY } = evt.nativeEvent;
        // Derive view origin once from the first touch event.
        // Both pageX/pageY and locationX/locationY come from the same ACTION_DOWN event
        // so their difference is always an accurate view-origin in page coordinates.
        viewOriginRef.current = { x: pageX - locationX, y: pageY - locationY };
        const cell = getCellFromLocation(locationX, locationY);
        if (cell) {
          playSelectSound();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          lastEndCellRef.current = `${cell.row}-${cell.col}`;
          currentSelectionRef.current = [cell];
          setSelectedCellsRef.current([cell]);
        }
      },
      onPanResponderMove: (evt) => {
        // On Android ACTION_MOVE events, locationX/locationY can drift from the
        // responder view's coordinate system. Use pageX/pageY with stored origin instead.
        const { pageX, pageY } = evt.nativeEvent;
        const locationX = pageX - viewOriginRef.current.x;
        const locationY = pageY - viewOriginRef.current.y;
        const cell = getCellFromLocation(locationX, locationY);
        if (!cell) return;
        const start = currentSelectionRef.current[0];
        if (!start) return;
        const cellStr = `${cell.row}-${cell.col}`;
        if (cellStr === lastEndCellRef.current) return;
        lastEndCellRef.current = cellStr;
        playCellTickSound();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const lineCells = getLineCells(start, cell);
        if (lineCells) {
          currentSelectionRef.current = lineCells;
          setSelectedCellsRef.current([...lineCells]);
        }
      },
      onPanResponderRelease: () => {
        const cells = currentSelectionRef.current;
        if (cells.length >= 2) checkWord(cells);
        lastEndCellRef.current = null;
        setSelectedCellsRef.current([]);
        currentSelectionRef.current = [];
      },
    })
  ).current;

  // Memoize expensive per-render computations
  const { cellColorIdxMap, foundCellOrderMap, startCellKeys } = useMemo(() => {
    const colorMap  = new Map<string, number>();
    const orderMap  = new Map<string, number>();
    const startKeys = new Set<string>();
    if (puzzle) {
      puzzle.placedWords
        .filter((pw) => pw.found)
        .forEach((pw, idx) => {
          pw.cells.forEach((c, cellIdx) => {
            colorMap.set(cellKey(c), idx);
            orderMap.set(cellKey(c), cellIdx);
          });
        });

      if (difficulty === "easy") {
        puzzle.placedWords.forEach((pw) => {
          if (pw.cells.length > 0) {
            startKeys.add(cellKey(pw.cells[0]));
          }
        });
      }
    }
    return { cellColorIdxMap: colorMap, foundCellOrderMap: orderMap, startCellKeys: startKeys };
  }, [puzzle, difficulty]);

  const selectedCellKeys = useMemo(
    () => new Set(selectedCells.map(cellKey)),
    [selectedCells]
  );

  const lastSelectedKey = selectedCells.length > 0
    ? cellKey(selectedCells[selectedCells.length - 1])
    : null;

  if (!puzzle) return null;

  return (
    <View key={puzzleKey} style={[styles.outerWrapper, { width: gridTotalSize }]}>
      <View
        ref={gridRef}
        style={[styles.container, { backgroundColor: "#160630", borderColor: "#5a2a9e" }]}
        {...(Platform.OS !== "web" ? panResponder.panHandlers : {})}
      >
        {puzzle.grid.map((row, rIdx) => (
          <View key={rIdx} style={styles.row}>
            {row.map((letter, cIdx) => {
              const key = `${rIdx}-${cIdx}`;
              return (
                <GridCell
                  key={`${puzzleKey}-${key}`}
                  letter={letter}
                  isSelected={selectedCellKeys.has(key)}
                  isLastSelected={lastSelectedKey === key}
                  isFound={cellColorIdxMap.has(key)}
                  isJustFound={lastFoundCells.has(key)}
                  isHint={hintCells.has(key)}
                  isStartCell={startCellKeys.has(key)}
                  foundColorIdx={cellColorIdxMap.get(key)}
                  foundOrder={foundCellOrderMap.get(key) ?? 0}
                  cellSize={cellSize}
                />
              );
            })}
          </View>
        ))}
        <SelectionTrail selectedCells={selectedCells} cellSize={cellSize} />
        <FloatingFeedback lastFoundCells={lastFoundCells} score={score} />
        <ParticleBurst trigger={particleTrigger} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    alignSelf: "center",
  },
  container: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: INNER_PADDING,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
  },
});
