// Cell.tsx — Individual grid cell with color-coded state

import React from 'react';
import type { CellMeta } from '../../state/gameReducer';
import type { WorldCell } from '../../engine/world';

interface CellProps {
  row: number;
  col: number;
  meta: CellMeta;
  worldCell: WorldCell;   // only used for label rendering — NOT for safety decisions
  isAgent: boolean;
  isRevealed: boolean;    // reveal world contents on game over / win
}

function getCellClass(
  meta: CellMeta,
  isAgent: boolean,
  worldCell: WorldCell,
  isRevealed: boolean
): string {
  const classes = ['ww-cell'];

  if (isAgent) {
    classes.push('cell--agent');
  } else if (meta.dangerProven || (isRevealed && (worldCell.hasPit || worldCell.hasWumpus))) {
    classes.push('cell--danger');
  } else if (meta.safeProven && meta.visited) {
    classes.push('cell--safe');
    if (meta.breezePerceived) classes.push('cell--breeze');
    if (meta.stenchPerceived) classes.push('cell--stench');
  } else if (meta.visited) {
    if (meta.breezePerceived) classes.push('cell--breeze');
    else if (meta.stenchPerceived) classes.push('cell--stench');
    else classes.push('cell--visited');
  } else {
    classes.push('cell--unknown');
  }

  return classes.join(' ');
}

function getCellLabel(
  meta: CellMeta,
  isAgent: boolean,
  worldCell: WorldCell,
  isRevealed: boolean
): string {
  if (isAgent) return 'A';
  if (isRevealed) {
    if (worldCell.hasPit) return 'P';
    if (worldCell.hasWumpus) return 'W';
    if (worldCell.hasGold) return '★';
  }
  if (meta.dangerProven) {
    return worldCell.hasPit ? 'P' : 'W';
  }
  if (meta.visited && meta.safeProven) return '';
  if (meta.visited) return '';
  return '?';
}

export const Cell: React.FC<CellProps> = ({
  row, col, meta, worldCell, isAgent, isRevealed,
}) => {
  const className = getCellClass(meta, isAgent, worldCell, isRevealed);
  const label = getCellLabel(meta, isAgent, worldCell, isRevealed);

  return (
    <div
      className={className}
      data-row={row}
      data-col={col}
      aria-label={`Cell ${row},${col}: ${label || 'unknown'}`}
      role="gridcell"
    >
      <span className="cell-label">{label}</span>
      {meta.breezePerceived && meta.visited && !isAgent && (
        <span className="cell-percept cell-percept--breeze" title="Breeze">🌬️</span>
      )}
      {meta.stenchPerceived && meta.visited && !isAgent && (
        <span className="cell-percept cell-percept--stench" title="Stench">💨</span>
      )}
    </div>
  );
};
