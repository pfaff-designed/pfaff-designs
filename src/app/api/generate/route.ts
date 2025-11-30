import { NextRequest, NextResponse } from "next/server";
import { classifyIntent } from "@/lib/ai/intents";
import { contentStrategies } from "@/lib/ai/contentStrategies";
import { getLayoutStrategy } from "@/lib/ai/layoutStrategies";
import { runCopywriterPipeline } from "@/lib/ai/pipeline";
import { runIntentRouter } from "@/lib/ai/intentRouter";
import { buildSuggestionsFromIntent } from "@/lib/ai/suggestions";
import { QueryRequestSchema, type QueryResponse, type RoutedIntent, type AISuggestion, type PageContext } from "@/lib/ai/queryTypes";

/**
 * Intent-driven generation endpoint
 * User Query → Intent Classifier → Content Strategy → Layout Strategy → 
 * Copywriter → Orchestrator → Deterministic Renderer → UI
 */
export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    
    // Validate request (reuse QueryRequestSchema from existing system)
    const parsed = QueryRequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { message, pageContext, history = [] } = parsed.data;

    // Step 1: Classify audience intent (recruiter, hiring_manager, client, general)
    const intentProfile = await classifyIntent(message, {
      currentPath: pageContext.route,
      referrer: req.headers.get("referer") || undefined,
    });

    // Step 2: Get content and layout strategies based on intent
    const contentStrategy = contentStrategies[intentProfile.intent];
    const layoutStrategy = getLayoutStrategy(intentProfile.intent);

    // Step 3: Run routed intent (for navigation/suggestions)
    const routedIntent: RoutedIntent = await runIntentRouter({
      message,
      pageContext,
      history: history ?? [],
    });

    // Step 4: Run pipeline with intent-driven strategies
    const answerLayout = await runCopywriterPipeline(
      message,
      routedIntent,
      pageContext,
      intentProfile,
      contentStrategy,
      layoutStrategy,
    );

    // Step 5: Build suggestions
    const suggestions: AISuggestion[] = buildSuggestionsFromIntent(
      routedIntent,
      pageContext,
    );

    // Debug logging (dev mode)
    const isDev = process.env.NODE_ENV === "development";

    const responseBody: QueryResponse & { debug?: any } = {
      answerLayout,
      suggestions,
      // Include debug info in dev mode (cast to any to avoid type error)
      ...(isDev && {
        debug: {
          intentProfile,
          contentStrategy,
          layoutStrategy: {
            preferredComponents: layoutStrategy.preferredComponents,
          },
        },
      }),
    };

    return NextResponse.json(responseBody);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process generation request" },
      { status: 500 },
    );
  }
}

