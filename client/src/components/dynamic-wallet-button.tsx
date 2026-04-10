/**
 * Dynamic Wallet Button
 * 
 * Shows the appropriate wallet button based on selected chain:
 * - Solana: Shows Solana wallet button (existing)
 * - Base: Shows EVM wallet button (wagmi-based)
 */

import { useChain } from '@/contexts/chain-context'
import { WalletButton } from '@/components/wallet-button'
import { BaseWalletButton } from '@/components/base-wallet-button'

export function DynamicWalletButton() {
  const { isSolana, isBase } = useChain()

  if (isSolana) {
    return <WalletButton />
  }

  if (isBase) {
    return <BaseWalletButton />
  }

  // Fallback
  return <WalletButton />
}
