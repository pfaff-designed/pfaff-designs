import { anthropic } from "./client";
import type { KBData } from "@/lib/kb/loader";
import type { IntentResult } from "./intentResolver";
import * as yaml from "js-yaml";
import {
  getCopywriterPromptTemplate,
  formatPromptVariables,
} from "./promptLoader";

export interface CopywriterInput {
  userQuery: string;
  intent: IntentResult;
  kbData: KBData;
  ragContext?: string; // Optional RAG context from vector search
}

/**
 * Fix duplicate "sections:" keys in YAML by merging them.
 * This is a lightweight, defensive repair for a known model quirk.
 */
function fixDuplicateSectionsKey(yamlText: string): string {
  const sectionsPattern = /^(\s{0,2})sections:\s*$/gm;
  const matches = Array.from(yamlText.matchAll(sectionsPattern));

  if (!matches || matches.length <= 1) {
    return yamlText;
  }

  const lines = yamlText.split("\n");
  const result: string[] = [];
  let seenSections = false;
  let collectingSections = false;
  const allSections: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    const isSectionsKey =
      trimmed === "sections:" && line.match(/^\s{0,2}sections:\s*$/);

    if (isSectionsKey) {
      if (!seenSections) {
        result.push(line);
        seenSections = true;
        collectingSections = true;
      } else {
        console.warn(`Skipping duplicate "sections:" key at line ${i + 1}`);
        collectingSections = true;
      }
    } else if (collectingSections) {
      const isTopLevelKey =
        trimmed &&
        trimmed.match(/^[a-z_][a-z0-9_]*:\s*$/i) &&
        (line.startsWith(trimmed) || line.match(/^\s{0,2}[a-z_]/i));

      if (isTopLevelKey && trimmed !== "sections:") {
        collectingSections = false;
        if (allSections.length > 0) {
          result.push(...allSections);
          allSections.length = 0;
        }
        result.push(line);
      } else if (trimmed === "" && i < lines.length - 1) {
        const nextLine = lines[i + 1]?.trim() || "";
        if (
          nextLine.match(/^[a-z_][a-z0-9_]*:\s*$/i) &&
          nextLine !== "sections:"
        ) {
          collectingSections = false;
          if (allSections.length > 0) {
            result.push(...allSections);
            allSections.length = 0;
          }
          result.push(line);
        } else {
          allSections.push(line);
        }
      } else {
        allSections.push(line);
      }
    } else {
      result.push(line);
    }
  }

  if (allSections.length > 0) {
    result.push(...allSections);
  }

  const repairedText = result.join("\n");

  try {
    yaml.load(repairedText);
    return repairedText;
  } catch {
    return repairedText;
  }
}

/**
 * In-memory cache for copywriter YAML.
 * Keyed by (pageKind, intent, projectSlug, audience).
 * NOTE: userQuery is intentionally NOT part of the key so different phrasings reuse the same YAML.
 */
const copywriterCache = new Map<string, string>();

function makeCopywriterCacheKey(input: CopywriterInput): string {
  const { intent } = input;
  return JSON.stringify({
    kind: intent.pageKind,
    intent: intent.intent,
    projectSlug: intent.topic?.projectSlug ?? null,
    audience: intent.audience ?? "unknown",
  });
}

/**
 * Select a small, relevant slice of the KB to keep prompts lean and fast.
 */
function buildProjectsContext(kbData: KBData, intent: IntentResult) {
  const allProjects = kbData.projects || [];

  let selected = allProjects;

  if (intent.topic?.projectSlug) {
    selected = allProjects.filter(
      (p) => p.facts.projectId === intent.topic!.projectSlug
    );
  } else {
    // For general queries, just send a couple of flagship projects
    selected = allProjects.slice(0, 3);
  }

  return selected.map((project) => {
    const facts = project.facts;
    const longform = project.longform;
    return {
      id: facts.projectId,
      title: longform?.project?.title || facts.client,
      client: facts.client,
      role: facts.role,
      summary: facts.projectSummary,
      timeline: facts.timeline
        ? `${facts.timeline.year} - ${facts.timeline.duration}`
        : null,
      skills: facts.skillsUsed || [],
      problem: facts.problem?.summary || longform?.problem,
      solution: longform?.solution,
      process: longform?.process,
      outcomes: facts.outcomes || [],
      reflections: longform?.reflections,
      context: longform?.context,
    };
  });
}

