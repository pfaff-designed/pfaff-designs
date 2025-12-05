/**
 * Full KB Embedding Script
 * 
 * Usage: npm run embed:kb
 * 
 * This script:
 * 1. Uses the unified KB loader (loadProjectsKB, loadGlobalKB)
 * 2. Converts each KB section into text chunks suitable for embeddings
 * 3. Re-embeds all project + about sections into Supabase project_sections table
 * 4. Stores rich metadata along with embeddings
 * 5. Is idempotent (safe to run multiple times)
 */

// Load environment variables from .env.local (Next.js convention)
import dotenv from "dotenv";
import { resolve } from "node:path";

// Try .env.local first (Next.js convention), then fall back to .env
dotenv.config({ path: resolve(process.cwd(), ".env.local") });
dotenv.config({ path: resolve(process.cwd(), ".env") }); // Also load .env if it exists
import { createClient } from "@supabase/supabase-js";
import { loadProjectsKB, loadGlobalKB } from "../src/lib/kb/loader";
import type {
  ProjectKBEntry,
  ProjectSection,
  GlobalKB,
  GlobalSection,
} from "../src/lib/kb/types";
import { embeddings } from "../src/lib/ai/embeddings";

// Validate environment variables before creating Supabase client
// Support multiple variable name formats for flexibility
const supabaseUrl = 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.SUPABASE_URL;
  
const supabaseKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error("[KB] Error: Supabase URL not found");
  console.error("[KB] Please set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL in your .env.local file");
  process.exit(1);
}

if (!supabaseKey) {
  console.error("[KB] Error: Supabase key not found");
  console.error("[KB] Please set SUPABASE_SERVICE_ROLE_KEY (preferred) or SUPABASE_ANON_KEY in your .env.local file");
  process.exit(1);
}

