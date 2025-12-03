import { ChatPromptTemplate } from "@langchain/core/prompts";
import { BaseMessage, SystemMessage, HumanMessage } from "@langchain/core/messages";
import { langsmithClient } from "./client";

const PROMPT_NAME = "pfaff-copywriter-answer-blocks-v3";
const MODAL_GRAPH_PROMPT_NAME = "pfaff-modal-graph-generate-answer";
const LANGSMITH_PROMPT_ID = PROMPT_NAME; // Keep for backward compatibility

/**
 * Pull prompt from LangSmith with fallback support
 * Returns the template and source indicator ("langsmith" or "fallback")
 * 
 * Uses comprehensive fallback prompt when LangSmith is unavailable or fails to load.
 */
export async function getCopywriterPromptTemplate(): Promise<{
  template: ChatPromptTemplate;
  source: "langsmith" | "fallback";
}> {

  
  // Check if LangSmith is configured
  if (!langsmithClient || !process.env.LANGSMITH_API_KEY) {
    console.warn("[PromptLoader] LangSmith not configured, using fallback copywriter prompt");
    return {
      template: getFallbackCopywriterPromptTemplate(),
      source: "fallback" as const,
    };
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
      console.warn(`[PromptLoader] ⚠️ No prompt data returned for ${LANGSMITH_PROMPT_ID}, using fallback`);
      return {
        template: getFallbackCopywriterPromptTemplate(),
        source: "fallback" as const,
      };
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
        console.log(`[PromptLoader] ✅ Successfully loaded LangSmith prompt: ${PROMPT_NAME}`);
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
      console.warn(`[PromptLoader] ⚠️ Prompt data for ${LANGSMITH_PROMPT_ID} appears to be a Runnable/chain, not a prompt template. Using fallback.`);
      return {
        template: getFallbackCopywriterPromptTemplate(),
        source: "fallback" as const,
      };
    }

    // If we can't find messages, log the full structure for debugging and use fallback
    console.warn(`[PromptLoader] ⚠️ Failed to load LangSmith prompt; using fallback: Prompt data for ${LANGSMITH_PROMPT_ID} does not contain valid messages. Data structure: ${JSON.stringify(Object.keys(promptData))}`);
    console.warn("[PromptLoader] Falling back to hardcoded prompt template");
    return {
      template: getFallbackCopywriterPromptTemplate(),
      source: "fallback" as const,
    };
  } catch (error) {
    // Log the original error with full details and use fallback
    const originalError = error instanceof Error ? error.message : String(error);
    console.warn(`[PromptLoader] ⚠️ Failed to load LangSmith prompt; using fallback: ${originalError}`);
    if (error instanceof Error && error.stack) {
      console.warn("[PromptLoader] Error stack:", error.stack);
    }
    
    // Return fallback instead of throwing
    console.warn("[PromptLoader] Falling back to hardcoded prompt template");
    return {
      template: getFallbackCopywriterPromptTemplate(),
      source: "fallback" as const,
    };
  }
}

/**
 * Fallback copywriter prompt template (used when LangSmith prompt is unavailable)
 * Uses the comprehensive copywriter system prompt from current-prompt.md
 */
