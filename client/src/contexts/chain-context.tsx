/**
 * Chain Context
 * 
 * Manages the selected blockchain (Solana or Base)
 * Provides unified interface for multi-chain operations
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type ChainType = 'solana' | 'base'

interface ChainContextType {
  selectedChain: ChainType
  setSelectedChain: (chain: ChainType) => void
  isSolana: boolean
  isBase: boolean
  chainName: string
  nativeCurrency: string
  isV2Enabled: boolean
}

const ChainContext = createContext<ChainContextType | undefined>(undefined)

interface ChainProviderProps {
  children: ReactNode
}

export function ChainProvider({ children }: ChainProviderProps) {
  // Load from localStorage, default to solana
  const [selectedChain, setSelectedChainState] = useState<ChainType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('scratch-n-sol-chain') as ChainType
      return saved || 'solana'
    }
    return 'solana'
  })

  const setSelectedChain = (chain: ChainType) => {
    setSelectedChainState(chain)
    localStorage.setItem('scratch-n-sol-chain', chain)
  }

  const isSolana = selectedChain === 'solana'
  const isBase = selectedChain === 'base'
  
  const chainName = isSolana ? 'Solana' : 'Base'
  const nativeCurrency = isSolana ? 'SOL' : 'USDC'

  // v2 toggle: Base defaults to v2 when VITE_V2_ENABLED_BASE=true
  const isV2Enabled = isBase && import.meta.env.VITE_V2_ENABLED_BASE === 'true'

  // Log chain changes for debugging
  useEffect(() => {
    console.log(`[ChainContext] Switched to ${selectedChain}`)
  }, [selectedChain])

  const value: ChainContextType = {
    selectedChain,
    setSelectedChain,
    isSolana,
    isBase,
    chainName,
    nativeCurrency,
    isV2Enabled,
  }

  return (
    <ChainContext.Provider value={value}>
      {children}
    </ChainContext.Provider>
  )
}

export function useChain(): ChainContextType {
  const context = useContext(ChainContext)
  if (context === undefined) {
    throw new Error('useChain must be used within a ChainProvider')
  }
  return context
}

// Hook to get chain-specific config
export function useChainConfig() {
  const { selectedChain, isSolana, isBase } = useChain()

  const ticketTiers = [
    { cost: 1, maxWin: 10, label: 'Bronze' },
    { cost: 2, maxWin: 20, label: 'Silver' },
    { cost: 5, maxWin: 50, label: 'Gold' },
    { cost: 10, maxWin: 100, label: 'Platinum' },
    { cost: 25, maxWin: 250, label: 'Diamond' },
  ]

  const formatAmount = (amount: number) => {
    // Unified display for investor demo: both chains show USDC-denominated values
    return `${amount.toFixed(0)} USDC`
  }

  return {
    ticketTiers,
    formatAmount,
    minBet: 1,
    maxBet: 25,
  }
}
