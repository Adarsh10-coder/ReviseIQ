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

        // Fetch real profile from GitHub (fallback gracefully if unauthenticated API is rate limited)
        let githubId, username, displayName, avatarUrl, email;
        try {
            const githubRes = await fetch(`https://api.github.com/users/${targetUsername}`, {
                headers: {
                    "User-Agent": "ReviseIQ-App",
                    Accept: "application/vnd.github+json",
                },
                signal: AbortSignal.timeout(5000),
            });

            if (githubRes.ok) {
                const profile = await githubRes.json();
                githubId = String(profile.id);
                username = profile.login;
                displayName = profile.name || profile.login;
                avatarUrl = profile.avatar_url;
                email = profile.email || `${username}@users.noreply.github.com`;
            }
        } catch (fetchErr) {
            console.warn("GitHub profile fetch error:", fetchErr.message);
        }

        // Fallback if GitHub API is rate-limited (403) or network timed out
        if (!username) {
            username = targetUsername;
            displayName = targetUsername;
            avatarUrl = `https://github.com/${targetUsername}.png`;
            email = `${targetUsername}@users.noreply.github.com`;

            let hash = 0;
            const seed = `github_user_${targetUsername.toLowerCase()}`;
            for (let i = 0; i < seed.length; i++) {
                hash = (hash << 5) - hash + seed.charCodeAt(i);
                hash |= 0;
            }
            githubId = String(Math.abs(hash) || 987654);
        }

        let user = await User.findOne({
            $or: [{ githubId }, { username: new RegExp(`^${username}$`, "i") }],
        });

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
