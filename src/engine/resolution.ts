// resolution.ts — Resolution Refutation Inference Engine

import type { Clause, Literal } from './cnf';
import { clauseKey, negateLiteral } from './cnf';
import type { AskResult } from './kb';

/**
 * Resolution Refutation
 *
 * To prove `goal` (e.g. "¬P_2_1"):
 *  1. Add the negation of the goal as a unit clause: [negateLiteral(goal)]
 *     e.g., to prove ¬P_2_1 → add [P_2_1]
 *  2. Repeatedly pick clause pairs (Ci, Cj) where Ci contains literal L and
 *     Cj contains ¬L.
 *  3. Resolvent = (Ci ∪ Cj) \ {L, ¬L}
 *  4. If resolvent == {} → contradiction → goal is proved.
 *  5. If no new resolvents can be generated → not provable.
 *
 * Each unique resolvent generation counts as +1 inference step.
 */
export function resolve(kbClauses: Clause[], goal: Literal): AskResult {
  // Working set of clauses (KB + negated goal)
  const negGoal: Clause = [negateLiteral(goal)];
  const working: Clause[] = [...kbClauses, negGoal];

  const seenKeys = new Set<string>(working.map(clauseKey));
  const log: string[] = [
    `Goal: prove ${goal}`,
    `Negated goal added: [${negGoal.join(', ')}]`,
    `Initial clause count: ${working.length}`,
  ];

  let inferenceSteps = 0;
  let newClausesFound = true;

  while (newClausesFound) {
    newClausesFound = false;
    const n = working.length;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const resolvents = resolvePair(working[i], working[j]);

        for (const resolvent of resolvents) {
          inferenceSteps++;
          const key = clauseKey(resolvent);

          // Contradiction found — return success
          if (resolvent.length === 0) {
            log.push(
              `Step ${inferenceSteps}: Resolve [${working[i].join(', ')}] ` +
              `with [${working[j].join(', ')}] → ∅  ← CONTRADICTION`
            );
            log.push(`✓ Proved: ${goal}`);
            return { proved: true, inferenceSteps, log };
          }

          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            working.push(resolvent);
            newClausesFound = true;
            log.push(
              `Step ${inferenceSteps}: Resolve [${working[i].join(', ')}] ` +
              `with [${working[j].join(', ')}] → [${resolvent.join(', ')}]`
            );
          }
        }
      }
    }
  }

  log.push(`✗ Could not prove: ${goal} (no contradiction found)`);
  return { proved: false, inferenceSteps, log };
}

/**
 * Given two clauses, find all literals L in Ci and ¬L in Cj,
 * and return all corresponding resolvents.
 * Returns [] if no complementary literal pairs exist.
 */
function resolvePair(ci: Clause, cj: Clause): Clause[] {
  const resolvents: Clause[] = [];

  for (const lit of ci) {
    const complement = negateLiteral(lit);
    if (cj.includes(complement)) {
      // Remove lit from ci and complement from cj
      const resolvent: Clause = [
        ...ci.filter(l => l !== lit),
        ...cj.filter(l => l !== complement),
      ];
      // Deduplicate literals within the resolvent
      const deduped = [...new Set(resolvent)];
      // Skip tautologies (e.g., contains X and ¬X)
      if (!isTautology(deduped)) {
        resolvents.push(deduped);
      }
    }
  }

  return resolvents;
}

/** A clause is a tautology if it contains both L and ¬L. */
function isTautology(clause: Clause): boolean {
  const litSet = new Set(clause);
  return clause.some(lit => litSet.has(negateLiteral(lit)));
}
