import { z } from "zod";

export const AnswerBlockSchema = z.object({
  type: z.literal("answer_block"),
  eyebrow: z.string(),         // e.g. "Overview", "Role", "Tools", etc.
  heading: z.string(),         // 1-sentence direct answer
  body: z.string(),            // markdown with **bold** highlights
  imageId: z.string().nullable().optional(),
});

export type AnswerBlock = z.infer<typeof AnswerBlockSchema>;

