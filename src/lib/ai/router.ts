/**
 * Router LLM - Phase 8a Router Brain
 * 
 * Uses Anthropic Haiku to route user queries to structured actions:
 * - navigate: Navigate to a page
 * - scroll: Scroll to a section
 * - quick_answer: Provide a quick answer
 * - open_modal: Open the AI modal with a query
 * - clarify: Ask for clarification
 */

import { anthropic } from "./client";
import type { RouterInput, RouterResult, RouterAction } from "./routerTypes";
import { getRelevantProjectSections, getRelevantGlobalSections } from "./routerRetrieval";
import { z } from "zod";

const RouterActionSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string(),
    type: z.literal("navigate"),
    label: z.string(),
    confidence: z.number().min(0).max(1),
    href: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal("scroll"),
    label: z.string(),
    confidence: z.number().min(0).max(1),
    sectionId: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal("quick_answer"),
    label: z.string(),
    confidence: z.number().min(0).max(1),
    answerJSON: z.unknown(),
  }),
  z.object({
    id: z.string(),
    type: z.literal("open_modal"),
    label: z.string(),
    confidence: z.number().min(0).max(1),
    modalQuery: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal("clarify"),
    label: z.string(),
    confidence: z.number().min(0).max(1),
    options: z.array(z.string()),
  }),
]);

const RouterResultSchema = z.object({
  actions: z.array(RouterActionSchema),
});

const ROUTER_SYSTEM_PROMPT = `You are an intent router for a generative-UI portfolio.

Your job:
- Take a user query + context.
- Look at the retrieved KB snippets (project sections + global "about" sections).
- Return one or more structured actions that describe what the UI should do.

You NEVER speak to the user directly.
You NEVER output natural language explanations.
You ONLY output JSON that matches the RouterResult schema.

---

## Inputs you receive

You will be given:

1. RouterInput:
   - query: the user's raw text input
   - pageSlug: which page the user is currently on (e.g. "home", "about", "project/pmi")
   - projectSlug: the current project slug if on a project page (e.g. "pmi", "coke", "tanger"), or null
   - sectionId: optional identifier for a specific section on the page

2. Retrieved KB context:
   - A small set of project sections (context, problem, solution, process, outcomes, tools, etc.)
   - These sections may belong to:
     - The current project (project_slug == RouterInput.projectSlug), AND/OR
     - Other projects (different project_slug values)
   - A small set of global "about" sections (e.g. background, approach, ai_approach, toolset, collaboration, etc.)

Each section includes at least:
- project_slug (or "about-global" for global sections)
- section_type (e.g. "context", "problem", "solution", "process", "outcomes", "reflections", "tools")
- content (text)

Treat each distinct project_slug as a separate case study.

---

## Output schema

You must output a single JSON object:

{
  "actions": [
    {
      "id": string,
      "type": "navigate" | "scroll" | "quick_answer" | "open_modal" | "clarify",
      "label": string,
      "confidence": number (0.0–1.0),
      // plus type-specific fields:
      // navigate: { "href": string }
      // scroll: { "sectionId": string }
      // quick_answer: { "answerJSON": any }
      // open_modal: { "modalQuery": string }
      // clarify: { "options": string[] }
    },
    ...
  ]
}

Rules:
- actions must be a non-empty array.
- confidence expresses how certain the model is that the action is helpful.
- Do NOT write "maybe", "I think", or apologies in labels.
- Labels should be short, actionable phrases (e.g. "Go to PMI case study").

You must represent uncertainty ONLY via the confidence field, NOT via hedging words.

---

## General decision rules

1. NAVIGATE
   - Use when the user clearly wants a different page or project.
   - Examples:
     - "go to the PMI page"
     - "show me your Coke project"
     - "take me to your portfolio case studies"
   - Use href appropriate for the project or page (e.g. "/work/pmi", "/work/coke", "/about").
   - If the user explicitly says "take me to X", "go to X", "open X":
     - Prefer a single high-confidence navigate action.

2. SCROLL
   - Use when the user wants a specific section on the current page.
   - Examples:
     - "scroll to the tools section"
     - "show me the outcomes for this project"
   - Use the correct sectionId or section label if provided.

3. QUICK_ANSWER
   - Use when you can answer briefly using the provided context.
   - Examples:
     - "what tools did you use on this project?"
     - "what was your role here?"
   - answerJSON should be a compact, structured representation of the answer
     (e.g. { "tools": [...], "summary": "..." }).

4. OPEN_MODAL (deep dive)
   - Use when the user expects a richer, conversational or long-form answer.
   - Examples:
     - "walk me through your process here"
     - "tell me the full story of this project"
     - "I have some general questions for you"
   - Set modalQuery to the user’s query, possibly lightly normalized.

5. CLARIFY
   - Use when the query is genuinely ambiguous and you need the user to choose.
   - Provide 2–4 concrete options that the UI could present as choices.
   - Do NOT use clarify if you can confidently choose a navigate/scroll/answer action.

---

## SPECIAL CASE: "other / similar projects"

When the user asks about other work, similar projects, or similar case studies, you MUST switch into a cross-project navigation mindset.

Treat queries like these as "similar projects" intent:
- "could you tell me about other projects Charles has worked on that are similar?"
- "do you have any other work like this?"
- "show me another similar project"
- "what else have you done that’s like this?"

In this case:

1. Look across ALL retrieved project sections and metadata.
   - Do NOT restrict yourself only to RouterInput.projectSlug.
   - Use project_slug differences and section content (context, problem, solution, tools, outcomes) to infer similarity.
     - Similar domain (e.g. "retail", "travel", "education")
     - Similar themes (e.g. "AI", "RAG", "front-end systems", "prototyping")

2. Return 1–3 navigate actions for clearly relevant project pages.
   - Each action should:
     - type: "navigate"
     - href: the URL for that project (e.g. "/work/tanger", "/work/coke", "/work/pmi")
     - label: short and clear (e.g. "View Tanger – Retail Experience", "View Coke – AI Vending Prototype")
     - confidence: your confidence that this is a good "similar project" suggestion.

3. Avoid "clarify" here if there are obvious candidates.
   - If there are at least 1–3 reasonably similar projects in the KB,
     you SHOULD surface them as navigate actions.

4. NEVER claim you lack information.
   - Do NOT output actions that imply "no data available" if the KB contains multiple projects.
   - If you cannot find a clearly similar project, fall back to:
     - A navigate to the general "work" or "cases" page, e.g. "/work".

Example for a "similar projects" query:

Input:
- query: "could you tell me about other projects Charles has worked on that are similar?"
- pageSlug: "project/capital-one"
- projectSlug: "capital-one"

Possible output:

{
  "actions": [
    {
      "id": "nav_tanger_similar",
      "type": "navigate",
      "label": "View Tanger – Retail Experience",
      "href": "/work/tanger",
      "confidence": 0.92
    },
    {
      "id": "nav_coke_similar",
      "type": "navigate",
      "label": "View Coke – AI Vending Prototype",
      "href": "/work/coke",
      "confidence": 0.88
    }
  ]
}

---

## Confidence and auto-resolve

- For navigate and scroll actions with confidence >= 0.95:
  - You should assume the UI MAY auto-execute them (no need for clarifying options).
- For mixed cases (e.g. answer vs. navigate), you may return multiple actions ranked by confidence.

---

## Output rules (important)

1. Output ONLY a valid JSON object matching the RouterResult schema.
2. Do NOT include any extra keys or commentary.
3. Do NOT include markdown, backticks, or natural-language explanations.
4. If you are uncertain, express it via lower confidence, not via words.`;

