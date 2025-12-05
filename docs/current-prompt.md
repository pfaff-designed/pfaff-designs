## Phase 14.3 — Implement AI Analytics Events (Plausible)

You are working on Phase 14.3 of the pfaff.design portfolio.

The goal of this task is to **implement Plausible analytics events for the AI modal**, so we can understand how people use the AI and how often it leads to contact.

Use the spec in `docs/v1-roadmap.md` under **Phase 14.3 — Track AI Question, Answer, and Contact Events** as the source of truth, and follow these instructions carefully.

---

### 1. Create AI analytics helpers

1. Create a new file `lib/analytics/ai.ts` with the following behavior:

   - Implement a small internal `safePlausible` helper that:
     - Checks `typeof window !== "undefined"`.
     - Checks that `window.plausible` is a function.
     - Fails silently if either check fails.
   - Export three functions with these exact names and shapes:

     ```ts
     export function trackAIQuestionAsked(params: {
       pagePath: string;
       projectSlug: string | null;
       question: string;
     }): void;
     ```

     - Compute `length = params.question.trim().length`.
     - Derive a `question_length` bucket:
       - `"short"` if `length <= 80`
       - `"medium"` if `length <= 200`
       - `"long"` if `length > 200`
     - Call `safePlausible("ai_question_asked", { props: { page_path, project_slug, question_length } })` with:
       - `page_path: params.pagePath`
       - `project_slug: params.projectSlug`
       - `question_length: bucket`

     ```ts
     export function trackAIAnswerShown(params: {
       pagePath: string;
       projectSlug: string | null;
       mode?: string | null;
     }): void;
     ```

     - Normalize `params.mode` into one of:
       - `"answer_direct" | "clarify_then_answer" | "low_context_fallback" | "unknown"`
     - If `params.mode` is not one of the three known values, use `"unknown"`.
     - Call `safePlausible("ai_answer_shown", { props: { page_path, project_slug, mode } })` with:
       - `page_path: params.pagePath`
       - `project_slug: params.projectSlug`
       - `mode: normalizedMode`

     ```ts
     export function trackAIContactClickFromAI(params: {
       pagePath: string;
       projectSlug: string | null;
     }): void;
     ```

     - Call `safePlausible("ai_contact_click_from_ai", { props: { page_path, project_slug } })` with:
       - `page_path: params.pagePath`
       - `project_slug: params.projectSlug`

2. Do **not** import these helpers anywhere else yet; first implement them cleanly and make sure there are no TypeScript or build errors.

3. These helpers must be **purely additive** and never throw at runtime, even when Plausible is not loaded.

---

### 2. Wire up events into the AI modal flow

Next, find the components and hooks that power the AI modal and wire in the three events at precise points in the flow.

Use the existing structure of `components/ai-modal/` and any related hooks as your guide. Do **not** change the AI behavior; only add analytics calls.

#### 2.1. Locate AI modal components

- Identify:
  - The component that renders the AI modal UI (likely `AiModal.tsx` or similar).
  - The composer/input component where users type their question.
  - The function/hook that sends the request to the modal graph endpoint (e.g., `/api/dev/modal-graph` or the main AI endpoint).
  - The place where the answer state is set and the response mode (`answer_direct`, `clarify_then_answer`, `low_context_fallback`) is available.

While exploring the code, prefer:
- Existing props and context that already expose `pagePath` or `projectSlug`.
- If not present, derive `pagePath` from the router (`usePathname()` or equivalent) and `projectSlug` from the existing page context logic (e.g., the route slug like `"capital-one-travel"`, `"coca-cola"`, `"pmi"`).

Do **not** invent new ways of tracking page context if a canonical way already exists.

#### 2.2. Fire `ai_question_asked` on submit

