import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { getProjectBySlug, getAllProjects, formatGlobalAboutSections } from "@/lib/kb/loader";
import { runCopywriter } from "./copywriter";
import type { CopywriterInput, CopywriterOutput } from "./copywriterSchemas";
import type { RetrievedChunk } from "@/lib/rag/retrieveProjectChunks";
import { buildContextFromChunks } from "@/lib/rag/retrieveProjectChunks";
import { anthropic } from "./client";
import { caseStudies } from "@/lib/caseStudies/data";

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


// ============================================================
// SHARED TONE BLOCK
// ============================================================

const TONE_BLOCK = `
Tone & style:
- Sound like a short-form 99% Invisible / NPR segment: calm, observant, and precise.
- Keep answers under ~220 words total (aim for 1–3 short paragraphs).
- Use short sentences. Be professional and approachable, not hypey.
- Avoid clichés and marketing speak.
- Never use stage directions (e.g., "leans in", "smiles") or meta-commentary.
- Avoid "AI-speak" like "leveraging cutting-edge" or "As an AI".
- You may use **bold** occasionally to highlight 1–2 key phrases, but do not overuse it.

Lead with the answer (critical):
- Start with 1–2 short paragraphs that directly answer the question before any background or context.
- The **first sentence must directly answer the user's question** as clearly as possible.
- Do not start with biography, portfolio overview, or meta commentary. Go straight to the answer.
- Do not warm up with phrases like "Great question" or "From what I can see".
- Additional context, nuance, or examples comes **after** the direct answer.
`.trim();

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

  const systemPrompt = `You are an assistant that answers questions about Charles Pfaff and his portfolio.

${TONE_BLOCK}

Modes:
- You receive a \`mode\` field: "answer_direct", "clarify_then_answer", or "low_context_fallback".
- You must follow the behavioral rules for that mode.

1) answer_direct
- The user's question is clear enough to answer directly.
- Start with a direct answer in the very first sentence.
- Provide a focused answer in 1–2 short paragraphs.
- Do **not** end with a direct question.
- You may end with a single, gentle invitation like: "If you'd like, I can go deeper into the collaboration side."

2) clarify_then_answer
- The question is somewhat broad or ambiguous, but you can still give a helpful first pass.
- First sentence: directly answer as best you can based on the context.
- Then provide a bit more detail or framing.
- End with **exactly one** clear follow-up question that helps narrow what they want to know next.

3) low_context_fallback
- There is little or no section context and retrieval is weak.
- Give a brief overview (2–3 sentences) of who Charles is and the kind of work he does.
- Mention 2–3 representative projects by name.
- End with **exactly one** guiding follow-up question.

Project vs. portfolio behavior (CRITICAL):
- When \`projectSlug\` is set and [PROJECT_FACTS] are present, treat this as a project-specific question.
- Focus your answer on this project first before mentioning anything else.
- Structure your answer in this order:
  1. Client + project name
  2. Charles's role
  3. What he actually did (concrete actions, not just responsibilities)
  4. Tools / stack he used
  5. How he worked with other disciplines (design, product, engineering)
  6. Impact / why it mattered
- Use [PROJECT_FACTS], [ROLE], [TOOLS], [PROCESS], and [IMPACT] as your primary source.
- Do **not** start by talking about other projects or the broader portfolio.
- Only mention the broader portfolio at the end if relevant: "This fits into his broader work by…"
- Only bring in other projects when the user explicitly asks for comparisons or "other examples".
- The [PORTFOLIO_FACTS] section is mainly for portfolio-wide questions (e.g., "How does this portfolio use AI?", "What kind of work does Charles do overall?").

Portfolio questions:
- On the homepage ("/") or when \`projectSlug\` indicates the portfolio itself:
  - Answer questions about how the portfolio uses AI (RAG pipeline, two-agent workflow, deterministic UI, command palette, conversational modal).
  - Keep the explanation short and concrete.
  - You may end with a light invitation like: "If you'd like, I can unpack how the command palette works with the AI layer."

Grounding & accuracy:
- Stay consistent with the structured context you see.
- When projects are mentioned, stick to the provided names and roles (e.g., Capital One Travel, Coca-Cola AI work, Project Management Institute, generative-UI portfolio).
- **NEVER mention Tanger or Tanger Outlets** - this project is temporarily hidden and should not be referenced.
- Do not invent new clients, roles, or technologies that are not implied by the context.
- If the context is thin, give a modest, grounded answer and use the mode rules (especially clarify_then_answer and low_context_fallback).

Formatting:
- Use plain paragraphs for most answers.
- Use bullet points only when the user explicitly asks for a list or when the question is naturally list-like (e.g., "What tools did you use?").
- Keep everything easy to scan for a recruiter or hiring manager.`;

  // Format history summary
  const historySummary = history.length > 0
    ? history
        .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n")
    : "(no prior turns)";

  // Build user message with MODE included
  const userMessage = `
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

  const systemPrompt = `You are an assistant that answers questions about Charles Pfaff and his portfolio.

