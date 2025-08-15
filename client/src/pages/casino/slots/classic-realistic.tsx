import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ModeBadge } from '@/components/mode-badge';
import { useGameMode } from '@/contexts/game-mode-context';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';
import { ClassicRealisticScene, type SpinResult, type GameState } from '@/game/slots/realistic/ClassicScene';
import { REAL_BET_AMOUNTS, DEMO_BET_AMOUNTS, GAME_CONFIG, checkPaylines } from '@/game/slots/realistic/config';
import { slotsAPI } from '@/lib/slots-api';

export default function ClassicRealisticSlots() {
  const { isDemoMode } = useGameMode();
  const { connected, publicKey } = useWallet();
  const { toast } = useToast();

  // Game state
  const [gameState, setGameState] = useState<GameState>({
    isSpinning: false,
    isAutoSpinning: false,
    autoSpinsRemaining: 0,
    currentBet: 0,
    balance: isDemoMode ? 100 : 0,
    lastWin: 0,
    isDemoMode
  });

  // Phaser game instance
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<ClassicRealisticScene | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const betAmounts = isDemoMode ? DEMO_BET_AMOUNTS : REAL_BET_AMOUNTS;

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Phaser game
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 1600,
      height: 1000,
      parent: containerRef.current,
      backgroundColor: '#000000',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: ClassicRealisticScene
    };

    gameRef.current = new Phaser.Game(config);

    // Get scene reference and setup callbacks
    gameRef.current.events.on('ready', () => {
      sceneRef.current = gameRef.current?.scene.getScene('ClassicRealisticScene') as ClassicRealisticScene;
      
      if (sceneRef.current) {
        sceneRef.current.setCallbacks({
          onSpin: handleSpin,
          onGameStateChange: setGameState,
          onError: handleError
        });

        // Initialize with current game state
        sceneRef.current.updateGameState({
          ...gameState,
          currentBet: betAmounts[0],
          isDemoMode
        });
      }
    });

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
        sceneRef.current = null;
      }
    };
  }, []);

  // Update scene when mode changes
  useEffect(() => {
    if (sceneRef.current) {
      const newBalance = isDemoMode ? 100 : 0;
      sceneRef.current.updateGameState({
        isDemoMode,
        balance: newBalance,
        currentBet: betAmounts[0]
      });
      setGameState(prev => ({
        ...prev,
        isDemoMode,
        balance: newBalance,
        currentBet: betAmounts[0]
      }));
    }
  }, [isDemoMode]);

  const handleSpin = async (betAmount: number): Promise<SpinResult> => {
    if (isDemoMode) {
      return await handleDemoSpin(betAmount);
    } else {
      return await handleRealSpin(betAmount);
    }
  };

  const handleDemoSpin = async (betAmount: number): Promise<SpinResult> => {
    // Check demo balance
    if (gameState.balance < betAmount) {
      throw new Error('Insufficient demo balance');
    }

    // Generate random result using the same logic as real spins
    const symbols = generateRandomSymbols();
    const { winningLines, totalPayout } = checkPaylines(symbols);
    const finalPayout = totalPayout * betAmount;
    const isBigWin = finalPayout >= betAmount * GAME_CONFIG.BIG_WIN_THRESHOLD;

    // Update demo balance
    const newBalance = gameState.balance - betAmount + finalPayout;
    setGameState(prev => ({ ...prev, balance: newBalance }));

    return {
      symbols,
      winningLines,
      totalPayout: finalPayout,
      isBigWin
    };
  };

  const handleRealSpin = async (betAmount: number): Promise<SpinResult> => {
    if (!connected || !publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      // Check quote from backend
      const betLamports = betAmount * 1e9;
      const maxPotentialWin = betAmount * 20 * 5; // Max payout * max lines
      
      const quote = await slotsAPI.getQuote({
        wallet: publicKey.toString(),
        betLamports,
        expectedMaxWin: maxPotentialWin * 1e9
      });

      if (quote.status !== 'OK') {
        throw new Error(quote.message);
      }

      // Generate spin result
      const symbols = generateRandomSymbols();
      const { winningLines, totalPayout } = checkPaylines(symbols);
      const finalPayout = totalPayout * betAmount;
      const isBigWin = finalPayout >= betAmount * GAME_CONFIG.BIG_WIN_THRESHOLD;

      // Process payment if there's a win
      if (finalPayout > 0) {
        try {
          const payoutResult = await slotsAPI.requestPayout({
            wallet: publicKey.toString(),
            payoutLamports: finalPayout * 1e9,
            spinHash: generateSpinHash(symbols, betAmount),
            timestamp: Date.now()
          });

          if (payoutResult.status !== 'SUCCESS') {
            console.warn('Payout failed:', payoutResult.message);
            // Still show the win in UI, but note the payout issue
            toast({
              title: "Win detected, payout pending",
              description: `You won ${finalPayout.toFixed(2)} SOL. Payout processing...`,
              variant: "default"
            });
          }
        } catch (payoutError) {
          console.error('Payout error:', payoutError);
          // Still show the win but indicate payout issue
        }
      }

      return {
        symbols,
        winningLines,
        totalPayout: finalPayout,
        isBigWin
      };

    } catch (error) {
      console.error('Real spin error:', error);
      throw error;
    }
  };

  const generateRandomSymbols = (): string[] => {
    // Generate 9 symbols for 3x3 grid using weighted random selection
    const symbols = [];
    const symbolIds = ['seven', 'diamond', 'rocket', 'coin', 'tear', 'rug'];
    const weights = [5, 8, 12, 16, 22, 30]; // From config
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    for (let i = 0; i < 9; i++) {
      const random = Math.random() * totalWeight;
      let currentWeight = 0;
      
      for (let j = 0; j < symbolIds.length; j++) {
        currentWeight += weights[j];
        if (random <= currentWeight) {
          symbols.push(symbolIds[j]);
          break;
        }
      }
    }

    return symbols;
  };

  const generateSpinHash = (symbols: string[], betAmount: number): string => {
    const data = `${publicKey?.toString()}-${betAmount}-${Date.now()}-${symbols.join(',')}`;
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  };

  const handleError = (error: string) => {
    toast({
      title: "Game Error",
      description: error,
      variant: "destructive"
    });
  };

  const handleBetChange = (direction: 'up' | 'down') => {
    const currentIndex = betAmounts.indexOf(gameState.currentBet);
    let newIndex;
    
    if (direction === 'up') {
      newIndex = Math.min(currentIndex + 1, betAmounts.length - 1);
    } else {
      newIndex = Math.max(currentIndex - 1, 0);
    }
    
    const newBet = betAmounts[newIndex];
    setGameState(prev => ({ ...prev, currentBet: newBet }));
    
    if (sceneRef.current) {
      sceneRef.current.updateGameState({ currentBet: newBet });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Header />

      {/* Game Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-black text-neon-cyan mb-2">NOCRYING SLOTS</h1>
          <p className="text-gray-400">Realistic slot machine experience</p>
          <ModeBadge className="mt-2" />
        </div>

        {/* Phaser Game Container */}
        <div 
          ref={containerRef} 
          className="border-2 border-neon-cyan/30 rounded-lg overflow-hidden shadow-2xl shadow-neon-cyan/20"
        />

        {/* External Controls */}
        <div className="mt-6 flex items-center space-x-6">
          {/* Bet Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBetChange('down')}
              disabled={gameState.isSpinning}
              className="border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10"
            >
              -
            </Button>
            <span className="text-white px-3">
              {gameState.currentBet} {isDemoMode ? 'credits' : 'SOL'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBetChange('up')}
              disabled={gameState.isSpinning}
              className="border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10"
            >
              +
            </Button>
          </div>

          {/* Game Status */}
          <div className="text-center">
            {gameState.isSpinning && (
              <div className="text-neon-orange font-bold">SPINNING...</div>
            )}
            {gameState.isAutoSpinning && (
              <div className="text-neon-cyan">
                AUTO: {gameState.autoSpinsRemaining} left
              </div>
            )}
          </div>
        </div>

        {/* Game Information */}
        <div className="mt-8 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="bg-dark-purple/50 border-neon-cyan/30">
            <CardHeader>
              <CardTitle className="text-neon-cyan">Game Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">RTP:</span>
                <span className="text-neon-cyan">88-90%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Paylines:</span>
                <span className="text-white">5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Max Win:</span>
                <span className="text-neon-orange">20x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Mode:</span>
                <span className="text-white">{isDemoMode ? 'Demo' : 'Real'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-purple/50 border-neon-cyan/30">
            <CardHeader>
              <CardTitle className="text-neon-cyan">Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="text-gray-400">
                • Click SPIN to play one round
              </div>
              <div className="text-gray-400">
                • Click AUTO for up to 25 auto-spins
              </div>
              <div className="text-gray-400">
                • Click STOP to halt auto-play
              </div>
              <div className="text-gray-400">
                • Use +/- buttons to adjust bet
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Back Navigation */}
        <div className="mt-8">
          <Link href="/casino/slots">
            <Button 
              variant="outline" 
              className="border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10"
            >
              ← Back to Slots
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}