function buildIdentityContext(kbData: KBData) {
  if (!kbData.identity) return null;

  return {
    headline: kbData.identity.headline,
    summary_short: kbData.identity.summary_short,
    summary_long: kbData.identity.summary_long,
    skills: kbData.identity.primary_skills || [],
    tools: kbData.identity.tools || [],
  };
}

function buildMediaContext(kbData: KBData, intent: IntentResult) {
  const allMedia = kbData.media || [];

  if (!allMedia.length) return [];

  if (intent.topic?.projectSlug) {
    return allMedia
      .filter((m) => m.project_slug === intent.topic!.projectSlug)
      .map((m) => ({
        id: m.id,
        project_slug: m.project_slug,
        type: m.type,
        role: m.role,
        alt: m.alt,
        caption: m.caption,
      }));
  }

  // For general queries, cap media to avoid huge prompts
  return allMedia.slice(0, 20).map((m) => ({
    id: m.id,
    project_slug: m.project_slug,
    type: m.type,
    role: m.role,
    alt: m.alt,
    caption: m.caption,
  }));
}

/**
 * Internal Copywriter Agent
 * — Calls Anthropic
 * — Builds prompt from KB
 * — Repairs YAML
 */
const generateCopywriterYAMLInternal = async (
  input: CopywriterInput
): Promise<string> => {
  const { userQuery, intent, kbData, ragContext } = input;

  const projectsContext = buildProjectsContext(kbData, intent);
  const identityContext = buildIdentityContext(kbData);
  const mediaContext = buildMediaContext(kbData, intent);

  // Load prompt template from LangSmith (with fallback)
  const promptTemplate = await getCopywriterPromptTemplate();
  
  // Format variables for the template
  const variables = formatPromptVariables({
    userQuery,
    intent,
    projectsContext,
    identityContext,
    mediaContext,
    ragContext,
  });

  // Format the prompt with variables
  const formattedMessages = await promptTemplate.formatMessages(variables);
  
  // Combine system and user messages into a single user message for Anthropic
  // (Anthropic doesn't have a separate system role, so we combine them)
  const systemParts: string[] = [];
  const userParts: string[] = [];
  
  for (const msg of formattedMessages) {
    const msgType = msg.constructor.name;
    const content = typeof msg.content === "string" 
      ? msg.content 
      : JSON.stringify(msg.content);
    
    if (msgType === "SystemMessage" || msgType.includes("System")) {
      systemParts.push(content);
    } else if (msgType === "HumanMessage" || msgType.includes("Human")) {
      userParts.push(content);
    }
  }

  const systemContent = systemParts.join("\n\n");
  const userContent = userParts.join("\n\n");

  const combinedPrompt = systemContent 
    ? `${systemContent}\n\n${userContent}`
    : userContent;

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: combinedPrompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Anthropic");
    }

    // Model has been instructed not to use fences, but be defensive in case it does.
    let yamlText = content.text.trim();
    const yamlBlockMatch = yamlText.match(/```(?:yaml)?\s*([\s\S]*?)```/i);
    if (yamlBlockMatch) {
      yamlText = yamlBlockMatch[1].trim();
    }

    // Fix duplicate sections keys if present
    yamlText = fixDuplicateSectionsKey(yamlText);

    // Validate YAML can be parsed (fail fast for debugging)
    try {
      yaml.load(yamlText);
    } catch (yamlError: any) {
      console.error("Copywriter generated invalid YAML:", {
        error: yamlError.message,
        line: yamlError.mark?.line,
        column: yamlError.mark?.column,
        snippet: yamlText
          .split("\n")
          .slice(
            Math.max(0, (yamlError.mark?.line || 0) - 2),
            (yamlError.mark?.line || 0) + 3
          )
          .join("\n"),
      });
      throw new Error(
        `Failed to generate valid YAML: ${yamlError.message}. Snippet: ${yamlText.substring(
          0,
          400
        )}`
      );
    }

    return yamlText;
  } catch (error) {
    console.error("Error generating copywriter YAML:", error);
    throw error;
  }
};

/**
 * Public Copywriter API with in-memory caching.
 */
export const generateCopywriterYAML = async (
  input: CopywriterInput
): Promise<string> => {
  const cacheKey = makeCopywriterCacheKey(input);

  const cached = copywriterCache.get(cacheKey);
  if (cached) {
    console.log("Copywriter cache HIT:", cacheKey);
    return cached;
  }

  console.log("Copywriter cache MISS:", cacheKey);
  const yamlText = await generateCopywriterYAMLInternal(input);
  copywriterCache.set(cacheKey, yamlText);
  return yamlText;
};