// ResolutionLog.tsx — Step-by-step proof log

import React from 'react';
import { useGame } from '../../state/GameContext';

export const ResolutionLog: React.FC = () => {
  const { state } = useGame();
  const { resolutionHistory, lastResolutionLog } = state;

  if (resolutionHistory.length === 0) {
    return <p className="kb-empty">No inference queries yet. Step the agent to begin.</p>;
  }

  const lastTwo = resolutionHistory.slice(-2);

  return (
    <div className="resolution-log">
      {/* Summary of most recent queries */}
      <div className="resolution-summary">
        {lastTwo.map((entry, i) => (
          <div key={i} className={`resolution-entry ${entry.result.proved ? 'resolution-entry--proved' : 'resolution-entry--failed'}`}>
            <div className="resolution-entry__header">
              <span className="resolution-entry__query">ASK: {entry.query}</span>
              <span className={`resolution-entry__verdict ${entry.result.proved ? 'verdict--proved' : 'verdict--failed'}`}>
                {entry.result.proved ? '✓ PROVED' : '✗ UNKNOWN'}
              </span>
              <span className="resolution-entry__steps">
                {entry.result.inferenceSteps} step{entry.result.inferenceSteps !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Full log of last proof attempt */}
      <div className="resolution-full-log">
        <h4 className="resolution-full-log__title">Last Proof Trace</h4>
        <div className="resolution-steps">
          {lastResolutionLog.map((line, i) => {
            const isContradiction = line.includes('CONTRADICTION');
            const isProved = line.includes('✓ Proved') || line.includes('✓ proved');
            const isFailed = line.includes('✗ Could not');
            const isGoal = line.startsWith('Goal:');
            const isNegation = line.startsWith('Negated');

            let cls = 'res-step';
            if (isContradiction || isProved) cls += ' res-step--success';
            else if (isFailed) cls += ' res-step--fail';
            else if (isGoal || isNegation) cls += ' res-step--info';

            return (
              <div key={i} className={cls}>
                <span className="res-step__line">{line}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* History counter */}
      <div className="resolution-history-meta">
        Total queries: {resolutionHistory.length}
      </div>
    </div>
  );
};
