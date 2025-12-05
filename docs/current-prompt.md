# Phase 14 – Plausible Analytics: AI Modal & AI Q&A Instrumentation

You are working in the `pfaff-designs` Next.js repo. Plausible is already wired via `src/components/analytics/PlausibleAnalytics.tsx` and pageview tracking is working. Your job now is to implement **custom Plausible events** for the AI modal and AI-driven contact flows so we can test everything locally (no deployment required).

## Goals

1. Track AI modal usage:
   - When the AI modal opens
   - When the AI modal closes
   - How long it stayed open (duration)
2. Track AI Q&A behavior:
   - When a question is submitted
   - When an answer is shown (with mode, page, and project context)
3. Track AI-assisted contact flows:
   - When a user clicks a contact CTA that is clearly AI-related (from inside the modal or an AI-driven suggestion)

Everything must:
- Be **client-safe** (no crashes if `window` or `plausible` is missing).
- Respect the existing architecture (AI modal context, modal graph, etc.).
- Not change any user-facing behavior other than sending analytics events.

---

## 1. Create a small analytics helper for AI events

**File to create (if it does not exist yet):**
- `src/lib/analytics/ai.ts`

Implement a tiny helper module that wraps Plausible’s `window.plausible` API.

### 1.1. Core helper: `trackPlausible`

Add a function:

```ts
// src/lib/analytics/ai.ts

export type AiEventProps = Record<string, string | number | boolean | null | undefined>;

function trackPlausible(eventName: string, props?: AiEventProps) {
  if (typeof window === "undefined") return;
  const plausible = (window as any).plausible as
    | ((event: string, options?: { props?: AiEventProps }) => void)
    | undefined;

  if (!plausible) return;

  if (props && Object.keys(props).length > 0) {
    plausible(eventName, { props });
  } else {
    plausible(eventName);
  }
}
```

### 1.2. Derive `pagePath` and `projectSlug`

Still in `src/lib/analytics/ai.ts`, add small utilities:

```ts
export function getPagePath(): string {
  if (typeof window === "undefined") return "(server)";
  return window.location.pathname || "/";
}

export function getProjectSlugFromPath(path: string): string | null {
  const match = path.match(/^\/work\/([^/]+)/);
  if (!match) return null;
  let slug = match[1];
  // Keep the same PMI normalization logic used elsewhere in the repo
  if (
    slug === "pmi" ||
    slug === "pmi-agile" ||
    slug === "pmi-acp" ||
    slug.startsWith("pmi-")
  ) {
    slug = "pmi";
  }
  return slug;
}
```

### 1.3. Export event-specific helpers

Still in `src/lib/analytics/ai.ts`, export these higher-level helpers that other components will call:

```ts
export function trackAiModalOpen(params?: { entryPoint?: "keyboard" | "cta" | "unknown" }) {
  const pagePath = getPagePath();
  const projectSlug = getProjectSlugFromPath(pagePath);

  trackPlausible("ai_modal_open", {
    pagePath,
    projectSlug: projectSlug ?? "none",
    entryPoint: params?.entryPoint ?? "unknown",
  });
}

export function trackAiModalClose(params: {
  entryPoint?: "keyboard" | "cta" | "unknown";
  durationMs?: number;
}) {
  const pagePath = getPagePath();
  const projectSlug = getProjectSlugFromPath(pagePath);

  trackPlausible("ai_modal_close", {
    pagePath,
    projectSlug: projectSlug ?? "none",
    entryPoint: params.entryPoint ?? "unknown",
    durationMs: params.durationMs ?? 0,
  });
}

export function trackAiQuestionSubmitted(params: {
  mode: string; // answer_direct | clarify_then_answer | low_context_fallback | unknown
  questionLength: number;
}) {
  const pagePath = getPagePath();
  const projectSlug = getProjectSlugFromPath(pagePath);

  trackPlausible("ai_question_submitted", {
    pagePath,
    projectSlug: projectSlug ?? "none",
    mode: params.mode,
    questionLength: params.questionLength,
  });
}

export function trackAiAnswerShown(params: {
  mode: string; // answer_direct | clarify_then_answer | low_context_fallback | tools | unknown
  questionLength: number;
  answerLength: number;
}) {
  const pagePath = getPagePath();
  const projectSlug = getProjectSlugFromPath(pagePath);

  trackPlausible("ai_answer_shown", {
    pagePath,
    projectSlug: projectSlug ?? "none",
    mode: params.mode,
    questionLength: params.questionLength,
    answerLength: params.answerLength,
  });
}

export function trackAiContactClick(params?: { source?: "ai_modal" | "ai_suggestion" | "unknown" }) {
  const pagePath = getPagePath();
  const projectSlug = getProjectSlugFromPath(pagePath);

  trackPlausible("ai_contact_click", {
    pagePath,
    projectSlug: projectSlug ?? "none",
    source: params?.source ?? "unknown",
  });
}
```

> **Important:** Do not import `next/navigation` in this helper. Use `window.location.pathname` as shown so it can be reused from any client component.

---

## 2. Wire events into the AI modal lifecycle

Now hook these helpers into the existing AI modal system. The goal is to track **open/close/duration** and **Q&A behavior** without changing how the UI behaves.

### 2.1. Find the AI modal entry point

