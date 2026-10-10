import { Router } from "express";
import { exportLeaderboard, getLeaderboard } from "../controllers/leaderboardController.js";

const router = Router();
router.get("/", getLeaderboard);
router.get("/export", exportLeaderboard);

export default router;