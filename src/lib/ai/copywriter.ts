import { anthropic } from "./client";
import type { CopywriterInput, CopywriterOutput } from "./copywriterSchemas";
import { CopywriterOutputSchema } from "./copywriterSchemas";
import { getCopywriterPromptTemplate, getFallbackCopywriterPromptTemplate } from "./promptLoader";

/**
 * In-memory cache for copywriter output.
 * Keyed by (question, projectId, context hash).
 */
const copywriterCache = new Map<string, CopywriterOutput>();

function makeCopywriterCacheKey(input: CopywriterInput): string {
  // Create a simple hash of the context to cache based on content
  const contextHash = input.context.substring(0, 100).replace(/\s/g, "");
  return JSON.stringify({
    question: input.question,
    projectId: input.projectId ?? null,
    contextHash,
  });
}

/**
 * Repair common JSON issues from LLM output
 */
function repairJSON(jsonText: string): string {
  let repaired = jsonText.trim();

  // Remove markdown code fences if present
  const codeBlockMatch = repaired.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch) {
    repaired = codeBlockMatch[1].trim();
  }

  // Remove any leading/trailing prose
  const jsonStart = repaired.indexOf("{");
  const jsonEnd = repaired.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    repaired = repaired.substring(jsonStart, jsonEnd + 1);
  }

  return repaired;
}

/**
 * Internal Copywriter Agent
 * Calls LangSmith-managed prompt and returns structured JSON
 */
const generateCopywriterOutputInternal = async (
  input: CopywriterInput
): Promise<CopywriterOutput> => {
  const { question, context, projectId, projectShortFacts } = input;

  // Load prompt template from LangSmith (with fallback)
  let promptTemplate;
  try {
    promptTemplate = await getCopywriterPromptTemplate();
  } catch (error: any) {
    console.error("❌ Error loading template, using fallback:", error.message);
    promptTemplate = getFallbackCopywriterPromptTemplate();
  }

  // Format variables for the template
  // Convert null to empty string to avoid template issues
  const variables = {
    question,
    context,
    project_id: projectId ?? "",
    project_short_facts: JSON.stringify(projectShortFacts ?? {}),
    global_style_guide:
      "Tone: warm, confident, concise. Audience: recruiters and hiring managers.",
  };

  // Format the prompt with variables
  let formattedMessages;
  try {
    formattedMessages = await promptTemplate.formatMessages(variables);
  } catch (error: any) {
    // If template formatting fails (e.g., "Single '}' in template"), 
    // it's likely an issue with the LangSmith prompt template having unescaped braces
    console.error("❌ Template formatting error:", error.message);
    console.error("Error type:", error.constructor.name);
    console.error("Stack:", error.stack);
    console.error("Variables being passed:", {
      question: variables.question.substring(0, 100),
      context: variables.context.substring(0, 100),
      project_id: variables.project_id,
      project_short_facts: variables.project_short_facts.substring(0, 200),
    });
    console.error("Falling back to default prompt...");
    // Fallback to default prompt (bypasses LangSmith)
    try {
      const fallbackTemplate = getFallbackCopywriterPromptTemplate();
      formattedMessages = await fallbackTemplate.formatMessages(variables);
    } catch (fallbackError: any) {
      console.error("❌ Even fallback template failed:", fallbackError.message);
      // Last resort: create a simple prompt manually
      formattedMessages = [
        {
          constructor: { name: "SystemMessage" },
          content: "You are a copywriter. Output JSON with answer_blocks array.",
        },
        {
          constructor: { name: "HumanMessage" },
          content: `Question: ${variables.question}\n\nContext: ${variables.context}\n\nGenerate JSON answer_blocks.`,
        },
      ];
    }
  }
  
  // Combine system and user messages into a single user message for Anthropic
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
    console.time("copywriter-haiku");
    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: combinedPrompt,
        },
      ],
    });
    console.timeEnd("copywriter-haiku");

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Anthropic");
    }

    // Extract and repair JSON
    let rawJson = content.text.trim();
    rawJson = repairJSON(rawJson);

    // Parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch (parseError) {
      console.error("Failed to parse copywriter JSON:", {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        rawPreview: rawJson.substring(0, 500),
      });
      throw new Error("COPYWRITER_INVALID_JSON");
    }

    // Validate with Zod schema
    const result = CopywriterOutputSchema.safeParse(parsed);

    if (!result.success) {
      console.error("Copywriter output failed validation:", {
        errors: result.error.issues,
        parsedPreview: JSON.stringify(parsed, null, 2).substring(0, 1000),
      });
      throw new Error("COPYWRITER_SCHEMA_VALIDATION_FAILED");
    }

    return result.data;
  } catch (error) {
    console.error("Error generating copywriter output:", error);
    throw error;
  }
};

/**
 * Public Copywriter API with in-memory caching.
 * Returns structured CopywriterOutput (answer_blocks + optional metadata)
 */
export const runCopywriter = async (
  input: CopywriterInput
): Promise<CopywriterOutput> => {
  const cacheKey = makeCopywriterCacheKey(input);

  const cached = copywriterCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const output = await generateCopywriterOutputInternal(input);
  copywriterCache.set(cacheKey, output);
  return output;
};

// Re-export types for convenience
export type { CopywriterInput, CopywriterOutput } from "./copywriterSchemas";
