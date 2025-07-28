import { useState } from 'react';
import { SimpleWalletButton } from '@/components/simple-wallet-button';
import { ModeToggle } from '@/components/mode-toggle';
import { useGameMode } from '@/contexts/game-mode-context';
import { Card, CardContent } from '@/components/ui/card';
import { TicketSelection } from '@/components/ticket-selection';
import { ScratchCard } from '@/components/scratch-card-new';
import { GameStats } from '@/components/game-stats';
import { RecentWinners } from '@/components/recent-winners';
import { GameResultModal } from '@/components/game-result-modal';
import logoPath from '@assets/ChatGPT Image 28 juil. 2025, 10_17_36_1753690663892.png';

interface GameState {
  selectedTicket: number | null;
  symbols: string[];
  isRevealed: boolean;
  gameResult: {
    isWin: boolean;
    multiplier: number;
    winAmount: number;
  } | null;
  showResult: boolean;
  walletAddress: string | null;
}

export default function Home() {
  const { isDemoMode, isRealMode } = useGameMode();
  const [gameState, setGameState] = useState<GameState>({
    selectedTicket: null,
    symbols: [],
    isRevealed: false,
    gameResult: null,
    showResult: false,
    walletAddress: null,
  });

  const handleTicketSelect = (ticketCost: number) => {
    setGameState(prev => ({
      ...prev,
      selectedTicket: ticketCost,
      symbols: [],
      isRevealed: false,
      gameResult: null,
      showResult: false,
    }));
  };

  const handleGameComplete = (result: { isWin: boolean; multiplier: number; winAmount: number }) => {
    setGameState(prev => ({
      ...prev,
      gameResult: result,
      showResult: true,
    }));
  };

  const handleWalletConnect = (publicKey: string) => {
    setGameState(prev => ({ ...prev, walletAddress: publicKey }));
  };

  const handleNewGame = () => {
    setGameState(prev => ({
      selectedTicket: null,
      symbols: [],
      isRevealed: false,
      gameResult: null,
      showResult: false,
      walletAddress: prev.walletAddress, // Keep wallet connected
    }));
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-neon-cyan/30 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-neon-cyan to-neon-orange rounded-lg flex items-center justify-center border-2 border-neon-cyan shadow-neon-cyan">
              <img src={logoPath} alt="Scratch 'n SOL" className="w-12 h-12 object-contain" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-black text-neon-cyan">SCRATCH</h1>
              <h2 className="text-xl font-bold text-neon-orange">'n SOL</h2>
            </div>
          </div>

          {/* Mode Toggle and Wallet Connection */}
          <div className="flex items-center space-x-4">
            <ModeToggle />
            {isRealMode && <SimpleWalletButton onConnect={handleWalletConnect} />}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Game Stats */}
        <GameStats />

        {/* Ticket Selection - Always Show */}
        {!gameState.selectedTicket && (
          <TicketSelection onTicketSelect={handleTicketSelect} />
        )}

        {/* Scratch Card Game */}
        {gameState.selectedTicket && (
          <ScratchCard
            ticketCost={gameState.selectedTicket}
            onGameComplete={handleGameComplete}
            onNewGame={handleNewGame}
            walletAddress={isDemoMode ? "demo-wallet" : (gameState.walletAddress || "")}
            isDemoMode={isDemoMode}
            onWalletConnect={() => {
              // Auto-trigger wallet connection when needed
              const walletButton = document.querySelector('[data-wallet-button]') as HTMLButtonElement;
              walletButton?.click();
            }}
          />
        )}

        {/* Recent Winners */}
        <RecentWinners />
      </main>

      {/* Game Result Modal */}
      {gameState.showResult && gameState.gameResult && (
        <GameResultModal
          result={gameState.gameResult}
          onClose={() => setGameState(prev => ({ ...prev, showResult: false }))}
          onNewGame={handleNewGame}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-neon-cyan/30 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="text-gray-400 text-sm mb-4">
            Powered by Solana Blockchain • Built with ❤️ for the crypto community
          </div>
          <div className="text-xs text-gray-500">
            Play responsibly • Must be 18+ • Gambling can be addictive
          </div>
        </div>
      </footer>
    </div>
  );
}
