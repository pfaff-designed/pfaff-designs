import { NextResponse } from "next/server";
import { modalGraphApp, type ModalGraphState } from "@/lib/ai/modalGraph";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const initialState: Partial<ModalGraphState> = {
      question: body.question ?? "",
      pagePath: body.pagePath,
      projectSlug: body.projectSlug,
      sectionHeadline: body.sectionHeadline,
      sectionText: body.sectionText,
      history: body.history ?? [],
      debugNotes: [],
    };

    console.log("[DevModalGraph] Invoking graph with question:", initialState.question);

    const finalState = await modalGraphApp.invoke(initialState);

    return NextResponse.json({
      ...finalState,
      history: finalState.history ?? [],
    });
  } catch (err) {
    console.error("[DevModalGraph] Error:", err);
    return NextResponse.json(
      { error: "Dev modal graph failed", details: String((err as Error).message ?? err) },
      { status: 500 },
    );
  }
}

