import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/User.js";
import { encryptToken } from "../utils/encryption.js";

export function configurePassport() {
  const clientID = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const callbackURL = process.env.GITHUB_CALLBACK_URL || "https://reviseiq.onrender.com/auth/github/callback";

  if (!clientID || !clientSecret) {
    console.warn("⚠️ GitHub OAuth credentials not configured in server/.env (GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET)");
    return;
  }

  passport.use(
    new GitHubStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        scope: ["user:email", "repo"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email =
            profile.emails && profile.emails[0]
              ? profile.emails[0].value
              : `${profile.username}@users.noreply.github.com`;

          const avatarUrl =
            profile.photos && profile.photos[0]
              ? profile.photos[0].value
              : `https://github.com/${profile.username}.png`;

          // Security Flex: Encrypt the GitHub access token with AES-256 before storing
          const encryptedGithubToken = encryptToken(accessToken);

          let user = await User.findOne({ githubId: profile.id });

          if (user) {
            user.username = profile.username;
            user.displayName = profile.displayName || profile.username;
            user.email = email;
            user.avatarUrl = avatarUrl;
            user.encryptedGithubToken = encryptedGithubToken;
            await user.save();
          } else {
            user = await User.create({
              githubId: profile.id,
              username: profile.username,
              displayName: profile.displayName || profile.username,
              email,
              avatarUrl,
              encryptedGithubToken,
            });
          }

          return done(null, user);
        } catch (error) {
          console.error("Passport GitHub Strategy error:", error);
          return done(error, null);
        }
      }
    )
  );
}
