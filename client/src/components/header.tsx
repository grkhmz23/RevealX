import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { WalletButton } from '@/components/wallet-button';
import { ModeToggle } from '@/components/mode-toggle';
import { ModeBadge } from '@/components/mode-badge';
import { useGameMode } from '@/contexts/game-mode-context';
import { useWallet } from '@solana/wallet-adapter-react';
import { BRAND_NAME, NAV_ITEMS } from '@/config/brand';
import { User, LogOut } from 'lucide-react';
import logoPath from '@assets/ChatGPT Image 28 juil. 2025, 10_17_36_1753690663892.png';

export function Header() {
  const { isDemoMode } = useGameMode();
  const { connected, disconnect } = useWallet();
  const [location] = useLocation();

  const isActivePath = (href: string) => {
    if (href === '/') {
      return location === '/' || location === '/casino';
    }
    return location.startsWith(href);
  };

  return (
    <header className="border-b border-neon-cyan/30 p-4 sticky top-0 bg-deep-space/95 backdrop-blur-sm z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo & Brand */}
        <Link href="/">
          <div className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity duration-200">
            <div className="w-12 h-12 bg-gradient-to-br from-neon-cyan to-neon-orange rounded-lg flex items-center justify-center border-2 border-neon-cyan shadow-neon-cyan">
              <img src={logoPath} alt={BRAND_NAME} className="w-8 h-8 object-contain" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-black text-neon-cyan">{BRAND_NAME}</h1>
            </div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center space-x-6">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href}>
              <span 
                className={`
                  cursor-pointer font-medium transition-colors
                  ${isActivePath(item.href) 
                    ? 'text-neon-cyan font-bold' 
                    : 'text-gray-300 hover:text-neon-cyan'
                  }
                `}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        {/* Mobile Navigation */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="lg:hidden">
            <Button variant="outline" size="sm" className="border-neon-cyan/50 text-neon-cyan">
              Menu
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-dark-purple border-neon-cyan/30">
            {NAV_ITEMS.map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link href={item.href}>
                  <span className={isActivePath(item.href) ? 'text-neon-cyan font-bold' : 'text-gray-300'}>
                    {item.label}
                  </span>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          {/* Mode Badge & Toggle */}
          <div className="hidden md:block">
            <ModeBadge />
          </div>
          <ModeToggle />

          {/* Wallet & Profile */}
          {!isDemoMode && (
            <>
              <WalletButton />
              {connected && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10"
                      data-testid="button-profile"
                    >
                      <User className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-dark-purple border-neon-cyan/30">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        <span className="text-gray-300">Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => disconnect()}>
                      <LogOut className="w-4 h-4 mr-2" />
                      <span className="text-gray-300">Disconnect</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          )}
        </div>
      </div>

      {/* Global Notice Bar */}
      <div className="max-w-7xl mx-auto mt-2">
        <div className="text-center text-xs text-gray-400 bg-dark-purple/30 px-3 py-2 rounded border border-neon-cyan/20">
          Gambling involves risk. Play responsibly. DEMO available.
        </div>
      </div>
    </header>
  );
}