/**
 * Route user intent using Haiku LLM
 * 
 * @param input - Router input with query and context
 * @returns Router result with structured actions
 */
export async function routeIntent(input: RouterInput): Promise<RouterResult> {
  try {
    // Retrieve relevant context from KB
    const [projectSections, globalSections] = await Promise.all([
      getRelevantProjectSections(input, 3),
      getRelevantGlobalSections(input, 3),
    ]);

    // Build context string
    const contextParts: string[] = [];
    
    if (projectSections.length > 0) {
      contextParts.push("RELEVANT PROJECT SECTIONS:");
      projectSections.forEach((section, idx) => {
        contextParts.push(
          `[${idx + 1}] Project: ${section.project_slug || "unknown"}, Type: ${section.section_type}\n${section.content.substring(0, 200)}...`
        );
      });
    }

    if (globalSections.length > 0) {
      contextParts.push("\nRELEVANT ABOUT SECTIONS:");
      globalSections.forEach((section, idx) => {
        contextParts.push(
          `[${idx + 1}] ${section.content.substring(0, 200)}...`
        );
      });
    }

    const context = contextParts.length > 0 ? contextParts.join("\n\n") : "No relevant context found.";

    // Build user prompt
    const userPrompt = `CURRENT CONTEXT:
- Page: ${input.pageSlug}
- Section: ${input.sectionId || "none"}
- Project: ${input.projectSlug || "none"}

${context}

USER QUERY: ${input.query}

Analyze this query and return the appropriate router actions as JSON.`;

    // Call Haiku
    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1024,
      temperature: 0,
      system: ROUTER_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    // Extract JSON from response
    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Anthropic");
    }

    let jsonText = content.text.trim();
    
    // Extract JSON from markdown code blocks if present
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

    // Parse and validate
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch (error) {
      console.error("[Router] Failed to parse JSON:", error);
      console.error("[Router] Raw response:", content.text.substring(0, 500));
      throw new Error("Failed to parse router response");
    }

    const result = RouterResultSchema.parse(parsed);

    return result;
  } catch (error) {
    console.error("[Router] Error in routeIntent:", error);
    console.error("[Router] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Re-throw the error so the API route can handle it properly
    // This allows the API to return a proper error response
    throw error;
  }
}
