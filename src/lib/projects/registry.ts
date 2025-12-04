/**
 * Central Projects Registry
 * Single source of truth for all case studies in the portfolio
 */

import type { MediaId } from "@/lib/media/registry";

export type ProjectId =
  | "capital-one-travel"
  | "pmi"
  | "tanger-outlets"
  | "coca-cola-creative-technology"
  | "confidential-real-estate"
  | "pfaff-designs";

export interface ProjectMeta {
  id: ProjectId;
  slug: string; // URL slug
  clientLabel: string; // Shown in hero as "Client"
  projectTitle: string; // Short title for the work
  role: string; // High-level role
  summary: string; // 1–2 sentence summary
  primaryLink?: string; // Optional external URL
  heroImageId: MediaId; // Media ID for hero (from media registry)
  year?: string; // Optional; only if we know it
}

export const PROJECTS: ProjectMeta[] = [
  // Capital One (existing)
  {
    id: "capital-one-travel",
    slug: "capital-one-travel",
    clientLabel: "Capital One",
    projectTitle: "Capital One Travel",
    role: "Front-End Engineer / Technologist",
    summary:
      "Modernized Capital One's travel experience and prototyped AI-driven flows to help travelers find and book trips.",
    primaryLink: "https://www.capitalonetravel.com",
    heroImageId: "hero-capital-one",
    year: "2023–2024",
  },

  // PMI
  {
    id: "pmi",
    slug: "pmi",
    clientLabel: "PMI (Project Management Institute)",
    projectTitle: "PMI Agile Certification Site",
    role: "Front-End Engineer / Technologist",
    summary:
      "Implemented a modern, responsive front-end for PMI's Agile certification content, aligning with their evolving brand.",
    primaryLink: "https://www.pmi.org",
    heroImageId: "hero-pmi",
  },

  // Tanger temporarily hidden

  // Coke
  {
    id: "coca-cola-creative-technology",
    slug: "coca-cola-creative-technology",
    clientLabel: "Coca-Cola",
    projectTitle: "Coca-Cola Creative Technology Prototyping",
    role: "Creative Technologist / Front-End Engineer",
    summary:
      "Prototyped AI-powered retail experiences, including an AI-enabled vending machine concept for Coca-Cola.",
    heroImageId: "hero-coke",
  },

  // Confidential real estate client
  {
    id: "confidential-real-estate",
    slug: "real-estate-platform",
    clientLabel: "Confidential Real Estate Client",
    projectTitle: "Real Estate Platform (Confidential)",
    role: "Front-End Engineer / Technologist",
    summary:
      "Helped design and implement a modern real estate experience; details are anonymized due to client confidentiality.",
    heroImageId: "hero-real-estate",
  },

  // This RAG portfolio itself
  {
    id: "pfaff-designs",
    slug: "pfaff-designs",
    clientLabel: "Self-Initiated",
    projectTitle: "Generative-UI RAG Portfolio",
    role: "Applied AI Engineer / Front-End Engineer",
    summary:
      "Built a generative-UI portfolio using RAG, multi-agent orchestration, and deterministic layout rendering for recruiters.",
    heroImageId: "hero-pfaff-designs",
  },
];

/**
 * Get project metadata by ID
 */
export function getProjectById(id: ProjectId): ProjectMeta | undefined {
  return PROJECTS.find((p) => p.id === id);
}

/**
 * Get project metadata by slug
 */
export function getProjectBySlug(slug: string): ProjectMeta | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}

/**
 * Get all projects
 */
export function getAllProjects(): ProjectMeta[] {
  return PROJECTS;
}

