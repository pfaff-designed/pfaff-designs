import Anthropic from "@anthropic-ai/sdk";
import { Client } from "langsmith";

// Initialize LangSmith client for tracing
let langsmithClient: Client | null = null;
if (process.env.LANGSMITH_API_KEY) {
  try {
    langsmithClient = new Client({
      apiKey: process.env.LANGSMITH_API_KEY,
      apiUrl: process.env.LANGSMITH_API_URL || "https://api.smith.langchain.com",
    });
    console.log("LangSmith tracing enabled");
  } catch (error) {
    console.warn("Failed to initialize LangSmith client:", error);
  }
} else {
  console.warn(
    "LANGSMITH_API_KEY not set. LangSmith tracing is disabled. " +
    "Set LANGSMITH_API_KEY to enable monitoring."
  );
}

if (!process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY) {
  throw new Error(
    "ANTHROPIC_API_KEY or NEXT_PUBLIC_ANTHROPIC_API_KEY environment variable is required"
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

export const anthropic = new Anthropic({
  apiKey: getApiKey(),
  // LangSmith will automatically trace if LANGSMITH_API_KEY is set
  // and environment variables are configured
});

export { langsmithClient };

