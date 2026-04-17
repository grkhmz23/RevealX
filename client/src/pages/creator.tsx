import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Plus, Users, Coins, Calendar, BarChart3 } from 'lucide-react';
import { BaseWalletButton } from '@/components/base-wallet-button';
import { useAccount } from 'wagmi';
import logoPath from '@assets/revealx-logo.png';

interface Campaign {
  id: string;
  creator: string;
  creatorShareBps: number;
  tier: number;
  brandingURI: string;
  maxPlays: number;
  expiry: string;
  totalPlays: number;
  totalWagered: string;
  totalPayout: string;
  active: boolean;
  createdAt: string;
}

const TIER_LABELS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
const TIER_COLORS = ['text-amber-600', 'text-slate-400', 'text-yellow-400', 'text-cyan-300', 'text-purple-400'];

export default function Creator() {
  const [, setLocation] = useLocation();
  const { address, isConnected } = useAccount();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/campaigns')
      .then((r) => r.json())
      .then((data) => {
        const all = Array.isArray(data) ? data : [];
        const mine = address
          ? all.filter((c: Campaign) => c.creator.toLowerCase() === address.toLowerCase())
          : [];
        setCampaigns(mine);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [address]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-neon-cyan/30 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-br from-neon-cyan to-neon-orange rounded-lg flex items-center justify-center border border-neon-cyan">
                <img src={logoPath} alt="RevealX" className="w-8 h-8 object-contain" />
              </div>
              <span className="text-xl font-black text-neon-cyan hidden sm:block">REVEALX</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setLocation('/')} className="border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Button>
            <BaseWalletButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">Creator Dashboard</h1>
            <p className="text-gray-400 mt-1">Launch and manage scratch card campaigns</p>
          </div>
          <Button onClick={() => setLocation('/creator/new')} className="bg-gradient-to-r from-neon-cyan to-neon-purple hover:opacity-90 text-white font-bold">
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </div>

        {!isConnected ? (
          <Card className="bg-gray-900/50 border-neon-cyan/20 text-center py-16">
            <CardContent>
              <p className="text-gray-400 text-lg mb-4">Connect your Base wallet to view your campaigns</p>
              <BaseWalletButton />
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-gray-900/50 border-neon-cyan/20 h-48 animate-pulse" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <Card className="bg-gray-900/50 border-neon-cyan/20 text-center py-16">
            <CardContent>
              <p className="text-gray-400 text-lg mb-4">No campaigns found for {address?.slice(0,6)}...{address?.slice(-4)}</p>
              <Button onClick={() => setLocation('/creator/new')} className="bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30 border border-neon-cyan/50">
                Launch your first campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((c) => (
              <Card key={c.id} className="bg-gray-900/50 border-neon-cyan/20 hover:border-neon-cyan/40 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className={`bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30`}>
                      {TIER_LABELS[c.tier] || 'Unknown'}
                    </Badge>
                    <span className={`text-xs font-bold ${c.active ? 'text-green-400' : 'text-red-400'}`}>
                      {c.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <CardTitle className="text-white text-lg truncate mt-2" title={c.id}>
                    {c.id}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-1"><Users className="w-4 h-4" /> Plays</span>
                    <span className="text-white font-medium">{c.totalPlays} / {c.maxPlays}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-1"><Coins className="w-4 h-4" /> Wagered</span>
                    <span className="text-white font-medium">${Number(c.totalWagered).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-1"><BarChart3 className="w-4 h-4" /> Payout</span>
                    <span className="text-white font-medium">${Number(c.totalPayout).toFixed(2)}</span>
                  </div>
                  <Separator className="bg-neon-cyan/10" />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(c.expiry).toLocaleDateString()}</span>
                    <span className="truncate max-w-[120px]" title={c.creator}>{c.creator.slice(0, 6)}...{c.creator.slice(-4)}</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1 border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10" onClick={() => setLocation(`/creator/${encodeURIComponent(c.id)}`)}>
                      Details
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 border-neon-orange/30 text-neon-orange hover:bg-neon-orange/10" onClick={() => setLocation(`/play/${encodeURIComponent(c.id)}`)}>
                      Play
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
