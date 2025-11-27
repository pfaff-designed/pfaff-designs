import { NextRequest, NextResponse } from "next/server";
import { modalGraphApp, type ModalGraphState } from "@/lib/ai/modalGraph";
import { getCaseStudyBySlug } from "@/lib/caseStudies/data";
import type { AiModalAction } from "@/components/ai-modal/AiActionsRow";
import type { CaseStudyPage } from "@/lib/caseStudies/types";

// ============================================================
// TYPES
// ============================================================

export type AiModalSource = "hover-pill" | "keyboard" | "button";

export interface ModalRequestBody {
  question: string;
  topicLabel?: string;
  topicId?: string;
  source?: AiModalSource;
  pagePath?: string;
  history?: Array<{
    role: "user" | "ai";
    text: string;
  }>;
}

export interface ModalResponseBody {
  answer: string;
  mode?: "answer_direct" | "clarify_then_answer" | "low_context_fallback";
  debugNotes?: string[];
  actions: AiModalAction[];
}

// ============================================================
// HELPERS
// ============================================================

function deriveProjectSlugFromPath(pagePath?: string): string | undefined {
  if (!pagePath) return undefined;
  
  // Match paths like /work/capital-one or /work/coca-cola
  const match = pagePath.match(/^\/work\/([^/]+)/);
  if (!match) return undefined;
  
  let slug = match[1];
  
  // Normalize PMI-related paths to canonical slug
  if (
    slug === "pmi" ||
    slug === "pmi-agile" ||
    slug === "pmi-acp" ||
    slug.startsWith("pmi-")
  ) {
    slug = "pmi";
  }
  
  return slug;
}

/**
 * Best-effort section context lookup from case study data.
 * Attempts to match topicLabel or topicId to a section in the project.
 */
function deriveSectionContext({
  projectSlug,
  topicLabel,
  topicId,
}: {
  projectSlug?: string | null;
  topicLabel?: string | null;
  topicId?: string | null;
}): {
  sectionHeadline: string | null;
  sectionText: string | null;
} {
  // If no project slug, can't look up case study
  if (!projectSlug) {
    return {
      sectionHeadline: topicLabel ?? null,
      sectionText: null,
    };
  }

  // Try to get case study data
  const caseStudy = getCaseStudyBySlug(projectSlug);
  if (!caseStudy || !caseStudy.sections || caseStudy.sections.length === 0) {
    return {
      sectionHeadline: topicLabel ?? null,
      sectionText: null,
    };
  }

  // Normalize topic label for matching
  const normalizedTopic = topicLabel?.toLowerCase().trim();

  // Best-effort matching: try to find section by heading, eyebrow, or id
  const matched = caseStudy.sections.find((sec) => {
    const heading = sec.heading?.toLowerCase().trim();
    const eyebrow = sec.eyebrow?.toLowerCase().trim();

    return (
      (heading && normalizedTopic && heading.includes(normalizedTopic)) ||
      (eyebrow && normalizedTopic && eyebrow.includes(normalizedTopic)) ||
      (sec.id && topicId && sec.id === topicId)
    );
  });

  if (!matched) {
    // No match found, return fallback
    return {
      sectionHeadline: topicLabel ?? null,
      sectionText: null,
    };
  }

  // Return matched section data
  return {
    sectionHeadline: matched.heading ?? topicLabel ?? null,
    sectionText: matched.body ?? null,
  };
}

/**
 * Build ModalGraphState from ModalRequestBody.
 * Reuses the same pattern as /api/dev/modal-graph and runModalGraphEval.
 */
function buildModalGraphStateFromRequest(
  body: ModalRequestBody,
  projectSlug: string | undefined,
  sectionHeadline: string | null,
  sectionText: string | null
): Partial<ModalGraphState> {
  // Map history from ModalRequestBody format to ModalGraphState format
  const history = (body.history ?? []).map((h) => ({
    role: h.role === "ai" ? ("assistant" as const) : ("user" as const),
    content: h.text,
  }));

  return {
    question: body.question,
    pagePath: body.pagePath ?? "",
    projectSlug: projectSlug ?? undefined,
    sectionHeadline: sectionHeadline ?? "",
    sectionText: sectionText ?? "",
    history,
    debugNotes: [],
  };
}

/**
 * Generate smart action suggestions based on question and context.
 * Returns up to 3 actions: scroll, navigate, or suggest_question.
 */
