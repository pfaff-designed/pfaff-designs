// Note: This file is server-only (uses Node.js fs)
// We don't import "server-only" here because it throws when imported in standalone scripts (tsx)
// The file is inherently server-only due to Node.js dependencies, so the protection is implicit

import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type {
  GlobalKB,
  GlobalSection,
  ProjectKBEntry,
  ProjectSection,
  ProjectSectionType,
} from "./types";

export interface ProjectFacts {
  version: number;
  kind: string;
  projectId: string;
  client: string;
  industry?: string;
  timeline: {
    year: number;
    duration: string;
  };
  role: string;
  team?: {
    company: string;
    collaborators: string[];
  };
  projectSummary: string;
  problem?: {
    summary: string;
  };
  goals?: string[];
  responsibilities?: string[];
  skillsUsed?: string[];
  outcomes?: string[];
  links?: Array<{ label: string; url: string }>;
}

/**
 * Hero facts for case study pages
 * Deterministic data extracted from project facts (no LLM generation)
 */
export interface CaseStudyHeroFacts {
  projectId: string;         // "capital-one-travel", "tanger-outlets", etc.
  client: string;            // "Capital One Travel"
  projectNameOrUrl: string; // "capitalonetravel.com" or "AI Vending Machine"
  role: string;              // "Design-minded Engineer / Front-end"
  description: string;       // short 1–2 sentence summary
  yearOrTimeline: string;    // "2023–2024" or "2023"
  team: string;              // e.g. "PM, Designer, Engineer, Client Stakeholders"
}

/**
 * Extract hero facts from ProjectFacts
 * This is a deterministic transformation (no LLM)
 */
export function extractHeroFacts(facts: ProjectFacts): CaseStudyHeroFacts {
  // Extract project name or URL from links, or derive from projectId
  let projectNameOrUrl = facts.projectId;
  if (facts.links && facts.links.length > 0) {
    const firstLink = facts.links[0];
    // Extract domain from URL (e.g., "https://capitalonetravel.com/" -> "capitalonetravel.com")
    if (firstLink.url) {
      try {
        const url = new URL(firstLink.url);
        projectNameOrUrl = url.hostname.replace(/^www\./, "");
      } catch {
        // If URL parsing fails, use the label or URL as-is
        projectNameOrUrl = firstLink.label || firstLink.url;
      }
    } else {
      projectNameOrUrl = firstLink.label || facts.projectId;
    }
  }

  // Format timeline
  const yearOrTimeline = facts.timeline.year.toString();

  // Format team
  let team = "";
  if (facts.team) {
    const teamParts: string[] = [];
    if (facts.team.company) {
      teamParts.push(facts.team.company);
    }
    if (facts.team.collaborators && facts.team.collaborators.length > 0) {
      teamParts.push(...facts.team.collaborators);
    }
    team = teamParts.join(", ");
  }

  return {
    projectId: facts.projectId,
    client: facts.client,
    projectNameOrUrl,
    role: facts.role,
    description: facts.projectSummary,
    yearOrTimeline,
    team: team || "Solo",
  };
}

export interface ProjectLongform {
  version: string;
  kind: string;
  project: {
    id: string;
    title: string;
    client: string;
    industry?: string;
    role: string;
  };
  context?: string;
  problem?: string;
  solution?: string;
  process?: string;
  outcomes?: string;
  reflections?: string;
  links?: Array<{ label: string; url: string }>;
}

export interface IdentityData {
  version?: number;
  kind?: string;
  headline?: string;
  summary_short?: string;
  summary_long?: string;
  primary_skills?: string[];
  tools?: string[];
  values?: string[];
  contact?: {
    email: string;
    website?: string;
  };
}

// ---------- Helper Functions ----------

const KB_ROOT = path.join(process.cwd(), "knowledge-base");

function loadYAML<T = any>(relativePath: string): T {
  const fullPath = path.join(KB_ROOT, relativePath);

  try {
    const raw = fs.readFileSync(fullPath, "utf8");
    const parsed = yaml.load(raw);
    if (!parsed) {
      throw new Error(`YAML file is empty or invalid: ${fullPath}`);
    }
    return parsed as T;
  } catch (err) {
    console.error(`[KB] Failed to load YAML: ${fullPath}`, err);
    throw err;
  }
}

function logKbWarning(message: string, extra?: unknown) {
  // eslint-disable-next-line no-console
  console.warn("[KB]", message, extra);
}

function logKbError(message: string, extra?: unknown) {
  // eslint-disable-next-line no-console
  console.error("[KB]", message, extra);
}

