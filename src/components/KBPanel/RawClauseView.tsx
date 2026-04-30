// RawClauseView.tsx — Raw KB clause list

import React from 'react';
import { useGame } from '../../state/GameContext';

export const RawClauseView: React.FC = () => {
  const { state } = useGame();
  const { kb } = state;

  if (kb.clauses.length === 0) {
    return <p className="kb-empty">No clauses in KB yet.</p>;
  }

  return (
    <div className="kb-clause-list">
      {kb.clauses.map((clause, i) => (
        <div key={i} className="kb-clause">
          <span className="kb-clause__index">{i + 1}.</span>
          <span className="kb-clause__literals">
            {clause.length === 0
              ? '∅ (empty — contradiction)'
              : clause.join(' ∨ ')}
          </span>
        </div>
      ))}
    </div>
  );
};