Look for the core modal components:
- `src/components/ai-modal/AiModal.tsx`
- `src/components/ai-modal/AiModalContext.tsx`

Use the component that actually **mounts/unmounts the modal UI** (likely `AiModal` itself, or a wrapper that renders it based on context `isOpen`).

#### Implementation

1. In the component that renders the modal when it is open:
   - Import `trackAiModalOpen` and `trackAiModalClose` from `src/lib/analytics/ai`.

2. Add a `useRef<number | null>` to capture the timestamp when the modal opens:

```ts
const openedAtRef = React.useRef<number | null>(null);
```

3. In an effect that watches `isOpen` (or the equivalent open/closed flag):

```ts
React.useEffect(() => {
  if (isOpen) {
    openedAtRef.current = performance.now();
    trackAiModalOpen({ entryPoint: source ?? "unknown" });
  } else if (openedAtRef.current !== null) {
    const durationMs = performance.now() - openedAtRef.current;
    trackAiModalClose({ entryPoint: source ?? "unknown", durationMs });
    openedAtRef.current = null;
  }
}, [isOpen, source]);
```

- **`source` hint:** if your modal context already has a concept of `source` (e.g., opened via keyboard, CTA click, command palette), pass that through. If not, just hardcode `"keyboard"` for now or use `"unknown"`.

4. Make sure this effect only runs on the client (it will naturally, since the modal is a client component), and that it does not change any existing behavior.

---

## 3. Track AI question submissions and answers

Now instrument the AI Q&A path.

### 3.1. Locate the question submission code

Find the code that:
- Takes the user’s question from the modal input/composer
- Calls the API route for the modal graph (likely `/api/ai/modal-graph` or similar)
- Stores the result in state to render the answer UI

This will probably live in one of:
- `src/components/ai-modal/Composer.tsx` or similar
- `src/components/ai-modal/AiModal.tsx`
- Or a hook under `src/lib/inline-chat` / `src/lib/ai`

### 3.2. Hook `trackAiQuestionSubmitted`

Where the question is sent to the server (just before or right after the fetch call), import and call:

```ts
import { trackAiQuestionSubmitted } from "@/lib/analytics/ai";

// ... inside the submit handler
const trimmed = question.trim();
if (trimmed.length === 0) return;

trackAiQuestionSubmitted({
  mode: responseMode ?? "unknown", // see below for mode
  questionLength: trimmed.length,
});
```

- If you don’t yet have `responseMode` at submit time, you can pass `"unknown"` here and rely more on `ai_answer_shown` below, which *will* have the real mode.

### 3.3. Hook `trackAiAnswerShown`

When the modal receives a successful answer from the server and updates the UI state, call:

```ts
import { trackAiAnswerShown } from "@/lib/analytics/ai";

// Suppose the modal graph response shape includes { mode, answerText, ... }

const mode = response.mode ?? "unknown";
const answerText = response.answerText ?? "";

trackAiAnswerShown({
  mode,
  questionLength: trimmedQuestion.length,
  answerLength: answerText.length,
});
```

Where to find `mode`:
- The modal graph response already includes a `mode` string (as seen in your debug logs: `answer_direct`, `clarify_then_answer`, `low_context_fallback`, etc.). Use that.
- If the field name is different (e.g., `conversationMode`), adjust accordingly.

> **Important:** This event should fire **once per answer** actually rendered to the user—not on retries or errors.

---

## 4. Track AI-driven contact clicks

We want to know when people decide to contact Charles **after interacting with the AI**.

### 4.1. Locate AI-related contact CTAs

Search for:
- Any button/link in the AI modal that navigates to `/contact` or opens a contact flow.
- Any AI-suggested CTA that says things like "Contact Charles" or "Reach out".

This could be:
- Part of the AI modal UI
- Part of an inline chat suggestion
- A dedicated CTA component rendered conditionally after certain answers

### 4.2. Wrap with `trackAiContactClick`

Wherever you have an AI-related contact CTA, update the click handler to:

```ts
import { trackAiContactClick } from "@/lib/analytics/ai";

const handleClick = () => {
  trackAiContactClick({ source: "ai_modal" });
  // existing behavior (router.push("/contact"), open modal, etc.)
  router.push("/contact");
};
```

If there are multiple AI-related entry points, you can use different sources:
- `"ai_modal"` – contact CTA inside the AI modal
- `"ai_suggestion"` – a CTA the AI explicitly suggests in copy
- `"unknown"` – fallback

> **Do not** change the visible labels or navigation behavior—only wrap the click with a tracking call.

---

## 5. Safety & testing

1. **No crashes if Plausible is absent**
   - All tracking must silently no-op if `window.plausible` is missing.
   - This is already handled by `trackPlausible` if you follow the pattern above.

2. **Local testing**
   - Run the dev server and interact with the AI modal.
   - Open the browser devtools console and verify there are **no runtime errors** from `trackAi*` functions.
   - In the Network tab, you should see Plausible `event` calls when you:
     - Open/close the AI modal
     - Submit a question and see an answer
     - Click a contact CTA from the AI flow

3. **Code style**
   - Use TypeScript, match existing import paths and alias style (e.g., `@/lib/...`).
   - Keep the new helper small, focused, and well-typed.

When you’re done, leave a brief comment at the bottom of `src/lib/analytics/ai.ts` summarizing which events are implemented (one-line comment is fine).
