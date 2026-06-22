import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Category,
  DAILY_REWARDS,
  Difficulty,
  LEVEL_ORDER,
  LevelId,
  difficultyConfig,
  getDailyChallenge,
  getNextLevel,
  getPlayerLevel,
  getStartingLevelIdx,
  getLevelNumber,
  getWordCountForLevel,
  wordCategories,
} from "@/constants/wordData";

import { CellCoord, PlacedWord, Puzzle, generatePuzzle } from "@/utils/puzzleGenerator";

function pickWords(allWords: string[], count: number, difficulty: Difficulty): string[] {
  let pool = [...allWords];
  if (difficulty === "easy") {
    const short = pool.filter(w => w.length <= 6);
    if (short.length >= count) pool = short;
  } else if (difficulty === "medium") {
    const mid = pool.filter(w => w.length <= 9);
    if (mid.length >= count) pool = mid;
  }
  return pool.sort(() => Math.random() - 0.5).slice(0, count);
}

export interface HighScore {
  score: number;
  date: string;
  category: Category;
  difficulty: Difficulty;
  xp: number;
  playerName?: string;
}

interface PlayerData {
  xp: number;
  coins: number;
  hints: number;
  streak: number;
  lastPlayedDate: string | null;
  lastRewardDate: string | null;
  streakDay: number;
  dailyChallengeDate: string | null;
  dailyChallengeCompleted: boolean;
  highScores: HighScore[];
  playerName: string;
  completedLevelsCount: number;
  currentLevelIdx: number;
  savedCategory: string;
  savedDifficulty: string;
}

interface GameState {
  puzzle: Puzzle | null;
  puzzleKey: string;
  category: Category;
  difficulty: Difficulty;
  score: number;
  timeLeft: number;
  isPlaying: boolean;
  isFinished: boolean;
  didWin: boolean;
  foundWords: string[];
  comboCount: number;
  comboMultiplier: number;
  lastFoundCells: Set<string>;
  xpGained: number;
  coinsGained: number;
  isDaily: boolean;
  hintCells: Set<string>;
  showDailyReward: boolean;
  xp: number;
  coins: number;
  hints: number;
  streak: number;
  streakDay: number;
  dailyChallengeDate: string | null;
  dailyChallengeCompleted: boolean;
  highScores: HighScore[];
  playerLevel: number;
  bonusWord: string | null;
  currentLevelIdx: number;
  completedLevelsCount: number;
}

interface GameContextType extends GameState {
  nextLevel: LevelId | null;
  playerName: string;
  setCategory: (c: Category) => void;
  setDifficulty: (d: Difficulty) => void;
  startGame: (daily?: boolean) => void;
  startNextLevel: () => void;
  endGame: (won: boolean) => void;
  markWordFound: (word: PlacedWord) => void;
  tick: () => void;
  addScore: (points: number) => void;
  useHint: () => void;
  rewardHint: () => void;
  claimDailyReward: () => { coins: number; hints: number };
  dismissDailyReward: () => void;
  resetCombo: () => void;
  spendCoins: (cost: number, hintsToAdd: number) => boolean;
  updatePlayerName: (name: string) => void;
  addCoins: (amount: number) => void;
  resumeWithExtraTime: (seconds: number) => void;
}

const GameContext = createContext<GameContextType | null>(null);

const PLAYER_KEY = "@word_hunt_player_v2";

const DEFAULT_PLAYER: PlayerData = {
  xp: 0,
  coins: 50,
  hints: 3,
  streak: 0,
  lastPlayedDate: null,
  lastRewardDate: null,
  streakDay: 0,
  dailyChallengeDate: null,
  dailyChallengeCompleted: false,
  highScores: [],
  playerName: "",
  completedLevelsCount: 0,
  currentLevelIdx: 0,
  savedCategory: "animals",
  savedDifficulty: "easy",
};

