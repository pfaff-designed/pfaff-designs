/**
 * Media Resolver
 * Resolves media IDs from YAML to actual URLs for use in JSON components
 * Implements metadata-only retrieval to protect token budget
 * Gracefully handles Supabase not being configured
 */

import { getMediaById, getMediaByIds } from "@/lib/kb/supabaseLoader";
import { getMediaURL } from "@/lib/supabase/storage";
import type { MediaRow } from "@/lib/supabase/types";
import { traceable } from "langsmith/traceable";
import yaml from "js-yaml";

export interface MediaResolution {
  id: string;
  url: string;
  alt: string;
  type: "image" | "video";
  caption?: string | null;
  width?: number | null;
  height?: number | null;
}

/**
 * Resolve a single media ID to URL and metadata
 * Returns null if media not found or Supabase not configured
 */
const resolveMediaIdInternal = traceable(
  async (mediaId: string): Promise<MediaResolution | null> => {
  try {
    // Try Supabase first
    const media = await getMediaById(mediaId);
    if (!media) {
      console.warn(`Media not found: ${mediaId}`);
      return null;
    }

    // Get fresh URL (auto-refreshes if signed URL expired)
    const url = await getMediaURL(media);

    return {
      id: media.id,
      url,
      alt: media.alt,
      type: media.type,
      caption: media.caption || undefined,
      width: media.width || undefined,
      height: media.height || undefined,
    };
  } catch (error) {
    // Graceful fallback if Supabase not configured
    if (error instanceof Error && error.message.includes("Supabase client not configured")) {
      console.warn(`Supabase not configured, cannot resolve media ID: ${mediaId}`);
      return null;
    }
    console.error(`Error resolving media ID ${mediaId}:`, error);
    return null;
  }
  },
  {
    name: "resolve-media-id",
    project_name: "pr-potable-commitment-61",
    tags: ["media-resolver"],
    metadata: {
      component: "media-resolver",
    },
  }
);

export async function resolveMediaId(mediaId: string): Promise<MediaResolution | null> {
  return resolveMediaIdInternal(mediaId);
}

/**
 * Resolve multiple media IDs to URLs (batch operation)
 * Returns a map of mediaId -> MediaResolution for efficient lookup
 * Gracefully handles Supabase not being configured
 */
const resolveMediaIdsInternal = traceable(
  async (mediaIds: string[]): Promise<Map<string, MediaResolution>> => {
  if (mediaIds.length === 0) {
    return new Map();
  }

  const resolutionMap = new Map<string, MediaResolution>();

  try {
    // Batch fetch media from Supabase
    const mediaRows = await getMediaByIds(mediaIds);

    // If no media found and Supabase not configured, return empty map
    if (mediaRows.length === 0) {
      console.warn(`No media found for IDs: ${mediaIds.join(", ")}. Supabase may not be configured or media doesn't exist.`);
      return resolutionMap;
    }

    // Resolve URLs for each media item
    const resolutions = await Promise.all(
      mediaRows.map(async (media) => {
        try {
          const url = await getMediaURL(media);
          return {
            id: media.id,
            url,
            alt: media.alt,
            type: media.type,
            caption: media.caption || undefined,
            width: media.width || undefined,
            height: media.height || undefined,
          } as MediaResolution;
        } catch (error) {
          console.error(`Error resolving URL for media ${media.id}:`, error);
          return null;
        }
      })
    );

    // Build map
    resolutions.forEach((resolution) => {
      if (resolution) {
        resolutionMap.set(resolution.id, resolution);
      }
    });

    // Log missing media IDs
    const foundIds = new Set(mediaRows.map((m) => m.id));
    const missingIds = mediaIds.filter((id) => !foundIds.has(id));
    if (missingIds.length > 0) {
      console.warn(`Media IDs not found: ${missingIds.join(", ")}`);
    }
  } catch (error) {
    // Graceful fallback if Supabase not configured
    if (error instanceof Error && error.message.includes("Supabase client not configured")) {
      console.warn("Supabase not configured, media IDs will not be resolved. Media components will need URLs provided directly.");
      return resolutionMap; // Return empty map
    }
    console.error("Error batch resolving media IDs:", error);
  }

  return resolutionMap;
  },
  {
    name: "resolve-media-ids",
    project_name: "pr-potable-commitment-61",
    tags: ["media-resolver"],
    metadata: {
      component: "media-resolver",
    },
  }
);

export async function resolveMediaIds(mediaIds: string[]): Promise<Map<string, MediaResolution>> {
  return resolveMediaIdsInternal(mediaIds);
}

/**
 * Extract media IDs from YAML content
 * Parses YAML structure to find all media IDs
 */
export function extractMediaIdsFromYAML(yamlContent: string): string[] {
  const mediaIds: string[] = [];
  
  try {
    // Try parsing as YAML first (more reliable)
    const parsed = yaml.load(yamlContent);
    
    if (parsed && typeof parsed === "object" && "media" in parsed) {
      const media = parsed.media as any; // Type assertion needed because yaml.load returns unknown
      
      // Extract hero media ID
      if (media && typeof media === "object" && media.hero && typeof media.hero === "object" && media.hero.id) {
        mediaIds.push(media.hero.id);
      }
      
      // Extract gallery media IDs
      if (media && typeof media === "object" && media.gallery && Array.isArray(media.gallery)) {
        media.gallery.forEach((item: any) => {
          if (item && typeof item === "object" && item.id) {
            mediaIds.push(item.id);
          }
        });
      }
      
      // Extract inline media IDs
      if (media && typeof media === "object" && media.inline && Array.isArray(media.inline)) {
        media.inline.forEach((item: any) => {
          if (item && typeof item === "object" && item.id) {
            mediaIds.push(item.id);
          }
        });
      }
      
      // Also check sections for inline media
      const parsedObj = parsed as any; // Type assertion for parsed object
      if (parsedObj.sections && Array.isArray(parsedObj.sections)) {
        parsedObj.sections.forEach((section: any) => {
          if (section && section.media && Array.isArray(section.media)) {
            section.media.forEach((item: any) => {
              if (item && typeof item === "object" && item.id) {
                mediaIds.push(item.id);
              }
            });
          }
        });
      }
    }
  } catch (yamlError) {
    // Fallback to regex parsing if YAML parsing fails
    console.warn("YAML parsing failed, using regex fallback:", yamlError);
    
    try {
      // Regex patterns for common YAML formats
      const patterns = [
        // hero: { id: "..." }
        /hero:\s*\{[^}]*id:\s*["']?([^"'\s}]+)["']?/gi,
        // gallery: [{ id: "..." }]
        /gallery:\s*\[([^\]]*)\]/gi,
        // inline: [{ id: "..." }]
        /inline:\s*\[([^\]]*)\]/gi,
      ];
      
      patterns.forEach((pattern) => {
        let match;
        while ((match = pattern.exec(yamlContent)) !== null) {
          if (match[1]) {
            // Extract IDs from matched content
            const idMatches = match[1].match(/id:\s*["']?([^"'\s,}]+)["']?/gi);
            if (idMatches) {
              idMatches.forEach((idMatch) => {
                const id = idMatch.replace(/id:\s*["']?/i, "").replace(/["']?$/, "").trim();
                if (id && !mediaIds.includes(id)) {
                  mediaIds.push(id);
                }
              });
            }
          }
        }
      });
    } catch (regexError) {
      console.error("Error extracting media IDs with regex:", regexError);
    }
  }
  
  return mediaIds;
}

