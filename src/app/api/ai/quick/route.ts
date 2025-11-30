import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@/lib/ai/client";
import { QUICK_ANSWER_SYSTEM_PROMPT } from "@/lib/ai/prompts/quickAnswerPrompt";

export interface QuickAnswerRequestBody {
  question: string;
  messages?: Array<{ role: "user" | "assistant"; content: string }>;
  pagePath?: string;
  projectSlug?: string | null;
  sectionHeadline?: string;
  sectionText?: string;
  selectionText?: string;
}

export interface QuickAnswerResponseBody {
  answer: string;
}

/**
 * Quick Answer API
 * 
 * Lightweight endpoint for fast summarization and rewriting tasks.
 * Uses Claude Haiku with minimal context window for speed and cost efficiency.
 */
export async function POST(request: NextRequest): Promise<NextResponse<QuickAnswerResponseBody>> {
  try {
    const body: QuickAnswerRequestBody = await request.json();
    const { question, messages, selectionText, sectionText } = body;

    // Build conversation history
    const conversationMessages: Array<{ role: "user" | "assistant"; content: string }> = [];

    // Add previous messages if provided
    if (messages && messages.length > 0) {
      conversationMessages.push(...messages);
    }

    // Build current user message with context
    const userMessageParts: string[] = [];
    
    if (question) {
      userMessageParts.push(question);
    }
    
    // Add context only on first message (when there's no conversation history)
    if (messages?.length === 0 || !messages) {
      if (selectionText) {
        userMessageParts.push(`\n\nSelected text:\n${selectionText}`);
      }
      
      if (sectionText) {
        userMessageParts.push(`\n\nSection text:\n${sectionText}`);
      }
    }

    const userMessage = userMessageParts.join("");

    // Add current user message
    conversationMessages.push({
      role: "user",
      content: userMessage,
    });

    // Call Anthropic Haiku with conversation history
    const completion = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 300,
      temperature: 0.4,
      system: QUICK_ANSWER_SYSTEM_PROMPT,
      messages: conversationMessages,
    });

    // Extract answer from response
    const answerText =
      completion.content[0]?.type === "text"
        ? completion.content[0].text
        : "I couldn't generate a response. Please try again.";

    return NextResponse.json({ answer: answerText });
  } catch (error) {
    // Return friendly fallback
    return NextResponse.json(
      {
        answer: "Something went wrong fetching a quick answer. Try again in a moment.",
      },
      { status: 500 }
    );
  }
}

