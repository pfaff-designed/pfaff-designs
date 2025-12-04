// src/lib/ai/intentRouter.ts
import { z } from "zod";
import type {
  PageContext,
  ChatHistoryMessage,
  RoutedIntent,
  AnswerMode,
} from "./queryTypes";

export type IntentRouterInput = {
  message: string;
  pageContext: PageContext;
  history: ChatHistoryMessage[];
};

const INTENT_ROUTER_SYSTEM_PROMPT = `
You are the Intent Router for a generative-UI portfolio site.

Your ONLY job:
- Look at the user's message
- Consider the current page and route
- Decide:
  - What the question is primarily about
  - Which project (if any) it refers to
  - Which PAGE and SECTION are the best "home" for this question
  - How strongly navigation and scrolling should be SUGGESTED

You DO NOT:
- Generate answers
- Write prose
- Decide to navigate or scroll
- Talk to the user

You ONLY output a single JSON object that matches the "RoutedIntent" schema.

--------------------
SITE & PAGE TYPES
--------------------

The site has these main page types:

- "home":
  - Landing page.
  - High-level intro, light overview of work and person.
  - Good for quick summaries, but NOT the canonical hub for projects.

- "work-index":
  - Hub for client work, projects, and case studies.
  - This is where recruiters go to see an overview of projects.
  - If the user asks about "work", "projects", "case studies", "clients", "portfolio",
    and they are NOT clearly asking about background or career story,
    you should usually set bestPageId to "work-index".

- "case-study":
  - A specific project page (e.g., Capital One, PMI, Coke).
  - Has sections like: overview, role, process, outcomes.
  - Use this when the question is about a single known project.

- "about":
  - Personal background, story, philosophy, career history.
  - Triggered by phrases like:
    - "about you", "about yourself", "your background", "your story",
      "your bio", "your career", "your path", "how you got here".

- "contact":
  - Ways to get in touch, hiring, working together.
  - Triggered by phrases like:
    - "contact you", "get in touch", "hire you", "email", "reach out".

--------------------
ROUTED_INTENT SCHEMA
--------------------

You MUST output a JSON object with this exact shape:

{
  "primaryTopicType": "project" | "skills" | "career" | "about" | "other",
  "primaryProjectSlug": string | null,

  "bestPageId": string | null,
  "bestProjectSlug": string | null,
  "bestSectionId": string | null,

  "navigationRelevance": "none" | "optional" | "strong",
  "scrollRelevance": "none" | "optional" | "strong",
  "answerMode": "full" | "brief" | "none"
}

Definitions:

- primaryTopicType:
  - "project": Specific project or client work (e.g. Capital One, PMI, Coke).
  - "skills": Questions about skills, tools, technologies, ways of working.
  - "career": Questions about career history, roles over time, responsibilities.
  - "about": Questions about the person, their story, philosophy, background.
  - "other": Anything else.

- primaryProjectSlug:
  - The canonical slug for the main project, if any (e.g. "capital-one-travel").
  - null if no specific project is referenced.

- bestPageId:
  - The page where this question MOST naturally belongs:
    - "home" | "work-index" | "case-study" | "about" | "contact" | null

- bestProjectSlug:
  - If bestPageId === "case-study", the slug of that project.
  - Otherwise null.

- bestSectionId:
  - Which section of a case study best fits (if any):
    - e.g. "overview", "role", "process", "outcomes"
  - null if not applicable.

- navigationRelevance:
  - "none": This question can be answered perfectly well on the current page.
  - "optional": Navigation could help, but is not required.
  - "strong": Navigation is clearly helpful (e.g. user asks to "open", "show" a page).

- scrollRelevance:
  - "none": No need to scroll to a specific section.
  - "optional": Scrolling could help, but is not required.
  - "strong": The question is clearly about a specific section (e.g. "process" or "outcomes").

- answerMode:
  - "full": The user is asking for information, explanation, or context. GENERATE AN ANSWER.
    Examples:
      - "Tell me about your work."
      - "What was your role on Capital One?"
      - "How did you implement this?"
      - "What tools did you use on Capital One?" (even if a "tools" section exists)
      - "Tell me about the process" (even if a "process" section exists)
    IMPORTANT: If the user asks a question (what, how, why, tell me, explain), ALWAYS use "full".
    The existence of a matching section does NOT mean answerMode should be "none" - generate the answer!
  - "brief": The user is asking for something that is mostly navigation, but a short confirmation or one-line explanation would be helpful.
    Examples:
      - "Can you show me your work page?"
      - "Open the PMI case study." (but still generate a brief answer)
  - "none": The user is giving a PURE UI navigation command with NO question. Only use this for commands that don't ask for information.
    Examples:
      - "Scroll down." (pure UI command)
      - "Go to contact." (pure navigation, no question)
      - "Scroll to the outcomes section." (pure navigation command, no question)
    IMPORTANT: If the message contains a question word (what, how, why, tell me, explain) or asks for information, use "full", NOT "none".

When in doubt:
- If the message starts with "tell me", "what", "how", "why", "explain", "describe" → answerMode: "full".
- If the message asks a question (contains "?", "what", "how", "why", "tell me") → answerMode: "full".
- If the message starts with "go to", "open", "take me to", "show me the page" → answerMode: "brief".
- If the message is a pure navigation command (e.g. "scroll to X", "go to Y") with NO question → answerMode: "none".
- CRITICAL: The presence of a matching section (bestSectionId) does NOT imply answerMode should be "none". If the user asked a question, use "full"!

--------------------
IMPORTANT MAPPING RULES
--------------------

1) Distinguishing WORK vs ABOUT:

- If the user says things like:
  - "your work", "your projects", "your portfolio", "what kind of work you do",
  - "show me your work", "case studies", "client work"
- And they are NOT specifically asking for "background", "story", or "how you got into this":
  -> Treat this as:
     - primaryTopicType: "project"
     - bestPageId: "work-index"
     - primaryProjectSlug: null (unless they name a specific client)
     - navigationRelevance: "optional" (or "strong" if they explicitly ask to "go to" or "show" work)

- If the user clearly asks about story/background:
  - "Tell me about your background"
  - "How did you get into this?"
  - "Tell me about yourself"
  - "What's your career story?"
  -> Treat this as:
     - primaryTopicType: "about" or "career"
     - bestPageId: "about"
     - bestProjectSlug: null

2) Project-specific questions:

- If the user mentions a known client or project by name:
  - "Capital One", "Capital One Travel"
  - "PMI"
  - "Coke", "Coca-Cola"
  -> Set:
     - primaryTopicType: "project"
     - primaryProjectSlug: the correct slug (e.g. "capital-one-travel")
     - bestPageId: "case-study"
     - bestProjectSlug: that same slug
     - navigationRelevance:
       - "optional" if they just ask "tell me about X"
       - "strong" if they say "open the X case study", "take me to", "show me the page"

3) Section-level questions (case-study):

- If the question is clearly about:
  - Role → "What was your role?", "What did YOU do on this project?"
    - bestSectionId: "role"
  - Process → "How did you implement this?", "What was your process?"
    - bestSectionId: "process"
  - Outcomes → "What impact did this have?", "What were the results?"
    - bestSectionId: "outcomes"

- If they are already on a case-study page and ask about these topics:
  - scrollRelevance: "optional" or "strong"
- If they are NOT on the case-study page, navigation to that case-study might be useful.

4) Skills & tools:

- If the user asks about technologies, skills, or ways of working:
  - "Tell me about your experience with React"
  - "How do you work with RAG and LangChain?"
  -> primaryTopicType: "skills"
  -> bestPageId: "work-index" (to ground in projects) OR "about" depending on context.
     When in doubt, prefer "work-index" so answers can be supported by case studies.

--------------------
EXAMPLES
--------------------

Example 1:
User is on HOME page (pageId: "home", route: "/").
User says: "Tell me about your work."

-> RoutedIntent:
{
  "primaryTopicType": "project",
  "primaryProjectSlug": null,
  "bestPageId": "work-index",
  "bestProjectSlug": null,
  "bestSectionId": null,
  "navigationRelevance": "optional",
  "scrollRelevance": "none",
  "answerMode": "full"
}

Reason: "your work" refers to projects/case studies overall. The best hub is the work index, NOT the about page. The user is asking for information, so answerMode is "full".

---

Example 2:
User is on HOME page.
User says: "Tell me about your background and how you got into this."

-> RoutedIntent:
{
  "primaryTopicType": "about",
  "primaryProjectSlug": null,
  "bestPageId": "about",
  "bestProjectSlug": null,
  "bestSectionId": null,
  "navigationRelevance": "optional",
  "scrollRelevance": "none",
  "answerMode": "full"
}

---

Example 2b:
User is on HOME page.
User says: "Open your work page."

-> RoutedIntent:
{
  "primaryTopicType": "project",
  "primaryProjectSlug": null,
  "bestPageId": "work-index",
  "bestProjectSlug": null,
  "bestSectionId": null,
  "navigationRelevance": "strong",
  "scrollRelevance": "none",
  "answerMode": "brief"
}

Reason: User is primarily asking for navigation with a clear command ("open"). A brief confirmation is helpful, but full copy would be unnecessary.

---

Example 3:
User is on HOME page.
User says: "Can you tell me about your work on Capital One?"

-> RoutedIntent:
{
  "primaryTopicType": "project",
  "primaryProjectSlug": "capital-one-travel",
  "bestPageId": "case-study",
  "bestProjectSlug": "capital-one-travel",
  "bestSectionId": "overview",
  "navigationRelevance": "optional",
  "scrollRelevance": "none",
  "answerMode": "full"
}

---

Example 4:
User is on CASE STUDY page for Capital One (pageId: "case-study", projectSlug: "capital-one-travel").
User says: "What was your role here?"

-> RoutedIntent:
{
  "primaryTopicType": "project",
  "primaryProjectSlug": "capital-one-travel",
  "bestPageId": "case-study",
  "bestProjectSlug": "capital-one-travel",
  "bestSectionId": "role",
  "navigationRelevance": "none",
  "scrollRelevance": "strong",
  "answerMode": "full"
}

---

Example 4b:
User is on CASE STUDY page for Capital One (pageId: "case-study", projectSlug: "capital-one-travel").
User says: "Scroll to the outcomes section."

-> RoutedIntent:
{
  "primaryTopicType": "project",
  "primaryProjectSlug": "capital-one-travel",
  "bestPageId": "case-study",
  "bestProjectSlug": "capital-one-travel",
  "bestSectionId": "outcomes",
  "navigationRelevance": "none",
  "scrollRelevance": "strong",
  "answerMode": "none"
}

Reason: Pure UI command - user just wants to scroll, no explanatory copy needed.

---

Example 5:
User is on WORK INDEX page (pageId: "work-index").
User says: "Compare your work for PMI and Capital One."

-> RoutedIntent:
{
  "primaryTopicType": "project",
  "primaryProjectSlug": null,
  "bestPageId": "work-index",
  "bestProjectSlug": null,
  "bestSectionId": null,
  "navigationRelevance": "none",
  "scrollRelevance": "none",
  "answerMode": "full"
}

--------------------
OUTPUT RULES (IMPORTANT)
--------------------

- Always output a SINGLE JSON object that matches the RoutedIntent schema.
- Do NOT include explanations, comments, or additional text.
- Do NOT wrap the JSON in markdown.
- If unsure, choose conservative defaults:
  - primaryProjectSlug: null
  - bestPageId: null
  - bestProjectSlug: null
  - bestSectionId: null
  - navigationRelevance: "none"
  - scrollRelevance: "none"
  - answerMode: "full" (ALWAYS default to full when in doubt - users want answers, not just navigation)
`;

