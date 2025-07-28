import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { generateGameSymbols, checkWin, calculateWinAmount, formatSOL } from '@/lib/game-logic';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { ScratchZone } from '@/components/scratch-zone';
import { X } from 'lucide-react';

interface ScratchCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketCost: number;
  walletAddress: string;
  isDemoMode: boolean;
  onGameComplete: (result: { isWin: boolean; multiplier: number; winAmount: number }) => void;
}

interface GameResult {
  isWin: boolean;
  multiplier: number;
  winAmount: number;
}

export function ScratchCardModal({ 
  isOpen, 
  onClose, 
  ticketCost, 
  walletAddress, 
  isDemoMode,
  onGameComplete 
}: ScratchCardModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [gameSymbols, setGameSymbols] = useState<string[]>([]);
  const [revealedZones, setRevealedZones] = useState<boolean[]>([false, false, false]);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);

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

  // Initialize game when modal opens
  useEffect(() => {
    if (isOpen && gameSymbols.length === 0) {
      initializeGame();
    }
  }, [isOpen]);

  // Check for game completion when all zones are revealed
  useEffect(() => {
    if (revealedZones.every(revealed => revealed) && gameSymbols.length > 0 && !showResult) {
      handleGameComplete();
    }
  }, [revealedZones, gameSymbols, showResult]);

  const initializeGame = async () => {
    try {
      setLoading(true);
      
      // Generate game symbols
      const symbols = generateGameSymbols();
      setGameSymbols(symbols);
      setRevealedZones([false, false, false]);
      setShowResult(false);
      setGameResult(null);
      
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

      const modeText = isDemoMode ? "Demo Game Started" : "Game Started";
      const description = isDemoMode 
        ? "Scratch each zone to reveal symbols! Demo mode active."
        : `Spent ${formatSOL(ticketCost)} SOL. Scratch each zone to reveal!`;

      toast({
        title: modeText,
        description,
        className: isDemoMode ? "bg-neon-orange/20 border-neon-orange/50" : "bg-electric-blue/20 border-electric-blue/50",
      });
    } catch (error) {
      console.error('Game initialization failed:', error);
      toast({
        title: "Game failed to start",
        description: "Please try again.",
        variant: "destructive",
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleZoneComplete = (zoneIndex: number) => {
    setRevealedZones(prev => {
      const newRevealed = [...prev];
      newRevealed[zoneIndex] = true;
      return newRevealed;
    });
  };

  const handleGameComplete = () => {
    // Check for win
    const result = checkWin(gameSymbols);
    const winAmount = result.isWin ? calculateWinAmount(ticketCost, result.multiplier) : 0;
    
    const gameResult = {
      isWin: result.isWin,
      multiplier: result.multiplier,
      winAmount,
    };

    setGameResult(gameResult);
    
    // Handle payout if won
    if (result.isWin && walletAddress) {
      payoutMutation.mutate({
        playerWallet: walletAddress,
        winAmount: winAmount.toString(),
      });
    }

    // Show result with delay for dramatic effect
    setTimeout(() => {
      setShowResult(true);
      onGameComplete(gameResult);
    }, 1000);
  };

  const handlePlayAgain = () => {
    setGameSymbols([]);
    setRevealedZones([false, false, false]);
    setShowResult(false);
    setGameResult(null);
    initializeGame();
  };

  const handleCloseModal = () => {
    setGameSymbols([]);
    setRevealedZones([false, false, false]);
    setShowResult(false);
    setGameResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-dark-purple/95 to-deep-space/95 backdrop-blur-sm rounded-xl border-2 border-neon-gold max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-neon-gold/30">
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-black text-neon-gold">
              {formatSOL(ticketCost)} SOL
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              isDemoMode 
                ? 'bg-neon-orange/20 text-neon-orange border border-neon-orange/50' 
                : 'bg-electric-blue/20 text-electric-blue border border-electric-blue/50'
            }`}>
              {isDemoMode ? '🟢 DEMO' : '🟣 REAL'}
            </div>
          </div>
          <Button
            onClick={handleCloseModal}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Game Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-neon-cyan text-lg font-bold mb-4">Initializing Game...</div>
              <div className="animate-spin w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : showResult && gameResult ? (
            /* Result Screen */
            <div className="text-center py-8">
              <div className="text-6xl mb-6 animate-bounce">
                {gameResult.isWin ? '🏆' : '❌'}
              </div>
              <h3 className={`text-3xl font-black mb-4 ${
                gameResult.isWin ? 'text-neon-gold' : 'text-red-400'
              }`}>
                {gameResult.isWin ? 'WINNER!' : 'Better Luck Next Time!'}
              </h3>
              {gameResult.isWin && (
                <>
                  <div className="text-4xl font-black text-electric-blue mb-2">
                    {formatSOL(gameResult.winAmount)} SOL
                  </div>
                  <p className="text-neon-cyan mb-2">Multiplier: {gameResult.multiplier}x</p>
                  <p className="text-gray-300 mb-6">
                    {isDemoMode ? "Demo win! No actual payout." : "Prize sent to your wallet!"}
                  </p>
                </>
              )}
              {!gameResult.isWin && (
                <p className="text-gray-300 mb-6">
                  Symbols: {gameSymbols.join(' ')} - No match this time!
                </p>
              )}
              <div className="flex justify-center space-x-4">
                <Button 
                  onClick={handlePlayAgain}
                  className="bg-gradient-to-r from-neon-orange to-neon-gold text-black font-black px-8 py-3 rounded-lg"
                >
                  PLAY AGAIN
                </Button>
                <Button 
                  onClick={handleCloseModal}
                  className="bg-gradient-to-r from-neon-cyan/20 to-electric-blue/20 border-2 border-neon-cyan text-neon-cyan font-bold px-8 py-3 rounded-lg"
                >
                  EXIT
                </Button>
              </div>
            </div>
          ) : gameSymbols.length > 0 ? (
            /* Scratch Zones */
            <div>
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-neon-cyan mb-2">Scratch Each Zone</h3>
                <p className="text-gray-300 text-sm">
                  Scratch all 3 zones to reveal symbols. Match all 3 to win!
                </p>
                <div className="text-neon-gold text-xs mt-2">
                  Max Win: {formatSOL(ticketCost * 10)} SOL • Multipliers: 1x, 2x, 5x, 10x
                </div>
              </div>

              {/* Scratch Zones Grid */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="flex flex-col items-center">
                    <ScratchZone
                      width={120}
                      height={100}
                      scratchRadius={20}
                      symbol={gameSymbols[index] || ''}
                      onComplete={() => handleZoneComplete(index)}
                      isRevealed={revealedZones[index]}
                      zoneIndex={index}
                    />
                  </div>
                ))}
              </div>

              {/* Progress Indicator */}
              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  Zones completed: {revealedZones.filter(r => r).length}/3
                </p>
                {revealedZones.filter(r => r).length === 3 && (
                  <p className="text-neon-cyan text-sm animate-pulse mt-2">
                    Checking results...
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}