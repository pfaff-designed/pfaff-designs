import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { embeddings } from "@/lib/ai/embeddings";

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabase) return supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn("[RAG] Supabase URL/key missing. Retrieval will be skipped.");
    return null;
  }

  supabase = createClient(url, key);
  return supabase;
}

export type RetrievedChunk = {
  id: string;
  projectId?: string;
  source: "project_longform" | "project_facts" | "about_global" | "identity_longform" | string;
  sectionId?: string;
  sectionType?: string; // e.g. "context" | "problem" | "solution" | "process" | "outcomes"
  tags?: string[];
  docType?: string;
  text: string;         // the actual content
  score?: number;       // similarity score, if available
};

/**
 * Retrieve relevant project chunks using vector similarity search
 * 
 * @param query - The user's query/question
 * @param options - Optional parameters
 * @param options.projectId - Filter chunks by specific project ID
 * @param options.matchCount - Number of chunks to retrieve (default: 8)
 * @returns Array of retrieved chunks with similarity scores
 */
export async function retrieveProjectChunks(
  query: string,
  options?: { projectId?: string; matchCount?: number; docTypes?: string[] }
): Promise<RetrievedChunk[]> {
  const { projectId, matchCount = 8, docTypes } = options ?? {};

  console.log("[RAG] retrieveProjectChunks called", {
    query: query.substring(0, 100),
    projectId,
    matchCount,
  });

  if (!query || query.trim().length === 0) {
    console.warn("[RAG] Empty query, returning empty array");
    return [];
  }

  try {
    const supabaseClient = getSupabase();
    if (!supabaseClient) {
      return [];
    }

    // Generate embedding for the query
    console.log("[RAG] Generating embedding for query");
    const queryEmbedding = await embeddings.embedQuery(query);
    console.log("[RAG] Embedding generated, length:", queryEmbedding.length);

    // Call Supabase RPC function for similarity search
    console.log("[RAG] Calling Supabase match_project_chunks", {
      filter_project_id: projectId ?? null,
      match_count: matchCount,
    });

    const { data, error } = await supabaseClient.rpc("match_project_chunks", {
      filter_project_id: projectId ?? null,
      match_count: matchCount,
      query_embedding: queryEmbedding,
    });
    
    console.log("[RAG] Supabase RPC raw", {
      error,
      dataLength: data?.length ?? 0,
      firstRow: data?.[0] ?? null,
    });

    if (error) {
      console.error("[RAG] Error calling match_project_chunks:", error);
      console.error("[RAG] Error details:", {
        message: error.message,
        code: error.code,
        hint: error.hint,
      });
      
      // If RPC function doesn't exist, return empty array instead of throwing
      // This allows the modal to still work with fallback context
      if (error.code === "42883" || error.message?.includes("function") || error.message?.includes("does not exist")) {
        console.warn("[RAG] RPC function match_project_chunks not found. Returning empty chunks. Please create the RPC function in Supabase.");
        return [];
      }
      
      throw error;
    }

    // Transform Supabase data to enriched RetrievedChunk format
    let chunks: RetrievedChunk[] = (data ?? []).map((item: any) => ({
      id: item.id || String(Math.random()),
      projectId: item.project_id || item.project_slug || undefined,
      source: item.source || "project_longform", // Default if not specified
      sectionId: item.section_id || undefined,
      sectionType: item.section_type || undefined,
      tags: item.tags || undefined,
      docType: item.doc_type || item.docType || undefined,
      text: item.content || item.text || "",
      score: item.similarity !== undefined ? item.similarity : item.score,
    }));

    // Optional doc_type filtering (best-effort — respects available metadata)
    if (docTypes && docTypes.length > 0) {
      const allowed = new Set(docTypes);
      chunks = chunks.filter((chunk) => {
        const tagDocType = chunk.docType || chunk.tags?.find((t) => allowed.has(t));
        if (tagDocType && allowed.has(tagDocType)) return true;
        if (chunk.tags && chunk.tags.some((t) => allowed.has(t))) return true;
        return false;
      });
    }

    console.log("[RAG] Retrieved chunks", {
      count: chunks.length,
      chunksPreview: chunks.slice(0, 2).map(c => ({
        id: c.id,
        projectId: c.projectId,
        source: c.source,
        sectionType: c.sectionType,
        textLength: c.text?.length || 0,
        score: c.score,
      })),
    });

    return chunks;
  } catch (error) {
    console.error("[RAG] Error retrieving project chunks:", error);
    console.error("[RAG] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Return empty array on error to allow pipeline to continue
    return [];
  }
}

/**
 * Build context string from retrieved chunks
 * 
 * @param chunks - Retrieved chunks from vector search
 * @returns Formatted context string
 */
export function buildContextFromChunks(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return "";
  }

  return chunks
    .map((chunk, index) => {
      const source = chunk.projectId || chunk.source || "unknown";
      return `[Chunk ${index + 1} from ${source}${chunk.sectionType ? ` (${chunk.sectionType})` : ""}]\n${chunk.text}`;
    })
    .join("\n\n---\n\n");
}

