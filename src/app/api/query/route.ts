import { NextRequest, NextResponse } from "next/server";

/**
 * @deprecated This endpoint is deprecated. Use /api/ai/query instead.
 * 
 * This endpoint was used by the old pattern where pages directly called the API.
 * The new pattern uses GlobalComposer → /api/ai/query → AIAnswerContext → pages.
 * 
 * Keeping GET handler for backwards compatibility if needed.
 */

export async function GET() {
  const hasKey = !!process.env.LANGCHAIN_API_KEY;
  // NEVER return the key to the client – just a boolean
  return NextResponse.json({
    langchainKeyPresent: hasKey,
  });
}

/**
 * @deprecated POST handler is deprecated. Use /api/ai/query instead.
 * This endpoint always returns null answerLayout and should not be used.
 */
export async function POST(req: NextRequest) {
  return NextResponse.json(
    { 
      error: "This endpoint is deprecated. Use /api/ai/query instead.",
      answerLayout: null,
      suggestions: [],
    },
    { status: 410 } // 410 Gone - indicates resource is permanently unavailable
  );
}


