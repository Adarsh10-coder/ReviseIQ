import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

/**
 * Returns the Gemini / Google GenAI API key from environment variables.
 */
export function getApiKey() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  return apiKey || "";
}

/**
 * Validates that an API key is available, throwing a descriptive error if missing.
 */
export function assertApiKey() {
  const key = getApiKey();
  if (!key) {
    throw new Error(
      "Missing GEMINI_API_KEY or GOOGLE_API_KEY environment variable. Please add it to your server/.env file."
    );
  }
  return key;
}

/**
 * Normalizes model names (e.g. "3.1 pro" -> "gemini-3.1-pro-preview")
 */
export function normalizeModelName(rawModel) {
  if (!rawModel) return "gemini-3.1-pro-preview";
  const trimmed = rawModel.trim();
  const lower = trimmed.toLowerCase();

  if (lower === "3.1 pro" || lower === "3.1-pro" || lower === "gemini 3.1 pro" || lower === "gemini-3.1-pro") {
    return "gemini-3.1-pro-preview";
  }
  if (lower === "3 flash" || lower === "gemini 3 flash" || lower === "gemini-3-flash") {
    return "gemini-3-flash-preview";
  }
  return trimmed;
}

/**
 * Returns a configured LangChain ChatGoogleGenerativeAI model instance.
 * @param {Object} options - Configuration overrides (model, temperature, maxOutputTokens, etc.)
 */
export function getGeminiChatModel(options = {}) {
  const apiKey = assertApiKey();
  const configured = options.model || process.env.GEMINI_MODEL || process.env.GEMINI_MODE;
  const modelName = normalizeModelName(configured);

  return new ChatGoogleGenerativeAI({
    apiKey,
    model: modelName,
    temperature: options.temperature ?? 0.2,
    maxRetries: options.maxRetries ?? 2,
    ...options,
  });
}

/**
 * Returns a configured GoogleGenerativeAI client instance for direct SDK calls.
 */
export function getGoogleGenAIClient() {
  const apiKey = assertApiKey();
  return new GoogleGenerativeAI(apiKey);
}
