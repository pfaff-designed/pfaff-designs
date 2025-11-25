// src/lib/kb/types.ts
export type ProjectSectionType =
  | "overview"
  | "context"
  | "problem"
  | "solution"
  | "process"
  | "outcomes"
  | "role"
  | "tools"
  | "skills"
  | "responsibilities"
  | "timeline"
  | "team"
  | "links";

export interface ProjectSection {
  id: string;                     // "tools", "role", "outcomes"
  type: ProjectSectionType;
  title: string;
  body?: string;                  // longform prose from YAML
  facts?: Record<string, any>;    // skillsUsed, outcomes, responsibilities, etc.
  tags?: string[];                // ["tools", "stack", "libraries", "tech"]
}

export interface ProjectKBEntry {
  id: string;          // "tanger", "coke", "capital-one", "pmi", "pfaff-designs"
  slug: string;        // "/work/tanger"
  client: string;      // "Tanger", "Coca-Cola", "Capital One", etc.
  title: string;       // Case study title
  summary?: string;    // from projectSummary in JSON
  one_liner?: string;  // canonical short description from KB
  sections: ProjectSection[];
}

// Global / About types
export type GlobalSectionType =
  | "hero"
  | "background"
  | "approach"
  | "ai_approach"
  | "tools_global"
  | "collaboration"
  | "values"
  | "highlights"
  | "contact_teaser";

export interface GlobalSection {
  id: string;                // "ai_approach", "toolset", etc.
  type: GlobalSectionType;
  title: string;
  body?: string;
  tags?: string[];
  // extra structured fields (like values, tools, content) live in here
  content?: Record<string, any>;
  values?: { name: string; description: string }[];
  items?: { label: string; detail: string }[];
  tools?: Record<string, string[]>; // e.g. { frontend: [...], ai: [...] }
}

export interface GlobalKB {
  id: "about-global";
  slug: "/about";
  sections: GlobalSection[];
}