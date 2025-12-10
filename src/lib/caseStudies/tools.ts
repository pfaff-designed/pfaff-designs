import { loadProjectById } from "@/lib/kb/loader";

/**
 * Utility to get tools from KB facts for case studies
 * Maps case study slugs to KB project IDs and loads YAML via the KB loader.
 */

const SLUG_TO_PROJECT_ID: Record<string, string> = {
  "capital-one-travel": "capital-one",
  "coca-cola-creative-technology": "coca-cola",
  "pfaff-designs": "pfaff-design",
  "pmi": "pmi",
  "tanger": "tanger",
  "mcwhinney": "mcwhinney",
  "real-estate": "mcwhinney",
};

function extractTools(project: any): string[] {
  return (
    project?.tools_used ??
    project?.skills_used ??
    project?.tools ??
    project?.skillsUsed ??
    project?.skills ??
    project?.tools_and_tech?.frontend ??
    []
  );
}

/**
 * Get tools array for a case study by slug
 */
export async function getToolsForCaseStudy(slug: string): Promise<string[]> {
  const projectId = SLUG_TO_PROJECT_ID[slug];
  if (!projectId) return [];

  const project = await loadProjectById(projectId);
  if (!project) return [];

  const tools = extractTools(project);
  if (!Array.isArray(tools)) return [];

  return tools.map((t) => String(t));
}

