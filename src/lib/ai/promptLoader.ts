import { langsmithClient } from "./client";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import type { CopywriterInput } from "./copywriterSchemas";

/**
 * Get the copywriter prompt template from LangSmith or fallback to default
 * Prompt name: pfaff-copywriter-answer-blocks-v1
 */
export async function getCopywriterPromptTemplate(): Promise<ChatPromptTemplate> {
  // Try to load from LangSmith first
  if (langsmithClient && process.env.LANGSMITH_API_KEY) {
    try {
      // Use pullPromptCommit which returns the actual prompt content
      // PromptCommit has: { owner, repo, commit_hash, manifest, examples }
      // The actual prompt data is in the manifest property
      const promptCommit = await langsmithClient.pullPromptCommit("pfaff-copywriter-answer-blocks-v1", {
        includeModel: false,
      });
      
      // Extract the manifest which contains the prompt structure
      const manifest = promptCommit.manifest;
      
      if (!manifest) {
        console.warn("Prompt commit has no manifest, using fallback");
        return getFallbackPromptTemplate();
      }
      
      // The manifest can contain messages or template
      // Try to extract messages first (most common format)
      if (manifest.messages && Array.isArray(manifest.messages)) {
        try {
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
          return template;
        } catch (templateError: any) {
          console.error("❌ Error creating template from LangSmith messages:", templateError.message);
          console.error("Stack:", templateError.stack);
          console.error("This usually means the prompt has unescaped braces ({{ or }}).");
          console.error("Falling back to default prompt...");
          // Don't throw - return fallback instead
          return getFallbackPromptTemplate();
        }
      }
      
      // If it's a template string format
      if (manifest.template && typeof manifest.template === "string") {
        try {
          const template = ChatPromptTemplate.fromTemplate(manifest.template);
          return template;
        } catch (templateError: any) {
          console.error("❌ Error creating template from LangSmith template string:", templateError.message);
          console.error("This usually means the prompt has unescaped braces ({{ or }}).");
          console.error("Falling back to default prompt...");
          // Don't throw - return fallback instead
          return getFallbackPromptTemplate();
        }
      }
      
      // If manifest itself is a string (JSON), try to parse it
      if (typeof manifest === "string") {
        try {
          const parsed = JSON.parse(manifest);
          if (parsed.messages && Array.isArray(parsed.messages)) {
            try {
              const template = ChatPromptTemplate.fromMessages(
                parsed.messages.map((msg: any) => {
                  const role = msg.role || (msg.type === "system" ? "system" : "human");
                  const content = typeof msg.content === "string" ? msg.content : (msg.template || "");
                  return [role, content];
                })
              );
              return template;
            } catch (templateError: any) {
              console.error("❌ Error creating template from parsed JSON messages:", templateError.message);
              return getFallbackPromptTemplate();
            }
          }
          if (parsed.template) {
            try {
              const template = ChatPromptTemplate.fromTemplate(parsed.template);
              return template;
            } catch (templateError: any) {
              console.error("❌ Error creating template from parsed JSON template:", templateError.message);
              return getFallbackPromptTemplate();
            }
          }
        } catch (parseError) {
          // Not JSON, continue to fallback
        }
      }
      
      console.warn("LangSmith prompt format not recognized, using fallback");
      return getFallbackPromptTemplate();
    } catch (error: any) {
      console.warn("Failed to load prompt from LangSmith, using fallback:", error?.message || error);
      // Ensure we always return a valid template, never throw
      return getFallbackPromptTemplate();
    }
  }

  // Fallback to default prompt template
  return getFallbackPromptTemplate();
}

/**
 * Fallback prompt template for answer blocks generation
 * This is used when LangSmith prompt is not available
 */
export function getFallbackCopywriterPromptTemplate(): ChatPromptTemplate {
  return getFallbackPromptTemplate();
}

function getFallbackPromptTemplate(): ChatPromptTemplate {
  return ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are a copywriter for a design-minded engineer's portfolio.
Your goal is to produce recruiter-friendly, scannable content.

OUTPUT RULES
- You must output a single JSON object (not YAML, not markdown).
- Use ONLY the information in the provided context and project_short_facts.
- Do not invent projects, companies, or metrics.
- Output strictly valid JSON that matches this schema:

{{
  "answer_blocks": [
    {{
      "type": "answer_block",
      "eyebrow": "Overview" | "Role" | "Tools" | "Impact" | "Process" | "Comparison" | etc.,
      "heading": "one sentence that directly answers the user's question",
      "body": "1-3 short paragraphs or bullet points, using **bold** formatting sparingly to highlight key phrases",
      "image_id": "optional string matching a known image ID when relevant"
    }}
  ],
  "question_type": "overview" | "role" | "tools" | "process" | "impact" | "comparison" | "general" (optional),
  "focus_tags": ["tag1", "tag2"] (optional array of short tags)
}}

BEHAVIOR
- Always produce at least 1 and at most 3 answer_blocks.
- The first answer_block should almost always have eyebrow "Overview" for high-level questions, or a more specific label (e.g. "Role") for role-focused questions.
- Use heading for the main takeaway; do not exceed one sentence.
- Keep body content tight and focused on: what was done, why it mattered, how it was done (surface-level).
- Do not discuss the prompt format or schema in the output.
- Do not include any commentary or explanation outside the JSON object.

QUESTION TYPE DETECTION
- If question is about a specific project → question_type = "overview"
- If "What was your role on X?" → question_type = "role"
- If "What tools did you use on X?" → question_type = "tools"
- If "What impact did this have?" → question_type = "impact"
- If comparison question → question_type = "comparison"
- Otherwise → question_type = "general"

Output strictly valid JSON that matches the schema; no extra text before or after the JSON.`,
    ],
    [
      "user",
      `QUESTION: {question}

CONTEXT (from vector search):
{context}

PROJECT ID: {project_id}

PROJECT SHORT FACTS:
{project_short_facts}

GLOBAL STYLE GUIDE: {global_style_guide}

Now generate ONLY the JSON object matching the schema above. No markdown fences, no commentary, just valid JSON.`,
    ],
  ]);
}

