interface GameModeBadgeProps {
  isRealMode?: boolean;
}

export function GameModeBadge({ isRealMode = false }: GameModeBadgeProps) {
  if (isRealMode) {
    return (
      <div className="inline-flex items-center px-3 py-1 rounded-full bg-electric-blue/20 border border-electric-blue/50">
        <div className="w-2 h-2 rounded-full bg-electric-blue mr-2 animate-pulse" />
        <span className="text-electric-blue font-bold text-sm">REAL MODE</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center px-3 py-1 rounded-full bg-neon-orange/20 border border-neon-orange/50">
      <div className="w-2 h-2 rounded-full bg-neon-orange mr-2 animate-pulse" />
      <span className="text-neon-orange font-bold text-sm">DEMO ONLY</span>
    </div>
  );
}