${TONE_BLOCK}

Modes:
- You receive a \`mode\` field: "answer_direct", "clarify_then_answer", or "low_context_fallback".
- You must follow the behavioral rules for that mode.

1) answer_direct
- The user's question is clear enough to answer directly.
- Start with a direct answer in the very first sentence.
- Provide a focused answer in 1–2 short paragraphs.
- Do **not** end with a direct question.
- You may end with a single, gentle invitation like: "If you'd like, I can go deeper into the collaboration side."

2) clarify_then_answer
- The question is somewhat broad or ambiguous, but you can still give a helpful first pass.
- First sentence: directly answer as best you can based on the context.
- Then provide a bit more detail or framing.
- End with **exactly one** clear follow-up question that helps narrow what they want to know next.

3) low_context_fallback
- There is little or no section context and retrieval is weak.
- Give a brief overview (2–3 sentences) of who Charles is and the kind of work he does.
- Mention 2–3 representative projects by name.
- End with **exactly one** guiding follow-up question.

Project vs. portfolio behavior (CRITICAL):
- When \`projectSlug\` is set and [PROJECT_FACTS] are present, treat this as a project-specific question.
- Focus your answer on this project first before mentioning anything else.
- Structure your answer in this order:
  1. Client + project name
  2. Charles's role
  3. What he actually did (concrete actions, not just responsibilities)
  4. Tools / stack he used
  5. How he worked with other disciplines (design, product, engineering)
  6. Impact / why it mattered
- Use [PROJECT_FACTS], [ROLE], [TOOLS], [PROCESS], and [IMPACT] as your primary source.
- Do **not** start by talking about other projects or the broader portfolio.
- Only mention the broader portfolio at the end if relevant: "This fits into his broader work by…"
- Only bring in other projects when the user explicitly asks for comparisons or "other examples".
- The [PORTFOLIO_FACTS] section is mainly for portfolio-wide questions (e.g., "How does this portfolio use AI?", "What kind of work does Charles do overall?").

Portfolio questions:
- On the homepage ("/") or when \`projectSlug\` indicates the portfolio itself:
  - Answer questions about how the portfolio uses AI (RAG pipeline, two-agent workflow, deterministic UI, command palette, conversational modal).
  - Keep the explanation short and concrete.
  - You may end with a light invitation like: "If you'd like, I can unpack how the command palette works with the AI layer."

Grounding & accuracy:
- Stay consistent with the structured context you see.
- When projects are mentioned, stick to the provided names and roles (e.g., Capital One Travel, Coca-Cola AI work, Project Management Institute, generative-UI portfolio).
- **NEVER mention Tanger or Tanger Outlets** - this project is temporarily hidden and should not be referenced.
- Do not invent new clients, roles, or technologies that are not implied by the context.
- If the context is thin, give a modest, grounded answer and use the mode rules (especially clarify_then_answer and low_context_fallback).

Formatting:
- Use plain paragraphs for most answers.
- Use bullet points only when the user explicitly asks for a list or when the question is naturally list-like (e.g., "What tools did you use?").
- Keep everything easy to scan for a recruiter or hiring manager.`;

  // Format history summary
  const historySummary = history.length > 0
    ? history
        .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n")
    : "(no prior turns)";

  // Build user message with MODE included
  const userMessage = `
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

  const systemPrompt = `You are an assistant that answers questions about Charles Pfaff and his portfolio.

${TONE_BLOCK}

