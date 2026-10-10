import { Router } from "express";
import { handleGitHubWebhook, handleInstantPlatformPing } from "../controllers/webhookController.js";

const router = Router();

// GitHub Webhook POST
router.post("/github", handleGitHubWebhook);

// Instant platform sync ping (supports GET and POST for easy automation & webhook integration)
router.post("/ping", handleInstantPlatformPing);
router.get("/ping", handleInstantPlatformPing);

export default router;
