/**
 * Project Mapping Utilities
 * 
 * Centralized mapping of project names, aliases, and keywords to canonical slugs
 * for internal linking and navigation.
 */

import { caseStudies, getCaseStudyBySlug as getCaseStudyBySlugFromData } from "@/lib/caseStudies/data";
import type { CaseStudyPage } from "@/lib/caseStudies/types";

export interface ProjectMapping {
  slug: string;
  label: string;
  aliases: string[];
  keywords: string[];
}

/**
 * Project name to slug mappings with aliases and keywords
 */
export const PROJECT_MAPPINGS: ProjectMapping[] = [
  {
    slug: "capital-one-travel",
    label: "Capital One Travel",
    aliases: ["capital one", "capitalone", "capital one travel"],
    keywords: ["capital one", "capitalone", "travel", "booking", "lounge"],
  },
  {
    slug: "coca-cola-creative-technology",
    label: "Coke",
    aliases: ["coke", "coca-cola", "coca cola", "coca cola creative technology"],
    keywords: ["coke", "coca-cola", "coca cola", "creative", "technology", "ai", "vending"],
  },
  {
    slug: "pmi",
    label: "PMI",
    aliases: [
      "pmi",
      "project management institute",
      "pmi-org",
      "pmi agile",
      "pmi-acp",
      "pmi agile certified practitioner",
      "project management",
    ],
    keywords: ["pmi", "project management institute", "agile", "certification", "acp"],
  },
  {
    slug: "pfaff-designs",
    label: "Pfaff.design",
    aliases: [
      "pfaff.design",
      "pfaff-designs",
      "pfaff designs",
      "pfaff design portfolio",
      "generative ui portfolio",
      "rag portfolio",
      "this portfolio",
      "pfaff design site",
    ],
    keywords: [
      "pfaff.design",
      "pfaff-designs",
      "pfaff design",
      "generative ui portfolio",
      "rag portfolio",
      "pfaff portfolio",
    ],
  },
];

/**
 * Get project mapping by slug
 */
export function getProjectMappingBySlug(slug: string): ProjectMapping | undefined {
  return PROJECT_MAPPINGS.find((m) => m.slug === slug);
}

/**
 * Get project slug from various name variations
 */
export function getProjectSlugFromName(name: string): string | null {
  const normalized = name.toLowerCase().trim();
  
  // Direct slug match
  const directMatch = PROJECT_MAPPINGS.find((m) => m.slug === normalized);
  if (directMatch) return directMatch.slug;
  
  // Alias match
  const aliasMatch = PROJECT_MAPPINGS.find((m) =>
    m.aliases.some((alias) => alias.toLowerCase() === normalized)
  );
  if (aliasMatch) return aliasMatch.slug;
  
  // Partial match (e.g., "capital one" in "capital one travel")
  const partialMatch = PROJECT_MAPPINGS.find((m) =>
    m.aliases.some((alias) => normalized.includes(alias.toLowerCase())) ||
    normalized.includes(m.slug)
  );
  if (partialMatch) return partialMatch.slug;
  
  // Keyword match
  const keywordMatch = PROJECT_MAPPINGS.find((m) =>
    m.keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))
  );
  if (keywordMatch) return keywordMatch.slug;
  
  return null;
}

/**
 * Get project label from slug
 */
export function getProjectLabelFromSlug(slug: string): string | null {
  const mapping = getProjectMappingBySlug(slug);
  return mapping?.label ?? null;
}

/**
 * Detect project mentions in text and return matching slugs with context
 */
export interface ProjectMention {
  slug: string;
  label: string;
  reason?: string;
}

export function detectProjectMentions(text: string, excludeSlug?: string): ProjectMention[] {
  const normalized = text.toLowerCase();
  const mentions: Map<string, ProjectMention> = new Map();
  
  for (const mapping of PROJECT_MAPPINGS) {
    // Skip excluded project
    if (excludeSlug && mapping.slug === excludeSlug) continue;
    
    // Check for mentions
    const isMentioned =
      mapping.aliases.some((alias) => normalized.includes(alias.toLowerCase())) ||
      mapping.keywords.some((keyword) => normalized.includes(keyword.toLowerCase())) ||
      normalized.includes(mapping.slug);
    
    if (isMentioned) {
      mentions.set(mapping.slug, {
        slug: mapping.slug,
        label: mapping.label,
      });
    }
  }
  
  return Array.from(mentions.values());
}

/**
 * Get route path from project slug
 */
export function getProjectRoute(slug: string): string {
  return `/work/${slug}`;
}

/**
 * Get all available case study slugs (excluding hidden/confidential projects)
 */
export function getAvailableCaseStudySlugs(): string[] {
  return caseStudies
    .filter((study) => study.slug !== "tanger-outlets" && study.slug !== "real-estate-platform")
    .map((study) => study.slug);
}

/**
 * Get case study by slug
 * Re-exports from caseStudies data to maintain consistency
 */
export function getCaseStudyBySlug(slug: string): CaseStudyPage | undefined {
  return getCaseStudyBySlugFromData(slug);
}

