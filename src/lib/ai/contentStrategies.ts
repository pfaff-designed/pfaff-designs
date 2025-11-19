/**
 * Content Strategies
 * Maps Intent → content goals and required sections
 */

import type { Intent } from "./intents";

export interface ContentStrategy {
  goals: string[];
  requiredSections: string[];
}

/**
 * Content strategies for each audience intent
 * Defines what content should be emphasized and which sections are required
 */
export const contentStrategies: Record<Intent, ContentStrategy> = {
  recruiter: {
    goals: ["fast clarity", "skills visibility", "proof points"],
    requiredSections: ["summary", "skills", "top_projects", "cta_resume"],
  },
  hiring_manager: {
    goals: ["depth", "architecture reasoning", "collaboration style"],
    requiredSections: ["summary", "process", "architecture", "detailed_case"],
  },
  client: {
    goals: ["trust", "services", "outcomes"],
    requiredSections: ["services", "outcome_cases", "how_i_work", "cta_contact"],
  },
  general: {
    goals: ["overview"],
    requiredSections: ["summary", "case_list", "cta_simple"],
  },
};

