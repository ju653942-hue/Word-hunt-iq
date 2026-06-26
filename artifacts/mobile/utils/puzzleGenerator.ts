import type { Difficulty } from "@/constants/wordData";

export interface CellCoord {
  row: number;
  col: number;
}

export interface PlacedWord {
  word: string;
  cells: CellCoord[];
  found: boolean;
}

export interface Puzzle {
  grid: string[][];
  placedWords: PlacedWord[];
  gridSize: number;
}

// ── Direction sets per difficulty ────────────────────────────────────────────
const EASY_DIRECTIONS: CellCoord[] = [
  { row: 0,  col: 1  }, // right
  { row: 1,  col: 0  }, // down
  { row: 1,  col: 1  }, // diagonal down-right
  { row: 1,  col: -1 }, // diagonal down-left
];

const MEDIUM_DIRECTIONS: CellCoord[] = [
  { row: 0,  col: 1  },
  { row: 0,  col: -1 },
  { row: 1,  col: 0  },
  { row: -1, col: 0  },
  { row: 1,  col: 1  },
  { row: 1,  col: -1 },
];

const HARD_DIRECTIONS: CellCoord[] = [
  { row: 0,  col: 1  },
  { row: 1,  col: 0  },
  { row: 1,  col: 1  },
  { row: 1,  col: -1 },
  { row: 0,  col: -1 },
  { row: -1, col: 0  },
  { row: -1, col: 1  },
  { row: -1, col: -1 },
];

// ── Fill letters per difficulty ───────────────────────────────────────────────
const EASY_FILL   = "AABCDEEEEFGHIIIIJKLLLMNNNOOORRSSSTTTUUUVWWY";
const MEDIUM_FILL = "ABCDEFGHIJKLMNOPRSTUVWY";
const HARD_FILL   = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// ── Word length limits ────────────────────────────────────────────────────────
const EASY_MAX_WORD_LENGTH = 6;
const HARD_MIN_WORD_LENGTH = 4;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function canPlace(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  dir: CellCoord
): boolean {
  const n = grid.length;
  for (let i = 0; i < word.length; i++) {
    const r = row + dir.row * i;
    const c = col + dir.col * i;
    if (r < 0 || r >= n || c < 0 || c >= n) return false;
    if (grid[r][c] !== "" && grid[r][c] !== word[i]) return false;
  }
  return true;
}

function placeWord(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  dir: CellCoord
): CellCoord[] {
  const cells: CellCoord[] = [];
  for (let i = 0; i < word.length; i++) {
    const r = row + dir.row * i;
    const c = col + dir.col * i;
    grid[r][c] = word[i];
    cells.push({ row: r, col: c });
  }
  return cells;
}

// Try to place a single word — first random attempts, then systematic scan
function placeWordGuaranteed(
  grid: string[][],
  word: string,
  directions: CellCoord[]
): CellCoord[] | null {
  const n = grid.length;
  const shuffledDirs = shuffle(directions);

  // Phase 1: fast random attempts
  for (let attempt = 0; attempt < 150; attempt++) {
    const row = Math.floor(Math.random() * n);
    const col = Math.floor(Math.random() * n);
    const dir = shuffledDirs[attempt % shuffledDirs.length];
    if (canPlace(grid, word, row, col, dir)) {
      return placeWord(grid, word, row, col, dir);
    }
  }

  // Phase 2: systematic scan — guarantees placement if any valid spot exists
  const rows = shuffle(Array.from({ length: n }, (_, i) => i));
  const cols = shuffle(Array.from({ length: n }, (_, i) => i));
  for (const dir of shuffledDirs) {
    for (const row of rows) {
      for (const col of cols) {
        if (canPlace(grid, word, row, col, dir)) {
          return placeWord(grid, word, row, col, dir);
        }
      }
    }
  }

  return null;
}

export function generatePuzzle(
  words: string[],
  gridSize: number,
  difficulty: Difficulty = "medium"
): Puzzle {
  const directions =
    difficulty === "easy"  ? EASY_DIRECTIONS  :
    difficulty === "hard"  ? HARD_DIRECTIONS  :
                             MEDIUM_DIRECTIONS;

  // Filter words by difficulty word-length rules
  let candidates = [...words];
  if (difficulty === "easy") {
    const short = candidates.filter(w => w.length <= EASY_MAX_WORD_LENGTH);
    if (short.length >= words.length) candidates = short;
  } else if (difficulty === "hard") {
    const long = candidates.filter(w => w.length >= HARD_MIN_WORD_LENGTH);
    if (long.length >= Math.ceil(words.length * 0.5)) candidates = long;
  }

  // Ensure no word is longer than the grid
  candidates = candidates.filter(w => w.length <= gridSize);

  // Sort: longest words first (harder to place, need priority)
  const sorted = [...candidates].sort((a, b) => b.length - a.length);

  const grid: string[][] = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(""));

  const placedWords: PlacedWord[] = [];

  for (const word of sorted) {
    const cells = placeWordGuaranteed(grid, word, directions);
    if (cells) {
      placedWords.push({ word, cells, found: false });
    }
  }

  // Fill empty cells
  const fillPool =
    difficulty === "easy"  ? EASY_FILL  :
    difficulty === "hard"  ? HARD_FILL  :
                             MEDIUM_FILL;

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c] === "") {
        grid[r][c] = fillPool[Math.floor(Math.random() * fillPool.length)];
      }
    }
  }

  return { grid, placedWords, gridSize };
}

export function getLineCells(
  start: CellCoord,
  end: CellCoord
): CellCoord[] | null {
  const dr = end.row - start.row;
  const dc = end.col - start.col;

  if (dr === 0 && dc === 0) return [start];

  const isHorizontal = dr === 0;
  const isVertical   = dc === 0;
  const isDiagonal   = Math.abs(dr) === Math.abs(dc);

  if (!isHorizontal && !isVertical && !isDiagonal) return null;

  const len   = Math.max(Math.abs(dr), Math.abs(dc));
  const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
  const stepC = dc === 0 ? 0 : dc / Math.abs(dc);

  const cells: CellCoord[] = [];
  for (let i = 0; i <= len; i++) {
    cells.push({
      row: start.row + stepR * i,
      col: start.col + stepC * i,
    });
  }
  return cells;
}

export function cellKey(cell: CellCoord): string {
  return `${cell.row}-${cell.col}`;
}
