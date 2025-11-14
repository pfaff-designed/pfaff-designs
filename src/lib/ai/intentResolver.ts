import { anthropic } from "./client";

export type QueryIntent = "project" | "skills" | "experience" | "general";
export type Audience = "recruiter" | "freelance_client" | "unknown";
export type PageKind = "case_study" | "overview" | "skills" | "experience" | "mixed";

export interface IntentResult {
  intent: QueryIntent;
  audience: Audience;
  pageKind: PageKind;
  topic?: {
    type: QueryIntent;
    projectSlug?: string;
    skillNames?: string[];
  };
  confidence: "high" | "medium" | "low";
}

/**
 * Resolve user query intent, audience, and page kind
 */
export const resolveIntent = async (query: string): Promise<IntentResult> => {
  const prompt = `You are an intent resolver for a portfolio website. Analyze the user query and determine:

1. Intent: What is the user asking about?
   - "project": Asking about a specific project/case study (e.g., "Tell me about Capital One", "Show me the Coca-Cola project")
   - "skills": Asking about skills or capabilities (e.g., "What are your skills?", "What can you do with React?")
   - "experience": Asking about work experience or roles (e.g., "Where have you worked?", "What's your experience?")
   - "general": General questions about the person (e.g., "Tell me about yourself", "Who are you?")

2. Audience: Who is likely asking?
   - "recruiter": Professional recruiter or hiring manager
   - "freelance_client": Potential freelance client
   - "unknown": Cannot determine

3. Page Kind: What type of page should be generated?
   - "case_study": For project-specific queries
   - "overview": For general "about" queries
   - "skills": For skills-focused queries
   - "experience": For experience/roles queries
   - "mixed": For queries that span multiple topics

4. Topic: Extract specific details
   - If project intent: extract project slug/name (e.g., "capital-one", "coca-cola", "coke", "pmi", "tanger")
   - If skills intent: extract skill names mentioned
   - Otherwise: leave empty

Available projects: capital-one-travel, coca-cola-creative-technology, coke, pmi, tanger

Respond with JSON only in this exact format:
{
  "intent": "project" | "skills" | "experience" | "general",
  "audience": "recruiter" | "freelance_client" | "unknown",
  "pageKind": "case_study" | "overview" | "skills" | "experience" | "mixed",
  "topic": {
    "type": "project" | "skills" | "experience" | "general",
    "projectSlug": "string or null",
    "skillNames": ["string"] or null
  },
  "confidence": "high" | "medium" | "low"
}

User query: "${query}"`;

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

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = content.text.trim();
    const jsonMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const result: IntentResult = JSON.parse(jsonText);

    // Validate and set defaults
    return {
      intent: result.intent || "general",
      audience: result.audience || "unknown",
      pageKind: result.pageKind || "overview",
      topic: result.topic,
      confidence: result.confidence || "medium",
    };
  } catch (error) {
    console.error("Error resolving intent:", error);
    // Return safe defaults
    return {
      intent: "general",
      audience: "unknown",
      pageKind: "overview",
      confidence: "low",
    };
  }
};

