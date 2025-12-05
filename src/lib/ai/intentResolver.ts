// src/lib/ai/intentResolver.ts

// No anthropic / traceable needed for now
// import { anthropic } from "./client";
// import { traceable } from "langsmith/traceable";

export type QueryIntent = "project" | "skills" | "experience" | "general";
export type Audience = "recruiter" | "freelance_client" | "unknown";
export type PageKind = "case_study" | "overview" | "skills" | "experience" | "mixed";

export type QuestionFocus =
  | "overview"
  | "tools"
  | "process"
  | "outcomes"
  | "timeline"
  | "reflections"
  | "skills"
  | "experience"
  | "other";

export interface IntentTopic {
  type?: QueryIntent | "general";
  projectSlug?: string | null;
  skillNames?: string[] | null;
}

export type IntentConfidence = "high" | "medium" | "low";

export interface IntentResult {
  intent: QueryIntent;
  pageKind: PageKind;
  audience: Audience;
  topic?: IntentTopic;
  confidence: IntentConfidence;
  questionFocus: QuestionFocus;
}

/**
 * Simple project matcher: map phrases → project slugs
 */
const PROJECT_PATTERNS: { slug: string; keywords: string[] }[] = [
  {
    slug: "capital-one-travel",
    keywords: ["capital one", "capital-one", "capitalone", "capital one travel"],
  },
  {
    slug: "coca-cola-creative-technology",
    keywords: ["coca cola", "coke", "coca-cola"],
  },
  {
    slug: "pmi",
    keywords: ["pmi", "project management institute"],
  },
];

function matchProjectSlug(query: string): string | null {
  const q = query.toLowerCase();
  for (const pattern of PROJECT_PATTERNS) {
    if (pattern.keywords.some((kw) => q.includes(kw))) {
      return pattern.slug;
    }
  }
  return null;
}

/**
 * Infer question focus from query using simple rules (no LLM)
 */
function inferQuestionFocusFromQuery(
  query: string,
  pageKind: PageKind | string
): QuestionFocus {
  const q = query.toLowerCase();

  if (q.includes("tool") || q.includes("stack") || q.includes("tech")) {
    return "tools";
  }

  if (q.includes("process") || q.includes("how did you")) {
    return "process";
  }

  if (
    q.includes("outcome") ||
    q.includes("result") ||
    q.includes("impact") ||
    q.includes("what happened")
  ) {
    return "outcomes";
  }

  if (q.includes("timeline") || q.includes("when") || q.includes("duration")) {
    return "timeline";
  }

  if (q.includes("learn") || q.includes("lesson")) {
    return "reflections";
  }

  if (pageKind === "skills") return "skills";
  if (pageKind === "experience") return "experience";

  return "overview";
}

/**
 * Infer audience from query
 */
function inferAudience(query: string): Audience {
  const q = query.toLowerCase();

  // Very rough heuristics – we can refine later
  if (
    q.includes("role") ||
    q.includes("position") ||
    q.includes("hire") ||
    q.includes("interview") ||
    q.includes("job")
  ) {
    return "recruiter";
  }

  if (
    q.includes("project") ||
    q.includes("budget") ||
    q.includes("rate") ||
    q.includes("freelance") ||
    q.includes("contract")
  ) {
    return "freelance_client";
  }

  return "unknown";
}

/**
 * Pure rule-based intent resolver (no LLM, fast + deterministic)
 */
export async function resolveIntent(query: string): Promise<IntentResult> {
  const q = query.toLowerCase().trim();

  const projectSlug = matchProjectSlug(q);

  let intent: QueryIntent = "general";
  let pageKind: PageKind = "overview";
  let confidence: IntentConfidence = "medium";

  if (projectSlug) {
    intent = "project";
    pageKind = "case_study";
    confidence = "high";
  } else if (
    q.includes("skill") ||
    q.includes("skills") ||
    q.includes("what can you do") ||
    q.includes("tech stack") ||
    q.includes("technology stack")
  ) {
    intent = "skills";
    pageKind = "skills";
    confidence = "high";
  } else if (
    q.includes("experience") ||
    q.includes("where have you worked") ||
    q.includes("work history") ||
    q.includes("resume") ||
    q.includes("cv")
  ) {
    intent = "experience";
    pageKind = "experience";
    confidence = "high";
  } else {
    intent = "general";
    pageKind = "overview";
    confidence = "medium";
  }

  const audience = inferAudience(q);

  const topic: IntentTopic | undefined =
    intent === "project" && projectSlug
      ? {
          type: "project",
          projectSlug,
          skillNames: null,
        }
      : intent === "skills"
      ? {
          type: "skills",
          projectSlug: null,
          skillNames: null, // could parse later if you want skill names
        }
      : undefined;

  const questionFocus = inferQuestionFocusFromQuery(query, pageKind);

  const result: IntentResult = {
    intent,
    pageKind,
    audience,
    topic,
    confidence,
    questionFocus,
  };

  return result;
}