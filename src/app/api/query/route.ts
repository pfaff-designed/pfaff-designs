import { NextRequest, NextResponse } from "next/server";
import { handleQuery } from "@/lib/ai/queryHandler";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required and must be a string" },
        { status: 400 }
      );
    }

    console.log("API route: Processing query:", query);
    const pageJSON = await handleQuery(query);
    console.log("API route: Query handler returned:", { 
      version: pageJSON.version, 
      pageId: pageJSON.page?.id, 
      blocksCount: pageJSON.page?.blocks?.length 
    });

    return NextResponse.json(pageJSON);
  } catch (error) {
    console.error("Error in query API route:", error);
    
    // Log full error details
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      {
        error: "Failed to process query",
        message: error instanceof Error ? error.message : String(error),
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

