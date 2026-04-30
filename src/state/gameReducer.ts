// gameReducer.ts — Pure reducer managing all game state

import type { WorldGrid, Position, Percept } from '../engine/world';
import {
  generateWorld,
  getAdjacentCells,
  getPercepts,
  posKey,
} from '../engine/world';
import type { KnowledgeBase } from '../engine/kb';
import { createKB, tellKB, askKB } from '../engine/kb';
import type { AskResult } from '../engine/kb';
import {
  tellBreeze,
  tellNoBreeze,
  tellStench,
  tellNoStench,
  tellSafeVisited,
} from '../engine/cnf';

// ─── State ───────────────────────────────────────────────────────────────────

export type GamePhase = 'config' | 'running' | 'won' | 'dead' | 'stuck';

export interface CellMeta {
  visited: boolean;
  safeProven: boolean;
  dangerProven: boolean;   // confirmed pit or wumpus (after discovery)
  breezePerceived: boolean;
  stenchPerceived: boolean;
}

export interface ResolutionEntry {
  query: string;
  result: AskResult;
}

export interface GameState {
  // Config
  rows: number;
  cols: number;
  numPits: number;

  // World (hidden from agent logic — only used for rendering and percept computation)
  world: WorldGrid;

  // Agent
  agentPos: Position;

  // Per-cell metadata (agent's knowledge)
  cellMeta: Record<string, CellMeta>;   // keyed by posKey

  // Knowledge Base
  kb: KnowledgeBase;

  // Metrics
  inferenceSteps: number;
  cellsVisited: number;
  activePercepts: Percept;
  lastResolutionLog: string[];
  resolutionHistory: ResolutionEntry[];

  // Step narrative
  stepLog: string[];

