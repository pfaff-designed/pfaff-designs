import type { PageJSON } from "@/components/utility/Renderer";
import { resolveIntent } from "./intentResolver";
import {
  loadKnowledgeBase as loadLegacyKB,
  getProjectBySlug as getLegacyProject,
  type KBData,
} from "@/lib/kb/loader";
import {
  loadKnowledgeBase as loadSupabaseKB,
  getProjectBySlug as getSupabaseProject,
} from "@/lib/kb/supabaseLoader";
import {
  adaptSupabaseKBToLegacy,
  convertProjectRowToFacts,
  convertSectionsToLongform,
} from "@/lib/kb/adapter";
import { kbCache } from "@/lib/kb/cache";
import { runCopywriter, type CopywriterOutput } from "./copywriter";
import type { CopywriterInput } from "./copywriterSchemas";
import { generateOrchestratorJSON } from "./orchestrator";
import { getHeroFacts } from "@/lib/kb/CaseStudyHeroFacts";
import { componentRegistry } from "@/lib/registry/componentRegistry";
import { retrieveProjectChunks, buildContextFromChunks } from "@/lib/rag/retrieveProjectChunks";
// You *can* keep traceable here if you really want tracing,
// but I'd recommend disabling it while tuning perf.
// import { traceable } from "langsmith/traceable";

/**
 * Load Knowledge Base via Supabase, falling back to legacy filesystem data.
 * Merges legacy data if Supabase returns incomplete datasets.
 */
async function loadKnowledgeBaseWithFallback(): Promise<KBData> {
  let kbData: KBData | null = null;

  try {
    const supabaseKB = await loadSupabaseKB();
    kbData = adaptSupabaseKBToLegacy(supabaseKB);
  } catch (error) {
    // Supabase load failed, falling back to legacy loader
  }

  if (!kbData) {
    return await loadLegacyKB();
  }

  const missingProjects = !kbData.projects || kbData.projects.length === 0;
  const missingIdentity = !kbData.identity;

  if (missingProjects || missingIdentity) {
    try {
      const legacyKB = await loadLegacyKB();
      kbData = {
        projects:
          !missingProjects && kbData.projects
            ? kbData.projects
            : legacyKB.projects,
        identity: kbData.identity ?? legacyKB.identity,
        media:
          kbData.media && kbData.media.length > 0
            ? kbData.media
            : legacyKB.media,
      };
    } catch (legacyError) {
      // Failed to load legacy KB for fallback merge
    }
  }

  return kbData;
}

/**
 * Build a stable, semantic key for YAML based on intent,
 * NOT on the raw query string.
 */
function makeYamlCacheKey(intent: Awaited<ReturnType<typeof resolveIntent>>): string {
  return JSON.stringify({
    kind: intent.pageKind,
    intent: intent.intent,
    projectSlug: intent.topic?.projectSlug ?? null,
    audience: intent.audience ?? "unknown",
  });
}

/**
 * Get CopywriterOutput for a query using intent, caching, and Copywriter agent.
 * NOTE: intent is passed in, so we don't call resolveIntent twice.
 */
