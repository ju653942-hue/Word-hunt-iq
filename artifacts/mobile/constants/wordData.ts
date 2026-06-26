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
      // 3 letters
      "DOG", "CAT", "FOX", "EMU", "YAK", "GNU", "OWL", "BAT", "RAM", "COW",
      "PIG", "HEN", "JAY", "EWE", "KOI", "EEL", "COD",
      // 4 letters
      "LION", "BEAR", "WOLF", "DEER", "FROG", "DUCK", "FISH", "BIRD", "CRAB",
      "GOAT", "MOLE", "WASP", "CROW", "STAG", "WREN", "LYNX", "MINK", "VOLE",
      "NEWT", "TOAD", "IBIS", "LAMB", "MARE", "BULL", "PONY", "BOAR", "MOTH",
      "DOVE", "LARK", "HAWK", "SWAN", "SLUG", "MULE", "HARE", "KITE",
      // 5 letters
      "TIGER", "EAGLE", "SHARK", "WHALE", "ZEBRA", "PANDA", "COBRA", "OTTER",
      "MOOSE", "BISON", "GECKO", "RAVEN", "VIPER", "HYENA", "RHINO", "HIPPO",
      "CAMEL", "LLAMA", "KOALA", "SLOTH", "TAPIR", "LEMUR", "CRANE", "HERON",
      "STORK", "QUAIL", "MOUSE", "HORSE", "SNAIL", "ROBIN", "SQUID", "PRAWN",
      "SKUNK", "FINCH", "TROUT", "BREAM", "SHREW",
      // 6 letters
      "BADGER", "WEASEL", "FERRET", "IGUANA", "PYTHON", "PARROT", "TOUCAN",
      "FALCON", "PIGEON", "MAGPIE", "RABBIT", "DONKEY", "MONKEY", "LIZARD",
      "OYSTER", "MUSSEL", "CONDOR", "OSPREY", "HORNET", "LOCUST", "BEETLE",
      "CICADA", "MARMOT", "GIBBON",
      // 7 letters
      "GORILLA", "PENGUIN", "DOLPHIN", "PEACOCK", "CHEETAH", "GIRAFFE",
      "HAMSTER", "PANTHER", "LEOPARD", "SPARROW", "BUFFALO", "VULTURE",
      "OSTRICH", "LOBSTER",
      // 8 letters
      "FLAMINGO", "SQUIRREL", "REINDEER", "ANTELOPE", "PLATYPUS", "MACKEREL",
    ],
  },
  fruits: {
    label: "Fruits",
    emoji: "🍎",
    words: [
      // 3 letters
      "FIG",
      // 4 letters
      "DATE", "PLUM", "LIME", "PEAR", "KIWI", "SLOE", "UGLI",
      // 5 letters
      "APPLE", "MANGO", "GRAPE", "LEMON", "PEACH", "GUAVA", "MELON",
      "OLIVE", "BERRY", "PRUNE", "GOURD",
      // 6 letters
      "PAPAYA", "CHERRY", "LYCHEE", "BANANA", "ORANGE", "POMELO", "QUINCE",
      "DAMSON", "FEIJOA", "LONGAN", "DURIAN", "LOQUAT", "JUJUBE", "PAWPAW",
      "CASABA", "RAISIN",
      // 7 letters
      "APRICOT", "AVOCADO", "COCONUT", "KUMQUAT", "SOURSOP", "RHUBARB",
      "CURRANT", "SULTANA", "PASSION", "TANGELO", "PITANGA", "SATSUMA",
      // 8 letters
      "HONEYDEW", "MULBERRY", "DEWBERRY", "PLANTAIN", "RAMBUTAN", "MANDARIN",
      "TAMARIND",
      // 9 letters
      "TANGERINE", "PERSIMMON", "BLUEBERRY", "CRANBERRY", "RASPBERRY",
      "PINEAPPLE", "JACKFRUIT", "STARFRUIT", "NECTARINE",
      // extra
      "APRICOT", "AVOCADO", "COCONUT", "CLEMENTINE", "BOYSENBERRY",
      "BILBERRY", "CLOUDBERRY", "HACKBERRY",
    ],
  },
  sports: {
    label: "Sports",
    emoji: "⚽",
    words: [
      // 4 letters
      "GOLF", "POLO", "SWIM", "DIVE", "RACE", "JUMP", "KICK", "BOWL",
      "SURF", "SAIL", "YOGA", "JUDO", "DART", "PUNT", "SPAR",
      // 5 letters
      "RUGBY", "CHESS", "RELAY", "CANOE", "CLIMB", "SKATE", "VAULT",
      "JOUST", "LUNGE", "PARRY", "PIVOT", "DARTS",
      // 6 letters
      "TENNIS", "HOCKEY", "BOXING", "ROWING", "SKIING", "SQUASH", "KARATE",
      "DISCUS", "SPRINT", "HURDLE", "TACKLE", "VOLLEY", "FENCER",
      // 7 letters
      "CYCLING", "ARCHERY", "FENCING", "CRICKET", "JAVELIN", "AEROBIC",
      "CROQUET", "HURLING", "NETBALL", "RAFTING", "SKATING", "CURLING",
      "BOWLING", "RUNNING", "JUMPING",
      // 8 letters
      "SWIMMING", "HANDBALL", "BASEBALL", "FOOTBALL", "MARATHON", "CLIMBING",
      "SHOOTING", "BIATHLON", "SOFTBALL", "LACROSSE", "BADMINTON", "TRIATHLON",
      "WATERPOLO", "KAYAKING", "SPARRING", "PENTATHL",
    ],
  },
  countries: {
    label: "Countries",
    emoji: "🌍",
    words: [
      // 4 letters
      "CHAD", "TOGO", "MALI", "LAOS", "FIJI", "CUBA", "PERU", "IRAN",
      "OMAN", "IRAQ", "NIUE",
      // 5 letters
      "INDIA", "CHINA", "JAPAN", "SPAIN", "ITALY", "EGYPT", "KENYA",
      "GHANA", "SYRIA", "QATAR", "NEPAL", "CHILE", "NIGER", "BENIN",
      "TONGA", "NAURU", "PALAU", "SAMOA", "LIBYA", "SUDAN", "CONGO",
      "GABON", "HAITI", "YEMEN", "WALES", "KENYA",
      // 6 letters
      "TURKEY", "BRAZIL", "FRANCE", "CANADA", "MEXICO", "GREECE", "ISRAEL",
      "JORDAN", "KUWAIT", "MALAWI", "ANGOLA", "ZAMBIA", "RWANDA", "GUINEA",
      "GAMBIA", "BHUTAN", "BRUNEI", "CYPRUS", "LATVIA", "SERBIA", "POLAND",
      "RUSSIA", "SWEDEN", "NORWAY", "BELIZE", "PANAMA", "GUYANA", "MONACO",
      "TAIWAN", "BHUTAN",
      // 7 letters
      "ALBANIA", "ARMENIA", "AUSTRIA", "BAHRAIN", "BELGIUM", "BURUNDI",
      "CROATIA", "ECUADOR", "ESTONIA", "FINLAND", "GEORGIA", "GERMANY",
      "HUNGARY", "ICELAND", "IRELAND", "MOLDOVA", "MYANMAR", "NAMIBIA",
      "NIGERIA", "DENMARK", "URUGUAY", "VIETNAM", "UKRAINE", "ROMANIA",
      "ANDORRA", "ERITREA", "SOMALIA", "SENEGAL", "LIBERIA", "MOROCCO",
      "TUNISIA", "ALGERIA", "LESOTHO", "BOLIVIA", "ENGLAND", "JAMAICA",
      // 8 letters
      "MONGOLIA", "PAKISTAN", "THAILAND", "CAMBODIA", "MALAYSIA", "ETHIOPIA",
      "TANZANIA", "ZIMBABWE", "BOTSWANA", "SLOVAKIA", "SLOVENIA", "PORTUGAL",
      "HONDURAS", "DJIBOUTI", "MALDIVES", "BARBADOS", "DOMINICA", "SURINAME",
      "PARAGUAY", "COLOMBIA", "SCOTLAND", "CAMEROON", "ESWATINI",
    ],
  },
  science: {
    label: "Science",
    emoji: "🔬",
    words: [
      // 3-4 letters
      "ATOM", "CELL", "GENE", "WAVE", "HEAT", "MASS", "FLUX", "ACID",
      "BASE", "BOND", "SPIN", "LENS", "VOLT", "WATT", "GERM", "IRON",
      "ZINC", "RUST",
      // 5 letters
      "LASER", "ORBIT", "QUARK", "PRISM", "ALLOY", "VIRUS", "FORCE",
      "LIGHT", "SOUND", "SPEED", "POWER", "STEAM", "FLUID", "SOLID",
      "METAL", "GLASS", "OZONE", "RADAR", "SONAR", "INERT",
      // 6 letters
      "PROTON", "PLASMA", "NEURON", "PHOTON", "ENERGY", "CARBON", "HELIUM",
      "OXYGEN", "SODIUM", "COPPER", "SILVER", "SULFUR", "MAGNET", "PISTON",
      "FOSSIL", "ENZYME", "LEPTON",
      // 7 letters
      "FISSION", "OSMOSIS", "NUCLEUS", "NEUTRON", "PROTEIN", "ELEMENT",
      "ORBITAL", "VALENCE", "REACTOR", "POLYMER", "GRAVITY", "BATTERY",
      "CIRCUIT", "CRYSTAL", "EROSION", "GLUCOSE", "MITOSIS", "SPECIES",
      // 8 letters
      "ELECTRON", "MOLECULE", "CHEMICAL", "MAGNETIC", "VELOCITY", "BACTERIA",
      "CATALYST", "FRICTION", "HYDROGEN", "NITROGEN", "SYMMETRY", "MEMBRANE",
      "ISOTOPES",
    ],
  },
  music: {
    label: "Music",
    emoji: "🎵",
    words: [
      // 3-4 letters
      "BASS", "BEAT", "TUNE", "SONG", "NOTE", "JAZZ", "SOUL", "FOLK",
      "DRUM", "HARP", "OBOE", "LUTE", "RIFF", "CLEF", "FLAT", "REST",
      "GONG", "BARD",
      // 5 letters
      "CHOIR", "TEMPO", "CHORD", "VIOLA", "FLUTE", "PIANO", "LYRIC",
      "SWING", "BLUES", "PITCH", "SHARP", "TABLA", "TANGO", "WALTZ",
      "CAROL", "DITTY", "DIRGE", "FUGUE", "MOTET", "ETUDE",
      // 6 letters
      "MELODY", "RHYTHM", "GUITAR", "TREBLE", "SONATA", "BALLAD", "CHORUS",
      "BRIDGE", "TIMBRE", "ANTHEM", "CHANTY",
      // 7 letters
      "SOPRANO", "TRUMPET", "HARMONY", "RECITAL", "QUARTET", "CADENCE",
      "PRELUDE", "FANFARE", "CALYPSO", "BAROQUE", "REFRAIN", "VIBRATO",
      // 8 letters
      "CONCERTO", "SYMPHONY", "SERENADE", "OVERTURE", "RHAPSODY", "OPERETTA",
      "MADRIGAL", "CANTATA", "LULLABY",
      // extra
      "ACOUSTIC", "ACAPELLA", "FALSETTO", "STACCATO",
    ],
  },
};

