import { langsmithClient } from "./client";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import type { IntentResult } from "./intentResolver";
import type { KBData } from "@/lib/kb/loader";

interface PromptVariables {
  userQuery: string;
  intent: IntentResult;
  projectsContext: any;
  identityContext: any;
  mediaContext: any;
  ragContext?: string; // Optional RAG context from vector search
}

/**
 * Get the copywriter prompt template from LangSmith or fallback to default
 */
export async function getCopywriterPromptTemplate(): Promise<ChatPromptTemplate> {
  // Try to load from LangSmith first
  if (langsmithClient && process.env.LANGSMITH_API_KEY) {
    try {
      // Use pullPromptCommit which returns the actual prompt content
      // PromptCommit has: { owner, repo, commit_hash, manifest, examples }
      // The actual prompt data is in the manifest property
      const promptCommit = await langsmithClient.pullPromptCommit("copywriter-agent-prompt", {
        includeModel: false,
      });
      
      // Extract the manifest which contains the prompt structure
      const manifest = promptCommit.manifest;
      
      if (!manifest) {
        console.warn("Prompt commit has no manifest, using fallback");
        const fallback = getFallbackPromptTemplate();
        console.log("📝 Copywriter Prompt: Using FALLBACK prompt");
        return fallback;
      }
      
      // The manifest can contain messages or template
      // Try to extract messages first (most common format)
      if (manifest.messages && Array.isArray(manifest.messages)) {
        const template = ChatPromptTemplate.fromMessages(
          manifest.messages.map((msg: any) => {
            // Handle different message formats
            const role = msg.role || (msg.type === "system" ? "system" : "human");
            const content = typeof msg.content === "string" 
              ? msg.content 
              : (msg.template || "");
            return [role, content];
          })
        );
        console.log("📝 Copywriter Prompt: Loaded from LangSmith (messages format)");
        console.log("📝 Prompt messages:", manifest.messages.map((msg: any) => ({
          role: msg.role || msg.type,
          contentLength: typeof msg.content === "string" ? msg.content.length : 0,
          contentPreview: typeof msg.content === "string" ? msg.content.substring(0, 200) + "..." : "N/A"
        })));
        return template;
      }
      
      // If it's a template string format
      if (manifest.template && typeof manifest.template === "string") {
        const template = ChatPromptTemplate.fromTemplate(manifest.template);
        console.log("📝 Copywriter Prompt: Loaded from LangSmith (template format)");
        console.log("📝 Prompt template preview:", manifest.template.substring(0, 200) + "...");
        return template;
      }
      
      // If manifest itself is a string (JSON), try to parse it
      if (typeof manifest === "string") {
        try {
          const parsed = JSON.parse(manifest);
          if (parsed.messages && Array.isArray(parsed.messages)) {
            const template = ChatPromptTemplate.fromMessages(
              parsed.messages.map((msg: any) => {
                const role = msg.role || (msg.type === "system" ? "system" : "human");
                const content = typeof msg.content === "string" ? msg.content : (msg.template || "");
                return [role, content];
              })
            );
            console.log("📝 Copywriter Prompt: Loaded from LangSmith (parsed JSON messages)");
            return template;
          }
          if (parsed.template) {
            const template = ChatPromptTemplate.fromTemplate(parsed.template);
            console.log("📝 Copywriter Prompt: Loaded from LangSmith (parsed JSON template)");
            return template;
          }
        } catch (parseError) {
          // Not JSON, continue to fallback
        }
      }
      
      console.warn("LangSmith prompt format not recognized, using fallback");
    } catch (error) {
      console.warn("Failed to load prompt from LangSmith, using fallback:", error);
    }
  }

  // Fallback to default prompt template
  console.log("📝 Copywriter Prompt: Using FALLBACK prompt (LangSmith not available or failed)");
  const fallback = getFallbackPromptTemplate();
  // Log the fallback prompt structure
  console.log("📝 Fallback prompt structure:");
  try {
    const fallbackMessages = await fallback.formatMessages({
      userQuery: "[EXAMPLE]",
      intent: "[EXAMPLE]",
      pageKind: "[EXAMPLE]",
      audience: "[EXAMPLE]",
      projectSlug: "[EXAMPLE]",
      projects: "{}",
      identity: "{}",
      media: "{}",
    });
    fallbackMessages.forEach((msg, index) => {
      const content = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
      const preview = content.length > 500 ? content.substring(0, 500) + "..." : content;
      console.log(`  [${index}] ${msg.constructor.name}:`, preview);
    });
  } catch (error) {
    console.log("📝 (Could not format fallback prompt for preview)");
  }
  return fallback;
}

