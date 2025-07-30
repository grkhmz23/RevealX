import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useState, useEffect } from 'react';
import { formatSOL } from '@/lib/utils';
import { testWalletConnection } from '@/lib/wallet-diagnostics';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { proxyRPC } from '@/lib/rpc-service';

export function WalletButton() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch wallet balance when connected using proxy RPC service
  useEffect(() => {
    const fetchBalance = async (retryCount = 0) => {
      if (connected && publicKey) {
        console.log(`Fetching balance for wallet: ${publicKey.toString()}`);
        console.log(`Using proxy RPC service with multiple fallbacks`);
        
        setLoading(true);
        try {
          // Use proxy RPC service for reliable balance fetching
          console.log('🔍 WALLET BALANCE: Fetching via proxy RPC...');
          const solBalance = await proxyRPC.getBalance(publicKey);
          console.log(`✅ WALLET BALANCE: Fetched successfully via proxy: ${solBalance} SOL`);
          
          // Ensure balance is a valid number and set it
          if (typeof solBalance === 'number' && !isNaN(solBalance)) {
            setBalance(solBalance);
          } else {
            console.error('❌ Invalid balance received:', solBalance);
            setBalance(0);
          }
        } catch (error) {
          console.error(`Failed to fetch wallet balance (attempt ${retryCount + 1}):`, error);
          console.error('Error details:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : 'Unknown error',
            publicKey: publicKey.toString(),
            service: 'proxy-rpc'
          });
          
          // Run diagnostics on first failure
          if (retryCount === 0) {
            console.log('Running wallet connection diagnostics...');
            testWalletConnection(publicKey).catch(diagError => {
              console.error('Diagnostics failed:', diagError);
            });
          }
          
          // Retry up to 3 times with exponential backoff
          if (retryCount < 2) {
            console.log(`Retrying balance fetch in ${Math.pow(2, retryCount)} seconds...`);
            setTimeout(() => {
              fetchBalance(retryCount + 1);
            }, Math.pow(2, retryCount) * 1000);
          } else {
            console.error('All balance fetch attempts failed');
            setBalance(null);
          }
        } finally {
          if (retryCount === 0) {
            setLoading(false);
          }
        }
      } else {
        console.log('Wallet not connected or no public key available');
        setBalance(null);
        setLoading(false);
      }
    };

    fetchBalance();
  }, [connected, publicKey]);

  if (!connected) {
    return (
      <WalletMultiButton className="!bg-neon-cyan !text-black !font-bold !px-4 !py-2 !rounded-lg hover:!bg-neon-cyan/80 !transition-colors" />
    );
  }

  return <ProfileDropdown balance={balance} loading={loading} />;
}