Modes:
- You receive a \`mode\` field: "answer_direct", "clarify_then_answer", or "low_context_fallback".
- You must follow the behavioral rules for that mode.

1) answer_direct
- The user's question is clear enough to answer directly.
- Start with a direct answer in the very first sentence.
- Provide a focused answer in 1–2 short paragraphs.
- Do **not** end with a direct question.
- You may end with a single, gentle invitation like: "If you'd like, I can go deeper into the collaboration side."

2) clarify_then_answer
- The question is somewhat broad or ambiguous, but you can still give a helpful first pass.
- First sentence: directly answer as best you can based on the context.
- Then provide a bit more detail or framing.
- End with **exactly one** clear follow-up question that helps narrow what they want to know next.

3) low_context_fallback
- There is little or no section context and retrieval is weak.
- Give a brief overview (2–3 sentences) of who Charles is and the kind of work he does.
- Mention 2–3 representative projects by name.
- End with **exactly one** guiding follow-up question.

Project vs. portfolio behavior (CRITICAL):
- When \`projectSlug\` is set and [PROJECT_FACTS] are present, treat this as a project-specific question.
- Focus your answer on this project first before mentioning anything else.
- Structure your answer in this order:
  1. Client + project name
  2. Charles's role
  3. What he actually did (concrete actions, not just responsibilities)
  4. Tools / stack he used
  5. How he worked with other disciplines (design, product, engineering)
  6. Impact / why it mattered
- Use [PROJECT_FACTS], [ROLE], [TOOLS], [PROCESS], and [IMPACT] as your primary source.
- Do **not** start by talking about other projects or the broader portfolio.
- Only mention the broader portfolio at the end if relevant: "This fits into his broader work by…"
- Only bring in other projects when the user explicitly asks for comparisons or "other examples".
- The [PORTFOLIO_FACTS] section is mainly for portfolio-wide questions (e.g., "How does this portfolio use AI?", "What kind of work does Charles do overall?").

Portfolio questions:
- On the homepage ("/") or when \`projectSlug\` indicates the portfolio itself:
  - Answer questions about how the portfolio uses AI (RAG pipeline, two-agent workflow, deterministic UI, command palette, conversational modal).
  - Keep the explanation short and concrete.
  - You may end with a light invitation like: "If you'd like, I can unpack how the command palette works with the AI layer."

Grounding & accuracy:
- Stay consistent with the structured context you see.
- When projects are mentioned, stick to the provided names and roles (e.g., Capital One Travel, Coca-Cola AI work, Project Management Institute, generative-UI portfolio).
- **NEVER mention Tanger or Tanger Outlets** - this project is temporarily hidden and should not be referenced.
- Do not invent new clients, roles, or technologies that are not implied by the context.
- If the context is thin, give a modest, grounded answer and use the mode rules (especially clarify_then_answer and low_context_fallback).

Formatting:
- Use plain paragraphs for most answers.
- Use bullet points only when the user explicitly asks for a list or when the question is naturally list-like (e.g., "What tools did you use?").
- Keep everything easy to scan for a recruiter or hiring manager.`;

  // Format history summary
  const historySummary = history.length > 0
    ? history
        .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n")
    : "(no prior turns)";

  // Build user message with MODE included
  const userMessage = `
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
    "retrieve_chunks: stubbed (no Supabase call yet)",
  ];

  let retrievedChunks: Array<{
    text: string;
    relevanceScore?: number;
    projectSlug?: string | null;
  }> = [];

  // For capital-one-travel, provide structured project context
  if (state.projectSlug === "capital-one-travel") {
    const capitalOneContext = `
[PROJECT_FACTS]
Client: Capital One
Project: Capital One Travel – Airport lounges & rewards experience
Role: Front-end engineer via AKQA
Summary: Charles helped design and implement a modular front-end experience for Capital One Travel, focusing on airport lounges and travel rewards.
Team: Product designers, art directors, product owners, engineers.

[ROLE]
Charles translated detailed design specs into modular, reusable UI components.
He worked closely with designers and back-end teams to ensure alignment.
He helped ensure the UI could scale for future travel experiences.

[TOOLS]
- React
- TypeScript
- Next.js
- Storybook
- Figma

[PROCESS]
- Broke high-fidelity designs into reusable UI components.
- Collaborated with designers on interactions and edge cases.
- Integrated with backend APIs.
- Evolved UI patterns to support future flows.

