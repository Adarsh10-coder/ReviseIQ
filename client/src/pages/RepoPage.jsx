import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

function StarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 fill-current">
      <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3 fill-current">
      <path d="M4 4a4 4 0 0 1 8 0v2h.25c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25v-5.5C2 6.784 2.784 6 3.75 6H4Zm1.5 2h5V4a2.5 2.5 0 0 0-5 0Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3.5 8.5 3 3 6-7" />
    </svg>
  );
}

export default function RepoPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("cards"); // "cards" | "markdown"

  // Fetch repositories from backend
  useEffect(() => {
    async function loadRepos() {
      try {
        setLoading(true);
        const res = await api.get("/api/repos");
        if (res.data && res.data.success) {
          setRepos(res.data.repos);
          if (res.data.repos.length > 0) {
            setSelectedRepo(res.data.repos[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load repositories:", err);
        setError("Unable to connect to GitHub. Showing demo repositories.");
      } finally {
        setLoading(false);
      }
    }

    loadRepos();
  }, []);

  const filteredRepos = repos.filter((r) =>
    r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Generate Markdown representation containing all repositories
  const markdownContent = `# Available Repositories (${repos.length} found)
_Select a repository to initiate ReviseIQ AI code inspection._

| Repository | Visibility | Language | Stars | Branch | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
${repos
  .map(
    (r) =>
      `| **[${r.full_name}](${r.html_url})** | \`${r.private ? "Private" : "Public"}\` | ${r.language || "N/A"} | ⭐ ${r.stargazers_count} | \`${r.default_branch}\` | ${r.description.replace(/\|/g, "-")} |`
  )
  .join("\n")}
`;

  const handleStart = async () => {
    if (!selectedRepo) return;

    try {
      setSubmitting(true);
      try {
        localStorage.setItem("reviseiq_selected_repo", JSON.stringify(selectedRepo));
      } catch {}
      await api.post("/api/repos/select", {
        repoId: selectedRepo.id,
        fullName: selectedRepo.full_name,
        repoName: selectedRepo.name,
      });

      // Navigate to onboarding / dashboard
      setTimeout(() => {
        navigate("/onboarding", { state: { repo: selectedRepo } });
      }, 700);
    } catch (err) {
      console.error("Error selecting repository:", err);
      // Fallback transition
      navigate("/onboarding", { state: { repo: selectedRepo } });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#110f0e] text-[#f5efe9] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-white/8 bg-[#181412]/80 backdrop-blur-xl sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="relative inline-flex size-7 items-center justify-center rounded-lg bg-coral shadow-[0_0_14px_rgba(242,120,82,0.5)]">
            <span className="absolute h-[2px] w-2.5 translate-y-[-2px] -rotate-45 rounded bg-[#201512]" />
            <span className="absolute h-[2px] w-2.5 translate-y-[2px] -rotate-45 rounded bg-[#201512]" />
          </span>
          <span className="font-display font-extrabold text-lg tracking-tight text-white">ReviseIQ</span>
          <span className="text-white/20 text-sm">/</span>
          <span className="text-xs font-mono text-coral-light bg-coral/10 px-2.5 py-0.5 rounded-full border border-coral/20">
            Step 1: Onboarding
          </span>
        </div>

        {/* User Chip */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 pl-1 pr-3 py-1 text-xs">
              <img
                src={user.avatarUrl || "https://github.com/github.png"}
                alt={user.username}
                className="size-6 rounded-full object-cover border border-white/20"
              />
              <span className="font-semibold text-white">{user.username}</span>
            </div>
          )}
          <button
            onClick={() => {
              localStorage.removeItem("reviseiq_github_handle");
              logout();
            }}
            type="button"
            className="text-xs font-medium text-[#9c8e86] hover:text-white transition-colors cursor-pointer px-2.5 py-1 rounded-md hover:bg-white/5"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 flex flex-col">
        {/* Header Block */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-0.5 text-[10px] font-bold tracking-widest text-emerald-400 uppercase border border-emerald-500/20 mb-3 shadow-xs">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            GitHub Connected
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mb-2.5">
            choose repository
          </h1>

          <p className="text-sm text-[#b3a49c] max-w-lg mx-auto leading-relaxed">
            Select the GitHub repository you want ReviseIQ to monitor and review with automated multi-agent AST checks.
          </p>
        </div>

        {/* Search & View Toggle Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search repositories by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#1e1917] px-4 py-2.5 text-xs text-white placeholder-[#786b64] focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-xs text-muted hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#1a1513] p-1 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                viewMode === "cards" ? "bg-coral text-white shadow-xs" : "text-[#9a8d86] hover:text-white"
              }`}
            >
              Interactive Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode("markdown")}
              className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                viewMode === "markdown" ? "bg-coral text-white shadow-xs" : "text-[#9a8d86] hover:text-white"
              }`}
            >
              Markdown View
            </button>
          </div>
        </div>

        {/* Repositories Display Area */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-[#8e8179]">
            <span className="size-8 rounded-full border-2 border-coral/30 border-t-coral animate-spin mb-3" />
            <span className="text-xs font-mono">Fetching GitHub repositories...</span>
          </div>
        ) : viewMode === "markdown" ? (
          /* Markdown View Option */
          <div className="flex-1 rounded-2xl border border-white/10 bg-[#161211] p-5 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-white/8 pb-3 mb-3 text-xs text-[#8c7e77]">
              <span className="font-mono text-[11px] text-coral-light">repositories.md</span>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(markdownContent)}
                className="text-[11px] hover:text-white font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 cursor-pointer"
              >
                Copy Markdown
              </button>
            </div>
            <pre className="flex-1 overflow-x-auto text-[11px] sm:text-xs font-mono text-[#dcd2ca] leading-relaxed p-2">
              <code>{markdownContent}</code>
            </pre>
          </div>
        ) : (
          /* Interactive Cards View */
          <div className="space-y-2.5 mb-6 max-h-[460px] overflow-y-auto pr-1">
            {filteredRepos.length === 0 ? (
              <div className="text-center py-12 text-sm text-[#7e7169] rounded-xl border border-dashed border-white/10">
                No repositories match "{searchQuery}"
              </div>
            ) : (
              filteredRepos.map((repo) => {
                const isSelected = selectedRepo?.id === repo.id;
                return (
                  <div
                    key={repo.id}
                    onClick={() => setSelectedRepo(repo)}
                    className={`group relative rounded-xl border p-4 cursor-pointer transition-all duration-200 flex items-start gap-4 ${
                      isSelected
                        ? "border-coral bg-coral/[0.08] shadow-[0_0_24px_rgba(242,120,82,0.15)] ring-1 ring-coral/50"
                        : "border-white/8 bg-[#181311] hover:border-white/20 hover:bg-[#1e1816]"
                    }`}
                  >
                    {/* Radio / Selection Indicator */}
                    <div
                      className={`size-5 rounded-full border mt-0.5 grid place-items-center shrink-0 transition-colors ${
                        isSelected
                          ? "border-coral bg-coral text-white"
                          : "border-white/20 bg-transparent group-hover:border-white/40"
                      }`}
                    >
                      {isSelected && <CheckIcon />}
                    </div>

                    {/* Repository Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-white group-hover:text-coral-light transition-colors truncate">
                          {repo.full_name}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            repo.private
                              ? "border-amber-500/25 bg-amber-500/10 text-amber-300"
                              : "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                          }`}
                        >
                          {repo.private ? <LockIcon /> : null}
                          {repo.private ? "Private" : "Public"}
                        </span>

                        <span className="text-[10px] font-mono text-[#8c7f78] bg-white/5 px-2 py-0.5 rounded">
                          branch: {repo.default_branch}
                        </span>
                      </div>

                      <p className="text-xs text-[#a3948c] line-clamp-2 mb-2 leading-relaxed font-sans">
                        {repo.description}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-[#7d7069] font-mono">
                        {repo.language && (
                          <span className="flex items-center gap-1.5 text-[#d0c4bc]">
                            <span className="size-2 rounded-full bg-gold" />
                            {repo.language}
                          </span>
                        )}
                        <span className="flex items-center gap-1 hover:text-white">
                          <StarIcon /> {repo.stargazers_count}
                        </span>
                        <span>
                          Updated {new Date(repo.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Selected Repo Bar & Start Button */}
        <div className="mt-auto pt-6 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#a0928a]">
            {selectedRepo ? (
              <p className="m-0">
                Selected: <strong className="text-white font-mono">{selectedRepo.full_name}</strong>
              </p>
            ) : (
              <p className="m-0">Please pick a repository to start</p>
            )}
          </div>

          {/* Start Button */}
          <button
            type="button"
            onClick={handleStart}
            disabled={!selectedRepo || submitting}
            className="w-full sm:w-auto min-w-[200px] h-12 rounded-xl bg-coral hover:bg-coral-light active:bg-coral-dark text-[#201512] font-extrabold text-sm tracking-wide shadow-coral transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
          >
            {submitting ? (
              <>
                <span className="size-4 rounded-full border-2 border-[#201512]/30 border-t-[#201512] animate-spin" />
                <span>Initializing Agents...</span>
              </>
            ) : (
              <>
                <span>start</span>
                <span className="font-mono text-xs">→</span>
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
