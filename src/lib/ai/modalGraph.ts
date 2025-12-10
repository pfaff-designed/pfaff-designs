import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { getProjectBySlug, getAllProjects, formatProfileSlice, loadProjectSummary, loadFaqSlice } from "@/lib/kb/loader";
import { runCopywriter } from "./copywriter";
import type { CopywriterInput, CopywriterOutput } from "./copywriterSchemas";
import type { RetrievedChunk } from "@/lib/rag/retrieveProjectChunks";
import { buildContextFromChunks, retrieveProjectChunks } from "@/lib/rag/retrieveProjectChunks";
import { anthropic } from "./client";
import { caseStudies } from "@/lib/caseStudies/data";
import { getModalGraphPromptTemplate, getModalGraphSystemMessage } from "@/lib/ai/promptLoader";

// Project facts type for modal graph
type ProjectFacts = {
  slug: string;
  name: string;
  client?: string;
  role?: string;
  summary?: string;
  tools?: string[];
};

// Conversation mode type
type ConversationMode = "answer_direct" | "clarify_then_answer" | "low_context_fallback";

export type ModalGraphState = {
  // Core input
  question: string;

  // Page context
  pagePath?: string;
  projectSlug?: string;
  sectionHeadline?: string;
  sectionText?: string;

  // Conversation history (from the modal)
  history?: Array<{ role: "user" | "assistant"; content: string }>;

  // RAG + context
  retrievedChunks?: Array<{
    text: string;
    relevanceScore?: number;
    projectSlug?: string | null;
  }>;
  contextBlob?: string;

  // Conversation mode
  mode?: ConversationMode;

  // Project facts from KB
  projectFacts?: {
    name?: string;
    client?: string;
    role?: string;
    summary?: string;
    tools?: string[];
    otherProjects?: {
      slug: string;
      name: string;
      client?: string;
      role?: string;
      summary?: string;
    }[];
  };

  // All projects from KB (for cross-project questions)
  allProjects?: Array<{
    slug: string;
    name: string;
    client?: string;
    role?: string;
    summary?: string;
    tools?: string[];
  }>;

  // Final outputs
  answerText?: string;
  debugNotes?: string[];
};

// State annotation for LangGraph
const MAX_HISTORY_MESSAGES = 30;

function trimHistory(
  history: Array<{ role: "user" | "assistant"; content: string }>
): Array<{ role: "user" | "assistant"; content: string }> {
  if (!history) return [];
  if (history.length <= MAX_HISTORY_MESSAGES) return history;
  return history.slice(-MAX_HISTORY_MESSAGES);
}

export function buildRunMetadata(state: ModalGraphState) {
  const {
    pagePath,
    projectSlug,
    mode,
    sectionHeadline,
    sectionText,
    retrievedChunks,
    answerText,
    question,
  } = state;

  const answer = answerText ?? "";
  const answerWordCount = answer.split(/\s+/).filter(Boolean).length;
  const hasSectionContext = Boolean(sectionHeadline || sectionText);
  const retrievedChunkCount = Array.isArray(retrievedChunks) ? retrievedChunks.length : 0;
  const hadFollowupSuggestion = /would you like|would you be interested|i can also/i.test(
    answer.toLowerCase()
  );

  return {
    pagePath: pagePath ?? null,
    projectSlug: projectSlug ?? null,
    mode: mode ?? "unknown",
    question: question ?? null,
    hasSectionContext,
    retrievedChunkCount,
    answerWordCount,
    hadFollowupSuggestion,
    timestampIso: new Date().toISOString(),
  };
}

const PROJECT_LABELS: Record<string, string> = {
  "capital-one-travel": "Capital One Travel — Capital One",
  "coca-cola": "Coca-Cola Creative Technology — Coca-Cola",
  pmi: "PMI.org — Project Management Institute",
  "pfaff-designs": "Pfaff.design — Self-initiated",
};

function getProjectLabel(
  projectSlug?: string | null,
  projectFacts?: {
    name?: string;
    client?: string;
  },
): string | null {
  if (!projectSlug) return null;
  if (PROJECT_LABELS[projectSlug]) return PROJECT_LABELS[projectSlug];

  const name = projectFacts?.name || projectSlug;
  const client = projectFacts?.client;

  if (client && name && name.toLowerCase() !== client.toLowerCase()) {
    return `${name} — ${client}`;
  }

  return name ?? null;
}

const ModalGraphStateAnnotation = Annotation.Root({
  question: Annotation<string>(),
  pagePath: Annotation<string | undefined>(),
  projectSlug: Annotation<string | undefined>(),
  sectionHeadline: Annotation<string | undefined>(),
  sectionText: Annotation<string | undefined>(),
  history: Annotation<Array<{ role: "user" | "assistant"; content: string }> | undefined>({
    reducer: (left, right) => {
      if (right && Array.isArray(right)) {
        return trimHistory(right);
      }
      if (Array.isArray(left)) {
        return trimHistory(left);
      }
      return [];
    },
    default: () => [],
  }),
  retrievedChunks: Annotation<
    | Array<{
        text: string;
        relevanceScore?: number;
        projectSlug?: string | null;
      }>
    | undefined
  >(),
  contextBlob: Annotation<string | undefined>(),
  mode: Annotation<"answer_direct" | "clarify_then_answer" | "low_context_fallback" | undefined>(),
  projectFacts: Annotation<
    | {
        name?: string;
        client?: string;
        role?: string;
        summary?: string;
        tools?: string[];
        otherProjects?: {
          slug: string;
          name: string;
          client?: string;
          role?: string;
          summary?: string;
        }[];
      }
    | undefined
  >(),
  allProjects: Annotation<
    | Array<{
        slug: string;
        name: string;
        client?: string;
        role?: string;
        summary?: string;
        tools?: string[];
      }>
    | undefined
  >(),
  answerText: Annotation<string | undefined>(),
  debugNotes: Annotation<string[]>({
    reducer: (left, right) => {
      if (!right) return left ?? [];
      if (!left) return Array.isArray(right) ? right : [right];
      return left.concat(Array.isArray(right) ? right : [right]);
    },
    default: () => [],
  }),
});

