import { modalGraphApp } from "@/lib/ai/modalGraph";
import type { ModalGraphState } from "@/lib/ai/modalGraph";

export type ModalGraphEvalInput = {
  question: string;
  pagePath: string;
  projectSlug: string | null;
  sectionHeadline: string;
  sectionText: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
};

export type ModalGraphEvalOutput = {
  mode: "answer_direct" | "clarify_then_answer" | "low_context_fallback";
  answer: string;
  trajectory: string[];
  debugNotes?: string[];
};

function buildInitialState(input: ModalGraphEvalInput): Partial<ModalGraphState> {
  return {
    question: input.question,
    pagePath: input.pagePath,
    projectSlug: input.projectSlug ?? undefined,
    sectionHeadline: input.sectionHeadline ?? "",
    sectionText: input.sectionText ?? "",
    history: input.history ?? [],
    debugNotes: [],
  };
}

export async function runModalGraphEval(
  input: ModalGraphEvalInput
): Promise<ModalGraphEvalOutput> {
  const initialState = buildInitialState(input);
  const finalState = await modalGraphApp.invoke(initialState);

  const mode =
    (finalState as any).conversationMode ??
    (finalState as any).conversation_mode ??
    (finalState as any).mode ??
    "answer_direct";

  const answer: string =
    (finalState as any).answerText ??
    (finalState as any).answer ??
    (finalState as any).generate_answer?.answer ??
    "";

  const trajectory: string[] =
    (finalState as any).executionSteps ??
    ["derive_context", "retrieve_chunks", "build_context_blob", "conversation_policy", "generate_answer"];

  const debugNotes: string[] = (finalState as any).debugNotes ?? [];

  return {
    mode,
    answer,
    trajectory,
    debugNotes,
  };
}

