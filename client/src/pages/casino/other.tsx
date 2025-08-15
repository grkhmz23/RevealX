import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dice6, CircleDot, Coins, TrendingUp } from 'lucide-react';

const UPCOMING_GAMES = [
  {
    id: 'roulette',
    title: 'Roulette',
    description: 'European roulette with live betting and multiple side bets',
    icon: CircleDot,
    features: ['European wheel', 'Live betting', 'Side bets', 'Statistics'],
    rtp: '97.3%',
    status: 'development'
  },
  {
    id: 'coinflip',
    title: 'Coin Flip',
    description: 'Simple heads or tails with 2x payouts and streak bonuses',
    icon: Coins,
    features: ['Instant results', '2x multiplier', 'Streak bonuses', 'Fast rounds'],
    rtp: '98.0%',
    status: 'planning'
  },
  {
    id: 'dice',
    title: 'Dice Games',
    description: 'Craps and custom dice variations with multiple betting options',
    icon: Dice6,
    features: ['Multiple variants', 'Complex bets', 'Live rolling', 'Statistics'],
    rtp: '96.5%',
    status: 'planning'
  },
  {
    id: 'blackjack',
    title: 'Blackjack',
    description: 'Classic 21 with side bets and optimal strategy hints',
    icon: TrendingUp,
    features: ['Strategy hints', 'Side bets', 'Multi-hand', 'Card counting'],
    rtp: '99.5%',
    status: 'research'
  }
];

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'development':
      return { label: 'In Development', color: 'bg-yellow-900/50 text-yellow-400' };
    case 'planning':
      return { label: 'Planned', color: 'bg-blue-900/50 text-blue-400' };
    case 'research':
      return { label: 'Research', color: 'bg-purple-900/50 text-purple-400' };
    default:
      return { label: 'Coming Soon', color: 'bg-gray-700/50 text-gray-500' };
  }
};

export default function OtherGames() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Page Header */}
      <div className="bg-gradient-to-br from-dark-purple/40 to-deep-space/60 py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-black text-neon-cyan mb-4">
            Other Games
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Traditional casino games reimagined for the Solana blockchain. 
            Fair algorithms, instant payouts, and demo modes for all games.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-12">
        {/* Development Roadmap */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-neon-cyan mb-4">Development Roadmap</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              We're building a comprehensive suite of casino games. 
              Here's what's coming to the platform in the near future.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {UPCOMING_GAMES.map((game) => {
              const IconComponent = game.icon;
              const statusInfo = getStatusInfo(game.status);
              
              return (
                <Card 
                  key={game.id}
                  className="bg-dark-purple/50 border-neon-cyan/30 hover:border-neon-cyan/50 transition-all duration-300"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-neon-cyan/20 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-6 h-6 text-neon-cyan" />
                        </div>
                        <div>
                          <CardTitle className="text-neon-cyan text-xl">{game.title}</CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary" className={statusInfo.color}>
                              {statusInfo.label}
                            </Badge>
                            <Badge variant="outline" className="border-neon-orange/50 text-neon-orange">
                              {game.rtp} RTP
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="text-gray-400 text-base">
                      {game.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Features */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-white text-sm">Features:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {game.features.map((feature, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-300">
                            <div className="w-2 h-2 bg-neon-cyan rounded-full mr-2 flex-shrink-0"></div>
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action */}
                    <div>
                      {game.status === 'development' ? (
                        <Button 
                          disabled 
                          className="w-full"
                          data-testid={`button-${game.id}-development`}
                        >
                          In Development
                        </Button>
                      ) : (
                        <Button 
                          disabled 
                          variant="outline"
                          className="w-full border-gray-600 text-gray-500"
                          data-testid={`button-${game.id}-coming-soon`}
                        >
                          Coming Soon
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="bg-dark-purple/30 rounded-lg p-8 border border-neon-cyan/20">
          <h3 className="text-2xl font-bold text-neon-cyan mb-6 text-center">
            What to Expect
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-neon-cyan/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-neon-cyan" />
              </div>
              <h4 className="font-bold text-white mb-2">High RTP Games</h4>
              <p className="text-sm text-gray-400">
                All games designed with player-favorable return rates between 96-99%
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-neon-orange/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Dice6 className="w-8 h-8 text-neon-orange" />
              </div>
              <h4 className="font-bold text-white mb-2">Provably Fair</h4>
              <p className="text-sm text-gray-400">
                Blockchain-verified randomness and transparent game mechanics
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-neon-cyan/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coins className="w-8 h-8 text-neon-cyan" />
              </div>
              <h4 className="font-bold text-white mb-2">Instant Payouts</h4>
              <p className="text-sm text-gray-400">
                Automatic SOL transactions with no withdrawal delays
              </p>
            </div>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-neon-cyan/20 to-neon-orange/20 border border-neon-cyan/30 rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">Stay Updated</h3>
            <p className="text-gray-300 mb-6">
              Get notified when new games launch and receive exclusive early access opportunities.
            </p>
            <Button 
              className="bg-neon-orange hover:bg-neon-orange/80"
              data-testid="button-notify"
            >
              Notify Me When Available
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}