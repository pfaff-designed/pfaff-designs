import { anthropic } from "./client";
import type { KBData, ProjectFacts, ProjectLongform } from "@/lib/kb/loader";
import type { IntentResult } from "./intentResolver";

export interface CopywriterInput {
  userQuery: string;
  intent: IntentResult;
  kbData: KBData;
}

/**
 * Copywriter Agent
 * Transforms KB data into structured YAML for rendering
 * Must remain fully grounded in KB - no fabrication
 */
export const generateCopywriterYAML = async (input: CopywriterInput): Promise<string> => {
  const { userQuery, intent, kbData } = input;

  // Prepare KB context for the prompt
  const projectsContext = kbData.projects.map((project) => {
    const facts = project.facts;
    const longform = project.longform;
    return {
      id: facts.projectId,
      title: longform?.project?.title || facts.client,
      client: facts.client,
      role: facts.role,
      summary: facts.projectSummary,
      timeline: `${facts.timeline.year} - ${facts.timeline.duration}`,
      skills: facts.skillsUsed || [],
      problem: facts.problem?.summary || longform?.problem,
      solution: longform?.solution,
      process: longform?.process,
      outcomes: facts.outcomes || [],
      reflections: longform?.reflections,
      context: longform?.context,
    };
  });

  const identityContext = kbData.identity
    ? {
        headline: kbData.identity.headline,
        summary_short: kbData.identity.summary_short,
        summary_long: kbData.identity.summary_long,
        skills: kbData.identity.primary_skills || [],
        tools: kbData.identity.tools || [],
      }
    : null;

  // Prepare media context (metadata only - IDs, roles, alt text)
  // Copywriter references media by ID only, never by URL
  const mediaContext = kbData.media?.map((m) => ({
    id: m.id,
    project_slug: m.project_slug,
    type: m.type,
    role: m.role,
    alt: m.alt,
    caption: m.caption,
  })) || [];

  const prompt = `You are a Copywriter Agent for a portfolio website. Your job is to transform Knowledge Base (KB) data into structured YAML that will be rendered as a page.

CRITICAL RULES:
1. You MUST ONLY use the KB data provided below. Never invent, fabricate, or guess facts, metrics, dates, roles, or project details.
2. If information is missing from the KB, omit it or note it in the meta.missing field.
3. Reference media ONLY by ID (media IDs are provided below). NEVER use URLs directly.
4. Output ONLY valid YAML - no prose outside the YAML block.
5. Be concise, factual, and recruiter-friendly.
6. Organize content into canonical section types: context, problem, solution, process, outcome, reflections.
7. Follow the media selection rules and page-kind behaviors specified below.

YAML SCHEMA:
\`\`\`yaml
version: "1"
kind: "${intent.pageKind}"
query: "${userQuery}"
audience: "${intent.audience}"

meta:
  primary_project_slug: "<slug or null>"
  related_project_slugs: []
  focus: []
  missing: []

media:
  hero:
    id: "<media-id>" # optional, omit if none
  gallery: []
  inline: []

summary:
  title: "<page title>"
  one_liner: "<1-sentence summary>"
  elevator_pitch: >
    "<2-4 sentence overview>"

sections:
  - id: "context"
    type: "context"
    title: "Context"
    body: >
      "<narrative from KB>"
    key_points: []
    media: []

  - id: "problem"
    type: "problem"
    title: "Problem"
    body: >
      "<problem statement from KB>"
    key_points: []

  - id: "solution"
    type: "solution"
    title: "Solution"
    body: >
      "<solution from KB>"
    key_points: []
    metrics: []
    media: []

  - id: "process"
    type: "process"
    title: "Process"
    body: >
      "<process from KB>"
    media: []

  - id: "outcome"
    type: "outcome"
    title: "Outcomes"
    body: >
      "<outcomes from KB>"

  - id: "reflections"
    type: "reflections"
    title: "What I Learned"
    body: >
      "<reflections from KB>"
\`\`\`

KNOWLEDGE BASE DATA:

Projects:
${JSON.stringify(projectsContext, null, 2)}

Identity:
${identityContext ? JSON.stringify(identityContext, null, 2) : "No identity data available"}

Available Media (reference by ID only):
${mediaContext.length > 0 ? JSON.stringify(mediaContext, null, 2) : "No media available"}

User Query: "${userQuery}"
Intent: ${intent.intent}
Page Kind: ${intent.pageKind}
Audience: ${intent.audience}
${intent.topic?.projectSlug ? `Target Project: ${intent.topic.projectSlug}` : ""}

MEDIA SELECTION RULES (CRITICAL):
1. Hero Media (media.hero.id):
   - MUST prefer media with role: "hero"
   - If no hero role media exists, you may omit or use the most prominent media
   - Only assign ONE hero media ID

2. Inline Section Media (sections[].media[]):
   - Use media with matching project_slug for the section's project
   - Match media role to section type when possible (e.g., "step" role for process sections)
   - Only include media that is contextually relevant to the section content

3. Gallery Media (media.gallery[]):
   - Use ALL remaining media not assigned to hero or inline sections
   - Include media that doesn't fit into specific sections but is relevant to the page
   - Order gallery items logically (chronologically or by importance)

4. Media Assignment Priority:
   - First: Assign hero media (if available)
   - Second: Assign inline media to relevant sections
   - Third: Assign remaining media to gallery
   - Never assign the same media ID to multiple locations

PAGE-KIND BEHAVIORS:

Case Study (kind: "case_study"):
- Use canonical section order: context → problem → solution → process → outcome → reflections
- Include hero media if available (typically project hero image)
- Include inline media in relevant sections (e.g., process screenshots, solution mockups)
- Include gallery media showcasing project work
- Focus on one primary project if projectSlug is provided

Experience (kind: "experience"):
- Focus on roles, work history, and career progression
- May show role/company logos (use media with role: "hero" for company/project logos)
- Include timeline or chronological organization
- Emphasize responsibilities and achievements
- Include media that represents work artifacts or company branding

Skills (kind: "skills"):
- Focus on technical capabilities and tools
- Reference media representing tools, technologies, or artifacts
- Group related skills together
- Include projects that demonstrate specific skills
- Use media to illustrate skill applications (e.g., code snippets, tool interfaces)

Mixed (kind: "mixed"):
- Group content by related topic
- Organize media by topic/project clusters
- Balance multiple topics without favoring one
- Use hero media for the most prominent topic
- Distribute gallery media across topics

Overview (kind: "overview"):
- Provide high-level summary of identity and work
- Use identity data (headline, summary, skills)
- Include most prominent projects or achievements
- Use hero media for profile or main project
- Keep gallery minimal, focusing on key highlights

GENERAL INSTRUCTIONS:
- If intent is "project" and a projectSlug is provided, focus on that project
- If intent is "general" or "overview", use identity data and provide a high-level summary
- If intent is "skills", focus on skills and related projects
- If intent is "experience", focus on roles and work history
- Only include sections that have content in the KB
- Keep body text concise (2-4 sentences per section)
- Extract key points from responsibilities, goals, or outcomes
- For metrics, only include if explicitly stated in outcomes
- Never invent media IDs - only use IDs from the provided media list

Output ONLY the YAML, no markdown code fences, no explanation.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Anthropic");
    }

    let yamlText = content.text.trim();

    // Remove markdown code fences if present
    yamlText = yamlText.replace(/^```(?:yaml)?\s*/i, "").replace(/\s*```$/i, "");

    return yamlText;
  } catch (error) {
    console.error("Error generating copywriter YAML:", error);
    throw error;
  }
};

