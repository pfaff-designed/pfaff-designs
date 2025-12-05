import { getProjectBySlug, extractHeroFacts, type CaseStudyHeroFacts } from "./loader";

/**
 * Get hero facts for a case study by project ID
 * Returns null if project not found
 */
export async function getHeroFacts(projectId: string): Promise<CaseStudyHeroFacts | null> {
  const project = await getProjectBySlug(projectId);
  
  if (!project) {
    return null;
  }
  
  return extractHeroFacts(project.facts);
}

export type { CaseStudyHeroFacts } from "./loader";

