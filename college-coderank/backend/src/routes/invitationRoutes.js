import { Router } from "express";
import {
  createInvitation,
  getInvitations,
  resendInvitation,
  revokeInvitation,
  verifyInvitationToken,
  acceptInvitation
} from "../controllers/invitationController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// =========================================================
// 1. PUBLIC INVITATION ENDPOINTS (Account Setup)
// =========================================================
router.get("/verify", verifyInvitationToken);
router.post("/accept", acceptInvitation);

// =========================================================
// 2. AUTHENTICATED HIERARCHICAL MANAGEMENT ENDPOINTS
// =========================================================
router.use(requireAuth);

router.post("/", requireRole("super_admin", "director", "hod"), createInvitation);
router.get("/", requireRole("super_admin", "director", "hod"), getInvitations);
router.post("/:id/resend", requireRole("super_admin", "director", "hod"), resendInvitation);
router.delete("/:id", requireRole("super_admin", "director", "hod"), revokeInvitation);
router.post("/:id/revoke", requireRole("super_admin", "director", "hod"), revokeInvitation);

export default router;
