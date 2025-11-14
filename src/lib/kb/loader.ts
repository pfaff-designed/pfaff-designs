import * as fs from "fs";
import * as path from "path";
import yaml from "js-yaml";

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
  const kbPath = path.join(process.cwd(), "knowledge-base");
  const projects: Array<{ facts: ProjectFacts; longform?: ProjectLongform }> = [];
  let identity: IdentityData | undefined;

  try {
    // Load identity data
    const identityPath = path.join(kbPath, "identity", "identity-short-form.JSON");
    if (fs.existsSync(identityPath)) {
      const identityContent = fs.readFileSync(identityPath, "utf-8");
      if (identityContent.trim()) {
        identity = JSON.parse(identityContent);
      }
    }

    // Load projects
    const projectsPath = path.join(kbPath, "projects");
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

