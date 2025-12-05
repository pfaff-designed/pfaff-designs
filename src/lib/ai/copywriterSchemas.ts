import { z } from "zod";
import { AnswerBlockSchema, type AnswerBlock } from "@/lib/layout/answerBlock";
import type { RetrievedChunk } from "@/lib/rag/retrieveProjectChunks";

/**
 * Copywriter output schema
 * The copywriter must return a JSON object matching this structure
 */
export const CopywriterOutputSchema = z.object({
  answer_blocks: z.array(AnswerBlockSchema).min(1).max(5),
  question_type: z.string().optional(), // string type as per specification
  focus_tags: z.array(z.string()).optional(),
});

export type CopywriterOutput = z.infer<typeof CopywriterOutputSchema>;

/**
 * Copywriter input type
 * All data needed for the copywriter to generate answer blocks
 */
export type CopywriterInput = {
  question: string;
  context: string; // high-level merged text from retrieved chunks
  sectionTitle: string;
  sectionBody: string;
  projectShortFacts?: string | {
    client?: string;
    projectNameOrUrl?: string;
    role?: string;
    description?: string;
    yearOrTimeline?: string;
    team?: string;
    keyOutcomes?: string[];
    keySkills?: string[];
  }; // JSON string or object of project facts (backward compatible)
  retrievedChunks?: RetrievedChunk[]; // full list of retrieved KB items with metadata
  globalAboutSections?: string; // formatted string from about-global.yaml and identity_longform.YAML
  projectId?: string | null;
  // Intent-driven content strategy
  intent?: "recruiter" | "hiring_manager" | "client" | "general";
  contentGoals?: string[];
  requiredSections?: string[];
};

