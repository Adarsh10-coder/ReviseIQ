import express from "express";
import {
  handleGithubAuth,
  handleGithubCallback,
  connectRealUser,
  connectWithToken,
  getMe,
  logout,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

// Step 1: Initiate GitHub OAuth handshake
router.get("/github", handleGithubAuth);

// Step 2: GitHub redirects back with authorization code
router.get("/github/callback", handleGithubCallback);

// Connect real GitHub user
router.get("/connect-real-user", connectRealUser);

// Connect with Token or custom username
router.post("/connect-token", connectWithToken);

// Current authenticated user
router.get("/me", requireAuth, getMe);

// Logout
router.post("/logout", logout);

export default router;
