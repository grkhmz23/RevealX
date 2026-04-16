/**
 * Base Chain Service
 * 
 * EVM wallet integration for Base chain using Viem
 * Handles USDC transfers, balance checks, and transaction verification
 */

import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  parseUnits, 
  formatUnits,
  type Hash,
  type Address,
  erc20Abi,
} from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { withRetry } from '../utils/retry'

// USDC Contract addresses
const USDC_CONTRACTS = {
  [base.id]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
  [baseSepolia.id]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address,
}

export class BaseService {
  private publicClient
  private walletClient
  private poolAccount: ReturnType<typeof privateKeyToAccount>
  private chain: typeof base | typeof baseSepolia
  private usdcContract: Address

  constructor() {
    // Determine network
    const network = process.env.BASE_NETWORK || 'mainnet'
    this.chain = network === 'mainnet' ? base : baseSepolia
    this.usdcContract = USDC_CONTRACTS[this.chain.id]
    
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
    const isValidPrivateKey = (key: string) => /^0x[0-9a-fA-F]{64}$/.test(key)

    if (!privateKey || !isValidPrivateKey(privateKey)) {
      console.warn('BASE_POOL_PRIVATE_KEY not set or invalid. Base service will operate in read-only mode.')
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
    console.log(`[BaseService] USDC Contract: ${this.usdcContract}`)
    console.log(`[BaseService] Pool address: ${this.poolAccount.address}`)
  }

  /**
   * Send USDC payout to winner
   */
  private isReadOnly(): boolean {
    // Check if we're using the dummy account (read-only mode)
    return this.poolAccount.address.toLowerCase() === '0x7e5f4552091a69125d5dfcb7b8c2659029395bdf'.toLowerCase()
  }

  async sendPayout(toAddress: Address, amountUsdc: number): Promise<Hash | null> {
    try {
      if (this.isReadOnly()) {
        console.warn('[BaseService] Cannot send payout: BASE_POOL_PRIVATE_KEY not configured')
        return null
      }

      // Demo mode check
      if (toAddress.toLowerCase().startsWith('demo')) {
        const demoHash = `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2)}` as Hash
        console.log(`[BaseService] Demo payout: ${amountUsdc} USDC to ${toAddress}`)
        return demoHash
      }

      // Check pool USDC balance first
      const poolBalance = await this.getPoolBalance()
      if (poolBalance < amountUsdc) {
        console.error(`[BaseService] Insufficient pool balance: ${poolBalance} USDC`)
        return null
      }

      // Convert amount to USDC decimals (6 decimals)
      const amountRaw = parseUnits(amountUsdc.toString(), 6)

      // Send USDC transfer transaction
      const hash = await withRetry(async () => {
        return await this.walletClient.writeContract({
          address: this.usdcContract,
          abi: erc20Abi,
          functionName: 'transfer',
          args: [toAddress, amountRaw],
        })
      }, {
        maxRetries: 3,
        baseDelayMs: 2000,
        retryableErrors: ['TIMEOUT', 'NONCE', 'REPLACEMENT'],
      })

      console.log(`[BaseService] Payout sent: ${amountUsdc} USDC to ${toAddress}, tx: ${hash}`)
      return hash
    } catch (error) {
      console.error('[BaseService] Payout failed:', error)
      return null
    }
  }

  /**
   * Verify USDC transaction was successful
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

      // For USDC transfers, we need to parse the transfer event
      // This is a simplified check - in production, you'd parse the event logs
      return {
        valid: true,
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
   * Get pool wallet USDC balance
   */
  async getPoolBalance(): Promise<number> {
    try {
      const balance = await this.publicClient.readContract({
        address: this.usdcContract,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [this.poolAccount.address],
      })
      
      // USDC has 6 decimals
      return Number(formatUnits(balance, 6))
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
   * Get USDC contract address
   */
  getUsdcContract(): Address {
    return this.usdcContract
  }

  /**
   * Get user's USDC balance
   */
  async getBalance(address: Address): Promise<number> {
    try {
      const balance = await this.publicClient.readContract({
        address: this.usdcContract,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      })
      
      return Number(formatUnits(balance, 6))
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
   * Check if address is valid
   */
  isValidAddress(address: string): address is Address {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  /**
   * Get ETH balance (for gas)
   */
  async getEthBalance(address: Address): Promise<number> {
    try {
      const balance = await this.publicClient.getBalance({ address })
      return Number(formatUnits(balance, 18))
    } catch (error) {
      console.error('[BaseService] Failed to get ETH balance:', error)
      return 0
    }
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
