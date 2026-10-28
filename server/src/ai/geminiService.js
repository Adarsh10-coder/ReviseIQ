import { StringOutputParser } from "@langchain/core/output_parsers";
import { getGeminiChatModel, getGoogleGenAIClient, normalizeModelName } from "./config.js";
import { CODE_EXPLANATION_PROMPT, CODE_FIX_PROMPT } from "./prompts.js";

/**
 * Directly call the Gemini LLM model with a prompt and get the text response.
 *
 * @param {string} prompt - Prompt or question for Gemini
 * @param {Object} [options] - Model configuration (model, temperature, systemInstruction, etc.)
 * @returns {Promise<string>} Generated text
 */
export async function generateText(prompt, options = {}) {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("Prompt string is required.");
  }

  // Use LangChain ChatGoogleGenerativeAI for clean execution and retry policies
  const model = getGeminiChatModel({
    temperature: options.temperature ?? 0.7,
    ...options,
  });

  const response = await model.invoke(prompt);
  return typeof response.content === "string"
    ? response.content
    : JSON.stringify(response.content);
}

/**
 * Streams response chunks from Gemini LLM in real-time.
 *
 * @param {string} prompt - Prompt for Gemini
 * @param {Function} onChunk - Callback for each stream token/chunk
 * @param {Object} [options] - Options passed to the model
 * @returns {Promise<string>} Full accumulated text
 */
export async function streamGenerate(prompt, onChunk, options = {}) {
  const model = getGeminiChatModel(options);
  const stream = await model.stream(prompt);
  let fullText = "";

  for await (const chunk of stream) {
    const text = chunk.content;
    fullText += text;
    if (typeof onChunk === "function") {
      onChunk(text);
    }
  }

  return fullText;
}

/**
 * Uses Gemini LLM to explain a given code snippet.
 *
 * @param {string} code - The code to explain
 * @param {string} [language] - Code language
 * @returns {Promise<string>} Detailed explanation
 */
export async function explainCode(code, language = "javascript") {
  if (!code) {
    throw new Error("Code string is required.");
  }

  const model = getGeminiChatModel({ temperature: 0.2 });
  const chain = CODE_EXPLANATION_PROMPT.pipe(model).pipe(new StringOutputParser());

  return await chain.invoke({
    code,
    language,
  });
}

/**
 * Uses Gemini LLM to generate a fix or refactor for problematic code.
 *
 * @param {string} code - Original code
 * @param {string} issue - Problem description, bug, or refactor objective
 * @param {string} [language] - Code language
 * @returns {Promise<string>} Fixed code and explanation
 */
export async function suggestFix(code, issue, language = "javascript") {
  if (!code || !issue) {
    throw new Error("Both code and issue description are required.");
  }

  const model = getGeminiChatModel({ temperature: 0.2 });
  const chain = CODE_FIX_PROMPT.pipe(model).pipe(new StringOutputParser());

  return await chain.invoke({
    code,
    issue,
    language,
  });
}

/**
 * Start a direct multi-turn chat session with Gemini via GoogleGenerativeAI client.
 *
 * @param {Object} [options]
 * @returns {import("@google/generative-ai").ChatSession}
 */
export function createChatSession(options = {}) {
  const genAI = getGoogleGenAIClient();
  const configured = options.model || process.env.GEMINI_MODEL || process.env.GEMINI_MODE;
  const modelName = normalizeModelName(configured);
  const model = genAI.getGenerativeModel({ model: modelName });
  return model.startChat(options);
}
