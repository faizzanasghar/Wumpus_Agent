// Dashboard.tsx — Redesigned right-panel

import React from 'react';
import { MetricCard } from './MetricCard';
import { useGame } from '../../state/GameContext';

export const Dashboard: React.FC = () => {
  const { state } = useGame();
  const { inferenceSteps, cellsVisited, kb, activePercepts, rows, cols } = state;
  const total = rows * cols;

  return (
    <div className="dashboard" aria-label="Metrics Dashboard">

      {/* Metrics */}
      <div>
        <div className="dashboard__section-label">Metrics</div>
        <div className="dashboard__cards">
          <MetricCard
            id="metric-inference"
            title="Inference Steps"
            value={inferenceSteps}
            subtitle="Resolution pairs resolved"
            accent="purple"
            icon="⚙️"
          />
          <MetricCard
            id="metric-cells"
            title="Cells Visited"
            value={cellsVisited}
            subtitle={`of ${total} total cells`}
            accent="green"
            icon="🗺️"
          />
          <MetricCard
            id="metric-clauses"
            title="KB Clauses"
            value={kb.clauses.length}
            subtitle="Propositional clauses"
            accent="blue"
            icon="📚"
          />
          <div className="metric-card" id="metric-percepts">
            <div className="metric-card__icon">👀</div>
            <div>
              <div className="metric-card__title">Active Percepts</div>
              <div className="metric-card__value" style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                {activePercepts.breeze  && <span className="pill pill--breeze">Breeze</span>}
                {activePercepts.stench  && <span className="pill pill--stench">Stench</span>}
                {activePercepts.glitter && <span className="pill pill--glitter">Glitter</span>}
                {!activePercepts.breeze && !activePercepts.stench && !activePercepts.glitter && (
                  <span className="pill pill--none">None</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div>
        <div className="dashboard__section-label">Legend</div>
        <div className="legend-rows">
          {[
            ['agent',   'Agent'],
            ['safe',    'Safe / Visited'],
            ['breeze',  'Breeze'],
            ['stench',  'Stench'],
            ['danger',  'Danger'],
            ['unknown', 'Unknown'],
          ].map(([key, label]) => (
            <div key={key} className="legend-item">
              <span className={`legend-dot legend-dot--${key}`} />
              <span className="legend-text">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
