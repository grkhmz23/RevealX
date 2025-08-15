import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ModeBadge } from '@/components/mode-badge';
import { useGameMode } from '@/contexts/game-mode-context';
import { BRAND_NAME, BRAND_TAGLINE, CASINO_CATEGORIES, GLOBAL_NOTICES } from '@/config/brand';
import { Play, Star, TrendingUp, Shield } from 'lucide-react';

export default function CasinoHub() {
  const { isDemoMode } = useGameMode();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark-purple/40 to-deep-space/60"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(0,255,255,0.15)_0%,transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(255,140,0,0.15)_0%,transparent_50%)]"></div>
        
        <div className="relative max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-black text-neon-cyan mb-6">
            {BRAND_NAME}
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            {BRAND_TAGLINE}
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
            <Link href="/casino">
              <Button 
                size="lg"
                className="bg-neon-orange hover:bg-neon-orange/80 text-black font-bold px-8 py-4 text-lg"
                data-testid="button-start-playing"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Playing
              </Button>
            </Link>
            
            <ModeBadge className="text-sm" />
          </div>

          {/* Key Features */}
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="text-center">
              <Shield className="w-8 h-8 text-neon-cyan mx-auto mb-3" />
              <h3 className="font-bold text-white mb-2">Provably Fair</h3>
              <p className="text-sm text-gray-400">Blockchain-verified random outcomes</p>
            </div>
            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-neon-orange mx-auto mb-3" />
              <h3 className="font-bold text-white mb-2">High Returns</h3>
              <p className="text-sm text-gray-400">88-90% RTP on most games</p>
            </div>
            <div className="text-center">
              <Star className="w-8 h-8 text-neon-cyan mx-auto mb-3" />
              <h3 className="font-bold text-white mb-2">Instant Payouts</h3>
              <p className="text-sm text-gray-400">Automatic SOL transactions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Casino Categories */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-neon-cyan mb-4">Game Categories</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Choose your preferred style of gaming. All categories support both Demo and Real modes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {CASINO_CATEGORIES.map((category) => (
              <Card 
                key={category.id}
                className={`
                  bg-dark-purple/50 border-neon-cyan/30 hover:border-neon-cyan/60 
                  transition-all duration-300 hover:shadow-lg hover:shadow-neon-cyan/20
                  ${category.status === 'coming-soon' ? 'opacity-75' : ''}
                `}
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-4">
                    <CardTitle className="text-neon-cyan text-2xl">{category.title}</CardTitle>
                    <Badge 
                      variant="secondary" 
                      className={
                        category.status === 'available' 
                          ? 'bg-green-900/50 text-green-400' 
                          : 'bg-gray-700/50 text-gray-500'
                      }
                    >
                      {category.status === 'available' ? 'Available' : 'Coming Soon'}
                    </Badge>
                  </div>
                  <CardDescription className="text-gray-400 text-base">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Features List */}
                  <div className="space-y-2">
                    {category.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-300">
                        <div className="w-2 h-2 bg-neon-cyan rounded-full mr-3"></div>
                        {feature}
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  {category.status === 'available' ? (
                    <div className="flex space-x-2">
                      <Link href={category.href} className="flex-1">
                        <Button 
                          variant="outline" 
                          className="w-full border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10"
                          data-testid={`button-play-demo-${category.id}`}
                        >
                          Play Demo
                        </Button>
                      </Link>
                      <Link href={category.href} className="flex-1">
                        <Button 
                          className="w-full bg-neon-orange hover:bg-neon-orange/80"
                          data-testid={`button-play-real-${category.id}`}
                        >
                          Play Real
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <Button 
                      disabled 
                      className="w-full"
                      data-testid={`button-${category.id}-coming-soon`}
                    >
                      Coming Soon
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What's New Section */}
      <section className="py-12 px-4 bg-dark-purple/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-neon-cyan mb-4">What's New</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-dark-purple/50 border-neon-orange/30">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Badge className="bg-neon-orange text-black">NEW</Badge>
                  <CardTitle className="text-neon-orange">Classic 3×3 Slots</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Experience traditional slot machine gameplay with 5 paylines, 
                  88-90% RTP, and auto-play functionality. Available in both Demo and Real modes.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-dark-purple/50 border-neon-cyan/30">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Badge className="bg-neon-cyan text-black">UPDATED</Badge>
                  <CardTitle className="text-neon-cyan">Enhanced Security</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  All games now feature anti-overpay guarantees, solvency checks, 
                  and transparent 90/10 pool distribution for maximum player protection.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pool Distribution Banner */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-neon-cyan/20 to-neon-orange/20 border border-neon-cyan/30 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-white mb-4">Transparent Pool Distribution</h3>
            <p className="text-lg text-gray-300 mb-6">
              {GLOBAL_NOTICES.poolSplit}
            </p>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div className="bg-neon-cyan/10 rounded-lg p-4 border border-neon-cyan/30">
                <h4 className="font-bold text-neon-cyan mb-2">90% Prize Pool</h4>
                <p className="text-gray-400">
                  Funds available for player winnings and payouts
                </p>
              </div>
              <div className="bg-neon-orange/10 rounded-lg p-4 border border-neon-orange/30">
                <h4 className="font-bold text-neon-orange mb-2">10% Development</h4>
                <p className="text-gray-400">
                  Platform maintenance and new game development
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}