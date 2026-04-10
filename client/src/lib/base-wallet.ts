/**
 * Base Chain Wallet Configuration
 * 
 * Uses Wagmi + Viem for EVM wallet integration
 * Supports MetaMask, Coinbase Wallet, and WalletConnect
 */

import { createConfig, http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'
import { QueryClient } from '@tanstack/react-query'

// Base chain configuration
export const baseConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    coinbaseWallet({ 
      appName: 'Scratch n SOL',
      appLogoUrl: 'https://scratchnsol.com/logo.png', // Update with your logo
      preference: 'all', // Support both smart wallets and EOA
    }),
    injected({ 
      shimDisconnect: true,
    }), // MetaMask & other injected wallets
    walletConnect({ 
      projectId: import.meta.env.VITE_WC_PROJECT_ID || '',
      metadata: {
        name: 'Scratch n SOL',
        description: 'Multi-chain scratch card casino on Solana and Base',
        url: 'https://scratchnsol.com',
        icons: ['https://scratchnsol.com/logo.png'],
      },
    }),
  ],
  transports: {
    [base.id]: http(import.meta.env.VITE_BASE_RPC_URL || 'https://mainnet.base.org'),
    [baseSepolia.id]: http('https://sepolia.base.org'),
  },
})

// React Query client for Wagmi
export const baseQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
})

// Chain details for UI
export const BASE_CHAIN_DETAILS = {
  [base.id]: {
    name: 'Base Mainnet',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ['https://mainnet.base.org'] },
      public: { http: ['https://mainnet.base.org'] },
    },
    blockExplorers: {
      default: { name: 'BaseScan', url: 'https://basescan.org' },
    },
  },
  [baseSepolia.id]: {
    name: 'Base Sepolia',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ['https://sepolia.base.org'] },
      public: { http: ['https://sepolia.base.org'] },
    },
    blockExplorers: {
      default: { name: 'Base Sepolia Explorer', url: 'https://sepolia-explorer.base.org' },
    },
  },
}

// Helper to format ETH amounts
export function formatEth(amount: bigint): string {
  const eth = Number(amount) / 1e18
  return `${eth.toFixed(6)} ETH`
}

// Helper to parse ETH to wei
export function parseEth(amount: string): bigint {
  const [whole, fraction = ''] = amount.split('.')
  const paddedFraction = fraction.padEnd(18, '0').slice(0, 18)
  return BigInt(whole + paddedFraction)
}

// Transaction URL generator
export function getBaseTxUrl(txHash: string, chainId: number = base.id): string {
  const isMainnet = chainId === base.id
  const baseUrl = isMainnet ? 'https://basescan.org' : 'https://sepolia-explorer.base.org'
  return `${baseUrl}/tx/${txHash}`
}