async function getCopywriterOutputForQuery(
  query: string,
  intent: Awaited<ReturnType<typeof resolveIntent>>,
  context: string
): Promise<{ output: CopywriterOutput; cacheKey: string }> {
  const cacheKey = makeYamlCacheKey(intent);
  const cachedOutput = kbCache.get<CopywriterOutput>(cacheKey);
  if (cachedOutput) {
    return { output: cachedOutput, cacheKey };
  }

  // Build projectShortFacts from hero facts if projectId is known
  let projectShortFacts: CopywriterInput["projectShortFacts"] | undefined;
  const projectId = intent.topic?.projectSlug || null;
  
  if (projectId) {
    const heroFacts = await getHeroFacts(projectId);
    if (heroFacts) {
      // Load additional facts from KB for outcomes and skills
      const topicKey = projectId;
      let kbData = kbCache.get<KBData>(topicKey);
      if (!kbData) {
        kbData = await loadKnowledgeBaseWithFallback();
        kbCache.set(topicKey, kbData, 5 * 60 * 1000);
      }

      if (kbData) {
        const project = kbData.projects?.find((p) => p.facts.projectId === projectId);
        projectShortFacts = {
          client: heroFacts.client,
          projectNameOrUrl: heroFacts.projectNameOrUrl,
          role: heroFacts.role,
          description: heroFacts.description,
          yearOrTimeline: heroFacts.yearOrTimeline,
          team: heroFacts.team,
          keyOutcomes: project?.facts.outcomes || [],
          keySkills: project?.facts.skillsUsed || [],
        };
      } else {
        // Fallback to just hero facts
        projectShortFacts = {
          client: heroFacts.client,
          projectNameOrUrl: heroFacts.projectNameOrUrl,
          role: heroFacts.role,
          description: heroFacts.description,
          yearOrTimeline: heroFacts.yearOrTimeline,
          team: heroFacts.team,
        };
      }
    }
  }

  const output = await runCopywriter({
    question: query,
    context,
    projectId,
    projectShortFacts,
  });

  kbCache.set(cacheKey, output, 10 * 60 * 1000);

  return { output, cacheKey };
}

/**
 * Main entry point used by /api/query
 */
export async function handleQuery(query: string): Promise<PageJSON> {
  try {
    console.time("handleQuery");

    // 🔹 Resolve intent ONCE
    const intent = await resolveIntent(query);

    // Retrieve relevant chunks using RAG (vector search)
    const projectId = intent.topic?.projectSlug || null;
    const retrievedChunks = await retrieveProjectChunks(query, {
      projectId: projectId || undefined,
      matchCount: 8,
    });
    const context = buildContextFromChunks(retrievedChunks);

    console.time("copywriter-resolution");
    let copywriterOutput: CopywriterOutput;
    let copywriterCacheKey: string;
    try {
      const result = await getCopywriterOutputForQuery(
        query,
        intent,
        context
      );
      copywriterOutput = result.output;
      copywriterCacheKey = result.cacheKey;
      console.timeEnd("copywriter-resolution");
    } catch (copywriterError: any) {
      console.timeEnd("copywriter-resolution");
      console.error("❌ Copywriter error caught in queryHandler:", copywriterError.message);
      console.error("Copywriter stack:", copywriterError.stack);
      // Re-throw to be caught by outer error handler
      throw copywriterError;
    }

    // 🔹 JSON cache key SHOULD include questionFocus,
    // because layout depends on it
    const jsonCacheKey = `${copywriterCacheKey}:pagejson:${intent.questionFocus}`;
    const cachedPageJSON = kbCache.get<PageJSON>(jsonCacheKey);
    if (cachedPageJSON) {
      console.timeEnd("handleQuery");
      return cachedPageJSON;
    }

    const registrySummary = {
      components: Object.keys(componentRegistry),
      categories: Array.from(
        new Set(
          Object.values(componentRegistry).map((entry) => entry.category)
        )
      ),
    };

    console.time("orchestrator-call");
    const pageJSON = await generateOrchestratorJSON({
      copywriterOutput,
      intent,
      registrySummary,
      questionFocus: intent.questionFocus,
    });
    console.timeEnd("orchestrator-call");

    kbCache.set(jsonCacheKey, pageJSON, 10 * 60 * 1000);
    console.timeEnd("handleQuery");

    return pageJSON;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error("❌ handleQuery error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    console.error("Error name:", error instanceof Error ? error.name : typeof error);
    
    // Check if it's a template error
    if (errorMessage.includes("Single '}' in template") || errorMessage.includes("template")) {
      console.error("🔍 This is a template parsing error. Check LangSmith prompt for unescaped braces.");
      console.error("The error likely occurred in promptLoader or copywriter template formatting.");
    }

    const fallback: PageJSON = {
      version: "1",
      page: {
        id: "fallback-error",
        kind: "error",
        blocks: [
          {
            id: "error-message",
            component: "BodyText",
            props: {
              body: `Sorry, something went wrong while generating this page: ${errorMessage}`,
            },
            children: [],
          },
        ],
      },
    };

    return fallback;
  }
}