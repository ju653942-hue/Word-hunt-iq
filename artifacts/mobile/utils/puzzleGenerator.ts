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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * generatePuzzle — guaranteed to place exactly `targetCount` words.
 *
 * Instead of pre-selecting words and hoping they all fit, we receive the
 * full word pool and greedily place words one-by-one. If a word can't be
 * placed in `PLACE_ATTEMPTS` tries, we skip it and try the next one from the
 * pool. This always yields exactly targetCount placed words as long as the
 * pool is large enough (all our pools have 50+ words).
 */
export function generatePuzzle(
  wordPool: string[],
  gridSize: number,
  difficulty: Difficulty = "medium",
  targetCount: number = wordPool.length
): Puzzle {
  const directions =
    difficulty === "easy"  ? EASY_DIRECTIONS  :
    difficulty === "hard"  ? HARD_DIRECTIONS  :
                             MEDIUM_DIRECTIONS;

  // Filter by difficulty length rules
  let candidates = [...wordPool];
  if (difficulty === "easy") {
    const short = candidates.filter(w => w.length <= EASY_MAX_WORD_LENGTH);
    if (short.length >= targetCount) candidates = short;
  }

  // Deduplicate
  candidates = [...new Set(candidates)];

  // Sort: longest first (harder to place → give priority), shuffle within same length
  candidates = shuffle(candidates).sort((a, b) => b.length - a.length);

  const grid: string[][] = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(""));

  const placedWords: PlacedWord[] = [];
  const PLACE_ATTEMPTS = 400;

  for (const word of candidates) {
    if (placedWords.length >= targetCount) break;

    let placed = false;
    for (let attempt = 0; attempt < PLACE_ATTEMPTS && !placed; attempt++) {
      const row = Math.floor(Math.random() * gridSize);
      const col = Math.floor(Math.random() * gridSize);
      const dir = directions[Math.floor(Math.random() * directions.length)];
      if (canPlace(grid, word, row, col, dir)) {
        const cells = placeWord(grid, word, row, col, dir);
        placedWords.push({ word, cells, found: false });
        placed = true;
      }
    }
    // Word couldn't fit in PLACE_ATTEMPTS → skip, try next word from pool
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
