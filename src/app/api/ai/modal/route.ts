import { NextRequest, NextResponse } from "next/server";
import { retrieveProjectChunks, buildContextFromChunks } from "@/lib/rag/retrieveProjectChunks";
import { runCopywriter } from "@/lib/ai/copywriter";
import type { CopywriterInput } from "@/lib/ai/copywriterSchemas";

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
// HELPER: Derive project slug from page path
// ============================================================

function deriveProjectSlugFromPath(pagePath?: string): string | undefined {
  if (!pagePath) return undefined;
  
  // Match paths like /work/capital-one or /work/coca-cola
  const match = pagePath.match(/^\/work\/([^/]+)/);
  return match ? match[1] : undefined;
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
    const { question, topicLabel, topicId, source, pagePath } = body;

    if (process.env.NODE_ENV !== "production") {
      console.log("[API /ai/modal] Request received", {
        question: question?.substring(0, 100),
        topicLabel,
        topicId,
        source,
        pagePath,
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

    // 2. Retrieve relevant chunks using RAG
    const retrievedChunks = await retrieveProjectChunks(question, {
      projectId: projectSlug,
      matchCount: 6, // Lighter than page-level (which uses 15)
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

    // 4. Build copywriter input
    const copywriterInput: CopywriterInput = {
      question,
      context: finalContext,
      projectId: projectSlug || null,
      sectionTitle: topicLabel || "General",
      sectionBody: "", // Modal doesn't pass full section body
      projectShortFacts: undefined, // Could be added later if needed
    };

    if (process.env.NODE_ENV !== "production") {
      console.log("[API /ai/modal] Calling copywriter");
    }

    // 5. Call copywriter
    const copywriterOutput = await runCopywriter(copywriterInput);

    if (process.env.NODE_ENV !== "production") {
      console.log("[API /ai/modal] Copywriter completed", {
        hasAnswerBlocks: !!copywriterOutput.answer_blocks,
        answerBlocksCount: copywriterOutput.answer_blocks?.length || 0,
      });
    }

    // 6. Extract answer from first block
    const answer =
      copywriterOutput.answer_blocks?.[0]?.body?.trim() ||
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

