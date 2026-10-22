import { Router } from "express";
import {
  addDepartmentSection,
  createStudent,
  deleteStudent,
  exportAllStudents,
  getAdminOverview,
  getDepartments,
  importStudents,
  removeDepartmentSection,
  syncAllStudents
} from "../controllers/adminController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = Router();
router.use(requireAuth, requireRole("admin"));

router.get("/overview", getAdminOverview);
router.get("/departments", getDepartments);
router.post("/departments", addDepartmentSection);
router.delete("/departments/:branch/sections/:section", removeDepartmentSection);
router.post("/students", createStudent);
router.delete("/students/:id", deleteStudent);
router.post("/students/import", upload.single("file"), importStudents);
router.get("/students/export", exportAllStudents);
router.post("/students/sync-all", syncAllStudents);

export default router;