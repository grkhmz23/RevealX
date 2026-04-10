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
  const nativeCurrency = isSolana ? 'SOL' : 'ETH'

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

  const ticketTiers = isSolana
    ? [
        { cost: 0.1, maxWin: 1, label: 'Bronze' },
        { cost: 0.2, maxWin: 2, label: 'Silver' },
        { cost: 0.5, maxWin: 5, label: 'Gold' },
        { cost: 0.75, maxWin: 7.5, label: 'Platinum' },
        { cost: 1.0, maxWin: 10, label: 'Diamond' },
      ]
    : [
        { cost: 0.001, maxWin: 0.01, label: 'Bronze' },
        { cost: 0.002, maxWin: 0.02, label: 'Silver' },
        { cost: 0.005, maxWin: 0.05, label: 'Gold' },
        { cost: 0.0075, maxWin: 0.075, label: 'Platinum' },
        { cost: 0.01, maxWin: 0.1, label: 'Diamond' },
      ]

  const formatAmount = (amount: number) => {
    return isSolana 
      ? `${amount.toFixed(2)} SOL`
      : `${amount.toFixed(4)} ETH`
  }

  return {
    ticketTiers,
    formatAmount,
    minBet: isSolana ? 0.1 : 0.001,
    maxBet: isSolana ? 1.0 : 0.01,
  }
}
