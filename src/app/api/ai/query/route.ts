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
      // Override answerMode to "full" when generating
      const intentWithOverride = { ...intent, answerMode: "full" as const };

      answerLayout = await runCopywriterPipeline(
        message,
        intentWithOverride,
        pageContext,
      );
    }

    const responseBody: QueryResponse = {
      answerLayout,
      suggestions,
    };

    return NextResponse.json(responseBody);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process AI query" },
      { status: 400 },
    );
  }
}

