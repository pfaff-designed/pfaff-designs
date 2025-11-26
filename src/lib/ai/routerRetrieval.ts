/**
 * Router Retrieval Helpers
 * 
 * Provides retrieval functions for the router to get relevant context
 * from project sections and global about sections.
 */

import { createClient } from "@supabase/supabase-js";
import { embeddings } from "./embeddings";
import type { RouterInput } from "./routerTypes";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface RelevantSection {
  project_slug: string | null;
  section_type: string;
  content: string;
  similarity: number;
}

/**
 * Get relevant project sections using vector similarity search
 * 
 * @param input - Router input with query and context
 * @param limit - Maximum number of sections to retrieve (default: 5)
 * @returns Array of relevant project sections
 */
export async function getRelevantProjectSections(
  input: RouterInput,
  limit: number = 5
): Promise<RelevantSection[]> {
  try {
    if (!input.query || input.query.trim().length === 0) {
      return [];
    }

    // Check if Supabase is configured
    if (!supabase) {
      console.warn("[Router] Supabase not configured, skipping project section retrieval");
      return [];
    }

    // Generate embedding for the query
    let queryEmbedding: number[];
    try {
      queryEmbedding = await embeddings.embedQuery(input.query);
    } catch (error) {
      console.error("[Router] Failed to generate embedding:", error);
      // Return empty array if embeddings fail (e.g., missing OPENAI_API_KEY)
      return [];
    }

    // Build RPC call parameters
    const rpcParams: {
      query_embedding: number[];
      match_count: number;
      filter_project_slug?: string | null;
    } = {
      query_embedding: queryEmbedding,
      match_count: limit,
    };

    // Optionally filter by project slug if provided
    if (input.projectSlug) {
      rpcParams.filter_project_slug = input.projectSlug;
    }

    // Call Supabase RPC function for similarity search
    // Note: This assumes an RPC function exists for project_sections
    // The function should be similar to match_project_chunks but query project_sections table
    // If the RPC doesn't exist, fallback will use direct query
    let { data, error } = await supabase.rpc("match_project_sections", rpcParams);
    
    // If RPC function doesn't exist, error will be set and we'll use fallback
    if (error && (error.code === "42883" || error.message?.includes("function") || error.message?.includes("does not exist"))) {
      console.warn("[Router] RPC function match_project_sections not found, using fallback");
      return await getRelevantProjectSectionsFallback(input, limit, queryEmbedding);
    }

    if (error) {
      console.error("[Router] Error retrieving project sections:", error);
      // Fallback: try direct query if RPC doesn't exist
      return await getRelevantProjectSectionsFallback(input, limit, queryEmbedding);
    }

    return (data ?? []) as RelevantSection[];
  } catch (error) {
    console.error("[Router] Error in getRelevantProjectSections:", error);
    return [];
  }
}

/**
 * Fallback method using direct Supabase query with vector similarity
 */
async function getRelevantProjectSectionsFallback(
  input: RouterInput,
  limit: number,
  queryEmbedding: number[]
): Promise<RelevantSection[]> {
  try {
    let query = supabase
      .from("project_sections")
      .select("project_slug, section_type, content")
      .limit(limit);

    // Filter by project slug if provided
    if (input.projectSlug) {
      query = query.eq("project_slug", input.projectSlug);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.error("[Router] Fallback query error:", error);
      return [];
    }

    // Calculate similarity manually (cosine similarity)
    // This is a simplified version - in production, use pgvector's match_documents
    const sections: RelevantSection[] = data.map((section) => ({
      project_slug: section.project_slug,
      section_type: section.section_type,
      content: section.content,
      similarity: 0.5, // Placeholder - would need actual vector similarity calculation
    }));

    return sections;
  } catch (error) {
    console.error("[Router] Fallback retrieval error:", error);
    return [];
  }
}

/**
 * Get relevant global about sections using vector similarity search
 * 
 * @param input - Router input with query and context
 * @param limit - Maximum number of sections to retrieve (default: 5)
 * @returns Array of relevant global sections
 */
export async function getRelevantGlobalSections(
  input: RouterInput,
  limit: number = 5
): Promise<RelevantSection[]> {
  try {
    if (!input.query || input.query.trim().length === 0) {
      return [];
    }

    // Check if Supabase is configured
    if (!supabase) {
      console.warn("[Router] Supabase not configured, skipping global section retrieval");
      return [];
    }

    // Generate embedding for the query
    let queryEmbedding: number[];
    try {
      queryEmbedding = await embeddings.embedQuery(input.query);
    } catch (error) {
      console.error("[Router] Failed to generate embedding:", error);
      // Return empty array if embeddings fail (e.g., missing OPENAI_API_KEY)
      return [];
    }

    // Query global sections (project_slug = "about-global")
    let { data, error } = await supabase.rpc("match_project_sections", {
      query_embedding: queryEmbedding,
      match_count: limit,
      filter_project_slug: "about-global",
    });
    
    // If RPC function doesn't exist, use fallback
    if (error && (error.code === "42883" || error.message?.includes("function") || error.message?.includes("does not exist"))) {
      console.warn("[Router] RPC function match_project_sections not found, using fallback");
      return await getRelevantGlobalSectionsFallback(input, limit, queryEmbedding);
    }

    if (error) {
      console.error("[Router] Error retrieving global sections:", error);
      // Fallback: direct query
      return await getRelevantGlobalSectionsFallback(input, limit, queryEmbedding);
    }

    return (data ?? []) as RelevantSection[];
  } catch (error) {
    console.error("[Router] Error in getRelevantGlobalSections:", error);
    return [];
  }
}

/**
 * Fallback method for global sections using direct Supabase query
 */
async function getRelevantGlobalSectionsFallback(
  input: RouterInput,
  limit: number,
  queryEmbedding: number[]
): Promise<RelevantSection[]> {
  try {
    const { data, error } = await supabase
      .from("project_sections")
      .select("project_slug, section_type, content")
      .eq("project_slug", "about-global")
      .limit(limit);

    if (error || !data) {
      console.error("[Router] Fallback global query error:", error);
      return [];
    }

    const sections: RelevantSection[] = data.map((section) => ({
      project_slug: section.project_slug,
      section_type: section.section_type,
      content: section.content,
      similarity: 0.5, // Placeholder
    }));

    return sections;
  } catch (error) {
    console.error("[Router] Fallback global retrieval error:", error);
    return [];
  }
}

