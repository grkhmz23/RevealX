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

export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;
export type InsertGameStats = z.infer<typeof insertGameStatsSchema>;
export type GameStats = typeof gameStats.$inferSelect;
export type ChainStats = typeof chainStats.$inferSelect;
export type InsertChainStats = z.infer<typeof insertChainStatsSchema>;
export type JackpotPurchase = typeof jackpotPurchases.$inferSelect;
export type InsertJackpotPurchase = z.infer<typeof insertJackpotPurchaseSchema>;

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

// Ticket tiers for Base (ETH) - approximate USD value ~$2.50-$25
export const baseTicketTypes = [
  { cost: 0.001, maxWin: 0.01, label: 'Bronze' },
  { cost: 0.002, maxWin: 0.02, label: 'Silver' },
  { cost: 0.005, maxWin: 0.05, label: 'Gold' },
  { cost: 0.0075, maxWin: 0.075, label: 'Platinum' },
  { cost: 0.01, maxWin: 0.1, label: 'Diamond' },
] as const;

// Combined ticket types helper
export const getTicketTypes = (chain: ChainType) => {
  return chain === 'solana' ? solanaTicketTypes : baseTicketTypes;
};

export const gameSymbols = ['🎉', '💎', '❌', '🎯', '⭐'] as const;
export const multipliers = [1, 2, 5, 10] as const;
