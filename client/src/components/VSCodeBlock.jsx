import { useState } from "react";
import { Check, Copy, Code2, Edit3, Eye, RotateCcw } from "lucide-react";

/**
 * Strips markdown code fences (```lang ... ```) if present and normalizes line breaks
 */
function cleanCode(code) {
  if (!code) return "";
  let text = typeof code === "string" ? code : String(code);
  let trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    trimmed = trimmed.replace(/^```[a-zA-Z0-9_-]*\r?\n/, "").replace(/\r?\n```$/, "");
  }
  return trimmed.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

/**
 * Tokenizes a single line into authentic VS Code Dark Modern theme syntax tokens
 */
function tokenizeLine(line) {
  const tokens = [];
  let remaining = line;

  const patterns = [
    // 1. Comments
    { type: "comment", regex: /^(\/\/.*|#.*)/, color: "text-[#6a9955] italic" },
    // 2. Strings
    { type: "string", regex: /^("(\\.|[^"\\])*"|'(\\.|[^'\\])*'|`(\\.|[^`\\])*`)/, color: "text-[#ce9178]" },
    // 3. Numbers
    { type: "number", regex: /^(0x[0-9a-fA-F]+|\b\d+(\.\d+)?\b)/, color: "text-[#b5cea8]" },
    // 4. Control Flow Keywords (VS Code Purple)
    {
      type: "keyword-control",
      regex: /^\b(return|if|else|for|while|do|switch|case|break|continue|default|try|catch|finally|throw|await|async|yield|import|export|from)\b/,
      color: "text-[#c586c0] font-medium",
    },
    // 5. Definitions / Declarations (VS Code Blue)
    {
      type: "keyword-def",
      regex: /^\b(const|let|var|function|class|extends|super|this|new|typeof|instanceof|void|delete|in|of|static|public|private|protected|interface|type|enum|implements|package|def)\b/,
      color: "text-[#569cd6] font-medium",
    },
    // 6. Booleans & Null
    {
      type: "boolean",
      regex: /^\b(true|false|null|undefined|NaN|None|True|False)\b/,
      color: "text-[#569cd6]",
    },
    // 7. Types, Builtins, and PascalCase Classes (VS Code Teal)
    {
      type: "type",
      regex: /^\b(Error|Math|Promise|String|Number|Boolean|Array|Object|RegExp|Date|JSON|Map|Set|Buffer|Response|Request|console|process|db|stripe|User|[A-Z][a-zA-Z0-9_]*)\b/,
      color: "text-[#4ec9b0]",
    },
    // 8. Function Calls (VS Code Yellow)
    {
      type: "function",
      regex: /^[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\()/,
      color: "text-[#dcdcaa]",
    },
    // 9. Object Keys / Property Declarations (VS Code Light Sky Blue)
    {
      type: "property",
      regex: /^[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*:)/,
      color: "text-[#9cdcfe]",
    },
    // 10. General Variables / Identifiers
    {
      type: "variable",
      regex: /^[a-zA-Z_$][a-zA-Z0-9_$]*/,
      color: "text-[#9cdcfe]",
    },
    // 11. Operators and Punctuation
    {
      type: "punctuation",
      regex: /^(=>|===|!==|==|!=|<=|>=|&&|\|\||\+\+|--|\+=|-=|\*=|\/=|[-+*/%&|^!~?:=<>.,;(){}[\]])/,
      color: "text-[#d4d4d4]",
    },
    // 12. Whitespace
    {
      type: "whitespace",
      regex: /^\s+/,
      color: "",
    },
    // 13. Fallback character
    {
      type: "other",
      regex: /^./,
      color: "text-[#d4d4d4]",
    },
  ];

  while (remaining.length > 0) {
    let matched = false;
    for (const { type, regex, color } of patterns) {
      const match = remaining.match(regex);
      if (match) {
        tokens.push({ type, text: match[0], color });
        remaining = remaining.slice(match[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      tokens.push({ type: "other", text: remaining[0], color: "text-[#d4d4d4]" });
      remaining = remaining.slice(1);
    }
  }

  return tokens;
}

export default function VSCodeBlock({
  code,
  fileName = "code.js",
  language = "javascript",
  badge,
  badgeColor = "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  editable = false,
  onChange,
  onReset,
  resetLabel,
  maxHeight = "max-h-[460px]",
  showCopy = true,
  defaultMode = "preview", // "preview" | "edit"
}) {
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState(defaultMode);

  const displayCode = cleanCode(code);
  const lines = displayCode.split("\n");

  const handleCopy = () => {
    if (!displayCode) return;
    navigator.clipboard.writeText(displayCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-[#120f0e] shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-coral/30">
      {/* VS Code Title Bar */}
      <div className="flex h-10 items-center justify-between border-b border-white/8 bg-[#181413] px-3.5 select-none">
        {/* Left: Window Traffic Lights + Tab */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-[#f25c54]/85 shadow-[0_0_8px_rgba(242,92,84,0.6)]" />
            <span className="size-2.5 rounded-full bg-[#f8b84e]/85" />
            <span className="size-2.5 rounded-full bg-[#48bfe3]/85" />
          </div>

          <div className="flex items-center gap-1.5 rounded-md bg-[#1e1a18] px-2.5 py-1 text-xs font-mono text-[#e0d6ce] border border-white/5 shadow-inner">
            <Code2 className="size-3 text-coral" />
            <span className="font-semibold text-[11px] text-[#e0d6ce]">{fileName}</span>
          </div>
        </div>

        {/* Center / Right Controls */}
        <div className="flex items-center gap-2">
          {badge && (
            <span
              className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${badgeColor}`}
            >
              <span className="size-1.5 rounded-full bg-current animate-pulse" />
              {badge}
            </span>
          )}

          {/* Mode Switcher for Editable Block */}
          {editable && (
            <div className="flex items-center rounded-lg bg-black/40 p-0.5 border border-white/8">
              <button
                type="button"
                onClick={() => setMode("preview")}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-all cursor-pointer ${
                  mode === "preview"
                    ? "bg-coral/20 text-coral font-semibold shadow-sm"
                    : "text-muted hover:text-white"
                }`}
              >
                <Eye className="size-3" />
                <span>VS Code</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("edit")}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-all cursor-pointer ${
                  mode === "edit"
                    ? "bg-coral/20 text-coral font-semibold shadow-sm"
                    : "text-muted hover:text-white"
                }`}
              >
                <Edit3 className="size-3" />
                <span>Edit</span>
              </button>
            </div>
          )}

          {/* Optional Reset Button */}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="text-[11px] text-muted hover:text-coral flex items-center gap-1 px-2 py-1 rounded bg-white/5 border border-white/8 cursor-pointer transition-colors"
              title="Reset to original code"
            >
              <RotateCcw className="size-3" />
              <span className="hidden sm:inline">{resetLabel || "Reset"}</span>
            </button>
          )}

          {/* Language Pill */}
          <span className="text-[10px] font-mono text-muted uppercase tracking-wider bg-white/[0.04] px-2 py-0.5 rounded border border-white/5">
            {language}
          </span>

          {/* Copy Button */}
          {showCopy && (
            <button
              type="button"
              onClick={handleCopy}
              className="text-[11px] text-[#9c8e86] hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-white/5 border border-white/8 cursor-pointer transition-colors active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="size-3 text-emerald-400" />
                  <span className="text-emerald-400 font-mono text-[10px]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  <span className="text-[10px] font-mono hidden sm:inline">Copy</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Editor Body */}
      {editable && mode === "edit" ? (
        <div className="p-3 bg-[#0d0a09]">
          <textarea
            rows={Math.min(Math.max(lines.length + 1, 8), 20)}
            value={code}
            onChange={(e) => onChange && onChange(e.target.value)}
            className="w-full font-mono text-xs bg-[#100d0c] text-[#f5efe9] p-3 rounded-xl border border-white/10 focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral/40 resize-y leading-relaxed"
            placeholder="Paste or edit code snippet here..."
            spellCheck={false}
          />
        </div>
      ) : (
        <div className={`overflow-x-auto ${maxHeight} bg-[#120f0e] w-full`}>
          <table className="w-full border-collapse font-mono text-xs leading-6 text-[#d4d4d4]">
            <tbody>
              {lines.map((line, lineIndex) => {
                const tokens = tokenizeLine(line);
                return (
                  <tr
                    key={lineIndex}
                    className="hover:bg-white/[0.04] transition-colors group"
                  >
                    {/* Line Number Gutter */}
                    <td className="w-12 select-none text-right text-[#524945] group-hover:text-[#8c7e75] pr-4 pl-3 py-0 align-top border-r border-white/6 bg-[#0e0c0b]">
                      {String(lineIndex + 1).padStart(2, "0")}
                    </td>

                    {/* Syntax Highlighted Code Line */}
                    <td className="pl-4 pr-4 py-0 whitespace-pre align-top text-[#d4d4d4]">
                      {tokens.length > 0 ? (
                        tokens.map((token, tokenIndex) => (
                          <span key={tokenIndex} className={token.color}>
                            {token.text}
                          </span>
                        ))
                      ) : (
                        <span>&nbsp;</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
