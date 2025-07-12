import { pgTable, text, serial, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  telegramId: text("telegram_id").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  balance: real("balance").notNull().default(0.00),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gameResults = pgTable("game_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  gameType: text("game_type").notNull(),
  betAmount: real("bet_amount").notNull(),
  multiplier: real("multiplier").notNull(),
  payout: real("payout").notNull(),
  result: text("result").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  telegramId: true,
  firstName: true,
  lastName: true,
});

export const insertGameResultSchema = createInsertSchema(gameResults).omit({
  id: true,
  timestamp: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type GameResult = typeof gameResults.$inferSelect;
export type InsertGameResult = z.infer<typeof insertGameResultSchema>;

// Game-specific schemas
export const crashGameSchema = z.object({
  betAmount: z.number().positive(),
  cashOutAt: z.number().positive().optional(),
});

export const coinFlipGameSchema = z.object({
  betAmount: z.number().positive(),
  choice: z.enum(["heads", "tails"]),
});

export const limboGameSchema = z.object({
  betAmount: z.number().positive(),
  target: z.number().positive(),
});

export const diceGameSchema = z.object({
  betAmount: z.number().positive(),
  target: z.number().min(1).max(100),
  isOver: z.boolean(),
});

export const minesGameSchema = z.object({
  betAmount: z.number().positive(),
  minesCount: z.number().min(1).max(24),
  selectedTiles: z.array(z.number()).optional(),
});

export const rouletteGameSchema = z.object({
  betAmount: z.number().positive(),
  betType: z.enum(["number", "red", "black", "odd", "even", "high", "low", "column", "2to1-1", "2to1-2", "2to1-3", "2to1-top"]),
  betValue: z.union([z.number(), z.string()]).optional(),
});

export type CrashGame = z.infer<typeof crashGameSchema>;
export type CoinFlipGame = z.infer<typeof coinFlipGameSchema>;
export type LimboGame = z.infer<typeof limboGameSchema>;
export type DiceGame = z.infer<typeof diceGameSchema>;
export type MinesGame = z.infer<typeof minesGameSchema>;
export type RouletteGame = z.infer<typeof rouletteGameSchema>;
