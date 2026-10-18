import express from "express";
import { getUserRepos, selectRepo } from "../controllers/repo.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get list of repositories for the logged-in user
router.get("/", requireAuth, getUserRepos);

// Select repository to monitor
router.post("/select", requireAuth, selectRepo);

export default router;
