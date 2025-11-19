/**
 * Audience Intent Classification
 * Determines who the user is (recruiter, hiring_manager, client, general)
 * and influences content strategy and layout decisions
 */

import { anthropic } from "./client";

export type Intent = "recruiter" | "hiring_manager" | "client" | "general";

export interface IntentProfile {
  intent: Intent;
  confidence: number; // 0-1
  signals: string[]; // Keywords or patterns that led to this classification
  audienceReasoning: string; // Brief explanation of why this intent was chosen
}

interface ClassifyIntentOptions {
  currentPath?: string;
  referrer?: string;
}

/**
 * Rule-based intent classification using heuristics
 */
function classifyIntentHeuristic(
  query: string,
  options: ClassifyIntentOptions = {}
): IntentProfile | null {
  const q = query.toLowerCase();
  const signals: string[] = [];
  
  // Recruiter signals
  const recruiterKeywords = [
    "resume", "cv", "skills", "summary", "quick overview",
    "experience summary", "background", "qualifications",
    "what are your skills", "tell me about yourself"
  ];
  
  // Hiring manager signals
  const hiringManagerKeywords = [
    "process", "architecture", "system", "how did you",
    "decision", "why did you", "approach", "methodology",
    "technical", "implementation", "design decisions"
  ];
  
  // Client signals
  const clientKeywords = [
    "help me", "work with you", "project", "services",
    "hire you", "collaborate", "working together",
    "can you help", "availability", "rates", "pricing"
  ];
  
  let recruiterScore = 0;
  let hiringManagerScore = 0;
  let clientScore = 0;
  
  // Check for recruiter signals
  for (const keyword of recruiterKeywords) {
    if (q.includes(keyword)) {
      recruiterScore++;
      signals.push(keyword);
    }
  }
  
  // Check for hiring manager signals
  for (const keyword of hiringManagerKeywords) {
    if (q.includes(keyword)) {
      hiringManagerScore++;
      signals.push(keyword);
    }
  }
  
  // Check for client signals
  for (const keyword of clientKeywords) {
    if (q.includes(keyword)) {
      clientScore++;
      signals.push(keyword);
    }
  }
  
  // Context signals
  if (options.currentPath?.includes("/about")) {
    recruiterScore += 0.5;
    signals.push("on-about-page");
  }
  
  if (options.currentPath?.includes("/contact")) {
    clientScore += 1;
    signals.push("on-contact-page");
  }
  
  const maxScore = Math.max(recruiterScore, hiringManagerScore, clientScore);
  const totalSignals = signals.length;
  
  // High confidence threshold: at least 2 strong signals
  if (maxScore >= 2) {
    if (recruiterScore === maxScore) {
      return {
        intent: "recruiter",
        confidence: Math.min(0.9, 0.6 + (recruiterScore * 0.1)),
        signals,
        audienceReasoning: `Strong recruiter signals detected (${recruiterScore} matches): ${signals.slice(0, 3).join(", ")}`,
      };
    }
    if (hiringManagerScore === maxScore) {
      return {
        intent: "hiring_manager",
        confidence: Math.min(0.9, 0.6 + (hiringManagerScore * 0.1)),
        signals,
        audienceReasoning: `Strong hiring manager signals detected (${hiringManagerScore} matches): ${signals.slice(0, 3).join(", ")}`,
      };
    }
    if (clientScore === maxScore) {
      return {
        intent: "client",
        confidence: Math.min(0.9, 0.6 + (clientScore * 0.1)),
        signals,
        audienceReasoning: `Strong client signals detected (${clientScore} matches): ${signals.slice(0, 3).join(", ")}`,
      };
    }
  }
  
  // Low confidence - return null to trigger LLM fallback
  if (maxScore >= 1) {
    // Medium confidence, but let LLM verify
    return null;
  }
  
  // No clear signals - return null for LLM
  return null;
}

/**
 * Classify intent using Claude Haiku (fallback for low-confidence cases)
 */
async function classifyIntentLLM(
  query: string,
  options: ClassifyIntentOptions = {}
): Promise<IntentProfile> {
  const prompt = `You are an intent classifier for a portfolio website. 

Your job is to classify the user's query into one of these audience types:

1. **recruiter**: User wants a quick overview, skills summary, resume highlights, qualifications. 
   Examples: "Can I see your skills and resume?", "Tell me about yourself", "What's your background?"

2. **hiring_manager**: User wants technical depth, process details, architecture decisions, methodology.
   Examples: "How did you build the Capital One system?", "What's your process?", "Why did you choose that approach?"

3. **client**: User wants to work together, hire services, collaborate, learn about availability.
   Examples: "I might want to hire you", "Can you help with an AI project?", "What are your rates?"

4. **general**: General questions that don't fit the above categories.
   Examples: "Tell me about your work", "What projects have you done?"

Current context:
- Query: "${query}"
- Current path: ${options.currentPath || "unknown"}
- Referrer: ${options.referrer || "unknown"}

Output ONLY a JSON object with this exact structure:
{
  "intent": "recruiter" | "hiring_manager" | "client" | "general",
  "confidence": 0.0-1.0,
  "signals": ["signal1", "signal2"],
  "audienceReasoning": "Brief explanation"
}

Do not include any other text, markdown, or explanation outside the JSON object.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Anthropic");
    }

    let text = content.text.trim();
    
    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      text = jsonMatch[1];
    }
    
    const parsed = JSON.parse(text) as IntentProfile;
    
    // Validate intent
    if (!["recruiter", "hiring_manager", "client", "general"].includes(parsed.intent)) {
      return {
        intent: "general",
        confidence: 0.5,
        signals: ["fallback"],
        audienceReasoning: "Invalid intent returned from LLM, defaulting to general",
      };
    }
    
    return parsed;
  } catch (error) {
    console.error("Error classifying intent with LLM:", error);
    // Fallback to general
    return {
      intent: "general",
      confidence: 0.5,
      signals: ["llm-error"],
      audienceReasoning: "LLM classification failed, defaulting to general",
    };
  }
}

/**
 * Classify user intent (recruiter, hiring_manager, client, general)
 * Uses heuristics first, falls back to LLM if confidence is low
 */
export async function classifyIntent(
  query: string,
  options: ClassifyIntentOptions = {}
): Promise<IntentProfile> {
  // Try heuristic first
  const heuristicResult = classifyIntentHeuristic(query, options);
  
  // If high confidence, return immediately
  if (heuristicResult && heuristicResult.confidence >= 0.7) {
    return heuristicResult;
  }
  
  // If low confidence or no clear signals, use LLM
  const llmResult = await classifyIntentLLM(query, options);
  
  // Merge signals if heuristic found some
  if (heuristicResult && heuristicResult.signals.length > 0) {
    llmResult.signals = [...new Set([...heuristicResult.signals, ...llmResult.signals])];
  }
  
  return llmResult;
}

