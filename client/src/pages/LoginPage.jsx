import { useState, useEffect } from "react";
import { BACKEND_URL } from "../lib/api.js";

function GithubIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-5 shrink-0 fill-current"
        >
            <path d="M12 .7C5.63.7.5 5.96.5 12.45c0 5.2 3.29 9.6 7.86 11.16.58.1.79-.25.79-.57v-2.22c-3.2.71-3.88-1.39-3.88-1.39-.52-1.36-1.28-1.72-1.28-1.72-1.05-.73.08-.72.08-.72 1.16.09 1.77 1.22 1.77 1.22 1.03 1.8 2.7 1.28 3.36.98.1-.76.4-1.28.73-1.57-2.56-.3-5.25-1.31-5.25-5.84 0-1.29.45-2.34 1.18-3.17-.12-.3-.51-1.5.11-3.13 0 0 .97-.31 3.16 1.21A10.8 10.8 0 0 1 12 6.3c.98 0 1.95.13 2.87.4 2.19-1.52 3.15-1.21 3.15-1.21.63 1.62.23 2.83.12 3.13.74.83 1.18 1.88 1.18 3.17 0 4.54-2.7 5.54-5.27 5.83.42.37.78 1.08.78 2.17v3.23c0 .32.21.69.79.57a11.74 11.74 0 0 0 7.88-11.15C23.5 5.96 18.34.7 12 .7Z" />
        </svg>
    );
}

function SparkIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-4 fill-none stroke-current"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m12 2 1.35 4.15a6.7 6.7 0 0 0 4.3 4.3L21.8 12l-4.15 1.35a6.7 6.7 0 0 0-4.3 4.3L12 21.8l-1.35-4.15a6.7 6.7 0 0 0-4.3-4.3L2.2 12l4.15-1.55a6.7 6.7 0 0 0 4.3-4.3L12 2Z" />
        </svg>
    );
}

function CheckIcon({ className = "size-3.5" }) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className={`${className} fill-none stroke-current`}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m4 10 3.5 3.5L16 5.75" />
        </svg>
    );
}

function ArrowIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="size-4 fill-none stroke-current transition-transform duration-300 group-hover:translate-x-1"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4 10h12M11 5l5 5-5 5" />
        </svg>
    );
}

