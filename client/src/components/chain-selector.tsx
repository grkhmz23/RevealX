/**
 * Chain Selector Component
 * 
 * Allows users to switch between Solana and Base chains
 */

import { useChain } from '@/contexts/chain-context'
import { cn } from '@/lib/utils'

// Simple chain icons as SVG components
function SolanaIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 128 128" 
      className={className}
      fill="currentColor"
    >
      <path d="M93.94 40.61L77.02 57.53a3.13 3.13 0 01-4.42 0L55.68 40.61a3.13 3.13 0 00-4.42 0L34.06 57.81a3.13 3.13 0 002.21 5.34h85.46a3.13 3.13 0 002.21-5.34L98.36 40.61a3.13 3.13 0 00-4.42 0z" />
      <path d="M34.06 87.19l16.92-16.92a3.13 3.13 0 014.42 0l16.92 16.92a3.13 3.13 0 004.42 0l16.92-16.92a3.13 3.13 0 012.21-5.34H6.27a3.13 3.13 0 00-2.21 5.34l16.92 16.92a3.13 3.13 0 004.08 0z" opacity="0.6" />
      <path d="M93.94 64l-16.92 16.92a3.13 3.13 0 01-4.42 0L55.68 64a3.13 3.13 0 00-4.42 0L34.06 80.92a3.13 3.13 0 002.21 5.34h85.46a3.13 3.13 0 002.21-5.34L98.36 64a3.13 3.13 0 00-4.42 0z" opacity="0.6" />
    </svg>
  )
}

function BaseIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 146 146" 
      className={className}
      fill="currentColor"
    >
      <circle cx="73" cy="73" r="73" />
      <path 
        d="M73 30c23.7 0 43 19.3 43 43s-19.3 43-43 43-43-19.3-43-43 19.3-43 43-43z" 
        fill="white"
      />
      <text 
        x="73" 
        y="82" 
        textAnchor="middle" 
        fill="currentColor" 
        fontSize="36" 
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        B
      </text>
    </svg>
  )
}

export function ChainSelector() {
  const { selectedChain, setSelectedChain, isSolana, isBase } = useChain()

  return (
    <div className="flex items-center gap-2 p-1 bg-gray-900/50 rounded-xl border border-gray-700">
      {/* Solana Button */}
      <button
        onClick={() => setSelectedChain('solana')}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200",
          isSolana
            ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-900/30"
            : "text-gray-400 hover:text-white hover:bg-gray-800"
        )}
      >
        <SolanaIcon className="w-5 h-5" />
        <span className="hidden sm:inline">Solana</span>
      </button>

      {/* Base Button */}
      <button
        onClick={() => setSelectedChain('base')}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200",
          isBase
            ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/30"
            : "text-gray-400 hover:text-white hover:bg-gray-800"
        )}
      >
        <BaseIcon className="w-5 h-5 text-white" />
        <span className="hidden sm:inline">Base</span>
      </button>
    </div>
  )
}

// Compact version for mobile/header
export function ChainSelectorCompact() {
  const { selectedChain, setSelectedChain, isSolana } = useChain()

  return (
    <button
      onClick={() => setSelectedChain(isSolana ? 'base' : 'solana')}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900/50 border border-gray-700 hover:bg-gray-800 transition-colors"
    >
      {isSolana ? (
        <>
          <SolanaIcon className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-purple-400 font-medium">SOL</span>
        </>
      ) : (
        <>
          <BaseIcon className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-blue-400 font-medium">ETH</span>
        </>
      )}
      <svg 
        className="w-3 h-3 text-gray-500" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )
}