// ============================================================
// SYSTEM PROMPT
// ============================================================
// Note: Complex questions now use Copywriter which loads prompt from LangSmith
// Simple questions (tools/projects) use deterministic rules (no prompt needed)

// ============================================================
// HELPER: Load Project Facts
// ============================================================

/**
 * Extract technical tools from skillsUsed array
 * Filters for common technical tools/technologies
 */
function extractTools(skillsUsed?: string[]): string[] {
  if (!skillsUsed || skillsUsed.length === 0) return [];

  // Common technical tools/technologies to extract
  const technicalKeywords = [
    "react",
    "typescript",
    "javascript",
    "next.js",
    "nextjs",
    "tailwind",
    "css",
    "html",
    "node",
    "python",
    "figma",
    "storybook",
    "supabase",
    "vercel",
    "git",
    "webpack",
    "vite",
    "svelte",
    "vue",
    "angular",
  ];

  return skillsUsed.filter((skill) => {
    const lower = skill.toLowerCase();
    return technicalKeywords.some((keyword) => lower.includes(keyword));
  });
}

/**
 * Load all projects from KB with tools extracted
 * Falls back to static list if KB is unavailable
 */
async function loadAllProjects(): Promise<
  Array<{
    slug: string;
    name: string;
    client?: string;
    role?: string;
    summary?: string;
    tools?: string[];
  }>
> {
  // Use case studies data as the source of truth for available case studies
  // Filter out hidden projects (Tanger and Real Estate Platform)
  const filteredCaseStudies = caseStudies.filter(
    (study) => 
      study.slug !== "tanger-outlets" && 
      study.slug !== "real-estate-platform"
  );

  // Map case studies to project format
  const projectsFromCaseStudies = filteredCaseStudies.map((study) => {
    return {
      slug: study.slug,
      name: study.projectName,
      client: study.client,
      role: study.roleSummary,
      summary: study.heroSummary,
      tools: undefined, // Tools will be populated from KB if needed, but case studies are the source of truth
    };
  });

  // Try to enrich with tools from KB if available
  try {
    const allProjectsKB = await getAllProjects();
    if (allProjectsKB.length > 0) {
      // Create a map of KB projects by projectId for quick lookup
      const kbProjectsMap = new Map(
        allProjectsKB
          .filter((p) => p.facts.projectId && p.facts.projectId !== "tanger" && p.facts.projectId !== "tanger-outlets" && p.facts.projectId !== "real-estate-platform")
          .map((p) => [p.facts.projectId, p])
      );

      // Enrich case studies with tools from KB if available
      return projectsFromCaseStudies.map((project) => {
        const kbProject = kbProjectsMap.get(project.slug);
        if (kbProject) {
          const tools = extractTools(kbProject.facts.skillsUsed);
          return {
            ...project,
            tools: tools.length > 0 ? tools : undefined,
          };
        }
        return project;
      });
    }
  } catch (error) {
    console.error("[loadAllProjects] Error loading tools from KB:", error);
    // Continue with case studies data even if KB fails
  }

  return projectsFromCaseStudies;
}

/**
 * Load project facts for a given slug
 */
async function loadProjectFactsForSlug(
  projectSlug?: string
): Promise<
  | {
      name?: string;
      client?: string;
      role?: string;
      summary?: string;
      tools?: string[];
      otherProjects?: {
        slug: string;
        name: string;
        client?: string;
        role?: string;
        summary?: string;
      }[];
    }
  | undefined
> {
  if (!projectSlug) return undefined;

  try {
    // Load current project
    const project = await getProjectBySlug(projectSlug);
    if (!project) return undefined;

    const facts = project.facts;

    // Extract tools from skillsUsed
    const tools = extractTools(facts.skillsUsed);

    // Load all other projects (excluding current) - use case studies as source of truth
    const allProjects = await loadAllProjects();
    const otherProjects = allProjects
      .filter((p) => p.slug !== projectSlug)
      .map((p) => ({
        slug: p.slug,
        name: p.name,
        client: p.client,
        role: p.role,
        summary: p.summary,
      }));

    return {
      name: facts.client || facts.projectId,
      client: facts.client,
      role: facts.role,
      summary: facts.projectSummary,
      tools: tools.length > 0 ? tools : undefined,
      otherProjects: otherProjects.length > 0 ? otherProjects : undefined,
    };
  } catch (error) {
    console.error("[loadProjectFactsForSlug] Error:", error);
    return undefined;
  }
}

// ============================================================
// HELPER: Convert Modal Graph State to Copywriter Input
// ============================================================

/**
 * Convert modal graph's retrieved chunks format to copywriter's RetrievedChunk format
 */
function convertModalChunksToRetrievedChunks(
  modalChunks?: Array<{
    text: string;
    relevanceScore?: number;
    projectSlug?: string | null;
  }>
): RetrievedChunk[] {
  if (!modalChunks || modalChunks.length === 0) {
    return [];
  }

  return modalChunks.map((chunk, index) => ({
    id: `modal-chunk-${index}`,
    projectId: chunk.projectSlug || undefined,
    source: "project_longform",
    text: chunk.text,
    score: chunk.relevanceScore,
  }));
}

/**
 * Format project facts for copywriter input
 */
function formatProjectFactsForCopywriter(
  projectFacts?: ModalGraphState["projectFacts"]
): string {
  if (!projectFacts) {
    return "{}";
  }

  const facts: Record<string, any> = {};
  
  if (projectFacts.name) facts.client = projectFacts.name;
  if (projectFacts.client) facts.client = projectFacts.client;
  if (projectFacts.role) facts.role = projectFacts.role;
  if (projectFacts.summary) facts.description = projectFacts.summary;
  if (projectFacts.tools && projectFacts.tools.length > 0) {
    facts.keySkills = projectFacts.tools;
  }

  return JSON.stringify(facts, null, 2);
}


