import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { anthropic } from "./client";
import { getProjectBySlug, getAllProjects } from "@/lib/kb/loader";
import { getModalGraphSystemPrompt } from "./promptLoader";

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
// Note: System prompt is now loaded from LangSmith via getModalGraphSystemPrompt()
// Fallback prompt is defined in promptLoader.ts

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
  const { question, mode, sectionHeadline, sectionText, contextBlob, history: stateHistory } = state;
  const history = stateHistory ?? [];
  
  const debugNotes = [
    ...(state.debugNotes ?? []),
  ];

  let answerText: string;
  let updatedHistory: Array<{ role: "user" | "assistant"; content: string }>;

  // Policy wrapper: Handle tools and other-projects questions directly
  const questionLower = state.question.toLowerCase();
  const facts = state.projectFacts;
  const allProjects = state.allProjects ?? [];

  // Detect question types
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

  // 1. Combined "projects + tools" questions (e.g., "which other projects use these tools?")
  if (projectsAndToolsQ && allProjects.length > 0) {
    // Find current project's tools from allProjects
    const current = allProjects.find((p) => p.slug === state.projectSlug);
    const currentTools = new Set(current?.tools ?? []);

    // Filter for projects that share tools, excluding current
    const related = allProjects.filter((p) => {
      if (p.slug === state.projectSlug) return false;
      if (!p.tools || p.tools.length === 0) return false;
      return p.tools.some((t) => currentTools.has(t));
    });

    const topRelated = related.slice(0, 3);

    if (topRelated.length > 0) {
      // Get current project name for dynamic reference
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

      updatedHistory = [
        ...history,
        { role: "assistant" as const, content: answer },
      ];

      debugNotes.push("generate_answer: cross-project-tools");

      return {
        ...state,
        answerText: answer,
        history: updatedHistory,
        allProjects: state.allProjects,
        debugNotes,
      };
    }
  }

  // 2. Tools-focused questions (current project only)
  if (toolsQ && !projectsQ && state.projectSlug && allProjects.length > 0) {
    const current = allProjects.find((p) => p.slug === state.projectSlug);
    const tools = current?.tools ?? [];

    if (tools.length > 0) {
      const answer = [
        "For this project, Charles used:",
        ...tools.map((t) => `- ${t}`),
        "These tools supported a modular, maintainable front-end that could evolve over time.",
      ].join("\n");

      updatedHistory = [
        ...history,
        { role: "assistant" as const, content: answer },
      ];

      debugNotes.push("generate_answer: deterministic tools answer from ProjectFacts");

      return {
        ...state,
        answerText: answer,
        history: updatedHistory,
        allProjects: state.allProjects,
        debugNotes,
      };
    }
  }

  // 3. Other projects / cross-project questions (use allProjects, not just otherProjects)
  if (projectsQ && !toolsQ && allProjects.length > 0) {
    // Exclude current project if we have projectSlug
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

      updatedHistory = [
        ...history,
        { role: "assistant" as const, content: answer },
      ];

      debugNotes.push("generate_answer: project-list");

      return {
        ...state,
        answerText: answer,
        history: updatedHistory,
        allProjects: state.allProjects,
        debugNotes,
      };
    }
  }

  // 3. Otherwise, fall back to the existing Anthropic call
  try {
    // Build context section
    const contextParts: string[] = [];
    
    if (sectionHeadline) {
      contextParts.push(`Section: ${sectionHeadline}`);
    }
    
    if (sectionText) {
      contextParts.push(`Section Text: ${sectionText}`);
    }
    
    // Truncate contextBlob if it's huge (first 2000 chars)
    if (contextBlob) {
      const truncatedBlob = contextBlob.length > 2000 
        ? contextBlob.substring(0, 2000) + "\n\n[... context truncated ...]"
        : contextBlob;
      contextParts.push(`Context:\n${truncatedBlob}`);
    }

    const contextSection = contextParts.length > 0 
      ? `\n\nContext:\n${contextParts.join("\n\n")}`
      : "";

    // Summarize last few turns in history (last 3 messages)
    const recentHistory = history.slice(-3);
    const historySummary = recentHistory.length > 0
      ? `\n\nRecent conversation:\n${recentHistory.map((turn) => `${turn.role}: ${turn.content}`).join("\n")}`
      : "";

    // Build mode instruction
    let modeInstruction = "";
    if (mode === "clarify_then_answer") {
      modeInstruction = "\n\nMode: clarify_then_answer → Give a brief answer and ask exactly one focused follow-up question.";
    } else if (mode === "low_context_fallback") {
      modeInstruction = "\n\nMode: low_context_fallback → Be upfront that you only have light context, share a concise high-level insight, and ask a clarifying question.";
    } else {
      modeInstruction = "\n\nMode: answer_direct → Answer clearly and concretely using all available context.";
    }

    // Build user message
    const userContent = `Question: ${question}${contextSection}${historySummary}${modeInstruction}`;

    // Load system prompt from LangSmith (with fallback)
    const systemPrompt = await getModalGraphSystemPrompt();

    // Call Anthropic (using same model as modal copywriter)
    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 400,
      temperature: 0.2,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userContent,
        },
      ],
    });

    // Extract text from response
    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Anthropic");
    }

    answerText = content.text.trim();
    debugNotes.push("generate_answer: called Anthropic");

  } catch (err: any) {
    // Fallback on error
    console.error("[generateAnswerNode] Anthropic error:", err);
    debugNotes.push(
      `generate_answer: anthropic_error=${err?.message ?? "unknown"}`
    );
    
    answerText = "I had trouble generating a deeper answer just now, but I'm still here if you want to ask about something specific like Charles's role, tools, process, or impact.";
  }

  // Append the assistant's answer to history
  updatedHistory = [
    ...history,
    { role: "assistant" as const, content: answerText },
  ];

  debugNotes.push(`generate_answer: history_length=${updatedHistory.length}`);

  return {
    ...state,
    answerText,
    history: updatedHistory,
    allProjects: state.allProjects,
    debugNotes,
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

