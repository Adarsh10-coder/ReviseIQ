import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function DashboardPage() {
  const location = useLocation();
  const { logout } = useAuth();
  const repo = location.state?.repo || { full_name: "ReviseIQ/core-engine" };

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
            onClick={logout}
            type="button"
            className="text-xs text-[#9c8e86] hover:text-white px-2.5 py-1 rounded bg-white/5 border border-white/10 cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main Dashboard Overview */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-1">
              Active Control Center
            </h1>
            <p className="text-xs sm:text-sm text-[#9c8e86]">
              Real-time multi-agent code evaluation for <strong className="text-white">{repo.full_name}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-emerald-400 font-semibold">Webhooks & Agents Active</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Pull Requests Reviewed", value: "24", change: "+100% this week" },
            { label: "Vulnerabilities Caught", value: "7", change: "Zero breaches in prod" },
            { label: "Avg Review Latency", value: "1.4s", change: "Sub-second AST run" },
            { label: "Quality Score", value: "98.4%", change: "A+ grade" },
          ].map((stat, i) => (
            <div key={i} className="rounded-xl border border-white/8 bg-[#181311] p-4">
              <div className="text-[11px] text-[#9c8e86] mb-1 font-medium">{stat.label}</div>
              <div className="text-2xl font-bold text-white mb-1 font-mono">{stat.value}</div>
              <div className="text-[10px] text-emerald-400 font-mono">{stat.change}</div>
            </div>
          ))}
        </div>

        {/* Live Feed Simulator */}
        <div className="rounded-2xl border border-white/10 bg-[#161211] p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/8 pb-4 mb-4">
            <h2 className="font-semibold text-sm text-white">Live PR Inspection Stream</h2>
            <span className="text-xs font-mono text-muted">Listening on socket.io</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <span className="text-emerald-400 font-bold">PASS</span>
              <span className="text-[#a4958e]">PR #42: feat(auth): add PKCE challenge generation</span>
              <span className="ml-auto text-muted">2m ago</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <span className="text-coral-light font-bold">FLAG</span>
              <span className="text-[#a4958e]">PR #41: fix(db): unbounded projection in analytics route</span>
              <span className="ml-auto text-muted">14m ago</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <span className="text-emerald-400 font-bold">PASS</span>
              <span className="text-[#a4958e]">PR #40: chore(deps): upgrade vite to 8.3</span>
              <span className="ml-auto text-muted">1h ago</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
