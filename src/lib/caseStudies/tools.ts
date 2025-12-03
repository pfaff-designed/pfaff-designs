/**
 * Utility to get tools from KB facts for case studies
 * Maps case study slugs to KB project facts paths
 */

// Mapping from case study slug to KB project ID
const SLUG_TO_KB_PROJECT: Record<string, string> = {
  "capital-one-travel": "capital-one",
  "pmi": "pmi",
  "tanger-outlets": "tanger",
  "coca-cola-creative-technology": "coke",
  "pfaff-designs": "pfaff-designs",
};

// Import KB facts JSON files
import capitalOneFacts from "../../../knowledge-base/projects/capital-one/capital-one-short-form.JSON";
import pmiFacts from "../../../knowledge-base/projects/pmi/pmi-shortform.JSON";
import tangerFacts from "../../../knowledge-base/projects/tanger/tanger-facts.json";
import cokeFacts from "../../../knowledge-base/projects/coke/coke-facts.json";
import pfaffDesignsFacts from "../../../knowledge-base/projects/pfaff-designs/pfaff-designs.json";

const KB_FACTS: Record<string, any> = {
  "capital-one": capitalOneFacts,
  "pmi": pmiFacts,
  "tanger": tangerFacts,
  "coke": cokeFacts,
  "pfaff-designs": pfaffDesignsFacts,
};

/**
 * Get tools array for a case study by slug
 */
export function getToolsForCaseStudy(slug: string): string[] {
  const kbProjectId = SLUG_TO_KB_PROJECT[slug];
  if (!kbProjectId) {
    return [];
  }

  const facts = KB_FACTS[kbProjectId];
  if (!facts || !Array.isArray(facts.skillsUsed)) {
    return [];
  }

  return facts.skillsUsed;
}

