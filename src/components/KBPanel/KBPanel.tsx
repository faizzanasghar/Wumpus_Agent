// KBPanel.tsx — Tabbed knowledge base panel (bottom)

import React, { useState } from 'react';
import { RawClauseView } from './RawClauseView';
import { CNFView } from './CNFView';
import { ResolutionLog } from './ResolutionLog';
import { useGame } from '../../state/GameContext';

type Tab = 'raw' | 'cnf' | 'resolution';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'raw', label: 'Raw Clauses', icon: '📋' },
  { id: 'cnf', label: 'CNF Form', icon: '∧' },
  { id: 'resolution', label: 'Resolution Log', icon: '🔍' },
];

export const KBPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('resolution');
  const { state } = useGame();

  return (
    <div className="kb-panel" aria-label="Knowledge Base Panel">
      <div className="kb-panel__header">
        <h2 className="kb-panel__title">Knowledge Base</h2>
        <div className="kb-panel__step-log" title="Step narrative">
          {state.stepLog.slice(-1)[0] ?? '—'}
        </div>
      </div>

      <div className="kb-tabs" role="tablist" aria-label="KB views">
        {TABS.map(tab => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            className={`kb-tab ${activeTab === tab.id ? 'kb-tab--active' : ''}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="kb-tab__icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="kb-panel__content"
      >
        {activeTab === 'raw' && <RawClauseView />}
        {activeTab === 'cnf' && <CNFView />}
        {activeTab === 'resolution' && <ResolutionLog />}
      </div>
    </div>
  );
};
