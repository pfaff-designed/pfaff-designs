import Anthropic from "@anthropic-ai/sdk";

if (!process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY) {
  throw new Error(
    "ANTHROPIC_API_KEY or NEXT_PUBLIC_ANTHROPIC_API_KEY environment variable is required"
  );
}

/**
 * Anthropic Client
 * Singleton instance for making API calls to Claude
 */
// Remove quotes from API key if present
const getApiKey = () => {
  const key = process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
  if (!key) return undefined;
  // Remove surrounding quotes if present
  return key.replace(/^["']|["']$/g, "");
};

export const anthropic = new Anthropic({
  apiKey: getApiKey(),
});

