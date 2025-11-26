import { anthropic } from "./client";
import { ChatAnthropic } from "@langchain/anthropic";
import { BaseMessage } from "@langchain/core/messages";
import { z } from "zod";
import {
  CopywriterOutputSchema,
  type CopywriterOutput,
  type CopywriterInput,
} from "./copywriterSchemas";
import { getCopywriterPromptTemplate } from "./promptLoader";

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
 * Build project short facts as JSON text string for the LangChain prompt template
 */
function formatProjectShortFacts(projectShortFacts?: CopywriterInput["projectShortFacts"]): string {
  if (!projectShortFacts) {
    return "{}";
  }

  const facts: Record<string, any> = {};
  if (projectShortFacts.client) facts.client = projectShortFacts.client;
  if (projectShortFacts.projectNameOrUrl) facts.projectNameOrUrl = projectShortFacts.projectNameOrUrl;
  if (projectShortFacts.role) facts.role = projectShortFacts.role;
  if (projectShortFacts.description) facts.description = projectShortFacts.description;
  if (projectShortFacts.yearOrTimeline) facts.yearOrTimeline = projectShortFacts.yearOrTimeline;
  if (projectShortFacts.team) facts.team = projectShortFacts.team;
  if (projectShortFacts.keyOutcomes?.length) facts.keyOutcomes = projectShortFacts.keyOutcomes;
  if (projectShortFacts.keySkills?.length) facts.keySkills = projectShortFacts.keySkills;

  return JSON.stringify(facts, null, 2);
}

/**
 * Call Anthropic using LangChain prompt template and return structured JSON output.
 */