// Zod schema matching RoutedIntent
const RoutedIntentSchema = z.object({
  primaryTopicType: z.enum(["project", "skills", "career", "about", "other"]),
  primaryProjectSlug: z.string().nullable().optional(),

  bestPageId: z.string().nullable().optional(),
  bestProjectSlug: z.string().nullable().optional(),
  bestSectionId: z.string().nullable().optional(),

  navigationRelevance: z.enum(["none", "optional", "strong"]),
  scrollRelevance: z.enum(["none", "optional", "strong"]),
  answerMode: z.enum(["full", "brief", "none"]),
});

type RoutedIntentModelOutput = z.infer<typeof RoutedIntentSchema>;

/**
 * runIntentRouter
 *
 * Uses Claude Haiku with structured output to classify intent.
 */
export async function runIntentRouter(
  input: IntentRouterInput,
): Promise<RoutedIntent> {
  const { message, pageContext, history } = input;

  // Build a compact text description of the current context
  const contextLines: string[] = [
    `CURRENT PAGE CONTEXT:`,
    `- pageId: ${pageContext.pageId}`,
    `- route: ${pageContext.route}`,
    `- projectSlug: ${pageContext.projectSlug ?? "null"}`,
  ];

  if (pageContext.sections && pageContext.sections.length > 0) {
    contextLines.push(
      `- sections: ${pageContext.sections
        .map((s) => `${s.id} (${s.label || s.heading})`)
        .join(", ")}`,
    );
  } else {
    contextLines.push(`- sections: none`);
  }

  // Keep only the last few messages to give light conversational context
  const lastHistory = history.slice(-4);
  const historyText =
    lastHistory.length === 0
      ? "No prior messages."
      : lastHistory
          .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
          .join("\n");

  const userPrompt = [
    contextLines.join("\n"),
    "",
    "RECENT CONVERSATION HISTORY:",
    historyText,
    "",
    "USER MESSAGE:",
    message,
    "",
    "Now decide the RoutedIntent JSON for this message.",
  ].join("\n");

  try {
    // Use Anthropic SDK directly for structured output
    const anthropicSdk = await import("@anthropic-ai/sdk");
    const AnthropicSDK = anthropicSdk.default;
    
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY or NEXT_PUBLIC_ANTHROPIC_API_KEY is required");
    }
    
    const client = new AnthropicSDK({
      apiKey: apiKey.replace(/^["']|["']$/g, ""),
    });

    // Use messages.create - system prompt instructs JSON output
    const response = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1024,
      temperature: 0,
      system: INTENT_ROUTER_SYSTEM_PROMPT,
      messages: [
        { role: "user", content: userPrompt },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Anthropic");
    }

    // Parse and validate JSON
    // Extract JSON from markdown code blocks if present
    let jsonText = content.text.trim();
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    }
    
    // Extract JSON object if wrapped in other text
    const jsonStart = jsonText.indexOf("{");
    const jsonEnd = jsonText.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch (error) {
      console.error("Failed to parse intent router JSON:", error);
      console.error("Raw response:", content.text.substring(0, 500));
      throw new Error("Failed to parse intent router response");
    }

    const result = RoutedIntentSchema.parse(parsed);

    // result is already validated against RoutedIntentSchema
    const routed = result as RoutedIntentModelOutput;

    // Normalize missing/null-ish values & cast to our RoutedIntent type
    const normalized: RoutedIntent = {
      primaryTopicType: routed.primaryTopicType,
      primaryProjectSlug: routed.primaryProjectSlug ?? null,

      bestPageId: routed.bestPageId ?? null,
      bestProjectSlug: routed.bestProjectSlug ?? null,
      bestSectionId: routed.bestSectionId ?? null,

      navigationRelevance: routed.navigationRelevance ?? "none",
      scrollRelevance: routed.scrollRelevance ?? "none",
      answerMode: (routed.answerMode ?? "full") as AnswerMode,
    };

    return normalized;
  } catch (error) {
    console.error("Intent router error:", error);
    
    // Fallback: simple heuristic-based intent
    const lowerMessage = message.toLowerCase();
    let primaryTopicType: RoutedIntent["primaryTopicType"] = "other";
    let primaryProjectSlug: string | null = null;
    let bestPageId: string | null = null;
    let bestProjectSlug: string | null = null;
    let bestSectionId: string | null = null;
    let navigationRelevance: RoutedIntent["navigationRelevance"] = "none";
    let scrollRelevance: RoutedIntent["scrollRelevance"] = "none";
    let answerMode: AnswerMode = "full";

    // Simple project detection
    if (lowerMessage.includes("capital one")) {
      primaryProjectSlug = "capital-one-travel";
      primaryTopicType = "project";
      bestPageId = "case-study";
      bestProjectSlug = "capital-one-travel";
    } else if (lowerMessage.includes("coke") || lowerMessage.includes("coca")) {
      primaryProjectSlug = "coke-vending-machine";
      primaryTopicType = "project";
      bestPageId = "case-study";
      bestProjectSlug = "coke-vending-machine";
    } else if (lowerMessage.includes("pmi")) {
      primaryProjectSlug = "pmi";
      primaryTopicType = "project";
      bestPageId = "case-study";
      bestProjectSlug = "pmi";
    }

    // Simple section detection for case-study pages
    if (pageContext.pageId === "case-study" && pageContext.sections) {
      if (lowerMessage.includes("tool") || lowerMessage.includes("tech") || lowerMessage.includes("stack")) {
        const toolsSection = pageContext.sections.find(s => s.id === "tools");
        if (toolsSection) {
          bestSectionId = "tools";
          scrollRelevance = "optional";
        }
      } else if (lowerMessage.includes("process") || lowerMessage.includes("how")) {
        const processSection = pageContext.sections.find(s => s.id === "process");
        if (processSection) {
          bestSectionId = "process";
          scrollRelevance = "optional";
        }
      } else if (lowerMessage.includes("role") || lowerMessage.includes("what did you")) {
        const roleSection = pageContext.sections.find(s => s.id === "role");
        if (roleSection) {
          bestSectionId = "role";
          scrollRelevance = "optional";
        }
      }
    }

    // Background/about detection
    if (
      lowerMessage.includes("background") ||
      lowerMessage.includes("about you") ||
      lowerMessage.includes("tell me about yourself") ||
      lowerMessage.includes("your story") ||
      lowerMessage.includes("career")
    ) {
      primaryTopicType = "about";
      bestPageId = "about";
      if (pageContext.pageId !== "about") {
        navigationRelevance = "optional";
      }
    }

    // Answer mode detection (heuristic-based fallback)
    // CRITICAL: If the user asks a question, ALWAYS generate an answer (full), even if a section exists
    const hasQuestionWords = 
      lowerMessage.includes("what") ||
      lowerMessage.includes("how") ||
      lowerMessage.includes("why") ||
      lowerMessage.includes("tell me") ||
      lowerMessage.includes("explain") ||
      lowerMessage.includes("describe") ||
      lowerMessage.includes("?") ||
      lowerMessage.startsWith("tell me") ||
      lowerMessage.startsWith("what") ||
      lowerMessage.startsWith("how") ||
      lowerMessage.startsWith("why") ||
      lowerMessage.startsWith("explain") ||
      lowerMessage.startsWith("describe");

    if (hasQuestionWords) {
      // User asked a question - always generate an answer, even if a section exists
      answerMode = "full";
    } else if (
      lowerMessage.startsWith("scroll") &&
      !hasQuestionWords
    ) {
      // Pure navigation command with no question
      answerMode = "none";
    } else if (
      lowerMessage.startsWith("go to") ||
      lowerMessage.startsWith("open") ||
      lowerMessage.startsWith("take me to")
    ) {
      // Navigation command, but might want a brief answer
      answerMode = "brief";
    } else {
      // Default: if in doubt, generate an answer
      answerMode = "full";
    }

    return {
      primaryTopicType,
      primaryProjectSlug,
      bestPageId,
      bestProjectSlug,
      bestSectionId,
      navigationRelevance,
      scrollRelevance,
      answerMode,
    };
  }
}