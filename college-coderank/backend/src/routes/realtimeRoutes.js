import { Router } from "express";
import { addRealtimeClient } from "../utils/realtime.js";

const router = Router();

router.get("/events", (req, res) => {
  addRealtimeClient(req, res);
});

export default router;
