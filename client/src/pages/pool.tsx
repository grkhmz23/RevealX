import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Coins, TrendingUp, Wallet, Loader2 } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { toast } from '@/hooks/use-toast';
import logoPath from '@assets/revealx-logo.png';

// Minimal RevealXPool ABI
const POOL_ABI = [
  {
    inputs: [{ name: 'assets', type: 'uint256' }, { name: 'receiver', type: 'address' }],
    name: 'deposit',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'shares', type: 'uint256' }, { name: 'receiver', type: 'address' }, { name: 'owner', type: 'address' }],
    name: 'redeem',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalAssets',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'shares', type: 'uint256' }],
    name: 'convertToAssets',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

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

export default function Pool() {
  const [, setLocation] = useLocation();
  const { address, isConnected } = useAccount();
  const poolAddress = import.meta.env.VITE_REVEALX_POOL_ADDRESS as `0x${string}` | undefined;
  const usdcAddress = import.meta.env.VITE_USDC_ADDRESS as `0x${string}` | undefined;

  const [poolInfo, setPoolInfo] = useState<{ tvl: string; maxPayout: string } | null>(null);
  const [feeInfo, setFeeInfo] = useState<{ fees7d: string; apy: string } | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawShares, setWithdrawShares] = useState('');

  useEffect(() => {
    if (!poolAddress) return;
    fetch('/api/pool/v2')
      .then((r) => r.json())
      .then((data) => {
        setPoolInfo({
          tvl: data.tvl || '0',
          maxPayout: data.maxPayout || '0',
        });
      })
      .catch(() => {});
    fetch('/api/pool/v2/fees')
      .then((r) => r.json())
      .then((data) => {
        setFeeInfo({
          fees7d: data.fees7d || '0',
          apy: data.apy || '0',
        });
      })
      .catch(() => {});
  }, [poolAddress]);

  const { data: userShares } = useReadContract({
    address: poolAddress,
    abi: POOL_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!poolAddress && !!address },
  });

  const { data: userAssets } = useReadContract({
    address: poolAddress,
    abi: POOL_ABI,
    functionName: 'convertToAssets',
    args: userShares ? [userShares] : undefined,
    query: { enabled: !!poolAddress && !!userShares },
  });

  const { writeContract: writeApprove, data: approveHash, isPending: isApproving } = useWriteContract();
  const { isLoading: isConfirmingApprove } = useWaitForTransactionReceipt({ hash: approveHash });

  const { writeContract: writeDeposit, data: depositHash, isPending: isDepositing } = useWriteContract();
  const { isLoading: isConfirmingDeposit } = useWaitForTransactionReceipt({ hash: depositHash });

  const { writeContract: writeRedeem, data: redeemHash, isPending: isRedeeming } = useWriteContract();
  const { isLoading: isConfirmingRedeem } = useWaitForTransactionReceipt({ hash: redeemHash });

  const handleDeposit = () => {
    if (!isConnected || !address || !poolAddress || !usdcAddress) {
      toast({ title: 'Not ready', description: 'Connect wallet and ensure contracts are configured.', variant: 'destructive' });
      return;
    }
    const amount = BigInt(Math.floor(parseFloat(depositAmount) * 1e6));
    if (amount <= 0n) return;
    writeApprove({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [poolAddress, amount],
    });
  };

  const handleDepositAfterApprove = () => {
    if (!isConnected || !address || !poolAddress) return;
    const amount = BigInt(Math.floor(parseFloat(depositAmount) * 1e6));
    writeDeposit({
      address: poolAddress,
      abi: POOL_ABI,
      functionName: 'deposit',
      args: [amount, address],
    });
  };

  const handleWithdraw = () => {
    if (!isConnected || !address || !poolAddress) {
      toast({ title: 'Not ready', description: 'Connect wallet and ensure pool is configured.', variant: 'destructive' });
      return;
    }
    const shares = BigInt(Math.floor(parseFloat(withdrawShares) * 1e6));
    if (shares <= 0n) return;
    writeRedeem({
      address: poolAddress,
      abi: POOL_ABI,
      functionName: 'redeem',
      args: [shares, address, address],
    });
  };

  const formattedTvl = poolInfo ? (Number(poolInfo.tvl) / 1e6).toFixed(2) : '--';
  const formattedMaxPayout = poolInfo ? (Number(poolInfo.maxPayout) / 1e6).toFixed(2) : '--';
  const formattedShares = userShares ? (Number(userShares) / 1e6).toFixed(6) : '0.000000';
  const formattedAssets = userAssets ? (Number(userAssets) / 1e6).toFixed(2) : '0.00';

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
          <Button variant="outline" onClick={() => setLocation('/')} className="border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white">Liquidity Pool</h1>
          <p className="text-gray-400 mt-1">Deposit USDC into the RevealXPool and earn yield from house edge</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gray-900/50 border-neon-cyan/20">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400 flex items-center gap-2"><Coins className="w-4 h-4" /> TVL</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-white">${formattedTvl}</div></CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-neon-cyan/20">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Max Payout</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-white">${formattedMaxPayout}</div></CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-neon-cyan/20">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> 7d Fees</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-white">${feeInfo ? Number(feeInfo.fees7d).toFixed(2) : '--'}</div></CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-neon-cyan/20">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> APY</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-white">{feeInfo ? `${Number(feeInfo.apy).toFixed(2)}%` : '--'}</div></CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-neon-cyan/20">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400 flex items-center gap-2"><Wallet className="w-4 h-4" /> Your Position</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">${formattedAssets}</div>
              <div className="text-xs text-gray-500">{formattedShares} shares</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-900/50 border-neon-cyan/20">
          <CardContent className="p-6">
            <Tabs defaultValue="deposit" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-950">
                <TabsTrigger value="deposit" className="data-[state=active]:bg-neon-cyan/20 data-[state=active]:text-neon-cyan">Deposit</TabsTrigger>
                <TabsTrigger value="withdraw" className="data-[state=active]:bg-neon-cyan/20 data-[state=active]:text-neon-cyan">Withdraw</TabsTrigger>
              </TabsList>

              <TabsContent value="deposit" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Amount (USDC)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="100"
                    className="bg-gray-950 border-neon-cyan/30 text-white"
                  />
                </div>
                {approveHash && !isConfirmingApprove ? (
                  <Button
                    onClick={handleDepositAfterApprove}
                    disabled={isDepositing || isConfirmingDeposit}
                    className="w-full bg-gradient-to-r from-neon-cyan to-neon-purple hover:opacity-90 text-white font-bold"
                  >
                    {isDepositing || isConfirmingDeposit ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Deposit'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleDeposit}
                    disabled={isApproving || isConfirmingApprove}
                    className="w-full bg-gradient-to-r from-neon-cyan to-neon-purple hover:opacity-90 text-white font-bold"
                  >
                    {isApproving || isConfirmingApprove ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Approve & Deposit'}
                  </Button>
                )}
                {depositHash && (
                  <div className="p-3 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg">
                    <p className="text-sm text-neon-cyan">Deposit submitted</p>
                    <p className="text-xs text-gray-400 break-all">{depositHash}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="withdraw" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Shares to redeem</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.000001}
                    value={withdrawShares}
                    onChange={(e) => setWithdrawShares(e.target.value)}
                    placeholder={formattedShares}
                    className="bg-gray-950 border-neon-cyan/30 text-white"
                  />
                  <p className="text-xs text-gray-500">1 share = ~${Number(userAssets || 0n) / (Number(userShares || 1n) || 1) / 1e6 * 1e6 || '1.00'} USDC</p>
                </div>
                <Button
                  onClick={handleWithdraw}
                  disabled={isRedeeming || isConfirmingRedeem}
                  className="w-full bg-gradient-to-r from-neon-orange to-neon-gold hover:opacity-90 text-white font-bold"
                >
                  {isRedeeming || isConfirmingRedeem ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Withdraw'}
                </Button>
                {redeemHash && (
                  <div className="p-3 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg">
                    <p className="text-sm text-neon-cyan">Withdrawal submitted</p>
                    <p className="text-xs text-gray-400 break-all">{redeemHash}</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
