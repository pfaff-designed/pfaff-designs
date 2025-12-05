/**
 * Sync Projects from KB to Supabase
 * 
 * Usage: npm run sync:projects
 * 
 * This script:
 * 1. Loads all projects from the KB using loadProjectsKB()
 * 2. Upserts each project into the Supabase `projects` table
 * 3. Sets `summary_short` to equal the KB `one_liner`
 * 4. Ensures projects exist before embeddings can reference them
 */

// Load environment variables from .env.local (Next.js convention)
import dotenv from "dotenv";
import { resolve } from "node:path";

// Try .env.local first (Next.js convention), then fall back to .env
dotenv.config({ path: resolve(process.cwd(), ".env.local") });
dotenv.config({ path: resolve(process.cwd(), ".env") }); // Also load .env if it exists

import { createClient } from "@supabase/supabase-js";
import { loadProjectsKB } from "../src/lib/kb/loader";
import fs from "node:fs";
import path from "node:path";

// Project facts file paths (matching PROJECTS array in loader.ts)
const PROJECT_FACTS_PATHS: Record<string, string> = {
  tanger: "projects/tanger/tanger-facts.json",
  coke: "projects/coke/coke-facts.json",
  "capital-one": "projects/capital-one/capital-one-short-form.JSON",
  pmi: "projects/pmi/pmi-shortform.JSON",
  "pfaff-designs": "projects/pfaff-designs/pfaff-designs.json",
};

// Helper to load JSON directly (since loadJSON is not exported)
function loadFactsJSON(filePath: string): any {
  try {
    const fullPath = path.join(process.cwd(), "knowledge-base", filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn(`[KB] Could not load facts from ${filePath}:`, error);
  }
  return null;
}

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

async function syncProjects() {
  console.log("[KB] Syncing projects from KB to Supabase...\n");

  const projects = loadProjectsKB();
  console.log(`[KB] Loaded ${projects.length} projects from KB\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const proj of projects) {
    try {
      // Extract one_liner with fallback chain
      const oneLiner =
        proj.one_liner ??
        proj.summary ??
        "Portfolio project"; // safe fallback

      // Extract timeframe from facts JSON (ProjectKBEntry doesn't expose it)
      const factsPath = PROJECT_FACTS_PATHS[proj.id];
      const facts = factsPath ? loadFactsJSON(factsPath) : null;
      const timeframe = facts?.timeline?.duration || 
                       (facts?.timeline?.year ? String(facts.timeline.year) : "") || 
                       "";
      const role_title = facts?.role || "";

      // Upsert project into Supabase
      // Note: Using 'slug' as the conflict key (must match the project ID format in database)
      const { error } = await supabase
        .from("projects")
        .upsert(
          {
            slug: proj.id,
            title: proj.title,
            client: proj.client,
            one_liner: oneLiner,
            timeframe: timeframe,
            role_title: role_title,
          },
          { onConflict: "slug" }
        );

      if (error) {
        console.error(`[KB] ❌ Failed to upsert project ${proj.id}:`, error);
        errorCount++;
      } else {
        console.log(`[KB] ✅ Project synced: ${proj.id} (${proj.title})`);
        successCount++;
      }
    } catch (error) {
      console.error(`[KB] ❌ Error syncing project ${proj.id}:`, error);
      errorCount++;
    }
  }

  // Also sync the "about-global" project entry for global sections
  console.log(`\n[KB] Syncing about-global project entry...`);
  try {
    const { error } = await supabase
      .from("projects")
      .upsert(
        {
          slug: "about-global",
          title: "About",
          client: null,
          one_liner: "About and background information",
          timeframe: "",
          role_title: "",
        },
        { onConflict: "slug" }
      );

    if (error) {
      console.error(`[KB] ❌ Failed to upsert about-global project:`, error);
      errorCount++;
    } else {
      console.log(`[KB] ✅ About-global project synced`);
      successCount++;
    }
  } catch (error) {
    console.error(`[KB] ❌ Error syncing about-global project:`, error);
    errorCount++;
  }

  console.log(`\n[KB] Sync complete: ${successCount} succeeded, ${errorCount} failed`);
  
  if (errorCount > 0) {
    console.error(`[KB] ⚠️  ${errorCount} projects failed to sync. Check errors above.`);
    process.exit(1);
  }
}

syncProjects().catch((err) => {
  console.error("[KB] sync-projects-from-kb failed", err);
  process.exit(1);
});