[IMPACT]
- Improved consistency across Capital One Travel.
- Reduced engineering overhead for new features.
- Enabled faster assembly of new experiences.

[OTHER_SECTIONS]
- Overview
- Built to flex
- Travel rewards, refined
`.trim();

    retrievedChunks = [
      {
        text: capitalOneContext,
        relevanceScore: 0.85,
        projectSlug: "capital-one-travel",
      },
    ];
  } else if (state.projectSlug === "pmi") {
    // For PMI, provide structured project context
    const pmiContext = `
[PROJECT_FACTS]
Client: Project Management Institute
Project: PMI.org Redesign
Role: Front-end engineer & technologist
Summary: Redesigned PMI.org with a modular component system and improvements to IA, navigation, and template consistency across a content-heavy site.

[ROLE]
Charles worked as a front-end engineer and technologist on the redesign of PMI.org, focusing on modular components, information architecture, and template consistency.

[TOOLS]
- React
- TypeScript
- Next.js
- Storybook
- Figma

[PROCESS]
- Broke high-fidelity designs into reusable components.
- Improved information architecture consistency.
- Partnered with UX to refine complex layouts.
- Maintained component integrity during iterative development.

[IMPACT]
- Cleaner, more intuitive navigation.
- Reusable patterns across templates.
- Scalable frontend system for future updates.
`.trim();

    retrievedChunks = [
      {
        text: pmiContext,
        relevanceScore: 0.85,
        projectSlug: "pmi",
      },
    ];
  } else if (state.projectSlug === "pfaff-designs") {
    // For Pfaff.design, provide structured project context
    const pfaffDesignsContext = `
[PROJECT_FACTS]
Client: Self-initiated
Project: Pfaff.design
Role: Design Engineer / Applied AI Technologist
Summary: A portfolio that treats communication as both narrative and conversation. Static pages provide clear case studies, while an embedded agent lets people ask questions, pull in extra context, and explore the structure and systems that support the work.

[ROLE]
Charles worked as a Design Engineer and Applied AI Technologist on this self-initiated project. He defined the overall concept, designed and implemented the front-end, structured the knowledge base, and designed the AI orchestration layer.

[TOOLS]
- React
- Next.js
- TypeScript
- Tailwind CSS
- Design engineering
- Applied AI orchestration
- RAG and structured knowledge bases
- UX writing and narrative design

[PROCESS]
- Started with planning, research, and questions about how a generative front end should behave and communicate.
- Explored a fully generative version but shifted to a static site with a structured system underneath.
- Designed the knowledge base using YAML and JSON for clear, typed content representation.
- Built intent routing, schemas, and orchestration layer for the embedded agent.
- Tested prompts and added guardrails to keep the system predictable and honest.

