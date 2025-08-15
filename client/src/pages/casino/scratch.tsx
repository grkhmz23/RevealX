import { useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ModeToggle } from '@/components/mode-toggle';
import { useGameMode } from '@/contexts/game-mode-context';
import { useWallet } from '@solana/wallet-adapter-react';
import { ScratchCardGrid } from '@/components/scratch-card-grid';
import { ScratchCardModal } from '@/components/scratch-card-modal';
import { GameStats } from '@/components/game-stats';
import { RecentWinners } from '@/components/recent-winners';

export default function ScratchPage() {
  const { isDemoMode } = useGameMode();
  const { publicKey } = useWallet();
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleCardSelect = (ticketCost: number) => {
    setSelectedTicket(ticketCost);
    setShowModal(true);
  };

  const handleGameComplete = (result: { isWin: boolean; multiplier: number; winAmount: number }) => {
    // Game completed, modal will handle the result display
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTicket(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Page Header */}
      <div className="bg-gradient-to-br from-dark-purple/40 to-deep-space/60 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-black text-neon-cyan mb-4">
            Scratch & SOL
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-6">
            Digital scratch cards on the Solana blockchain. Instant wins up to 20x your bet with transparent, provably fair outcomes.
          </p>
          <div className="flex justify-center">
            <ModeToggle />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8">
        {/* Game Stats Row */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <GameStats />
          </div>
          <div>
            <RecentWinners />
          </div>
        </div>

        {/* Scratch Cards Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-neon-cyan mb-4">Choose Your Card</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Select a scratch card tier based on your preferred risk level. 
              Higher tiers offer bigger potential payouts with the same fair odds.
            </p>
          </div>
          
          <ScratchCardGrid onCardSelect={handleCardSelect} isDemoMode={isDemoMode} />
        </div>

        {/* How It Works */}
        <div className="bg-dark-purple/30 rounded-lg p-8 border border-neon-cyan/20">
          <h3 className="text-2xl font-bold text-neon-cyan mb-6 text-center">How It Works</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-neon-cyan/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-neon-cyan font-bold">1</span>
              </div>
              <h4 className="font-semibold text-white mb-2">Choose Card</h4>
              <p className="text-sm text-gray-400">Select your preferred scratch card tier</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-neon-cyan/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-neon-cyan font-bold">2</span>
              </div>
              <h4 className="font-semibold text-white mb-2">Place Bet</h4>
              <p className="text-sm text-gray-400">{isDemoMode ? 'Use demo credits' : 'Connect wallet & pay SOL'}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-neon-cyan/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-neon-cyan font-bold">3</span>
              </div>
              <h4 className="font-semibold text-white mb-2">Scratch</h4>
              <p className="text-sm text-gray-400">Reveal symbols by scratching the card</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-neon-cyan/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-neon-cyan font-bold">4</span>
              </div>
              <h4 className="font-semibold text-white mb-2">Win!</h4>
              <p className="text-sm text-gray-400">{isDemoMode ? 'Collect demo winnings' : 'Receive instant SOL payout'}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Scratch Card Modal */}
      {showModal && selectedTicket && (
        <ScratchCardModal
          isOpen={showModal}
          ticketCost={selectedTicket}
          walletAddress={publicKey?.toString() || null}
          isDemoMode={isDemoMode}
          onClose={handleCloseModal}
          onGameComplete={handleGameComplete}
        />
      )}

      <Footer />
    </div>
  );
}