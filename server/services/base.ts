/**
 * Base Chain Service
 * 
 * EVM wallet integration for Base chain using Viem
 * Handles ETH transfers, balance checks, and transaction verification
 */

import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  parseEther, 
  formatEther,
  type Hash,
  type Address,
} from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { withRetry } from '../utils/retry'

export class BaseService {
  private publicClient
  private walletClient
  private poolAccount: ReturnType<typeof privateKeyToAccount>
  private chain: typeof base | typeof baseSepolia

  constructor() {
    // Determine network
    const network = process.env.BASE_NETWORK || 'mainnet'
    this.chain = network === 'mainnet' ? base : baseSepolia
    
    const rpcUrl = process.env.BASE_RPC_URL || 
      (network === 'mainnet' 
        ? 'https://mainnet.base.org' 
        : 'https://sepolia.base.org')

    // Initialize public client (for reading blockchain)
    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(rpcUrl),
    })

    // Initialize pool wallet
    const privateKey = process.env.BASE_POOL_PRIVATE_KEY as `0x${string}` | undefined
    
    if (!privateKey) {
      console.warn('BASE_POOL_PRIVATE_KEY not set. Base service will not be able to send payouts.')
      // Create a dummy account for read-only operations
      this.poolAccount = privateKeyToAccount('0x0000000000000000000000000000000000000000000000000000000000000001')
    } else {
      this.poolAccount = privateKeyToAccount(privateKey)
    }

    // Initialize wallet client (for writing/sending transactions)
    this.walletClient = createWalletClient({
      account: this.poolAccount,
      chain: this.chain,
      transport: http(rpcUrl),
    })

    console.log(`[BaseService] Initialized for ${this.chain.name}`)
    console.log(`[BaseService] Pool address: ${this.poolAccount.address}`)
  }

  /**
   * Send ETH payout to winner
   */
  async sendPayout(toAddress: Address, amountEth: number): Promise<Hash | null> {
    try {
      // Demo mode check
      if (toAddress.toLowerCase().startsWith('demo')) {
        const demoHash = `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2)}` as Hash
        console.log(`[BaseService] Demo payout: ${amountEth} ETH to ${toAddress}`)
        return demoHash
      }

      // Check pool balance first
      const poolBalance = await this.getPoolBalance()
      if (poolBalance < amountEth + 0.0001) { // Account for gas
        console.error(`[BaseService] Insufficient pool balance: ${poolBalance} ETH`)
        return null
      }

      // Send transaction with retry
      const hash: Hash = await withRetry(async () => {
        return await this.walletClient.sendTransaction({
          to: toAddress,
          value: parseEther(amountEth.toString()),
          // Gas settings for Base
          maxFeePerGas: BigInt(1000000000), // 1 gwei
          maxPriorityFeePerGas: BigInt(100000000), // 0.1 gwei
        })
      }, {
        maxRetries: 3,
        baseDelayMs: 2000,
        retryableErrors: ['TIMEOUT', 'NONCE', 'REPLACEMENT'],
      })

      console.log(`[BaseService] Payout sent: ${amountEth} ETH to ${toAddress}, tx: ${hash}`)
      return hash
    } catch (error) {
      console.error('[BaseService] Payout failed:', error)
      return null
    }
  }

  /**
   * Verify transaction was successful
   */
  async verifyTransaction(hash: Hash): Promise<{
    valid: boolean
    amount?: number
    from?: Address
    to?: Address
    blockNumber?: bigint
  }> {
    try {
      // Get transaction receipt
      const receipt = await withRetry(async () => {
        return await this.publicClient.getTransactionReceipt({ hash })
      })

      if (!receipt) {
        return { valid: false }
      }

      // Check if transaction succeeded
      if (receipt.status !== 'success') {
        return { valid: false }
      }

      // Get transaction details
      const tx = await this.publicClient.getTransaction({ hash })
      
      if (!tx) {
        return { valid: false }
      }

      return {
        valid: true,
        amount: Number(formatEther(tx.value)),
        from: tx.from,
        to: tx.to || undefined,
        blockNumber: receipt.blockNumber,
      }
    } catch (error) {
      console.error('[BaseService] Transaction verification failed:', error)
      return { valid: false }
    }
  }

  /**
   * Get pool wallet ETH balance
   */
  async getPoolBalance(): Promise<number> {
    try {
      const balance = await this.publicClient.getBalance({
        address: this.poolAccount.address,
      })
      return Number(formatEther(balance))
    } catch (error) {
      console.error('[BaseService] Failed to get pool balance:', error)
      return 0
    }
  }

  /**
   * Get pool wallet address
   */
  getPoolAddress(): Address {
    return this.poolAccount.address
  }

  /**
   * Get user's ETH balance
   */
  async getBalance(address: Address): Promise<number> {
    try {
      const balance = await this.publicClient.getBalance({ address })
      return Number(formatEther(balance))
    } catch (error) {
      console.error('[BaseService] Failed to get balance:', error)
      return 0
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForConfirmation(hash: Hash, confirmations: number = 1): Promise<boolean> {
    try {
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        confirmations,
        timeout: 60000, // 60 seconds
      })
      return receipt.status === 'success'
    } catch (error) {
      console.error('[BaseService] Wait for confirmation failed:', error)
      return false
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<bigint> {
    try {
      return await this.publicClient.getGasPrice()
    } catch (error) {
      console.error('[BaseService] Failed to get gas price:', error)
      return BigInt(1000000000) // Fallback: 1 gwei
    }
  }

  /**
   * Check if address is valid
   */
  isValidAddress(address: string): address is Address {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }
}

// Singleton instance
let baseService: BaseService | null = null

export function getBaseService(): BaseService {
  if (!baseService) {
    baseService = new BaseService()
  }
  return baseService
}

// Reset for testing
export function resetBaseService(): void {
  baseService = null
}
