import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Users, Coins, Trophy, Calendar, BarChart3, Copy, Check, Code } from 'lucide-react';
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
  creatorFeesEarned: string;
  active: boolean;
  createdAt: string;
}

interface Play {
  id: string;
  player: string;
  wager: string;
  payout: string;
  requestId: string;
  createdAt: string;
}

const TIER_LABELS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];

export default function CreatorDetail() {
  const params = useParams();
  const campaignId = decodeURIComponent(params.campaignId || '');
  const [, setLocation] = useLocation();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [plays, setPlays] = useState<Play[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

  useEffect(() => {
    if (!campaignId) return;
    Promise.all([
      fetch(`/api/campaigns/${encodeURIComponent(campaignId)}`).then((r) => r.json()),
      fetch(`/api/campaigns/${encodeURIComponent(campaignId)}/plays?limit=20`).then((r) => r.json()),
    ])
      .then(([cData, pData]) => {
        setCampaign(cData);
        setPlays(Array.isArray(pData) ? pData : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [campaignId]);

  const copyLink = () => {
    const url = `${window.location.origin}/play/${encodeURIComponent(campaignId)}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const copyEmbed = () => {
    const embed = `<iframe src="${window.location.origin}/play/${encodeURIComponent(campaignId)}" width="420" height="600" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(embed);
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-neon-cyan text-xl animate-pulse">Loading campaign...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold text-white mb-4">Campaign not found</h1>
        <Button onClick={() => setLocation('/creator')} className="bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
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
          <Button variant="outline" onClick={() => setLocation('/creator')} className="border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30">{TIER_LABELS[campaign.tier]}</Badge>
              <span className={`text-xs font-bold ${campaign.active ? 'text-green-400' : 'text-red-400'}`}>
                {campaign.active ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white break-all">{campaign.id}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={copyLink} className="border-neon-purple/30 text-neon-purple hover:bg-neon-purple/10">
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              Copy Link
            </Button>
            <Button onClick={() => setLocation(`/play/${encodeURIComponent(campaignId)}`)} className="bg-gradient-to-r from-neon-cyan to-neon-purple hover:opacity-90 text-white font-bold">
              Play
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-900/50 border-neon-cyan/20">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400 flex items-center gap-2"><Users className="w-4 h-4" /> Plays</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-white">{campaign.totalPlays} <span className="text-sm text-gray-500 font-normal">/ {campaign.maxPlays}</span></div></CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-neon-cyan/20">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400 flex items-center gap-2"><Coins className="w-4 h-4" /> Wagered</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-white">${Number(campaign.totalWagered).toFixed(2)}</div></CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-neon-cyan/20">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400 flex items-center gap-2"><Trophy className="w-4 h-4" /> Payout</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-white">${Number(campaign.totalPayout).toFixed(2)}</div></CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-neon-cyan/20">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Share</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-white">{campaign.creatorShareBps / 100}%</div></CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-neon-cyan/20">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400 flex items-center gap-2"><Coins className="w-4 h-4" /> Revenue</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-white">${Number(campaign.creatorFeesEarned).toFixed(2)}</div></CardContent>
          </Card>
        </div>

        <Card className="bg-gray-900/50 border-neon-cyan/20 mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2"><Code className="w-4 h-4" /> Embed Snippet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-gray-950 rounded-lg border border-neon-cyan/10 font-mono text-xs text-gray-300 break-all mb-3">
              {`<iframe src="${window.location.origin}/play/${encodeURIComponent(campaignId)}" width="420" height="600" frameborder="0"></iframe>`}
            </div>
            <Button variant="outline" onClick={copyEmbed} className="border-neon-purple/30 text-neon-purple hover:bg-neon-purple/10">
              {embedCopied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              Copy Embed Code
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-neon-cyan/20">
          <CardHeader>
            <CardTitle className="text-white">Recent Plays</CardTitle>
          </CardHeader>
          <CardContent>
            {plays.length === 0 ? (
              <p className="text-gray-400">No plays yet</p>
            ) : (
              <div className="space-y-3">
                {plays.map((p) => (
                  <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-950/50 rounded-lg border border-neon-cyan/10">
                    <div className="text-sm">
                      <span className="text-neon-cyan font-medium">{p.player.slice(0, 6)}...{p.player.slice(-4)}</span>
                      <span className="text-gray-500 mx-2">•</span>
                      <span className="text-gray-400">{new Date(p.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-sm mt-1 sm:mt-0">
                      <span className="text-gray-400">Wager ${Number(p.wager).toFixed(2)}</span>
                      <span className="text-gray-500 mx-2">→</span>
                      <span className={Number(p.payout) > 0 ? 'text-green-400 font-bold' : 'text-gray-400'}>
                        {Number(p.payout) > 0 ? `Win $${Number(p.payout).toFixed(2)}` : 'Loss'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
