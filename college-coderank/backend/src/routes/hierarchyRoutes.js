import { Router } from "express";
import {
  getHierarchyTree,
  getHierarchyOverview,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getDirectorates,
  createDirectorate,
  getDepartments,
  createDepartment,
  getSections,
  createSection,
  updateSection,
  getClassrooms,
  createClassroom,
  assignClassroom,
  getAssignments,
  createAssignment,
  deleteAssignment,
  getAuditLogs,
  getReports
} from "../controllers/hierarchyController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// All hierarchy routes require active staff authentication
router.use(requireAuth);

// 1. Interactive Hierarchy Tree (scoped dynamically in controller for each role)
router.get("/tree", getHierarchyTree);

// 2. High-level metric overview and status alerts
router.get("/overview", getHierarchyOverview);

// 3. Department-wise breakdown & vacancy reports
router.get("/reports", requireRole("super_admin", "admin", "tpo", "director", "hod"), getReports);

// 4. Audit trail of institutional modifications (Super Admin exclusive)
router.get("/audit-logs", requireRole("super_admin", "admin"), getAuditLogs);

// 5. User & Role Management
router.get("/users", requireRole("super_admin", "admin", "tpo", "director", "hod"), getUsers);
router.post("/users", requireRole("super_admin", "admin"), createUser);
router.put("/users/:id", requireRole("super_admin", "admin", "director", "hod"), updateUser);
router.delete("/users/:id", requireRole("super_admin", "admin"), deleteUser);

// 6. Directorates / Institutes
router.get("/directorates", getDirectorates);
router.post("/directorates", requireRole("super_admin", "admin"), createDirectorate);

// 7. Departments
router.get("/departments", getDepartments);
router.post("/departments", requireRole("super_admin", "admin", "director"), createDepartment);

// 8. Sections & Classes
router.get("/sections", getSections);
router.post("/sections", requireRole("super_admin", "admin", "director", "hod"), createSection);
router.put("/sections/:id", requireRole("super_admin", "admin", "director", "hod"), updateSection);

// 9. Classrooms & Laboratories
router.get("/classrooms", getClassrooms);
router.post("/classrooms", requireRole("super_admin", "admin", "director", "hod"), createClassroom);
router.post("/classrooms/assign", requireRole("super_admin", "admin", "director", "hod"), assignClassroom);

// 10. Timetable & Classroom Slot Allocations (legacy compatibility)
router.get("/assignments", getAssignments);
router.post("/assignments", requireRole("super_admin", "admin", "director", "hod"), createAssignment);
router.delete("/assignments/:id", requireRole("super_admin", "admin", "director", "hod"), deleteAssignment);

export default router;

