import { NextRequest, NextResponse } from "next/server";
import { retrieveProjectChunks, buildContextFromChunks } from "@/lib/rag/retrieveProjectChunks";
import { runModalCopywriter } from "@/lib/ai/copywriter";
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
  actions: AiModalAction[];
}

// ============================================================
// HELPERS
// ============================================================

function deriveProjectSlugFromPath(pagePath?: string): string | undefined {
  if (!pagePath) return undefined;
  
  // Match paths like /work/capital-one or /work/coca-cola
  const match = pagePath.match(/^\/work\/([^/]+)/);
  return match ? match[1] : undefined;
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
 * Uses RAG + copywriter to generate a simple text answer.
 * Does NOT use orchestrator or PageJSON.
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

    // 2. Retrieve relevant chunks using RAG (increased from 6 to 8 for richer context)
    const retrievedChunks = await retrieveProjectChunks(question, {
      projectId: projectSlug,
      matchCount: 8,
    });

    const context = buildContextFromChunks(retrievedChunks);

    if (process.env.NODE_ENV !== "production") {
      console.log("[API /ai/modal] RAG retrieval completed", {
        chunksRetrieved: retrievedChunks.length,
        contextLength: context?.length || 0,
      });
    }

    // 3. If no context, provide minimal fallback
    const finalContext = context && context.trim().length > 0
      ? context
      : `User question: ${question}\n\nContext: Answering based on general portfolio knowledge.`;

    // 4. Get case study data (used for section context and action generation)
    const caseStudy = projectSlug ? getCaseStudyBySlug(projectSlug) : null;

    // 5. Best-effort section context lookup
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

    // 6. Call modal-specific copywriter
    console.log("[API /ai/modal] Calling modal copywriter");
    let modalOutput;
    try {
      modalOutput = await runModalCopywriter({
        question,
        context: finalContext,
        projectSlug,
        pagePath,
        sectionHeadline,
        sectionText,
        topicLabel,
        history: history ?? [],
      });
    } catch (copywriterError) {
      console.error("[API /ai/modal] Copywriter threw error:", copywriterError);
      // Re-throw to be caught by outer catch block
      throw copywriterError;
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[API /ai/modal] Modal copywriter completed", {
        answerLength: modalOutput.answer?.length || 0,
      });
    }

    // 7. Extract answer
    const answer =
      modalOutput.answer?.trim() ||
      "I couldn't generate an answer for that question. Could you try rephrasing it?";

    // 8. Generate smart actions
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

    // 9. Build response
    console.log("[API /ai/modal] Building response");
    const responseBody: ModalResponseBody = {
      answer,
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

