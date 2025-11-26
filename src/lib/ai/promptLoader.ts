import { ChatPromptTemplate } from "@langchain/core/prompts";
import { BaseMessage, SystemMessage, HumanMessage } from "@langchain/core/messages";
import { langsmithClient } from "./client";

const PROMPT_NAME = "pfaff-copywriter-answer-blocks-v3";
const LANGSMITH_PROMPT_ID = PROMPT_NAME; // Keep for backward compatibility

/**
 * Pull prompt from LangSmith (fallback disabled)
 * Returns the template and source indicator
 * 
 * Throws an error if LangSmith is not available or fails to load the prompt.
 * Fallback prompt is temporarily disabled.
 */
export async function getCopywriterPromptTemplate(): Promise<{
  template: ChatPromptTemplate;
  source: "langsmith";
}> {

  
  // Check if LangSmith is configured
  if (!langsmithClient || !process.env.LANGSMITH_API_KEY) {
    const errorMsg = `[PromptLoader] ❌ Copywriter prompt requires LangSmith; fallback prompt is temporarily disabled. LANGSMITH_API_KEY is not set.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    console.log(`[PromptLoader] Attempting to load prompt: ${PROMPT_NAME}`);
    
    // Use pullPromptCommit (TypeScript SDK equivalent of Python's pull_prompt)
    const promptCommit = await langsmithClient.pullPromptCommit(PROMPT_NAME, {
      includeModel: false,
    });
    
    // The prompt data is in the manifest
    const manifest = promptCommit?.manifest;
    const promptData = manifest || promptCommit;

    console.log(
      "[PromptLoader] Raw manifest:",
      JSON.stringify(manifest, null, 2)
    );

    console.log(`[PromptLoader] Prompt data received:`, {
      hasData: !!promptData,
      dataKeys: promptData ? Object.keys(promptData) : [],
      hasMessages: !!promptData?.messages,
      messagesIsArray: Array.isArray(promptData?.messages),
    });

    if (!promptData) {
      const errorMsg = `[PromptLoader] ❌ Failed to load LangSmith prompt; fallback disabled: No prompt data returned for ${LANGSMITH_PROMPT_ID}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Try to extract messages from prompt data
    // LangChain prompts stored in LangSmith can be in different formats
    let messages: any[] | undefined;
    
    // Format 1: LangChain serialized format (lc: 1, type: "constructor", id: ["langchain", "prompts", "chat", "ChatPromptTemplate"])
    if (promptData.lc === 1 && 
        promptData.type === "constructor" && 
        Array.isArray(promptData.id) &&
        promptData.id[0] === "langchain" &&
        promptData.id[1] === "prompts" &&
        promptData.id[2] === "chat" &&
        promptData.id[3] === "ChatPromptTemplate" &&
        promptData.kwargs?.messages &&
        Array.isArray(promptData.kwargs.messages)) {
      const extractedMessages = promptData.kwargs.messages;
      messages = extractedMessages;
      console.log(`[PromptLoader] Detected LangChain serialized format, extracted ${extractedMessages.length} messages from kwargs`);
    }
    // Format 2: Direct messages array
    else if (Array.isArray(promptData.messages)) {
      messages = promptData.messages;
    }
    // Format 3: Nested in manifest
    else if (promptData.manifest?.messages && Array.isArray(promptData.manifest.messages)) {
      messages = promptData.manifest.messages;
    }
    // Format 4: Direct prompt object
    else if (promptData._type === "prompt" && Array.isArray(promptData.messages)) {
      messages = promptData.messages;
    }
    
    if (messages && messages.length > 0) {
      console.log(`[PromptLoader] ✅ Successfully loaded LangSmith prompt: ${LANGSMITH_PROMPT_ID} (${messages.length} messages)`);
      
      try {
        // Deserialize messages if they're in LangChain serialized format
        // Check if first message is serialized (has 'lc' property)
        const needsDeserialization = messages.length > 0 && 
          typeof messages[0] === 'object' && 
          messages[0] !== null && 
          'lc' in messages[0];
        
        let deserializedMessages: BaseMessage[];
        
        if (needsDeserialization) {
          console.log(`[PromptLoader] Messages are in serialized format, deserializing manually...`);
          // Manually deserialize messages from LangChain serialized format
          deserializedMessages = messages.map((msg: any) => {
            if (!msg.id || !Array.isArray(msg.id) || msg.id.length < 3) {
              throw new Error(`Invalid serialized message format: missing or invalid 'id' array`);
            }
            
            const messageType = msg.id[msg.id.length - 1]; // Last element is the message type
            
            // Reconstruct message based on type
            switch (messageType) {
              case 'SystemMessage':
                return new SystemMessage(msg.kwargs?.content || '');
              case 'HumanMessage':
                return new HumanMessage(msg.kwargs?.content || '');
              case 'HumanMessagePromptTemplate': {
                // HumanMessagePromptTemplate stores content in prompt.kwargs.template
                const template = msg.kwargs?.prompt?.kwargs?.template;
                if (!template) {
                  console.warn("[PromptLoader] HumanMessagePromptTemplate without template; falling back to empty string.", msg);
                }
                return new HumanMessage(template || "");
              }
              case 'AIMessage':
                const { AIMessage } = require("@langchain/core/messages");
                return new AIMessage(msg.kwargs?.content || '');
              default:
                // Fallback: try to create a HumanMessage
                console.warn(`[PromptLoader] Unknown message type: ${messageType}, defaulting to HumanMessage`);
                return new HumanMessage(msg.kwargs?.content || '');
            }
          });
        } else {
          // Messages are already deserialized
          deserializedMessages = messages as BaseMessage[];
        }
        
        const template = ChatPromptTemplate.fromMessages(deserializedMessages);
        return {
          template,
          source: "langsmith" as const,
        };
      } catch (templateError) {
        console.error(`[PromptLoader] ❌ Failed to create ChatPromptTemplate from messages:`, templateError);
        console.error(`[PromptLoader] First message structure:`, JSON.stringify(messages[0], null, 2).substring(0, 500));
        throw new Error(`Failed to create ChatPromptTemplate: ${templateError instanceof Error ? templateError.message : String(templateError)}`);
      }
    }

    // Check if the data looks like a Runnable (e.g., "RunnableSequence") instead of a prompt template
    if (promptData._type === "RunnableSequence" || promptData._type === "Runnable" || 
        (typeof promptData === "object" && "runnable" in promptData)) {
      const errorMsg = `[PromptLoader] ❌ Failed to load LangSmith prompt; fallback disabled: Prompt data for ${LANGSMITH_PROMPT_ID} appears to be a Runnable/chain, not a prompt template. Expected ChatPromptTemplate structure.`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    // If we can't find messages, log the full structure for debugging
    const errorMsg = `[PromptLoader] ❌ Failed to load LangSmith prompt; fallback disabled: Prompt data for ${LANGSMITH_PROMPT_ID} does not contain valid messages. Data structure: ${JSON.stringify(Object.keys(promptData))}. Full data (truncated): ${JSON.stringify(promptData, null, 2).substring(0, 1000)}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  } catch (error) {
    // Log the original error with full details
    const originalError = error instanceof Error ? error.message : String(error);
    const errorMsg = `[PromptLoader] ❌ Failed to load LangSmith prompt; fallback disabled: ${originalError}`;
    console.error(errorMsg);
    if (error instanceof Error && error.stack) {
      console.error("[PromptLoader] Error stack:", error.stack);
    }
    
    // Throw a new error with clear message
    throw new Error(`[PromptLoader] ❌ Copywriter prompt requires LangSmith; fallback prompt is temporarily disabled. Original error: ${originalError}`);
  }
}

/**
 * Fallback copywriter prompt template (used when LangSmith prompt is unavailable)
 */
export function getFallbackCopywriterPromptTemplate() {
  const system = `
You are the Copywriter Agent for a design-minded engineer’s portfolio.

Your job:
- Read the user's question.
- Read the provided project context and short facts.
- Generate clear, concise, recruiter-friendly content.

You are NOT designing layouts or choosing components.
You are ONLY generating structured content that will be rendered by another system.

--------------------------------------------------
AUDIENCE & GOALS
--------------------------------------------------

Audience:
- Recruiters, hiring managers, and tech leads who skim quickly.

Goals:
- Provide the most concise, truthful, and scannable explanation of the user's work.
- Highlight role, actions, tools, and impact where relevant.
- Use **bold** formatting inside the body string for key phrases and skills.
- Never invent companies, roles, dates, or metrics that do not appear in the context or project facts.
- If information is missing, keep the answer short rather than guessing.

Tone:
- Clear, confident, warm, and professional.
- No fluff, no hype language, no buzzword soup.

--------------------------------------------------
INPUTS YOU RECEIVE
--------------------------------------------------

You receive the following variables:

- question:
  The user's natural-language question.

- context:
  A short string combining:
  - project hero summary,
  - role summary,
  - and relevant long-form content.

- project_short_facts:
  A JSON-style text string with structured project details:
  - client
  - projectNameOrUrl
  - role
  - description
  - yearOrTimeline
  - team
  - keyOutcomes
  - keySkills

- project_id:
  Optional identifier for the project (may be empty).

- global_style_guide:
  Optional high-level style/tone guidance.

Use ONLY these sources for facts.
If something is not present, do not assume it.

--------------------------------------------------
QUESTION CLASSIFICATION
--------------------------------------------------

Classify the question as one of:

- "overview"
- "role"
- "tools"
- "process"
- "impact"
- "comparison"
- "general"

This is metadata only.

--------------------------------------------------
WHAT TO WRITE
--------------------------------------------------

You are generating a NEW standalone answer block (not rewriting existing content).

Rules:

1. Do NOT mention components, layout, or UI.
2. Do NOT talk about being an AI or a model.
3. Write a standalone, self-contained answer that would make sense if read on its own.
4. "heading" must be:
   - A short sentence or phrase capturing the key answer.
   - Preferably under 80 characters.
5. "body" must be:
   - 2 to 6 sentences.
   - A SINGLE JSON string value with NO literal newlines.
   - No bullet characters (such as "•" or "-" as list markers).
   - If you need to separate ideas, just use sentences separated by periods and spaces.
6. Use **bold** formatting inside "body" for key actions, tools, and outcomes.
7. Stay grounded in the provided context and project_short_facts.
8. If there is not enough information to fully answer, say so briefly and honestly.

--------------------------------------------------
OUTPUT FORMAT (STRICT JSON)
--------------------------------------------------

You MUST output a single valid JSON object with this structure:

{
  "answer_blocks": [
    {
      "type": "answer_block",
      "eyebrow": "Overview",  // or "Role", "Tools", "Impact", "Process", "Comparison", etc.
      "heading": "Short summary heading",
      "body": "Single-paragraph answer with **bold** phrases. No line breaks, no bullets.",
      "imageId": null
    }
  ],
  "question_type": "overview",  // or "role", "tools", "process", "impact", "comparison", "general"
  "focus_tags": ["optional", "short", "tags"]
}

CRITICAL JSON RULES:

- Output MUST be valid JSON.
- Use DOUBLE quotes for all keys and string values.
- Do NOT include any trailing commas.
- Do NOT wrap the JSON in markdown fences (no \`\`\`).
- Do NOT include any text before or after the JSON object.
- The "body" field MUST NOT contain literal newline characters.
  - It must be a single-line string from JSON's perspective.
- Do NOT use bullet characters like "•" or "-" at the start of lines inside "body".
- If you want to express a list, just write a normal sentence (e.g. "I did A, B, and C.").

--------------------------------------------------
NOW WRITE THE OUTPUT
--------------------------------------------------

Using the variables:
- question
- context
- project_short_facts
- project_id
- global_style_guide

1. Decide on the question_type.
2. Generate exactly ONE answer_block in the "answer_blocks" array.
3. Fill in eyebrow, heading, body, and image_id (usually null).
4. Return ONLY the JSON object, nothing else.
`;

  const human = `
QUESTION:
{question}

CONTEXT:
{context}

PROJECT FACTS (JSON TEXT):
{project_short_facts}

GLOBAL STYLE GUIDE:
{global_style_guide}

Remember:
- Return ONLY a single JSON object.
- "body" must be a single-line JSON string (no literal newlines, no bullets).
- Do not include markdown fences.
`;

  return ChatPromptTemplate.fromMessages([
    ["system", system],
    ["human", human],
  ]);
}