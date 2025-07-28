import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { generateGameSymbols, checkWin, calculateWinAmount, formatSOL } from '@/lib/game-logic';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { ScratchCardModal } from '@/components/scratch-card-modal';

interface ScratchCardProps {
  ticketCost: number;
  onGameComplete: (result: { isWin: boolean; multiplier: number; winAmount: number }) => void;
  onNewGame: () => void;
  walletAddress: string;
  isDemoMode: boolean;
  onWalletConnect?: () => void;
}



export function ScratchCard({ ticketCost, onGameComplete, onNewGame, walletAddress, isDemoMode, onWalletConnect }: ScratchCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showModal, setShowModal] = useState(false);
  const [gameResult, setGameResult] = useState<{ isWin: boolean; multiplier: number; winAmount: number } | null>(null);



  const handlePlayCard = () => {
    // If Real Mode and no wallet, trigger wallet connection first
    if (!isDemoMode && !walletAddress) {
      toast({
        title: "Wallet Connection Required",
        description: "Please connect your wallet to play in Real Mode.",
        className: "bg-electric-blue/20 border-electric-blue/50",
      });
      // Trigger wallet connection
      if (onWalletConnect) {
        onWalletConnect();
      }
      return;
    }

    // Open the scratch card modal
    setShowModal(true);
  };

  const handleModalGameComplete = (result: { isWin: boolean; multiplier: number; winAmount: number }) => {
    setGameResult(result);
    onGameComplete(result);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setGameResult(null);
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

            {/* Game Instructions */}
            <div className="text-center mb-8">
              <p className="text-gray-300 text-sm">
                Click "PLAY" to start a new scratch card game!
              </p>
              <p className="text-neon-gold text-xs mt-1">Match all 3 symbols to win! Possible multipliers: 1x, 2x, 5x, 10x</p>
            </div>

            {/* Action Button */}
            <div className="flex justify-center">
              <Button 
                onClick={handlePlayCard}
                className="bg-gradient-to-r from-neon-orange to-neon-gold text-black font-black px-8 py-3 rounded-lg hover:shadow-neon-gold transition-all duration-300 hover:transform hover:scale-105"
              >
                PLAY
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>

      {/* Scratch Card Modal */}
      <ScratchCardModal
        isOpen={showModal}
        onClose={handleCloseModal}
        ticketCost={ticketCost}
        walletAddress={walletAddress}
        isDemoMode={isDemoMode}
        onGameComplete={handleModalGameComplete}
      />
    </section>
  );
}