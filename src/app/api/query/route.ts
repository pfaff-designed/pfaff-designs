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

    // Generate response ID (UUID-like format with timestamp)
    const responseId = `resp_${new Date().toISOString().replace(/[:.]/g, "-")}`;
    const createdAt = new Date().toISOString();

    // Return new response shape with metadata
    // Ensure all data is properly serializable
    const response = {
      id: responseId,
      prompt: String(query),
      createdAt,
      layout: pageJSON,
    };

    // Validate response is serializable before sending
    try {
      JSON.stringify(response);
    } catch (serializeError) {
      console.error("Response serialization error:", serializeError);
      throw new Error("Failed to serialize response data");
    }

    return NextResponse.json(response);
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

