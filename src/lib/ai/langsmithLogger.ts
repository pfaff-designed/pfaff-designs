import { langsmithClient } from "./client";

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEvent {
  level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
  runId?: string;
}

/**
 * Log to LangSmith instead of console
 * Falls back to console if LangSmith is not available
 */
export const logToLangSmith = (
  level: LogLevel,
  message: string,
  metadata?: Record<string, any>,
  runId?: string
): void => {
  if (langsmithClient && process.env.LANGSMITH_API_KEY) {
    try {
      // Create a feedback/event in LangSmith
      langsmithClient.createFeedback(
        runId || "orchestrator-run",
        level,
        {
          score: level === "error" ? 0 : level === "warn" ? 0.5 : 1,
          comment: `${message}${metadata ? ` | Metadata: ${JSON.stringify(metadata)}` : ""} | Timestamp: ${new Date().toISOString()}`,
        }
      ).catch((err) => {
        // Fallback to console if LangSmith fails
        console[level](`[LangSmith] ${message}`, metadata);
      });
    } catch (error) {
      // Fallback to console
      console[level](`[LangSmith Error] ${message}`, metadata);
    }
  } else {
    // Fallback to console if LangSmith not configured
    console[level](message, metadata);
  }
};

/**
 * Log diagnostic information to LangSmith
 */
export const logDiagnostic = (
  category: string,
  data: Record<string, any>,
  runId?: string
): void => {
  logToLangSmith("debug", `[${category}]`, data, runId);
};
