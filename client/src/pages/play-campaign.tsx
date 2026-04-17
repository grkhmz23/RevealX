import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from '@/hooks/use-toast';
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
const TIER_WAGER_USDC = [1, 2, 5, 10, 25];

// Minimal GameManager ABI for playCard
const GAME_MANAGER_ABI = [
  {
    inputs: [
      { name: 'campaignId', type: 'bytes32' },
      { name: 'tier', type: 'uint8' },
    ],
    name: 'playCard',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// Minimal ERC-20 approve ABI
const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export default function PlayCampaign() {
  const params = useParams();
  const campaignIdRaw = decodeURIComponent(params.campaignId || '');
  const [, setLocation] = useLocation();
  const { address, isConnected } = useAccount();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (!campaignIdRaw) return;
    fetch(`/api/campaigns/${encodeURIComponent(campaignIdRaw)}`)
      .then((r) => r.json())
      .then((data) => {
        setCampaign(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [campaignIdRaw]);

  const { writeContract: writeApprove, data: approveHash, isPending: isApproving } = useWriteContract();
  const { isLoading: isConfirmingApprove } = useWaitForTransactionReceipt({ hash: approveHash });

  const { writeContract: writePlay, data: playHash, isPending: isPlaying } = useWriteContract();
  const { isLoading: isConfirmingPlay } = useWaitForTransactionReceipt({ hash: playHash });

  useEffect(() => {
    if (approveHash && !isConfirmingApprove) {
      setApproved(true);
    }
  }, [approveHash, isConfirmingApprove]);

  const handleApprove = () => {
    if (!isConnected || !address) {
      toast({ title: 'Connect wallet', description: 'Please connect your Base wallet.', variant: 'destructive' });
      return;
    }
    const usdcAddress = import.meta.env.VITE_USDC_ADDRESS as `0x${string}` | undefined;
    const gameManagerAddress = import.meta.env.VITE_GAME_MANAGER_ADDRESS as `0x${string}` | undefined;
    if (!usdcAddress || !gameManagerAddress) {
      toast({ title: 'Not configured', description: 'USDC or GameManager address missing.', variant: 'destructive' });
      return;
    }
    const wager = BigInt(TIER_WAGER_USDC[campaign?.tier || 0] * 1e6);
    writeApprove({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [gameManagerAddress, wager],
    });
  };

  const handlePlay = () => {
    if (!isConnected || !address) {
      toast({ title: 'Connect wallet', description: 'Please connect your Base wallet.', variant: 'destructive' });
      return;
    }
    const gameManagerAddress = import.meta.env.VITE_GAME_MANAGER_ADDRESS as `0x${string}` | undefined;
    if (!gameManagerAddress) {
      toast({ title: 'Not configured', description: 'GameManager address missing.', variant: 'destructive' });
      return;
    }
    const bytes32Id = campaignIdRaw.startsWith('0x') && campaignIdRaw.length === 66
      ? (campaignIdRaw as `0x${string}`)
      : (`0x${Buffer.from(campaignIdRaw).toString('hex').padEnd(64, '0')}` as `0x${string}`);

    writePlay({
      address: gameManagerAddress,
      abi: GAME_MANAGER_ABI,
      functionName: 'playCard',
      args: [bytes32Id, campaign?.tier || 0],
    });
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
          Back to Campaigns
        </Button>
      </div>
    );
  }

  const isExpired = new Date(campaign.expiry) < new Date();
  const canPlay = campaign.active && !isExpired && campaign.totalPlays < campaign.maxPlays;
  const wager = TIER_WAGER_USDC[campaign.tier] || 1;

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
            Campaigns
          </Button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <Badge className="bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30 mb-3">{TIER_LABELS[campaign.tier]}</Badge>
          <h1 className="text-3xl font-black text-white break-all">{campaign.id}</h1>
          <p className="text-gray-400 mt-2">Wager ${wager} USDC per play</p>
        </div>

        <Card className="bg-gray-900/50 border-neon-cyan/20">
          <CardContent className="p-8 text-center space-y-6">
            {campaign.brandingURI && (
              <div className="flex justify-center">
                <img
                  src={campaign.brandingURI}
                  alt="Campaign branding"
                  className="max-h-40 rounded-lg border border-neon-cyan/20 object-contain"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
            )}

            {!canPlay ? (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 font-bold">
                  {isExpired ? 'Campaign has expired' : campaign.totalPlays >= campaign.maxPlays ? 'Max plays reached' : 'Campaign is inactive'}
                </p>
              </div>
            ) : (
              <>
                {!approved ? (
                  <Button
                    onClick={handleApprove}
                    disabled={isApproving || isConfirmingApprove}
                    className="w-full bg-gradient-to-r from-neon-orange to-neon-gold hover:opacity-90 text-white font-bold"
                  >
                    {isApproving || isConfirmingApprove ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Approve USDC
                  </Button>
                ) : (
                  <Button
                    onClick={handlePlay}
                    disabled={isPlaying || isConfirmingPlay}
                    className="w-full bg-gradient-to-r from-neon-cyan to-neon-purple hover:opacity-90 text-white font-bold"
                  >
                    {isPlaying || isConfirmingPlay ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Play Now
                  </Button>
                )}
              </>
            )}

            {playHash && (
              <div className="p-3 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg">
                <p className="text-sm text-neon-cyan">Transaction submitted</p>
                <p className="text-xs text-gray-400 break-all">{playHash}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-gray-500">
          Powered by RevealX on Base • Play responsibly
        </div>
      </main>
    </div>
  );
}