function getTodayString(): string {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function getComboMultiplier(count: number): number {
  if (count >= 7) return 3;
  if (count >= 5) return 2;
  if (count >= 3) return 1.5;
  return 1;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [category, setCategory] = useState<Category>("animals");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [puzzleKey, setPuzzleKey] = useState("init");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [didWin, setDidWin] = useState(false);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [comboCount, setComboCount] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [lastFoundCells, setLastFoundCells] = useState<Set<string>>(new Set());
  const [xpGained, setXpGained] = useState(0);
  const [coinsGained, setCoinsGained] = useState(0);
  const [isDaily, setIsDaily] = useState(false);
  const [hintCells, setHintCells] = useState<Set<string>>(new Set());
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [bonusWord, setBonusWord] = useState<string | null>(null);
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);

  const [xp, setXp] = useState(DEFAULT_PLAYER.xp);
  const [coins, setCoins] = useState(DEFAULT_PLAYER.coins);
  const [hints, setHints] = useState(DEFAULT_PLAYER.hints);
  const [streak, setStreak] = useState(DEFAULT_PLAYER.streak);
  const [streakDay, setStreakDay] = useState(DEFAULT_PLAYER.streakDay);
  const [lastRewardDate, setLastRewardDate] = useState<string | null>(null);
  const [dailyChallengeDate, setDailyChallengeDate] = useState<string | null>(null);
  const [dailyChallengeCompleted, setDailyChallengeCompleted] = useState(false);
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [completedLevelsCount, setCompletedLevelsCount] = useState(0);

  const playerLevel = getPlayerLevel(xp);

  useEffect(() => {
    AsyncStorage.getItem(PLAYER_KEY).then((val) => {
      const data: PlayerData = val ? { ...DEFAULT_PLAYER, ...JSON.parse(val) } : DEFAULT_PLAYER;
      setXp(data.xp);
      setCoins(data.coins);
      setHints(data.hints);
      setStreak(data.streak);
      setStreakDay(data.streakDay ?? 0);
      setLastRewardDate(data.lastRewardDate);
      setDailyChallengeDate(data.dailyChallengeDate);
      setDailyChallengeCompleted(data.dailyChallengeCompleted);
      setHighScores(data.highScores ?? []);
      setPlayerName(data.playerName ?? "");
      setCompletedLevelsCount(data.completedLevelsCount ?? 0);
      if (data.currentLevelIdx != null && data.currentLevelIdx > 0) {
        setCurrentLevelIdx(data.currentLevelIdx);
        if (data.savedCategory) setCategory(data.savedCategory as Category);
        if (data.savedDifficulty) setDifficulty(data.savedDifficulty as Difficulty);
      }

      const today = getTodayString();
      if (data.lastRewardDate !== today) {
        setShowDailyReward(true);
      }
    });
  }, []);

  const savePlayer = useCallback(async (patch: Partial<PlayerData>) => {
    const existing = await AsyncStorage.getItem(PLAYER_KEY);
    const current: PlayerData = existing ? { ...DEFAULT_PLAYER, ...JSON.parse(existing) } : DEFAULT_PLAYER;
    const updated = { ...current, ...patch };
    await AsyncStorage.setItem(PLAYER_KEY, JSON.stringify(updated));
  }, []);

  const spendCoins = useCallback((cost: number, hintsToAdd: number): boolean => {
    if (coins < cost) return false;
    const newCoins = coins - cost;
    const newHints = hints + hintsToAdd;
    setCoins(newCoins);
    setHints(newHints);
    savePlayer({ coins: newCoins, hints: newHints });
    return true;
  }, [coins, hints, savePlayer]);

  const claimDailyReward = useCallback(() => {
    const today = getTodayString();
    const rewardIdx = streakDay % DAILY_REWARDS.length;
    const reward = DAILY_REWARDS[rewardIdx];
    const newStreakDay = (streakDay + 1) % DAILY_REWARDS.length;
    setCoins((c) => c + reward.coins);
    setHints((h) => h + reward.hints);
    setLastRewardDate(today);
    setStreakDay(newStreakDay);
    setShowDailyReward(false);
    savePlayer({
      coins: coins + reward.coins,
      hints: hints + reward.hints,
      lastRewardDate: today,
      streakDay: newStreakDay,
    });
    return reward;
  }, [streakDay, coins, hints, savePlayer]);

  const dismissDailyReward = useCallback(() => {
    setShowDailyReward(false);
  }, []);

  const startGame = useCallback((daily = false) => {
    let cat = category;
    let diff = difficulty;

    if (daily) {
      const dc = getDailyChallenge();
      cat = dc.category;
      diff = dc.difficulty;
      setCategory(cat);
      setDifficulty(diff);
    }

    // Continue from saved progress if same category+difficulty, else start fresh
    const savedLevel = LEVEL_ORDER[currentLevelIdx];
    const targetIdx = (!daily && savedLevel && savedLevel.category === cat && savedLevel.difficulty === diff)
      ? currentLevelIdx
      : getStartingLevelIdx(cat, diff);
    setCurrentLevelIdx(targetIdx);
    setIsDaily(daily);

    // Persist the resolved level index so app-reopen restores correctly
    savePlayer({ currentLevelIdx: targetIdx, savedCategory: cat, savedDifficulty: diff } as Partial<PlayerData>);

    const config = difficultyConfig[diff];
    const levelNumWithinDiff = targetIdx - getStartingLevelIdx(cat, diff) + 1;
    const wordCount = getWordCountForLevel(diff, levelNumWithinDiff);
    const allWords = wordCategories[cat].words;
    const selected = pickWords(allWords, wordCount, diff);
    const newPuzzle = generatePuzzle(selected, config.gridSize, diff);

    const newBonus = diff === "medium"
      ? selected[Math.floor(Math.random() * selected.length)]
      : null;
    setBonusWord(newBonus);

    setPuzzle(newPuzzle);
    setPuzzleKey(`${Date.now()}`);
    setScore(0);
    setTimeLeft(config.timeSeconds);
    setIsPlaying(true);
    setIsFinished(false);
    setDidWin(false);
    setFoundWords([]);
    setComboCount(0);
    setComboMultiplier(1);
    setLastFoundCells(new Set());
    setXpGained(0);
    setCoinsGained(0);
    setHintCells(new Set());
  }, [category, difficulty, currentLevelIdx, savePlayer]);

  const endGame = useCallback(
    async (won: boolean, finalScore: number, foundCount: number, currentCombo: number) => {
      setIsPlaying(false);
      setIsFinished(true);
      setDidWin(won);

      const config = difficultyConfig[difficulty];
      const timeBonus = won ? Math.max(0, timeLeft) * 3 : 0;
      const comboBonus = currentCombo >= 5 ? 15 : currentCombo >= 3 ? 8 : 0;
      const total = finalScore + timeBonus;
      if (won) setScore(total);

      const earnedXP = Math.floor(total * config.xpMultiplier * 0.15);
      const earnedCoins = foundCount * 3 + (won ? config.coinReward : 2) + comboBonus + (isDaily ? 20 : 0);

      setXpGained(earnedXP);
      setCoinsGained(earnedCoins);

      const newXP = xp + earnedXP;
      const newCoins = coins + earnedCoins;
      setXp(newXP);
      setCoins(newCoins);

      const today = getTodayString();
      const newStreak = streak + 1;
      setStreak(newStreak);

      let newDailyChallengeCompleted = dailyChallengeCompleted;
      let newDailyChallengeDate = dailyChallengeDate;
      if (isDaily && won) {
        newDailyChallengeCompleted = true;
        newDailyChallengeDate = today;
        setDailyChallengeCompleted(true);
        setDailyChallengeDate(today);
      }

      const newEntry: HighScore = {
        score: total,
        date: today,
        category,
        difficulty,
        xp: earnedXP,
        playerName: playerName || undefined,
      };
      const updatedScores = [...highScores, newEntry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      setHighScores(updatedScores);

      const newCompletedLevelsCount = completedLevelsCount + (won ? 1 : 0);
      if (won) setCompletedLevelsCount(newCompletedLevelsCount);

      await savePlayer({
        xp: newXP,
        coins: newCoins,
        streak: newStreak,
        lastPlayedDate: today,
        dailyChallengeDate: newDailyChallengeDate ?? undefined,
        dailyChallengeCompleted: newDailyChallengeCompleted,
        highScores: updatedScores,
        completedLevelsCount: newCompletedLevelsCount,
      } as Partial<PlayerData>);

      if (won && (playerName || "").trim()) {
        const domain = process.env.EXPO_PUBLIC_DOMAIN;
        if (domain) {
          try {
            await fetch(`https://${domain}/api/leaderboard`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                playerName: playerName.trim(),
                score: total,
                category,
                difficulty,
                xp: earnedXP,
              }),
            });
          } catch {
            // Silent fail — offline is fine
          }
        }
      }
    },
    [score, timeLeft, highScores, category, difficulty, xp, coins, streak,
     isDaily, dailyChallengeCompleted, dailyChallengeDate, savePlayer, playerName, completedLevelsCount]
  );

  const scoreRef = useRef(score);
  const foundWordsRef = useRef(foundWords);
  const comboCountRef = useRef(comboCount);
  const bonusWordRef  = useRef(bonusWord);
  const isPlayingRef  = useRef(false);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { foundWordsRef.current = foundWords; }, [foundWords]);
  useEffect(() => { comboCountRef.current = comboCount; }, [comboCount]);
  useEffect(() => { bonusWordRef.current = bonusWord; }, [bonusWord]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  const puzzleRef = useRef(puzzle);
  useEffect(() => { puzzleRef.current = puzzle; }, [puzzle]);

  const markWordFound = useCallback(
    (word: PlacedWord) => {
      if (!puzzleRef.current) return;

      const newCombo = comboCountRef.current + 1;
      const mult = getComboMultiplier(newCombo);
      setComboCount(newCombo);
      setComboMultiplier(mult);

      const basePoints = word.word.length * 10;
      const points = Math.floor(basePoints * mult);
      const newScore = scoreRef.current + points;
      setScore(newScore);

      if (bonusWordRef.current && word.word.toUpperCase() === bonusWordRef.current.toUpperCase()) {
        setTimeLeft((t) => t + 10);
      }

      const cellKeys = new Set(word.cells.map((c) => `${c.row}-${c.col}`));
      setLastFoundCells(cellKeys);
      setTimeout(() => setLastFoundCells(new Set()), 600);

      setFoundWords((prev) => {
        const updated = [...prev, word.word];
        if (updated.length === puzzleRef.current!.placedWords.length) {
          setTimeout(() => endGame(true, newScore, updated.length, newCombo), 400);
        }
        return updated;
      });
      setPuzzle((p) => {
        if (!p) return p;
        return {
          ...p,
          placedWords: p.placedWords.map((pw) =>
            pw.word === word.word ? { ...pw, found: true } : pw
          ),
        };
      });
    },
    [endGame]
  );

  const resetCombo = useCallback(() => {
    setComboCount(0);
    setComboMultiplier(1);
  }, []);

  // Pure state decrement — no side-effects inside updater (React 18 can call updaters multiple times)
  const tick = useCallback(() => {
    setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
  }, []);

  // Detect timer expiry OUTSIDE the state updater to prevent double-endGame on Android
  useEffect(() => {
    if (timeLeft === 0 && isPlayingRef.current) {
      isPlayingRef.current = false;
      endGame(false, scoreRef.current, foundWordsRef.current.length, comboCountRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const addScore = useCallback((points: number) => {
    setScore((s) => s + points);
  }, []);

  const useHint = useCallback(() => {
    if (hints <= 0 || !puzzle) return;
    const unfound = puzzle.placedWords.filter((pw) => !pw.found);
    if (unfound.length === 0) return;
    const target = unfound[Math.floor(Math.random() * unfound.length)];
    const keys = new Set(target.cells.map((c) => `${c.row}-${c.col}`));
    setHintCells(keys);
    setHints((h) => h - 1);
    savePlayer({ hints: hints - 1 });
    setTimeout(() => setHintCells(new Set()), 2500);
  }, [hints, puzzle, savePlayer]);

  const rewardHint = useCallback(() => {
    const newHints = hints + 1;
    setHints(newHints);
    savePlayer({ hints: newHints });
  }, [hints, savePlayer]);

  const addCoins = useCallback((amount: number) => {
    const newCoins = coins + amount;
    setCoins(newCoins);
    setCoinsGained((c) => c + amount);
    savePlayer({ coins: newCoins });
  }, [coins, savePlayer]);

  const resumeWithExtraTime = useCallback((seconds: number) => {
    setTimeLeft(seconds);
    setIsPlaying(true);
    setIsFinished(false);
    setDidWin(false);
  }, []);

  const startNextLevel = useCallback(() => {
    const nextIdx = currentLevelIdx + 1;
    const next = LEVEL_ORDER[nextIdx];
    if (!next) return;
    const nextCat = next.category;
    const nextDiff = next.difficulty;
    setCurrentLevelIdx(nextIdx);
    setCategory(nextCat);
    setDifficulty(nextDiff);
    savePlayer({ currentLevelIdx: nextIdx, savedCategory: nextCat, savedDifficulty: nextDiff } as Partial<PlayerData>);

    const config = difficultyConfig[nextDiff];
    const levelNumWithinDiff = nextIdx - getStartingLevelIdx(nextCat, nextDiff) + 1;
    const wordCount = getWordCountForLevel(nextDiff, levelNumWithinDiff);
    const allWords = wordCategories[nextCat].words;
    const selected = pickWords(allWords, wordCount, nextDiff);
    const newPuzzle = generatePuzzle(selected, config.gridSize, nextDiff);

    const newBonus = nextDiff === "medium"
      ? selected[Math.floor(Math.random() * selected.length)]
      : null;
    setBonusWord(newBonus);

    setPuzzle(newPuzzle);
    setPuzzleKey(`${Date.now()}`);
    setScore(0);
    setTimeLeft(config.timeSeconds);
    setIsPlaying(true);
    setIsFinished(false);
    setDidWin(false);
    setFoundWords([]);
    setComboCount(0);
    setComboMultiplier(1);
    setLastFoundCells(new Set());
    setXpGained(0);
    setCoinsGained(0);
    setIsDaily(false);
    setHintCells(new Set());
  }, [category, difficulty, currentLevelIdx]);

  const nextLevel = getNextLevel(currentLevelIdx);

  const contextValue = useMemo<GameContextType>(() => ({
    puzzle,
    puzzleKey,
    category,
    difficulty,
    score,
    timeLeft,
    isPlaying,
    isFinished,
    didWin,
    foundWords,
    comboCount,
    comboMultiplier,
    lastFoundCells,
    xpGained,
    coinsGained,
    isDaily,
    hintCells,
    showDailyReward,
    bonusWord,
    currentLevelIdx,
    completedLevelsCount,
    xp,
    coins,
    hints,
    streak,
    streakDay,
    dailyChallengeDate,
    dailyChallengeCompleted,
    highScores,
    playerLevel,
    nextLevel,
    playerName,
    setCategory,
    setDifficulty,
    startGame,
    startNextLevel,
    endGame: (won: boolean) => endGame(won, scoreRef.current, foundWordsRef.current.length, comboCountRef.current),
    markWordFound,
    tick,
    addScore,
    useHint,
    rewardHint,
    claimDailyReward,
    dismissDailyReward,
    resetCombo,
    spendCoins,
    addCoins,
    resumeWithExtraTime,
    updatePlayerName: (name: string) => {
      const trimmed = name.trim().slice(0, 20);
      setPlayerName(trimmed);
      savePlayer({ playerName: trimmed });
    },
  }), [
    puzzle, puzzleKey, category, difficulty, score, timeLeft,
    isPlaying, isFinished, didWin, foundWords,
    comboCount, comboMultiplier, lastFoundCells,
    xpGained, coinsGained, isDaily, hintCells, showDailyReward, bonusWord,
    completedLevelsCount,
    xp, coins, hints, streak, streakDay, dailyChallengeDate,
    dailyChallengeCompleted, highScores, playerLevel, nextLevel, playerName,
    setCategory, setDifficulty, startGame, startNextLevel, endGame,
    markWordFound, tick, addScore, useHint, rewardHint, claimDailyReward,
    dismissDailyReward, resetCombo, spendCoins, addCoins, resumeWithExtraTime, savePlayer,
  ]);

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
