import { Router } from "express";
import {
  getSuperAdminOverview,
  getTpos,
  createTpo,
  getDirectors,
  createDirector,
  deleteDirector,
  getAccounts,
  updateAccountStatus,
  resetAccountPassword,
  updateAccount,
  deleteAccount,
  getDirectorates,
  createDirectorate,
  updateDirectorate,
  deleteDirectorate,
  getTpoOverview,
  getDirectorOverview,
  createDirectorHod,
  getHodOverview,
  createHodTeacher,
  assignHodTeacher,
  getTeacherSchedule,
  getHierarchyTree,
  getDepartments,
  createDepartment,
  deleteDepartment,
  getSections,
  createSection,
  updateSection,
  getSubjects,
  createSubject,
  getAuditLogs,
  getUsers,
  createUser,
  updateUser,
  deleteUser
} from "../controllers/hierarchyController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// All hierarchy routes require active authentication
router.use(requireAuth);

// ---------------------------------------------------------
// 1. Super Admin Endpoints
// ---------------------------------------------------------
router.get("/super-admin/overview", requireRole("super_admin"), getSuperAdminOverview);
router.get("/tpos", requireRole("super_admin", "tpo"), getTpos);
router.post("/tpos", requireRole("super_admin"), createTpo);
router.get("/directors", requireRole("super_admin", "tpo", "director"), getDirectors);
router.post("/directors", requireRole("super_admin", "tpo"), createDirector);
router.delete("/directors/:id", requireRole("super_admin", "tpo"), deleteDirector);
router.get("/accounts", requireRole("super_admin"), getAccounts);
router.patch("/accounts/:id/status", requireRole("super_admin"), updateAccountStatus);
router.post("/accounts/:id/reset-password", requireRole("super_admin"), resetAccountPassword);
router.put("/accounts/:id", requireRole("super_admin"), updateAccount);
router.delete("/accounts/:id", requireRole("super_admin"), deleteAccount);
router.get("/audit-logs", requireRole("super_admin"), getAuditLogs);

// Universal User Management
router.get("/users", requireRole("super_admin", "tpo", "director", "hod"), getUsers);
router.post("/users", requireRole("super_admin"), createUser);
router.put("/users/:id", requireRole("super_admin"), updateUser);
router.delete("/users/:id", requireRole("super_admin"), deleteUser);

// Directorates Management
router.get("/directorates", getDirectorates);
router.post("/directorates", requireRole("super_admin", "tpo"), createDirectorate);
router.put("/directorates/:id", requireRole("super_admin", "tpo"), updateDirectorate);
router.delete("/directorates/:id", requireRole("super_admin", "tpo"), deleteDirectorate);

// ---------------------------------------------------------
// 2. TPO Endpoints
// ---------------------------------------------------------
router.get("/tpo/overview", requireRole("super_admin", "tpo"), getTpoOverview);

// ---------------------------------------------------------
// 3. Director Endpoints
// ---------------------------------------------------------
router.get("/director/overview", requireRole("super_admin", "director"), getDirectorOverview);
router.post("/director/hods", requireRole("super_admin", "director"), createDirectorHod);

// ---------------------------------------------------------
// 4. HOD Endpoints
// ---------------------------------------------------------
router.get("/hod/overview", requireRole("super_admin", "director", "hod"), getHodOverview);
router.post("/hod/teachers", requireRole("super_admin", "director", "hod"), createHodTeacher);
router.post("/hod/assign-teacher", requireRole("super_admin", "director", "hod"), assignHodTeacher);

// ---------------------------------------------------------
// 5. Teacher Endpoints
// ---------------------------------------------------------
router.get("/teacher/my-schedule", requireRole("super_admin", "teacher"), getTeacherSchedule);

// ---------------------------------------------------------
// 6. Shared Organizational Entities & Tree Inspection
// ---------------------------------------------------------
router.get("/departments", getDepartments);
router.post("/departments", requireRole("super_admin", "director"), createDepartment);
router.delete("/departments/:id", requireRole("super_admin", "director"), deleteDepartment);

router.get("/sections", getSections);
router.post("/sections", requireRole("super_admin", "director", "hod"), createSection);
router.put("/sections/:id", requireRole("super_admin", "director", "hod"), updateSection);

router.get("/subjects", getSubjects);
router.post("/subjects", requireRole("super_admin", "director", "hod"), createSubject);

router.get("/tree", getHierarchyTree);

// Smart Unified Hierarchy Overview (Scoped by logged-in role)
router.get("/overview", (req, res, next) => {
  const role = req.user?.role;
  if (role === "director") return getDirectorOverview(req, res, next);
  if (role === "hod") return getHodOverview(req, res, next);
  if (role === "tpo") return getTpoOverview(req, res, next);
  if (role === "teacher") return getTeacherSchedule(req, res, next);
  return getSuperAdminOverview(req, res, next);
});

export default router;
