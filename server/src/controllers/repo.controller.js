import { decryptToken } from "../utils/encryption.js";
import RepoConfig from "../models/RepoConfig.js";
import User from "../models/User.js";

const DEMO_REPOSITORIES = [
  {
    id: 101,
    name: "ReviseIQ",
    full_name: "ar208/ReviseIQ",
    private: false,
    description: "AI-powered automated pull request reviewer with AST static analysis and real-time socket events.",
    stargazers_count: 34,
    forks_count: 5,
    language: "JavaScript",
    default_branch: "main",
    updated_at: new Date().toISOString(),
    html_url: "https://github.com/ar208/ReviseIQ",
  },
  {
    id: 102,
    name: "payment-gateway-microservice",
    full_name: "acme-corp/payment-gateway-microservice",
    private: true,
    description: "High-throughput PCI-DSS compliant credit card and Stripe webhook processing pipeline.",
    stargazers_count: 12,
    forks_count: 2,
    language: "TypeScript",
    default_branch: "main",
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    html_url: "https://github.com/acme-corp/payment-gateway-microservice",
  },
  {
    id: 103,
    name: "cloud-infrastructure-terraform",
    full_name: "acme-corp/cloud-infrastructure-terraform",
    private: true,
    description: "AWS multi-region EKS clusters, VPC peering, and CloudFront distribution configurations.",
    stargazers_count: 8,
    forks_count: 1,
    language: "HCL",
    default_branch: "main",
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    html_url: "https://github.com/acme-corp/cloud-infrastructure-terraform",
  },
  {
    id: 104,
    name: "auth-session-manager",
    full_name: "ar208/auth-session-manager",
    private: false,
    description: "Distributed Redis session store with JWT refresh rotation and OAuth 2.0 PKCE flow.",
    stargazers_count: 89,
    forks_count: 16,
    language: "Go",
    default_branch: "master",
    updated_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    html_url: "https://github.com/ar208/auth-session-manager",
  },
  {
    id: 105,
    name: "client-dashboard-v2",
    full_name: "acme-corp/client-dashboard-v2",
    private: false,
    description: "Next.js 15 enterprise control center with TanStack Query and Tailwind CSS v4.",
    stargazers_count: 42,
    forks_count: 7,
    language: "TypeScript",
    default_branch: "main",
    updated_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    html_url: "https://github.com/acme-corp/client-dashboard-v2",
  },
];

export async function getUserRepos(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decryptedToken = decryptToken(user.encryptedGithubToken);

    // If real GitHub token is present, query GitHub API for user repos
    if (decryptedToken && !decryptedToken.startsWith("mock_") && !decryptedToken.startsWith("pat_for_") && !decryptedToken.startsWith("public_token_")) {
      try {
        const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator", {
          headers: {
            Authorization: `Bearer ${decryptedToken}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "ReviseIQ-App",
          },
          signal: AbortSignal.timeout(7000),
        });

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const repos = data.map((r) => ({
              id: r.id,
              name: r.name,
              full_name: r.full_name,
              private: r.private,
              description: r.description || "No description provided",
              stargazers_count: r.stargazers_count || 0,
              forks_count: r.forks_count || 0,
              language: r.language || "Plain Text",
              default_branch: r.default_branch || "main",
              updated_at: r.updated_at,
              html_url: r.html_url,
            }));

            return res.json({
              success: true,
              repos,
              isMock: false,
            });
          }
        }
      } catch (githubErr) {
        console.warn("GitHub OAuth API fetch warning:", githubErr.message);
      }
    }

    // Fetch user's real public & profile repositories from GitHub directly by username
    try {
      const publicResponse = await fetch(`https://api.github.com/users/${user.username}/repos?sort=updated&per_page=100`, {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "ReviseIQ-App",
        },
        signal: AbortSignal.timeout(7000),
      });

      if (publicResponse.ok) {
        const data = await publicResponse.json();
        if (Array.isArray(data) && data.length > 0) {
          const repos = data.map((r) => ({
            id: r.id,
            name: r.name,
            full_name: r.full_name,
            private: r.private,
            description: r.description || "No description provided",
            stargazers_count: r.stargazers_count || 0,
            forks_count: r.forks_count || 0,
            language: r.language || "Plain Text",
            default_branch: r.default_branch || "main",
            updated_at: r.updated_at,
            html_url: r.html_url,
          }));

          return res.json({
            success: true,
            repos,
            isMock: false,
          });
        }
      }
    } catch (pubErr) {
      console.warn("GitHub public repos fetch failed:", pubErr.message);
    }

    // Fallback demo repositories for dev preview
    return res.json({
      success: true,
      repos: DEMO_REPOSITORIES,
      isMock: true,
    });
  } catch (error) {
    console.error("getUserRepos error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch repositories",
      repos: DEMO_REPOSITORIES,
    });
  }
}

export async function selectRepo(req, res) {
  try {
    const { repoId, fullName, repoName } = req.body;

    if (!fullName) {
      return res.status(400).json({ success: false, message: "Repository fullName is required" });
    }

    // Update user's active selected repo
    await User.findByIdAndUpdate(req.user._id, {
      selectedRepo: fullName,
    });

    // Create or update RepoConfig
    const config = await RepoConfig.findOneAndUpdate(
      { ownerId: req.user._id, fullName },
      {
        githubRepoId: String(repoId || Date.now()),
        ownerId: req.user._id,
        repoName: repoName || fullName.split("/")[1] || fullName,
        fullName,
        isActive: true,
      },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      message: `Repository ${fullName} configured successfully`,
      selectedRepo: fullName,
      config,
    });
  } catch (error) {
    console.error("selectRepo error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to select repository",
    });
  }
}
