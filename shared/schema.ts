import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, boolean, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chain: varchar("chain", { length: 10 }).notNull().default('solana'), // 'solana' | 'base'
  playerWallet: text("player_wallet").notNull(),
  ticketType: decimal("ticket_type", { precision: 10, scale: 6 }).notNull(),
  maxWin: decimal("max_win", { precision: 10, scale: 6 }).notNull(),
  symbols: text("symbols").array().notNull(),
  isWin: boolean("is_win").notNull().default(false),
  multiplier: integer("multiplier").default(0),
  winAmount: decimal("win_amount", { precision: 10, scale: 6 }).default("0"),
  purchaseSignature: text("purchase_signature").notNull(),
  payoutSignature: text("payout_signature"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gameStats = pgTable("game_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  totalPool: decimal("total_pool", { precision: 10, scale: 2 }).notNull().default("0"),
  totalWins: integer("total_wins").notNull().default(0),
  lastWinAmount: decimal("last_win_amount", { precision: 10, scale: 6 }).default("0"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Per-chain statistics
export const chainStats = pgTable("chain_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chain: varchar("chain", { length: 10 }).notNull().unique(), // 'solana' | 'base'
  totalPool: decimal("total_pool", { precision: 10, scale: 6 }).notNull().default("0"),
  totalWins: integer("total_wins").notNull().default(0),
  totalGames: integer("total_games").notNull().default(0),
  lastWinAmount: decimal("last_win_amount", { precision: 10, scale: 6 }).default("0"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const jackpotPurchases = pgTable(
  "jackpot_purchases",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    buyerWallet: text("buyer_wallet").notNull(),
    signature: text("signature").notNull(),
    mint: text("mint").notNull(),
    treasuryTokenAccount: text("treasury_token_account").notNull(),
    amountRaw: text("amount_raw").notNull(), // base units integer string
    tickets: integer("tickets").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    sigUnique: uniqueIndex("jackpot_purchases_signature_unique").on(t.signature),
  })
);

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  createdAt: true,
});

export const insertGameStatsSchema = createInsertSchema(gameStats).omit({
  id: true,
  updatedAt: true,
});

export const insertChainStatsSchema = createInsertSchema(chainStats).omit({
  id: true,
  updatedAt: true,
});

export const insertJackpotPurchaseSchema = createInsertSchema(jackpotPurchases).omit({
  id: true,
  createdAt: true,
});

// v2 Campaigns
export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey(), // bytes32 campaignId
  creator: text("creator").notNull(),
  creatorShareBps: integer("creator_share_bps").notNull().default(0),
  tier: integer("tier").notNull().default(0),
  brandingURI: text("branding_uri").notNull().default(""),
  maxPlays: integer("max_plays").notNull().default(0),
  expiry: timestamp("expiry").notNull(),
  totalPlays: integer("total_plays").notNull().default(0),
  totalWagered: decimal("total_wagered", { precision: 24, scale: 6 }).notNull().default("0"),
  totalPayout: decimal("total_payout", { precision: 24, scale: 6 }).notNull().default("0"),
  creatorFeesEarned: decimal("creator_fees_earned", { precision: 24, scale: 6 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const campaignPlays = pgTable("campaign_plays", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull(),
  player: text("player").notNull(),
  tier: integer("tier").notNull().default(0),
  wager: decimal("wager", { precision: 24, scale: 6 }).notNull().default("0"),
  payout: decimal("payout", { precision: 24, scale: 6 }).notNull().default("0"),
  requestId: text("request_id").notNull().default(""),
  blockNumber: integer("block_number").notNull().default(0),
  txHash: text("tx_hash").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const indexerState = pgTable("indexer_state", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chain: varchar("chain", { length: 20 }).notNull().unique(),
  lastIndexedBlock: integer("last_indexed_block").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const lpPositions = pgTable("lp_positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lpAddress: text("lp_address").notNull(),
  chain: varchar("chain", { length: 20 }).notNull().default("base"),
  shareBalance: decimal("share_balance", { precision: 24, scale: 6 }).notNull().default("0"),
  depositedUsdc: decimal("deposited_usdc", { precision: 24, scale: 6 }).notNull().default("0"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  totalPlays: true,
  totalWagered: true,
  totalPayout: true,
  creatorFeesEarned: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignPlaySchema = createInsertSchema(campaignPlays).omit({
  id: true,
  createdAt: true,
});

export const insertIndexerStateSchema = createInsertSchema(indexerState).omit({
  id: true,
  updatedAt: true,
});

export const insertLpPositionSchema = createInsertSchema(lpPositions).omit({
  id: true,
  updatedAt: true,
});

export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;
export type InsertGameStats = z.infer<typeof insertGameStatsSchema>;
export type GameStats = typeof gameStats.$inferSelect;
export type ChainStats = typeof chainStats.$inferSelect;
export type InsertChainStats = z.infer<typeof insertChainStatsSchema>;
export type JackpotPurchase = typeof jackpotPurchases.$inferSelect;
export type InsertJackpotPurchase = z.infer<typeof insertJackpotPurchaseSchema>;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type CampaignPlay = typeof campaignPlays.$inferSelect;
export type InsertCampaignPlay = z.infer<typeof insertCampaignPlaySchema>;
export type IndexerState = typeof indexerState.$inferSelect;
export type InsertIndexerState = z.infer<typeof insertIndexerStateSchema>;
export type LpPosition = typeof lpPositions.$inferSelect;
export type InsertLpPosition = z.infer<typeof insertLpPositionSchema>;

// Chain types
export type ChainType = 'solana' | 'base';

// Ticket tiers for Solana (SOL)
export const solanaTicketTypes = [
  { cost: 0.1, maxWin: 1, label: 'Bronze' },
  { cost: 0.2, maxWin: 2, label: 'Silver' },
  { cost: 0.5, maxWin: 5, label: 'Gold' },
  { cost: 0.75, maxWin: 7.5, label: 'Platinum' },
  { cost: 1.0, maxWin: 10, label: 'Diamond' },
] as const;

// Ticket tiers for Base (USDC) - stable USD values
export const baseTicketTypes = [
  { cost: 1, maxWin: 10, label: 'Bronze', currency: 'USDC' },
  { cost: 2, maxWin: 20, label: 'Silver', currency: 'USDC' },
  { cost: 5, maxWin: 50, label: 'Gold', currency: 'USDC' },
  { cost: 10, maxWin: 100, label: 'Platinum', currency: 'USDC' },
  { cost: 25, maxWin: 250, label: 'Diamond', currency: 'USDC' },
] as const;

// Combined ticket types helper
export const getTicketTypes = (chain: ChainType) => {
  return chain === 'solana' ? solanaTicketTypes : baseTicketTypes;
};

export const gameSymbols = ['🎉', '💎', '❌', '🎯', '⭐'] as const;
export const multipliers = [1, 2, 5, 10] as const;
