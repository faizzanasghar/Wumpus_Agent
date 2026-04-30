// world.ts — Environment state (hidden from the agent)

export interface WorldCell {
  hasPit: boolean;
  hasWumpus: boolean;
  hasGold: boolean;
}

export type WorldGrid = WorldCell[][];

export interface Position {
  row: number;
  col: number;
}

export interface Percept {
  breeze: boolean;   // adjacent to pit
  stench: boolean;   // adjacent to wumpus
  glitter: boolean;  // gold in current cell
  bump: boolean;     // walked into wall (unused in grid model)
  scream: boolean;   // wumpus killed (unused here)
}

/** Generate a fresh world grid with randomly placed pits, 1 wumpus, 1 gold. */
export function generateWorld(rows: number, cols: number, numPits: number): WorldGrid {
  // Initialise empty grid
  const grid: WorldGrid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, (): WorldCell => ({
      hasPit: false,
      hasWumpus: false,
      hasGold: false,
    }))
  );

  // Build a list of all cells except [0,0] (agent start)
  const candidates: Position[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r !== 0 || c !== 0) candidates.push({ row: r, col: c });
    }
  }

  // Shuffle candidates (Fisher-Yates)
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  // Place pits
  const clampedPits = Math.min(numPits, candidates.length - 2);
  for (let i = 0; i < clampedPits; i++) {
    grid[candidates[i].row][candidates[i].col].hasPit = true;
  }

  // Place wumpus
  grid[candidates[clampedPits].row][candidates[clampedPits].col].hasWumpus = true;

  // Place gold
  grid[candidates[clampedPits + 1].row][candidates[clampedPits + 1].col].hasGold = true;

  return grid;
}

/** Return all valid adjacent cells (4-directional). */
export function getAdjacentCells(pos: Position, rows: number, cols: number): Position[] {
  const { row, col } = pos;
  return [
    { row: row - 1, col },
    { row: row + 1, col },
    { row, col: col - 1 },
    { row, col: col + 1 },
  ].filter(p => p.row >= 0 && p.row < rows && p.col >= 0 && p.col < cols);
}

/** Compute percepts at a given position given the world state. */
export function getPercepts(pos: Position, world: WorldGrid, rows: number, cols: number): Percept {
  const cell = world[pos.row][pos.col];
  const adj = getAdjacentCells(pos, rows, cols);

  return {
    breeze: adj.some(p => world[p.row][p.col].hasPit),
    stench: adj.some(p => world[p.row][p.col].hasWumpus),
    glitter: cell.hasGold,
    bump: false,
    scream: false,
  };
}

/** Serialise a position to a string key, e.g. "2_3". */
export function posKey(pos: Position): string {
  return `${pos.row}_${pos.col}`;
}

/** Parse a "r_c" key back into a Position. */
export function keyToPos(key: string): Position {
  const [r, c] = key.split('_').map(Number);
  return { row: r, col: c };
}