/**
 * Call LLM for answer_direct mode
 * Simple factual questions with good context
 */
async function callLLMForAnswerDirect(params: {
  question: string;
  contextBlob?: string;
  pagePath?: string;
  projectSlug?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  mode?: string;
}): Promise<string> {
  const { question, contextBlob, pagePath, projectSlug, history = [] } = params;

  // Use a robust path: if LangSmith provides a system-only template, use that; otherwise use chat template.
  let systemPrompt = "";
  let userMessage = "";

  const historySummary =
    history.length > 0
      ? history.map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`).join("\n")
      : "(no prior turns)";
  try {
    const systemMessage = await getModalGraphSystemMessage();
    systemPrompt = typeof systemMessage.content === "string" ? systemMessage.content : "";
    console.log("[PromptLoader] ✅ Loaded modal graph system message");
    // Build user message manually when using system-only template
    userMessage = `
QUESTION:
${question ?? ""}

MODE: ${params.mode ?? "answer_direct"}

PAGE PATH: ${pagePath ?? "(none)"}
PROJECT SLUG: ${projectSlug ?? "(none)"}

CONTEXT:
${contextBlob ?? "(no extra context provided)"}

HISTORY:
${historySummary}
`.trim();
  } catch {
    // Fallback to chat template path
    const template = await getModalGraphPromptTemplate();
    const formatted = await template.formatMessages({
      mode: params.mode ?? "answer_direct",
      question: question ?? "",
      context: contextBlob ?? "",
      pagePath: pagePath ?? "",
      projectSlug: projectSlug ?? "",
      history: historySummary,
    });
    const systemMsg = formatted.find((m: any) => m._getType?.() === "system" || m.type === "system");
    const humanMsg = formatted.find((m: any) => m._getType?.() === "human" || m.type === "human" || m.role === "user");
    const sysContent = (systemMsg as any)?.content;
    const humanContent = (humanMsg as any)?.content;
    systemPrompt = typeof sysContent === "string" ? sysContent : Array.isArray(sysContent) ? sysContent.join("\n") : "";
    userMessage = typeof humanContent === "string" ? humanContent : Array.isArray(humanContent) ? humanContent.join("\n") : "";
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 400,
      temperature: 0.2,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ] as any,
    });

    const answerText = 
      response.content[0]?.type === "text"
        ? response.content[0].text
        : "I'm having trouble generating a response right now. Could you try rephrasing your question?";

    return answerText.trim();
  } catch (error) {
    console.error("[callLLMForAnswerDirect] LLM call failed:", error);
    throw error;
  }
}

/**
 * Call LLM for clarify_then_answer mode
 * Ambiguous questions that may need clarification
 */
async function callLLMForClarifyThenAnswer(params: {
  question: string;
  contextBlob?: string;
  pagePath?: string;
  projectSlug?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  mode?: string;
}): Promise<string> {
  const { question, contextBlob, pagePath, projectSlug, history = [] } = params;

  let systemPrompt = "";
  let userMessage = "";

  const historySummary =
    history.length > 0
      ? history.map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`).join("\n")
      : "(no prior turns)";
  try {
    const systemMessage = await getModalGraphSystemMessage();
    systemPrompt = typeof systemMessage.content === "string" ? systemMessage.content : "";
    console.log("[PromptLoader] ✅ Loaded modal graph system message");
    userMessage = `
QUESTION:
${question ?? ""}

MODE: ${params.mode ?? "clarify_then_answer"}

PAGE PATH: ${pagePath ?? "(none)"}
PROJECT SLUG: ${projectSlug ?? "(none)"}

CONTEXT:
${contextBlob ?? "(no extra context provided)"}

HISTORY:
${historySummary}
`.trim();
  } catch {
    const template = await getModalGraphPromptTemplate();
    const formatted = await template.formatMessages({
      mode: params.mode ?? "clarify_then_answer",
      question: question ?? "",
      context: contextBlob ?? "",
      pagePath: pagePath ?? "",
      projectSlug: projectSlug ?? "",
      history: historySummary,
    });
    const systemMsg = formatted.find((m: any) => m._getType?.() === "system" || m.type === "system");
    const humanMsg = formatted.find((m: any) => m._getType?.() === "human" || m.type === "human" || m.role === "user");
    const sysContent = (systemMsg as any)?.content;
    const humanContent = (humanMsg as any)?.content;
    systemPrompt = typeof sysContent === "string" ? sysContent : Array.isArray(sysContent) ? sysContent.join("\n") : "";
    userMessage = typeof humanContent === "string" ? humanContent : Array.isArray(humanContent) ? humanContent.join("\n") : "";
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 400,
      temperature: 0.3,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ] as any,
    });

    const answerText = 
      response.content[0]?.type === "text"
        ? response.content[0].text
        : "I'm having trouble generating a response right now. Could you try rephrasing your question?";

    return answerText.trim();
  } catch (error) {
    console.error("[callLLMForClarifyThenAnswer] LLM call failed:", error);
    throw error;
  }
}

/**
 * Call LLM for low context fallback mode
 * Provides confident overview + 2-3 projects + 1 follow-up question
 * NO apologies for limited context - be confident and recruiter-friendly
 */
