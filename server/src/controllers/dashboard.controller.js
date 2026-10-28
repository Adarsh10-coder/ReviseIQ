import { decryptToken } from "../utils/encryption.js";
import User from "../models/User.js";

const GITHUB_API = "https://api.github.com";
const GITHUB_UA = "ReviseIQ-App";

/**
 * Builds GitHub API request headers.
 * Uses the user's OAuth token if available, otherwise unauthenticated.
 */
function githubHeaders(token) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": GITHUB_UA,
  };
  if (token && !token.startsWith("mock_") && !token.startsWith("pat_for_") && !token.startsWith("public_token_")) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Computes a human-readable relative time string from a date.
 */
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * GET /api/ai/dashboard-data?repo=owner/name
 *
 * Fetches REAL data from GitHub for the dashboard:
 * - Recent commits (activity feed)
 * - Open/closed pull requests
 * - Repository stats (stars, forks, open issues)
 * - A real source file from the repo for AI review
 */
export async function getDashboardData(req, res, next) {
  try {
    const repoFullName = req.query.repo;
    if (!repoFullName || !repoFullName.includes("/")) {
      return res.status(400).json({
        success: false,
        message: "Query parameter 'repo' is required (e.g. owner/repo).",
      });
    }

    const [owner, repoName] = repoFullName.split("/");

    // Get user's GitHub token for authenticated requests (higher rate limit)
    let token = null;
    if (req.user && req.user.encryptedGithubToken) {
      try {
        token = decryptToken(req.user.encryptedGithubToken);
      } catch {
        token = null;
      }
    }

    const headers = githubHeaders(token);
    const fetchOpts = { headers, signal: AbortSignal.timeout(8000) };

    // Parallel fetch: commits, PRs, repo info, and repo file tree
    const [commitsRes, prsRes, repoInfoRes, treeRes] = await Promise.allSettled([
      fetch(`${GITHUB_API}/repos/${owner}/${repoName}/commits?per_page=10`, fetchOpts),
      fetch(`${GITHUB_API}/repos/${owner}/${repoName}/pulls?state=all&per_page=10&sort=updated`, fetchOpts),
      fetch(`${GITHUB_API}/repos/${owner}/${repoName}`, fetchOpts),
      fetch(`${GITHUB_API}/repos/${owner}/${repoName}/git/trees/HEAD?recursive=1`, fetchOpts),
    ]);

    // --- Parse Commits → Live Activity Feed ---
    let activityFeed = [];
    if (commitsRes.status === "fulfilled" && commitsRes.value.ok) {
      const commits = await commitsRes.value.json();
      if (Array.isArray(commits)) {
        activityFeed = commits.slice(0, 8).map((c, i) => ({
          id: c.sha?.slice(0, 7) || `commit-${i}`,
          type: "commit",
          verdict: "COMMIT",
          title: c.commit?.message?.split("\n")[0] || "Untitled commit",
          author: c.commit?.author?.name || c.author?.login || owner,
          sha: c.sha?.slice(0, 7),
          time: timeAgo(c.commit?.author?.date || new Date().toISOString()),
          url: c.html_url,
          verdictClass: "text-sky-400",
        }));
      }
    }

    // --- Parse Pull Requests ---
    let pullRequests = [];
    if (prsRes.status === "fulfilled" && prsRes.value.ok) {
      const prs = await prsRes.value.json();
      if (Array.isArray(prs)) {
        pullRequests = prs.slice(0, 8).map((pr) => ({
          id: `pr-${pr.number}`,
          type: "pull_request",
          verdict: pr.merged_at
            ? "MERGED"
            : pr.state === "open"
            ? "OPEN"
            : "CLOSED",
          title: `PR #${pr.number}: ${pr.title}`,
          author: pr.user?.login || owner,
          time: timeAgo(pr.updated_at || pr.created_at),
          url: pr.html_url,
          verdictClass: pr.merged_at
            ? "text-violet-400"
            : pr.state === "open"
            ? "text-emerald-400"
            : "text-coral-light",
        }));
      }
    }

    // Merge PRs and commits into one feed, sorted newest first
    const combinedFeed = [...pullRequests, ...activityFeed]
      .slice(0, 10);

    // --- Parse Repo Info → Stats ---
    let repoStats = {
      stars: 0,
      forks: 0,
      openIssues: 0,
      language: "JavaScript",
      defaultBranch: "main",
      description: "",
    };
    if (repoInfoRes.status === "fulfilled" && repoInfoRes.value.ok) {
      const info = await repoInfoRes.value.json();
      repoStats = {
        stars: info.stargazers_count || 0,
        forks: info.forks_count || 0,
        openIssues: info.open_issues_count || 0,
        language: info.language || "JavaScript",
        defaultBranch: info.default_branch || "main",
        description: info.description || "",
      };
    }

    // --- Find a real source file to review ---
    let realSourceFile = null;
    if (treeRes.status === "fulfilled" && treeRes.value.ok) {
      const treeData = await treeRes.value.json();
      if (treeData.tree && Array.isArray(treeData.tree)) {
        // Prefer reviewable source files: .js, .ts, .jsx, .tsx, .py, .go, .rs, .java
        const codeExtensions = /\.(js|ts|jsx|tsx|py|go|rs|java|rb|php|c|cpp|cs)$/i;
        // Skip node_modules, dist, build, lock files, config files
        const skipPatterns = /(node_modules|dist|build|\.config\.|\.lock|\.min\.|package-lock|yarn\.lock|\.d\.ts)/i;

        const codeFiles = treeData.tree.filter(
          (f) =>
            f.type === "blob" &&
            codeExtensions.test(f.path) &&
            !skipPatterns.test(f.path) &&
            (f.size || 0) > 50 &&
            (f.size || 0) < 15000
        );

        if (codeFiles.length > 0) {
          // Pick the most interesting file: prefer src/ files, controllers, services, utils
          const prioritized = codeFiles.sort((a, b) => {
            const scoreFile = (f) => {
              let s = 0;
              if (/src\//i.test(f.path)) s += 3;
              if (/(controller|service|handler|middleware|util|helper|api|route)/i.test(f.path)) s += 5;
              if (/(index|main|app|server)\./i.test(f.path)) s += 2;
              if (f.size > 200) s += 1;
              return s;
            };
            return scoreFile(b) - scoreFile(a);
          });

          const chosen = prioritized[0];

          // Fetch the raw file content
          try {
            const fileRes = await fetch(
              `${GITHUB_API}/repos/${owner}/${repoName}/contents/${chosen.path}`,
              {
                headers: { ...headers, Accept: "application/vnd.github.raw+json" },
                signal: AbortSignal.timeout(6000),
              }
            );
            if (fileRes.ok) {
              const content = await fileRes.text();
              // Detect language from extension
              const ext = chosen.path.split(".").pop().toLowerCase();
              const langMap = {
                js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
                py: "python", go: "go", rs: "rust", java: "java", rb: "ruby",
                php: "php", c: "c", cpp: "cpp", cs: "csharp",
              };

              realSourceFile = {
                path: chosen.path,
                language: langMap[ext] || ext,
                content: content.slice(0, 8000), // Cap at 8KB for API safety
                size: chosen.size,
              };
            }
          } catch (fileErr) {
            console.warn("Failed to fetch file content:", fileErr.message);
          }
        }
      }
    }

    // --- Build stats summary ---
    const dashboardStats = {
      totalCommits: activityFeed.length,
      totalPRs: pullRequests.length,
      openPRs: pullRequests.filter((pr) => pr.verdict === "OPEN").length,
      mergedPRs: pullRequests.filter((pr) => pr.verdict === "MERGED").length,
      stars: repoStats.stars,
      forks: repoStats.forks,
      openIssues: repoStats.openIssues,
      language: repoStats.language,
    };

    return res.json({
      success: true,
      repo: repoFullName,
      stats: dashboardStats,
      activityFeed: combinedFeed,
      repoInfo: repoStats,
      realSourceFile,
    });
  } catch (error) {
    next(error);
  }
}
