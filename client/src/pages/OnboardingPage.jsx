import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function OnboardingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const repo = location.state?.repo || { full_name: "ReviseIQ/core-engine", name: "core-engine" };

  const [activeAgents, setActiveAgents] = useState(["security", "performance", "clarity"]);
  const [isConfiguring, setIsConfiguring] = useState(false);

  const toggleAgent = (id) => {
    setActiveAgents((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleLaunch = () => {
    setIsConfiguring(true);
    setTimeout(() => {
      navigate("/dashboard", { state: { repo, activeAgents } });
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#110f0e] text-[#f5efe9] flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#171311] p-8 shadow-2xl">
        <div className="flex items-center gap-2 mb-4">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">
            Repository Configured
          </span>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white mb-2">
          Configure AI Review Agents
        </h1>
        <p className="text-xs sm:text-sm text-[#9c8e86] mb-6">
          Monitoring <span className="font-mono text-white font-semibold">{repo.full_name}</span>. Select which automated AST review agents should trigger on pull requests.
        </p>

        <div className="space-y-3 mb-8">
          {[
            {
              id: "security",
              name: "Security Sentinel",
              desc: "Detects injection vulnerabilities, leaked secrets, and unsafe dependencies.",
            },
            {
              id: "performance",
              name: "Performance & Complexity",
              desc: "Flags algorithmic bottlenecks, unindexed queries, and heavy loops.",
            },
            {
              id: "clarity",
              name: "Architectural Clarity",
              desc: "Validates typing, modular boundaries, and clean async control flow.",
            },
          ].map((agent) => {
            const isChecked = activeAgents.includes(agent.id);
            return (
              <div
                key={agent.id}
                onClick={() => toggleAgent(agent.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  isChecked
                    ? "border-coral/50 bg-coral/10"
                    : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                }`}
              >
                <div>
                  <div className="font-semibold text-sm text-white">{agent.name}</div>
                  <div className="text-xs text-[#9c8e86]">{agent.desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}}
                  className="size-4 accent-[#f27852] cursor-pointer"
                />
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleLaunch}
          disabled={isConfiguring}
          className="w-full h-12 rounded-xl bg-coral hover:bg-coral-light active:bg-coral-dark text-[#201512] font-extrabold text-sm shadow-coral transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          {isConfiguring ? "Deploying Agents..." : "Launch ReviseIQ Dashboard →"}
        </button>
      </div>
    </div>
  );
}
