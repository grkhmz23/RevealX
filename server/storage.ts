import { type Game, type InsertGame, type GameStats, type InsertGameStats, type ChainStats, type InsertChainStats, type ChainType } from "@shared/schema";
import { games, gameStats, chainStats } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Game operations
  createGame(game: InsertGame): Promise<Game>;
  getGameById(id: string): Promise<Game | undefined>;
  getGame(id: string): Promise<Game | undefined>;
  getGameByPurchaseSignature(purchaseSignature: string): Promise<Game | undefined>;
  getGamesByWallet(wallet: string): Promise<Game[]>;
  getGamesByWalletAndChain(wallet: string, chain: ChainType): Promise<Game[]>;
  getRecentWins(limit?: number): Promise<Game[]>;
  getRecentWinsByChain(chain: ChainType, limit?: number): Promise<Game[]>;
  updateGamePayout(id: string, payoutSignature: string): Promise<void>;

  // Stats operations
  getStats(): Promise<GameStats | undefined>;
  updateStats(stats: Partial<InsertGameStats>): Promise<void>;

  // Chain-specific stats
  getChainStats(chain: ChainType): Promise<ChainStats | undefined>;
  updateChainStats(chain: ChainType, stats: Partial<InsertChainStats>): Promise<void>;
  incrementChainStats(chain: ChainType, isWin: boolean, winAmount?: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = randomUUID();
    const gameData = {
      ...insertGame,
      id,
      createdAt: new Date(),
      isWin: insertGame.isWin || false,
      multiplier: insertGame.multiplier || 0,
      winAmount: insertGame.winAmount || "0",
      payoutSignature: insertGame.payoutSignature || null,
      chain: insertGame.chain || 'solana',
    };

    const [game] = await db.insert(games).values(gameData).returning();
    
    // Update chain stats
    await this.incrementChainStats(
      (insertGame.chain || 'solana') as ChainType,
      insertGame.isWin || false,
      insertGame.winAmount || "0"
    );
    
    return game;
  }

  async getGame(id: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game || undefined;
  }

  async getGameById(id: string): Promise<Game | undefined> {
    return this.getGame(id);
  }

  async getGameByPurchaseSignature(purchaseSignature: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.purchaseSignature, purchaseSignature));
    return game || undefined;
  }

  async getGamesByWallet(wallet: string): Promise<Game[]> {
    return await db.select().from(games).where(eq(games.playerWallet, wallet));
  }

  async getGamesByWalletAndChain(wallet: string, chain: ChainType): Promise<Game[]> {
    return await db
      .select()
      .from(games)
      .where(and(eq(games.playerWallet, wallet), eq(games.chain, chain)));
  }

  async getRecentWins(limit: number = 10): Promise<Game[]> {
    return await db
      .select()
      .from(games)
      .where(eq(games.isWin, true))
      .orderBy(desc(games.createdAt))
      .limit(limit);
  }

  async getRecentWinsByChain(chain: ChainType, limit: number = 10): Promise<Game[]> {
    return await db
      .select()
      .from(games)
      .where(and(eq(games.isWin, true), eq(games.chain, chain)))
      .orderBy(desc(games.createdAt))
      .limit(limit);
  }

  async updateGamePayout(id: string, payoutSignature: string): Promise<void> {
    await db.update(games).set({ payoutSignature }).where(eq(games.id, id));
  }

  async getStats(): Promise<GameStats | undefined> {
    const [stats] = await db.select().from(gameStats).limit(1);
    return stats || undefined;
  }

  async updateStats(updates: Partial<InsertGameStats>): Promise<void> {
    const existingStats = await this.getStats();

    if (existingStats) {
      await db
        .update(gameStats)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(gameStats.id, existingStats.id));
    } else {
      const newStats = {
        id: randomUUID(),
        totalPool: "0",
        totalWins: 0,
        lastWinAmount: "0",
        ...updates,
        updatedAt: new Date(),
      };
      await db.insert(gameStats).values(newStats);
    }
  }

  // Chain-specific stats
  async getChainStats(chain: ChainType): Promise<ChainStats | undefined> {
    const [stats] = await db.select().from(chainStats).where(eq(chainStats.chain, chain));
    return stats || undefined;
  }

  async updateChainStats(chain: ChainType, updates: Partial<InsertChainStats>): Promise<void> {
    const existingStats = await this.getChainStats(chain);

    if (existingStats) {
      await db
        .update(chainStats)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(chainStats.id, existingStats.id));
    } else {
      const newStats = {
        id: randomUUID(),
        chain,
        totalPool: "0",
        totalWins: 0,
        totalGames: 0,
        lastWinAmount: "0",
        ...updates,
        updatedAt: new Date(),
      };
      await db.insert(chainStats).values(newStats);
    }
  }

  async incrementChainStats(chain: ChainType, isWin: boolean, winAmount: string = "0"): Promise<void> {
    const existingStats = await this.getChainStats(chain);

    if (existingStats) {
      await db
        .update(chainStats)
        .set({
          totalGames: existingStats.totalGames + 1,
          totalWins: existingStats.totalWins + (isWin ? 1 : 0),
          lastWinAmount: isWin ? winAmount : existingStats.lastWinAmount,
          updatedAt: new Date(),
        })
        .where(eq(chainStats.id, existingStats.id));
    } else {
      await db.insert(chainStats).values({
        id: randomUUID(),
        chain,
        totalPool: "0",
        totalGames: 1,
        totalWins: isWin ? 1 : 0,
        lastWinAmount: isWin ? winAmount : "0",
        updatedAt: new Date(),
      });
    }
  }
}

export const storage = new DatabaseStorage();
