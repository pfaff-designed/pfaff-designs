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

  if (!query || query.trim().length === 0) {
    return [];
  }

  try {
    // Generate embedding for the query
    const queryEmbedding = await embeddings.embedQuery(query);

    // Call Supabase RPC function for similarity search
    const { data, error } = await supabase.rpc("match_project_chunks", {
      query_embedding: queryEmbedding,
      match_count: matchCount,
      filter_project_id: projectId ?? null,
    });

    if (error) {
      console.error("Error calling match_project_chunks:", error);
      throw error;
    }

    return (data ?? []) as RetrievedChunk[];
  } catch (error) {
    console.error("Error retrieving project chunks:", error);
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

