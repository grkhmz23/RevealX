import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Rocket, Loader2, Upload } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from '@/hooks/use-toast';
import logoPath from '@assets/revealx-logo.png';

const TIER_OPTIONS = [
  { value: 0, label: 'Bronze' },
  { value: 1, label: 'Silver' },
  { value: 2, label: 'Gold' },
  { value: 3, label: 'Platinum' },
  { value: 4, label: 'Diamond' },
];

// Minimal CampaignRegistry ABI for createCampaign
const CAMPAIGN_REGISTRY_ABI = [
  {
    inputs: [
      { name: 'campaignId', type: 'bytes32' },
      {
        name: 'config',
        type: 'tuple',
        components: [
          { name: 'creator', type: 'address' },
          { name: 'creatorShareBps', type: 'uint16' },
          { name: 'tier', type: 'uint8' },
          { name: 'brandingURI', type: 'string' },
          { name: 'maxPlays', type: 'uint32' },
          { name: 'expiry', type: 'uint64' },
        ],
      },
    ],
    name: 'createCampaign',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export default function CreatorNew() {
  const [, setLocation] = useLocation();
  const { address, isConnected } = useAccount();
  const [campaignId, setCampaignId] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [creatorShareBps, setCreatorShareBps] = useState('500');
  const [tier, setTier] = useState('0');
  const [brandingURI, setBrandingURI] = useState('');
  const [maxPlays, setMaxPlays] = useState('1000');
  const [expiryDays, setExpiryDays] = useState('30');
  const [uploadingImage, setUploadingImage] = useState(false);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) {
      toast({ title: 'Wallet not connected', description: 'Please connect your Base wallet first.', variant: 'destructive' });
      return;
    }
    const registryAddress = import.meta.env.VITE_CAMPAIGN_REGISTRY_ADDRESS as `0x${string}` | undefined;
    if (!registryAddress) {
      toast({ title: 'Contracts not configured', description: 'CampaignRegistry address is missing.', variant: 'destructive' });
      return;
    }
    if (!campaignId) {
      toast({ title: 'Campaign ID required', description: 'Enter a unique campaign ID string.', variant: 'destructive' });
      return;
    }

    const bytes32Id = campaignId.startsWith('0x') && campaignId.length === 66
      ? (campaignId as `0x${string}`)
      : (`0x${Buffer.from(campaignId).toString('hex').padEnd(64, '0')}` as `0x${string}`);

    const finalBrandingURI = brandingURI || 'https://revealx.fun';

    const expiryTimestamp = Math.floor(Date.now() / 1000) + parseInt(expiryDays, 10) * 86400;

    writeContract({
      address: registryAddress,
      abi: CAMPAIGN_REGISTRY_ABI,
      functionName: 'createCampaign',
      args: [
        bytes32Id,
        {
          creator: address,
          creatorShareBps: parseInt(creatorShareBps, 10),
          tier: parseInt(tier, 10),
          brandingURI: finalBrandingURI,
          maxPlays: parseInt(maxPlays, 10),
          expiry: BigInt(expiryTimestamp),
        },
      ],
    });
  };

  const isSubmitting = isPending || isConfirming;

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
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-black text-white mb-2">Create Campaign</h1>
        <p className="text-gray-400 mb-8">Deploy a new scratch card campaign on Base</p>

        <Card className="bg-gray-900/50 border-neon-cyan/20">
          <CardContent className="p-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-gray-300">Campaign Name</Label>
                <Input
                  value={campaignName}
                  onChange={(e) => {
                    setCampaignName(e.target.value);
                    if (!campaignId) {
                      const slug = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 32);
                      setCampaignId(slug);
                    }
                  }}
                  placeholder="Summer Scratch Drop"
                  className="bg-gray-950 border-neon-cyan/30 text-white"
                />
                <p className="text-xs text-gray-500">For display only. Auto-suggests the campaign ID below.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Campaign ID</Label>
                <Input
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                  placeholder="my-campaign-001"
                  className="bg-gray-950 border-neon-cyan/30 text-white"
                  required
                />
                <p className="text-xs text-gray-500">Unique identifier. Will be padded to bytes32 on-chain.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Creator Share (bps)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={10000}
                    value={creatorShareBps}
                    onChange={(e) => setCreatorShareBps(e.target.value)}
                    className="bg-gray-950 border-neon-cyan/30 text-white"
                    required
                  />
                  <p className="text-xs text-gray-500">100 bps = 1%</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Card Tier</Label>
                  <Select value={tier} onValueChange={setTier}>
                    <SelectTrigger className="bg-gray-950 border-neon-cyan/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-neon-cyan/30">
                      {TIER_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={String(t.value)} className="text-white">
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Branding Image</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingImage(true);
                      try {
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                          const dataUrl = reader.result as string;
                          const res = await fetch('/api/ipfs/pin', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ filename: file.name, mimeType: file.type, dataUrl }),
                          });
                          const json = await res.json();
                          if (res.ok && json.uri) {
                            setBrandingURI(json.uri);
                            toast({ title: 'Image pinned', description: `IPFS: ${json.uri}` });
                          } else {
                            toast({ title: 'Pin failed', description: json.message || 'Unknown error', variant: 'destructive' });
                          }
                          setUploadingImage(false);
                        };
                        reader.readAsDataURL(file);
                      } catch (err) {
                        setUploadingImage(false);
                        toast({ title: 'Upload error', description: String(err), variant: 'destructive' });
                      }
                    }}
                    className="bg-gray-950 border-neon-cyan/30 text-white file:text-white"
                  />
                  {uploadingImage && <Loader2 className="w-5 h-5 animate-spin text-neon-cyan" />}
                </div>
                {brandingURI ? (
                  <p className="text-xs text-neon-cyan break-all">{brandingURI}</p>
                ) : (
                  <p className="text-xs text-gray-500">Upload an image to pin to IPFS (requires PINATA_JWT on server), or paste a URI below.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Branding URI (override)</Label>
                <Input
                  value={brandingURI}
                  onChange={(e) => setBrandingURI(e.target.value)}
                  placeholder="https://revealx.fun/assets/my-campaign.png"
                  className="bg-gray-950 border-neon-cyan/30 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Max Plays</Label>
                  <Input
                    type="number"
                    min={1}
                    value={maxPlays}
                    onChange={(e) => setMaxPlays(e.target.value)}
                    className="bg-gray-950 border-neon-cyan/30 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Duration (days)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(e.target.value)}
                    className="bg-gray-950 border-neon-cyan/30 text-white"
                    required
                  />
                </div>
              </div>

              {hash && (
                <div className="p-3 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg">
                  <p className="text-sm text-neon-cyan">Transaction submitted</p>
                  <p className="text-xs text-gray-400 break-all">{hash}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-neon-cyan to-neon-purple hover:opacity-90 text-white font-bold"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
                {isSubmitting ? 'Submitting...' : 'Launch Campaign'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
