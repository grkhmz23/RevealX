/**
 * Base Wallet Button
 * 
 * EVM wallet connection using Wagmi
 * Supports MetaMask, Coinbase Wallet, and WalletConnect
 */

import { useAccount, useConnect, useDisconnect, useBalance, useChainId } from 'wagmi'
import { formatEther } from 'viem'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { base, baseSepolia } from 'wagmi/chains'

export function BaseWalletButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending, error } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const [showModal, setShowModal] = useState(false)

  // Get balance
  const { data: balance } = useBalance({
    address: address,
  })

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatBalance = () => {
    if (!balance) return '0 ETH'
    const eth = Number(formatEther(balance.value))
    return `${eth.toFixed(4)} ETH`
  }

  const getNetworkName = () => {
    if (chainId === base.id) return 'Base Mainnet'
    if (chainId === baseSepolia.id) return 'Base Sepolia'
    return 'Unknown Network'
  }

  const isCorrectNetwork = chainId === base.id || chainId === baseSepolia.id

  // Wallet icons
  const getWalletIcon = (connectorId: string) => {
    switch (connectorId) {
      case 'coinbaseWallet':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
          </svg>
        )
      case 'metaMask':
      case 'injected':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        )
      case 'walletConnect':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        )
    }
  }

  const getWalletName = (connector: any) => {
    const name = connector.name
    if (name === 'Coinbase Wallet') return 'Coinbase Wallet'
    if (name === 'MetaMask') return 'MetaMask'
    if (name === 'WalletConnect') return 'WalletConnect'
    return name
  }

  // Connected state
  if (isConnected && address) {
    return (
      <div className="relative group">
        <button
          onClick={() => setShowModal(!showModal)}
          className={cn(
            "flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200",
            "bg-gradient-to-r from-blue-600/20 to-blue-700/20",
            "border border-blue-500/30 hover:border-blue-400/50",
            "hover:shadow-lg hover:shadow-blue-900/20"
          )}
        >
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold text-blue-400">
              {formatAddress(address)}
            </span>
            <span className="text-xs text-gray-400">
              {formatBalance()} • {getNetworkName()}
            </span>
          </div>
          {!isCorrectNetwork && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 rounded">
              Wrong Network
            </span>
          )}
        </button>

        {/* Dropdown menu */}
        {showModal && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl bg-gray-900 border border-gray-700 shadow-xl z-50 p-2">
            <div className="px-3 py-2 border-b border-gray-800">
              <p className="text-xs text-gray-500">Connected</p>
              <p className="text-sm font-mono text-white">{address}</p>
            </div>
            <button
              onClick={() => {
                disconnect()
                setShowModal(false)
              }}
              className="w-full mt-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    )
  }

  // Disconnected state - Connect button
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={cn(
          "flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all duration-200",
          "bg-gradient-to-r from-blue-600 to-blue-700",
          "hover:from-blue-500 hover:to-blue-600",
          "text-white shadow-lg shadow-blue-900/30",
          "hover:shadow-xl hover:shadow-blue-900/40",
          isPending && "opacity-50 cursor-wait"
        )}
        disabled={isPending}
      >
        {isPending ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M2 12h20" />
            </svg>
            <span>Connect Wallet</span>
          </>
        )}
      </button>

      {/* Wallet Selection Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="w-full max-w-sm rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Connect Wallet</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{error.message}</p>
              </div>
            )}

            <div className="space-y-2">
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => {
                    connect({ connector })
                    setShowModal(false)
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl",
                    "bg-gray-800 hover:bg-gray-700",
                    "border border-gray-700 hover:border-gray-600",
                    "transition-all duration-200",
                    !connector.ready && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={!connector.ready}
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center text-gray-300">
                    {getWalletIcon(connector.id)}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white">{getWalletName(connector)}</p>
                    {!connector.ready && (
                      <p className="text-xs text-gray-500">Not installed</p>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <p className="mt-6 text-xs text-gray-500 text-center">
              By connecting, you agree to the Terms of Service
            </p>
          </div>
        </div>
      )}
    </>
  )
}
