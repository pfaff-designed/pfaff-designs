/**
 * Section Image Utilities
 * Helper functions to get section images from Supabase Storage
 * Images follow the pattern: project-name-ui-number.jpg
 */

import { getPublicStorageURL } from "@/lib/supabase/storage";
import { SUPABASE_MEDIA_BUCKET } from "./registry";
import { supabase } from "@/lib/supabase/client";

/**
 * Get section image URL from Supabase Storage
 * Constructs path based on pattern: {projectSlug}-ui-{sectionNumber}.jpg
 * 
 * @param projectSlug - Project slug (e.g., "capital-one-travel")
 * @param sectionNumber - Section index (1-based, e.g., 1, 2, 3)
 * @returns Public URL to the image, or null if image doesn't exist
 */
export async function getSectionImageURL(
  projectSlug: string,
  sectionNumber: number
): Promise<string | null> {
  if (!supabase) {
    console.warn("Supabase client not configured");
    return null;
  }

  // Extract base project name (e.g., "capital-one-travel" -> "capital-one")
  const baseProjectName = extractBaseProjectName(projectSlug);
  
  // Construct image path following pattern: {baseProjectName}/{baseProjectName}-ui-{sectionNumber}.jpg
  const imagePath = `${baseProjectName}/${baseProjectName}-ui-${sectionNumber}.jpg`;

  try {
    // Check if file exists by attempting to get public URL
    // If file doesn't exist, Supabase will still return a URL but the file won't be accessible
    const url = getPublicStorageURL(SUPABASE_MEDIA_BUCKET, imagePath);
    
    // Verify file exists by checking if we can access it
    // We'll do a lightweight HEAD request to check
    try {
      const response = await fetch(url, { method: "HEAD" });
      if (response.ok) {
        return url;
      }
    } catch (error) {
      // File doesn't exist or isn't accessible
      return null;
    }

    return url;
  } catch (error) {
    console.warn(`Failed to get section image for ${projectSlug} section ${sectionNumber}:`, error);
    return null;
  }
}

/**
 * Get all section images for a project
 * Attempts to fetch images for sections 1-10 (adjust range as needed)
 * 
 * @param projectSlug - Project slug
 * @param maxSections - Maximum number of sections to check (default: 10)
 * @returns Array of image URLs, with null for missing images
 */
export async function getAllSectionImages(
  projectSlug: string,
  maxSections: number = 10
): Promise<Array<string | null>> {
  const imagePromises = Array.from({ length: maxSections }, (_, i) =>
    getSectionImageURL(projectSlug, i + 1)
  );

  return Promise.all(imagePromises);
}

/**
 * Extract base project name from project slug
 * Converts "capital-one-travel" -> "capital-one"
 * This matches the folder structure in Supabase Storage
 */
function extractBaseProjectName(projectSlug: string): string {
  // Common suffixes to remove: -travel, -outlets, -platform, etc.
  // Remove the last segment if it's a common project type suffix
  const parts = projectSlug.split("-");
  
  // If slug ends with common suffixes, remove them
  const commonSuffixes = ["travel", "outlets", "platform", "certification", "experience"];
  if (parts.length > 1 && commonSuffixes.includes(parts[parts.length - 1])) {
    return parts.slice(0, -1).join("-");
  }
  
  // Otherwise return as-is
  return projectSlug;
}

/**
 * Get section image URL synchronously (for client-side use)
 * Returns the constructed URL without verification
 * Use this when you know the image exists or want to handle 404s in the component
 * 
 * @param projectSlug - Project slug (e.g., "capital-one-travel")
 * @param sectionNumber - Section index (1-based)
 * @returns Constructed public URL, or empty string if Supabase is not configured
 */
export function getSectionImageURLSync(
  projectSlug: string,
  sectionNumber: number
): string {
  if (!supabase) {
    return "";
  }

  try {
    // Extract base project name (e.g., "capital-one-travel" -> "capital-one")
    const baseProjectName = extractBaseProjectName(projectSlug);
    
    // Construct path: {baseProjectName}/{baseProjectName}-ui-{sectionNumber}.jpg
    // Example: capital-one/capital-one-ui-1.jpg
    const imagePath = `${baseProjectName}/${baseProjectName}-ui-${sectionNumber}.jpg`;
    const url = getPublicStorageURL(SUPABASE_MEDIA_BUCKET, imagePath);
    return url;
  } catch (error) {
    return "";
  }
}

