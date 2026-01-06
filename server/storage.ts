import { type Game, type InsertGame, type GameStats, type InsertGameStats } from "@shared/schema";
import { games, gameStats } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Game operations
  createGame(game: InsertGame): Promise<Game>;
  // Back-compat alias: older routes used getGameById
  getGameById(id: string): Promise<Game | undefined>;
  getGame(id: string): Promise<Game | undefined>;
  getGameByPurchaseSignature(purchaseSignature: string): Promise<Game | undefined>;
  getGamesByWallet(wallet: string): Promise<Game[]>;
  getRecentWins(limit?: number): Promise<Game[]>;
  updateGamePayout(id: string, payoutSignature: string): Promise<void>;

  // Stats operations
  getStats(): Promise<GameStats | undefined>;
  updateStats(stats: Partial<InsertGameStats>): Promise<void>;
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
    };

    const [game] = await db.insert(games).values(gameData).returning();
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

  async getRecentWins(limit: number = 10): Promise<Game[]> {
    return await db
      .select()
      .from(games)
      .where(eq(games.isWin, true))
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
}

export const storage = new DatabaseStorage();
