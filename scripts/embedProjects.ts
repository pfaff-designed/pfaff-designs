/**
 * @deprecated This script is deprecated in favor of scripts/embed-kb.ts
 * 
 * The new embed-kb.ts script:
 * - Uses the unified KB loader (loadProjectsKB, loadGlobalKB)
 * - Handles both project and global About sections
 * - Provides better metadata and idempotency
 * 
 * Migration: Use `npm run embed:kb` instead of `npm run embed-projects`
 * 
 * This script is kept for backward compatibility but will not be maintained.
 * 
 * ---
 * 
 * Original description:
 * Ingestion script to chunk and embed long-form project documents
 * 
 * Usage: npm run embed-projects
 * 
 * This script:
 * 1. Loads long-form YAML files from knowledge-base/projects/
 * 2. Chunks them into smaller passages
 * 3. Generates embeddings for each chunk
 * 4. Inserts chunks into Supabase project_chunks table
 */

import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import * as yaml from "js-yaml";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { createClient } from "@supabase/supabase-js";
import { embeddings } from "../src/lib/ai/embeddings";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type LongformDoc = {
  project_id: string;
  source: string;
  sections: Array<{ heading: string; body: string }>;
};

/**
 * Load all long-form documents from knowledge-base/projects/
 */
async function loadLongformDocs(): Promise<LongformDoc[]> {
  const projectsDir = path.join(process.cwd(), "knowledge-base", "projects");
  const projectDirs = await fs.readdir(projectsDir, { withFileTypes: true });

  const docs: LongformDoc[] = [];

  for (const projectDir of projectDirs) {
    if (!projectDir.isDirectory()) continue;

    const projectPath = path.join(projectsDir, projectDir.name);
    const files = await fs.readdir(projectPath);

    // Look for long-form YAML files
    const longformFiles = files.filter(
      (file) =>
        file.toLowerCase().includes("long") &&
        (file.endsWith(".yaml") || file.endsWith(".yml") || file.endsWith(".YAML"))
    );

    for (const file of longformFiles) {
      try {
        const filePath = path.join(projectPath, file);
        const raw = await fs.readFile(filePath, "utf8");
        const parsed = yaml.load(raw) as any;

        // Extract project_id from directory name or file content
        const projectId = parsed.project?.id || parsed.project_id || parsed.projectId || projectDir.name;
        
        // Extract sections - handle different possible structures
        let sections: Array<{ heading: string; body: string }> = [];
        
        // Handle Capital One style: top-level keys like "context", "problem", "solution", etc.
        const sectionKeys = ["context", "problem", "solution", "process", "outcomes", "reflections", "role", "tools"];
        const hasTopLevelSections = sectionKeys.some(key => parsed[key]);
        
        if (hasTopLevelSections) {
          sections = sectionKeys
            .filter(key => parsed[key])
            .map(key => ({
              heading: key.charAt(0).toUpperCase() + key.slice(1),
              body: typeof parsed[key] === "string" ? parsed[key] : String(parsed[key]),
            }));
        } else if (Array.isArray(parsed.sections)) {
          sections = parsed.sections.map((s: any) => ({
            heading: s.heading || s.title || "",
            body: s.body || s.content || "",
          }));
        } else if (parsed.content) {
          // Handle single content block
          sections = [{ heading: "", body: parsed.content }];
        } else {
          // Try to extract from any structure
          const keys = Object.keys(parsed).filter(
            (k) => !["project_id", "projectId", "project", "version", "kind"].includes(k)
          );
          sections = keys.map((key) => ({
            heading: key,
            body: typeof parsed[key] === "string" ? parsed[key] : JSON.stringify(parsed[key]),
          }));
        }

        docs.push({
          project_id: projectId,
          source: file,
          sections,
        });

        console.log(`Loaded ${projectId} from ${file} (${sections.length} sections)`);
      } catch (error) {
        console.error(`Error loading ${file}:`, error);
      }
    }
  }

  return docs;
}

/**
 * Chunk and embed a single project document
 */
async function embedProjectDoc(doc: LongformDoc) {
  // Combine all sections into full text
  const fullText = doc.sections
    .map((s) => {
      if (s.heading && s.body) {
        return `${s.heading}\n\n${s.body}`;
      }
      return s.body || s.heading || "";
    })
    .filter((text) => text.trim().length > 0)
    .join("\n\n---\n\n");

  if (!fullText.trim()) {
    console.warn(`Skipping ${doc.project_id}: no content found`);
    return;
  }

  // Chunk the text
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 200,
  });

  const chunkDocs = await splitter.createDocuments([fullText]);
  const contents = chunkDocs.map((c) => c.pageContent);

  console.log(`Embedding ${doc.project_id}: ${contents.length} chunks`);

  // Generate embeddings
  const vectors = await embeddings.embedDocuments(contents);

  // Prepare rows for insertion
  const rows = contents.map((content, index) => ({
    project_id: doc.project_id,
    source: doc.source,
    chunk_index: index,
    content,
    embedding: vectors[index],
  }));

  // Delete existing chunks for this project to avoid duplicates
  const { error: deleteError } = await supabase
    .from("project_chunks")
    .delete()
    .eq("project_id", doc.project_id);

  if (deleteError) {
    console.warn(`Warning: Could not delete existing chunks for ${doc.project_id}:`, deleteError);
  }

  // Insert new chunks
  const { error } = await supabase.from("project_chunks").insert(rows as any);

  if (error) {
    console.error(`Failed to insert chunks for ${doc.project_id}:`, error);
    throw error;
  }

  console.log(`✓ Successfully embedded ${doc.project_id} (${rows.length} chunks)`);
}

/**
 * Main function
 */
async function main() {
  console.log("Starting project embedding process...\n");

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL environment variable is required");
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }

  const docs = await loadLongformDocs();

  if (docs.length === 0) {
    console.log("No long-form documents found.");
    return;
  }

  console.log(`\nFound ${docs.length} project document(s) to embed\n`);

  for (const doc of docs) {
    try {
      await embedProjectDoc(doc);
    } catch (error) {
      console.error(`Error embedding ${doc.project_id}:`, error);
      // Continue with next document
    }
  }

  console.log("\n✓ Done embedding all projects.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