function loadJSON<T = any>(relativePath: string): T {
  const fullPath = path.join(KB_ROOT, relativePath);

  try {
    const raw = fs.readFileSync(fullPath, "utf8");
    const parsed = JSON.parse(raw) as T;
    return parsed;
  } catch (err) {
    console.error(`[KB] Failed to load JSON: ${fullPath}`, err);
    throw err;
  }
}

// ---------- Global / About ----------

/**
 * Load global About KB content
 * Normalizes about-global.yaml into a consistent GlobalKB shape
 */
// Removed legacy about-global loaders; use master-profile, skills, FAQ, and project YAML sources instead.

// ---------- Projects ----------

interface ProjectFiles {
  id: string;
  slug: string;
  client: string;
  title: string;
  longformPath: string;
  factsPath: string;
}

const PROJECTS: ProjectFiles[] = [
  // Tanger temporarily hidden
  {
    id: "coke",
    slug: "/work/coke",
    client: "Coca-Cola",
    title: "Coke – AI Vending Prototype",
    longformPath: "projects/coke/coke-long-form.yaml",
    factsPath: "projects/coke/coke-facts.json",
  },
  {
    id: "capital-one",
    slug: "/work/capital-one",
    client: "Capital One Travel",
    title: "Capital One Travel – Airport Lounges",
    longformPath: "projects/capital-one/capital-one-long-form.YAML",
    factsPath: "projects/capital-one/capital-one-short-form.JSON",
  },
  {
    id: "pmi",
    slug: "/work/pmi",
    client: "PMI",
    title: "PMI – Agile Certification Page",
    longformPath: "projects/pmi/pmi-longform.YAML",
    factsPath: "projects/pmi/pmi-shortform.JSON",
  },
  {
    id: "pfaff-designs",
    slug: "/work/pfaff-designs",
    client: "Self-initiated",
    title: "Generative-UI Portfolio",
    longformPath: "projects/pfaff-designs/pfaff-designs.yaml",
    factsPath: "projects/pfaff-designs/pfaff-designs.json",
  },
];

/**
 * Load all project KB entries
 * Normalizes all project case studies into a consistent ProjectKBEntry shape
 */
export function loadProjectsKB(): ProjectKBEntry[] {
  return PROJECTS.map((proj) => {
    try {
      const longform = loadYAML<any>(proj.longformPath);
      const facts = loadJSON<any>(proj.factsPath);

      const sections: ProjectSection[] = [];

      const push = (
        id: string,
        type: ProjectSectionType,
        title: string,
        body?: string,
        tags?: string[]
      ) => {
        if (!body || typeof body !== "string") return;
        sections.push({ id, type, title, body, tags });
      };

      // Longform narrative sections
      push("context", "context", "Context", longform.context, ["context", "overview"]);
      push("problem", "problem", "Problem", longform.problem, ["problem", "challenge"]);
      push("solution", "solution", "Solution", longform.solution, ["solution"]);
      push("process", "process", "Process", longform.process, ["process"]);
      push("outcomes", "outcomes", "Outcomes", longform.outcomes, ["outcomes", "impact", "results"]);
      push("reflections", "outcomes", "Reflections", longform.reflections, ["reflections"]);

      // Facts → structured sections
      if (facts && Array.isArray(facts.responsibilities)) {
        sections.push({
          id: "role",
          type: "role",
          title: "Role & Responsibilities",
          facts: {
            role: proj.title,
            responsibilities: facts.responsibilities,
          },
          tags: ["role", "responsibilities", "what I did"],
        });
      }

      if (facts && Array.isArray(facts.skillsUsed)) {
        sections.push({
          id: "tools",
          type: "tools",
          title: "Tools & Skills",
          facts: {
            skillsUsed: facts.skillsUsed,
          },
          tags: ["tools", "stack", "libraries", "tech", "skills"],
        });
      }

      if (facts && Array.isArray(facts.outcomes)) {
        sections.push({
          id: "outcomes_structured",
          type: "outcomes",
          title: "Outcomes (Structured)",
          facts: {
            outcomes: facts.outcomes,
          },
          tags: ["outcomes", "impact", "results"],
        });
      }

      // Extract one_liner from facts JSON or longform YAML
      const one_liner = facts?.one_liner ?? longform?.project?.one_liner ?? null;

      return {
        id: proj.id,
        slug: proj.slug,
        client: proj.client,
        title: proj.title,
        summary: facts?.projectSummary,
        one_liner,
        sections,
      };
    } catch (error) {
      console.error(`[KB] Failed to load project ${proj.id}:`, error);
      // Return empty project entry to allow other projects to load
      return {
        id: proj.id,
        slug: proj.slug,
        client: proj.client,
        title: proj.title,
        summary: undefined,
        one_liner: undefined,
        sections: [],
      };
    }
  });
}

