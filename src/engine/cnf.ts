// cnf.ts — Propositional Logic CNF conversion for Wumpus World percepts

import type { Position } from './world';
import { getAdjacentCells } from './world';

/**
 * A clause is a disjunction of literals, stored as an array of strings.
 * Literals use the format: "P_r_c" (pit at row r, col c) or "¬P_r_c" (negation).
 * Wumpus literals: "W_r_c" / "¬W_r_c"
 * Breeze literals: "B_r_c" / "¬B_r_c"
 * Stench literals: "S_r_c" / "¬S_r_c"
 */
export type Literal = string;
export type Clause = Literal[];   // disjunction

/** Negate a literal string. */
export function negateLiteral(lit: Literal): Literal {
  return lit.startsWith('¬') ? lit.slice(1) : `¬${lit}`;
}

/**
 * TELL the KB that a breeze WAS perceived at position pos.
 * Encodes: B_r_c ⟺ (P_adj1 ∨ P_adj2 ∨ ...)
 *
 * Forward:  (¬B_r_c ∨ P_adj1 ∨ P_adj2 ∨ ...)
 * Backward: (¬P_adj1 ∨ B_r_c), (¬P_adj2 ∨ B_r_c), ...
 * Unit:     B_r_c
 */
export function tellBreeze(pos: Position, rows: number, cols: number): Clause[] {
  const bLit = `B_${pos.row}_${pos.col}`;
  const adjPits = getAdjacentCells(pos, rows, cols).map(
    p => `P_${p.row}_${p.col}`
  );

  const clauses: Clause[] = [];

  // Unit clause — breeze observed
  clauses.push([bLit]);

  if (adjPits.length > 0) {
    // Forward: ¬B ∨ P_adj1 ∨ P_adj2 ∨ ...
    clauses.push([`¬${bLit}`, ...adjPits]);

    // Backward: ¬P_adj_i ∨ B  (one per adjacent cell)
    adjPits.forEach(p => clauses.push([`¬${p}`, bLit]));
  }

  return clauses;
}

/**
 * TELL the KB that NO breeze was perceived at position pos.
 * Encodes: ¬B_r_c  →  ¬P_adj1 ∧ ¬P_adj2 ∧ ...
 *
 * Unit:  ¬B_r_c
 * Units: ¬P_adj1, ¬P_adj2, ... (directly eliminate adjacents as pit candidates)
 */
export function tellNoBreeze(pos: Position, rows: number, cols: number): Clause[] {
  const bLit = `B_${pos.row}_${pos.col}`;
  const adjPits = getAdjacentCells(pos, rows, cols).map(p => `P_${p.row}_${p.col}`);

  const clauses: Clause[] = [];
  clauses.push([`¬${bLit}`]);
  adjPits.forEach(p => clauses.push([`¬${p}`]));
  return clauses;
}

/**
 * TELL the KB that a stench WAS perceived at position pos.
 * Encodes: S_r_c ⟺ (W_adj1 ∨ W_adj2 ∨ ...)
 */
export function tellStench(pos: Position, rows: number, cols: number): Clause[] {
  const sLit = `S_${pos.row}_${pos.col}`;
  const adjW = getAdjacentCells(pos, rows, cols).map(p => `W_${p.row}_${p.col}`);

  const clauses: Clause[] = [];
  clauses.push([sLit]);

  if (adjW.length > 0) {
    clauses.push([`¬${sLit}`, ...adjW]);
    adjW.forEach(w => clauses.push([`¬${w}`, sLit]));
  }

  return clauses;
}

/**
 * TELL the KB that NO stench was perceived at position pos.
 * Eliminates adjacent wumpus candidates directly.
 */
export function tellNoStench(pos: Position, rows: number, cols: number): Clause[] {
  const sLit = `S_${pos.row}_${pos.col}`;
  const adjW = getAdjacentCells(pos, rows, cols).map(p => `W_${p.row}_${p.col}`);

  const clauses: Clause[] = [];
  clauses.push([`¬${sLit}`]);
  adjW.forEach(w => clauses.push([`¬${w}`]));
  return clauses;
}

/**
 * Assert that the agent visited a cell and it is safe (no pit, no wumpus).
 * Encodes: ¬P_r_c, ¬W_r_c
 */
export function tellSafeVisited(pos: Position): Clause[] {
  return [
    [`¬P_${pos.row}_${pos.col}`],
    [`¬W_${pos.row}_${pos.col}`],
  ];
}

/** Serialise a clause to a canonical string for deduplication. */
export function clauseKey(clause: Clause): string {
  return [...clause].sort().join('|');
}
