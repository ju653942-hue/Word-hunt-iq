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

// Single attempt to place all words on a fresh grid
function tryOnce(
  words: string[],
  gridSize: number,
  difficulty: Difficulty
): PlacedWord[] {
  const directions =
    difficulty === "easy"  ? EASY_DIRECTIONS  :
    difficulty === "hard"  ? HARD_DIRECTIONS  :
                             MEDIUM_DIRECTIONS;

  const grid: string[][] = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(""));

  const placedWords: PlacedWord[] = [];

  // Sort longest words first — harder to place, so give them priority
  const shuffled = [...words]
    .sort(() => Math.random() - 0.5)
    .sort((a, b) => b.length - a.length);

  for (const word of shuffled) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 2000) {
      const row = Math.floor(Math.random() * gridSize);
      const col = Math.floor(Math.random() * gridSize);
      const dir = directions[Math.floor(Math.random() * directions.length)];
      if (canPlace(grid, word, row, col, dir)) {
        const cells = placeWord(grid, word, row, col, dir);
        placedWords.push({ word, cells, found: false });
        placed = true;
      }
      attempts++;
    }
  }

  return placedWords;
}

export function generatePuzzle(
  words: string[],
  gridSize: number,
  difficulty: Difficulty = "medium"
): Puzzle {
  // Filter words by difficulty word-length rules
  let candidates = [...words];
  if (difficulty === "easy") {
    const short = candidates.filter(w => w.length <= EASY_MAX_WORD_LENGTH);
    if (short.length >= words.length) candidates = short;
  } else if (difficulty === "hard") {
    const long = candidates.filter(w => w.length >= HARD_MIN_WORD_LENGTH);
    if (long.length >= Math.ceil(words.length * 0.5)) candidates = long;
  }

  // Retry up to 50 times to guarantee all words are placed
  let bestPlaced: PlacedWord[] = [];
  const needed = words.length;

  for (let attempt = 0; attempt < 50; attempt++) {
    const placed = tryOnce(candidates, gridSize, difficulty);
    if (placed.length > bestPlaced.length) bestPlaced = placed;
    if (bestPlaced.length >= needed) break;
  }

  // Rebuild final grid from placed words
  const finalGrid: string[][] = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(""));

  const directions =
    difficulty === "easy"  ? EASY_DIRECTIONS  :
    difficulty === "hard"  ? HARD_DIRECTIONS  :
                             MEDIUM_DIRECTIONS;

  // Re-place the best set of words in a clean grid (in same positions)
  const confirmed: PlacedWord[] = [];
  for (const pw of bestPlaced) {
    pw.cells.forEach((cell, i) => {
      finalGrid[cell.row][cell.col] = pw.word[i];
    });
    confirmed.push(pw);
  }

  // Fill empty cells
  const fillPool =
    difficulty === "easy"  ? EASY_FILL  :
    difficulty === "hard"  ? HARD_FILL  :
                             MEDIUM_FILL;

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (finalGrid[r][c] === "") {
        finalGrid[r][c] = fillPool[Math.floor(Math.random() * fillPool.length)];
      }
    }
  }

  return { grid: finalGrid, placedWords: confirmed, gridSize };
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
