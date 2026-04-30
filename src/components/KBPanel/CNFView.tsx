// CNFView.tsx — KB clauses in formal CNF notation

import React from 'react';
import { useGame } from '../../state/GameContext';

/** Format a literal for display, converting ¬ to proper symbol and subscript positions */
function formatLiteral(lit: string): string {
  return lit.replace(/_(\d+)_(\d+)/g, '<sub>$1,$2</sub>');
}

function formatClause(clause: string[]): string {
  if (clause.length === 0) return '□';  // empty clause / contradiction
  if (clause.length === 1) return clause[0];
  return `(${clause.join(' ∨ ')})`;
}

export const CNFView: React.FC = () => {
  const { state } = useGame();
  const { kb } = state;

  if (kb.clauses.length === 0) {
    return <p className="kb-empty">No clauses in KB yet.</p>;
  }

  // Group into unit clauses and multi-literal clauses
  const units = kb.clauses.filter(c => c.length === 1);
  const multi = kb.clauses.filter(c => c.length > 1);

  return (
    <div className="cnf-view">
      <div className="cnf-conjunction">
        {kb.clauses.map((clause, i) => (
          <span key={i} className={`cnf-clause ${clause.length === 1 ? 'cnf-clause--unit' : ''}`}>
            <span
              className="cnf-clause__text"
              dangerouslySetInnerHTML={{ __html: formatClause(clause.map(formatLiteral)) }}
            />
            {i < kb.clauses.length - 1 && (
              <span className="cnf-clause__and"> ∧ </span>
            )}
          </span>
        ))}
      </div>
      <div className="cnf-stats">
        <span>{units.length} unit clauses</span>
        <span>{multi.length} multi-literal clauses</span>
        <span>{kb.clauses.length} total</span>
      </div>
    </div>
  );
};
