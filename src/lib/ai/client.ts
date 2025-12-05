import Anthropic from "@anthropic-ai/sdk";
import { Client } from "langsmith";


// Initialize LangSmith client for tracing (optional)
// Only initialize server-side to avoid client-side environment variable issues
const getLangSmithApiKey = () => {
  const key = process.env.LANGSMITH_API_KEY;
  if (!key) return undefined;
  // Remove surrounding quotes if present (like Anthropic key)
  return key.replace(/^["']|["']$/g, "");
};

let langsmithClient: Client | null = null;
const langsmithApiKey = getLangSmithApiKey();

if (langsmithApiKey && typeof window === "undefined") {
  // Only initialize on server-side
  try {
    langsmithClient = new Client({
      apiKey: langsmithApiKey,
      apiUrl: process.env.LANGSMITH_API_URL || "https://api.smith.langchain.com",
    });
  } catch (error) {
    console.warn("Failed to initialize LangSmith client:", error);
  }
} else if (!langsmithApiKey && typeof window === "undefined") {
  // Only warn on server-side if key is missing
  console.warn(
    "LANGSMITH_API_KEY not set. LangSmith tracing is disabled. " +
    "Set LANGSMITH_API_KEY in your environment variables to enable monitoring."
  );
}

/**
 * Anthropic Client
 * Singleton instance for making API calls to Claude
 * Configured with LangSmith tracing if available
 */
// Remove quotes from API key if present
const getApiKey = () => {
  const key = process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
  if (!key) return undefined;
  // Remove surrounding quotes if present
  return key.replace(/^["']|["']$/g, "");
};

// Lazy initialization - only create client when actually needed
// This prevents errors when navigating to pages that import but don't use the client
let anthropicClient: Anthropic | null = null;

const getAnthropicClient = (): Anthropic => {
  if (!anthropicClient) {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY or NEXT_PUBLIC_ANTHROPIC_API_KEY environment variable is required"
      );
    }
    anthropicClient = new Anthropic({
      apiKey,
      // LangSmith will automatically trace if LANGSMITH_API_KEY is set
      // and environment variables are configured
    });
  }
  return anthropicClient;
};

export const anthropic = {
  messages: {
    create: async (...args: Parameters<Anthropic["messages"]["create"]>) => {
      return getAnthropicClient().messages.create(...args);
    },
  },
} as Anthropic;

export { langsmithClient };

