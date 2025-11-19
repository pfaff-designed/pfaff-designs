import { z } from "zod";
import { AnswerBlockSchema, type AnswerBlock } from "@/lib/layout/answerBlock";

/**
 * Copywriter output schema
 * The copywriter must return a JSON object matching this structure
 */
export const CopywriterOutputSchema = z.object({
  answer_blocks: z.array(AnswerBlockSchema).min(1).max(5),
  question_type: z
    .enum([
      "overview",
      "role",
      "tools",
      "process",
      "impact",
      "comparison",
      "general",
    ])
    .optional(),
  focus_tags: z.array(z.string()).optional(),
});

export type CopywriterOutput = z.infer<typeof CopywriterOutputSchema>;

/**
 * Copywriter input type
 * All data needed for the copywriter to generate answer blocks
 */
export type CopywriterInput = {
  question: string;
  context: string; // concatenated retrieved chunks from vector search
  projectId?: string | null;
  sectionTitle: string;
  sectionBody: string;
  projectShortFacts?: {
    client?: string;
    projectNameOrUrl?: string;
    role?: string;
    description?: string;
    yearOrTimeline?: string;
    team?: string;
    keyOutcomes?: string[];
    keySkills?: string[];
  };
  // Intent-driven content strategy
  intent?: "recruiter" | "hiring_manager" | "client" | "general";
  contentGoals?: string[];
  requiredSections?: string[];
};

