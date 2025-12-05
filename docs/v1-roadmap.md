
# Phase 14.3 — Track AI Question, Answer, and Contact Events

## Goal
Track how people actually use the AI, so we can answer:
- What kinds of questions are they asking?
- Are answers being delivered successfully (and via which mode)?
- How often does the AI lead someone to contact Charles?

This builds on the existing Plausible setup and the AI modal logic.

---

## 1. Events to Implement

Implement these Plausible events:

### A. ai_question_asked
Fired when the user submits a question to the AI (via the AI modal).

**Properties:**
```ts
{
  page_path: string;          // e.g. "/", "/work/capital-one-travel"
  project_slug: string | null; // e.g. "capital-one-travel", "coca-cola", or null
  question_length: "short" | "medium" | "long"; // based on character count
}
```

Recommended buckets:
- `short`   → length <= 80 chars
- `medium`  → 81–200 chars
- `long`    → > 200 chars

### B. ai_answer_shown
Fired when a successful answer is rendered in the AI modal.

This should fire **once per answer**, after the response has been received from the modal graph and is ready to be displayed.

**Properties:**
```ts
{
  page_path: string;
  project_slug: string | null;
  mode: "answer_direct" | "clarify_then_answer" | "low_context_fallback" | "unknown";
}
```

Notes:
- Use the `mode` field returned from the modal graph response if present.
- If `mode` is missing or unexpected, send `"unknown"`.

### C. ai_contact_click_from_ai
Fired when a user clicks a **Contact** CTA from *inside* the AI experience (e.g., a link or button in the AI modal that routes them to the contact section/page or opens an email).

**Properties:**
```ts
{
  page_path: string;          // where they were when they clicked (e.g. the current project page)
  project_slug: string | null;
}
```

This is specifically for **AI-driven** contact behavior, not the regular contact link in the header/footer.

---

## 2. Where to Implement

### Frontend AI Flow

You’ll need to locate the components and hooks that:
- Capture the user’s question
- Call the modal graph/API
- Render the answer
- Render any AI-driven Contact CTAs

Likely places:
- `components/ai-modal/` (e.g., `AiModal.tsx`, `AiModalBody.tsx`, or similar)
- Any hook/util that sends requests to `/api/dev/modal-graph` or the main AI endpoint

**Key integration points:**

1. **ai_question_asked**
   - Hook into the **submit handler** for the AI modal form.
   - Right before sending the network request, call the tracking helper with:
     - `page_path` (from Next router/pathname)
     - `project_slug` (from existing context logic)
     - `question_length` bucket

2. **ai_answer_shown**
   - After the response from the modal graph is received and parsed, and **before/when** the answer is rendered, call the tracking helper with:
     - `page_path`
     - `project_slug`
     - `mode` (from response; fall back to `"unknown"` if needed)

3. **ai_contact_click_from_ai**
   - Find the AI-driven Contact CTAs in the modal output (e.g., buttons/links that navigate to Contact or trigger a contact flow).
   - Attach an `onClick` handler that fires `ai_contact_click_from_ai` **before** performing navigation.

---

## 3. Helper Module

Create a small analytics helper module to keep Plausible calls isolated from UI components.

**File (suggested):** `lib/analytics/ai.ts`

### Shape:

```ts
// lib/analytics/ai.ts

function safePlausible(eventName: string, options?: { props?: Record<string, unknown> }) {
  if (typeof window === "undefined" || typeof window.plausible !== "function") return;
  window.plausible(eventName, options);
}

export function trackAIQuestionAsked(params: {
  pagePath: string;
  projectSlug: string | null;
  question: string;
}) {
  const length = params.question.trim().length;
  let bucket: "short" | "medium" | "long";

  if (length <= 80) bucket = "short";
  else if (length <= 200) bucket = "medium";
  else bucket = "long";

  safePlausible("ai_question_asked", {
    props: {
      page_path: params.pagePath,
      project_slug: params.projectSlug,
      question_length: bucket,
    },
  });
}

export function trackAIAnswerShown(params: {
  pagePath: string;
  projectSlug: string | null;
  mode?: string | null;
}) {
  const normalizedMode: "answer_direct" | "clarify_then_answer" | "low_context_fallback" | "unknown" =
    params.mode === "answer_direct" ||
    params.mode === "clarify_then_answer" ||
    params.mode === "low_context_fallback"
      ? params.mode
      : "unknown";

  safePlausible("ai_answer_shown", {
    props: {
      page_path: params.pagePath,
      project_slug: params.projectSlug,
      mode: normalizedMode,
    },
  });
}

export function trackAIContactClickFromAI(params: {
  pagePath: string;
  projectSlug: string | null;
}) {
  safePlausible("ai_contact_click_from_ai", {
    props: {
      page_path: params.pagePath,
      project_slug: params.projectSlug,
    },
  });
}
```

You can adjust naming to match existing patterns, but keep the event names exactly as specified.

---

## 4. Safety & Constraints

- **No SSR analytics:** Always guard with `typeof window !== "undefined"`.
- **Fail silently** if `window.plausible` is not available.
- Keep the tracking helpers **purely additive** — they must not alter any existing AI behavior.
- Do not change the modal graph API contract.

---

## 5. Definition of Done

- [ ] `ai_question_asked` fires once per question submission from the AI modal, with correct `page_path`, `project_slug`, and `question_length` bucket.
- [ ] `ai_answer_shown` fires once per successful answer render, with the correct `mode` value when available.
- [ ] `ai_contact_click_from_ai` fires whenever the user clicks a **Contact** CTA inside the AI experience.
- [ ] All three events appear in Plausible under **Custom Events**, with props visible in event details.
- [ ] No runtime errors in dev or production, including on initial SSR.
- [ ] Existing AI modal UX and behavior remain unchanged.

---

Proceed with implementing Phase 14.3 once Phase 14.2 is complete.