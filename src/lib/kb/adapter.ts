/**
 * Adapter to convert Supabase KB format to legacy format
 * This allows gradual migration while maintaining compatibility
 */
import type { KnowledgeBase } from "./supabaseLoader";
import type { KBData, ProjectFacts, ProjectLongform, IdentityData } from "./loader";
import type { ProjectRow, ProjectSectionRow, MediaRow, ProfileRow } from "@/lib/supabase/types";

/**
 * Convert Supabase ProjectRow to legacy ProjectFacts format
 */
export function convertProjectRowToFacts(row: ProjectRow): ProjectFacts {
  // Parse timeframe to extract year and duration
  // Handle formats like "2023 - 6 months" or "2023-2024"
  const timeframeMatch = row.timeframe.match(/(\d{4})\s*[-–]\s*(.+)/);
  const year = timeframeMatch ? parseInt(timeframeMatch[1]) : new Date().getFullYear();
  const duration = timeframeMatch ? timeframeMatch[2] : row.timeframe;

  return {
    version: 1,
    kind: "project",
    projectId: row.slug,
    client: row.client || row.company || "",
    industry: undefined,
    timeline: {
      year,
      duration,
    },
    role: row.role_title,
    projectSummary: row.summary_short,
    problem: row.summary_long
      ? {
          summary: row.summary_long,
        }
      : undefined,
    skillsUsed: row.skills || [],
    links: row.links || [],
  };
}

/**
 * Convert ProjectSectionRow[] to ProjectLongform format
 */
export function convertSectionsToLongform(
  project: ProjectRow,
  sections: ProjectSectionRow[]
): ProjectLongform {
  const longform: ProjectLongform = {
    version: "1",
    kind: "project",
    project: {
      id: project.slug,
      title: project.title,
      client: project.client || "",
      role: project.role_title,
    },
    links: project.links || [],
  };

  // Map sections to longform fields
  for (const section of sections) {
    switch (section.section_type) {
      case "context":
        longform.context = section.content;
        break;
      case "problem":
        longform.problem = section.content;
        break;
      case "solution":
        longform.solution = section.content;
        break;
      case "process":
        longform.process = section.content;
        break;
      case "outcome":
        longform.outcomes = section.content;
        break;
      case "reflections":
        longform.reflections = section.content;
        break;
    }
  }

  return longform;
}

/**
 * Convert ProfileRow to IdentityData format
 */
function convertProfileToIdentity(profile: ProfileRow | null): IdentityData | undefined {
  if (!profile) return undefined;

  return {
    version: 1,
    kind: "identity",
    headline: profile.headline || undefined,
    summary_short: profile.summary_short || undefined,
    summary_long: profile.summary_long || undefined,
    primary_skills: profile.primary_skills || undefined,
    tools: profile.tools || undefined,
    values: profile.values || undefined,
    contact: profile.contact || undefined,
  };
}

/**
 * Convert Supabase KnowledgeBase to legacy KBData format
 * Includes media metadata (IDs only, per architecture - Copywriter references by ID)
 */
export function adaptSupabaseKBToLegacy(supabaseKB: KnowledgeBase): KBData {
  const projects = supabaseKB.projects.map((project) => ({
    facts: convertProjectRowToFacts(project.facts),
    longform: convertSectionsToLongform(project.facts, project.sections),
  }));

  const identity = convertProfileToIdentity(supabaseKB.profile);

  // Convert media to metadata-only format (Copywriter only needs IDs, not URLs)
  const media = supabaseKB.media.map((m) => ({
    id: m.id,
    project_slug: m.project_slug,
    type: m.type,
    role: m.role,
    alt: m.alt,
    caption: m.caption,
  }));

  return {
    projects,
    identity,
    media,
  };
}

