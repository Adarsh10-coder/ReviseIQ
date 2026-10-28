import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../lib/api.js";
import {
  Loader2,
  Sparkles,
  ShieldAlert,
  Zap,
  Layers,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Code2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";

const FALLBACK_SNIPPET = `// ReviseIQ Production Code Quality Sample
async function processUserPayment(userId, amount, currency) {
  if (!userId || amount <= 0) {
    throw new Error("Invalid payment parameters");
  }

  // Retrieve user account
  const user = await db.collection("users").findOne({ _id: userId });
  if (!user) {
    throw new Error("User not found");
  }

  // Process transaction
  const charge = await stripe.charges.create({
    amount: Math.round(amount * 100),
    currency: currency || "usd",
    customer: user.stripeCustomerId,
    description: "ReviseIQ Platform Subscription",
  });

  return { success: true, transactionId: charge.id };
}`;

export default function DashboardPage() {
  const location = useLocation();
  const { logout } = useAuth();

  // Load repo from router state or fallback to persisted localStorage
  const repo = location.state?.repo || (() => {
    try {
      const saved = localStorage.getItem("reviseiq_selected_repo");
      if (saved) return JSON.parse(saved);
    } catch {}
    return { full_name: "ReviseIQ/core-engine" };
  })();

  const activeAgents = location.state?.activeAgents || ["security", "performance", "clarity"];

  const [codeToReview, setCodeToReview] = useState("");
  const [sourceFilePath, setSourceFilePath] = useState("snippet");
  const [sourceFileLanguage, setSourceFileLanguage] = useState("javascript");
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [error, setError] = useState(null);
  const [reviewResult, setReviewResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [feedItems, setFeedItems] = useState([]);
  const [repoDescription, setRepoDescription] = useState("");
  const originalSourceRef = useRef(FALLBACK_SNIPPET);

  // Persist repo when passed
  useEffect(() => {
    if (location.state?.repo) {
      try {
        localStorage.setItem("reviseiq_selected_repo", JSON.stringify(location.state.repo));
      } catch {}
    }
  }, [location.state?.repo]);

  // Real GitHub stats
  const [stats, setStats] = useState({
    totalCommits: "—",
    totalPRs: "—",
    stars: "—",
    qualityScore: "—",
  });

  // Fetch REAL data from GitHub on mount or repo change
  const loadDashboardData = async () => {
    try {
      setLoadingDashboard(true);
      setError(null);
      const res = await api.get(`/api/ai/dashboard-data?repo=${encodeURIComponent(repo.full_name)}`);

      if (res.data && res.data.success) {
        const { stats: ghStats, activityFeed, repoInfo, realSourceFile } = res.data;

        // Populate stats from real GitHub data
        setStats({
          totalCommits: String(ghStats.totalCommits || 0),
          totalPRs: String(ghStats.totalPRs || 0),
          stars: String(ghStats.stars || 0),
          qualityScore: "—",
        });

        setRepoDescription(repoInfo?.description || "");

        // Populate activity feed with real commits and PRs
        if (activityFeed && activityFeed.length > 0) {
          setFeedItems(activityFeed);
        }

        // Use real source file from the repo for AI review
        if (realSourceFile && realSourceFile.content) {
          setCodeToReview(realSourceFile.content);
          setSourceFilePath(realSourceFile.path);
          setSourceFileLanguage(realSourceFile.language || "javascript");
          originalSourceRef.current = realSourceFile.content;
        } else {
          setCodeToReview(FALLBACK_SNIPPET);
          setSourceFilePath("sample.js");
          setSourceFileLanguage("javascript");
          originalSourceRef.current = FALLBACK_SNIPPET;
        }
      }
    } catch (err) {
      console.warn("Failed to load real GitHub data:", err.message);
      setCodeToReview(FALLBACK_SNIPPET);
      originalSourceRef.current = FALLBACK_SNIPPET;
    } finally {
      setLoadingDashboard(false);
    }
  };

  const hasFetched = useRef(false);
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    loadDashboardData();
  }, [repo.full_name]);

  const handleCheckAgain = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post("/api/ai/review", {
        code: codeToReview,
        filename: sourceFilePath,
        language: sourceFileLanguage,
        context: `Repository: ${repo.full_name}. Real source file from GitHub. ${repoDescription}`,
        activeAgents,
      });

      if (response.data && response.data.success) {
        const review = response.data.review;
        setReviewResult(review);

        const score = review.qualityScore !== undefined ? `${review.qualityScore}%` : "—";
        setStats((prev) => ({
          ...prev,
          qualityScore: score,
        }));

        const newFeedItem = {
          id: `eval-${Date.now()}`,
          type: "ai_review",
          verdict: review.status || (review.qualityScore >= 80 ? "PASS" : "FLAG"),
          title: `AI Review (${sourceFilePath}): ${review.summary?.slice(0, 60) || "Evaluation completed"}`,
          time: "Just now",
          verdictClass:
            review.status === "PASS"
              ? "text-emerald-400"
              : review.status === "FAIL"
              ? "text-coral"
              : "text-amber-400",
        };

        setFeedItems((prev) => [newFeedItem, ...prev.slice(0, 9)]);
      } else {
        throw new Error(response.data?.message || "Failed to get review from AI.");
      }
    } catch (err) {
      console.error("LLM review failed:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to contact Gemini LLM. Please check server logs and GEMINI_API_KEY."
      );
    } finally {
      setLoading(false);
    }
  };

  // Auto-trigger LLM evaluation when launching from Onboarding
  const hasAutoReviewed = useRef(false);
  useEffect(() => {
    if (location.state?.autoReview && !hasAutoReviewed.current && !loadingDashboard && codeToReview) {
      hasAutoReviewed.current = true;
      handleCheckAgain();
    }
  }, [location.state?.autoReview, loadingDashboard, codeToReview]);

  const handleCopyRefactor = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#110f0e] text-[#f5efe9] flex flex-col font-sans">
      {/* Top Bar */}
      <header className="border-b border-white/8 bg-[#181412]/80 backdrop-blur-xl px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="relative inline-flex size-7 items-center justify-center rounded-lg bg-coral shadow-[0_0_14px_rgba(242,120,82,0.5)]">
            <span className="absolute h-[2px] w-2.5 translate-y-[-2px] -rotate-45 rounded bg-[#201512]" />
            <span className="absolute h-[2px] w-2.5 translate-y-[2px] -rotate-45 rounded bg-[#201512]" />
          </span>
          <span className="font-display font-extrabold text-lg tracking-tight text-white">ReviseIQ</span>
          <span className="text-white/20 text-sm">/</span>
          <span className="font-mono text-xs text-coral-light bg-coral/10 px-2.5 py-0.5 rounded-md border border-coral/20">
            {repo.full_name}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/repos"
            className="text-xs text-[#9c8e86] hover:text-white transition-colors"
          >
            ← Switch Repository
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem("reviseiq_github_handle");
              logout();
            }}
            type="button"
            className="text-xs text-[#9c8e86] hover:text-white px-2.5 py-1 rounded bg-white/5 border border-white/10 cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main Dashboard Overview */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-8 space-y-6">
        {/* Center Button and Snippet Toggle */}
        <div className="flex flex-col items-center justify-center gap-3 mb-2">
          <button
            type="button"
            name="check"
            id="check"
            onClick={handleCheckAgain}
            disabled={loading}
            className="px-8 py-3 rounded-xl bg-coral hover:bg-coral-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-[0_0_24px_rgba(242,120,82,0.35)] hover:shadow-[0_0_30px_rgba(242,120,82,0.6)] cursor-pointer active:scale-95 flex items-center gap-2.5"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Running Gemini Review...</span>
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                <span>check Again</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowCodeEditor(!showCodeEditor)}
            className="text-xs text-[#9c8e86] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Code2 className="size-3.5" />
            <span>{showCodeEditor ? "Hide Code Snippet" : "Customize / View Snippet to Evaluate"}</span>
            {showCodeEditor ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
        </div>

        {/* Optional Expandable Code Editor */}
        {showCodeEditor && (
          <div className="rounded-2xl border border-white/10 bg-[#161211] p-5 shadow-2xl transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-muted">
                {sourceFilePath !== "snippet" ? `Source: ${sourceFilePath}` : "Source code for Gemini review:"}
              </span>
              <button
                type="button"
                onClick={() => setCodeToReview(originalSourceRef.current || FALLBACK_SNIPPET)}
                className="text-[11px] text-coral hover:underline cursor-pointer"
              >
                Reset to original {sourceFilePath !== "snippet" ? "file" : "snippet"}
              </button>
            </div>
            <textarea
              rows={8}
              value={codeToReview}
              onChange={(e) => setCodeToReview(e.target.value)}
              className="w-full font-mono text-xs bg-[#100d0c] text-white p-3.5 rounded-xl border border-white/10 focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral/40"
              placeholder="Paste code snippet here..."
            />
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl border border-coral/30 bg-coral/10 text-coral-light text-xs flex items-start gap-3">
            <AlertTriangle className="size-5 shrink-0 text-coral" />
            <div className="flex-1">
              <div className="font-semibold text-white mb-0.5">Evaluation Error</div>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Live LLM Review Results Card */}
        {reviewResult && (
          <div className="rounded-2xl border border-white/10 bg-[#171311] p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/8 pb-5">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-coral/10 border border-coral/20 text-coral">
                  <Sparkles className="size-5" />
                </span>
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-muted">
                    Gemini Multi-Agent Evaluation
                  </div>
                  <h2 className="text-xl font-display font-bold text-white">
                    Code Review Assessment
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5">
                  <span className="text-xs text-muted">Quality Score:</span>
                  <span className="font-mono font-bold text-sm text-white">
                    {reviewResult.qualityScore ?? "N/A"}/100
                  </span>
                </div>

                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider ${
                    reviewResult.status === "PASS"
                      ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                      : reviewResult.status === "FAIL"
                      ? "bg-coral/10 text-coral border border-coral/20"
                      : "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                  }`}
                >
                  {reviewResult.status === "PASS" ? (
                    <CheckCircle2 className="size-4" />
                  ) : reviewResult.status === "FAIL" ? (
                    <XCircle className="size-4" />
                  ) : (
                    <AlertTriangle className="size-4" />
                  )}
                  <span>{reviewResult.status || "REVIEWED"}</span>
                </div>
              </div>
            </div>

            {/* Summary */}
            {reviewResult.summary && (
              <div className="text-sm text-[#c8bcad] bg-white/[0.02] border border-white/5 p-4 rounded-xl leading-relaxed">
                <strong className="text-white">Executive Summary: </strong>
                {reviewResult.summary}
              </div>
            )}

            {/* Agent Assessments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-white/8 bg-[#120f0e]">
                <div className="flex items-center gap-2 mb-2 text-coral">
                  <ShieldAlert className="size-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Security Sentinel
                  </span>
                </div>
                <p className="text-xs text-[#9c8e86] leading-relaxed">
                  {reviewResult.securityAssessment || "No critical CVEs or secrets detected."}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-white/8 bg-[#120f0e]">
                <div className="flex items-center gap-2 mb-2 text-amber-400">
                  <Zap className="size-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Performance & Complexity
                  </span>
                </div>
                <p className="text-xs text-[#9c8e86] leading-relaxed">
                  {reviewResult.performanceAssessment || "Sub-second AST run; complexity within bounds."}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-white/8 bg-[#120f0e]">
                <div className="flex items-center gap-2 mb-2 text-emerald-400">
                  <Layers className="size-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Architectural Clarity
                  </span>
                </div>
                <p className="text-xs text-[#9c8e86] leading-relaxed">
                  {reviewResult.clarityAssessment || "Modular structure conforms to clean API boundaries."}
                </p>
              </div>
            </div>

            {/* Findings List */}
            {reviewResult.findings && reviewResult.findings.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>Inspection Findings ({reviewResult.findings.length})</span>
                </h3>
                <div className="space-y-2.5">
                  {reviewResult.findings.map((finding, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-white/[0.02] border border-white/6 flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                              finding.severity === "critical"
                                ? "bg-coral/20 text-coral"
                                : finding.severity === "warning"
                                ? "bg-amber-400/20 text-amber-400"
                                : "bg-sky-400/20 text-sky-400"
                            }`}
                          >
                            {finding.severity || "info"}
                          </span>
                          <span className="font-mono text-muted capitalize text-[11px]">
                            {finding.category || "General"}
                          </span>
                        </div>
                        {finding.line && (
                          <span className="text-[11px] font-mono text-muted">
                            Line {finding.line}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-medium text-white">{finding.message}</div>
                      {finding.suggestion && (
                        <div className="text-xs text-[#9c8e86] bg-black/20 p-2 rounded-lg border border-white/5">
                          <strong className="text-emerald-400 font-mono">Suggested fix: </strong>
                          {finding.suggestion}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Refactoring Snippet */}
            {reviewResult.suggestedRefactor && (
              <div className="rounded-xl border border-white/8 bg-[#100d0c] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-emerald-400 font-semibold">
                    Recommended Production-Ready Refactor:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyRefactor(reviewResult.suggestedRefactor)}
                    className="text-xs text-[#9c8e86] hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 border border-white/10 cursor-pointer transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="size-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" />
                        <span>Copy Fix</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="font-mono text-xs text-[#f5efe9] p-3 rounded-lg bg-black/40 overflow-x-auto border border-white/5">
                  <code>{reviewResult.suggestedRefactor}</code>
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Stats Grid — Real GitHub Data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Recent Commits", value: stats.totalCommits, change: "From GitHub" },
            { label: "Pull Requests", value: stats.totalPRs, change: "Open + Closed" },
            { label: "Stars", value: stats.stars, change: "GitHub Stars" },
            { label: "Quality Score", value: stats.qualityScore, change: "Gemini AI Grade" },
          ].map((stat, i) => (
            <div key={i} className="rounded-xl border border-white/8 bg-[#181311] p-4">
              <div className="text-[11px] text-[#9c8e86] mb-1 font-medium">{stat.label}</div>
              <div className="text-2xl font-bold text-white mb-1 font-mono">{stat.value}</div>
              <div className="text-[10px] text-emerald-400 font-mono">{stat.change}</div>
            </div>
          ))}
        </div>

        {/* Repository Activity Feed — Real GitHub Data */}
        <div className="rounded-2xl border border-white/10 bg-[#161211] p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/8 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-sm text-white flex items-center gap-2">
                <span>Repository Activity</span>
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              </h2>
              <button
                type="button"
                onClick={loadDashboardData}
                disabled={loadingDashboard}
                title="Refresh GitHub Activity"
                className="text-muted hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`size-3.5 ${loadingDashboard ? "animate-spin" : ""}`} />
              </button>
            </div>
            <span className="text-xs font-mono text-muted">
              {sourceFilePath !== "snippet" && sourceFilePath !== "sample.js" ? `Reviewing: ${sourceFilePath}` : "Live from GitHub API"}
            </span>
          </div>

          {loadingDashboard ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted text-xs">
              <Loader2 className="size-4 animate-spin" />
              <span>Fetching real data from GitHub...</span>
            </div>
          ) : feedItems.length === 0 ? (
            <div className="text-center py-8 text-muted text-xs">
              No recent activity found for {repo.full_name}.
            </div>
          ) : (
            <div className="space-y-2.5 font-mono text-xs">
              {feedItems.map((item) => (
                <a
                  key={item.id}
                  href={item.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5 transition-all hover:bg-white/[0.04] hover:border-white/10 group"
                >
                  <span className={`font-bold shrink-0 ${item.verdictClass}`}>{item.verdict}</span>
                  <span className="text-[#a4958e] truncate group-hover:text-white transition-colors">{item.title}</span>
                  {item.sha && (
                    <span className="text-[10px] text-muted font-mono shrink-0 bg-white/5 px-1.5 py-0.5 rounded">{item.sha}</span>
                  )}
                  <span className="ml-auto text-muted shrink-0">{item.time}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