function generateModalActions(params: {
  question: string;
  projectSlug?: string | null;
  pagePath?: string | null;
  topicLabel?: string | null;
  caseStudy?: CaseStudyPage | null;
}): AiModalAction[] {
  const { question, projectSlug, pagePath, topicLabel, caseStudy } = params;
  const q = question.toLowerCase();
  const actions: AiModalAction[] = [];

  // ---- 1. Scroll actions (case-study pages only) ----
  if (caseStudy && Array.isArray(caseStudy.sections)) {
    const sectionIds = new Set(
      caseStudy.sections.map((sec) => sec.id).filter(Boolean)
    );

    const pushScroll = (sectionId: string, label: string) => {
      // Avoid duplicates
      if (
        !actions.some(
          (a) => a.type === "scroll" && a.targetSectionId === sectionId
        )
      ) {
        actions.push({
          type: "scroll",
          label,
          targetSectionId: sectionId,
        });
      }
    };

    // tools / stack / tech → typically in "tools" or "process"
    if (/(tool|stack|tech|technology)/.test(q)) {
      if (sectionIds.has("tools")) {
        pushScroll("tools", "Scroll to Tools & Stack");
      } else if (sectionIds.has("process")) {
        pushScroll("process", "Scroll to Process & Tools");
      }
    }

    // team / collaboration → "role" or "team"
    if (/(team|people|collaborat|pm|product manager)/.test(q)) {
      if (sectionIds.has("role")) {
        pushScroll("role", "Scroll to Role & Team");
      } else if (sectionIds.has("team")) {
        pushScroll("team", "Scroll to Team");
      }
    }

    // problem / challenge
    if (/(problem|challenge|pain point)/.test(q)) {
      if (sectionIds.has("overview")) {
        pushScroll("overview", "Scroll to Overview");
      }
    }

    // outcome / impact / results
    if (/(outcome|result|impact|success)/.test(q)) {
      if (sectionIds.has("impact")) {
        pushScroll("impact", "Scroll to Impact");
      }
    }

    // process / approach / how
    if (/(process|approach|how did you)/.test(q)) {
      if (sectionIds.has("process")) {
        pushScroll("process", "Scroll to Process");
      }
    }

    // scope / role
    if (/(scope|role|responsibility)/.test(q)) {
      if (sectionIds.has("scope")) {
        pushScroll("scope", "Scroll to Scope");
      } else if (sectionIds.has("role")) {
        pushScroll("role", "Scroll to Role");
      }
    }
  }

  // ---- 2. Navigation actions (other projects) ----
  const navMap: { patterns: RegExp[]; path: string; label: string }[] = [
    {
      patterns: [/\bcoke\b/, /coca-cola/],
      path: "/work/coca-cola-creative-technology",
      label: "Go to Coke case study",
    },
    {
      patterns: [/\bpmi\b/, /project management institute/],
      path: "/work/pmi",
      label: "Go to PMI case study",
    },
    {
      patterns: [/\btanger\b/, /tanger outlet/],
      path: "/work/tanger-outlets",
      label: "Go to Tanger case study",
    },
    {
      patterns: [/capital one/, /capitalone/],
      path: "/work/capital-one-travel",
      label: "Go to Capital One case study",
    },
    {
      patterns: [/real estate/],
      path: "/work/real-estate-platform",
      label: "Go to Real Estate case study",
    },
    {
      patterns: [/portfolio/, /rag portfolio/, /generative ui/],
      path: "/work/rag-portfolio",
      label: "Go to Generative-UI portfolio case study",
    },
  ];

  for (const entry of navMap) {
    // Don't navigate to the same page we're already on
    if (entry.path === pagePath) {
      continue;
    }

    if (entry.patterns.some((re) => re.test(q))) {
      if (
        !actions.some(
          (a) => a.type === "navigate" && a.targetPath === entry.path
        )
      ) {
        actions.push({
          type: "navigate",
          label: entry.label,
          targetPath: entry.path,
        });
      }
    }
  }

  // ---- 3. Suggestion action (stay here, go deeper) ----
  // This pre-fills the composer with a follow-up question.
  // Does NOT auto-submit.
  const normalizedTopic = topicLabel?.trim() || "";
  const baseLabel = normalizedTopic
    ? `Ask more about ${normalizedTopic}`
    : "Ask a follow-up";
  const suggestedQuestion = normalizedTopic
    ? `Can you go deeper on ${normalizedTopic} in this project?`
    : `Can you explain this in more detail?`;

  actions.push({
    type: "suggest_question",
    label: baseLabel,
    suggestedQuestion,
  });

  // Limit total actions to 3
  return actions.slice(0, 3);
}

