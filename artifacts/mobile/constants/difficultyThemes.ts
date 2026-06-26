import { Difficulty } from "./wordData";

export interface DifficultyTheme {
  screenBg: string;
  headerBorder: string;
  gridContainerBg: string;
  gridContainerBorder: string;

  cellBg: string;
  cellBorder: string;
  cellText: string;

  selectedBg: string;
  selectedBorder: string;
  selectedText: string;

  lastSelectedBg: string;
  lastSelectedBorder: string;
  lastSelectedText: string;

  hintBg: string;
  hintBorder: string;
  hintText: string;

  foundColors: [string, string];
  foundTextColors: [string, string];

  trailOuter: string;
  trailInner: string;
  trailCore: string;

  timerBarNormal: string;

  chipPendingBg: string;
  chipPendingBorder: string;
  chipFoundBg: string;
  chipFoundBorder: string;
  chipFoundText: string;
  chipGlow: string;
  chipFlash: string;

  progressTrack: string;
  progressTrackBorder: string;
  progressFill: string;

  accent: string;
  accentLight: string;
}

const EASY: DifficultyTheme = {
  screenBg: "#0f041e",
  headerBorder: "#3a1a6e",
  gridContainerBg: "#160630",
  gridContainerBorder: "#5a2a9e",

  cellBg: "#3d1a7a",
  cellBorder: "#b87a0c",
  cellText: "#ffe066",

  selectedBg: "#250a60cc",
  selectedBorder: "#c084fc",
  selectedText: "#ffe066",

  lastSelectedBg: "#3a0a90dd",
  lastSelectedBorder: "#ffe066",
  lastSelectedText: "#ffffff",

  hintBg: "#164e63",
  hintBorder: "#22d3ee",
  hintText: "#67e8f9",

  foundColors: ["#c2185b", "#e91e63"],
  foundTextColors: ["#ffe0ea", "#ffc8d8"],

  trailOuter: "#9b5fff",
  trailInner: "#c084fc",
  trailCore: "#ffe066",

  timerBarNormal: "#9b5fff",

  chipPendingBg: "#1e0a40",
  chipPendingBorder: "#5a3a9e",
  chipFoundBg: "#2a001a",
  chipFoundBorder: "#e91e63",
  chipFoundText: "#ff80aa",
  chipGlow: "#ff3070",
  chipFlash: "#ff1864",

  progressTrack: "#1e0a40",
  progressTrackBorder: "#3a1a6e",
  progressFill: "#9b5fff",

  accent: "#9b5fff",
  accentLight: "#c084fc",
};

const MEDIUM: DifficultyTheme = {
  screenBg: "#130010",
  headerBorder: "#6a1050",
  gridContainerBg: "#1c0418",
  gridContainerBorder: "#7a1060",

  cellBg: "#5a0838",
  cellBorder: "#cc0a80",
  cellText: "#ffb8ec",

  selectedBg: "#4a0830cc",
  selectedBorder: "#ff50c8",
  selectedText: "#ffddee",

  lastSelectedBg: "#7a0858dd",
  lastSelectedBorder: "#ffaaee",
  lastSelectedText: "#ffffff",

  hintBg: "#1e003a",
  hintBorder: "#aa30ff",
  hintText: "#dd88ff",

  foundColors: ["#00897b", "#0097a7"],
  foundTextColors: ["#e0fff8", "#e0f8ff"],

  trailOuter: "#ff40a0",
  trailInner: "#ff80cc",
  trailCore: "#ffaaee",

  timerBarNormal: "#ff40a0",

  chipPendingBg: "#280018",
  chipPendingBorder: "#8a2860",
  chipFoundBg: "#001a14",
  chipFoundBorder: "#00bcd4",
  chipFoundText: "#80ffee",
  chipGlow: "#00e5ff",
  chipFlash: "#00e676",

  progressTrack: "#280018",
  progressTrackBorder: "#6a1048",
  progressFill: "#ff40a0",

  accent: "#ff40a0",
  accentLight: "#ff88cc",
};

const HARD: DifficultyTheme = {
  screenBg: "#030f06",
  headerBorder: "#0a4a1a",
  gridContainerBg: "#050f08",
  gridContainerBorder: "#0a6a20",

  cellBg: "#063a14",
  cellBorder: "#10a840",
  cellText: "#90ffb8",

  selectedBg: "#082808cc",
  selectedBorder: "#00ff80",
  selectedText: "#00ffcc",

  lastSelectedBg: "#0a4a18dd",
  lastSelectedBorder: "#00ffaa",
  lastSelectedText: "#00ffcc",

  hintBg: "#001a10",
  hintBorder: "#00cc70",
  hintText: "#00ff99",

  foundColors: ["#c2185b", "#e91e63"],
  foundTextColors: ["#ffe0ea", "#ffc8d8"],

  trailOuter: "#18ff60",
  trailInner: "#50ff88",
  trailCore: "#aaffcc",

  timerBarNormal: "#18d060",

  chipPendingBg: "#051a0c",
  chipPendingBorder: "#186a30",
  chipFoundBg: "#2a001a",
  chipFoundBorder: "#e91e63",
  chipFoundText: "#ff80aa",
  chipGlow: "#ff3070",
  chipFlash: "#ff1864",

  progressTrack: "#051a0c",
  progressTrackBorder: "#0d4820",
  progressFill: "#18d060",

  accent: "#18d060",
  accentLight: "#70ff90",
};

export const DIFFICULTY_THEMES: Record<Difficulty, DifficultyTheme> = {
  easy: EASY,
  medium: MEDIUM,
  hard: HARD,
};

export function getDifficultyTheme(difficulty: Difficulty): DifficultyTheme {
  return DIFFICULTY_THEMES[difficulty];
}
