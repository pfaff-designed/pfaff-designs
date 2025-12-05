/**
 * Navigation Intent Detection
 * 
 * Detects when user queries are navigation requests and maps them to routes.
 */

import {
  getProjectSlugFromName,
  getProjectRoute,
  PROJECT_MAPPINGS,
} from "./project-mapping";

export interface NavigationIntent {
  type: "project" | "page" | "none";
  path?: string;
  label?: string;
  confidence: "high" | "medium" | "low";
}

/**
 * Navigation verbs that indicate a navigation intent
 */
const NAVIGATION_VERBS = ["go", "take", "navigate", "open", "show", "view", "visit", "see"];

/**
 * Page name mappings (non-project pages)
 */
const PAGE_MAPPINGS: Array<{ patterns: RegExp[]; path: string; label: string }> = [
  {
    patterns: [/^\/?home\/?$/i, /^\/?index\/?$/i, /^\/?start\/?$/i, /^\/?main\/?$/i],
    path: "/",
    label: "Home",
  },
  {
    patterns: [/^\/?work\/?$/i, /^\/?projects\/?$/i, /^\/?case studies\/?$/i, /^\/?portfolio\/?$/i],
    path: "/work",
    label: "Work",
  },
  {
    patterns: [/^\/?contact\/?$/i, /^\/?reach out\/?$/i, /^\/?get in touch\/?$/i],
    path: "/contact",
    label: "Contact",
  },
  {
    patterns: [/^\/?about\/?$/i],
    path: "/about",
    label: "About",
  },
];

/**
 * Detect navigation intent from user query
 */
export function detectNavigationIntent(query: string): NavigationIntent {
  const normalized = query.toLowerCase().trim();
  
  // Check for navigation verbs
  const hasNavigationVerb = NAVIGATION_VERBS.some((verb) => {
    const verbPattern = new RegExp(`\\b${verb}\\b`, "i");
    return verbPattern.test(normalized);
  });
  
  // If no navigation verb, assume it's not a navigation intent
  if (!hasNavigationVerb) {
    return { type: "none", confidence: "high" };
  }
  
  // Extract the target (what comes after the verb)
  let target: string | null = null;
  for (const verb of NAVIGATION_VERBS) {
    const verbPattern = new RegExp(`\\b${verb}\\s+(?:me\\s+)?to\\s+(?:the\\s+)?(.+?)(?:\\s+(?:page|case study|project))?\\s*$`, "i");
    const match = normalized.match(verbPattern);
    if (match && match[1]) {
      target = match[1].trim();
      break;
    }
    
    // Also try without "to"
    const verbPattern2 = new RegExp(`\\b${verb}\\s+(?:me\\s+)?(.+?)(?:\\s+(?:page|case study|project))?\\s*$`, "i");
    const match2 = normalized.match(verbPattern2);
    if (match2 && match2[1]) {
      target = match2[1].trim();
      break;
    }
  }
  
  // If no target extracted, might still be navigation but unclear
  if (!target) {
    // Check if query is just a verb + page indicator
    if (/\b(?:the\s+)?(?:work|home|contact|about)\s+(?:page|section)\b/i.test(normalized)) {
      const pageMatch = normalized.match(/\b(work|home|contact|about)\b/i);
      if (pageMatch) {
        target = pageMatch[1].toLowerCase();
      }
    } else {
      return { type: "none", confidence: "medium" };
    }
  }
  
  if (!target) {
    return { type: "none", confidence: "low" };
  }
  
  // Try to match as a project
  const projectSlug = getProjectSlugFromName(target);
  if (projectSlug) {
    const mapping = PROJECT_MAPPINGS.find((m) => m.slug === projectSlug);
    return {
      type: "project",
      path: getProjectRoute(projectSlug),
      label: mapping?.label ?? projectSlug,
      confidence: "high",
    };
  }
  
  // Try to match as a page
  for (const pageMapping of PAGE_MAPPINGS) {
    if (pageMapping.patterns.some((pattern) => pattern.test(target))) {
      return {
        type: "page",
        path: pageMapping.path,
        label: pageMapping.label,
        confidence: "high",
      };
    }
  }
  
  // Check for direct path patterns (e.g., "/work/capital-one")
  const pathPattern = /^\/?(\/work\/[^\/]+|\/contact|\/about|\/)$/i;
  const pathMatch = target.match(pathPattern);
  if (pathMatch) {
    const path = pathMatch[1].startsWith("/") ? pathMatch[1] : `/${pathMatch[1]}`;
    return {
      type: "page",
      path,
      label: path,
      confidence: "medium",
    };
  }
  
  // Low confidence - might be navigation but can't map it
  return { type: "none", confidence: "low" };
}

/**
 * Check if a query is likely a navigation request
 */
export function isNavigationQuery(query: string): boolean {
  const intent = detectNavigationIntent(query);
  return intent.type !== "none" && intent.confidence !== "low";
}