if (process.env.SUPABASE_ANON_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("[KB] Warning: Using SUPABASE_ANON_KEY. For production, use SUPABASE_SERVICE_ROLE_KEY for admin operations.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const VECTOR_TABLE = "project_sections";
const EMBEDDING_DIM = 1536; // text-embedding-3-small dimension

// ---------- Embedding Helper ----------

/**
 * Generate embedding for text using OpenAI
 */
async function embed(text: string): Promise<number[]> {
  try {
    const embedding = await embeddings.embedQuery(text);
    
    if (!embedding || !Array.isArray(embedding) || embedding.length !== EMBEDDING_DIM) {
      throw new Error(`[KB] Invalid embedding response: expected ${EMBEDDING_DIM} dimensions, got ${embedding?.length || 0}`);
    }

    return embedding;
  } catch (error) {
    console.error(`[KB] Failed to generate embedding:`, error);
    throw error;
  }
}

// ---------- Chunking Strategy ----------

/**
 * Convert project section to embeddable text
 */
function sectionToText(project: ProjectKBEntry, section: ProjectSection): string {
  const parts: string[] = [];

  parts.push(`${project.client} — ${project.title}`);
  parts.push(section.title);

  if (section.body) {
    parts.push(section.body);
  }

  if (section.facts?.skillsUsed && Array.isArray(section.facts.skillsUsed)) {
    parts.push(`Skills used: ${section.facts.skillsUsed.join(", ")}`);
  }

  if (section.facts?.responsibilities && Array.isArray(section.facts.responsibilities)) {
    parts.push(`Responsibilities: ${section.facts.responsibilities.join("; ")}`);
  }

  if (section.facts?.outcomes && Array.isArray(section.facts.outcomes)) {
    parts.push(`Outcomes: ${section.facts.outcomes.join("; ")}`);
  }

  return parts.join("\n\n");
}

/**
 * Convert global section to embeddable text
 */
function globalSectionToText(global: GlobalKB, section: GlobalSection): string {
  const parts: string[] = [];

  parts.push(`About — ${section.title}`);

  if (section.body) {
    parts.push(section.body);
  }

  if (section.content) {
    if (Array.isArray(section.content.principles)) {
      parts.push(`Principles: ${section.content.principles.join("; ")}`);
    }
    if (Array.isArray(section.content.process)) {
      parts.push(`Process: ${section.content.process.join("; ")}`);
    }
    if (Array.isArray(section.content.policy)) {
      parts.push(`Policy: ${section.content.policy.join("; ")}`);
    }
  }

  if (section.values && Array.isArray(section.values)) {
    parts.push(
      "Values: " +
        section.values
          .map((v) => `${v.name}: ${v.description}`)
          .join(" | ")
    );
  }

  if (section.tools) {
    const toolGroups = Object.entries(section.tools)
      .map(([group, tools]) => `${group}: ${Array.isArray(tools) ? tools.join(", ") : String(tools)}`)
      .join(" | ");
    parts.push(`Tools: ${toolGroups}`);
  }

  return parts.join("\n\n");
}

// ---------- Embedding Functions ----------

/**
 * Embed all project sections
 */
async function embedProjects() {
  const projects = loadProjectsKB();
  console.log(`[KB] Loaded ${projects.length} projects`);

  let totalSections = 0;
  let successCount = 0;
  let errorCount = 0;

  for (const project of projects) {
    console.log(`[KB] Processing project: ${project.id} (${project.sections.length} sections)`);
    
    for (const section of project.sections) {
      totalSections++;
      
      try {
        const text = sectionToText(project, section);
        if (!text.trim()) {
          console.warn(`[KB] Skipping empty section ${project.id}:${section.id}`);
          continue;
        }

        const embedding = await embed(text);

        // Map section types to allowed database values
        // Allowed: "context" | "problem" | "solution" | "process" | "outcome" | "reflections"
        const sectionTypeMap: Record<string, "context" | "problem" | "solution" | "process" | "outcome" | "reflections"> = {
          context: "context",
          problem: "problem",
          solution: "solution",
          process: "process",
          outcomes: "outcome", // plural -> singular
          outcome: "outcome",
          reflections: "reflections",
          role: "context", // map role to context
          tools: "context", // map tools to context
          outcomes_structured: "outcome", // map to outcome
        };

        const mappedSectionType = sectionTypeMap[section.type] || "context";
        
        // Use project ID (like "tanger") instead of full slug ("/work/tanger")
        // The database expects just the project identifier
        const projectSlug = project.id;

        // Delete existing chunks for this project+section combination for idempotency
        // This ensures we can re-run the script safely
        const { error: deleteError } = await supabase
          .from(VECTOR_TABLE)
          .delete()
          .eq("project_slug", projectSlug)
          .eq("section_type", mappedSectionType);

        if (deleteError) {
          console.warn(`[KB] Warning: Could not delete existing chunks for ${projectSlug}:${section.id}:`, deleteError);
        }

        // Insert new chunk
        const { error } = await supabase
          .from(VECTOR_TABLE)
          .insert({
            project_slug: projectSlug,
            section_type: mappedSectionType,
            content: text,
            embedding: embedding,
            key_points: null,
            metrics: null,
          });

        if (error) {
          console.error(
            `[KB] Failed to insert project embedding ${project.id}:${section.id}`,
            error
          );
          errorCount++;
        } else {
          successCount++;
          if (successCount % 5 === 0) {
            console.log(`[KB] Progress: ${successCount}/${totalSections} sections embedded`);
          }
        }
      } catch (error) {
        console.error(`[KB] Error embedding ${project.id}:${section.id}:`, error);
        errorCount++;
      }
    }
  }

  console.log(`[KB] Project embedding complete: ${successCount} succeeded, ${errorCount} failed out of ${totalSections} total`);
}

/**
 * Embed all global About sections
 */
async function embedGlobal() {
  const global = loadGlobalKB();
  console.log(`[KB] Loaded global KB with ${global.sections.length} sections`);

  let successCount = 0;
  let errorCount = 0;

  for (const section of global.sections) {
    try {
      const text = globalSectionToText(global, section);
      if (!text.trim()) {
        console.warn(`[KB] Skipping empty global section ${section.id}`);
        continue;
      }

      const embedding = await embed(text);

      // Map global section types to allowed project_sections types
      // Global sections use types like "hero", "background", etc., but project_sections only allows:
      // "context" | "problem" | "solution" | "process" | "outcome" | "reflections"
      // We'll map all global sections to "context" since they're informational
      const mappedSectionType = "context" as const;

      // Delete existing chunks for this global section for idempotency
      const { error: deleteError } = await supabase
        .from(VECTOR_TABLE)
        .delete()
        .eq("project_slug", "about-global")
        .eq("section_type", mappedSectionType);

      if (deleteError) {
        console.warn(`[KB] Warning: Could not delete existing chunks for ${global.id}:${section.id}:`, deleteError);
      }

      // Insert new chunk
      // Note: For global sections, we use "about-global" as project_slug
      const { error } = await supabase
        .from(VECTOR_TABLE)
        .insert({
          project_slug: "about-global",
          section_type: mappedSectionType,
          content: text,
          embedding: embedding,
          key_points: null,
          metrics: null,
        });

      if (error) {
        console.error(
          `[KB] Failed to insert global embedding ${global.id}:${section.id}`,
          error
        );
        errorCount++;
      } else {
        successCount++;
      }
    } catch (error) {
      console.error(`[KB] Error embedding global section ${section.id}:`, error);
      errorCount++;
    }
  }

  console.log(`[KB] Global embedding complete: ${successCount} succeeded, ${errorCount} failed`);
}

// ---------- Main Entrypoint ----------

async function main() {
  console.log("[KB] Starting KB embedding process...\n");

  // Validation already done at module level when creating Supabase client
  // This check is redundant but kept for clarity
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL and key are required. Check your .env.local file.");
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }

  try {
    console.log("[KB] Embedding project sections...");
    await embedProjects();

    console.log("\n[KB] Embedding global about sections...");
    await embedGlobal();

    console.log("\n[KB] Embedding complete.");
  } catch (error) {
    console.error("[KB] embed-kb.ts failed", error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[KB] Fatal error:", err);
  process.exit(1);
});

