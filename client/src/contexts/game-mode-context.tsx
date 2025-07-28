import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type GameMode = 'demo' | 'real';

interface GameModeContextType {
  mode: GameMode;
  setMode: (mode: GameMode) => void;
  isDemoMode: boolean;
  isRealMode: boolean;
}

const GameModeContext = createContext<GameModeContextType | undefined>(undefined);

interface GameModeProviderProps {
  children: ReactNode;
}

export function GameModeProvider({ children }: GameModeProviderProps) {
  const [mode, setModeState] = useState<GameMode>(() => {
    // Load from localStorage, default to demo
    const saved = localStorage.getItem('scratch-n-sol-mode');
    return (saved as GameMode) || 'demo';
  });

  const setMode = (newMode: GameMode) => {
    setModeState(newMode);
    localStorage.setItem('scratch-n-sol-mode', newMode);
  };

  const contextValue = {
    mode,
    setMode,
    isDemoMode: mode === 'demo',
    isRealMode: mode === 'real',
  };

  return (
    <GameModeContext.Provider value={contextValue}>
      {children}
    </GameModeContext.Provider>
  );
}

export function useGameMode() {
  const context = useContext(GameModeContext);
  if (context === undefined) {
    throw new Error('useGameMode must be used within a GameModeProvider');
  }
  return context;
}