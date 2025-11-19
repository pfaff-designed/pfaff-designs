import { NextRequest, NextResponse } from "next/server";
import { QueryRequestSchema, type QueryResponse, type RoutedIntent, type AISuggestion } from "@/lib/ai/queryTypes";
import { runIntentRouter } from "@/lib/ai/intentRouter";
import { runCopywriterPipeline } from "@/lib/ai/pipeline";
import { buildSuggestionsFromIntent } from "@/lib/ai/suggestions";
import type { PageJSON } from "@/components/utility/Renderer";

/**
 * Global AI query endpoint
 * Accepts user message + page context, returns PageJSON answer + suggestions
 */
export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    
    // Validate request
    const parsed = QueryRequestSchema.safeParse(json);
    if (!parsed.success) {
      console.error("[API /ai/query] Validation error:", {
        errors: parsed.error.issues,
        receivedData: {
          message: json.message,
          pageContext: json.pageContext,
          history: json.history,
          forceGenerate: json.forceGenerate,
        },
      });
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { message, pageContext, history = [], forceGenerate = false } = parsed.data;

    const intent: RoutedIntent = await runIntentRouter({
      message,
      pageContext,
      history: history ?? [],
    });

    console.log("[API /ai/query] Intent router completed", {
      message,
      forceGenerate,
      intent: {
        answerMode: intent.answerMode,
        primaryTopicType: intent.primaryTopicType,
        primaryProjectSlug: intent.primaryProjectSlug,
        bestProjectSlug: intent.bestProjectSlug,
        bestSectionId: intent.bestSectionId,
        scrollRelevance: intent.scrollRelevance,
        navigationRelevance: intent.navigationRelevance,
      },
    });

    // Build suggestions
    const suggestions: AISuggestion[] = buildSuggestionsFromIntent(
      intent,
      pageContext,
    );

    // Generate answerLayout if:
    // 1. forceGenerate is true (explicitly requested)
    // 2. OR if there's a currentSectionId (inline answers should always generate)
    // 3. OR if we're on a case-study page (always generate inline answers on case studies)
    const shouldGenerate = forceGenerate || 
                           (pageContext.currentSectionId && (intent.answerMode === "full" || intent.answerMode === "brief")) ||
                           (pageContext.pageId === "case-study" && (intent.answerMode === "full" || intent.answerMode === "brief"));
    
    let answerLayout: PageJSON | null = null;
    
    if (shouldGenerate) {
      console.log("[API /ai/query] Generating answer", {
        message,
        forceGenerate,
        currentSectionId: pageContext.currentSectionId,
        pageId: pageContext.pageId,
        intentAnswerMode: intent.answerMode,
        intentBestSectionId: intent.bestSectionId,
        intentScrollRelevance: intent.scrollRelevance,
        shouldGenerateReason: forceGenerate ? "forceGenerate=true" : pageContext.currentSectionId ? "currentSectionId exists" : "case-study page",
      });

      // Override answerMode to "full" when generating
      const intentWithOverride = { ...intent, answerMode: "full" as const };

      answerLayout = await runCopywriterPipeline(
        message,
        intentWithOverride,
        pageContext,
      );
    } else {
      console.log("[API /ai/query] Skipping pipeline - only returning suggestions", {
        forceGenerate,
        currentSectionId: pageContext.currentSectionId,
        pageId: pageContext.pageId,
        answerMode: intent.answerMode,
      });
    }

    console.log("[API /ai/query] Pipeline completed", {
      hasAnswerLayout: !!answerLayout,
      answerLayoutType: answerLayout ? typeof answerLayout : null,
      answerLayoutKeys: answerLayout && typeof answerLayout === 'object' ? Object.keys(answerLayout) : null,
    });

    console.log("[AI QUERY DEBUG]", {
      message,
      pageContext,
      intent,
      hasAnswerLayout: !!answerLayout,
      answerLayoutPreview: answerLayout ? JSON.stringify(answerLayout).substring(0, 300) : null,
      suggestions,
      suggestionsCount: suggestions.length,
    });

    const responseBody: QueryResponse = {
      answerLayout,
      suggestions,
    };

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error("[/api/ai/query] Error:", error);
    return NextResponse.json(
      { error: "Failed to process AI query" },
      { status: 400 },
    );
  }
}

