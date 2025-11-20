import { anthropic } from "./client";
import { ChatAnthropic } from "@langchain/anthropic";
import { z } from "zod";
import {
  CopywriterOutputSchema,
  type CopywriterOutput,
  type CopywriterInput,
} from "./copywriterSchemas";

// ============================================================
// MODAL COPYWRITER TYPES (NEW - Phase 6.1)
// ============================================================

export interface ModalCopywriterHistoryTurn {
  role: "user" | "ai";
  text: string;
}

export interface ModalCopywriterInput {
  question: string;
  context: string;
  projectSlug?: string | null;
  pagePath?: string | null;
  sectionHeadline?: string | null;
  sectionText?: string | null;
  topicLabel?: string | null;
  history?: ModalCopywriterHistoryTurn[];
}

export interface ModalCopywriterOutput {
  answer: string;
}

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
    intent,
    contentGoals,
    requiredSections,
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

  // Build intent-specific audience and content guidance
  let audienceGuidance = "Recruiters, hiring managers, and tech leads who skim quickly.";
  let contentGuidance = "Focus on role, actions, tools, and impact where relevant.";

  if (intent === "recruiter") {
    audienceGuidance = "Recruiters and talent acquisition professionals who need a quick, scannable overview.";
    contentGuidance = "Focus on skills, qualifications, proof points, and concise summaries. Make it easy to skim.";
  } else if (intent === "hiring_manager") {
    audienceGuidance = "Hiring managers and tech leads who want depth, architecture reasoning, and technical process details.";
    contentGuidance = "Focus on technical depth, decision-making process, collaboration style, and architectural choices.";
  } else if (intent === "client") {
    audienceGuidance = "Potential clients and collaborators who want to understand services, outcomes, and how you work.";
    contentGuidance = "Focus on trust-building, services offered, concrete outcomes, and working style.";
  } else if (intent === "general") {
    audienceGuidance = "General visitors seeking an overview of work and experience.";
    contentGuidance = "Provide a balanced overview that covers key aspects without assuming specific needs.";
  }

  const contentGoalsBlock = contentGoals && contentGoals.length > 0
    ? `\nCONTENT GOALS:\n${contentGoals.map(g => `- ${g}`).join("\n")}`
    : "";

  const requiredSectionsBlock = requiredSections && requiredSections.length > 0
    ? `\nREQUIRED SECTIONS (logical structure):\n${requiredSections.map(s => `- ${s}`).join("\n")}\n\nNote: Structure your answer to address these sections conceptually, even if you're writing a single answer block.`
    : "";

  const intentBlock = intent
    ? `\nINTENT CATEGORY:\n- ${intent}\n\nThis question is from a ${intent === "recruiter" ? "recruiter" : intent === "hiring_manager" ? "hiring manager" : intent === "client" ? "potential client" : "general visitor"}.`
    : "";

  const prompt = `
You are the Copywriter Agent for a design-minded engineer's portfolio.

Your job:
- Read the user's question.
- Read the project context and short facts.
- Write a clear, concise answer tailored to the audience intent.

${intentBlock}

Audience:
- ${audienceGuidance}

Tone:
- Clear, confident, warm, and professional.
- No fluff, no hype language, no buzzword soup.

Content rules:
- ${contentGuidance}
- Use **bold** formatting for key phrases and skills.
- Do NOT invent companies, roles, dates, or metrics that are not in the context or facts.
- If information is missing, say so briefly and honestly.
- Write 2–6 sentences for brief answers, up to 10 sentences for complex questions about outcomes, team dynamics, challenges, or process.
- You may use line breaks, but avoid bullet lists; write in short paragraphs instead.
- Do NOT mention that you are an AI or talk about prompts.
- IMPORTANT: The context includes both semantic search results AND the full project information. Use ALL available context to answer comprehensively - you have access to outcomes, team dynamics, challenges, process details, tools, impact, and more.${contentGoalsBlock}${requiredSectionsBlock}

QUESTION:
${question}

PROJECT ID:
${projectId ?? "(none)"}

PROJECT FACTS:
${factsBlock}

CONTEXT (includes semantic search results AND full project information):
${context}

Now, write the best possible answer to the question using ALL available information from the context above. 
- If the question is about outcomes, use the impact/outcomes information from the project sections.
- If the question is about team dynamics, use the role, process, and collaboration details.
- If the question is about challenges, use information about process, constraints, and problem-solving.
- Draw from ALL relevant sections and information, not just what directly matches the question keywords.
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

// ============================================================
// MODAL COPYWRITER (NEW - Phase 6.1)
// ============================================================

/**
 * Modal-specific copywriter optimized for concise, contextual Q&A.
 * 
 * Uses Claude Haiku for speed and cost efficiency.
 * Designed for hybrid depth: concise by default, deeper on follow-ups.
 * Strictly grounded in context to avoid hallucinations.
 * 
 * This function NEVER throws; always returns a ModalCopywriterOutput.
 */
export async function runModalCopywriter(
  input: ModalCopywriterInput
): Promise<ModalCopywriterOutput> {
  try {
    const {
      question,
      context,
      projectSlug,
      pagePath,
      sectionHeadline,
      sectionText,
      topicLabel,
      history,
    } = input;

    // Build conversation history text (last 2 turns = 4 messages max)
    const historyText = (history ?? [])
      .slice(-4)
      .map((turn) => `${turn.role.toUpperCase()}: ${turn.text}`)
      .join("\n");

    // Build section context block
    const sectionBlockLines: string[] = [];
    if (sectionHeadline) sectionBlockLines.push(`Headline: ${sectionHeadline}`);
    if (sectionText) sectionBlockLines.push(`Body: ${sectionText}`);

    const sectionBlock =
      sectionBlockLines.length > 0
        ? sectionBlockLines.join("\n")
        : topicLabel
        ? `Topic: ${topicLabel}`
        : "No specific section context available.";

    const projectLine = projectSlug
      ? `PROJECT: ${projectSlug}`
      : pagePath
      ? `PAGE: ${pagePath}`
      : "PROJECT: (not specified)";

    // System prompt optimized for modal Q&A
    const systemPrompt = `