export interface KBData {
  projects: Array<{
    facts: ProjectFacts;
    longform?: ProjectLongform;
  }>;
  identity?: IdentityData;
  media?: Array<{
    id: string;
    project_slug: string | null;
    type: "image" | "video";
    role: "hero" | "inline" | "gallery" | "step";
    alt: string;
    caption?: string | null;
  }>; // Media metadata (without URLs - Copywriter only needs IDs)
}

/**
 * Load Knowledge Base data from the knowledge-base folder
 * This reads from the local filesystem (for now, can be replaced with Supabase later)
 */
export const loadKnowledgeBase = async (): Promise<KBData> => {
  const projects: Array<{ facts: ProjectFacts; longform?: ProjectLongform }> = [];
  let identity: IdentityData | undefined;

  try {
    // Load identity data
    const identityPath = path.join(KB_ROOT, "identity", "identity-short-form.JSON");
    if (fs.existsSync(identityPath)) {
      const identityContent = fs.readFileSync(identityPath, "utf-8");
      if (identityContent.trim()) {
        identity = JSON.parse(identityContent);
      }
    }

    // Load projects
    const projectsPath = path.join(KB_ROOT, "projects");
    if (fs.existsSync(projectsPath)) {
      const projectDirs = fs.readdirSync(projectsPath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      for (const projectDir of projectDirs) {
        const projectPath = path.join(projectsPath, projectDir);

        // Load short-form (facts) - try multiple naming patterns
        const possibleFactsFiles = [
          `${projectDir}-short-form.JSON`,
          `${projectDir}-short-form.json`,
          `${projectDir}-shortform.JSON`,
          `${projectDir}-shortform.json`,
          `${projectDir}-facts.json`,
          `${projectDir}-facts.JSON`,
          "capital-one-short-form.JSON", // Handle capital-one naming
        ];

        let factsPath: string | null = null;
        for (const fileName of possibleFactsFiles) {
          const filePath = path.join(projectPath, fileName);
          if (fs.existsSync(filePath)) {
            factsPath = filePath;
            break;
          }
        }

        if (factsPath && fs.existsSync(factsPath)) {
          const factsContent = fs.readFileSync(factsPath, "utf-8");
          if (factsContent.trim()) {
            const facts: ProjectFacts = JSON.parse(factsContent);

            // Load long-form (narrative) if available
            const longFormFiles = fs.readdirSync(projectPath).filter((file) =>
              file.includes("long-form") || file.includes("longform")
            );
            let longform: ProjectLongform | undefined;

            if (longFormFiles.length > 0) {
              const longFormPath = path.join(projectPath, longFormFiles[0]);
              const longFormContent = fs.readFileSync(longFormPath, "utf-8");
              if (longFormContent.trim()) {
                try {
                  longform = yaml.load(longFormContent) as ProjectLongform;
                } catch (error) {
                  console.warn(`Failed to parse YAML for ${projectDir}:`, error);
                }
              }
            }

            projects.push({ facts, longform });
          }
        }
      }
    }
  } catch (error) {
    console.error("Error loading knowledge base:", error);
    throw error;
  }

  return { projects, identity };
};

/**
 * Load a single project YAML by projectId (e.g., "capital-one")
 * Returns the parsed YAML object or null if missing.
 */
export async function loadProjectById(projectId: string): Promise<any | null> {
  try {
    const relativePath = path.join("projects", `${projectId}.yaml`);
    const fullPath = path.join(KB_ROOT, relativePath);
    if (!fs.existsSync(fullPath)) {
      logKbWarning(`Project YAML not found: ${fullPath}`);
      return null;
    }
    return loadYAML<any>(relativePath);
  } catch (err) {
    logKbError(`Failed to load project by id: ${projectId}`, err);
    return null;
  }
}

/**
 * Load and format the master profile slice (career timeline + skills)
 * from the existing KB files.
 */
export function formatProfileSlice(): string {
  try {
    const masterProfile = loadYAML<any>("master-profile.yaml");
    const parts: string[] = [];

    if (masterProfile?.identity?.one_liner) {
      parts.push(masterProfile.identity.one_liner);
    }

    if (Array.isArray(masterProfile?.career_timeline)) {
      const timeline = masterProfile.career_timeline
        .slice(0, 4)
        .map((phase: any) => {
          const years = phase.years ? `${phase.years}: ` : "";
          return `${years}${phase.label ?? ""}`.trim();
        })
        .filter(Boolean);
      if (timeline.length) {
        parts.push("Career phases: " + timeline.join(" | "));
      }
    }

    // Skills from skills.yaml (secondary)
    try {
      const skills = loadYAML<any>("skills.yaml");
      const stack = skills?.engineering_skills?.frontend_stack;
      if (Array.isArray(stack) && stack.length) {
        parts.push("Core stack: " + stack.join(", "));
      }
      const aiSkills = skills?.ai_rag_skills?.rag_fundamentals;
      if (Array.isArray(aiSkills) && aiSkills.length) {
        parts.push("AI/RAG: " + aiSkills.join(", "));
      }
    } catch (skillErr) {
      logKbWarning("Missing or unreadable skills.yaml", skillErr);
    }

    return parts.join("\n");
  } catch (err) {
    logKbWarning("Failed to load master profile; returning empty profile slice", err);
    return "";
  }
}

/**
 * Load a compact FAQ slice (first 3–5 Q/As) for global context.
 */
export function loadFaqSlice(limit = 5): Array<{ q: string; a: string }> {
  try {
    const faq = loadYAML<any>("faq.yaml");
    const items = Array.isArray(faq?.faqs) ? faq.faqs : [];
    return items.slice(0, Math.max(0, limit)).map((item: any) => ({
      q: item.question ?? "",
      a: item.short_answer ?? item.long_answer ?? "",
    }));
  } catch (err) {
    logKbWarning("Failed to load FAQ slice", err);
    return [];
  }
}

/**
 * Load a concise project summary for context building.
 */
export function loadProjectSummary(projectId: string): string {
  try {
    const idMap: Record<string, string> = {
      "capital-one-travel": "capital-one",
      "coca-cola-creative-technology": "coca-cola",
      "pfaff-designs": "pfaff-design",
      "pmi-agile": "pmi",
      "pmi-acp": "pmi",
      "pmi": "pmi",
      "tanger-outlets": "tanger",
      "real-estate-platform": "mcWhinney",
    };

    const normalizedId = idMap[projectId] ?? projectId;

    const proj = loadYAML<any>(path.join("projects", `${normalizedId}.yaml`));
    if (!proj) return "";

    const parts: string[] = [];
    const slug = proj.project_slug ?? projectId;
    const name = proj.project_name ?? proj.title ?? slug;
    const client = proj.client_name;
    const roleTitle = proj.role?.title;
    const roleLevel = proj.role?.level;
    const timeline = proj.timeline;
    const visibility = proj.visibility;

    parts.push(`${name}${client ? ` for ${client}` : ""}`);
    if (timeline) parts.push(`Timeline: ${timeline}`);
    if (roleTitle) parts.push(`Role: ${roleTitle}${roleLevel ? ` (${roleLevel})` : ""}`);
    if (visibility) parts.push(`Visibility: ${visibility}`);

    if (Array.isArray(proj.responsibilities)) {
      const top = proj.responsibilities.slice(0, 3);
      if (top.length) {
        parts.push(`Responsibilities: ${top.join("; ")}`);
      }
    }

    const tools =
      proj.tools_used ??
      proj.skills_used ??
      proj.tools ??
      proj.skills ??
      [];
    if (Array.isArray(tools) && tools.length) {
      const uniqueTools = Array.from(new Set(tools.map(String)));
      parts.push(`Tools: ${uniqueTools.join(", ")}`);
    }

    if (proj.impact?.summary) {
      parts.push(`Impact: ${proj.impact.summary}`);
    }

    if (Array.isArray(proj.strengths_demonstrated) && proj.strengths_demonstrated.length) {
      parts.push(`Strengths: ${proj.strengths_demonstrated.slice(0, 3).join("; ")}`);
    }

    return parts.join("\n");
  } catch (err) {
    logKbWarning(`Failed to load project summary for ${projectId}`, err);
    return "";
  }
}

/**
 * Get project by slug/ID
 */
export const getProjectBySlug = async (slug: string): Promise<{ facts: ProjectFacts; longform?: ProjectLongform } | null> => {
  const kb = await loadKnowledgeBase();
  const project = kb.projects.find(
    (p) => p.facts.projectId === slug || p.facts.projectId.replace(/-/g, "_") === slug
  );
  return project || null;
};

/**
 * Get all projects
 */
export const getAllProjects = async (): Promise<Array<{ facts: ProjectFacts; longform?: ProjectLongform }>> => {
  const kb = await loadKnowledgeBase();
  return kb.projects;
};

