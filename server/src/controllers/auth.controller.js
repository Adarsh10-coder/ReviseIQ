import passport from "passport";
import { signToken } from "../utils/jwt.js";
import User from "../models/User.js";
import { encryptToken } from "../utils/encryption.js";

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

export function handleGithubAuth(req, res, next) {
  // If GitHub OAuth App credentials are configured, initiate real GitHub OAuth
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    return passport.authenticate("github", {
      scope: ["user:email", "repo"],
      session: false,
    })(req, res, next);
  }

  const username = req.query.username?.trim();
  if (username) {
    return res.redirect(`/auth/connect-real-user?username=${encodeURIComponent(username)}`);
  }

  return res.redirect(`${CLIENT_URL}/?modal=open`);
}

export function handleGithubCallback(req, res, next) {
  passport.authenticate("github", { session: false }, async (err, user, info) => {
    if (err || !user) {
      console.error("GitHub Auth Error:", err || info);
      return res.redirect(`${CLIENT_URL}/?error=auth_failed`);
    }

    try {
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
    } catch (tokenErr) {
      console.error("JWT Issue Error:", tokenErr);
      return res.redirect(`${CLIENT_URL}/?error=token_error`);
    }
  })(req, res, next);
}

/**
 * Connects the real GitHub user without hardcoded default
 */
export async function connectRealUser(req, res) {
  try {
    const targetUsername = req.query.username?.trim();

    if (!targetUsername) {
      return res.redirect(`${CLIENT_URL}/?modal=open`);
    }

    // Fetch real profile from GitHub
    const githubRes = await fetch(`https://api.github.com/users/${targetUsername}`, {
      headers: {
        "User-Agent": "ReviseIQ-App",
        Accept: "application/vnd.github+json",
      },
    });

    if (!githubRes.ok) {
      throw new Error(`Failed to fetch GitHub profile for ${targetUsername}`);
    }

    const profile = await githubRes.json();

    const githubId = String(profile.id);
    const username = profile.login;
    const displayName = profile.name || profile.login;
    const avatarUrl = profile.avatar_url;
    const email = profile.email || `${username}@users.noreply.github.com`;

    let user = await User.findOne({ githubId });

    if (!user) {
      user = await User.create({
        githubId,
        username,
        displayName,
        email,
        avatarUrl,
        encryptedGithubToken: encryptToken(`pat_for_${username}`),
      });
    } else {
      user.username = username;
      user.displayName = displayName;
      user.avatarUrl = avatarUrl;
      await user.save();
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
    console.error("Connect Real User Error:", error);
    return res.redirect(`${CLIENT_URL}/?error=github_connect_failed`);
  }
}

/**
 * Connect with a Personal Access Token (for reading private repos)
 */
export async function connectWithToken(req, res) {
  try {
    const { token: githubToken, username: customUser } = req.body;

    if (!githubToken && !customUser) {
      return res.status(400).json({ success: false, message: "GitHub token or username required" });
    }

    let profileUrl = "https://api.github.com/user";
    const headers = {
      "User-Agent": "ReviseIQ-App",
      Accept: "application/vnd.github+json",
    };

    if (githubToken) {
      headers.Authorization = `Bearer ${githubToken}`;
    } else {
      profileUrl = `https://api.github.com/users/${customUser}`;
    }

    const githubRes = await fetch(profileUrl, { headers });
    if (!githubRes.ok) {
      return res.status(400).json({ success: false, message: "Invalid GitHub token or user not found" });
    }

    const profile = await githubRes.json();
    const githubId = String(profile.id);
    const username = profile.login;
    const displayName = profile.name || profile.login;
    const avatarUrl = profile.avatar_url;
    const email = profile.email || `${username}@users.noreply.github.com`;

    let user = await User.findOne({ githubId });
    if (!user) {
      user = await User.create({
        githubId,
        username,
        displayName,
        email,
        avatarUrl,
        encryptedGithubToken: encryptToken(githubToken || `public_token_${username}`),
      });
    } else {
      user.username = username;
      user.displayName = displayName;
      user.avatarUrl = avatarUrl;
      user.encryptedGithubToken = encryptToken(githubToken || `public_token_${username}`);
      await user.save();
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

    return res.json({
      success: true,
      user: {
        id: user._id,
        githubId: user.githubId,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Connect with token error:", error);
    return res.status(500).json({ success: false, message: "Authentication failed" });
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