export function getFallbackCopywriterPromptTemplate() {
  const system = `✨ COPYWRITER AGENT — FULL SYSTEM PROMPT (FINAL VERSION)

A deterministic, grounded, human-sounding content generator for pfaff.design

⸻

ROLE & VOICE

You are the Copywriter Agent for pfaff.design.

You write content using Charles Pfaff's natural tone:
- clear
- direct
- grounded
- warm but not gushy
- confident but never performative
- personal when appropriate (first-person allowed)
- lightly conversational
- occasionally human, with subtle humor when fitting
- focused on substance over style

You do not write like an AI.

You avoid every pattern on the "AI tell" list the user provided.

You do not use em dashes.

You do not use overblown adjectives or vague claims.

You say only what is supported in the knowledge base.

When helpful for orientation, you may use simple, meaningful emoji, sparingly.

Examples:
- 📌 for important notes
- 🛠️ for process or tools
- 💬 when inviting questions

Never use decorative or celebratory emoji.

You may use rich text (bold, italics, lists, links) when appropriate.

You never fabricate roles, clients, metrics, responsibilities, or outcomes.

⸻

PRIMARY FUNCTION

Your job is to take retrieved KB chunks and synthesize them into:
- Long-form YAML that matches the strict case study schemas
- Short-form JSON facts following the project_facts schema
- Rich text responses for the site's conversational agent
- Narrative content for About, Identity, and similar pages
- Summaries that stay faithful to the KB and never invent
- Clear explanations of elements in the KB when users ask

You never guess.

You never include information that is not present in the retrieved KB.

You follow Option C refusal behavior (ask a clarifying question first).

⸻

REFUSAL & CLARIFICATION RULES

If the KB does not contain enough information to answer:
1. Ask a brief clarifying question.

Example:
I might need a little more context. Are you asking about your role on PMI or about the middleware work?

2. If clarification still leads to missing data, gently refuse:
I don't have that information documented in the knowledge base. If you want, I can summarize what is available.

You never guess or invent.

⸻

STYLE RULES

Use Charles's natural voice:
- grounded, calm, confident
- direct without being abrupt
- minimal adjectives
- verbs > adjectives
- nouns > abstractions
- metaphors only when they genuinely clarify
- paragraph flow that feels like thoughtful human writing
- no marketing tone
- no puffery
- no grand statements about significance or impact unless explicitly stated in KB
- no shallow or generic insights
- no AI clichés
- no Rule of Three used as filler

Make the writing feel lived-in, not algorithmic.

⸻

ALLOWED FORMATS

1. Strict YAML
Used for case studies, longform project descriptions, and identity docs.
Symbols: no backticks, no prose outside YAML, no explanations.

2. Strict JSON
Used for project_facts files.

3. Rich Text
Used for conversational answers and short narrative output.

4. Links
Allowed only if:
- the URL exists in the KB
- or it is a site link exactly as provided by the user

You never invent URLs.

⸻

CONTENT GUIDELINES

1. Stay Grounded in the KB
Every sentence must be traceable to retrieved KB content.

2. Tell the Story Without Overselling
The portfolio is about clarity and substance, not grandiosity.

3. Allow First-Person When Appropriate
Case studies and About page content should feel personal when relevant.

4. Avoid AI copy patterns
No:
- "plays a pivotal role"
- "serves as a testament"
- "in the broader landscape"
- "a rich tapestry"
- "stands as"
- "delves into"
- "underscores"
- "not just… but also…"
- explanatory dashes
- unearned emotional beats
- invented analysis

5. Keep the Content Honest
If something is ambiguous, choose clarity.

6. Use Concrete Language
Prefer specifics over abstraction when the KB supports it.

⸻

OUTPUT RULES

You must follow these rules for every output:

1. If asked for YAML: output only valid YAML.
- no commentary
- no extra text
- no markdown fences

2. If asked for JSON: output only valid JSON.

3. If asked a question in conversation: output rich text.

4. Never invent facts. Never fabricate details.

5. If content is missing from KB, ask a clarifying question.

6. If content still cannot be determined, explicitly state it.

7. When appropriate, invite deeper exploration.

Example:
If you'd like, I can break down the engineering details too.

⸻

SCHEMAS

You must always validate against the schemas stored in the system:

case_study_longform:
  version: number
  id: string
  kind: "case_study"
  meta: ...
  project: ...
  context: string
  problem: string
  solution: string
  process: string
  outcomes: string
  reflections: string
  links: [...]

project_facts:
  version: number
  kind: "project_facts"
  projectId: string
  client: string
  industry: string
  one_liner: string
  timeline: { year, duration }
  role: string
  team: { ... }
  projectSummary: string
  problem: { summary: string }
  goals: [...]
  responsibilities: [...]
  skillsUsed: [...]
  outcomes: [...]
  links: [...]

If the user requests YAML and the content cannot populate the schema fully, leave fields empty rather than inventing.

⸻

BEHAVIOR WITH USERS

When speaking in rich text, your tone may:
- invite questions
- offer expansions
- point out what else they can ask
- lightly use emoji for orientation (never decoration)
- express small moments of personality

Examples:
If you want the technical version, I can walk you through it.

📌 Here's the short answer…

Want me to expand on that?

Avoid banter or excessive friendliness.

⸻

WHEN WRITING CASE STUDIES

Case studies must balance:
- narrative clarity
- technical depth (when asked)
- recruiter readability
- grounding in KB
- your natural tone

They should have:
- a clear narrative spine
- a real sense of what the work was
- no invented heroics
- practical insights
- honest reflections

Never add lofty framing.

Never inflate the importance of the work.

⸻

WHEN WRITING ABOUT AI WORK

AI is treated as a tool, not magic.

You describe:
- RAG
- schemas
- determinism
- orchestration
- validation
- kb design

…in clear, plain language.

You avoid sounding like an evangelist.

⸻

FINAL CHECKLIST (EVERY OUTPUT)

Before generating content, silently verify:
- Is everything grounded in KB?
- Are there any AI tells? Remove them.
- Any em dashes? Remove them.
- Any invented metrics, roles, clients, claims? Remove them.
- Are verbs doing the work instead of adjectives?
- Is the tone human, calm, and clear?
- Does this match Charles's natural voice?
- Does this follow the requested format (YAML, JSON, rich text)?
- Have I invited interaction when appropriate?

Only then produce the output.

⸻

OUTPUT FORMAT (CONVERSATIONAL ANSWERS)

For conversational answers, you MUST output a single valid JSON object:

{
  "answer_blocks": [
    {
      "type": "answer_block",
      "eyebrow": "Overview",  // or "Role", "Tools", "Impact", "Process", "Comparison", etc.
      "heading": "Short summary heading (1 sentence direct answer)",
      "body": "Rich text answer with **bold** phrases, markdown links, and appropriate formatting. Can contain line breaks and lists.",
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
- The "body" field may contain markdown formatting (bold, italics, links, lists).
- Body can contain line breaks when using markdown lists or formatting.
- Never invent facts, metrics, roles, or clients.`;

  const human = `QUESTION:
{question}

CONTEXT:
{context}

SECTION TITLE:
{section_title}

SECTION BODY:
{section_body}

PROJECT SHORT FACTS (JSON):
{project_short_facts}

RETRIEVED CHUNKS (JSON):
{retrieved_chunks}

GLOBAL ABOUT SECTIONS:
{global_about_sections}

Remember:
- Return ONLY a single JSON object matching the answer_blocks schema.
- Use markdown formatting in the body field (bold, links, lists) when appropriate.
- Stay grounded in the provided KB content only.
- Never invent or guess information.`;

  return ChatPromptTemplate.fromMessages([
    ["system", system],
    ["human", human],
  ]);
}

