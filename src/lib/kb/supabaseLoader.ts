import { supabase } from "@/lib/supabase/client";
import { getMediaURL } from "@/lib/supabase/storage";
import type {
  ProjectRow,
  ProjectSectionRow,
  MediaRow,
  RoleRow,
  SkillRow,
  ProfileRow,
} from "@/lib/supabase/types";

/**
 * Knowledge Base data structure matching the architecture
 */
export interface KnowledgeBase {
  projects: Array<{
    facts: ProjectRow;
    sections: ProjectSectionRow[];
    media: MediaRow[];
  }>;
  roles: RoleRow[];
  skills: SkillRow[];
  profile: ProfileRow | null;
  media: MediaRow[]; // All media, for general queries
}

/**
 * Load Knowledge Base from Supabase
 * Implements the architecture specification for KB retrieval
 */
export async function loadKnowledgeBase(): Promise<KnowledgeBase> {
  if (!supabase) {
    throw new Error("Supabase client not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.");
  }

  try {
    // Load all data in parallel
    const [projectsResult, sectionsResult, mediaResult, rolesResult, skillsResult, profileResult] =
      await Promise.all([
        supabase.from("projects").select("*").order("created_at", { ascending: false }),
        supabase.from("project_sections").select("*"),
        supabase.from("media").select("*"),
        supabase.from("roles").select("*").order("created_at", { ascending: false }),
        supabase.from("skills").select("*"),
        supabase.from("profile").select("*").maybeSingle(),
      ]);

    // Handle errors
    if (projectsResult.error) throw projectsResult.error;
    if (sectionsResult.error) throw sectionsResult.error;
    if (mediaResult.error) throw mediaResult.error;
    if (rolesResult.error) throw rolesResult.error;
    if (skillsResult.error) throw skillsResult.error;
    if (profileResult.error) throw profileResult.error;

    const projects = (projectsResult.data || []) as ProjectRow[];
    const sections = (sectionsResult.data || []) as ProjectSectionRow[];
    const allMedia = (mediaResult.data || []) as MediaRow[];
    const roles = (rolesResult.data || []) as RoleRow[];
    const skills = (skillsResult.data || []) as SkillRow[];
    const profile = (profileResult.data || null) as ProfileRow | null;

    // Group sections and media by project, and refresh signed URLs
    const projectsWithData = await Promise.all(
      projects.map(async (project) => {
        const projectMedia = allMedia.filter((m) => m.project_slug === project.slug);
        
        // Refresh URLs for media items that have storage_path
        const mediaWithFreshURLs = await Promise.all(
          projectMedia.map(async (media) => {
            if (media.storage_path && media.storage_bucket) {
              try {
                const freshURL = await getMediaURL(media);
                return { ...media, url: freshURL };
              } catch (error) {
                console.warn(`Failed to refresh URL for media ${media.id}:`, error);
                return media;
              }
            }
            return media;
          })
        );
        
        return {
          facts: project,
          sections: sections.filter((s) => s.project_slug === project.slug),
          media: mediaWithFreshURLs,
        };
      })
    );

    // Refresh URLs for all media (for general queries)
    const allMediaWithFreshURLs = await Promise.all(
      allMedia.map(async (media) => {
        if (media.storage_path && media.storage_bucket) {
          try {
            const freshURL = await getMediaURL(media);
            return { ...media, url: freshURL };
          } catch (error) {
            console.warn(`Failed to refresh URL for media ${media.id}:`, error);
            return media;
          }
        }
        return media;
      })
    );

    return {
      projects: projectsWithData,
      roles,
      skills,
      profile,
      media: allMediaWithFreshURLs,
    };
  } catch (error) {
    console.error("Error loading knowledge base from Supabase:", error);
    throw error;
  }
}

/**
 * Get project by slug
 * Includes sections and media
 */
export async function getProjectBySlug(slug: string): Promise<KnowledgeBase["projects"][0] | null> {
  if (!supabase) {
    throw new Error("Supabase client not configured.");
  }

  try {
    const [projectResult, sectionsResult, mediaResult] = await Promise.all([
      supabase.from("projects").select("*").eq("slug", slug).single(),
      supabase.from("project_sections").select("*").eq("project_slug", slug),
      supabase.from("media").select("*").eq("project_slug", slug),
    ]);

    if (projectResult.error || !projectResult.data) {
      return null;
    }

    return {
      facts: projectResult.data as ProjectRow,
      sections: (sectionsResult.data || []) as ProjectSectionRow[],
      media: (mediaResult.data || []) as MediaRow[],
    };
  } catch (error) {
    console.error(`Error loading project ${slug}:`, error);
    return null;
  }
}

/**
 * Get media by project slug
 * Automatically refreshes signed URLs if needed
 */
export async function getMediaByProjectSlug(projectSlug: string): Promise<MediaRow[]> {
  if (!supabase) {
    throw new Error("Supabase client not configured.");
  }

  try {
    const { data, error } = await supabase
      .from("media")
      .select("*")
      .eq("project_slug", projectSlug);

    if (error) throw error;
    
    const mediaRows = (data || []) as MediaRow[];
    
    // Refresh URLs for media items that have storage_path
    const mediaWithFreshURLs = await Promise.all(
      mediaRows.map(async (media) => {
        if (media.storage_path && media.storage_bucket) {
          try {
            const freshURL = await getMediaURL(media);
            return { ...media, url: freshURL };
          } catch (error) {
            console.warn(`Failed to refresh URL for media ${media.id}:`, error);
            return media;
          }
        }
        return media;
      })
    );
    
    return mediaWithFreshURLs;
  } catch (error) {
    console.error(`Error loading media for project ${projectSlug}:`, error);
    return [];
  }
}

/**
 * Get media by ID
 * Automatically refreshes signed URL if needed
 */
export async function getMediaById(mediaId: string): Promise<MediaRow | null> {
  if (!supabase) {
    throw new Error("Supabase client not configured.");
  }

  try {
    const { data, error } = await supabase.from("media").select("*").eq("id", mediaId).single();

    if (error || !data) return null;
    
    const media = data as MediaRow;
    
    // Refresh URL if storage_path exists
    if (media.storage_path && media.storage_bucket) {
      try {
        const freshURL = await getMediaURL(media);
        return { ...media, url: freshURL };
      } catch (error) {
        console.warn(`Failed to refresh URL for media ${mediaId}:`, error);
        return media;
      }
    }
    
    return media;
  } catch (error) {
    console.error(`Error loading media ${mediaId}:`, error);
    return null;
  }
}

/**
 * Get media by IDs (batch)
 * Automatically refreshes signed URLs if needed
 */
export async function getMediaByIds(mediaIds: string[]): Promise<MediaRow[]> {
  if (mediaIds.length === 0) return [];
  if (!supabase) {
    throw new Error("Supabase client not configured.");
  }

  try {
    const { data, error } = await supabase.from("media").select("*").in("id", mediaIds);

    if (error) throw error;
    
    const mediaRows = (data || []) as MediaRow[];
    
    // Refresh URLs for media items that have storage_path
    const mediaWithFreshURLs = await Promise.all(
      mediaRows.map(async (media) => {
        if (media.storage_path && media.storage_bucket) {
          try {
            const freshURL = await getMediaURL(media);
            return { ...media, url: freshURL };
          } catch (error) {
            console.warn(`Failed to refresh URL for media ${media.id}:`, error);
            return media;
          }
        }
        return media;
      })
    );
    
    return mediaWithFreshURLs;
  } catch (error) {
    console.error(`Error loading media by IDs:`, error);
    return [];
  }
}

