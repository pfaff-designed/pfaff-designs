/**
 * URL validation utilities
 * Enforces that URLs come only from Supabase per architecture requirements
 */

/**
 * Default placeholder image URL (allowed for development/fallback)
 */
const DEFAULT_PLACEHOLDER_URL = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=60";

/**
 * Check if a URL is from Supabase Storage/CDN
 */
export function validateSupabaseURL(url: string): boolean {
  if (!url || typeof url !== "string") return false;

  try {
    const urlObj = new URL(url);
    
    // Check for Supabase Storage URLs
    // Pattern: https://[project-ref].supabase.co/storage/v1/object/public/[bucket]/[path]
    // Or: https://[project-ref].supabase.co/storage/v1/object/sign/[bucket]/[path]
    const supabasePattern = /\.supabase\.co\/storage\/v1\//;
    
    // Also allow localhost for development
    const isLocalhost = urlObj.hostname === "localhost" || urlObj.hostname === "127.0.0.1";
    
    // Allow default placeholder for development/fallback cases
    const isDefaultPlaceholder = url === DEFAULT_PLACEHOLDER_URL;
    
    return supabasePattern.test(url) || isLocalhost || isDefaultPlaceholder;
  } catch {
    // Invalid URL format
    return false;
  }
}

/**
 * Validate and sanitize media URL
 * Returns the URL if valid, or throws an error
 */
export function validateMediaURL(url: string): string {
  if (!validateSupabaseURL(url)) {
    throw new Error(`Invalid media URL: ${url}. Only Supabase URLs are allowed.`);
  }
  return url;
}

