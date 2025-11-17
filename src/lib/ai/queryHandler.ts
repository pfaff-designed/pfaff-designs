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
import { generateCopywriterYAML } from "./copywriter";
import { generateOrchestratorJSON } from "./orchestrator";
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
 * Resolve YAML for a query using intent, caching, and Copywriter agent.
 * NOTE: intent is passed in, so we don't call resolveIntent twice.
 */
async function getYamlForQuery(
  query: string,
  intent: Awaited<ReturnType<typeof resolveIntent>>,
  ragContext?: string
): Promise<{ yaml: string; cacheKey: string }> {
  const yamlCacheKey = makeYamlCacheKey(intent);
  const cachedYAML = kbCache.get<string>(yamlCacheKey);
  if (cachedYAML) {
    console.log("YAML cache HIT:", yamlCacheKey);
    return { yaml: cachedYAML, cacheKey: yamlCacheKey };
  }

  console.log("YAML cache MISS:", yamlCacheKey);

  const topicKey = intent.topic?.projectSlug || intent.intent;
  let kbData = kbCache.get<KBData>(topicKey);

  if (!kbData) {
    kbData = await loadKnowledgeBaseWithFallback();
    kbCache.set(topicKey, kbData, 5 * 60 * 1000);
  }

  if (!kbData) {
    throw new Error("Failed to load knowledge base data.");
  }

  // If project-specific, load targeted project data + media
  if (intent.topic?.projectSlug) {
    try {
      const project = await getSupabaseProject(intent.topic.projectSlug);
      if (project) {
        const adaptedProject = {
          facts: convertProjectRowToFacts(project.facts),
          longform: convertSectionsToLongform(project.facts, project.sections),
        };
        kbData.projects = [adaptedProject];

        if (project.media && project.media.length > 0) {
          kbData.media = project.media.map((m) => ({
            id: m.id,
            project_slug: m.project_slug,
            type: m.type,
            role: m.role,
            alt: m.alt,
            caption: m.caption,
          }));
        }
      }
    } catch (error) {
      const legacyProject = await getLegacyProject(intent.topic.projectSlug);
      if (legacyProject) {
        kbData.projects = [legacyProject];
      }
    }
  }

  const yaml = await generateCopywriterYAML({
    userQuery: query,
    intent,
    kbData,
    ragContext,
  });

  kbCache.set(yamlCacheKey, yaml, 10 * 60 * 1000);

  return { yaml, cacheKey: yamlCacheKey };
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
    const ragContext = buildContextFromChunks(retrievedChunks);

    console.time("yaml-resolution");
    const { yaml: yamlText, cacheKey: yamlCacheKey } = await getYamlForQuery(
      query,
      intent,
      ragContext
    );
    console.timeEnd("yaml-resolution");

    // 🔹 JSON cache key SHOULD include questionFocus,
    // because layout depends on it
    const jsonCacheKey = `${yamlCacheKey}:pagejson:${intent.questionFocus}`;
    const cachedPageJSON = kbCache.get<PageJSON>(jsonCacheKey);
    if (cachedPageJSON) {
      console.log("PageJSON cache HIT:", jsonCacheKey);
      console.timeEnd("handleQuery");
      return cachedPageJSON;
    }

    console.log("PageJSON cache MISS:", jsonCacheKey);

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
      yaml: yamlText,
      intent,
      registrySummary,
      questionFocus: intent.questionFocus,
    });
    console.timeEnd("orchestrator-call");

    kbCache.set(jsonCacheKey, pageJSON, 10 * 60 * 1000);
    console.timeEnd("handleQuery");

    console.log("Query processing complete:", {
      query: query.substring(0, 50),
      pageKind: intent.pageKind,
      questionFocus: intent.questionFocus,
      blocksCount: pageJSON.page.blocks.length,
    });

    return pageJSON;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error("handleQuery error:", error);

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