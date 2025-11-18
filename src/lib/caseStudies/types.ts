/**
 * Case Study Content Model
 * Shared types for case study pages
 */

export type CaseStudySectionId =
  | "overview"
  | "role"
  | "scope"
  | "tools"
  | "process"
  | "impact"
  | "team"
  | "extras";

export interface CaseStudySection {
  id: CaseStudySectionId;
  eyebrow: string;
  heading: string;
  body: string;
}

export interface CaseStudyPage {
  slug: string; // e.g., "capital-one-travel"
  client: string; // e.g., "Capital One"
  projectName: string; // e.g., "Capital One Travel"
  url?: string; // external URL if applicable
  timeframe?: string; // e.g., "2023–2024"
  heroSummary: string; // short hero blurb
  roleSummary: string; // short role blurb
  sections: CaseStudySection[];
}