[IMPACT]
- Delivered a working portfolio that tells clear stories while also exposing structure and systems.
- Created an embedded agent that answers questions using only curated knowledge base content.
- Developed a practical framework for combining static narrative pages with conversational exploration.
- Deepened experience with building AI-assisted interfaces that stay grounded and predictable.
`.trim();

    retrievedChunks = [
      {
        text: pfaffDesignsContext,
        relevanceScore: 0.85,
        projectSlug: "pfaff-designs",
      },
    ];
  } else {
    // For any other project, leave empty array
    retrievedChunks = [];
  }

  // Preserve history and projectFacts
  return {
    ...state,
    retrievedChunks,
    projectFacts: state.projectFacts,
    allProjects: state.allProjects,
    debugNotes,
  };
}

async function buildContextBlobNode(state: ModalGraphState): Promise<Partial<ModalGraphState>> {
  const question = state.question || "";
  const isOnHomePage = state.pagePath === "/";
  const isOnProjectPage = !!state.projectSlug && state.pagePath !== "/";
  const isPortfolioLevel = isPortfolioLevelQuestion(question);
  
  // Build a structured contextBlob
  let blob = [
    `PAGE PATH: ${state.pagePath || "(not provided)"}`,
    `PROJECT: ${state.projectSlug || "(not provided)"}`,
    `SECTION: ${state.sectionHeadline || "(not provided)"}`,
    `SECTION TEXT: ${state.sectionText || "(no section text provided)"}`,
  ].join("\n");

  const debugNotes = [...(state.debugNotes ?? [])];
  
  // On homepage: prioritize [PORTFOLIO_FACTS], only show project details when explicitly referenced
  if (isOnHomePage) {
    blob += "\n\n[PORTFOLIO_FACTS]\n";
    blob += "This portfolio is an AI-powered experience that uses a RAG pipeline and a two-agent workflow (Copywriter + Orchestrator) to generate recruiter-friendly content.\n";
    blob += "The system retrieves structured knowledge about Charles's projects, synthesizes it into clear case studies, and renders them via a deterministic, JSON-driven UI using a whitelisted component registry.\n";
    blob += "It also powers a conversational AI modal, a global Cmd+K command palette, and generative-UI layouts that adapt to the user's questions.";
    debugNotes.push("build_context_blob: homepage - prioritized [PORTFOLIO_FACTS]");
    
    // Only include project details if question explicitly references projects
    const questionRefsProjects = question.toLowerCase().includes("project") || 
                                 question.toLowerCase().includes("work") ||
                                 question.toLowerCase().includes("case study");
    
    if (questionRefsProjects && state.allProjects && state.allProjects.length > 0) {
      blob += "\n\n--- PROJECTS ---\n";
      for (const p of state.allProjects.slice(0, 5)) {
        const parts: string[] = [];
        parts.push(p.name);
        if (p.client && p.name !== p.client) parts.push(`(${p.client})`);
        if (p.role) parts.push(`— ${p.role}`);
        blob += `- ${parts.join(" ")}\n`;
      }
      debugNotes.push("build_context_blob: included projects (homepage, question references projects)");
    }
  }
  // On project pages: prioritize [PROJECT_FACTS], suppress [PORTFOLIO_FACTS] unless portfolio-level question
  else if (isOnProjectPage) {
    // Add retrieved chunks (project context) first
    if (state.retrievedChunks && state.retrievedChunks.length > 0) {
      const chunksText = state.retrievedChunks.map((chunk) => chunk.text).join("\n\n");
      blob += `\n\n[PROJECT_FACTS]\n${chunksText}`;
      debugNotes.push(`build_context_blob: included ${state.retrievedChunks.length} retrieved chunks`);
    }

    // Enrich with projectFacts
    if (state.projectFacts) {
      const { name, client, role, summary, tools } = state.projectFacts;
      if (!blob.includes("[PROJECT_FACTS]")) {
        blob += "\n\n[PROJECT_FACTS]\n";
      }
      if (name) blob += `Name: ${name}\n`;
      if (client) blob += `Client: ${client}\n`;
      if (role) blob += `Role: ${role}\n`;
      if (summary) blob += `Summary: ${summary}\n`;
      if (tools && tools.length) {
        blob += `Tools: ${tools.join(", ")}\n`;
      }
      debugNotes.push("build_context_blob: enriched with projectFacts");
    }

    // Only add [PORTFOLIO_FACTS] if question is portfolio-level
    if (isPortfolioLevel) {
      blob += "\n\n[PORTFOLIO_FACTS]\n";
      blob += "This portfolio is an AI-powered experience that uses a RAG pipeline and a two-agent workflow (Copywriter + Orchestrator) to generate recruiter-friendly content.\n";
      blob += "The system retrieves structured knowledge about Charles's projects, synthesizes it into clear case studies, and renders them via a deterministic, JSON-driven UI using a whitelisted component registry.\n";
      blob += "It also powers a conversational AI modal, a global Cmd+K command palette, and generative-UI layouts that adapt to the user's questions.";
      debugNotes.push("build_context_blob: included [PORTFOLIO_FACTS] (portfolio-level question)");
    } else {
      debugNotes.push("build_context_blob: suppressed [PORTFOLIO_FACTS] (project page, non-portfolio question)");
    }

    // Add other projects only if explicitly asked
    const questionAsksForOtherProjects = question.toLowerCase().includes("other") ||
                                        question.toLowerCase().includes("another") ||
                                        question.toLowerCase().includes("different") ||
                                        question.toLowerCase().includes("compare");
    
    if (questionAsksForOtherProjects && state.allProjects && state.allProjects.length > 0) {
      blob += "\n\n--- OTHER PROJECTS ---\n";
      const otherProjects = state.allProjects.filter(p => p.slug !== state.projectSlug);
      for (const p of otherProjects) {
        const parts: string[] = [];
        parts.push(p.name);
        if (p.client && p.name !== p.client) parts.push(`(${p.client})`);
        if (p.role) parts.push(`— ${p.role}`);
        blob += `- ${parts.join(" ")}\n`;
      }
      debugNotes.push(`build_context_blob: included ${otherProjects.length} other projects (explicitly requested)`);
    }
  }
  // Fallback: neither homepage nor project page
  else {
    blob += "\n\n[PORTFOLIO_FACTS]\n";
    blob += "This portfolio is an AI-powered experience that uses a RAG pipeline and a two-agent workflow (Copywriter + Orchestrator) to generate recruiter-friendly content.\n";
    blob += "The system retrieves structured knowledge about Charles's projects, synthesizes it into clear case studies, and renders them via a deterministic, JSON-driven UI using a whitelisted component registry.\n";
    blob += "It also powers a conversational AI modal, a global Cmd+K command palette, and generative-UI layouts that adapt to the user's questions.";
    debugNotes.push("build_context_blob: fallback - included [PORTFOLIO_FACTS]");
  }

  debugNotes.push(`build_context_blob: length=${blob.length}`);

  // Preserve history
  return {
    ...state,
    contextBlob: blob,
    allProjects: state.allProjects,
    debugNotes,
  };
}

async function conversationPolicyNode(state: ModalGraphState): Promise<Partial<ModalGraphState>> {
  const scores = computeContextScores(state);
  const q = state.question.toLowerCase().trim();
  const question = state.question ?? "";

  // Compute context flags
  const projectSlug = state.projectSlug;
  const projectFacts = state.projectFacts;
  const allProjects = state.allProjects ?? [];
  const retrievedChunks = state.retrievedChunks ?? [];
  const sectionHeadline = state.sectionHeadline;
  const sectionText = state.sectionText;

  const hasProjectContext = !!projectSlug && !!projectFacts;
  const hasAnyContext =
    hasProjectContext ||
    !!state.contextBlob ||
    allProjects.length > 0;

  const debugNotes = [...(state.debugNotes ?? [])];
  debugNotes.push("[conversation_policy] inspecting question + context for routing");

  let mode: ConversationMode | undefined = undefined;
  let modeAlreadyDecided = false;

  // Handle existing special cases first (tools/projects questions)
  // These set modeAlreadyDecided = true and return early
  const askingForOtherProjects =
    q.includes("other projects") ||
    q.includes("what else have you worked on") ||
    q.includes("what else has he worked on") ||
    q.includes("show me more work") ||
    q.includes("other work");

  const toolsQ =
    q.includes("tools") ||
    q.includes("tech stack") ||
    q.includes("technologies") ||
    q.includes("stack did you use") ||
    q.includes("what did you use");

  const projectsQ =
    q.includes("other projects") ||
    q.includes("worked on") ||
    q.includes("another project") ||
    q.includes("different project") ||
    q.includes("highlight a specific one") ||
    q.includes("tell me about his other work");

  // Keep existing deterministic paths - they return early
  if (toolsQ && !projectsQ && projectSlug && allProjects.length > 0) {
    const current = allProjects.find((p) => p.slug === projectSlug);
    const tools = current?.tools ?? [];
    if (tools.length > 0) {
      mode = "answer_direct";
      modeAlreadyDecided = true;
      debugNotes.push("[conversation_policy] deterministic tools answer");
      return {
        ...state,
        mode,
        debugNotes,
      };
    }
  }

  if (projectsQ && !toolsQ && allProjects.length > 0) {
    const others = allProjects.filter((p) => p.slug !== projectSlug);
    const top = others.slice(0, 3);
    if (top.length > 0) {
    mode = "clarify_then_answer";
      modeAlreadyDecided = true;
      debugNotes.push("[conversation_policy] project-list question");
      return {
        ...state,
        mode,
        debugNotes,
      };
    }
  }

  // 3.1 Case-study questions on a project page → answer_direct
  // IMPORTANT: This ensures case-study questions NEVER fall into low_context_fallback
  if (!modeAlreadyDecided) {
    // Check if we're on a project page (has projectSlug or work page path)
    const onProjectPage = !!projectSlug || (state.pagePath && state.pagePath.match(/^\/work\/[^/]+/));
    
    if (onProjectPage) {
      const projectName = projectFacts?.name ?? projectFacts?.client;
      const caseStudy = isCaseStudyQuestion(question, projectSlug, projectName);

      // If we're on a project page AND it's a case study question, force answer_direct
      if (caseStudy) {
    mode = "answer_direct";
        modeAlreadyDecided = true;
        debugNotes.push(
          "[conversation_policy] project context + case-study question → answer_direct"
        );
      }
    }
  }

  // 3.2 Portfolio questions on / → answer_direct
  if (!modeAlreadyDecided) {
    const onPortfolioPage = state.pagePath === "/";

    const portfolioQuestion = isPortfolioQuestion(question);

    if (onPortfolioPage && portfolioQuestion) {
      mode = "answer_direct";
      modeAlreadyDecided = true;
      debugNotes.push(
        "[conversation_policy] portfolioQuestion=true on portfolio page → answer_direct"
      );
    }
  }

  // Portfolio questions not on portfolio page → clarify_then_answer (unless trivially direct)
  if (!modeAlreadyDecided) {
    const portfolioQuestion = isPortfolioQuestion(question);
    if (portfolioQuestion) {
      if (isTriviallyDirectPortfolioQuestion(question)) {
        mode = "answer_direct";
  } else {
    mode = "clarify_then_answer";
      }
      modeAlreadyDecided = true;
      debugNotes.push(
        `[conversation_policy] portfolioQuestion=true mode=${mode}`
      );
    }
  }

  // Site Support Requests
  if (!modeAlreadyDecided) {
    const siteSupportRequest = isSiteSupportRequest(question);
    if (siteSupportRequest) {
      mode = "answer_direct";
      modeAlreadyDecided = true;
      debugNotes.push("[conversation_policy] site_support_request → answer_direct");
  }
  }

  // Feedback or Comments
  if (!modeAlreadyDecided) {
    const feedbackOrComment = isFeedbackOrComment(question);
    if (feedbackOrComment) {
      mode = "answer_direct";
      modeAlreadyDecided = true;
      debugNotes.push("[conversation_policy] feedback_or_comment → answer_direct");
    }
  }

  // Personal/General Questions
  if (!modeAlreadyDecided) {
    const isPersonalQuestion =
      q.includes("who is charles") ||
      q.includes("what does he do") ||
      q.includes("what kind of work") ||
      q.includes("what does charles") ||
      q.includes("tell me about charles") ||
      q.includes("about yourself") ||
      q.includes("your background") ||
      q.includes("who are you");

    if (isPersonalQuestion) {
      mode = "clarify_then_answer";
      modeAlreadyDecided = true;
      debugNotes.push("[conversation_policy] personal/general question → clarify_then_answer");
    }
  }

  // 3.3 Relax low-context fallback (ONLY when truly empty)
  if (!modeAlreadyDecided) {
    const hasChunks = retrievedChunks.length > 0;
    const hasSectionContext = !!sectionHeadline || !!sectionText;
    const portfolioQuestion = isPortfolioQuestion(question);
    const projectName = projectFacts?.name ?? projectFacts?.client;
    const caseStudyQuestion = isCaseStudyQuestion(question, projectSlug, projectName);
    const onProjectPage = !!projectSlug || (state.pagePath && state.pagePath.match(/^\/work\/[^/]+/));

    // Only use low_context_fallback when we truly have almost no signal
    // Exclude: portfolio questions, case study questions on project pages, any context
    if (
      !hasAnyContext &&
      !hasChunks &&
      !hasSectionContext &&
      !portfolioQuestion &&
      !(onProjectPage && caseStudyQuestion)
    ) {
      mode = "low_context_fallback";
      modeAlreadyDecided = true;
      debugNotes.push(
        "[conversation_policy] no projectFacts, no contextBlob, no chunks → low_context_fallback"
      );
    }
  }

  // Default to clarify_then_answer if we have some context but haven't decided yet
  if (!modeAlreadyDecided) {
    mode = "clarify_then_answer";
    debugNotes.push(
      "[conversation_policy] defaulting to clarify_then_answer with available context"
    );
  }

  return {
    ...state,
    mode: mode!,
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

