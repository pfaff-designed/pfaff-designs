import { NextResponse } from "next/server";
import { runCopywriter } from "@/lib/ai/copywriter";
import type { CopywriterInput } from "@/lib/ai/copywriterSchemas";

export async function POST(req: Request) {
  try {
    const input = (await req.json()) as CopywriterInput;

    const output = await runCopywriter(input);

    // runCopywriter should NEVER throw at this point
    // because generateCopywriterOutputInternal now handles its own fallbacks.
    return NextResponse.json(output);
  } catch (error) {
    // As a last-resort safety net, return a simple fallback
    return NextResponse.json(
      {
        answer_blocks: [
          {
            type: "answer_block",
            eyebrow: "Error",
            heading: "Copywriter error",
            body:
              "Something went wrong while generating this answer. Please try asking a simpler question, or reload the page.",
            imageId: null,
          },
        ],
        question_type: "general",
        focus_tags: [],
      },
      { status: 200 } // ✅ Don't surface a 500 to the frontend anymore
    );
  }
}