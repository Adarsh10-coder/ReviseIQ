import {
  reviewCode,
  reviewPullRequestDiff,
  generateText,
  explainCode,
  suggestFix,
} from "../ai/index.js";

/**
 * POST /api/ai/review
 * Reviews code using LangChain and Gemini.
 */
export async function handleCodeReview(req, res, next) {
  try {
    const { code, filename, language, context, activeAgents } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Code snippet is required for review.",
      });
    }

    const review = await reviewCode({
      code,
      filename,
      language,
      context,
      activeAgents,
    });

    return res.json({
      success: true,
      review,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/ai/review-pr
 * Reviews a Git pull request diff.
 */
export async function handlePrReview(req, res, next) {
  try {
    const { diff, repoName, prTitle, activeAgents } = req.body;

    if (!diff) {
      return res.status(400).json({
        success: false,
        message: "Git diff is required for PR review.",
      });
    }

    const review = await reviewPullRequestDiff({
      diff,
      repoName,
      prTitle,
      activeAgents,
    });

    return res.json({
      success: true,
      review,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/ai/generate
 * Calls Gemini LLM directly with a prompt.
 */
export async function handleGenerate(req, res, next) {
  try {
    const { prompt, options } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Prompt string is required.",
      });
    }

    const output = await generateText(prompt, options);

    return res.json({
      success: true,
      output,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/ai/explain
 * Explains code snippet using Gemini.
 */
export async function handleExplain(req, res, next) {
  try {
    const { code, language } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Code snippet is required.",
      });
    }

    const explanation = await explainCode(code, language);

    return res.json({
      success: true,
      explanation,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/ai/fix
 * Generates fixes or refactors for a code snippet.
 */
export async function handleFix(req, res, next) {
  try {
    const { code, issue, language } = req.body;

    if (!code || !issue) {
      return res.status(400).json({
        success: false,
        message: "Both code and issue description are required.",
      });
    }

    const fix = await suggestFix(code, issue, language);

    return res.json({
      success: true,
      fix,
    });
  } catch (error) {
    next(error);
  }
}