export const CATEGORIES: Category[] = ["animals", "fruits", "sports", "countries", "science", "music"];
export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export const LEVELS_PER_CATEGORY = 150;
const EASY_COUNT   = 50;
const MEDIUM_COUNT = 50;
const HARD_COUNT   = 50;

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
    .filter((l) => l.category === level.category && l.difficulty === level.difficulty)
    .length;
}

export function getLevelsForDifficulty(difficulty: Difficulty): number {
  if (difficulty === "easy")   return EASY_COUNT;
  if (difficulty === "medium") return MEDIUM_COUNT;
  return HARD_COUNT;
}

export const difficultyConfig: Record<
  Difficulty,
  { label: string; gridSize: number; wordCount: number; timeSeconds: number; description: string; xpMultiplier: number; coinReward: number }
> = {
  easy: {
    label: "Easy",
    gridSize: 8,
    wordCount: 5,
    timeSeconds: 90,
    description: "8×8 · 5 words · forward only",
    xpMultiplier: 1,
    coinReward: 5,
  },
  medium: {
    label: "Medium",
    gridSize: 10,
    wordCount: 7,
    timeSeconds: 120,
    description: "10×10 · 7 words · 6 directions",
    xpMultiplier: 1.5,
    coinReward: 10,
  },
  hard: {
    label: "Hard",
    gridSize: 12,
    wordCount: 10,
    timeSeconds: 150,
    description: "12×12 · 10 words · all directions",
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

// Fixed word count per difficulty — same on every level, every category
// Easy:   5 words
// Medium: 7 words
// Hard:   10 words
export function getWordCountForLevel(difficulty: Difficulty, _levelNum: number): number {
  if (difficulty === "easy")   return 5;
  if (difficulty === "medium") return 7;
  return 10;
}