/**
 * Fallback prompt template (matches current hardcoded prompt structure)
 */
function getFallbackPromptTemplate(): ChatPromptTemplate {
  return ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are a Copywriter Agent for a portfolio website.
Your job is to transform knowledge base data into structured YAML that describes page content.

GOALS
- Stay fully grounded in the provided data.
- Produce recruiter-friendly, skimmable content.
- Use the schema below as a GUIDE, not strict boilerplate.

OUTPUT RULES (IMPORTANT)
1. Output ONLY valid YAML. No prose, explanations, or markdown fences.
2. Use ONLY the provided KB data. Never invent, fabricate, or guess.
3. Reference media ONLY by ID (e.g., id: "img-123"). Never use URLs.
4. If some information is missing, leave fields short or empty rather than inventing.
5. Keep the YAML compact and skimmable.
6. Always write in the first person.
7. Do not use passive voice.
8. Headlines should ALWAYS answer the user query.

STRUCTURE GUIDE (approximate):
- version: "1"
- kind: one of ["case_study", "overview", "skills", "experience", "mixed"] based on the intent.
- query: the original user query.
- audience: one of ["recruiter", "freelance_client", "unknown"].
- meta:
  - primary_project_slug: slug or null
  - related_project_slugs: list of slugs (can be empty)
  - focus: list of topic tags (skills, tools, themes)
  - missing: optional notes about missing data
- media:
  - hero: optional hero media {{ id }}
  - gallery: list of media {{ id }}
  - inline: list of inline media {{ id }}
- summary:
  - title: page title
  - one_liner: 1-sentence summary
  - elevator_pitch: 2–4 sentence overview (use | or > for multiline)
- answer_blocks: array of answer blocks (1-3 blocks)
  Each answer_block must have:
  - eyebrow: string (e.g., "Overview", "Role", "Tools", "Process", "Outcomes")
  - heading: string (one sentence directly answering the question)
  - body: string (crisp, skimmable text with **bold** key facts using markdown)
  - image_id: optional string (media ID if image should be included)
  
  Rules for answer_blocks:
  - Always return 1-3 answer_blocks
  - heading = one sentence directly answering the question
  - body = crisp, skimmable, use **bold** for key facts
  - No layout instructions
  - No extra keys beyond: eyebrow, heading, body, image_id

PAGE-KIND BEHAVIOR
- If intent.pageKind == "case_study":
  Generate 1-3 answer_blocks that directly answer the user's question about the case study.
  Focus on the most relevant aspects (overview, role, tools, process, outcomes, etc.).
  The hero section will be generated automatically from project facts (do not include it).
- If "overview":
  Generate 1-3 answer_blocks about identity (who Charles is, what he does) and recent flagship work.
- If "skills":
  Generate 1-3 answer_blocks organized by skill areas and tools from the data.
- If "experience":
  Generate 1-3 answer_blocks organized by roles / companies and highlight impact.

TRUTHFULNESS
- Use ONLY provided KB data below.
- Prefer omission or short text over guessing.
- Do NOT make up metrics, company names, or tools.`,
    ],
    [
      "user",
      `USER QUERY: {userQuery}

INTENT
- intent: {intent}
- pageKind: {pageKind}
- audience: {audience}
- topic.projectSlug: {projectSlug}

{ragContext}

PROJECTS DATA (already filtered for relevance):
{projects}

IDENTITY DATA:
{identity}

MEDIA DATA (IDs only, already filtered):
{media}

Now generate ONLY the YAML for this page in the structure described above. Remember:
- No markdown fences.
- No commentary.
- No prose before or after.
- Just the YAML document.`,
    ],
  ]);
}

/**
 * Format prompt variables for the template
 */
export function formatPromptVariables(variables: PromptVariables): Record<string, string> {
  // Format RAG context if provided
  const ragContextSection = variables.ragContext
    ? `RELEVANT CONTEXT (from vector search):\n${variables.ragContext}\n\n`
    : "";

  return {
    userQuery: variables.userQuery,
    intent: variables.intent.intent,
    pageKind: variables.intent.pageKind,
    audience: variables.intent.audience || "unknown",
    projectSlug: variables.intent.topic?.projectSlug || "general",
    ragContext: ragContextSection,
    projects: JSON.stringify(variables.projectsContext, null, 2),
    identity: JSON.stringify(variables.identityContext, null, 2),
    media: JSON.stringify(variables.mediaContext, null, 2),
  };
}

