import { z } from "zod";
import type { PageJSON } from "@/components/utility/Renderer";

/**
 * Chat history message for conversational context
 */
export const ChatHistoryMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export type ChatHistoryMessage = z.infer<typeof ChatHistoryMessageSchema>;

/**
 * Page context types for AI query system
 */
export const PageContextSchema = z.object({
  pageId: z.enum(["home", "work-index", "case-study", "about", "contact"]),
  route: z.string(), // The actual route path (e.g., "/", "/work", "/work/capital-one-travel")
  pageSlug: z.string().optional(), // For case-study pages (alias for projectSlug)
  projectSlug: z.string().optional(), // For case-study pages (same as pageSlug)
  currentSectionId: z.string().optional(), // Current section ID for inline answers
  sections: z.array(z.object({
    id: z.string(),
    eyebrow: z.string(),
    heading: z.string(),
    body: z.string().optional(),
    label: z.string().optional(), // Optional label, defaults to heading if not provided
  })).optional(),
});

export type PageContext = z.infer<typeof PageContextSchema>;

/**
 * Answer mode determines when to generate copy
 */
export type AnswerMode = "full" | "brief" | "none";

/**
 * Routed intent from intent router
 */
export const RoutedIntentSchema = z.object({
  primaryTopicType: z.enum(["project", "skills", "career", "about", "other"]),
  primaryProjectSlug: z.string().nullable().optional(),
  bestPageId: z.string().nullable().optional(), // "home" | "work-index" | "case-study" | "about" | "contact" | null
  bestProjectSlug: z.string().nullable().optional(),
  bestSectionId: z.string().nullable().optional(),
  navigationRelevance: z.enum(["none", "optional", "strong"]),
  scrollRelevance: z.enum(["none", "optional", "strong"]),
  answerMode: z.enum(["full", "brief", "none"]),
});

export type RoutedIntent = z.infer<typeof RoutedIntentSchema>;

/**
 * AI suggestion for user action
 */
export const AISuggestionSchema = z.object({
  type: z.enum(["navigate", "scroll", "generate", "inline"]),
  targetPageId: z.enum(["home", "work-index", "case-study", "about", "contact"]).optional(),
  targetSlug: z.string().optional(), // For case-study pages
  targetSectionId: z.string().optional(), // For scroll suggestions and inline answers
  label: z.string(),
  reason: z.string().optional(),
  // Legacy fields for backward compatibility - will be removed
  url: z.string().optional(),
  sectionId: z.string().optional(),
});

export type AISuggestion = z.infer<typeof AISuggestionSchema>;

/**
 * API request body
 */
export const QueryRequestSchema = z.object({
  message: z.string().min(1),
  pageContext: PageContextSchema,
  history: z.array(ChatHistoryMessageSchema).optional().default([]),
  forceGenerate: z.boolean().optional().default(false), // If true, always generate answer even if scroll suggestion exists
});

export type QueryRequest = z.infer<typeof QueryRequestSchema>;

/**
 * API response
 */
export const QueryResponseSchema = z.object({
  answerLayout: z.any().nullable(), // PageJSON, but allow null
  suggestions: z.array(AISuggestionSchema),
});

export type QueryResponse = z.infer<typeof QueryResponseSchema>;