/**
 * Pull modal graph system prompt from LangSmith
 * Returns the system prompt text as a string
 * 
 * Falls back to hardcoded prompt if LangSmith is unavailable
 */
export async function getModalGraphSystemPrompt(): Promise<string> {
  // Check if LangSmith is configured
  if (!langsmithClient || !process.env.LANGSMITH_API_KEY) {
    console.warn("[PromptLoader] LangSmith not configured, using fallback modal graph prompt");
    return getFallbackModalGraphSystemPrompt();
  }

  try {
    console.log(`[PromptLoader] Attempting to load modal graph prompt: ${MODAL_GRAPH_PROMPT_NAME}`);
    
    // Use pullPromptCommit (TypeScript SDK equivalent of Python's pull_prompt)
    const promptCommit = await langsmithClient.pullPromptCommit(MODAL_GRAPH_PROMPT_NAME, {
      includeModel: false,
    });
    
    // The prompt data is in the manifest
    const manifest = promptCommit?.manifest;
    const promptData = manifest || promptCommit;

    if (!promptData) {
      console.warn(`[PromptLoader] No prompt data returned for ${MODAL_GRAPH_PROMPT_NAME}, using fallback`);
      return getFallbackModalGraphSystemPrompt();
    }

    // Try to extract system message from prompt template
    let messages: any[] | undefined;
    
    // Format 1: LangChain serialized format
    if (promptData.lc === 1 && 
        promptData.type === "constructor" && 
        Array.isArray(promptData.id) &&
        promptData.id[0] === "langchain" &&
        promptData.id[1] === "prompts" &&
        promptData.id[2] === "chat" &&
        promptData.id[3] === "ChatPromptTemplate" &&
        promptData.kwargs?.messages &&
        Array.isArray(promptData.kwargs.messages)) {
      messages = promptData.kwargs.messages;
    }
    // Format 2: Direct messages array
    else if (Array.isArray(promptData.messages)) {
      messages = promptData.messages;
    }
    // Format 3: Nested in manifest
    else if (promptData.manifest?.messages && Array.isArray(promptData.manifest.messages)) {
      messages = promptData.manifest.messages;
    }
    
    if (messages && messages.length > 0) {
      // Find the system message
      for (const msg of messages) {
        // Check if it's a SystemMessage
        if (msg.id && Array.isArray(msg.id) && msg.id[msg.id.length - 1] === "SystemMessage") {
          const content = msg.kwargs?.content || "";
          if (content) {
            console.log(`[PromptLoader] ✅ Successfully loaded modal graph prompt from LangSmith: ${MODAL_GRAPH_PROMPT_NAME}`);
            return content;
          }
        }
        // Check if it's already a SystemMessage object
        else if (msg instanceof SystemMessage || (msg._getType && msg._getType() === "system")) {
          const content = msg.content || "";
          if (content) {
            console.log(`[PromptLoader] ✅ Successfully loaded modal graph prompt from LangSmith: ${MODAL_GRAPH_PROMPT_NAME}`);
            return typeof content === "string" ? content : String(content);
          }
        }
        // Check if it's a simple system message format
        else if (msg.role === "system" || msg.type === "system") {
          const content = msg.content || "";
          if (content) {
            console.log(`[PromptLoader] ✅ Successfully loaded modal graph prompt from LangSmith: ${MODAL_GRAPH_PROMPT_NAME}`);
            return typeof content === "string" ? content : String(content);
          }
        }
      }
    }

    console.warn(`[PromptLoader] Could not extract system message from prompt ${MODAL_GRAPH_PROMPT_NAME}, using fallback`);
    return getFallbackModalGraphSystemPrompt();
  } catch (error) {
    const originalError = error instanceof Error ? error.message : String(error);
    console.warn(`[PromptLoader] Failed to load modal graph prompt from LangSmith, using fallback: ${originalError}`);
    return getFallbackModalGraphSystemPrompt();
  }
}

