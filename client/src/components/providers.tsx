/**
 * App Providers
 * 
 * Combines all context providers:
 * - Chain selection
 * - Solana wallet (via wallet-context.tsx)
 * - Base/EVM wallet (via Wagmi)
 * - Game mode
 * - React Query
 */

import { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'

import { ChainProvider } from '@/contexts/chain-context'
import { WalletContextProvider } from '@/contexts/wallet-context'
import { GameModeProvider } from '@/contexts/game-mode-context'
import { queryClient } from '@/lib/queryClient'
import { baseConfig, baseQueryClient } from '@/lib/base-wallet'

interface ProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: ProvidersProps) {
  return (
    <ChainProvider>
      {/* Solana Wallet Provider */}
      <WalletContextProvider>
        {/* Base/EVM Wallet Provider */}
        <WagmiProvider config={baseConfig}>
          <QueryClientProvider client={baseQueryClient}>
            {/* Game Mode (Demo/Real) */}
            <GameModeProvider>
              {/* Solana Query Client */}
              <QueryClientProvider client={queryClient}>
                {children}
              </QueryClientProvider>
            </GameModeProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </WalletContextProvider>
    </ChainProvider>
  )
}
