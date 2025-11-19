import { createClient } from "@supabase/supabase-js";
import { embeddings } from "@/lib/ai/embeddings";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type RetrievedChunk = {
  id: string;
  project_id: string;
  content: string;
  similarity: number;
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
  options?: { projectId?: string; matchCount?: number }
): Promise<RetrievedChunk[]> {
  const { projectId, matchCount = 8 } = options ?? {};

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
    // Generate embedding for the query
    console.log("[RAG] Generating embedding for query");
    const queryEmbedding = await embeddings.embedQuery(query);
    console.log("[RAG] Embedding generated, length:", queryEmbedding.length);

    // Call Supabase RPC function for similarity search
    console.log("[RAG] Calling Supabase match_project_chunks", {
      filter_project_id: projectId ?? null,
      match_count: matchCount,
    });

    const { data, error } = await supabase.rpc("match_project_chunks", {
      query_embedding: queryEmbedding,
      match_count: matchCount,
      filter_project_id: projectId ?? null,
    });

    if (error) {
      console.error("[RAG] Error calling match_project_chunks:", error);
      throw error;
    }

    const chunks = (data ?? []) as RetrievedChunk[];
    console.log("[RAG] Retrieved chunks", {
      count: chunks.length,
      chunksPreview: chunks.slice(0, 2).map(c => ({
        id: c.id,
        project_id: c.project_id,
        contentLength: c.content?.length || 0,
        similarity: c.similarity,
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
      return `[Chunk ${index + 1} from ${chunk.project_id}]\n${chunk.content}`;
    })
    .join("\n\n---\n\n");
}