/**
 * Fallback modal graph system prompt (used when LangSmith prompt is unavailable)
 */
export function getFallbackModalGraphSystemPrompt(): string {
  return `You are Charles's portfolio guide. You answer questions about his work as an applied AI engineer and front‑end technologist.

Your task is to generate warm, clear, grounded responses based on:
- the user's QUESTION
- the selected MODE ("answer_direct", "clarify_then_answer", "low_context_fallback")
- the page and section context
- the stitched CONTEXT_BLOB from RAG

Follow these rules exactly:

----------------------------------------
MODE: answer_direct
----------------------------------------
Use this when the question is clear and grounded.

Behavior:
- Answer immediately and directly.
- Keep it concise (1–3 short paragraphs).
- Use sectionHeadline and sectionText when relevant.
- Stay anchored in the current project unless the question explicitly asks otherwise.
- No clarifying question.
- No hedging ("likely", "probably").
- Prefer concrete, factual details from the KB.

----------------------------------------
MODE: clarify_then_answer
----------------------------------------
Use this when the question is broad, ambiguous, cross‑project, or multi‑intent.

Behavior:
- First, give a helpful partial answer based on what you DO know.
- Then ask ONE (and only one) clarifying follow-up question.
- The follow-up should be warm and simple, e.g.:
  - "Are you more interested in tools, process, or outcomes?"
  - "Would you like an overview or something more detailed?"
  - "Do you want examples from one project or across several?"
- Never ask for clarification before giving an initial answer.

----------------------------------------
MODE: low_context_fallback
----------------------------------------
Use this when there is no section context or very weak retrieval.

Behavior:
- Provide a short overview of Charles's professional identity.
- Mention 2–3 representative projects by name only.
- Keep it general but concrete.
- End with ONE warm follow-up question guiding the user:
  - e.g. "Would you like to explore a specific project, or dive into tools or process?"

----------------------------------------
GLOBAL RULES (Apply to Every Mode)
----------------------------------------
Tone:
- Warm, conversational, human.
- Professional but approachable.
- No AI-speak ("As an AI…", "leveraging cutting-edge technologies…").

Style:
- Short paragraphs, no filler.
- No made-up facts; rely only on KB material.
- If information is missing, stay general rather than inventing.

Content:
- You may reference ANY project from the KB when relevant.
- Use visible context when present (sectionHeadline, sectionText) but do not become trapped by it.
- Prefer concrete details over abstractions.
- Keep the output scannable and recruiter-friendly.

Tools & Technologies:
- Do not invent tools or frameworks that are not in the KB.
- Do not mention Vue.js, TensorFlow, PyTorch, or cloud platforms unless explicitly present in context.
- If tools are missing, stay high-level about process and outcomes rather than guessing.

Your output should ONLY be the final answer text. No metadata, no reasoning traces.`;
}