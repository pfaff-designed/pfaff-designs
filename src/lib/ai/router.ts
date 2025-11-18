/**
 * AI Router Logic
 * Pure, deterministic routing logic for portfolio navigation
 * No LLM calls, no side effects - just types and functions
 */

/**
 * Route kind - represents the type of current route
 */
export type RouteKind =
  | "home"
  | "case_study"
  | "about"
  | "contact"
  | "other";

/**
 * Current route - represents where the user currently is
 */
export type CurrentRoute = {
  kind: RouteKind;
  slug?: string; // present when kind === "case_study"
};

/**
 * Router intent - represents what action the router decided to take
 */
export type RouterIntent =
  | { type: "go_to_case_study"; slug: string }
  | { type: "answer_on_page"; pageSlug: string; sectionId: string | null }
  | { type: "go_to_about" }
  | {
      type: "go_to_contact";
      reason: "off_topic" | "not_covered" | "logistics";
      originalQuestion: string;
    };

/**
 * Detects which case study (if any) a question refers to
 * Uses simple keyword heuristics - no LLM calls
 */
export function detectCaseStudySlugFromQuestion(question: string): string | null {
  const q = question.toLowerCase();

  // Capital One / Capital One Travel
  if (q.includes("capital one") || q.includes("capital one travel")) {
    return "capital-one-travel";
  }

  // Tanger
  if (q.includes("tanger")) {
    return "tanger-outlets";
  }

  // PMI
  if (q.includes("pmi")) {
    return "pmi";
  }

  // Coke / Coca-Cola / Vending Machine
  if (q.includes("coke") || q.includes("vending machine")) {
    return "coke-vending-machine";
  }

  return null;
}

/**
 * Checks if a question is about background/who I am (global "about me" questions)
 * Uses stricter keyword matching to avoid hijacking project-specific questions.
 */
export function isAboutBackground(question: string): boolean {
  const q = question.toLowerCase();

  const strongBackgroundPhrases = [
    "your background",
    "tell me about yourself",
    "tell me about you",
    "about you",
    "who are you",
    "who is charles",
    "who is pfaff",
    "what do you do overall",
    "what do you do in general",
  ];

  // We explicitly do NOT treat generic words like "experience" or "skills"
  // as background questions anymore, because those are usually per-project.
  return strongBackgroundPhrases.some((phrase) => q.includes(phrase));
}

/**
 * Checks if a question is about contact/logistics/hiring
 * Uses keyword matching for logistics-related phrases
 */
export function isContactOrLogistics(question: string): boolean {
  const q = question.toLowerCase();

  const logisticsPhrases = [
    "available",
    "availability",
    "freelance",
    "hire you",
    "hire",
    "book you",
    "rate",
    "rates",
    "price",
    "pricing",
    "call",
    "meeting",
    "chat",
    "reach you",
    "get in touch",
  ];

  return logisticsPhrases.some((phrase) => q.includes(phrase));
}

/**
 * Maps a question about a project to a specific section ID
 * Returns null if no clear section match
 */
export function mapQuestionToSectionId(question: string): string | null {
  const q = question.toLowerCase();

  // Role/responsibility/scope/experience
  if (
    q.includes("role") ||
    q.includes("responsibilit") ||
    q.includes("scope") ||
    q.includes("what did you do") ||
    q.includes("experience on this project") ||
    q.includes("experience here") ||
    q.includes("what was your experience")
  ) {
    return "role";
  }

  // Tools/stack/technology/skills
  if (
    q.includes("tool") ||
    q.includes("stack") ||
    q.includes("tech") ||
    q.includes("technology") ||
    q.includes("language") ||
    q.includes("skills") ||
    q.includes("skillset")
  ) {
    return "tools";
  }

  // Process/workflow
  if (
    q.includes("process") ||
    q.includes("how did you") ||
    q.includes("workflow") ||
    q.includes("approach") ||
    q.includes("steps")
  ) {
    return "process";
  }

  // Impact/results
  if (
    q.includes("impact") ||
    q.includes("result") ||
    q.includes("outcome") ||
    q.includes("effect") ||
    q.includes("benefit")
  ) {
    return "impact";
  }

  // Team/collaboration
  if (
    q.includes("team") ||
    q.includes("collaborat") ||
    q.includes("designer") ||
    q.includes("pm") ||
    q.includes("product manager")
  ) {
    return "team";
  }

  // Overview/what is this project
  if (
    q.includes("overview") ||
    q.includes("what is this") ||
    q.includes("what was this project")
  ) {
    return "overview";
  }

  return null;
}

/**
 * Main router function - decides routing action based on current route and question
 * Follows a deterministic decision tree with no side effects
 */
export function routeQuestion(
  currentRoute: CurrentRoute,
  question: string
): RouterIntent {
  // Normalize question
  const q = question.toLowerCase().trim();

  // Step 1: Detect explicit project mention
  const detectedSlug = detectCaseStudySlugFromQuestion(q);

  // Step 2: Background detection (takes priority even on case-study pages)
  if (isAboutBackground(q)) {
    return { type: "go_to_about" };
  }

  // Step 3: If on a case study page
  if (currentRoute.kind === "case_study") {
    // If question references a different project, navigate to it
    if (detectedSlug !== null && detectedSlug !== currentRoute.slug) {
      return { type: "go_to_case_study", slug: detectedSlug };
    }

    // If question is about contact/logistics
    if (isContactOrLogistics(q)) {
      return {
        type: "go_to_contact",
        reason: "logistics",
        originalQuestion: question,
      };
    }

    // Otherwise, assume question is about THIS project
    const sectionId = mapQuestionToSectionId(q);
    return {
      type: "answer_on_page",
      pageSlug: currentRoute.slug!,
      sectionId,
    };
  }

  // Step 4: If NOT on a case study page
  // If detected project slug, go to that case study
  if (detectedSlug !== null) {
    return { type: "go_to_case_study", slug: detectedSlug };
  }

  // If contact/logistics question
  if (isContactOrLogistics(q)) {
    return {
      type: "go_to_contact",
      reason: "logistics",
      originalQuestion: question,
    };
  }

  // If background question (already handled earlier, but keeping for consistency)
  if (isAboutBackground(q)) {
    return { type: "go_to_about" };
  }

  // Default fallback: route to contact with "not_covered" reason
  return {
    type: "go_to_contact",
    reason: "not_covered",
    originalQuestion: question,
  };
}