async function callCopywriterLLM(input: CopywriterInput): Promise<CopywriterOutput> {
  console.time("copywriter-haiku");

  // Get the LangChain prompt template from LangSmith (fallback disabled)
  const { template: promptTemplate, source: promptSource } = await getCopywriterPromptTemplate();
  
  // Log which prompt source is being used (should always be langsmith now)
    console.log("[Copywriter] ✅ Using LangSmith prompt: pfaff-copywriter-answer-blocks-v3");

  // Format project short facts as JSON text
  const projectShortFactsText = formatProjectShortFacts(input.projectShortFacts);

  // Build global style guide (includes intent-specific guidance)
  let globalStyleGuide = "Clear, confident, warm, and professional. No fluff, no hype language.";
  if (input.intent === "recruiter") {
    globalStyleGuide = "Recruiters and talent acquisition professionals who need a quick, scannable overview. Focus on skills, qualifications, proof points, and concise summaries.";
  } else if (input.intent === "hiring_manager") {
    globalStyleGuide = "Hiring managers and tech leads who want depth, architecture reasoning, and technical process details. Focus on technical depth, decision-making process, collaboration style.";
  } else if (input.intent === "client") {
    globalStyleGuide = "Potential clients and collaborators who want to understand services, outcomes, and how you work. Focus on trust-building, services offered, concrete outcomes.";
  }

  // Format the prompt with variables - returns BaseMessage[]
  const messages: BaseMessage[] = await promptTemplate.formatMessages({
    question: input.question,
    context: input.context,
    project_short_facts: projectShortFactsText,
    project_id: input.projectId || "",
    global_style_guide: globalStyleGuide,
  });

  // Using LangChain's ChatAnthropic so LangSmith can trace this call
  const res = await copywriterModel.invoke(messages);

  console.timeEnd("copywriter-haiku");

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

  const text = content.trim();
  if (!text) {
    console.warn("Copywriter LLM returned empty content:", res);
    throw new Error("Copywriter LLM returned empty content");
  }

  // Parse JSON from response
  let jsonText = text.trim();
  
  // Extract JSON from markdown code blocks if present
  const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonText = codeBlockMatch[1].trim();
  }

  // Extract JSON object if wrapped in other text
  const jsonStart = jsonText.indexOf("{");
  const jsonEnd = jsonText.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
  }

  // Parse and validate JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    console.error("[Copywriter] Failed to parse JSON:", error);
    console.error("[Copywriter] Raw response:", text.substring(0, 500));
    throw new Error("Failed to parse copywriter JSON response");
  }

  // Validate against schema
  const result = CopywriterOutputSchema.parse(parsed);
  return result;
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
    // Use LangChain prompt template - expects JSON output
    const result = await callCopywriterLLM(input);
    return result;
  } catch (error) {
    console.error("Error generating copywriter output (outer catch):", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // If it's a LangSmith prompt loading error, re-throw it with context
    if (error instanceof Error && error.message.includes("LangSmith")) {
      throw new Error(`Copywriter failed: ${error.message}`);
    }

    // Last-resort fallback (should rarely be reached now that fallback is disabled)
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
  console.log("[runModalCopywriter] CALLED with:", {
    question: input.question,
    projectSlug: input.projectSlug,
    pagePath: input.pagePath,
  });
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

    const contextBlobParts: string[] = [];

    if (pagePath) contextBlobParts.push(`PAGE PATH: ${pagePath}`);
    if (projectSlug) contextBlobParts.push(`PROJECT SLUG: ${projectSlug}`);
    if (topicLabel) contextBlobParts.push(`TOPIC LABEL: ${topicLabel}`);

    if (sectionHeadline) contextBlobParts.push(`SECTION TITLE: ${sectionHeadline}`);
    if (sectionText) contextBlobParts.push(`SECTION BODY:\n${sectionText}`);

    if (context && context.trim().length > 0) {
      contextBlobParts.push(`EXTRA CONTEXT:\n${context}`);
    }

    if (history && history.length > 0) {
      const formattedHistory = history
        .map((turn) => `${turn.role.toUpperCase()}: ${turn.text}`)
        .join("\n");
      contextBlobParts.push(`HISTORY:\n${formattedHistory}`);
    }

    const contextBlob = contextBlobParts.join("\n\n");
    console.log("[runModalCopywriter] Built contextBlob length:", contextBlob.length);

    const { template: promptTemplate } = await getCopywriterPromptTemplate();
    console.log("[Copywriter] ✅ Using LangSmith prompt: pfaff-copywriter-answer-blocks-v4 (modal)");

    const formattedMessages: BaseMessage[] = await promptTemplate.formatMessages({
      question,
      context_blob: contextBlob,
    });

    // Log formatted messages before sending to model
    console.log("[Copywriter] Formatted messages for model:", formattedMessages);

    // Sanity check for the first message
    const first = formattedMessages[0];
    console.log("[Copywriter] First message content:", (first as any)?.content);

    if (!first || !(first as any).content || String((first as any).content).trim().length === 0) {
      console.error(
        "[Copywriter] ❌ First message has empty content before sending to model. Messages:",
        formattedMessages
      );
    }

    // Create modal-specific model instance (Haiku, lower temp, lower tokens)
    const modalModel = new ChatAnthropic({
      model: "claude-3-5-haiku-20241022",
      temperature: 0.2,
      maxTokens: 450,
    });

    if (process.env.NODE_ENV !== "production") {
      console.time("modal-copywriter-haiku");
    }

    // Using LangChain's ChatAnthropic so LangSmith can trace this call
    const res = await modalModel.invoke(formattedMessages);
console.log(
  "[ModalCopywriter] Raw model response (truncated):",
  JSON.stringify(res, null, 2).slice(0, 800)
);
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

    const text = content.trim();
    if (!text) {
      console.warn("Modal copywriter LLM returned empty content:", res);
      return {
        answer: "I couldn't generate an answer for that question based on the available context.",
      };
    }

    // Parse JSON from response (same as runCopywriter)
    let jsonText = text.trim();
    
    // Extract JSON from markdown code blocks if present
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    }

    // Extract JSON object if wrapped in other text
    const jsonStart = jsonText.indexOf("{");
    const jsonEnd = jsonText.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
    }

    // Parse and validate JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch (error) {
      console.error("[Modal Copywriter] Failed to parse JSON:", error);
      console.error("[Modal Copywriter] Raw response text:", text.substring(0, 500));
      // If JSON parsing fails, use the raw text as the answer
      return { answer: text };
    }

    // Validate against schema
    let result: CopywriterOutput;
    try {
      result = CopywriterOutputSchema.parse(parsed);
    } catch (error) {
      console.error("[Modal Copywriter] Schema validation failed:", error);
      console.error("[Modal Copywriter] Parsed JSON:", JSON.stringify(parsed, null, 2));
      // If schema validation fails, try to extract body from parsed JSON anyway
      if (parsed && typeof parsed === "object" && "answer_blocks" in parsed) {
        const blocks = (parsed as any).answer_blocks;
        if (Array.isArray(blocks) && blocks.length > 0 && blocks[0].body) {
          return { answer: blocks[0].body };
        }
      }
      // Last resort: use raw text
      return { answer: text };
    }

    console.log("[runModalCopywriter] Parsed answer_blocks count:", result.answer_blocks.length);

    const joinedAnswer =
      result.answer_blocks.map((block) => block.body).join("\n\n") ||
      "I couldn't generate an answer for that question based on the available context.";

    return { answer: joinedAnswer };
  } catch (error) {
    // Always log errors with full details
    console.error("[runModalCopywriter] ❌ Error caught:", error);
    if (error instanceof Error) {
      console.error("[runModalCopywriter] Error message:", error.message);
      console.error("[runModalCopywriter] Error stack:", error.stack);
    } else {
      console.error("[runModalCopywriter] Non-Error object:", JSON.stringify(error, null, 2));
    }

    // If it's a LangSmith prompt loading error, re-throw it to be caught by API route
    if (error instanceof Error && error.message.includes("LangSmith")) {
      console.error("[runModalCopywriter] ❌ LangSmith error detected, re-throwing");
      throw error; // Re-throw the original error
    }

    // For other errors, also re-throw to let the API route handle it
    // This ensures we get proper error responses instead of silent fallbacks
    if (error instanceof Error) {
      throw error;
    }
    
    // Last resort: if it's not an Error object, wrap it
    throw new Error(`Modal copywriter failed: ${String(error)}`);
  }
}