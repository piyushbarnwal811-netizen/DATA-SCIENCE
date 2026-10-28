// Ensure unhandled errors do not crash the node process unexpectedly
process.on("unhandledRejection", (reason) => {
  console.error("[Server] Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[Server] Uncaught Exception:", error);
});

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
import hierarchyRoutes from "./routes/hierarchyRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import realtimeRoutes from "./routes/realtimeRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import invitationRoutes from "./routes/invitationRoutes.js";
import { startStatsScheduler } from "./utils/cronScheduler.js";

const app = express();
const port = Number(process.env.PORT) || 5000;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be set to a random string of at least 32 characters.");
}

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://data-science-rho-ten.vercel.app",
  process.env.CLIENT_URL
].filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.startsWith("http://localhost:") ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Dev-friendly fallback
    },
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(morgan("dev"));

app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 60 }), authRoutes);
app.use("/api/hierarchy", hierarchyRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/realtime", realtimeRoutes);
app.use("/api/webhooks", webhookRoutes);
app.get("/", (req, res) => {
  res.json({
    name: "College CodeRank API",
    status: "online",
    message: "Server is running properly",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      invitations: "/api/invitations",
      students: "/api/students",
      leaderboard: "/api/leaderboard",
      hierarchy: "/api/hierarchy"
    }
  });
});
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use(notFound);
app.use(errorHandler);

try {
  await connectDatabase();
  await seedAdmin();
  startStatsScheduler();
} catch (startupErr) {
  console.error("[Server] Critical startup error:", startupErr.message);
}

const server = app.listen(port, () => {
  console.log(`🚀 College CodeRank API running stably on http://localhost:${port}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`[Server] Port ${port} is already in use by another process. Please free port ${port}.`);
  } else {
    console.error("[Server] HTTP server error:", err);
  }
});

export default server;