// ============================================================
// POST /api/ai/modal
// ============================================================

/**
 * Modal-specific AI endpoint
 * 
 * Accepts a lightweight Q&A request from the AI modal.
 * Uses LangGraph modalGraphApp to generate conversational answers.
 * Returns answer, mode, debugNotes (dev only), and smart actions.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ModalRequestBody;
    const { question, topicLabel, topicId, source, pagePath, history } = body;

    if (process.env.NODE_ENV !== "production") {
      console.log("[API /ai/modal] Request received", {
        question: question?.substring(0, 100),
        topicLabel,
        topicId,
        source,
        pagePath,
        historyLength: history?.length || 0,
      });
    }

    // Validate required field
    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid question" },
        { status: 400 }
      );
    }

    // 1. Derive project context from pagePath
    const projectSlug = deriveProjectSlugFromPath(pagePath);
    
    if (process.env.NODE_ENV !== "production") {
      console.log("[API /ai/modal] Context derived", {
        projectSlug,
        hasTopicLabel: !!topicLabel,
      });
    }

    // 2. Get case study data (used for section context and action generation)
    const caseStudy = projectSlug ? getCaseStudyBySlug(projectSlug) : null;

    // 3. Best-effort section context lookup
    const { sectionHeadline, sectionText } = deriveSectionContext({
      projectSlug,
      topicLabel,
      topicId,
    });

    if (process.env.NODE_ENV !== "production") {
      console.log("[API /ai/modal] Section context derived", {
        sectionHeadline,
        hasSectionText: !!sectionText,
      });
    }

    // 4. Build initial state for modal graph
    const initialState = buildModalGraphStateFromRequest(
      body,
      projectSlug,
      sectionHeadline,
      sectionText
    );

    if (process.env.NODE_ENV !== "production") {
      console.log("[API /ai/modal] Invoking modal graph", {
        question: initialState.question?.substring(0, 100),
        projectSlug: initialState.projectSlug,
        hasSectionText: !!initialState.sectionText,
        historyLength: initialState.history?.length || 0,
      });
    }

    // 5. Invoke the modal graph
    let finalState: ModalGraphState;
    try {
      finalState = await modalGraphApp.invoke(initialState);
    } catch (graphError) {
      console.error("[API /ai/modal] Modal graph threw error:", graphError);
      // Re-throw to be caught by outer catch block
      throw graphError;
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[API /ai/modal] Modal graph completed", {
        answerLength: finalState.answerText?.length || 0,
        mode: (finalState as any).mode,
        debugNotesCount: finalState.debugNotes?.length || 0,
      });
    }

    // 6. Extract answer, mode, and debugNotes from final state
    const mode =
      (finalState as any).conversationMode ??
      (finalState as any).conversation_mode ??
      (finalState as any).mode ??
      "answer_direct";

    const answer: string =
      finalState.answerText ??
      (finalState as any).answer ??
      "I couldn't generate an answer for that question. Could you try rephrasing it?";

    const debugNotes: string[] = finalState.debugNotes ?? [];

    // 7. Generate smart actions
    const actions = generateModalActions({
      question,
      projectSlug,
      pagePath,
      topicLabel,
      caseStudy,
    });

    if (process.env.NODE_ENV !== "production") {
      console.log("[API /ai/modal] Actions generated", {
        actionsCount: actions.length,
        actionTypes: actions.map((a) => a.type),
      });
    }

    // 8. Build response
    console.log("[API /ai/modal] Building response");
    const responseBody: ModalResponseBody = {
      answer,
      mode,
      debugNotes: process.env.NODE_ENV !== "production" ? debugNotes : undefined,
      actions,
    };

    if (process.env.NODE_ENV !== "production") {
      console.log("[API /ai/modal] FULL RESPONSE BODY:", JSON.stringify(responseBody, null, 2));
    }

    return NextResponse.json(responseBody);
  } catch (error) {
    // Always log errors in development, and include error message in response
    console.error("[API /ai/modal] Error:", error);
    console.error("[API /ai/modal] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json(
      { 
        error: "Failed to generate AI response",
        message: process.env.NODE_ENV !== "production" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

