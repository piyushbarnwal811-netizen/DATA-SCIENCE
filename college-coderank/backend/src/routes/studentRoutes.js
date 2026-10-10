import { Router } from "express";
import {
  exportStudentExcel,
  getMyProfile,
  getStudentDetails,
  syncMyStats,
  syncStudentLeetCode,
  updateMyProfile
} from "../controllers/studentController.js";
import { registerStudent } from "../controllers/authController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// Student self-registration route aliases (unauthenticated)
router.post("/register", registerStudent);
router.post("/", registerStudent);

router.use(requireAuth);

router.get("/me", requireRole("student"), getMyProfile);
router.patch("/me", requireRole("student"), updateMyProfile);
router.post("/me/sync", requireRole("student"), syncMyStats);
router.get("/me/export", requireRole("student"), exportStudentExcel);

router.post("/:id/leetcode/sync", requireRole("admin"), syncStudentLeetCode);
router.post("/:id/sync", requireRole("admin"), syncStudentLeetCode);
router.get("/:id/export", exportStudentExcel);
router.get("/:id", requireRole("admin"), getStudentDetails);

export default router;