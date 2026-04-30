// App.tsx — Modern 3-Column Layout

import React, { useState } from 'react';
import { GameProvider, useGame } from './state/GameContext';
import { Grid } from './components/Grid/Grid';
import { Dashboard } from './components/Dashboard/Dashboard';
import { KBPanel } from './components/KBPanel/KBPanel';

// ── Config Modal ──────────────────────────────────────────────────────────
function ConfigModal({ onStart }: { onStart: (r: number, c: number, p: number) => void }) {
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(4);
  const [pits, setPits] = useState(3);
  const maxPits = Math.max(1, rows * cols - 3);
  const safePits = Math.min(pits, maxPits);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal">
        <div className="modal__eyebrow">Knowledge-Based Agent</div>
        <h1 className="modal__title" id="modal-title">Wumpus World</h1>
        <p className="modal__desc">
          Configure the grid. The agent will use propositional logic and resolution refutation to navigate safely.
        </p>

        <div className="form-group">
          <label className="form-label" htmlFor="cfg-rows">
            Rows <span className="form-label__value">{rows}</span>
          </label>
          <input id="cfg-rows" type="range" min={3} max={8} value={rows} onChange={e => setRows(+e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="cfg-cols">
            Columns <span className="form-label__value">{cols}</span>
          </label>
          <input id="cfg-cols" type="range" min={3} max={8} value={cols} onChange={e => setCols(+e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="cfg-pits">
            Pits <span className="form-label__value">{safePits}</span>
          </label>
          <input id="cfg-pits" type="range" min={1} max={maxPits} value={safePits} onChange={e => setPits(+e.target.value)} />
        </div>

        <hr className="modal__divider" />

        <div className="modal__actions">
          <button id="btn-start" className="btn btn--primary" onClick={() => onStart(rows, cols, safePits)}>
            Start Episode →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Phase Chip ────────────────────────────────────────────────────────────
function PhaseChip() {
  const { state } = useGame();
  const map: Record<string, string> = {
    running: 'Running', config: 'Config',
    stuck: 'Stuck', won: 'Won', dead: 'Dead',
  };
  return <span className={`phase-chip phase-chip--${state.phase}`}>{map[state.phase] ?? state.phase}</span>;
}

// ── Game UI ───────────────────────────────────────────────────────────────
function GameUI() {
  const { state, dispatch } = useGame();
  const { phase, autoRun } = state;

  return (
    <>
      {phase === 'config' && (
        <ConfigModal onStart={(r, c, p) => dispatch({ type: 'INIT_GAME', rows: r, cols: c, numPits: p })} />
      )}

      <div className="app-layout">
        
        {/* LEFT SIDEBAR: Brand, Controls, Metrics */}
        <aside className="sidebar-left">
          <div className="brand-header">
            <div className="brand-logo">🕳️</div>
            <div className="brand-text">
              <h1>Wumpus Agent</h1>
              <span>Logic Engine</span>
            </div>
            <div className="brand-status">
              <PhaseChip />
            </div>
          </div>

          <div className="control-panel">
            <button className="btn btn--outline" disabled={phase !== 'running'} onClick={() => dispatch({ type: 'STEP_AGENT' })}>
              ⏭ Step
            </button>
            <button
              className={`btn ${autoRun ? 'btn--purple-active' : 'btn--outline'}`}
              disabled={phase !== 'running'}
              onClick={() => dispatch({ type: 'TOGGLE_AUTO_RUN' })}
            >
              {autoRun ? '⏸ Pause' : '▶ Auto'}
            </button>
            <button className="btn btn--red" onClick={() => dispatch({ type: 'RESET' })}>
              ↺ Reset
            </button>
          </div>

          <div className="metrics-scroll">
            <Dashboard />
          </div>
        </aside>

        {/* CENTER CANVAS: The Grid */}
        <main className="main-canvas">
          <div className="canvas-wrapper">
            <Grid />
          </div>
        </main>

        {/* RIGHT SIDEBAR: Knowledge Base Logs */}
        <aside className="sidebar-right">
          <KBPanel />
        </aside>

      </div>
    </>
  );
}

export default function App() {
  return (
    <GameProvider>
      <GameUI />
    </GameProvider>
  );
}
