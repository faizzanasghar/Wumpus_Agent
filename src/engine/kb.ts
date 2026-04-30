// kb.ts — Knowledge Base: TELL / ASK API

import type { Clause, Literal } from './cnf';
import { clauseKey } from './cnf';
import { resolve } from './resolution';

export interface KnowledgeBase {
  /** All clauses currently in the KB. */
  clauses: Clause[];
  /** Human-readable log of what was told to the KB. */
  tellLog: string[];
}

export interface AskResult {
  proved: boolean;
  inferenceSteps: number;
  log: string[];
}

/** Create an empty Knowledge Base. */
export function createKB(): KnowledgeBase {
  return { clauses: [], tellLog: [] };
}

/**
 * Add new clauses to the KB, deduplicating by canonical clause key.
 * Returns a new KB (immutable update).
 */
export function tellKB(kb: KnowledgeBase, newClauses: Clause[], logMsg: string): KnowledgeBase {
  const existingKeys = new Set(kb.clauses.map(clauseKey));
  const unique = newClauses.filter(c => !existingKeys.has(clauseKey(c)));
  return {
    clauses: [...kb.clauses, ...unique],
    tellLog: [...kb.tellLog, logMsg],
  };
}

/**
 * ASK the KB whether a given literal can be proved via resolution refutation.
 *
 * To prove "¬P_2_1" (cell 2,1 has no pit):
 *   - Add the clause [P_2_1] (negation of goal) to a copy of the KB
 *   - Run resolution — if empty clause derived → proved
 */
export function askKB(kb: KnowledgeBase, goal: Literal): AskResult {
  return resolve(kb.clauses, goal);
}
