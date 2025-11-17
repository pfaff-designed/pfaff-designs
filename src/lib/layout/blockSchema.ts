import { z } from "zod";
import { AnswerBlockSchema } from "./answerBlock";

// Re-export AnswerBlockSchema for convenience
export { AnswerBlockSchema } from "./answerBlock";

/**
 * Hero block schema for case study pages
 * Deterministic hero section with project facts
 */
export const HeroCaseStudyBlockSchema = z.object({
  type: z.literal("hero_case_study"),
  projectId: z.string(),
  client: z.string(),
  projectNameOrUrl: z.string(),
  role: z.string(),
  description: z.string(),
  yearOrTimeline: z.string(),
  team: z.string(),
  imageId: z.string().optional(),
});

/**
 * Main block schema as a discriminated union
 * All blocks must have a "type" field to discriminate
 */
export const BlockSchema = z.discriminatedUnion("type", [
  HeroCaseStudyBlockSchema,
  AnswerBlockSchema,
  // Only these two block types are supported in the canonical layout
]);

export type Block = z.infer<typeof BlockSchema>;
export type HeroCaseStudyBlock = z.infer<typeof HeroCaseStudyBlockSchema>;

