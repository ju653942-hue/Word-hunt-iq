import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const globalLeaderboard = pgTable("global_leaderboard", {
  id: serial("id").primaryKey(),
  playerName: text("player_name").notNull(),
  score: integer("score").notNull(),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
  xp: integer("xp").notNull().default(0),
  playedAt: timestamp("played_at").defaultNow(),
});

export type GlobalLeaderboardEntry = typeof globalLeaderboard.$inferSelect;
export type InsertLeaderboardEntry = typeof globalLeaderboard.$inferInsert;
