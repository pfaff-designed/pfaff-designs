/**
 * API Route for Palette Router
 * 
 * POST /api/palette
 * 
 * Body: { query: string, pageSlug: string, sectionId?: string | null, projectSlug?: string | null }
 * 
 * Returns: RouterResult with structured actions
 */

import { NextRequest, NextResponse } from "next/server";
import { routeIntent } from "@/lib/ai/router";
import type { RouterInput } from "@/lib/ai/routerTypes";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const input: RouterInput = {
      query: body.query,
      pageSlug: body.pageSlug,
      sectionId: body.sectionId ?? null,
      projectSlug: body.projectSlug ?? null,
    };

    if (!input.query || typeof input.query !== "string") {
      return NextResponse.json(
        { error: "query is required and must be a string" },
        { status: 400 }
      );
    }

    if (!input.pageSlug || typeof input.pageSlug !== "string") {
      return NextResponse.json(
        { error: "pageSlug is required and must be a string" },
        { status: 400 }
      );
    }

    // Call router
    const result = await routeIntent(input);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

