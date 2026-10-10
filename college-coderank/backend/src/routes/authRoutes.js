import { Router } from "express";
import { getCurrentUser, login, registerStudent } from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", registerStudent);
router.post("/signup", registerStudent);
router.post("/login", login);
router.post("/signin", login);
router.get("/me", requireAuth, getCurrentUser);

export default router;