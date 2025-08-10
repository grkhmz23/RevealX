export function DemoBanner() {
  return (
    <div className="bg-gradient-to-r from-neon-orange/20 to-yellow-500/20 border-b-2 border-neon-orange/50 p-3">
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <img 
            src="/assets/nocrying-escape/demo-badge.svg" 
            alt="Demo" 
            className="w-8 h-8" 
          />
          <span className="text-neon-orange font-bold text-lg">
            Demo Mode Only — No wallet or payouts yet. Real Mode coming soon.
          </span>
        </div>
      </div>
    </div>
  );
}