async function callLLMForLowContext(params: {
  question: string;
  contextBlob?: string;
  pagePath?: string;
  projectSlug?: string;
  allProjects?: Array<{
    slug: string;
    name: string;
    client?: string;
    role?: string;
    summary?: string;
  }>;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  mode?: string;
}): Promise<string> {
  const { question, contextBlob, pagePath, projectSlug, allProjects = [], history = [] } = params;

  // Get top 2-3 projects for context
  const topProjects = allProjects.slice(0, 3).map((p) => {
    const client = p.client ? ` for ${p.client}` : "";
    const role = p.role ? ` (${p.role})` : "";
    return `- ${p.name}${client}${role}`;
  });

  // Build context
  const projectsContext = topProjects.length > 0 
    ? `\n\nProjects Charles has worked on:\n${topProjects.join("\n")}`
    : "";

  const context = contextBlob 
    ? `${contextBlob}${projectsContext}`
    : `Charles is a design-minded engineer who works with RAG and generative UI.${projectsContext}`;

  let systemPrompt = "";
  let userMessage = "";

  const historySummary =
    history.length > 0
      ? history.map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`).join("\n")
      : "(no prior turns)";

  try {
    const systemMessage = await getModalGraphSystemMessage();
    systemPrompt = typeof systemMessage.content === "string" ? systemMessage.content : "";
    console.log("[PromptLoader] ✅ Loaded modal graph system message");
    userMessage = `
QUESTION:
${question ?? ""}

MODE: ${params.mode ?? "low_context_fallback"}

PAGE PATH: ${pagePath ?? "(none)"}
PROJECT SLUG: ${projectSlug ?? "(none)"}

CONTEXT:
${context ?? "(no extra context provided)"}

HISTORY:
${historySummary}
`.trim();
  } catch {
    console.warn("[PromptLoader] Falling back to modal graph prompt template");
    const template = await getModalGraphPromptTemplate();
    const formatted = await template.formatMessages({
      mode: params.mode ?? "low_context_fallback",
      question: question ?? "",
      context: context ?? "",
      pagePath: pagePath ?? "",
      projectSlug: projectSlug ?? "",
      history: historySummary,
    });
    const systemMsg = formatted.find((m: any) => m._getType?.() === "system" || m.type === "system");
    const humanMsg = formatted.find((m: any) => m._getType?.() === "human" || m.type === "human" || m.role === "user");
    const sysContent = (systemMsg as any)?.content;
    const humanContent = (humanMsg as any)?.content;
    systemPrompt = typeof sysContent === "string" ? sysContent : Array.isArray(sysContent) ? sysContent.join("\n") : "";
    userMessage = typeof humanContent === "string" ? humanContent : Array.isArray(humanContent) ? humanContent.join("\n") : "";
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 300,
      temperature: 0.3,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ] as any,
    });

    const answerText = 
      response.content[0]?.type === "text"
        ? response.content[0].text
        : "I'm having trouble generating a response right now. Could you try rephrasing your question?";

    return answerText.trim();
  } catch (error) {
    console.error("[callLLMForLowContext] LLM call failed:", error);
    throw error;
  }
}

/**
 * Determine if we should use the copywriter for this question
 * DISABLED: Copywriter should NOT refine conversational answers in ModalGraph
 * Copywriter should ONLY generate structured YAML for Orchestrator (UI blocks)
 */
function shouldUseCopywriter(
  state: ModalGraphState,
  baseAnswerText: string | null
): boolean {
  // Copywriter is disabled for conversational answers in Phase 10+
  return false;
}

/**
 * Convert copywriter output to modal graph state
 */
function convertAnswerBlocksToModalState(
  state: ModalGraphState,
  copywriterOutput: CopywriterOutput,
  baseAnswerText?: string,
): Partial<ModalGraphState> {
  const primaryBlock = copywriterOutput.answer_blocks?.[0];
  const answerText =
    primaryBlock?.body ??
    primaryBlock?.heading ??
    baseAnswerText ??
    "I'm having trouble generating a detailed answer from the copywriter output.";

  const debugNote = `[generate_answer] used copywriter; blocks=${copywriterOutput.answer_blocks?.length ?? 0}`;

  // Check if we got the fallback error message
  const isFallbackError = copywriterOutput.answer_blocks.some(
    (block) =>
      block.heading === "AI answer" &&
      block.body.includes("I ran into an issue while generating")
  );

  if (isFallbackError) {
    console.error("[ModalGraph] ⚠️ Copywriter returned fallback error - check server logs for actual error");
    // If copywriter returned error, use base answer instead
    if (baseAnswerText) {
      console.log("[ModalGraph] Using base answer due to copywriter fallback error");
      const history = state.history ?? [];
      return {
        ...state,
        answerText: baseAnswerText,
        history: trimHistory([...history, { role: "assistant" as const, content: baseAnswerText }]),
        debugNotes: [...(state.debugNotes ?? []), "[generate_answer] copywriter returned error, used base answer"],
      };
    }
  }

  const history = state.history ?? [];
  const updatedHistory = [
    ...history,
    { role: "assistant" as const, content: answerText },
  ];

  return {
    ...state,
    answerText,
    history: trimHistory(updatedHistory),
    debugNotes: [...(state.debugNotes ?? []), debugNote],
  };
}

/**
 * Convert AnswerBlocks to plain text for modal response
 */
function convertAnswerBlocksToModalText(
  answerBlocks: Array<{
    type: "answer_block";
    eyebrow: string;
    heading: string;
    body: string;
    imageId?: string | null;
  }>
): string {
  if (answerBlocks.length === 0) {
    return "I couldn't generate a response for that question. Could you try rephrasing it?";
  }

  // For modal, combine all blocks into a single text response
  // Format: heading + body for each block, separated by double newlines
  return answerBlocks
    .map((block) => {
      const parts: string[] = [];
      if (block.heading) parts.push(block.heading);
      if (block.body) parts.push(block.body);
      return parts.join("\n\n");
    })
    .join("\n\n");
}

// ============================================================
// HELPER: Portfolio Question Detection
// ============================================================

/**
 * Detect if a question is about the portfolio/site itself
 */
function isPortfolioQuestion(question: string): boolean {
  const q = question.toLowerCase();

  return (
    q.includes("portfolio") ||
    q.includes("this site") ||
    q.includes("this page") ||
    q.includes("this website") ||
    q.includes("this experience") ||
    q.includes("this interface") ||
    q.includes("pfaff.design") ||
    q.includes("your site") ||
    q.includes("how does this use ai") ||
    q.includes("how does this work") ||
    q.includes("how does the ai work") ||
    q.includes("command palette") ||
    q.includes("cmd+k") ||
    q.includes("cmd k") ||
    q.includes("composer") ||
    q.includes("keyboard shortcut") ||
    q.includes("inline chat") ||
    q.includes("ai modal") ||
    q.includes("ai-powered")
  );
}

/**
 * Detect if a question is portfolio-level (about the portfolio/site itself)
 * Used to determine when to include [PORTFOLIO_FACTS] on project pages
 */
function isPortfolioLevelQuestion(question: string): boolean {
  const q = question.toLowerCase();
  
  return (
    isPortfolioQuestion(question) ||
    q.includes("how does this portfolio use ai") ||
    q.includes("how does this site use ai") ||
    q.includes("what kind of work does charles do overall") ||
    q.includes("what kind of work does he do") ||
    q.includes("rag pipeline") ||
    q.includes("two-agent workflow") ||
    q.includes("generative ui") ||
    q.includes("deterministic ui")
  );
}

/**
 * Detect if a portfolio question is trivially direct (short, highly specific)
 * These should route to answer_direct instead of clarify_then_answer
 */
function isTriviallyDirectPortfolioQuestion(question: string): boolean {
  const q = question.toLowerCase();

  const directPhrases = [
    "what tech does this use",
    "what tech stack does this use",
    "what models power this",
    "how does cmd+k work",
    "how does the command palette work",
    "how does this ai work",
    "what powers this ai",
    "how does this portfolio use ai",
    "how does this site use ai"
  ];

  if (question.length <= 80) {
    if (directPhrases.some((phrase) => q.includes(phrase))) {
      return true;
    }
  }

  return false;
}

/**
 * Detect if a question is a site support request
 * Examples: "Something is broken", "How do I use this?", "Why doesn't this load?"
 */
function isSiteSupportRequest(question: string): boolean {
  const q = question.toLowerCase();

  return (
    q.includes("broken") ||
    q.includes("not working") ||
    q.includes("doesn't work") ||
    q.includes("doesn't load") ||
    q.includes("won't load") ||
    q.includes("error") ||
    q.includes("bug") ||
    q.includes("how do i use") ||
    q.includes("how to use") ||
    q.includes("how does this work") ||
    q.includes("what is this") ||
    q.includes("help me") ||
    q.includes("i need help")
  );
}

/**
 * Detect if a question is feedback or a comment
 * Examples: "This is cool", "I love this", "This is confusing"
 */
function isFeedbackOrComment(question: string): boolean {
  const q = question.toLowerCase();

  return (
    q.includes("this is cool") ||
    q.includes("this is great") ||
    q.includes("i love this") ||
    q.includes("this is awesome") ||
    q.includes("this is confusing") ||
    q.includes("this is interesting") ||
    q.includes("nice") ||
    q.includes("cool") ||
    q.startsWith("i like") ||
    q.startsWith("i don't like") ||
    q.startsWith("this sucks") ||
    q.startsWith("this is bad")
  );
}

/**
 * Detect if a question is about a specific case study/project
 */
function isCaseStudyQuestion(question: string | null | undefined, projectSlug?: string | null, projectName?: string): boolean {
  if (!question) return false;
  const q = question.toLowerCase();

  // Must be on a project page (has projectSlug or projectName)
  if (!projectSlug && !projectName) return false;

  // Phrases that strongly imply "this project" case-study intent
  const strongSignals = [
    "this project",
    "this work",
    "this case study",
    "on this page",
    "on this one",
  ];

  // Phrases that indicate role / contribution / tools / collaboration
  const roleSignals = [
    "what did you do",
    "what was your role",
    "what did charles do",
    "what did he do",
    "your role here",
    "how did you work",
    "how did you collaborate",
    "who did you work with",
    "what tools did you use",
    "what stack did you use",
    "how did you do this",
    "what did you build",
    "what did you do here",
    "what did you do on this",
  ];

  const hasStrongSignal = strongSignals.some((p) => q.includes(p));
  const hasRoleSignal = roleSignals.some((p) => q.includes(p));

  // Also check for explicit project name mention
  if (projectName) {
    const name = projectName.toLowerCase();
    if (q.includes(name)) return true;
  }

  return Boolean((projectSlug || projectName) && (hasStrongSignal || hasRoleSignal));
}

// ============================================================
// HELPER: Compute Context Scores
// ============================================================

/**
 * Compute context scores to help conversation policy make decisions
 */
function computeContextScores(state: ModalGraphState) {
  const { sectionText, retrievedChunks, projectSlug } = state;

  const hasSectionContext = !!sectionText && sectionText.trim().length > 0;
  const hasRetrieved = !!retrievedChunks && retrievedChunks.length > 0;

  const bestChunk = hasRetrieved ? retrievedChunks![0] : null;
  const topScore =
    (bestChunk as any)?.relevanceScore ??
    (bestChunk as any)?.score ??
    0;

  const topProject = (bestChunk as any)?.projectSlug ?? null;

  const crossProjectDrift =
    !!projectSlug &&
    !!topProject &&
    topProject !== projectSlug &&
    topScore > 0.6;

  return {
    hasSectionContext,
    hasRetrieved,
    topScore,
    crossProjectDrift,
  };
}

// ============================================================
// NODES
// ============================================================

async function deriveContextNode(state: ModalGraphState): Promise<Partial<ModalGraphState>> {
  const debugNotes = [
    ...(state.debugNotes ?? []),
    "derive_context: inspected pagePath/projectSlug/section",
    `entry: received history length=${(state.history ?? []).length}`,
  ];

  // Normalize projectSlug from pagePath (if not already set)
  let projectSlug = state.projectSlug;
  const pagePath = state.pagePath;

  if (pagePath && !projectSlug) {
    // Extract from pagePath
    const match = pagePath.match(/^\/work\/([^/]+)/);
    if (match) {
      projectSlug = match[1];
    }
  }

  // Normalize PMI-related paths to canonical slug
  if (pagePath && (
    pagePath.startsWith("/work/pmi") ||
    pagePath.startsWith("/work/pmi-agile") ||
    pagePath.startsWith("/work/pmi-acp")
  )) {
    projectSlug = "pmi";
    debugNotes.push("derive_context: normalized projectSlug to 'pmi' from pagePath");
  }

  // Optional: Alias detection in question text (if projectSlug still not set)
  if (!projectSlug && state.question) {
    const lowerQ = state.question.toLowerCase();
    if (
      lowerQ.includes("pmi acp") ||
      lowerQ.includes("pmi-acp") ||
      lowerQ.includes("pmi agile") ||
      lowerQ.includes("pmi.org")
    ) {
      projectSlug = "pmi";
      debugNotes.push("derive_context: normalized projectSlug to 'pmi' from question text");
    }
  }

  // Normalize any existing PMI variants to canonical slug
  if (projectSlug === "pmi-agile" || projectSlug === "pmi-acp" || projectSlug === "pmi-agile-certification") {
    projectSlug = "pmi";
    debugNotes.push("derive_context: normalized projectSlug variant to 'pmi'");
  }

  // Load project facts based on normalized projectSlug
  const projectFacts = await loadProjectFactsForSlug(projectSlug);
  
  if (projectFacts) {
    debugNotes.push(`derive_context: loaded projectFacts for ${projectSlug}`);
  }

  // Load all projects from KB
  const allProjects = await loadAllProjects();
  debugNotes.push(`derive_context: loaded allProjects (${allProjects.length} projects)`);

  return {
    ...state,
    projectSlug,
    projectFacts,
    allProjects,
    debugNotes,
  };
}

async function retrieveChunksNode(state: ModalGraphState): Promise<Partial<ModalGraphState>> {
  const debugNotes = [
    ...(state.debugNotes ?? []),
    "retrieve_chunks: calling Supabase RAG",
  ];

  const question = state.question ?? "";
  const queryParts = [
    question,
    state.sectionHeadline ?? "",
    state.sectionText ?? "",
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const isProjectQuery = !!state.projectSlug;

  const homepageDocTypes = [
    "master_profile",
    "skills",
    "faq",
    "philosophy",
    "work_style",
    "project",
    "context",      // 👈 important
  ];
  
  const projectDocTypes = [
    "project",
    "master_profile",
    "context",      // 👈 also okay here for now
  ];

  // Fetch from Supabase RAG
  const rawChunks = await retrieveProjectChunks(queryParts || question, {
    projectId: state.projectSlug,
    matchCount: isProjectQuery ? 20 : 24,
    docTypes: isProjectQuery ? projectDocTypes : homepageDocTypes,
  });

  // Debug: inspect retrieved chunk metadata
  // eslint-disable-next-line no-console
  console.log(
    "[retrieve_chunks] rawChunks",
    rawChunks.map((c) => ({
      projectId: c.projectId,
      docType: c.docType,
      score: c.score,
    })),
  );

  // Sort by score desc
  const sorted = [...rawChunks].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const topScore = sorted[0]?.score ?? 0;

  // Apply score cutoff and max counts
  const scoreThreshold = 0.15;
  const filtered = sorted.filter((c) => (c.score ?? 0) >= scoreThreshold);

  const hadAnyRawChunks = rawChunks.length > 0;

  const maxCount = isProjectQuery ? 10 : 12;

  let sliced: RetrievedChunk[] = [];

  if (isProjectQuery) {
    sliced = filtered.slice(0, maxCount);
  } else {
    // Homepage/global: prefer mix, max 3 per project
    const perProjectLimit = 3;
    const counts = new Map<string, number>();
    for (const chunk of filtered) {
      if (sliced.length >= maxCount) break;
      const projectKey = chunk.projectId || "global";
      const currentCount = counts.get(projectKey) ?? 0;
      if (projectKey !== "global" && currentCount >= perProjectLimit) continue;
      counts.set(projectKey, currentCount + 1);
      sliced.push(chunk);
    }
  }

  // If we had raw chunks but filtering removed them all,
  // treat this as "weak retrieval" instead of "no retrieval":
  // keep the top few chunks (even if below the score threshold)
  if (sliced.length === 0 && hadAnyRawChunks) {
    const fallbackMax = Math.min(maxCount, 3);
    sliced = sorted.slice(0, fallbackMax);
    debugNotes.push(
      `retrieve_chunks: all chunks fell below threshold; keeping top ${fallbackMax} as weak retrieval (topScore=${topScore.toFixed(
        3
      )})`,
    );
  }

  debugNotes.push(
    `retrieve_chunks: raw=${rawChunks.length} filtered=${filtered.length} kept=${sliced.length} topScore=${topScore.toFixed(
      3,
    )}`,
  );

  // Preserve history and projectFacts
  return {
    ...state,
    retrievedChunks: sliced.map((c) => ({
      text: c.text,
      relevanceScore: c.score,
      projectSlug: c.projectId ?? c.source ?? null,
    })),
    projectFacts: state.projectFacts,
    allProjects: state.allProjects,
    debugNotes,
  };
}

async function buildContextBlobNode(state: ModalGraphState): Promise<Partial<ModalGraphState>> {
  const debugNotes = [...(state.debugNotes ?? [])];
  
  const contextSections: string[] = [];

  // [PROFILE]
  const profileSlice = formatProfileSlice();
  if (profileSlice.trim().length > 0) {
    contextSections.push("[PROFILE]");
    contextSections.push(profileSlice.trim());
    debugNotes.push("build_context_blob: added [PROFILE] from master profile");
  } else {
    debugNotes.push("build_context_blob: profile slice empty");
    }

  // [PROJECT_FACTS]
    if (state.projectFacts) {
    const facts: string[] = [];
    if (state.projectFacts.name) facts.push(`Name: ${state.projectFacts.name}`);
    if (state.projectFacts.client) facts.push(`Client: ${state.projectFacts.client}`);
    if (state.projectFacts.role) facts.push(`Role: ${state.projectFacts.role}`);
    if (state.projectFacts.summary) facts.push(`Summary: ${state.projectFacts.summary}`);
    if (state.projectFacts.tools?.length) {
      facts.push(`Tools: ${state.projectFacts.tools.join(", ")}`);
      }
    if (facts.length > 0) {
      contextSections.push("[PROJECT_FACTS]");
      contextSections.push(facts.join("\n"));
      debugNotes.push("build_context_blob: added [PROJECT_FACTS]");
    }
  }

  // [PROJECT_SUMMARY] specific to current project (canonical KB)
  if (state.projectSlug) {
    const summary = loadProjectSummary(state.projectSlug);
    if (summary.trim().length > 0) {
      contextSections.push("[PROJECT_SUMMARY]");
      contextSections.push(summary.trim());
      debugNotes.push(`build_context_blob: added [PROJECT_SUMMARY] for ${state.projectSlug}`);
    } else {
      debugNotes.push(`build_context_blob: project summary empty for ${state.projectSlug}`);
    }
  }

  // [RETRIEVED_CONTEXT]
  const retrieved = state.retrievedChunks ?? [];
  if (retrieved.length > 0) {
    const formatted = buildContextFromChunks(convertModalChunksToRetrievedChunks(retrieved));
    if (formatted.trim().length > 0) {
      contextSections.push("[RETRIEVED_CONTEXT]");
      contextSections.push(formatted.trim());
      debugNotes.push(`build_context_blob: added [RETRIEVED_CONTEXT] (${retrieved.length} chunks)`);
    }
  }

  // [FAQ] only on homepage/global to keep concise
  const isHomeOrGlobal = !state.projectSlug;
  if (isHomeOrGlobal) {
    const faqSlice = loadFaqSlice(5);
    if (faqSlice.length > 0) {
      contextSections.push("[FAQ]");
      contextSections.push(
        faqSlice
          .map((item) => `Q: ${item.q}\nA: ${item.a}`)
          .join("\n\n"),
      );
      debugNotes.push("build_context_blob: added [FAQ] slice");
  }
  }

  const blob = contextSections.join("\n\n").trim();
  debugNotes.push(`build_context_blob: length=${blob.length}`);

  return {
    ...state,
    contextBlob: blob,
    allProjects: state.allProjects,
    debugNotes,
  };
}

async function conversationPolicyNode(state: ModalGraphState): Promise<Partial<ModalGraphState>> {
  const retrievedChunks = state.retrievedChunks ?? [];
  const sorted = [...retrievedChunks].sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));
  const topScore =
    (sorted[0]?.relevanceScore ?? 0) ||
    (sorted[0] as any)?.score ||
    0;

  const debugNotes = [...(state.debugNotes ?? []), "[conversation_policy] routing by retrieval strength"];

  let mode: ConversationMode;

  if (retrievedChunks.length === 0) {
    mode = "low_context_fallback";
    debugNotes.push("[conversation_policy] no chunks → low_context_fallback");
  } else if (topScore >= 0.15) {
      mode = "answer_direct";
    debugNotes.push(`[conversation_policy] strong retrieval (topScore=${topScore.toFixed(3)}) → answer_direct`);
  } else {
    mode = "clarify_then_answer";
    debugNotes.push(`[conversation_policy] weak retrieval (topScore=${topScore.toFixed(3)}) → clarify_then_answer`);
  }

  return {
    ...state,
    mode,
    debugNotes,
  };
}

async function generateAnswerNode(state: ModalGraphState): Promise<Partial<ModalGraphState>> {
  const { question, mode, sectionHeadline, sectionText, contextBlob, history: stateHistory, pagePath, projectSlug } = state;
  const history = stateHistory ?? [];
  
  const debugNotes = [
    ...(state.debugNotes ?? []),
  ];

  console.log("[generate_answer] mode=", mode, "question=", question.substring(0, 100));

  const facts = state.projectFacts;
  const allProjects = state.allProjects ?? [];

  // Step 1: Handle deterministic paths first (tools, projects) - these return early
  const questionLower = question.toLowerCase();
  const toolsQ =
    questionLower.includes("tools") ||
    questionLower.includes("tech stack") ||
    questionLower.includes("technologies") ||
    questionLower.includes("stack did you use") ||
    questionLower.includes("what did you use");
  const projectsQ =
    questionLower.includes("other projects") ||
    questionLower.includes("worked on") ||
    questionLower.includes("another project") ||
    questionLower.includes("different project") ||
    questionLower.includes("highlight a specific one") ||
    questionLower.includes("tell me about his other work");
  const projectsAndToolsQ = projectsQ && toolsQ;

  // Deterministic paths return early
  if (projectsAndToolsQ && allProjects.length > 0) {
    const current = allProjects.find((p) => p.slug === state.projectSlug);
    const currentTools = new Set(current?.tools ?? []);
    const related = allProjects.filter((p) => {
      if (p.slug === state.projectSlug) return false;
      if (!p.tools || p.tools.length === 0) return false;
      return p.tools.some((t) => currentTools.has(t));
    });
    const topRelated = related.slice(0, 3);
    if (topRelated.length > 0) {
      const currentProjectName = current?.name ?? "this project";
      const answer = [
        `Great question. Beyond this ${currentProjectName} work, there are a few other projects where Charles used a similar stack:`,
        ...topRelated.map((p) => {
          const client = p.client ? ` for ${p.client}` : "";
          const tools = p.tools?.join(", ") ?? "the same core tools";
          return `- ${p.name}${client} — using ${tools}`;
        }),
        "If you'd like, I can go deeper on one of those projects.",
      ].join("\n");
      return {
        ...state,
        answerText: answer,
        history: trimHistory([...history, { role: "assistant" as const, content: answer }]),
        debugNotes: [...debugNotes, "generate_answer: cross-project-tools"],
      };
    }
  }

  if (toolsQ && !projectsQ && state.projectSlug && allProjects.length > 0) {
    const current = allProjects.find((p) => p.slug === state.projectSlug);
    const tools = current?.tools ?? [];
    const projectLabel = getProjectLabel(state.projectSlug, state.projectFacts);
    if (tools.length > 0) {
      const answer = [
        projectLabel ? `${projectLabel}:` : "For this project:",
        "For this project, Charles used:",
        ...tools.map((t) => `- ${t}`),
        "These tools supported a modular, maintainable front-end that could evolve over time.",
      ].join("\n");
      return {
        ...state,
        answerText: answer,
        history: trimHistory([...history, { role: "assistant" as const, content: answer }]),
        debugNotes: [...debugNotes, "generate_answer: deterministic tools answer"],
      };
    }
  }

  if (projectsQ && !toolsQ && allProjects.length > 0) {
    const others = allProjects.filter((p) => p.slug !== state.projectSlug);
    // List ALL case studies, not just 3
    if (others.length > 0) {
      const answer = [
        "Outside of this project, Charles has worked on several others:",
        ...others.map((p) => {
          const client = p.client ? ` for ${p.client}` : "";
          const role = p.role ? ` (${p.role})` : "";
          const summary = p.summary ?? "";
          return `- ${p.name}${client}${role}${summary ? ` — ${summary}` : ""}`;
        }),
        "If one of those sounds interesting, I can go deeper on it.",
      ].join("\n");
      return {
        ...state,
        answerText: answer,
        history: trimHistory([...history, { role: "assistant" as const, content: answer }]),
        debugNotes: [...debugNotes, "generate_answer: project-list"],
      };
    }
  }

  // Step 2: Handle each mode to get baseAnswerText
  let baseAnswerText: string;
  let baseDebugNote: string;

  try {
    if (mode === "low_context_fallback") {
      console.log("[generate_answer] Handling low_context_fallback mode");
      baseAnswerText = await callLLMForLowContext({
        question,
        contextBlob,
        pagePath,
        projectSlug,
        allProjects: state.allProjects ?? [],
        history: state.history ?? [],
        mode: state.mode,
      });
      baseDebugNote = "[generate_answer] handled low_context_fallback via LLM";
    } else if (mode === "answer_direct") {
      console.log("[generate_answer] Handling answer_direct mode");
      baseAnswerText = await callLLMForAnswerDirect({
        question,
        contextBlob,
        pagePath,
        projectSlug,
        history: state.history ?? [],
        mode: state.mode,
      });
      baseDebugNote = "[generate_answer] handled answer_direct via LLM";
    } else if (mode === "clarify_then_answer") {
      console.log("[generate_answer] Handling clarify_then_answer mode");
      baseAnswerText = await callLLMForClarifyThenAnswer({
        question,
        contextBlob,
        pagePath,
        projectSlug,
        history: state.history ?? [],
        mode: state.mode,
      });
      baseDebugNote = "[generate_answer] handled clarify_then_answer via LLM";
    } else {
      // Fallback for unknown mode
      console.warn("[generate_answer] Unknown mode:", mode, "using clarify_then_answer");
      baseAnswerText = await callLLMForClarifyThenAnswer({
        question,
        contextBlob,
        pagePath,
        projectSlug,
        history: state.history ?? [],
      });
      baseDebugNote = `[generate_answer] unknown mode ${mode}, used clarify_then_answer`;
    }
    
    // Add debug note indicating unified tone rules were applied
    debugNotes.push("[generate_answer] applied unified tone rules");
  } catch (err) {
    console.error("[generate_answer] Base LLM call failed:", err);
    baseAnswerText = "Something went wrong while generating that answer. I can still help though—try asking again or narrowing the question.";
    baseDebugNote = "[generate_answer] base LLM call failed, returned fallback message";
  }

  const nodeMetadata = buildRunMetadata({
    ...state,
    answerText: baseAnswerText,
  } as ModalGraphState);
  debugNotes.push(`[metadata] ${JSON.stringify(nodeMetadata)}`);

  // Step 3: Copywriter is disabled for conversational answers
  // Copywriter should ONLY generate structured YAML for Orchestrator (UI blocks), NOT conversational text
  const useCopywriter = shouldUseCopywriter(state, baseAnswerText);
    debugNotes.push(
    `[generate_answer] copywriter disabled for chat`
    );
    
  if (useCopywriter) {
    // This should never execute since shouldUseCopywriter always returns false
    // But if it does, log and return base answer
    debugNotes.push("[generate_answer] copywriter disabled for chat");
    const updatedHistory = [
      ...history,
      { role: "assistant" as const, content: baseAnswerText },
    ];
    return {
      ...state,
      answerText: baseAnswerText,
      history: trimHistory(updatedHistory),
      debugNotes: [
        ...debugNotes,
        baseDebugNote,
        "[generate_answer] copywriter was disabled, used base answer",
      ],
    };
  }

  // Step 4: If we don't use copywriter, return the base answer
  const updatedHistory = [
    ...history,
    { role: "assistant" as const, content: baseAnswerText },
  ];

  return {
    ...state,
    answerText: baseAnswerText,
    history: trimHistory(updatedHistory),
    debugNotes: [
      ...debugNotes,
      baseDebugNote,
      "[generate_answer] used base LLM answer only",
    ],
  };
}

const graph = new StateGraph(ModalGraphStateAnnotation)
  .addNode("derive_context", deriveContextNode)
  .addNode("retrieve_chunks", retrieveChunksNode)
  .addNode("build_context_blob", buildContextBlobNode)
  .addNode("conversation_policy", conversationPolicyNode)
  .addNode("generate_answer", generateAnswerNode)
  .addEdge(START, "derive_context")
  .addEdge("derive_context", "retrieve_chunks")
  .addEdge("retrieve_chunks", "build_context_blob")
  .addEdge("build_context_blob", "conversation_policy")
  .addEdge("conversation_policy", "generate_answer")
  .addEdge("generate_answer", END);

export const modalGraphApp = graph.compile();

