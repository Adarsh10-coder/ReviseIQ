import passport from "passport";
import { signToken } from "../utils/jwt.js";
import User from "../models/User.js";
import { encryptToken } from "../utils/encryption.js";

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

export function handleGithubAuth(req, res, next) {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    // If GitHub OAuth credentials are not provided yet in server/.env, redirect to dev-login bypass
    return res.redirect("/auth/dev-login");
  }
  return passport.authenticate("github", {
    scope: ["user:email", "repo"],
    session: false,
  })(req, res, next);
}

export function handleGithubCallback(req, res, next) {
  passport.authenticate("github", { session: false }, async (err, user, info) => {
    if (err || !user) {
      console.error("GitHub Auth Error:", err || info);
      return res.redirect(`${CLIENT_URL}/?error=auth_failed`);
    }

    try {
      // Issue custom JWT to React frontend via Secure, HTTP-only cookie
      const token = signToken({
        id: user._id,
        githubId: user.githubId,
        username: user.username,
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Redirect directly to the Repositories selection page
      return res.redirect(`${CLIENT_URL}/repos`);
    } catch (tokenErr) {
      console.error("JWT Issue Error:", tokenErr);
      return res.redirect(`${CLIENT_URL}/?error=token_error`);
    }
  })(req, res, next);
}

/**
 * Developer Sandbox Login Bypass
 * Allows testing the full flow and RepoPage even before GitHub OAuth app credentials are created in .env
 */
export async function handleDevLogin(req, res) {
  try {
    const devGithubId = "99999999";
    let user = await User.findOne({ githubId: devGithubId });

    if (!user) {
      user = await User.create({
        githubId: devGithubId,
        username: "developer-preview",
        displayName: "ReviseIQ Engineer",
        email: "engineer@reviseiq.dev",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80",
        encryptedGithubToken: encryptToken("mock_github_access_token_for_preview"),
      });
    }

    const token = signToken({
      id: user._id,
      githubId: user.githubId,
      username: user.username,
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.redirect(`${CLIENT_URL}/repos`);
  } catch (error) {
    console.error("Dev Login Error:", error);
    return res.redirect(`${CLIENT_URL}/?error=dev_login_failed`);
  }
}

export async function getMe(req, res) {
  if (!req.user) {
    return res.status(401).json({ success: false, user: null });
  }

  return res.json({
    success: true,
    user: {
      id: req.user._id,
      githubId: req.user.githubId,
      username: req.user.username,
      displayName: req.user.displayName,
      email: req.user.email,
      avatarUrl: req.user.avatarUrl,
      selectedRepo: req.user.selectedRepo,
      createdAt: req.user.createdAt,
    },
  });
}

export function logout(req, res) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return res.json({
    success: true,
    message: "Logged out successfully",
  });
}
