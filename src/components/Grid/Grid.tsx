// Grid.tsx — Grid container with end-state overlay

import React from 'react';
import { Cell } from './Cell';
import { useGame } from '../../state/GameContext';
import { posKey } from '../../engine/world';
import type { CellMeta } from '../../state/gameReducer';

const defaultMeta: CellMeta = {
  visited: false, safeProven: false, dangerProven: false,
  breezePerceived: false, stenchPerceived: false,
};

const OVERLAYS: Record<string, { cls: string; icon: string; title: string; msg: string }> = {
  won:   { cls: 'grid-overlay--won',   icon: '🏆', title: 'Gold Found!',   msg: 'Agent reached the goal.' },
  dead:  { cls: 'grid-overlay--dead',  icon: '💀', title: 'Agent Died',    msg: 'Fell into a pit or met the Wumpus.' },
  stuck: { cls: 'grid-overlay--stuck', icon: '⚠️', title: 'Agent Stuck',   msg: 'No provably safe moves available.' },
};

export const Grid: React.FC = () => {
  const { state, dispatch } = useGame();
  const { rows, cols, world, agentPos, cellMeta, phase } = state;
  const isRevealed = phase === 'dead' || phase === 'won' || phase === 'stuck';
  const overlay = OVERLAYS[phase];

  return (
    <div
      className="ww-grid"
      role="grid"
      aria-label="Wumpus World Grid"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
    >
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const pos = { row: r, col: c };
          const key = posKey(pos);
          return (
            <Cell
              key={key} row={r} col={c}
              meta={cellMeta[key] ?? defaultMeta}
              worldCell={world[r]?.[c] ?? { hasPit: false, hasWumpus: false, hasGold: false }}
              isAgent={agentPos.row === r && agentPos.col === c}
              isRevealed={isRevealed}
            />
          );
        })
      )}

      {overlay && (
        <div className={`grid-overlay ${overlay.cls}`} role="status">
          <div className="grid-overlay__icon">{overlay.icon}</div>
          <div className="grid-overlay__title">{overlay.title}</div>
          <div className="grid-overlay__msg">{overlay.msg}</div>
          <button className="btn btn--outline" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}
            onClick={() => dispatch({ type: 'RESET' })}>
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};
