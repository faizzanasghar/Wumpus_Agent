// GameContext.tsx — React Context + Provider for game state

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { gameReducer, defaultGameState } from './gameReducer';
import type { GameState, GameAction } from './gameReducer';

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, defaultGameState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-run: step agent every 900ms while autoRun is active and game is running
  const stopAutoRun = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (state.autoRun && state.phase === 'running') {
      intervalRef.current = setInterval(() => {
        dispatch({ type: 'STEP_AGENT' });
      }, 900);
    } else {
      stopAutoRun();
    }

    return stopAutoRun;
  }, [state.autoRun, state.phase, stopAutoRun]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  return ctx;
}
