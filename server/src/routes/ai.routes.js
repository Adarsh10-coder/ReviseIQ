import { Router } from "express";
import {
  handleCodeReview,
  handlePrReview,
  handleGenerate,
  handleExplain,
  handleFix,
} from "../controllers/ai.controller.js";
import { getDashboardData } from "../controllers/dashboard.controller.js";
import { optionalAuth } from "../middleware/auth.middleware.js";

const router = Router();

// Real GitHub data for dashboard
router.get("/dashboard-data", optionalAuth, getDashboardData);

// Code Review Routes
router.post("/review", handleCodeReview);
router.post("/review-pr", handlePrReview);

// General Gemini LLM Routes
router.post("/generate", handleGenerate);
router.post("/explain", handleExplain);
router.post("/fix", handleFix);

export default router;
