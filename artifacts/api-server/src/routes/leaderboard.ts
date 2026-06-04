import { Router } from "express";
import { db, globalLeaderboard } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/leaderboard", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(globalLeaderboard)
      .orderBy(desc(globalLeaderboard.score))
      .limit(20);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

router.post("/leaderboard", async (req, res) => {
  try {
    const { playerName, score, category, difficulty, xp } = req.body;
    if (!playerName || typeof score !== "number" || !category || !difficulty) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const name = String(playerName).slice(0, 30).trim();
    if (!name) return res.status(400).json({ error: "Invalid player name" });

    const [entry] = await db
      .insert(globalLeaderboard)
      .values({ playerName: name, score, category, difficulty, xp: xp ?? 0 })
      .returning();
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: "Failed to save score" });
  }
});

export default router;
