import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { generateGameSymbols, checkWin, calculateWinAmount, formatSOL } from '@/lib/game-logic';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { ScratchCanvas } from '@/components/scratch-canvas';

interface ScratchCardProps {
  ticketCost: number;
  onGameComplete: (result: { isWin: boolean; multiplier: number; winAmount: number }) => void;
  onNewGame: () => void;
  walletAddress: string;
  isDemoMode: boolean;
}

interface WinModalProps {
  isWin: boolean;
  multiplier: number;
  winAmount: number;
  isDemoMode: boolean;
  onNewGame: () => void;
}

function WinModal({ isWin, multiplier, winAmount, isDemoMode, onNewGame }: WinModalProps) {
  if (!isWin) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="bg-dark-purple/90 border-2 border-red-500 backdrop-blur-sm max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-2xl font-black text-red-400 mb-4">Better Luck Next Time!</h3>
            <p className="text-gray-300 mb-6">No matching symbols this time.</p>
            <Button 
              onClick={onNewGame}
              className="bg-gradient-to-r from-neon-cyan to-electric-blue text-black font-black px-8 py-3 rounded-lg"
            >
              PLAY AGAIN
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="bg-dark-purple/90 border-2 border-neon-gold backdrop-blur-sm max-w-md mx-4">
        <CardContent className="p-8 text-center">
          <div className="text-6xl mb-4 animate-bounce">🏆</div>
          <h3 className="text-3xl font-black text-neon-gold mb-2">WINNER!</h3>
          <div className="text-5xl font-black text-electric-blue mb-4">
            {formatSOL(winAmount)} SOL
          </div>
          <p className="text-neon-cyan mb-2">Multiplier: {multiplier}x</p>
          <p className="text-gray-300 mb-6">
            {isDemoMode ? "Demo win! No actual payout." : "Prize sent to your wallet!"}
          </p>
          <Button 
            onClick={onNewGame}
            className="bg-gradient-to-r from-neon-orange to-neon-gold text-black font-black px-8 py-3 rounded-lg"
          >
            PLAY AGAIN
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function ScratchCard({ ticketCost, onGameComplete, onNewGame, walletAddress, isDemoMode }: ScratchCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [gameSymbols, setGameSymbols] = useState<string[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scratchCompleted, setScratchCompleted] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [gameResult, setGameResult] = useState<{ isWin: boolean; multiplier: number; winAmount: number } | null>(null);

  const createGameMutation = useMutation({
    mutationFn: async (gameData: any) => {
      const response = await apiRequest('POST', '/api/games', gameData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
  });

  const payoutMutation = useMutation({
    mutationFn: async (payoutData: any) => {
      const response = await apiRequest('POST', '/api/games/payout', payoutData);
      return response.json();
    },
  });

  const handleBuyCard = async () => {
    if (!isDemoMode && !walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to buy a card.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Generate game symbols
      const symbols = generateGameSymbols();
      setGameSymbols(symbols);
      setGameStarted(true);
      setScratchCompleted(false);
      setShowWinModal(false);
      
      const signature = isDemoMode 
        ? `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        : `real_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await createGameMutation.mutateAsync({
        playerWallet: walletAddress,
        ticketType: ticketCost.toString(),
        maxWin: (ticketCost * 10).toString(),
        symbols,
        isWin: false,
        multiplier: 0,
        winAmount: '0',
        purchaseSignature: signature,
      });

      const modeColor = isDemoMode ? "bg-neon-orange/20 border-neon-orange/50" : "bg-electric-blue/20 border-electric-blue/50";
      const modeText = isDemoMode ? "Demo Card Purchased" : "Card Purchased";
      const description = isDemoMode 
        ? "Scratch to reveal your symbols! This is demo mode."
        : `Spent ${formatSOL(ticketCost)} SOL. Scratch to reveal!`;

      toast({
        title: modeText,
        description,
        className: modeColor,
      });
    } catch (error) {
      console.error('Purchase failed:', error);
      toast({
        title: "Purchase failed",
        description: "Failed to start game. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScratchComplete = () => {
    if (scratchCompleted || gameSymbols.length === 0) return;
    
    setScratchCompleted(true);
    
    // Check for win
    const result = checkWin(gameSymbols);
    const winAmount = result.isWin ? calculateWinAmount(ticketCost, result.multiplier) : 0;
    
    setGameResult({
      isWin: result.isWin,
      multiplier: result.multiplier,
      winAmount,
    });
    
    // Handle payout if won
    if (result.isWin && walletAddress) {
      payoutMutation.mutate({
        playerWallet: walletAddress,
        winAmount: winAmount.toString(),
      });
    }

    // Show win modal with delay for dramatic effect
    setTimeout(() => {
      setShowWinModal(true);
      onGameComplete({
        isWin: result.isWin,
        multiplier: result.multiplier,
        winAmount,
      });
    }, 1000);
  };

  const handleNewGameClick = () => {
    setGameStarted(false);
    setGameSymbols([]);
    setScratchCompleted(false);
    setShowWinModal(false);
    setGameResult(null);
    onNewGame();
  };

  return (
    <section className="mb-12">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-gradient-to-br from-dark-purple/60 to-deep-space/60 border-2 border-neon-gold backdrop-blur-sm">
          <CardContent className="p-8">
            {/* Card Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="text-4xl font-black text-neon-gold">
                  {formatSOL(ticketCost)} SOL
                </div>
                <div className="text-lg text-gray-300">•</div>
                <div className="text-lg text-neon-cyan">
                  Max Win: {formatSOL(ticketCost * 10)} SOL
                </div>
              </div>
              <div className={`inline-block px-4 py-2 rounded-full text-xs font-bold ${
                isDemoMode 
                  ? 'bg-neon-orange/20 text-neon-orange border border-neon-orange/50' 
                  : 'bg-electric-blue/20 text-electric-blue border border-electric-blue/50'
              }`}>
                {isDemoMode ? '🟢 DEMO MODE' : '🟣 REAL MODE'}
              </div>
            </div>

            {/* Scratch Canvas */}
            {gameStarted && gameSymbols.length > 0 && (
              <div className="flex justify-center mb-8">
                <ScratchCanvas
                  width={400}
                  height={200}
                  scratchRadius={30}
                  symbols={gameSymbols}
                  isRevealed={scratchCompleted}
                  onScratchComplete={handleScratchComplete}
                />
              </div>
            )}

            {/* Game Instructions */}
            <div className="text-center mb-8">
              <p className="text-gray-300 text-sm">
                {!gameStarted ? "Purchase a card to start playing!" : 
                 scratchCompleted ? "Check your results above!" :
                 "Scratch at least 60% to reveal symbols!"}
              </p>
              <p className="text-neon-gold text-xs mt-1">Match all 3 symbols to win! Possible multipliers: 1x, 2x, 5x, 10x</p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              {!gameStarted ? (
                <Button 
                  onClick={handleBuyCard}
                  disabled={loading || (!isDemoMode && !walletAddress)}
                  className="bg-gradient-to-r from-neon-orange to-neon-gold text-black font-black px-8 py-3 rounded-lg hover:shadow-neon-gold transition-all duration-300 hover:transform hover:scale-105"
                >
                  {loading ? 'PROCESSING...' : 'BUY CARD'}
                </Button>
              ) : (
                <Button 
                  onClick={handleNewGameClick}
                  className="bg-gradient-to-r from-neon-cyan/20 to-electric-blue/20 border-2 border-neon-cyan text-neon-cyan font-bold px-8 py-3 rounded-lg hover:border-neon-orange hover:text-neon-orange transition-all duration-300"
                >
                  NEW GAME
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Win/Loss Modal */}
      {showWinModal && gameResult && (
        <WinModal
          isWin={gameResult.isWin}
          multiplier={gameResult.multiplier}
          winAmount={gameResult.winAmount}
          isDemoMode={isDemoMode}
          onNewGame={handleNewGameClick}
        />
      )}
    </section>
  );
}