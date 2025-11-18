import { anthropic } from "./client";
import { ChatAnthropic } from "@langchain/anthropic";
import { z } from "zod";
import {
  CopywriterOutputSchema,
  type CopywriterOutput,
  type CopywriterInput,
} from "./copywriterSchemas";

/**
 * In-memory cache for copywriter output.
 * Keyed by (question, projectId, context hash).
 */
const copywriterCache = new Map<string, CopywriterOutput>();

// LangChain ChatAnthropic model – this is what LangSmith will trace
const copywriterModel = new ChatAnthropic({
  model: "claude-3-5-haiku-latest",
  temperature: 0.3,
  maxTokens: 800,
  // It will use ANTHROPIC_API_KEY from your env and LANGCHAIN_* for LangSmith
});

function makeCopywriterCacheKey(input: CopywriterInput): string {
  const contextHash = input.context.substring(0, 200).replace(/\s/g, "");
  return JSON.stringify({
    question: input.question,
    projectId: input.projectId ?? null,
    contextHash,
  });
}

/**
 * Build the prompt for the LLM.
 * We are NOT asking for JSON here, only plain text.
 */
function buildCopywriterPrompt(input: CopywriterInput): string {
  const {
    question,
    context,
    projectId,
    projectShortFacts,
  } = input;

  const factsLines: string[] = [];
  if (projectShortFacts?.client) {
    factsLines.push(`client: ${projectShortFacts.client}`);
  }
  if (projectShortFacts?.projectNameOrUrl) {
    factsLines.push(`project: ${projectShortFacts.projectNameOrUrl}`);
  }
  if (projectShortFacts?.role) {
    factsLines.push(`role: ${projectShortFacts.role}`);
  }
  if (projectShortFacts?.description) {
    factsLines.push(`description: ${projectShortFacts.description}`);
  }
  if (projectShortFacts?.yearOrTimeline) {
    factsLines.push(`timeline: ${projectShortFacts.yearOrTimeline}`);
  }
  if (projectShortFacts?.team) {
    factsLines.push(`team: ${projectShortFacts.team}`);
  }
  if (projectShortFacts?.keyOutcomes?.length) {
    factsLines.push(`keyOutcomes: ${projectShortFacts.keyOutcomes.join(", ")}`);
  }
  if (projectShortFacts?.keySkills?.length) {
    factsLines.push(`keySkills: ${projectShortFacts.keySkills.join(", ")}`);
  }

  const factsBlock =
    factsLines.length > 0
      ? factsLines.map((l) => `- ${l}`).join("\n")
      : "(no structured facts provided)";

  const prompt = `
You are the Copywriter Agent for a design-minded engineer’s portfolio.

Your job:
- Read the user's question.
- Read the project context and short facts.
- Write a clear, concise, recruiter-friendly answer.

Audience:
- Recruiters, hiring managers, and tech leads who skim quickly.

Tone:
- Clear, confident, warm, and professional.
- No fluff, no hype language, no buzzword soup.

Content rules:
- Focus on role, actions, tools, and impact where relevant.
- Use **bold** formatting for key phrases and skills.
- Do NOT invent companies, roles, dates, or metrics that are not in the context or facts.
- If information is missing, say so briefly and honestly.
- Write 2–6 sentences.
- You may use line breaks, but avoid bullet lists; write in short paragraphs instead.
- Do NOT mention that you are an AI or talk about prompts.

QUESTION:
${question}

PROJECT ID:
${projectId ?? "(none)"}

PROJECT FACTS:
${factsBlock}

LONG-FORM CONTEXT:
${context}

Now, write the best possible answer to the question using this information.
`;

  return prompt.trim();
}

/**
 * Call Anthropic once and return a plain-text answer.
 */
async function callCopywriterLLM(prompt: string): Promise<string> {
  console.time("copywriter-haiku");

  // Using LangChain's ChatAnthropic so LangSmith can trace this call
  const res = await copywriterModel.invoke(prompt);

  console.timeEnd("copywriter-haiku");

  // res.content is usually a string; if it's not, fall back gracefully
  const content =
    typeof res.content === "string"
      ? res.content
      : Array.isArray(res.content)
      ? res.content
          .map((part: any) =>
            typeof part === "string" ? part : part?.text ?? ""
          )
          .join(" ")
      : "";

  const text = content.trim();
  if (!text) {
    console.warn("Copywriter LLM returned empty content:", res);
    return "I had trouble generating a detailed answer here, but I can still share a brief response based on the available information.";
  }

  return text;
}