const codeRows = [
    <>
        <span className="text-coral">const</span> <span className="text-cream">reviewPullRequest</span> = <span className="text-gold">async</span> (diff) =&gt; &#123;
    </>,
    <>
        {"  "}<span className="text-stone">/* Semantic AST validation */</span>
    </>,
    <>
        {"  "}<span className="text-coral">const</span> analysis = <span className="text-sage">await</span> ReviseIQ.<span className="text-gold-dark">inspect</span>(diff, &#123;
    </>,
    <>
        {"    "}depth: <span className="text-gold">"strict"</span>,
    </>,
    <>
        {"    "}detectSecurityVulnerabilities: <span className="text-sage">true</span>,
    </>,
    <>
        {"  "}&#125;);
    </>,
    <>
        {"  "}<span className="text-sage">return</span> analysis.<span className="text-coral-light">generateReview</span>();
    </>,
    <>&#125;;</>,
];

function CodeArtwork() {
    return (
        <div
            className="relative z-10 mt-6 mb-8 w-full max-w-[580px] ml-auto sm:translate-x-6 lg:translate-x-12 xl:translate-x-16"
            aria-label="Interactive AI code inspection illustration"
        >
            {/* Ambient lighting backdrop */}
            <div className="absolute -top-10 -right-6 h-56 w-56 rounded-full bg-coral/20 blur-3xl" />
            <div className="absolute -bottom-10 -left-6 h-48 w-48 rounded-full bg-gold/15 blur-3xl" />

            {/* Code Window Container */}
            <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-[#120f0ee6] shadow-2xl backdrop-blur-2xl transition-all duration-500 hover:border-coral/40">
                {/* Window Titlebar */}
                <div className="flex h-10 items-center justify-between border-b border-white/8 bg-white/[0.02] px-3.5">
                    <div className="flex items-center gap-1.5" aria-hidden="true">
                        <span className="size-2.5 rounded-full bg-[#f25c54]/80 shadow-[0_0_8px_rgba(242,92,84,0.6)]" />
                        <span className="size-2.5 rounded-full bg-[#f8b84e]/80" />
                        <span className="size-2.5 rounded-full bg-[#48bfe3]/80" />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 rounded-md bg-white/[0.04] px-2.5 py-0.5 font-mono text-[10px] text-[#e0d6ce] border border-white/5">
                            <span className="size-1.5 rounded-full bg-sage animate-ping" />
                            review.ts
                        </span>
                        <span className="font-mono text-[10px] text-muted hidden sm:inline">diff.patch</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-coral/80">
                        <span className="size-1.5 rounded-full bg-coral animate-pulse" />
                        AI Analysis
                    </div>
                </div>

                {/* Code Body */}
                <div className="flex py-3.5 font-mono text-[11px] leading-6 sm:text-xs sm:leading-6">
                    <div
                        className="flex w-10 shrink-0 select-none flex-col text-right text-[#524945] pr-3 border-r border-white/5"
                        aria-hidden="true"
                    >
                        {codeRows.map((_, index) => (
                            <span key={index}>{String(index + 1).padStart(2, "0")}</span>
                        ))}
                    </div>
                    <pre className="m-0 pl-3.5 overflow-hidden text-[#d6ccc5]">
                        <code>
                            {codeRows.map((row, index) => (
                                <span
                                    key={index}
                                    className={`block transition-colors ${index >= 3 && index <= 4
                                            ? "rounded bg-coral/[0.08] text-white px-1 -mx-1 border-l-2 border-coral"
                                            : ""
                                        }`}
                                >
                                    {row}
                                </span>
                            ))}
                        </code>
                    </pre>
                </div>
            </div>

            {/* Floating Review Card 1 (shifted further down) */}
            <div className="animate-float absolute -right-2 -bottom-9 sm:-right-4 sm:-bottom-11 flex w-[280px] sm:w-[320px] items-start gap-2.5 rounded-xl border border-white/15 bg-[#251d1ad9] p-3 shadow-2xl backdrop-blur-xl z-20">
                <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-coral text-[#201512] shadow-coral">
                    <SparkIcon />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-bold tracking-wider text-coral-light uppercase">
                            ReviseIQ AI
                        </span>
                        <span className="text-[9px] font-mono text-muted">now</span>
                    </div>
                    <p className="m-0 text-[11px] leading-snug text-[#eae1dc] font-sans">
                        Zero vulnerabilities. Clean async flow and solid typing.
                    </p>
                </div>
            </div>

            {/* Floating Badge 2 (shifted further up) */}
            <div className="animate-float-delayed absolute -top-6 -left-2 sm:-top-8 sm:-left-4 flex items-center gap-2 rounded-lg border border-white/10 bg-[#1e1816f0] px-3 py-1.5 shadow-xl backdrop-blur-md z-20">
                <span className="grid size-5 place-items-center rounded-full bg-sage text-[#18301d]">
                    <CheckIcon className="size-3" />
                </span>
                <span className="font-sans text-[11px] font-semibold text-white">All 14 Checks Passed</span>
                <span className="font-mono text-[9px] text-sage font-bold">100%</span>
            </div>
        </div>
    );
}

export default function LoginPage() {
    const [isConnecting, setIsConnecting] = useState(false);
    const [showCustomModal, setShowCustomModal] = useState(false);
    // Initially blank or loaded from localStorage (never hardcoded)
    const [customUsername, setCustomUsername] = useState(() => localStorage.getItem("reviseiq_github_handle") || "");

    const [errorMessage, setErrorMessage] = useState("");

    // Reset connecting state whenever navigating back or mounting
    useEffect(() => {
        setIsConnecting(false);
        const saved = localStorage.getItem("reviseiq_github_handle") || "";
        setCustomUsername(saved);

        const handlePageShow = () => {
            setIsConnecting(false);
        };
        window.addEventListener("pageshow", handlePageShow);

        const params = new URLSearchParams(window.location.search);
        if (params.get("error") === "github_connect_failed") {
            setErrorMessage("GitHub user not found. Please check spelling.");
            setShowCustomModal(true);
        } else if (params.get("modal") === "open") {
            setShowCustomModal(true);
        }

        return () => window.removeEventListener("pageshow", handlePageShow);
    }, []);

    const handleGithubLogin = () => {
        const savedHandle = (localStorage.getItem("reviseiq_github_handle") || customUsername).trim();
        if (savedHandle) {
            setIsConnecting(true);
            window.location.href = `${BACKEND_URL}/auth/connect-real-user?username=${encodeURIComponent(savedHandle)}`;
        } else {
            setIsConnecting(false);
            setShowCustomModal(true);
        }
    };

    const handleCustomUserLogin = (e) => {
        e.preventDefault();
        const trimmed = customUsername.trim();
        if (!trimmed) return;
        localStorage.setItem("reviseiq_github_handle", trimmed);
        setIsConnecting(true);
        setShowCustomModal(false);
        window.location.href = `${BACKEND_URL}/auth/connect-real-user?username=${encodeURIComponent(trimmed)}`;
    };

    const handleClearHandle = () => {
        localStorage.removeItem("reviseiq_github_handle");
        setCustomUsername("");
    };

    return (
        <main className="min-h-screen lg:h-screen lg:overflow-hidden grid grid-cols-1 lg:grid-cols-[1.12fr_0.88fr] bg-paper">
            {/* Left Showcase Section */}
            <section className="relative flex flex-col justify-between overflow-hidden bg-[radial-gradient(ellipse_at_85%_15%,rgba(242,120,82,0.24),transparent_40%),linear-gradient(150deg,#241c19_0%,#13100f_100%)] p-6 sm:p-8 lg:p-10 text-cream before:absolute before:inset-0 before:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] before:bg-[size:36px_36px] before:content-[''] before:[mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]">

                {/* Brand Header */}
                <header className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight">
                        <span className="relative inline-flex size-7 items-center justify-center rounded-lg bg-coral shadow-[0_0_16px_rgba(242,120,82,0.5)]">
                            <span className="absolute h-[2.5px] w-2.5 translate-y-[-2px] -rotate-45 rounded bg-[#201512]" />
                            <span className="absolute h-[2.5px] w-2.5 translate-y-[2px] -rotate-45 rounded bg-[#201512]" />
                        </span>
                        <span className="text-white text-base sm:text-lg">ReviseIQ</span>
                    </div>

                    <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-[#c5b9b1] backdrop-blur-sm">
                        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        AI Agentic Review Engine
                    </div>
                </header>

                {/* Main Hero Visual Area */}
                <div className="relative z-10 my-auto py-4 w-full max-w-[550px]">
                    <div className="inline-flex items-center gap-1.5 rounded-md bg-coral/15 px-2.5 py-1 text-[10px] sm:text-xs font-bold tracking-widest text-coral-light uppercase border border-coral/20">
                        <SparkIcon />
                        High-Velocity Code Review
                    </div>

                    <h1 className="mt-3 mb-2 font-display text-[clamp(28px,3.8vw,48px)] leading-[1.05] font-extrabold tracking-[-0.04em] text-white">
                        Review less. <br />
                        Ship <span className="text-transparent bg-clip-text bg-gradient-to-r from-coral via-coral-light to-gold">flawless code.</span>
                    </h1>

                    <p className="m-0 max-w-[460px] text-xs sm:text-sm leading-relaxed text-[#b5a8a1]">
                        Deep AST reasoning and real-time pull request reviews designed for teams who take engineering craft seriously.
                    </p>

                    {/* Compact Code Artwork */}
                    <div className="mt-4 pt-1">
                        <CodeArtwork />
                    </div>
                </div>

                {/* Footer */}
                <footer className="relative z-10 flex items-center justify-between pt-2 text-[11px] text-[#786d67]">
                    <span>Precision engineered for GitHub teams</span>
                    <div className="flex gap-1.5" aria-hidden="true">
                        <span className="h-0.5 w-6 rounded bg-coral" />
                        <span className="h-0.5 w-3 rounded bg-[#4a3f3b]" />
                        <span className="h-0.5 w-3 rounded bg-[#4a3f3b]" />
                    </div>
                </footer>
            </section>

            {/* Right Form Section */}
            <section className="relative flex flex-col justify-between items-center bg-[radial-gradient(circle_at_85%_20%,rgba(230,189,104,0.14),transparent_35%)] bg-paper p-6 sm:p-8 lg:p-10">
                <div className="w-full" />

                {/* Login Card */}
                <div className="w-full max-w-[390px] rounded-2xl border border-[#4b372e18] bg-white/70 p-6 sm:p-7 shadow-[0_20px_60px_-15px_rgba(40,32,29,0.08)] backdrop-blur-xl">
                    <div className="flex flex-col items-center text-center">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-0.5 text-[10px] font-bold tracking-widest text-emerald-600 uppercase border border-emerald-500/20 shadow-xs">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Developer Access
                        </div>

                        <h2 className="mt-3 mb-4 font-display text-2xl sm:text-[28px] font-black tracking-tight text-black leading-snug">
                            Welcome to <span className="text-black font-black">ReviseIQ</span>
                        </h2>
                    </div>

                    {/* Value highlights */}
                    <div className="mt-4 space-y-1.5 rounded-xl bg-paper/70 p-3 border border-stone-200/50 text-[11px] text-stone">
                        <div className="flex items-center gap-2">
                            <span className="size-1 rounded-full bg-coral" />
                            <span>Read & Write PR review permissions</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="size-1 rounded-full bg-coral" />
                            <span>Zero code retention or unauthorized training</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="size-1 rounded-full bg-coral" />
                            <span>AES-256 encrypted GitHub OAuth tokens</span>
                        </div>
                    </div>

                    {/* GitHub Button */}
                    <button
                        className="group mt-5 flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-[#231d1b] bg-[#221c1a] px-4 text-xs sm:text-sm font-semibold text-white shadow-button transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#342925] hover:shadow-button-hover active:translate-y-0 focus-visible:outline-3 focus-visible:outline-coral/40 disabled:cursor-wait disabled:opacity-75"
                        type="button"
                        onClick={handleGithubLogin}
                        disabled={isConnecting}
                    >
                        {isConnecting ? (
                            <span className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-coral-light" />
                        ) : (
                            <GithubIcon />
                        )}
                        <span>{isConnecting ? "Redirecting to GitHub..." : "Continue with GitHub"}</span>
                        {!isConnecting && <ArrowIcon />}
                    </button>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
                        <span className="flex items-center gap-1.5">
                            <CheckIcon className="size-3 text-sage" />
                            <span>Instant OAuth 2.0 handshake</span>
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowCustomModal(true)}
                            className="font-medium text-coral-deep hover:underline cursor-pointer"
                        >
                            {customUsername ? `Change handle (@${customUsername})` : "Set GitHub handle"}
                        </button>
                    </div>

                    {/* Custom GitHub Handle Modal */}
                    {showCustomModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#191412] p-6 text-white shadow-2xl">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-display text-lg font-bold">Connect GitHub Account</h3>
                                    {customUsername && (
                                        <button
                                            type="button"
                                            onClick={handleClearHandle}
                                            className="text-[10px] text-coral hover:underline cursor-pointer"
                                        >
                                            Clear saved
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-[#9a8c84] mb-4">
                                    Enter your GitHub username. It will stay saved until you change it or sign out.
                                </p>
                                {errorMessage && (
                                    <div className="mb-3.5 rounded-lg bg-rose-500/15 border border-rose-500/30 px-3 py-2 text-[11px] text-rose-300">
                                        {errorMessage}
                                    </div>
                                )}
                                <form onSubmit={handleCustomUserLogin}>
                                    <input
                                        type="text"
                                        value={customUsername}
                                        onChange={(e) => setCustomUsername(e.target.value)}
                                        placeholder="GitHub username (e.g. Adarsh10-coder)"
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-coral mb-4"
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowCustomModal(false)}
                                            className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-semibold text-[#b5a59d] hover:bg-white/10 cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!customUsername.trim()}
                                            className="flex-1 rounded-lg bg-coral py-2 text-xs font-bold text-[#201512] hover:bg-coral-light cursor-pointer shadow-coral disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Save & Connect
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    <p className="mt-5 mb-0 border-t border-[#ebdcd1] pt-3.5 text-center text-[10px] text-[#91837c]">
                        By continuing, you agree to ReviseIQ's{" "}
                        <a href="#terms" className="font-semibold text-ink hover:underline">Terms</a> &{" "}
                        <a href="#privacy" className="font-semibold text-ink hover:underline">Privacy Policy</a>.
                    </p>
                </div>

                {/* System status pill */}
                <div className="w-full flex items-center justify-between text-[10px] text-[#8e8079] pt-2">
                    <span>© {new Date().getFullYear()} ReviseIQ</span>
                    <span className="flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                        All systems operational
                    </span>
                </div>
            </section>
        </main>
    );
}
