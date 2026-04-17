import { type Game, type InsertGame, type GameStats, type InsertGameStats, type ChainStats, type InsertChainStats, type ChainType, type Campaign, type InsertCampaign, type CampaignPlay, type InsertCampaignPlay, type IndexerState, type InsertIndexerState, type LpPosition, type InsertLpPosition } from "@shared/schema";
import { games, gameStats, chainStats, campaigns, campaignPlays, indexerState, lpPositions } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql as drizzleSql } from "drizzle-orm";
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

  // v2 Campaign operations
  upsertCampaign(campaign: InsertCampaign): Promise<Campaign>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  getCampaigns(): Promise<Campaign[]>;
  incrementCampaignStats(id: string, wager: string, payout: string, creatorFee: string): Promise<void>;

  // v2 Campaign plays
  createCampaignPlay(play: InsertCampaignPlay): Promise<CampaignPlay>;
  getCampaignPlays(campaignId: string, limit?: number, offset?: number): Promise<CampaignPlay[]>;
  getCampaignPlaysSince(since: Date): Promise<CampaignPlay[]>;

  // v2 Indexer state
  getIndexerState(chain: string): Promise<IndexerState | undefined>;
  updateIndexerState(chain: string, lastIndexedBlock: number): Promise<void>;

  // v2 LP positions
  upsertLpPosition(position: InsertLpPosition): Promise<LpPosition>;
  getLpPosition(lpAddress: string, chain: string): Promise<LpPosition | undefined>;
  getLpPositions(chain: string): Promise<LpPosition[]>;
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

  /*//////////////////////////////////////////////////////////////
                          v2 CAMPAIGN OPERATIONS
  //////////////////////////////////////////////////////////////*/

  async upsertCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const existing = await this.getCampaign(campaign.id);
    if (existing) {
      const [updated] = await db
        .update(campaigns)
        .set({
          ...campaign,
          updatedAt: new Date(),
        })
        .where(eq(campaigns.id, campaign.id))
        .returning();
      return updated;
    }
    const [inserted] = await db
      .insert(campaigns)
      .values({
        ...campaign,
        totalPlays: 0,
        totalWagered: "0",
        totalPayout: "0",
        creatorFeesEarned: "0",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return inserted;
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    const [row] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return row || undefined;
  }

  async getCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  }

  async incrementCampaignStats(id: string, wager: string, payout: string, creatorFee: string): Promise<void> {
    const existing = await this.getCampaign(id);
    if (!existing) return;
    await db
      .update(campaigns)
      .set({
        totalPlays: existing.totalPlays + 1,
        totalWagered: (BigInt(existing.totalWagered) + BigInt(wager)).toString(),
        totalPayout: (BigInt(existing.totalPayout) + BigInt(payout)).toString(),
        creatorFeesEarned: (BigInt(existing.creatorFeesEarned) + BigInt(creatorFee)).toString(),
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, id));
  }

  async createCampaignPlay(play: InsertCampaignPlay): Promise<CampaignPlay> {
    const [inserted] = await db
      .insert(campaignPlays)
      .values({
        ...play,
        createdAt: new Date(),
      })
      .returning();
    return inserted;
  }

  async getCampaignPlays(campaignId: string, limit: number = 50, offset: number = 0): Promise<CampaignPlay[]> {
    return await db
      .select()
      .from(campaignPlays)
      .where(eq(campaignPlays.campaignId, campaignId))
      .orderBy(desc(campaignPlays.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getCampaignPlaysSince(since: Date): Promise<CampaignPlay[]> {
    return await db
      .select()
      .from(campaignPlays)
      .where(drizzleSql`${campaignPlays.createdAt} >= ${since.toISOString()}`)
      .orderBy(desc(campaignPlays.createdAt));
  }

  async getIndexerState(chain: string): Promise<IndexerState | undefined> {
    const [row] = await db.select().from(indexerState).where(eq(indexerState.chain, chain));
    return row || undefined;
  }

  async updateIndexerState(chain: string, lastIndexedBlock: number): Promise<void> {
    const existing = await this.getIndexerState(chain);
    if (existing) {
      await db
        .update(indexerState)
        .set({ lastIndexedBlock, updatedAt: new Date() })
        .where(eq(indexerState.id, existing.id));
    } else {
      await db.insert(indexerState).values({
        id: randomUUID(),
        chain,
        lastIndexedBlock,
        updatedAt: new Date(),
      });
    }
  }

  async upsertLpPosition(position: InsertLpPosition): Promise<LpPosition> {
    const existing = await this.getLpPosition(position.lpAddress!, position.chain!);
    if (existing) {
      const [updated] = await db
        .update(lpPositions)
        .set({
          shareBalance: position.shareBalance,
          depositedUsdc: position.depositedUsdc,
          updatedAt: new Date(),
        })
        .where(eq(lpPositions.id, existing.id))
        .returning();
      return updated;
    }
    const [inserted] = await db
      .insert(lpPositions)
      .values({
        ...position,
        updatedAt: new Date(),
      })
      .returning();
    return inserted;
  }

  async getLpPosition(lpAddress: string, chain: string): Promise<LpPosition | undefined> {
    const [row] = await db
      .select()
      .from(lpPositions)
      .where(and(eq(lpPositions.lpAddress, lpAddress), eq(lpPositions.chain, chain)));
    return row || undefined;
  }

  async getLpPositions(chain: string): Promise<LpPosition[]> {
    return await db.select().from(lpPositions).where(eq(lpPositions.chain, chain));
  }
}

export const storage = new DatabaseStorage();
