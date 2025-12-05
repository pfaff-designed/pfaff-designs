"use client";

type PlausibleFn = (eventName: string, options?: { props?: Record<string, any> }) => void;

const safePlausible = (): PlausibleFn | null => {
  if (typeof window === "undefined") return null;
  const plausible = (window as unknown as { plausible?: PlausibleFn }).plausible;
  return typeof plausible === "function" ? plausible : null;
};

const normalizeMode = (mode?: string | null) => {
  const normalized = (mode || "").trim();
  if (normalized === "answer_direct") return "answer_direct";
  if (normalized === "clarify_then_answer") return "clarify_then_answer";
  if (normalized === "low_context_fallback") return "low_context_fallback";
  return "unknown";
};

export function trackAIQuestionAsked(params: {
  pagePath: string;
  projectSlug: string | null;
  question: string;
}): void {
  const plausible = safePlausible();
  if (!plausible) return;

  const length = params.question.trim().length;
  const question_length =
    length <= 80 ? "short" : length <= 200 ? "medium" : "long";

  plausible("ai_question_asked", {
    props: {
      page_path: params.pagePath,
      project_slug: params.projectSlug,
      question_length,
    },
  });
}

export function trackAIAnswerShown(params: {
  pagePath: string;
  projectSlug: string | null;
  mode?: string | null;
}): void {
  const plausible = safePlausible();
  if (!plausible) return;

  const mode = normalizeMode(params.mode);

  plausible("ai_answer_shown", {
    props: {
      page_path: params.pagePath,
      project_slug: params.projectSlug,
      mode,
    },
  });
}

export function trackAIContactClickFromAI(params: {
  pagePath: string;
  projectSlug: string | null;
}): void {
  const plausible = safePlausible();
  if (!plausible) return;

  plausible("ai_contact_click_from_ai", {
    props: {
      page_path: params.pagePath,
      project_slug: params.projectSlug,
    },
  });
}


