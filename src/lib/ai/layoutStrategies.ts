/**
 * Layout Strategies
 * Maps Intent → preferred component palette and order
 * Components must align with the actual Component Registry
 */

import type { Intent } from "./intents";
import { componentRegistry } from "@/lib/registry/componentRegistry";

export interface LayoutStrategy {
  preferredComponents: string[];
}

/**
 * Get all available components from registry
 */
const availableComponents = Object.keys(componentRegistry);

/**
 * Validate that a component exists in the registry
 */
function validateComponent(componentName: string): boolean {
  return availableComponents.includes(componentName);
}

/**
 * Layout strategies for each audience intent
 * Maps to actual components in the Component Registry
 */
export const layoutStrategies: Record<Intent, LayoutStrategy> = {
  recruiter: {
    preferredComponents: [
      "CaseStudyHero", // Hero summary for quick overview
      "ContentSection", // Skills section
      "Card", // Top projects grid (using Card for project highlights)
      "ContentSection", // CTA/resume link section
    ].filter(validateComponent),
  },
  
  hiring_manager: {
    preferredComponents: [
      "CaseStudyHero", // Hero with project context
      "ContentSection", // Problem definition
      "ContentSection", // Process details
      "ContentSection", // Architecture/technical decisions
      "ContentSection", // Detailed case study
      "ContentSection", // Outcomes/impact
    ].filter(validateComponent),
  },
  
  client: {
    preferredComponents: [
      "CaseStudyHero", // Trust-building hero
      "ContentSection", // Services overview
      "ContentSection", // Outcome case studies
      "ContentSection", // How I work
      "ContentSection", // Social proof
      "ContentSection", // Contact CTA
    ].filter(validateComponent),
  },
  
  general: {
    preferredComponents: [
      "ContentSection", // General overview
      "ContentSection", // Case study list
      "ContentSection", // Simple CTA
    ].filter(validateComponent),
  },
};

/**
 * Get layout strategy for an intent
 * Falls back to general if intent is invalid
 */
export function getLayoutStrategy(intent: Intent): LayoutStrategy {
  return layoutStrategies[intent] || layoutStrategies.general;
}

/**
 * Get preferred components for an intent
 * Returns only components that exist in the registry
 */
export function getPreferredComponents(intent: Intent): string[] {
  const strategy = getLayoutStrategy(intent);
  return strategy.preferredComponents.filter(validateComponent);
}

// TODO: The following components are referenced in the intent descriptions but may not exist yet:
// - SkillsChipList (could use ContentSection with Tag components)
// - CaseStudyHighlightGrid (could use Card + MediaGallery)
// - ResumeCTA (could use ContentSection + Button)
// - ProblemDefinitionBlock (could use ContentSection)
// - ProcessBlock (could use ContentSection with Timeline variant)
// - ArchitectureCallout (could use ContentSection)
// - ServicesBlock (could use ContentSection)
// - OutcomeCaseStudy (could use ContentSection)
// - HowIWorkBlock (could use ContentSection)
// - SocialProofBlock (could use ContentSection)
// - ContactCTA (could use ContentSection + Button)
// - CaseStudyList (could use ContentSection)
// - SimpleCTA (could use ContentSection)

