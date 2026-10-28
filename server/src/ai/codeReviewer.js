import { JsonOutputParser, StringOutputParser } from "@langchain/core/output_parsers";
import { getGeminiChatModel } from "./config.js";
import {
  CODE_REVIEW_PROMPT,
  PR_DIFF_REVIEW_PROMPT,
} from "./prompts.js";

/**
 * Helper to safely extract JSON from LLM output if returned with markdown code blocks.
 */
function cleanJsonOutput(text) {
  if (typeof text !== "string") return text;
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const raw = match ? match[1] : text;
  return JSON.parse(raw.trim());
}

/**
 * Reviews a source code snippet using LangChain and Google Gemini.
 *
 * @param {Object} params
 * @param {string} params.code - The code string to review
 * @param {string} [params.filename] - The source filename (e.g. "auth.controller.js")
 * @param {string} [params.language] - Language name (e.g. "javascript", "python")
 * @param {string} [params.context] - Additional context about the file/project
 * @param {string[]} [params.activeAgents] - Array of active agent IDs (e.g. ["security", "performance", "clarity"])
 * @returns {Promise<Object>} Structured review result
 */
export async function reviewCode({
  code,
  filename = "snippet",
  language = "javascript",
  context = "Standard full-stack web application codebase",
  activeAgents = ["security", "performance", "clarity"],
  model: modelOverride,
} = {}) {
  if (!code || typeof code !== "string") {
    throw new Error("Code string is required for review.");
  }

  let model = getGeminiChatModel({ temperature: 0.1, ...(modelOverride ? { model: modelOverride } : {}) });
  let chain = CODE_REVIEW_PROMPT.pipe(model).pipe(new StringOutputParser());

  let responseText;
  try {
    responseText = await chain.invoke({
      code,
      filename,
      language,
      context,
      activeAgents: activeAgents.join(", "),
    });
  } catch (err) {
    // If the selected pro preview model has 0 free quota on Google's free tier, fall back to gemini-3.1-flash-lite-preview
    if (err.message && (err.message.includes("429") || err.message.includes("quota"))) {
      console.warn("⚠️ Quota limit reached on primary model, falling back to gemini-3.1-flash-lite-preview...");
      const fallbackModel = getGeminiChatModel({ temperature: 0.1, model: "gemini-3.1-flash-lite-preview" });
      const fallbackChain = CODE_REVIEW_PROMPT.pipe(fallbackModel).pipe(new StringOutputParser());
      responseText = await fallbackChain.invoke({
        code,
        filename,
        language,
        context,
        activeAgents: activeAgents.join(", "),
      });
    } else {
      throw err;
    }
  }

  try {
    return cleanJsonOutput(responseText);
  } catch (parseErr) {
    return {
      qualityScore: 70,
      status: "FLAG",
      summary: "Completed review, but response required fallback formatting.",
      rawReview: responseText,
      findings: [],
    };
  }
}

/**
 * Evaluates a Git Pull Request diff using LangChain and Google Gemini.
 *
 * @param {Object} params
 * @param {string} params.diff - The git unified diff
 * @param {string} [params.repoName] - The repository name (e.g. "org/repo")
 * @param {string} [params.prTitle] - PR title / commit message
 * @param {string[]} [params.activeAgents] - Array of active agent IDs
 * @returns {Promise<Object>} Structured PR verdict and diff findings
 */
export async function reviewPullRequestDiff({
  diff,
  repoName = "Repository",
  prTitle = "Pull Request",
  activeAgents = ["security", "performance", "clarity"],
  model: modelOverride,
} = {}) {
  if (!diff || typeof diff !== "string") {
    throw new Error("Git diff string is required for PR review.");
  }

  let model = getGeminiChatModel({ temperature: 0.1, ...(modelOverride ? { model: modelOverride } : {}) });
  let chain = PR_DIFF_REVIEW_PROMPT.pipe(model).pipe(new StringOutputParser());

  let responseText;
  try {
    responseText = await chain.invoke({
      diff,
      repoName,
      prTitle,
      activeAgents: activeAgents.join(", "),
    });
  } catch (err) {
    if (err.message && (err.message.includes("429") || err.message.includes("quota"))) {
      console.warn("⚠️ Quota limit reached on primary model, falling back to gemini-3.1-flash-lite-preview...");
      const fallbackModel = getGeminiChatModel({ temperature: 0.1, model: "gemini-3.1-flash-lite-preview" });
      const fallbackChain = PR_DIFF_REVIEW_PROMPT.pipe(fallbackModel).pipe(new StringOutputParser());
      responseText = await fallbackChain.invoke({
        diff,
        repoName,
        prTitle,
        activeAgents: activeAgents.join(", "),
      });
    } else {
      throw err;
    }
  }

  try {
    return cleanJsonOutput(responseText);
  } catch (parseErr) {
    return {
      verdict: "COMMENT",
      qualityScore: 70,
      summary: "Diff reviewed with partial structured parsing.",
      riskLevel: "medium",
      keyChanges: [],
      rawReview: responseText,
      findings: [],
    };
  }
}

/**
 * Specialized agent: Security Sentinel review
 */
export async function reviewSecurity(code, context = "") {
  return reviewCode({
    code,
    context: `Specialized Security Sentinel Audit. Focus purely on CVEs, authorization, injection, and secrets. ${context}`,
    activeAgents: ["security"],
  });
}

/**
 * Specialized agent: Performance & Complexity review
 */
export async function reviewPerformance(code, context = "") {
  return reviewCode({
    code,
    context: `Specialized Performance & Complexity Audit. Focus on algorithmic efficiency, query indexing, and resource usage. ${context}`,
    activeAgents: ["performance"],
  });
}

/**
 * Specialized agent: Architectural Clarity review
 */
export async function reviewArchitecture(code, context = "") {
  return reviewCode({
    code,
    context: `Specialized Architectural Clarity Audit. Focus on modular design, typing, naming, and error boundaries. ${context}`,
    activeAgents: ["clarity"],
  });
}