/**
 * Internal Copywriter Agent.
 * This version:
 * - Does NOT expect JSON from the LLM.
 * - Wraps the LLM's plain-text answer into a CopywriterOutput.
 * - NEVER throws; always returns a valid CopywriterOutput.
 */
async function generateCopywriterOutputInternal(
  input: CopywriterInput
): Promise<CopywriterOutput> {
  try {
    const prompt = buildCopywriterPrompt(input);
    const textAnswer = await callCopywriterLLM(prompt);

    // Basic heuristic for question_type based on the question text
    const q = input.question.toLowerCase();
    let question_type: CopywriterOutput["question_type"] = "general";
    if (
      q.includes("overview") ||
      q.includes("what is this") ||
      q.includes("what was this project")
    ) {
      question_type = "overview";
    } else if (
      q.includes("role") ||
      q.includes("responsibilit") ||
      q.includes("what did you do")
    ) {
      question_type = "role";
    } else if (
      q.includes("tool") ||
      q.includes("stack") ||
      q.includes("tech") ||
      q.includes("technology") ||
      q.includes("skills")
    ) {
      question_type = "tools";
    } else if (
      q.includes("process") ||
      q.includes("how did you") ||
      q.includes("workflow") ||
      q.includes("approach")
    ) {
      question_type = "process";
    } else if (
      q.includes("impact") ||
      q.includes("result") ||
      q.includes("outcome")
    ) {
      question_type = "impact";
    } else if (q.includes("compare") || q.includes("comparison")) {
      question_type = "comparison";
    }

    const eyebrow =
      question_type === "overview"
        ? "Overview"
        : question_type === "role"
        ? "Role"
        : question_type === "tools"
        ? "Tools"
        : question_type === "process"
        ? "Process"
        : question_type === "impact"
        ? "Impact"
        : question_type === "comparison"
        ? "Comparison"
        : "Answer";

    const heading =
      input.question.length <= 80
        ? input.question
        : "Answer to your question";

    const rawOutput: CopywriterOutput = {
      answer_blocks: [
        {
          type: "answer_block",
          eyebrow,
          heading,
          body: textAnswer,
          // IMPORTANT: adjust key name if your AnswerBlockSchema uses image_id instead.
          imageId: undefined,
        },
      ],
      question_type,
      focus_tags: [],
    };

    // Validate with Zod just to be safe, but don't throw if it fails.
    const result = CopywriterOutputSchema.safeParse(rawOutput);
    if (!result.success) {
      console.error("CopywriterOutput failed validation, but returning anyway:", {
        errors: result.error.issues,
      });
      return rawOutput;
    }

    return result.data;
  } catch (error) {
    console.error("Error generating copywriter output (outer catch):", error);

    // Last-resort fallback
    const fallback: CopywriterOutput = {
      answer_blocks: [
        {
          type: "answer_block",
          eyebrow: "Answer",
          heading: "AI answer",
          body:
            "I ran into an issue while generating a detailed answer, but I'm still here. Try rephrasing the question or asking something a bit simpler.",
          imageId: undefined,
        },
      ],
      question_type: "general",
      focus_tags: [],
    };

    return fallback;
  }
}

/**
 * Public Copywriter API with in-memory caching.
 * Returns structured CopywriterOutput (answer_blocks + optional metadata).
 * This function NEVER throws; it always returns a CopywriterOutput.
 */
export async function runCopywriter(
  input: CopywriterInput
): Promise<CopywriterOutput> {
  const cacheKey = makeCopywriterCacheKey(input);

  const cached = copywriterCache.get(cacheKey);
  if (cached) {
    console.log("Copywriter cache HIT:", cacheKey);
    return cached;
  }

  console.log("Copywriter cache MISS:", cacheKey);
  const output = await generateCopywriterOutputInternal(input);
  copywriterCache.set(cacheKey, output);
  return output;
}