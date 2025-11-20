import { NextRequest, NextResponse } from "next/server";
import { retrieveProjectChunks, buildContextFromChunks } from "@/lib/rag/retrieveProjectChunks";
import { runModalCopywriter } from "@/lib/ai/copywriter";
import { getCaseStudyBySlug } from "@/lib/caseStudies/data";

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
  actions?: Array<{
    type: "navigate" | "scroll" | "deep_dive";
    label: string;
    target?: string;
    topic?: string;
  }>;
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

    // 4. Best-effort section context lookup
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

    // 5. Call modal-specific copywriter
    if (process.env.NODE_ENV !== "production") {
      console.log("[API /ai/modal] Calling modal copywriter");
    }

    const modalOutput = await runModalCopywriter({
      question,
      context: finalContext,
      projectSlug,
      pagePath,
      sectionHeadline,
      sectionText,
      topicLabel,
      history: history ?? [],
    });

    if (process.env.NODE_ENV !== "production") {
      console.log("[API /ai/modal] Modal copywriter completed", {
        answerLength: modalOutput.answer?.length || 0,
      });
    }

    // 6. Extract answer
    const answer =
      modalOutput.answer?.trim() ||
      "I couldn't generate an answer for that question. Could you try rephrasing it?";

    // 7. Build response (no actions for now)
    const responseBody: ModalResponseBody = {
      answer,
      actions: [], // Future: generate actions based on intent
    };

    if (process.env.NODE_ENV !== "production") {
      console.log("[API /ai/modal] Response ready", {
        answerLength: answer.length,
        actionsCount: responseBody.actions?.length || 0,
      });
    }

    return NextResponse.json(responseBody);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[API /ai/modal] Error:", error);
      console.error("[API /ai/modal] Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    return NextResponse.json(
      { error: "Failed to generate AI response" },
      { status: 500 }
    );
  }
}

