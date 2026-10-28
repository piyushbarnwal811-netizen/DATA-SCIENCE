import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  forceChangePassword,
  forgotPassword,
  getCurrentUser,
  login,
  registerStudent,
  resetPassword,
  updateCurrentUserProfile,
  verifyResetToken
} from "../controllers/authController.js";
import {
  requireAuth,
  requirePasswordChangePendingAuth
} from "../middleware/authMiddleware.js";

const router = Router();

/**
 * Strict Rate Limiter for Forgot Password Endpoint
 * Exactly max 3 reset requests per IP/target per hour to prevent SMTP abuse.
 */
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const rawTarget = String(
      req.body?.email || req.body?.roll_number || req.body?.studentId || ""
    ).trim().toLowerCase();
    const clientIp = req.ip || req.headers["x-forwarded-for"] || "ip";
    return `${clientIp}_${rawTarget}`;
  },
  message: {
    message: "Too many password reset requests from this account or IP. Please try again after 1 hour."
  }
});

// Standard Authentication
router.post("/register", registerStudent);
router.post("/signup", registerStudent);
router.post("/login", login);
router.post("/signin", login);
router.get("/me", requireAuth, getCurrentUser);
router.patch("/me", requireAuth, updateCurrentUserProfile);

// Workflow 1: First-Time Mandatory Password Change
router.post("/force-change-password", requirePasswordChangePendingAuth, forceChangePassword);

// Workflow 2: Self-Service Forgot / Reset Password flow via email verification
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/verify-reset-token", verifyResetToken);

export default router;