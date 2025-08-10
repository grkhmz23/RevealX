import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { DemoBanner } from '@/components/demo-banner';
import { Button } from '@/components/ui/button';
import logoPath from '@assets/ChatGPT Image 28 juil. 2025, 10_17_36_1753690663892.png';

export default function NoCryingEscape() {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('nocrying-best-score') || '0');
  });

  useEffect(() => {
    // Save best score to localStorage
    localStorage.setItem('nocrying-best-score', bestScore.toString());
  }, [bestScore]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    // Initialize Phaser game here
    initGame();
  };

  const endGame = (finalScore: number) => {
    setGameState('gameover');
    setScore(finalScore);
    if (finalScore > bestScore) {
      setBestScore(finalScore);
    }
  };

  const initGame = async () => {
    if (!gameContainerRef.current) return;

    // Dynamically import Phaser and game config
    const Phaser = (await import('phaser')).default;
    const { gameConfig } = await import('@/game/nocrying-escape/GameConfig');
    const { GameScene } = await import('@/game/nocrying-escape/GameScene');

    // Clear any existing game
    if (gameContainerRef.current.firstChild) {
      gameContainerRef.current.removeChild(gameContainerRef.current.firstChild);
    }

    // Create Phaser game
    const config = {
      ...gameConfig,
      parent: gameContainerRef.current,
    };

    const game = new Phaser.Game(config);
    
    // Get the game scene and set up callback
    game.scene.start('GameScene');
    const gameScene = game.scene.getScene('GameScene') as GameScene;
    
    if (gameScene && gameScene.setGameEndCallback) {
      gameScene.setGameEndCallback((finalScore: number) => {
        endGame(finalScore);
        game.destroy(true);
      });
    }

    // Update score during gameplay
    const updateScore = () => {
      if (gameState === 'playing' && gameScene && !gameScene.sys.game.isDestroyed) {
        // Get score from game scene if available
        setTimeout(updateScore, 100);
      }
    };
    updateScore();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Minimal Header */}
      <header className="border-b border-neon-cyan/30 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity duration-200">
              <div className="w-12 h-12 bg-gradient-to-br from-neon-cyan to-neon-orange rounded-lg flex items-center justify-center border-2 border-neon-cyan shadow-neon-cyan">
                <img src={logoPath} alt="Scratch 'n SOL" className="w-8 h-8 object-contain" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-black text-neon-cyan">SCRATCH 'n SOL</h1>
              </div>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            <Link href="/games">
              <Button 
                variant="outline"
                size="sm"
                className="border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10"
                data-testid="button-back-games"
              >
                ← Games
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Demo Banner */}
      <DemoBanner />

      {/* Game Container */}
      <div className="flex-1 flex flex-col">
        <div className="max-w-4xl mx-auto px-4 py-8 flex-1 flex flex-col">
          
          {/* Game Menu */}
          {gameState === 'menu' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md mx-auto">
                {/* Game Character */}
                <div className="mb-8">
                  <img 
                    src="/assets/nocrying-escape/character.svg" 
                    alt="NoCrying Character" 
                    className="w-32 h-32 mx-auto mb-6 animate-bounce"
                  />
                  <h1 className="text-4xl font-black text-neon-cyan mb-4">
                    NoCrying Escape
                  </h1>
                  <p className="text-gray-300 mb-6">
                    Dodge RUG pulls, tears, and broken coins in this infinite runner!
                  </p>
                </div>

                {/* Instructions */}
                <div className="bg-gradient-to-br from-dark-purple/40 to-deep-space/60 border border-neon-cyan/30 rounded-xl p-6 mb-8">
                  <h3 className="text-neon-orange font-bold text-lg mb-4">How to Play:</h3>
                  <div className="text-gray-300 space-y-2">
                    <p>• Tap SPACE or click to jump</p>
                    <p>• Avoid obstacles to survive longer</p>
                    <p>• Speed increases every 10 seconds</p>
                    <p>• Beat your best score!</p>
                  </div>
                </div>

                {/* Scores */}
                {bestScore > 0 && (
                  <div className="mb-6">
                    <p className="text-neon-cyan">Best Score: <span className="font-bold">{bestScore}s</span></p>
                  </div>
                )}

                {/* Play Button */}
                <Button 
                  onClick={startGame}
                  className="bg-gradient-to-r from-neon-cyan to-electric-blue text-black font-bold px-8 py-4 text-xl rounded-xl hover:shadow-lg hover:shadow-neon-cyan/30 transition-all duration-300"
                  data-testid="button-start-game"
                >
                  Play Demo
                </Button>
              </div>
            </div>
          )}

          {/* Game Playing */}
          {gameState === 'playing' && (
            <div className="flex-1 flex flex-col">
              <div className="text-center mb-4">
                <p className="text-neon-cyan font-bold text-xl">Score: {score}s</p>
                <p className="text-gray-400 text-sm">Press SPACE to jump!</p>
              </div>
              
              {/* Game Canvas Container */}
              <div 
                ref={gameContainerRef}
                className="flex-1 bg-gradient-to-br from-purple-900/50 to-teal-900/50 border border-neon-cyan/30 rounded-xl flex items-center justify-center min-h-[400px]"
              >
                <div className="text-center">
                  <img 
                    src="/assets/nocrying-escape/character.svg" 
                    alt="Running Character" 
                    className="w-20 h-20 mx-auto mb-4 animate-pulse"
                  />
                  <p className="text-neon-cyan font-bold">Game Running...</p>
                  <p className="text-gray-400 text-sm mt-2">Phaser game will load here</p>
                </div>
              </div>
            </div>
          )}

          {/* Game Over */}
          {gameState === 'gameover' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md mx-auto">
                <h2 className="text-3xl font-black text-neon-orange mb-4">Game Over!</h2>
                
                <div className="bg-gradient-to-br from-dark-purple/40 to-deep-space/60 border border-neon-cyan/30 rounded-xl p-6 mb-8">
                  <p className="text-2xl font-bold text-neon-cyan mb-2">
                    You survived {score} seconds
                  </p>
                  {score === bestScore && score > 0 && (
                    <p className="text-neon-orange font-bold">🎉 New Best Score!</p>
                  )}
                  {bestScore > 0 && score !== bestScore && (
                    <p className="text-gray-400">Best: {bestScore}s</p>
                  )}
                </div>

                <div className="flex justify-center space-x-4">
                  <Button 
                    onClick={startGame}
                    className="bg-gradient-to-r from-neon-cyan to-electric-blue text-black font-bold px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-neon-cyan/30 transition-all duration-300"
                    data-testid="button-retry-game"
                  >
                    Retry
                  </Button>
                  <Link href="/games">
                    <Button 
                      variant="outline"
                      className="border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10 font-bold px-6 py-3"
                      data-testid="button-back-to-games"
                    >
                      Back to Games
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}