You are an expert AI assistant embedded inside a portfolio website.

BEHAVIOR RULES:
- Always use only the provided context.
- NEVER invent facts, roles, metrics, dates, or projects.
- DEFAULT OUTPUT: concise answer (1–2 short paragraphs).
- If the user clearly asks "why", "how", or "explain", give a deeper explanation (2–4 paragraphs).
- If unsure due to missing context, say so and explain what you CAN answer.
- Tone: confident, direct, professional.
- Audience: recruiters, hiring managers, collaborators.
- Output only plain text. No YAML, no markdown fences, no headings.

Stay grounded. Stay precise.
`.trim();

    const modalContextText = `
${projectLine}

SECTION:
${sectionBlock}

CONTEXT:
${context}

CONVERSATION HISTORY:
${historyText || "No prior conversation."}

USER QUESTION:
${question}
`.trim();

    // Create modal-specific model instance (Haiku, lower temp, lower tokens)
    const modalModel = new ChatAnthropic({
      modelName: "claude-3-haiku-20240307",
      temperature: 0.2,
      maxTokens: 450,
    });

    // Build the complete prompt
    const fullPrompt = `${systemPrompt}\n\n${modalContextText}`;

    if (process.env.NODE_ENV !== "production") {
      console.time("modal-copywriter-haiku");
    }

    const res = await modalModel.invoke(fullPrompt);

    if (process.env.NODE_ENV !== "production") {
      console.timeEnd("modal-copywriter-haiku");
    }

    // Extract content
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

    const answerText =
      content.trim() ||
      "I couldn't generate an answer for that question based on the available context.";

    return { answer: answerText };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[runModalCopywriter] Error:", error);
    }

    // Fallback answer on error
    return {
      answer:
        "I ran into an issue while generating an answer. Could you try rephrasing your question?",
    };
  }
}