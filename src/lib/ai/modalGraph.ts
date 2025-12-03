import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { getProjectBySlug, getAllProjects, formatGlobalAboutSections } from "@/lib/kb/loader";
import { runCopywriter } from "./copywriter";
import type { CopywriterInput, CopywriterOutput } from "./copywriterSchemas";
import type { RetrievedChunk } from "@/lib/rag/retrieveProjectChunks";
import { buildContextFromChunks } from "@/lib/rag/retrieveProjectChunks";
import { anthropic } from "./client";

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
const ModalGraphStateAnnotation = Annotation.Root({
  question: Annotation<string>(),
  pagePath: Annotation<string | undefined>(),
  projectSlug: Annotation<string | undefined>(),
  sectionHeadline: Annotation<string | undefined>(),
  sectionText: Annotation<string | undefined>(),
  history: Annotation<Array<{ role: "user" | "assistant"; content: string }> | undefined>({
    reducer: (left, right) => {
      if (!right) return left ?? [];
      if (!left) return Array.isArray(right) ? right : [right];
      return left.concat(Array.isArray(right) ? right : [right]);
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
  try {
    const allProjects = await getAllProjects();
    if (allProjects.length > 0) {
      return allProjects.map((p) => {
        const tools = extractTools(p.facts.skillsUsed);
        return {
          slug: p.facts.projectId,
          name: p.facts.client || p.facts.projectId,
          client: p.facts.client,
          role: p.facts.role,
          summary: p.facts.projectSummary,
          tools: tools.length > 0 ? tools : undefined,
        };
      });
    }
  } catch (error) {
    console.error("[loadAllProjects] Error loading from KB:", error);
  }

  // Fallback static list derived from existing KB
  return [
    {
      slug: "capital-one-travel",
      name: "Capital One Travel",
      client: "Capital One",
      role: "Front-end engineer via AKQA",
      summary: "Modular front-end experience for airport lounges and travel rewards.",
      tools: ["React", "TypeScript", "Next.js", "Storybook", "Figma"],
    },
    {
      slug: "pmi",
      name: "PMI.org Redesign",
      client: "Project Management Institute",
      role: "Front-end engineer & technologist",
      summary:
        "Redesigned PMI.org with a modular component system and improvements to IA, navigation, and template consistency across a content-heavy site.",
      tools: ["React", "TypeScript", "Next.js", "Storybook", "Figma"],
    },
    {
      slug: "tanger",
      name: "Tanger Experience Platform",
      client: "Tanger",
      role: "Front-end engineer / design systems collaborator",
      summary: "Helped build a component-driven marketing platform with reusable patterns.",
      tools: ["React", "TypeScript", "Next.js", "Storybook", "Figma"],
    },
    {
      slug: "coke-ai-vending",
      name: "Coke AI Vending Concept",
      client: "Coca-Cola",
      role: "Creative technologist / prototyper",
      summary: "Prototype for an AI-powered vending experience exploring conversational product discovery.",
      tools: ["React", "TypeScript", "Node.js", "Figma"],
    },
    {
      slug: "pfaff-design-portfolio",
      name: "pfaff.design — Generative UI Portfolio",
      client: "Self-initiated",
      role: "Design-minded applied AI engineer",
      summary: "RAG-powered generative UI portfolio blending deterministic layouts with AI-authored content.",
      tools: ["React", "TypeScript", "Next.js", "Tailwind", "Supabase", "LangChain"],
    },
  ];
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

    // Load all other projects (excluding current)
    const allProjects = await getAllProjects();
    const otherProjects = allProjects
      .filter((p) => p.facts.projectId !== projectSlug)
      .slice(0, 5) // Limit to 5 other projects
      .map((p) => ({
        slug: p.facts.projectId,
        name: p.facts.client || p.facts.projectId,
        client: p.facts.client,
        role: p.facts.role,
        summary: p.facts.projectSummary,
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
  sectionHeadline?: string;
  sectionText?: string;
}): Promise<string> {
  const { question, contextBlob, sectionHeadline, sectionText } = params;

  const context = contextBlob || "";
  const sectionContext = sectionHeadline && sectionText
    ? `\n\nSection: ${sectionHeadline}\n${sectionText}`
    : "";

  const systemPrompt = `You are helping answer questions about Charles Pfaff's work.

Answer the question directly and concisely using the provided context. Be factual, clear, and helpful.`;

  const userMessage = context || sectionContext
    ? `Context: ${context}${sectionContext}\n\nQuestion: ${question}`
    : question;

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
  sectionHeadline?: string;
  sectionText?: string;
  allProjects?: Array<{
    slug: string;
    name: string;
    client?: string;
    role?: string;
    summary?: string;
  }>;
}): Promise<string> {
  const { question, contextBlob, sectionHeadline, sectionText, allProjects = [] } = params;

  const context = contextBlob || "";
  const sectionContext = sectionHeadline && sectionText
    ? `\n\nSection: ${sectionHeadline}\n${sectionText}`
    : "";

  // Get project list for context
  const projectsList = allProjects.length > 0
    ? `\n\nAvailable projects: ${allProjects.map(p => p.name).join(", ")}`
    : "";

  const systemPrompt = `You are helping answer questions about Charles Pfaff's work.

For ambiguous questions:
1. If the question is clear enough, answer it directly
2. If clarification would help, ask one brief clarifying question
3. Provide helpful context about what information is available

Keep responses concise and helpful.`;

  const userMessage = context || sectionContext || projectsList
    ? `Context: ${context}${sectionContext}${projectsList}\n\nQuestion: ${question}`
    : question;

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
}): Promise<string> {
  const { question, contextBlob, pagePath, projectSlug, allProjects = [] } = params;

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

  // Confident, portfolio-aware prompt for low context - aligned with Phase 8 rubric
  const systemPrompt = [
    "You are helping a recruiter or hiring manager understand Charles Pfaff and his AI-powered portfolio.",
    "You are in LOW CONTEXT FALLBACK mode.",
    "You MAY NOT apologize for limited context or say that you do not have enough information.",
    "Use the provided context, including [PORTFOLIO_FACTS] and the project list, as truth.",
    "",
    "Your job:",
    "- In 2–3 sentences, describe how this portfolio and Charles's work use AI (RAG, multi-agent orchestration, generative UI, deterministic JSON components).",
    "- In 1–2 sentences, mention 2–3 representative projects by name (for example: Capital One Travel, PMI, Tanger, Coca-Cola AI concept, the pfaff.design portfolio).",
    "- End with exactly ONE warm, guiding follow-up question.",
    "",
    "If the question is about 'this portfolio' or 'this site', focus on the portfolio's AI architecture and behavior — not just a generic biography.",
    "Avoid generic AI marketing language and avoid phrases like 'cutting-edge' unless grounded in the given context.",
  ].join("\n");

  try {
    const userMessage = context
      ? `Context: ${context}\n\nQuestion: ${question}`
      : question;

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
 * Copywriter acts as a refinement layer for tone, not a separate branch
 */
function shouldUseCopywriter(
  state: ModalGraphState,
  baseAnswerText: string | null
): boolean {
  if (!baseAnswerText || !baseAnswerText.trim()) return false;

  // Prefer copywriter for portfolio-wide / explanatory questions
  if (state.projectSlug === "pfaff-designs-portfolio") return true;

  // Also use copywriter for clarify_then_answer, where we want a strong narrative tone
  if (state.mode === "clarify_then_answer") return true;

  // Do NOT use copywriter for low_context_fallback on normal project pages
  if (state.mode === "low_context_fallback") return false;

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
        history: [...history, { role: "assistant" as const, content: baseAnswerText }],
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
    history: updatedHistory,
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
    q.includes("this website") ||
    q.includes("this experience") ||
    q.includes("this interface") ||
    q.includes("pfaff.design") ||
    q.includes("your site") ||
    q.includes("how does this") ||
    q.includes("what is this") ||
    q.includes("behind the scenes")
  );
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
  // Ensure history is never undefined
  const history = state.history ?? [];
  
  const debugNotes = [
    ...(state.debugNotes ?? []),
    "derive_context: inspected pagePath/projectSlug/section",
    `entry: received history length=${history.length}`,
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
    history,
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
  } else {
    // For any other project, leave empty array
    retrievedChunks = [];
  }

  // Preserve history and projectFacts
  return {
    ...state,
    retrievedChunks,
    history: state.history ?? [],
    projectFacts: state.projectFacts,
    allProjects: state.allProjects,
    debugNotes,
  };
}

async function buildContextBlobNode(state: ModalGraphState): Promise<Partial<ModalGraphState>> {
  // Build a readable, layered history summary
  const historySummary =
    state.history && state.history.length > 0
      ? state.history
          .map((m, i) => `${i + 1}. ${m.role.toUpperCase()}: ${m.content}`)
          .join("\n")
      : "(no prior messages)";

  // Build a structured contextBlob
  let blob = [
    `PAGE PATH: ${state.pagePath || "(not provided)"}`,
    `PROJECT: ${state.projectSlug || "(not provided)"}`,
    `SECTION: ${state.sectionHeadline || "(not provided)"}`,
    `SECTION TEXT: ${state.sectionText || "(no section text provided)"}`,
  ].join("\n");

  // Always add portfolio facts, regardless of projectSlug
  // This makes portfolio AI architecture available from any page
  blob += "\n\n[PORTFOLIO_FACTS]\n";
  blob += "This portfolio is an AI-powered experience that uses a RAG pipeline and a two-agent workflow (Copywriter + Orchestrator) to generate recruiter-friendly content.\n";
  blob += "The system retrieves structured knowledge about Charles's projects, synthesizes it into clear case studies, and renders them via a deterministic, JSON-driven UI using a whitelisted component registry.\n";
  blob += "It also powers a conversational AI modal, a global Cmd+K command palette, and generative-UI layouts that adapt to the user's questions.";

  if (state.retrievedChunks && state.retrievedChunks.length > 0) {
    const chunksText = state.retrievedChunks.map((chunk) => chunk.text).join("\n\n");
    blob += `\n\n--- PROJECT CONTEXT ---\n${chunksText}`;
  }

  // Enrich with projectFacts
  if (state.projectFacts) {
    const { name, client, role, summary, tools, otherProjects } = state.projectFacts;
    blob += "\n\n--- PROJECT FACTS ---\n";
    if (name) blob += `Name: ${name}\n`;
    if (client) blob += `Client: ${client}\n`;
    if (role) blob += `Role: ${role}\n`;
    if (summary) blob += `Summary: ${summary}\n`;
    if (tools && tools.length) {
      blob += `Tools: ${tools.join(", ")}\n`;
    }
    if (otherProjects && otherProjects.length) {
      blob += "\nOther projects:\n";
      for (const p of otherProjects) {
        blob += `- ${p.name}`;
        if (p.client) blob += ` for ${p.client}`;
        if (p.role) blob += ` — ${p.role}`;
        blob += "\n";
      }
    }
  }

  // Add all projects section
  if (state.allProjects && state.allProjects.length > 0) {
    blob += "\n\n--- OTHER PROJECTS ---\n";
    for (const p of state.allProjects) {
      const parts: string[] = [];
      parts.push(p.name);
      if (p.client && p.name !== p.client) parts.push(`(${p.client})`);
      if (p.role) parts.push(`— ${p.role}`);
      blob += `- ${parts.join(" ")}\n`;
    }
  }

  // Add history section
  blob += `\n\n--- CONVERSATION HISTORY ---\n${historySummary}`;

  const debugNotes = [
    ...(state.debugNotes ?? []),
    `build_context_blob: length=${blob.length}`,
  ];

  if (state.projectFacts) {
    debugNotes.push("build_context_blob: enriched with projectFacts");
  }

  if (state.allProjects && state.allProjects.length > 0) {
    debugNotes.push(`build_context_blob: included ${state.allProjects.length} other projects`);
  }

  // Preserve history
  return {
    ...state,
    contextBlob: blob,
    history: state.history ?? [],
    allProjects: state.allProjects,
    debugNotes,
  };
}

async function conversationPolicyNode(state: ModalGraphState): Promise<Partial<ModalGraphState>> {
  const scores = computeContextScores(state);
  const q = state.question.toLowerCase().trim();

  // Check for portfolio questions FIRST, before other routing logic
  const portfolioQuestion = isPortfolioQuestion(state.question ?? "");

  if (portfolioQuestion) {
    // Choose between answer_direct vs clarify_then_answer based on simplicity
    const isShort = q.length <= 140; // short, direct questions

    const chosenMode: ConversationMode = isShort
      ? "answer_direct"
      : "clarify_then_answer";

    const debugNotes = [
      ...(state.debugNotes ?? []),
      `[conversation_policy] portfolioQuestion=true mode=${chosenMode}`,
    ];

    return {
      ...state,
      mode: chosenMode,
      debugNotes,
    };
  }

  // Continue with existing routing logic for non-portfolio questions
  const isSimpleFact =
    q.startsWith("what is ") ||
    q.startsWith("who ") ||
    q.startsWith("when ") ||
    q.startsWith("where ") ||
    q.includes("tools you use") ||
    q.includes("what tools") ||
    q.includes("skills") ||
    q.includes("tech stack");

  const askingForOtherProjects =
    q.includes("other projects") ||
    q.includes("what else have you worked on") ||
    q.includes("what else has he worked on") ||
    q.includes("show me more work") ||
    q.includes("other work");

  let mode: ConversationMode;
  let policyNote = "";

  if (!scores.hasSectionContext && !scores.hasRetrieved) {
    mode = "low_context_fallback";
    policyNote = "[conversation_policy] No section context + no retrieved chunks → low_context_fallback";
  } else if (askingForOtherProjects || scores.crossProjectDrift) {
    mode = "clarify_then_answer";
    policyNote = "[conversation_policy] Cross-project / list-other-projects signal → clarify_then_answer";
  } else if (isSimpleFact && (scores.hasSectionContext || scores.topScore > 0.5)) {
    mode = "answer_direct";
    policyNote = "[conversation_policy] Simple factual question with context → answer_direct";
  } else {
    mode = "clarify_then_answer";
    policyNote = "[conversation_policy] Ambiguous question → clarify_then_answer";
  }

  const debugNotes = [
    ...(state.debugNotes ?? []),
    policyNote,
  ];

  // Track execution steps (optional tracking)
  if (!("executionSteps" in state)) {
    (state as any).executionSteps = [];
  }
  (state as any).executionSteps.push("conversation_policy");

  // Preserve all state fields
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
        history: [...history, { role: "assistant" as const, content: answer }],
        debugNotes: [...debugNotes, "generate_answer: cross-project-tools"],
      };
    }
  }

  if (toolsQ && !projectsQ && state.projectSlug && allProjects.length > 0) {
    const current = allProjects.find((p) => p.slug === state.projectSlug);
    const tools = current?.tools ?? [];
    if (tools.length > 0) {
      const answer = [
        "For this project, Charles used:",
        ...tools.map((t) => `- ${t}`),
        "These tools supported a modular, maintainable front-end that could evolve over time.",
      ].join("\n");
      return {
        ...state,
        answerText: answer,
        history: [...history, { role: "assistant" as const, content: answer }],
        debugNotes: [...debugNotes, "generate_answer: deterministic tools answer"],
      };
    }
  }

  if (projectsQ && !toolsQ && allProjects.length > 0) {
    const others = allProjects.filter((p) => p.slug !== state.projectSlug);
    const top = others.slice(0, 3);
    if (top.length > 0) {
      const answer = [
        "Outside of this project, Charles has worked on several others:",
        ...top.map((p) => {
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
        history: [...history, { role: "assistant" as const, content: answer }],
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
      });
      baseDebugNote = "[generate_answer] handled low_context_fallback via LLM";
    } else if (mode === "answer_direct") {
      console.log("[generate_answer] Handling answer_direct mode");
      baseAnswerText = await callLLMForAnswerDirect({
        question,
        contextBlob,
        sectionHeadline,
        sectionText,
      });
      baseDebugNote = "[generate_answer] handled answer_direct via LLM";
    } else if (mode === "clarify_then_answer") {
      console.log("[generate_answer] Handling clarify_then_answer mode");
      baseAnswerText = await callLLMForClarifyThenAnswer({
        question,
        contextBlob,
        sectionHeadline,
        sectionText,
        allProjects: state.allProjects ?? [],
      });
      baseDebugNote = "[generate_answer] handled clarify_then_answer via LLM";
    } else {
      // Fallback for unknown mode
      console.warn("[generate_answer] Unknown mode:", mode, "using clarify_then_answer");
      baseAnswerText = await callLLMForClarifyThenAnswer({
        question,
        contextBlob,
        sectionHeadline,
        sectionText,
        allProjects: state.allProjects ?? [],
      });
      baseDebugNote = `[generate_answer] unknown mode ${mode}, used clarify_then_answer`;
    }
  } catch (err) {
    console.error("[generate_answer] Base LLM call failed:", err);
    baseAnswerText = "Something went wrong while generating that answer. I can still help though—try asking again or narrowing the question.";
    baseDebugNote = "[generate_answer] base LLM call failed, returned fallback message";
  }

  // Step 3: Layer copywriter on top if appropriate
  const useCopywriter = shouldUseCopywriter(state, baseAnswerText);
  debugNotes.push(
    `[generate_answer] shouldUseCopywriter=${useCopywriter} slug=${state.projectSlug || "(none)"} mode=${mode || "(none)"}`
  );

  if (useCopywriter) {
    try {
      console.log("[ModalGraph] Using copywriter path for question:", question.substring(0, 100));
      
      // Detect "about yourself" type questions
      const questionLower = question.toLowerCase();
      const isAboutQuestion = 
        questionLower.includes("about yourself") ||
        questionLower.includes("tell me about you") ||
        questionLower.includes("who are you") ||
        questionLower.includes("your background") ||
        questionLower.includes("your story");
      
      if (isAboutQuestion) {
        console.log("[ModalGraph] Detected 'about yourself' question - will prioritize globalAboutSections");
      }
      
      // Convert modal graph chunks to copywriter format
      const retrievedChunksForCopywriter = convertModalChunksToRetrievedChunks(state.retrievedChunks);
      console.log("[ModalGraph] Converted chunks:", retrievedChunksForCopywriter.length);
      
      // Build context string from chunks using RAG helper
      const contextFromChunks = buildContextFromChunks(retrievedChunksForCopywriter);
      console.log("[ModalGraph] Context from chunks length:", contextFromChunks.length);
      
      // Load global about sections
      const globalAboutSections = formatGlobalAboutSections();
      console.log("[ModalGraph] Global about sections length:", globalAboutSections?.length || 0);
      
      // For "about yourself" or general questions with no project context, use globalAboutSections as primary context
      let combinedContext = contextFromChunks;
      
      // If we have globalAboutSections, include it in the context
      if (globalAboutSections && globalAboutSections.length > 0) {
        if (isAboutQuestion && combinedContext.length === 0) {
          console.log("[ModalGraph] Using globalAboutSections as primary context for 'about yourself' question");
          combinedContext = globalAboutSections;
        } else if (combinedContext.length > 0) {
          combinedContext = `${combinedContext}\n\n--- About & Background ---\n${globalAboutSections}`;
        } else {
          combinedContext = globalAboutSections;
        }
      }
      
      // Also include contextBlob if available
      if (contextBlob && contextBlob.length > 0) {
        combinedContext = combinedContext.length > 0
          ? `${combinedContext}\n\n--- Additional Context ---\n${contextBlob}`
          : contextBlob;
      }
      
      console.log("[ModalGraph] Final combined context length:", combinedContext.length);

      // Format project facts
      const projectShortFacts = formatProjectFactsForCopywriter(facts);
      console.log("[ModalGraph] Project facts:", projectShortFacts !== "{}" ? "provided" : "empty");

      // Build copywriter input
      const copywriterInput: CopywriterInput = {
        question: question || "",
        context: combinedContext || "",
        sectionTitle: sectionHeadline || "",
        sectionBody: sectionText || "",
        projectShortFacts: projectShortFacts && projectShortFacts !== "{}" ? projectShortFacts : undefined,
        retrievedChunks: retrievedChunksForCopywriter && retrievedChunksForCopywriter.length > 0 ? retrievedChunksForCopywriter : undefined,
        globalAboutSections: globalAboutSections && globalAboutSections.length > 0 ? globalAboutSections : undefined,
        projectId: state.projectSlug || null,
      };

      // Validate required fields
      if (!copywriterInput.question || copywriterInput.question.trim().length === 0) {
        throw new Error("Question is required for copywriter");
      }
      
      // Ensure context is never empty - use globalAboutSections if available
      if (!copywriterInput.context || copywriterInput.context.trim().length === 0) {
        console.warn("[ModalGraph] ⚠️ Warning: No context from chunks, checking globalAboutSections...");
        if (globalAboutSections && globalAboutSections.length > 0) {
          console.log("[ModalGraph] ✅ Using globalAboutSections as primary context (", globalAboutSections.length, "chars)");
          copywriterInput.context = globalAboutSections;
        } else {
          console.error("[ModalGraph] ❌ No globalAboutSections available either!");
          copywriterInput.context = `Question: ${question}\n\nContext: Limited context available. Please ask about a specific project or topic.`;
        }
      } else {
        console.log("[ModalGraph] ✅ Context provided (", copywriterInput.context.length, "chars)");
      }

      // Call copywriter
      const copywriterOutput = await runCopywriter(copywriterInput);

      console.log("[ModalGraph] Copywriter returned:", {
        blocksCount: copywriterOutput.answer_blocks.length,
        firstBlockHeading: copywriterOutput.answer_blocks[0]?.heading?.substring(0, 50),
      });

      // Extract answer from copywriter output, with baseAnswerText as fallback
      const primaryBlock = copywriterOutput.answer_blocks?.[0];
      const finalAnswerText =
        primaryBlock?.body ??
        primaryBlock?.heading ??
        baseAnswerText ??
        "I'm having trouble generating a detailed answer right now.";

      const updatedHistory = [
        ...history,
        { role: "assistant" as const, content: finalAnswerText },
      ];

      return {
        ...state,
        answerText: finalAnswerText,
        history: updatedHistory,
        debugNotes: [
          ...debugNotes,
          baseDebugNote,
          `[generate_answer] used copywriter refinement; blocks=${copywriterOutput.answer_blocks?.length ?? 0}`,
        ],
      };

    } catch (err: any) {
      console.error("[ModalGraph] ❌ Copywriter failed, using base answer:", err);
      console.error("[ModalGraph] Error details:", {
        message: err?.message,
        stack: err?.stack,
        name: err?.name,
      });
      // Fall back to the base answer (LLM path for that mode)
      const updatedHistory = [
        ...history,
        { role: "assistant" as const, content: baseAnswerText },
      ];
      return {
        ...state,
        answerText: baseAnswerText,
        history: updatedHistory,
        debugNotes: [
          ...debugNotes,
          baseDebugNote,
          "[generate_answer] copywriter failed, used base answer",
        ],
      };
    }
  }

  // Step 4: If we don't use copywriter, return the base answer
  const updatedHistory = [
    ...history,
    { role: "assistant" as const, content: baseAnswerText },
  ];

  return {
    ...state,
    answerText: baseAnswerText,
    history: updatedHistory,
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

