/**
 * ReviseIQ AI Module
 * Multi-agent code review powered by LangChain and Google Gemini GenAI.
 */

export {
  getApiKey,
  assertApiKey,
  getGeminiChatModel,
  getGoogleGenAIClient,
  normalizeModelName,
} from "./config.js";

export {
  reviewCode,
  reviewPullRequestDiff,
  reviewSecurity,
  reviewPerformance,
  reviewArchitecture,
} from "./codeReviewer.js";

export {
  generateText,
  streamGenerate,
  explainCode,
  suggestFix,
  createChatSession,
} from "./geminiService.js";

export {
  CODE_REVIEW_PROMPT,
  PR_DIFF_REVIEW_PROMPT,
  CODE_EXPLANATION_PROMPT,
  CODE_FIX_PROMPT,
} from "./prompts.js";
