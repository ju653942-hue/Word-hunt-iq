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
// Easy:   4 directions — right, down, diagonal-down-right, diagonal-down-left
//         Words only go "forward" — easiest to visually scan
// Medium: 6 directions — adds left and up (no diagonal backwards)
//         Introduces reverse horizontal/vertical for challenge
// Hard:   All 8 directions — backwards, reverse-diagonal, full chaos

const EASY_DIRECTIONS: CellCoord[] = [
  { row: 0,  col: 1  }, // right
  { row: 1,  col: 0  }, // down
  { row: 1,  col: 1  }, // diagonal down-right
  { row: 1,  col: -1 }, // diagonal down-left
];

const MEDIUM_DIRECTIONS: CellCoord[] = [
  { row: 0,  col: 1  }, // right
  { row: 0,  col: -1 }, // left
  { row: 1,  col: 0  }, // down
  { row: -1, col: 0  }, // up
  { row: 1,  col: 1  }, // diagonal down-right
  { row: 1,  col: -1 }, // diagonal down-left
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
// Easy:   Common English letters only — avoids confusing clusters
// Medium: Standard minus uncommon letters (Q, X, Z)
// Hard:   Full alphabet — includes rare letters for maximum camouflage

const EASY_FILL   = "AABCDEEEEFGHIIIIJKLLLMNNNOOORRSSSTTTUUUVWWY";
const MEDIUM_FILL = "ABCDEFGHIJKLMNOPRSTUVWY";
const HARD_FILL   = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// ── Word length limits per difficulty ────────────────────────────────────────
// Easy:   Prefer shorter words (≤6 chars) — less overwhelming
// Medium: All words
// Hard:   Prefer longer words (≥4 chars) — harder to find

const EASY_MAX_WORD_LENGTH   = 7;
const HARD_MIN_WORD_LENGTH   = 4;

// ────────────────────────────────────────────────────────────────────────────

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

export function generatePuzzle(
  words: string[],
  gridSize: number,
  difficulty: Difficulty = "medium"
): Puzzle {
  // Pick direction set
  const directions =
    difficulty === "easy"   ? EASY_DIRECTIONS   :
    difficulty === "hard"   ? HARD_DIRECTIONS   :
                              MEDIUM_DIRECTIONS;

  // Filter words by difficulty word-length rules
  let candidates = [...words];
  if (difficulty === "easy") {
    const short = candidates.filter(w => w.length <= EASY_MAX_WORD_LENGTH);
    candidates = short.length >= Math.ceil(words.length * 0.5) ? short : candidates;
  } else if (difficulty === "hard") {
    const long = candidates.filter(w => w.length >= HARD_MIN_WORD_LENGTH);
    candidates = long.length >= Math.ceil(words.length * 0.5) ? long : candidates;
  }

  const grid: string[][] = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(""));

  const placedWords: PlacedWord[] = [];

  // Shuffle and attempt placement
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);

  for (const word of shuffled) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 300) {
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

  // Fill empty cells with difficulty-appropriate letters
  const fillPool =
    difficulty === "easy"   ? EASY_FILL   :
    difficulty === "hard"   ? HARD_FILL   :
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
