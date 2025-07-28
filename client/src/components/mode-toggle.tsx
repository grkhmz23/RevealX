import { useGameMode } from '@/contexts/game-mode-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function ModeToggle() {
  const { mode, setMode, isDemoMode, isRealMode } = useGameMode();

  return (
    <div className="flex items-center space-x-2">
      <Card className="bg-dark-purple/50 border-neon-cyan/30">
        <CardContent className="p-2">
          <div className="flex rounded-lg overflow-hidden">
            <Button
              onClick={() => setMode('demo')}
              className={`
                px-4 py-2 text-xs font-bold transition-all duration-300 rounded-l-lg border-0
                ${isDemoMode 
                  ? '!bg-neon-orange !text-black !shadow-neon-orange' 
                  : '!bg-transparent !text-gray-400 hover:!text-neon-orange'
                }
              `}
            >
              🟢 DEMO
            </Button>
            <Button
              onClick={() => setMode('real')}
              className={`
                px-4 py-2 text-xs font-bold transition-all duration-300 rounded-r-lg border-0
                ${isRealMode 
                  ? '!bg-electric-blue !text-black !shadow-electric-blue' 
                  : '!bg-transparent !text-gray-400 hover:!text-electric-blue'
                }
              `}
            >
              🟣 REAL
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="text-xs text-gray-400 hidden sm:block">
        {isDemoMode ? 'Demo Mode: Free Play' : 'Real Mode: SOL Required'}
      </div>
    </div>
  );
}