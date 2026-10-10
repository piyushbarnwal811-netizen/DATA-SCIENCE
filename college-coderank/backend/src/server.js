import "dotenv/config";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { connectDatabase } from "./config/db.js";
import { seedAdmin } from "./controllers/adminController.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import realtimeRoutes from "./routes/realtimeRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import { startStatsScheduler } from "./utils/cronScheduler.js";

const app = express();
const port = Number(process.env.PORT) || 5000;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be set to a random string of at least 32 characters.");
}

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(morgan("dev"));

app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }), authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/realtime", realtimeRoutes);
app.use("/api/webhooks", webhookRoutes);
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use(notFound);
app.use(errorHandler);

await connectDatabase();
await seedAdmin();
startStatsScheduler();
app.listen(port, () => console.log(`College CodeRank API listening on port ${port}.`));