- In the AI modal’s **submit handler** (where the user’s question is sent to the backend):

  1. Before you send the network request to the modal graph, call:

     ```ts
     trackAIQuestionAsked({
       pagePath: /* current page path, e.g. from router or context */,
       projectSlug: /* current project slug or null */,
       question: /* raw question string from the input */,
     });
     ```

  2. Use the existing input value as `question`.
  3. Make sure this fires **once per question submission**.
  4. Guard the call so it only runs in the browser (the helper already guards against SSR, but don’t call it from server-only code).

#### 2.3. Fire `ai_answer_shown` when an answer is rendered

- Find where the AI response from the modal graph is resolved and committed to state for rendering in the modal.

  1. After the response has been received and is considered “successful” (i.e., the UI will show an answer), call:

     ```ts
     trackAIAnswerShown({
       pagePath: /* current page path */,
       projectSlug: /* current project slug or null */,
       mode: /* response mode from the modal graph, if available */,
     });
     ```

  2. Use the `mode` value returned from the backend (e.g., `answer_direct`, `clarify_then_answer`, `low_context_fallback`) if present.
  3. If the response doesn’t contain a recognizable mode, pass `undefined` and let the helper normalize to `"unknown"`.
  4. Ensure this fires **once per successful answer**, not on every re-render.

- Do **not** fire this event:
  - On errors.
  - On aborted/cancelled requests.
  - On low-level debug output.

#### 2.4. Fire `ai_contact_click_from_ai` when the AI drives contact

- Identify any **Contact CTAs** that are **rendered as part of the AI experience**, e.g.:

  - Buttons or links inside the AI modal that:
    - Navigate to the Contact page/section.
    - Open an email client.
    - Trigger a contact-specific action.

- For each of these CTAs:

  1. Wrap the click handler to call:

     ```ts
     trackAIContactClickFromAI({
       pagePath: /* current page path when clicked */,
       projectSlug: /* current project slug or null */,
     });
     ```

  2. Call the tracking function **before** performing navigation or closing the modal.
  3. Do **not** fire this for:
     - Regular header/footer contact links.
     - Non-AI-related contact CTAs elsewhere in the UI.

- If there is currently no explicit AI-driven contact CTA, add:
  - A subtle “Contact Charles” button or link rendered in AI responses when appropriate, and wire the tracking event into its click handler.

---

### 3. Safety, SSR, and constraints

- Do not import `window` in any server-only module or file that runs during SSR.
- The `lib/analytics/ai.ts` helpers should only be used from client components.
  - If a file is currently server-only, do **not** convert it to a client component unless absolutely necessary; instead, call the helpers from an existing client boundary (e.g., the modal UI or composer component).
- All analytics calls must be **best-effort only**:
  - Never block the AI request.
  - Never throw or break the UI if Plausible is missing or misconfigured.

---

### 4. Definition of Done

Update code and then manually validate:

1. `ai_question_asked`:
   - Fire one question from the AI modal on the Home page and on at least one case study page.
   - In Plausible’s “Custom Events” view, confirm:
     - Event `ai_question_asked` appears.
     - `page_path` matches the page (`"/"`, `"/work/capital-one-travel"`, etc.).
     - `project_slug` matches the project slug or `null`.
     - `question_length` is correctly bucketed (`short`, `medium`, `long`).

2. `ai_answer_shown`:
   - Ask a few questions that route through different modes (`answer_direct`, `clarify_then_answer`, `low_context_fallback`).
   - Confirm that:
     - Event `ai_answer_shown` appears.
     - `mode` matches the mode returned from the backend when available.
     - Unknown/missing modes show up as `"unknown"`.

3. `ai_contact_click_from_ai`:
   - Trigger at least one AI-driven contact CTA from inside the AI experience.
   - Confirm that:
     - Event `ai_contact_click_from_ai` appears.
     - `page_path` and `project_slug` reflect where the user was when they clicked.

4. No regressions:
   - AI modal opens and closes as before.
   - Questions submit and answers render normally.
   - No new console errors in dev.
   - The app builds and runs in production mode.