import { createClient } from "@supabase/supabase-js";

/**
 * Create Supabase client
 * Returns null if environment variables are not configured (graceful fallback)
 */
export function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key);
}

// Export singleton instance (will be null if not configured)
export const supabase = createSupabaseClient();

