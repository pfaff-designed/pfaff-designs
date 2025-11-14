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
    console.warn("Supabase load failed, falling back to legacy loader:", error);
  }

  if (!kbData) {
    console.warn("Supabase KB unavailable, loading legacy filesystem KB.");
    return await loadLegacyKB();
  }

  const missingProjects = !kbData.projects || kbData.projects.length === 0;
  const missingIdentity = !kbData.identity;

  if (missingProjects || missingIdentity) {
    console.warn("KB missing data from Supabase, merging with legacy fallback.", {
      missingProjects,
      missingIdentity,
    });
    try {
      const legacyKB = await loadLegacyKB();
      kbData = {
        projects: !missingProjects && kbData.projects ? kbData.projects : legacyKB.projects,
        identity: kbData.identity ?? legacyKB.identity,
        media: kbData.media && kbData.media.length > 0 ? kbData.media : legacyKB.media,
      };
    } catch (legacyError) {
      console.error("Failed to load legacy KB for fallback merge:", legacyError);
    }
  }

  return kbData;
}

/**
 * Resolve YAML for a query using intent, caching, and Copywriter agent.
 */
async function getYamlForQuery(
  query: string
): Promise<{ yaml: string; cacheKey: string }> {
  console.log("Resolving intent for query:", query);
  const intent = await resolveIntent(query);
  const yamlCacheKey = kbCache.getYAMLKey(query, intent.intent);
  const cachedYAML = kbCache.get<string>(yamlCacheKey);
  if (cachedYAML) {
    console.log("Using cached YAML");
    return { yaml: cachedYAML, cacheKey: yamlCacheKey };
  }

  const topicKey = intent.topic?.projectSlug || intent.intent;
  let kbData = kbCache.get<KBData>(topicKey);

  if (!kbData) {
    kbData = await loadKnowledgeBaseWithFallback();
    kbCache.set(topicKey, kbData, 5 * 60 * 1000);
  }

  if (!kbData) {
    throw new Error("Failed to load knowledge base data.");
  }

  console.log("KB Data loaded:", {
    projectsCount: kbData.projects?.length || 0,
    hasIdentity: !!kbData.identity,
    mediaCount: kbData.media?.length || 0,
    projectIds: kbData.projects?.map((p) => p.facts.projectId) || [],
  });

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

  console.log("Generating Copywriter YAML...");
  console.log("Copywriter input:", {
    query,
    intent: intent.intent,
    pageKind: intent.pageKind,
    projectsCount: kbData.projects?.length || 0,
    hasIdentity: !!kbData.identity,
  });

  const yaml = await generateCopywriterYAML({
    userQuery: query,
    intent,
    kbData,
  });

  console.log("Copywriter YAML generated (first 500 chars):", yaml.substring(0, 500));
  kbCache.set(yamlCacheKey, yaml, 10 * 60 * 1000);

  return { yaml, cacheKey: yamlCacheKey };
}

/**
 * Main entry point used by /api/query
 */
export async function handleQuery(query: string): Promise<PageJSON> {
  try {
    console.time("handleQuery");
    console.time("yaml-resolution");
    const { yaml: yamlText, cacheKey: yamlCacheKey } = await getYamlForQuery(query);
    console.timeEnd("yaml-resolution");

    const jsonCacheKey = `${yamlCacheKey}:pagejson`;
    const cachedPageJSON = kbCache.get<PageJSON>(jsonCacheKey);
    if (cachedPageJSON) {
      console.log("Using cached orchestrator PageJSON");
      console.timeEnd("handleQuery");
      return cachedPageJSON;
    }

    const registrySummary = {
      components: Object.keys(componentRegistry),
      categories: Array.from(
        new Set(Object.values(componentRegistry).map((entry) => entry.category))
      ),
    };

    console.log("Generating Orchestrator JSON...");
    console.time("orchestrator-call");
    const pageJSON = await generateOrchestratorJSON({
      yaml: yamlText,
      registrySummary,
    });
    console.timeEnd("orchestrator-call");
    console.log("Query handling complete");

    kbCache.set(jsonCacheKey, pageJSON, 10 * 60 * 1000);
    console.timeEnd("handleQuery");

    return pageJSON;
  } catch (error) {
    console.error("Error in handleQuery:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

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

