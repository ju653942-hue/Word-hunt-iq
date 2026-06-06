export type Category = "animals" | "fruits" | "sports" | "countries" | "science" | "music";
export type Difficulty = "easy" | "medium" | "hard";

export const wordCategories: Record<
  Category,
  { label: string; emoji: string; words: string[] }
> = {
  animals: {
    label: "Animals",
    emoji: "🐾",
    words: [
      "DOG", "CAT", "LION", "BEAR", "WOLF", "DEER", "FROG", "DUCK",
      "FISH", "BIRD", "CRAB", "GOAT", "MOLE", "WASP", "CROW",
      "TIGER", "EAGLE", "SHARK", "WHALE", "ZEBRA", "PANDA", "COBRA",
      "OTTER", "MOOSE", "BISON", "GECKO", "RAVEN", "SWIFT", "VIPER",
    ],
  },
  fruits: {
    label: "Fruits",
    emoji: "🍎",
    words: [
      "APPLE", "MANGO", "GRAPE", "LEMON", "PEACH", "PLUM", "LIME",
      "KIWI", "PEAR", "FIG", "DATE", "GUAVA", "BERRY", "MELON",
      "PAPAYA", "CHERRY", "OLIVE", "LYCHEE", "QUINCE", "APRICOT",
      "BANANA", "ORANGE", "MANGO", "COCONUT", "POMELO", "STARFRUIT",
    ],
  },
  sports: {
    label: "Sports",
    emoji: "⚽",
    words: [
      "GOLF", "POLO", "SWIM", "DIVE", "RACE", "JUMP", "KICK",
      "BOWL", "SURF", "SAIL", "YOGA", "JUDO", "RUGBY", "CHESS",
      "DARTS", "TENNIS", "HOCKEY", "BOXING", "ROWING", "SKIING",
      "SQUASH", "KARATE", "FENCING", "CYCLING", "ARCHERY", "SPRINT",
    ],
  },
  countries: {
    label: "Countries",
    emoji: "🌍",
    words: [
      "INDIA", "CHINA", "JAPAN", "SPAIN", "ITALY", "PERU", "CUBA",
      "IRAN", "OMAN", "NEPAL", "CHAD", "MALI", "TOGO", "LAOS", "FIJI",
      "EGYPT", "KENYA", "GHANA", "SYRIA", "QATAR", "BAHRAIN", "ANGOLA",
      "BRAZIL", "CANADA", "FRANCE", "GREECE", "MEXICO", "TURKEY",
    ],
  },
  science: {
    label: "Science",
    emoji: "🔬",
    words: [
      "ATOM", "CELL", "GENE", "WAVE", "HEAT", "MASS", "FLUX",
      "ACID", "BASE", "BOND", "SPIN", "LENS", "VOLT", "WATT",
      "LASER", "ORBIT", "QUARK", "PRISM", "ALLOY", "VIRUS",
      "PROTON", "PLASMA", "NEURON", "PHOTON", "FISSION", "OSMOSIS",
    ],
  },
  music: {
    label: "Music",
    emoji: "🎵",
    words: [
      "BASS", "BEAT", "TUNE", "SONG", "NOTE", "JAZZ", "SOUL",
      "FOLK", "DRUM", "HARP", "OBOE", "LUTE", "RIFF", "CLEF",
      "CHOIR", "TEMPO", "CHORD", "VIOLA", "FLUTE", "PIANO",
      "MELODY", "RHYTHM", "GUITAR", "TREBLE", "SONATA", "OPERA",
    ],
  },
};

export const CATEGORIES: Category[] = ["animals", "fruits", "sports", "countries", "science", "music"];
export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export const LEVELS_PER_CATEGORY = 50;
const EASY_COUNT   = 17;
const MEDIUM_COUNT = 17;
const HARD_COUNT   = 16; // 17 + 17 + 16 = 50

export interface LevelId {
  category: Category;
  difficulty: Difficulty;
}

export const LEVEL_ORDER: LevelId[] = CATEGORIES.flatMap((cat) => [
  ...Array.from({ length: EASY_COUNT },   () => ({ category: cat, difficulty: "easy"   as Difficulty })),
  ...Array.from({ length: MEDIUM_COUNT }, () => ({ category: cat, difficulty: "medium" as Difficulty })),
  ...Array.from({ length: HARD_COUNT },   () => ({ category: cat, difficulty: "hard"   as Difficulty })),
]);

export function getStartingLevelIdx(category: Category, difficulty: Difficulty): number {
  const idx = LEVEL_ORDER.findIndex(
    (l) => l.category === category && l.difficulty === difficulty
  );
  return idx === -1 ? 0 : idx;
}

export function getNextLevel(currentIdx: number): LevelId | null {
  if (currentIdx < 0 || currentIdx >= LEVEL_ORDER.length - 1) return null;
  return LEVEL_ORDER[currentIdx + 1];
}

export function getLevelNumber(currentIdx: number): number {
  const level = LEVEL_ORDER[currentIdx];
  if (!level) return 1;
  return LEVEL_ORDER
    .slice(0, currentIdx + 1)
    .filter((l) => l.category === level.category)
    .length;
}

export const difficultyConfig: Record<
  Difficulty,
  { label: string; gridSize: number; wordCount: number; timeSeconds: number; description: string; xpMultiplier: number; coinReward: number }
> = {
  easy: {
    label: "Easy",
    gridSize: 8,
    wordCount: 6,
    timeSeconds: 90,
    description: "8×8 · 6 words · forward only",
    xpMultiplier: 1,
    coinReward: 5,
  },
  medium: {
    label: "Medium",
    gridSize: 10,
    wordCount: 10,
    timeSeconds: 120,
    description: "10×10 · 10 words · 6 directions",
    xpMultiplier: 1.5,
    coinReward: 10,
  },
  hard: {
    label: "Hard",
    gridSize: 12,
    wordCount: 14,
    timeSeconds: 150,
    description: "12×12 · 14 words · all directions",
    xpMultiplier: 2,
    coinReward: 20,
  },
};

export const DAILY_REWARDS = [
  { coins: 25, hints: 1 },
  { coins: 30, hints: 0 },
  { coins: 35, hints: 1 },
  { coins: 50, hints: 0 },
  { coins: 40, hints: 2 },
  { coins: 60, hints: 1 },
  { coins: 100, hints: 3 },
];

export function getDailyChallenge(): { category: Category; difficulty: Difficulty } {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return {
    category: CATEGORIES[dayOfYear % CATEGORIES.length],
    difficulty: DIFFICULTIES[Math.floor(dayOfYear / 3) % DIFFICULTIES.length],
  };
}

export function getPlayerLevel(xp: number): number {
  const thresholds = [0, 150, 400, 800, 1500, 3000, 6000, 12000, 25000, 50000];
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i]) return i + 1;
  }
  return 1;
}

export function getXPThreshold(level: number): { current: number; next: number } {
  const thresholds = [0, 150, 400, 800, 1500, 3000, 6000, 12000, 25000, 50000, Infinity];
  const idx = Math.min(level - 1, thresholds.length - 2);
  return { current: thresholds[idx], next: thresholds[idx + 1] };
}
