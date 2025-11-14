/**
 * Supabase Storage utilities
 * Helper functions for uploading and retrieving media URLs
 * Supports both public URLs (never expire) and signed URLs (auto-refresh)
 */

import { supabase } from "./client";

interface SignedURLCache {
  url: string;
  expiresAt: number;
}

// Cache for signed URLs to avoid regenerating on every request
const signedURLCache = new Map<string, SignedURLCache>();

/**
 * Get a signed URL that expires after specified seconds (default 7 days = 604800 seconds)
 * Automatically refreshes expired URLs
 */
export async function getSignedStorageURL(
  bucket: string,
  path: string,
  expiresIn: number = 604800 // 7 days default
): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase client not configured");
  }

  const cacheKey = `${bucket}/${path}`;
  const cached = signedURLCache.get(cacheKey);

  // Return cached URL if still valid (refresh 1 hour before expiration)
  if (cached && cached.expiresAt > Date.now() + 3600000) {
    return cached.url;
  }

  // Generate new signed URL
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  if (!data?.signedUrl) {
    throw new Error("Failed to get signed URL");
  }

  // Cache the URL
  signedURLCache.set(cacheKey, {
    url: data.signedUrl,
    expiresAt: Date.now() + expiresIn * 1000,
  });

  return data.signedUrl;
}

/**
 * Upload a file to Supabase Storage and get the public CDN URL
 * 
 * @param bucket - Storage bucket name (e.g., "media")
 * @param path - File path within bucket (e.g., "projects/capital-one/hero.jpg")
 * @param file - File object to upload
 * @returns Public CDN URL in format: https://[project-ref].supabase.co/storage/v1/object/public/[bucket]/[path]
 */
export async function uploadFileToStorage(
  bucket: string,
  path: string,
  file: File | Blob
): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase client not configured");
  }

  // Upload file
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false, // Set to true if you want to overwrite existing files
  });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get public URL (CDN format)
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

  if (!urlData?.publicUrl) {
    throw new Error("Failed to get public URL");
  }

  // URL format: https://[project-ref].supabase.co/storage/v1/object/public/[bucket]/[path]
  return urlData.publicUrl;
}

/**
 * Get public URL for an existing file in storage
 * Public URLs never expire (if bucket is public)
 * 
 * @param bucket - Storage bucket name
 * @param path - File path within bucket
 * @returns Public CDN URL
 */
export function getPublicStorageURL(bucket: string, path: string): string {
  if (!supabase) {
    throw new Error("Supabase client not configured");
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  
  if (!data?.publicUrl) {
    throw new Error("Failed to get public URL");
  }

  return data.publicUrl;
}

/**
 * Get storage URL (public or signed) for a media item
 * Automatically determines if URL needs refreshing and handles it
 * 
 * @param media - MediaRow with storage_path and storage_bucket
 * @param useSignedURL - Whether to use signed URLs (default: true if storage_path exists)
 * @returns Fresh URL (public or signed)
 */
export async function getMediaURL(
  media: { url: string; storage_path?: string | null; storage_bucket?: string | null },
  useSignedURL: boolean = true
): Promise<string> {
  // If we have storage path info and want signed URLs, generate fresh signed URL
  if (useSignedURL && media.storage_path && media.storage_bucket) {
    try {
      return await getSignedStorageURL(media.storage_bucket, media.storage_path);
    } catch (error) {
      console.warn(`Failed to generate signed URL, falling back to stored URL:`, error);
      // Fallback to stored URL
      return media.url;
    }
  }

  // Check if stored URL is a signed URL that might be expired
  // Signed URLs contain a token parameter
  const isSignedURL = media.url.includes("token=");
  
  if (isSignedURL && media.storage_path && media.storage_bucket) {
    // Try to refresh expired signed URL
    try {
      return await getSignedStorageURL(media.storage_bucket, media.storage_path);
    } catch (error) {
      console.warn(`Failed to refresh signed URL, using stored URL:`, error);
    }
  }

  // Use stored URL (public URL or fallback)
  return media.url;
}

/**
 * Example workflows:
 * 
 * PUBLIC URL (Recommended - never expires):
 * 1. Upload file:
 *    const file = new File([blob], "hero.jpg", { type: "image/jpeg" });
 *    const url = await uploadFileToStorage("media", "projects/capital-one/hero.jpg", file);
 *    // Returns: https://abc123.supabase.co/storage/v1/object/public/media/projects/capital-one/hero.jpg
 * 
 * 2. Store in media table:
 *    await supabase.from("media").insert({
 *      project_slug: "capital-one",
 *      type: "image",
 *      url: url,
 *      storage_bucket: "media", // Optional but recommended
 *      storage_path: "projects/capital-one/hero.jpg", // Optional but recommended
 *      alt: "Capital One project hero image",
 *      role: "hero",
 *    });
 * 
 * SIGNED URL (For private buckets - auto-refreshes):
 * 1. Upload file to private bucket
 * 2. Store storage_path and storage_bucket in media table:
 *    await supabase.from("media").insert({
 *      project_slug: "capital-one",
 *      type: "image",
 *      url: "https://...", // Initial signed URL (will be auto-refreshed)
 *      storage_bucket: "media", // REQUIRED for auto-refresh
 *      storage_path: "projects/capital-one/hero.jpg", // REQUIRED for auto-refresh
 *      alt: "Capital One project hero image",
 *      role: "hero",
 *    });
 * 
 * 3. When retrieving media, URLs are automatically refreshed if expired:
 *    const media = await getMediaById("media-id");
 *    // URL is automatically refreshed if expired
 */

