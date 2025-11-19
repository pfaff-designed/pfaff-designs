/**
 * Media Resolver
 * Resolves media IDs from registry to Supabase Storage URLs
 * Provides deterministic URL resolution for renderer components
 * 
 * This resolver uses the media registry (bucket + path) and generates
 * public Supabase CDN URLs. It does NOT query the Supabase database.
 */

import { getMediaItemById, type MediaId } from "@/lib/media/registry";
import { getPublicStorageURL } from "@/lib/supabase/storage";

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
 * Resolve a single media ID to Supabase Storage URL
 * Returns null if media ID not found or Supabase not configured
 */
export async function resolveMediaId(mediaId: string): Promise<MediaResolution | null> {
  try {
    // Look up media item in registry
    const mediaItem = getMediaItemById(mediaId as MediaId);
    
    if (!mediaItem) {
      console.warn(`Media ID not found in registry: ${mediaId}`);
      return null;
    }

    // Generate public Supabase Storage URL from bucket + path
    const url = getPublicStorageURL(mediaItem.bucket, mediaItem.path);

    console.log("[MediaResolver] Resolved media ID", {
      mediaId: mediaItem.id,
      bucket: mediaItem.bucket,
      path: mediaItem.path,
      url,
    });

    return {
      id: mediaItem.id,
      url,
      alt: mediaItem.alt,
      type: "image", // All current media items are images
      caption: null,
      width: null,
      height: null,
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
}

/**
 * Resolve multiple media IDs to URLs (batch operation)
 * Returns a map of mediaId -> MediaResolution for efficient lookup
 */
export async function resolveMediaIds(mediaIds: string[]): Promise<Map<string, MediaResolution>> {
  const resolutionMap = new Map<string, MediaResolution>();

  if (mediaIds.length === 0) {
    return resolutionMap;
  }

  // Resolve all media IDs in parallel
  const resolutions = await Promise.all(
    mediaIds.map(async (mediaId) => {
      try {
        const resolution = await resolveMediaId(mediaId);
        return { mediaId, resolution };
      } catch (error) {
        console.error(`Error resolving media ID ${mediaId}:`, error);
        return { mediaId, resolution: null };
      }
    })
  );

  // Build map from successful resolutions
  resolutions.forEach(({ mediaId, resolution }) => {
    if (resolution) {
      resolutionMap.set(mediaId, resolution);
    }
  });

  return resolutionMap;
}

/**
 * Extract media IDs from YAML content
 * Parses YAML structure to find all media IDs
 * 
 * This function is used by the Orchestrator to extract media IDs
 * from the Copywriter's YAML output before resolution.
 */
import yaml from "js-yaml";

export function extractMediaIdsFromYAML(yamlContent: string): string[] {
  const mediaIds: string[] = [];
  
  try {
    // Try parsing as YAML first (more reliable)
    const parsed = yaml.load(yamlContent);
    
    if (parsed && typeof parsed === "object" && "media" in parsed) {
      const media = parsed.media as any;
      
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
      const parsedObj = parsed as any;
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
