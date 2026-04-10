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
  const nativeCurrency = isSolana ? 'SOL' : 'USDC'

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
        { cost: 1, maxWin: 10, label: 'Bronze' },      // $1 USDC
        { cost: 2, maxWin: 20, label: 'Silver' },      // $2 USDC
        { cost: 5, maxWin: 50, label: 'Gold' },        // $5 USDC
        { cost: 10, maxWin: 100, label: 'Platinum' },  // $10 USDC
        { cost: 25, maxWin: 250, label: 'Diamond' },   // $25 USDC
      ]

  const formatAmount = (amount: number) => {
    return isSolana 
      ? `${amount.toFixed(2)} SOL`
      : `${amount.toFixed(0)} USDC`
  }

  return {
    ticketTiers,
    formatAmount,
    minBet: isSolana ? 0.1 : 1,      // 0.1 SOL or 1 USDC
    maxBet: isSolana ? 1.0 : 25,     // 1 SOL or 25 USDC
  }
}
