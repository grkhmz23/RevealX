/**
 * Unified Game Service
 * 
 * Handles game creation and payouts for both Solana and Base chains
 * Chain-agnostic game logic with chain-specific payment handling
 */

import type { InsertGame } from '@shared/schema'
import { storage } from '../storage'
import { casinoEngine } from './casino-engine'
import { SolanaService } from './solana'
import { BaseService, getBaseService } from './base'
import { withRetry } from '../utils/retry'
import { randomUUID } from 'crypto'

export type ChainType = 'solana' | 'base'

interface CreateGameParams {
  chain: ChainType
  playerWallet: string
  ticketCost: number
  purchaseTxHash: string
  isDemoMode: boolean
}

interface PayoutParams {
  gameId: string
  playerWallet: string
  winAmount: number
  chain: ChainType
}

export class GameService {
  private solanaService: SolanaService
  private baseService: BaseService

  constructor() {
    this.solanaService = new SolanaService()
    this.baseService = getBaseService()
  }

  /**
   * Create a new game - chain agnostic logic
   */
  async createGame(params: CreateGameParams) {
    const { chain, playerWallet, ticketCost, purchaseTxHash, isDemoMode } = params

    // Get pool balance based on chain
    const poolBalance = await this.getPoolBalance(chain)

    // Generate game outcome (chain-agnostic)
    const gameResult = casinoEngine.calculateWin(ticketCost, poolBalance)

    // Check for duplicate transaction
    if (!isDemoMode) {
      const existingGame = await storage.getGameByPurchaseSignature(purchaseTxHash)
      if (existingGame) {
        throw new Error('Transaction already used')
      }
    }

    // Create game record
    const gameData: InsertGame = {
      playerWallet,
      ticketType: ticketCost.toString(),
      maxWin: gameResult.maxPayout.toString(),
      symbols: gameResult.symbols,
      isWin: gameResult.canWin && gameResult.winAmount > 0,
      multiplier: gameResult.multiplier,
      winAmount: gameResult.winAmount.toString(),
      purchaseSignature: purchaseTxHash,
      payoutSignature: null,
      // Additional fields for chain tracking
      chain,
    } as InsertGame

    const game = await storage.createGame(gameData)

    return {
      gameId: game.id,
      symbols: gameResult.symbols,
      isWin: gameResult.canWin && gameResult.winAmount > 0,
      multiplier: gameResult.multiplier,
      winAmount: gameResult.winAmount,
      maxPayout: gameResult.maxPayout,
      chain,
    }
  }

  /**
   * Process payout - handles both chains
   */
  async processPayout(params: PayoutParams): Promise<{
    success: boolean
    signature: string | null
    error?: string
  }> {
    const { gameId, playerWallet, winAmount, chain } = params

    try {
      let signature: string | null = null

      if (chain === 'solana') {
        signature = await withRetry(
          () => this.solanaService.sendPayout(playerWallet, winAmount),
          { maxRetries: 3, baseDelayMs: 2000 }
        )
      } else {
        // Base chain payout
        const baseTxHash = await withRetry(
          () => this.baseService.sendPayout(playerWallet as `0x${string}`, winAmount),
          { maxRetries: 3, baseDelayMs: 2000 }
        )
        signature = baseTxHash
      }

      if (!signature) {
        return {
          success: false,
          signature: null,
          error: 'Payout transaction failed',
        }
      }

      // Update game record with payout
      await storage.updateGamePayout(gameId, signature)

      // Update stats
      const stats = await storage.getStats()
      await storage.updateStats({
        totalWins: (stats?.totalWins || 0) + 1,
        lastWinAmount: winAmount.toString(),
      })

      return {
        success: true,
        signature,
      }
    } catch (error) {
      console.error('[GameService] Payout failed:', error)
      return {
        success: false,
        signature: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Verify purchase transaction
   */
  async verifyPurchase(params: {
    chain: ChainType
    txHash: string
    expectedAmount: number
    expectedRecipient: string
  }): Promise<{
    valid: boolean
    amount?: number
    from?: string
    to?: string
    error?: string
  }> {
    const { chain, txHash, expectedAmount, expectedRecipient } = params

    try {
      if (chain === 'solana') {
        const result = await this.solanaService.verifyTransaction(txHash)
        
        if (!result.valid) {
          return { valid: false, error: 'Invalid transaction' }
        }

        // Verify recipient
        if (result.to !== expectedRecipient) {
          return { valid: false, error: 'Wrong recipient' }
        }

        // Verify amount (allow 1% tolerance)
        if (!result.amount || Math.abs(result.amount - expectedAmount) > expectedAmount * 0.01) {
          return { valid: false, error: 'Amount mismatch' }
        }

        return {
          valid: true,
          amount: result.amount,
          from: result.from,
          to: result.to,
        }
      } else {
        // Base chain verification
        const result = await this.baseService.verifyTransaction(txHash as `0x${string}`)

        if (!result.valid) {
          return { valid: false, error: 'Invalid transaction' }
        }

        // Verify recipient
        if (result.to?.toLowerCase() !== expectedRecipient.toLowerCase()) {
          return { valid: false, error: 'Wrong recipient' }
        }

        // Verify amount
        if (!result.amount || Math.abs(result.amount - expectedAmount) > expectedAmount * 0.01) {
          return { valid: false, error: 'Amount mismatch' }
        }

        return {
          valid: true,
          amount: result.amount,
          from: result.from,
          to: result.to,
        }
      }
    } catch (error) {
      console.error('[GameService] Verification failed:', error)
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      }
    }
  }

  /**
   * Get pool balance for specific chain
   */
  async getPoolBalance(chain: ChainType): Promise<number> {
    if (chain === 'solana') {
      return this.solanaService.getPoolBalance()
    } else {
      return this.baseService.getPoolBalance()
    }
  }

  /**
   * Get pool address for specific chain
   */
  getPoolAddress(chain: ChainType): string {
    if (chain === 'solana') {
      return this.solanaService.getPoolWalletAddress()
    } else {
      return this.baseService.getPoolAddress()
    }
  }
}

// Singleton instance
export const gameService = new GameService()