  // Phase
  phase: GamePhase;
  autoRun: boolean;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export type GameAction =
  | { type: 'INIT_GAME'; rows: number; cols: number; numPits: number }
  | { type: 'STEP_AGENT' }
  | { type: 'TOGGLE_AUTO_RUN' }
  | { type: 'RESET' };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function defaultCellMeta(): CellMeta {
  return {
    visited: false,
    safeProven: false,
    dangerProven: false,
    breezePerceived: false,
    stenchPerceived: false,
  };
}

function getMeta(cellMeta: Record<string, CellMeta>, pos: Position): CellMeta {
  return cellMeta[posKey(pos)] ?? defaultCellMeta();
}

function setMeta(
  cellMeta: Record<string, CellMeta>,
  pos: Position,
  patch: Partial<CellMeta>
): Record<string, CellMeta> {
  const key = posKey(pos);
  return {
    ...cellMeta,
    [key]: { ...getMeta(cellMeta, pos), ...patch },
  };
}

// ─── Initial State ────────────────────────────────────────────────────────────

function buildInitialState(rows: number, cols: number, numPits: number): GameState {
  const world = generateWorld(rows, cols, numPits);
  const agentPos: Position = { row: 0, col: 0 };
  const percepts = getPercepts(agentPos, world, rows, cols);

  // TELL KB: agent is at [0,0], which is safe; and initial percepts
  let kb = createKB();
  kb = tellKB(kb, tellSafeVisited(agentPos), `Agent starts at [0,0] — safe`);
  kb = processPercepts(kb, agentPos, percepts, rows, cols);

  const cellMeta: Record<string, CellMeta> = {};
  const key = posKey(agentPos);
  cellMeta[key] = {
    visited: true,
    safeProven: true,
    dangerProven: false,
    breezePerceived: percepts.breeze,
    stenchPerceived: percepts.stench,
  };

  return {
    rows,
    cols,
    numPits,
    world,
    agentPos,
    cellMeta,
    kb,
    inferenceSteps: 0,
    cellsVisited: 1,
    activePercepts: percepts,
    lastResolutionLog: [],
    resolutionHistory: [],
    stepLog: [`▶ Game started. Agent at [0,0]. Percepts: ${describePercepts(percepts)}`],
    phase: percepts.glitter ? 'won' : 'running',
    autoRun: false,
  };
}

/** Apply percepts at pos to the KB. */
function processPercepts(
  kb: KnowledgeBase,
  pos: Position,
  percepts: Percept,
  rows: number,
  cols: number
): KnowledgeBase {
  if (percepts.breeze) {
    kb = tellKB(kb, tellBreeze(pos, rows, cols), `TELL: Breeze at [${pos.row},${pos.col}]`);
  } else {
    kb = tellKB(kb, tellNoBreeze(pos, rows, cols), `TELL: No breeze at [${pos.row},${pos.col}]`);
  }

  if (percepts.stench) {
    kb = tellKB(kb, tellStench(pos, rows, cols), `TELL: Stench at [${pos.row},${pos.col}]`);
  } else {
    kb = tellKB(kb, tellNoStench(pos, rows, cols), `TELL: No stench at [${pos.row},${pos.col}]`);
  }

  return kb;
}

function describePercepts(p: Percept): string {
  const parts = [];
  if (p.breeze) parts.push('Breeze');
  if (p.stench) parts.push('Stench');
  if (p.glitter) parts.push('Glitter');
  if (parts.length === 0) parts.push('None');
  return parts.join(', ');
}

// ─── STEP_AGENT Logic ─────────────────────────────────────────────────────────

function findPath(start: Position, goal: Position, rows: number, cols: number, cellMeta: Record<string, CellMeta>): Position[] | null {
  const queue: { pos: Position, path: Position[] }[] = [{ pos: start, path: [] }];
  const visited = new Set<string>();
  visited.add(posKey(start));

  while (queue.length > 0) {
    const { pos, path } = queue.shift()!;
    if (pos.row === goal.row && pos.col === goal.col) {
      return path;
    }

    const adjs = getAdjacentCells(pos, rows, cols);
    for (const adj of adjs) {
      const key = posKey(adj);
      if (!visited.has(key)) {
        const meta = cellMeta[key] ?? defaultCellMeta();
        const isGoal = adj.row === goal.row && adj.col === goal.col;
        if (meta.visited || isGoal) {
          visited.add(key);
          queue.push({ pos: adj, path: [...path, adj] });
        }
      }
    }
  }
  return null;
}

function stepAgent(state: GameState): GameState {
  if (state.phase !== 'running') return state;

  const { agentPos, world, rows, cols, kb } = state;
  let { inferenceSteps, resolutionHistory, stepLog } = state;
  let newKb = kb;
  let newCellMeta = { ...state.cellMeta };
  const newLog: string[] = [];

  // 1. Identify frontier: unvisited cells adjacent to at least one visited cell
  const frontier = new Map<string, Position>();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const pos = { row: r, col: c };
      const meta = getMeta(newCellMeta, pos);
      if (meta.visited) {
        const adjs = getAdjacentCells(pos, rows, cols);
        for (const adj of adjs) {
          if (!getMeta(newCellMeta, adj).visited) {
            frontier.set(posKey(adj), adj);
          }
        }
      }
    }
  }

  // 2. ASK about all frontier cells that aren't already proven
  for (const [key, adj] of frontier.entries()) {
    const meta = getMeta(newCellMeta, adj);
    if (meta.safeProven || meta.dangerProven) continue;

    const pitQuery = `¬P_${adj.row}_${adj.col}`;
    const pitResult = askKB(newKb, pitQuery);
    inferenceSteps += pitResult.inferenceSteps;
    resolutionHistory = [...resolutionHistory, { query: pitQuery, result: pitResult }];

    const wumpusQuery = `¬W_${adj.row}_${adj.col}`;
    const wumpusResult = askKB(newKb, wumpusQuery);
    inferenceSteps += wumpusResult.inferenceSteps;
    resolutionHistory = [...resolutionHistory, { query: wumpusQuery, result: wumpusResult }];

    newLog.push(...pitResult.log, ...wumpusResult.log);

    if (pitResult.proved && wumpusResult.proved) {
      newCellMeta = setMeta(newCellMeta, adj, { safeProven: true });
      stepLog = [...stepLog, `✓ [${adj.row},${adj.col}] proven safe`];
    } else {
      stepLog = [...stepLog, `? [${adj.row},${adj.col}] cannot be proven safe`];
    }
  }

  // 3. Find all unvisited safe cells
  const safeUnvisited: Position[] = [];
  for (const [key, adj] of frontier.entries()) {
    const meta = getMeta(newCellMeta, adj);
    if (meta.safeProven && !meta.visited) {
      safeUnvisited.push(adj);
    }
  }

  if (safeUnvisited.length === 0) {
    stepLog = [...stepLog, `⚠ STUCK — mathematically unprovable. No safe unvisited cells exist.`];
    return {
      ...state,
      cellMeta: newCellMeta,
      inferenceSteps,
      resolutionHistory,
      lastResolutionLog: newLog,
      stepLog,
      phase: 'stuck',
    };
  }

  // 4. Pick closest safe unvisited cell via BFS
  let bestPath: Position[] | null = null;
  for (const target of safeUnvisited) {
    const path = findPath(agentPos, target, rows, cols, newCellMeta);
    if (path && (!bestPath || path.length < bestPath.length)) {
      bestPath = path;
    }
  }

  if (!bestPath || bestPath.length === 0) {
    stepLog = [...stepLog, `⚠ STUCK — Cannot route to safe cells.`];
    return { ...state, cellMeta: newCellMeta, phase: 'stuck' };
  }

  // Next move is the first step on the path towards the target
  const newPos = bestPath[0];
  const percepts = getPercepts(newPos, world, rows, cols);
  const isFirstVisit = !getMeta(newCellMeta, newPos).visited;

  let won = false;
  let died = false;

  if (isFirstVisit) {
    const targetCell = world[newPos.row][newPos.col];
    if (targetCell.hasPit || targetCell.hasWumpus) {
      died = true;
      const hazard = targetCell.hasPit ? 'PIT' : 'WUMPUS';
      stepLog = [...stepLog, `💀 FAILED PROOF! Agent hit ${hazard} at [${newPos.row},${newPos.col}]`];
    } else {
      newKb = tellKB(newKb, tellSafeVisited(newPos), `TELL: Visited [${newPos.row},${newPos.col}] — safe`);
      newKb = processPercepts(newKb, newPos, percepts, rows, cols);
      won = percepts.glitter;
      if (won) stepLog = [...stepLog, `🏆 Found the gold at [${newPos.row},${newPos.col}]!`];
    }
  }

  newCellMeta = setMeta(newCellMeta, newPos, {
    visited: true,
    dangerProven: died,
    safeProven: !died,
    breezePerceived: percepts.breeze,
    stenchPerceived: percepts.stench,
  });

  stepLog = [
    ...stepLog,
    `→ Agent moved to [${newPos.row},${newPos.col}]. Percepts: ${describePercepts(percepts)}`,
  ];

  const visitedCount = Object.values(newCellMeta).filter(m => m.visited).length;

  return {
    ...state,
    agentPos: newPos,
    cellMeta: newCellMeta,
    kb: newKb,
    inferenceSteps,
    cellsVisited: visitedCount,
    activePercepts: percepts,
    lastResolutionLog: newLog,
    resolutionHistory,
    stepLog,
    phase: died ? 'dead' : won ? 'won' : 'running',
  };
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT_GAME':
      return buildInitialState(action.rows, action.cols, action.numPits);

    case 'STEP_AGENT':
      return stepAgent(state);

    case 'TOGGLE_AUTO_RUN':
      return { ...state, autoRun: !state.autoRun };

    case 'RESET':
      return { ...state, phase: 'config', autoRun: false };

    default:
      return state;
  }
}

export const defaultGameState: GameState = {
  rows: 4,
  cols: 4,
  numPits: 3,
  world: [],
  agentPos: { row: 0, col: 0 },
  cellMeta: {},
  kb: createKB(),
  inferenceSteps: 0,
  cellsVisited: 0,
  activePercepts: { breeze: false, stench: false, glitter: false, bump: false, scream: false },
  lastResolutionLog: [],
  resolutionHistory: [],
  stepLog: [],
  phase: 'config',
  autoRun: false,
};
