# Cursor Task — Upgrade Conversation Policy for Portfolio Questions & Tighten Low-Context Prompt

You’re working in the `pfaff-designs` repo.
We’ve recently:
- Injected `[PORTFOLIO_FACTS]` into every `contextBlob`.
- Added a dedicated `low_context_fallback` branch in `generate_answer`.
- Gated Copywriter refinement to safer modes.

This helped, but portfolio questions like:

> "How does this portfolio use AI?"

still sometimes behave like generic low-context queries, especially when asked from project pages like `/work/capital-one-travel`.

We want to more explicitly privilege **portfolio / site questions** in `conversation_policy` and tighten the behavior of `low_context_fallback` answers so they feel like the rubric we defined in Phase 8.

Please make the changes below.

---

## 1. Upgrade `conversation_policy` for Portfolio Questions

**Goal:** When a user clearly asks about **the portfolio/site itself**, the agent should:
- Treat the question as **portfolio-wide**, regardless of the current page.
- Prefer `answer_direct` or `clarify_then_answer` (instead of automatically falling into `low_context_fallback`).
- Use the existing `[PORTFOLIO_FACTS]` context to talk about:
  - RAG pipeline
  - Copywriter + Orchestrator workflow
  - Deterministic JSON UI / component registry
  - Cmd+K command palette & conversational modal

### Steps

1. Open the `conversation_policy` node file.
   - Look for debug messages like `"[conversation_policy]"` or logic that sets `state.mode`.

2. Introduce a small helper or inline logic to detect **portfolio/site questions** from the raw question text:

   ```ts
   function isPortfolioQuestion(question: string): boolean {
     const q = question.toLowerCase();

     return (
       q.includes("portfolio") ||
       q.includes("this site") ||
       q.includes("this website") ||
       q.includes("this experience") ||
       q.includes("this interface") ||
       q.includes("pfaff.design") ||
       q.includes("your site")
     );
   }
   ```

   (If you prefer, you can inline this instead of a separate function.)

3. At the top of the `conversation_policy` logic (before the usual `mode` selection heuristics), compute:

   ```ts
   const portfolioQuestion = isPortfolioQuestion(state.question ?? "");
   ```

4. If `portfolioQuestion` is `true`, override the mode selection with a simple heuristic **before** the low-context rules run. For example:

   ```ts
   if (portfolioQuestion) {
     // Choose between answer_direct vs clarify_then_answer based on simplicity
     const q = (state.question ?? "").trim();
     const isShort = q.length <= 140; // short, direct questions

     const chosenMode: ConversationMode = isShort
       ? "answer_direct"
       : "clarify_then_answer";

     return {
       ...state,
       mode: chosenMode,
       debugNotes: [
         ...(state.debugNotes ?? []),
         `[conversation_policy] portfolioQuestion=true mode=${chosenMode}`,
       ],
     };
   }
   ```

   Notes:
   - Do **not** introduce a new `effectiveProjectSlug` or change existing state shape.
   - The presence of `[PORTFOLIO_FACTS]` in `contextBlob` is already enough for `generate_answer` to talk about the portfolio.
   - This block should **run before** any generic `low_context_fallback` decision.

5. Keep all existing routing logic for non-portfolio questions intact. Only add this early portfolio-question override.

---

## 2. Tighten the `low_context_fallback` System Prompt

**Goal:** Make low-context answers feel closer to the Phase 8 behavioral spec:
- Warm, recruiter-friendly tone.
- No AI-speak (no "As an AI…", no "leveraging cutting-edge technologies" boilerplate).
- Clear structure:
  - 2–3 sentences on how the portfolio/Charles’s work use AI.
  - 1–2 sentences tying in 2–3 **named projects**.
  - Exactly **one** warm follow-up question.
- Never apologize for limited context.

This applies **especially** when a portfolio question still ends up in `low_context_fallback` (e.g., homepage with minimal context).

### Steps

1. Open the `generate_answer` node file.
   - Find the `if (state.mode === "low_context_fallback") { ... }` branch you added earlier.

2. Update the `system` message content in the Anthropic (or equivalent) call to reflect the stronger rubric.
   - Keep the existing structure (array of strings joined with `"\n"`), but expand it along these lines:

   ```ts
   text: [
     "You are helping a recruiter or hiring manager understand Charles Pfaff and his AI-powered portfolio.",
     "You are in LOW CONTEXT FALLBACK mode.",
     "You MAY NOT apologize for limited context or say that you do not have enough information.",
     "Use the provided context, including [PORTFOLIO_FACTS] and the project list, as truth.",
     "",
     "Your job:",
     "- In 2–3 sentences, describe how this portfolio and Charles's work use AI (RAG, multi-agent orchestration, generative UI, deterministic JSON components).",
     "- In 1–2 sentences, mention 2–3 representative projects by name (for example: Capital One Travel, PMI, Tanger, Coca-Cola AI concept, the pfaff.design portfolio).",
     "- End with exactly ONE warm, guiding follow-up question.",
     "",
     "If the question is about 'this portfolio' or 'this site', focus on the portfolio's AI architecture and behavior — not just a generic biography.",
     "Avoid generic AI marketing language and avoid phrases like 'cutting-edge' unless grounded in the given context.",
   ].join("\n"),
   ```

3. Ensure the branch still:
   - Returns early with a new state that includes the `answerText`.
   - Appends a debug note like `"[generate_answer] handled low_context_fallback via LLM"`.
   - Uses the existing error fallback message if the LLM call fails.

4. Do **not** change the Copywriter gating logic in this step. We still want `low_context_fallback` on normal project pages to **skip** Copywriter refinement (as previously implemented).

---

## 3. Sanity Check: Portfolio Questions From Anywhere

After implementing 1 & 2, please sanity-check behavior using the dev harness at `/api/dev/modal-graph` (or equivalent test harness) with POST bodies like:

```json
{
  "question": "How does this portfolio use AI?",
  "pagePath": "/work/capital-one-travel",
  "projectSlug": "capital-one-travel",
  "history": []
}
```

and:

```json
{
  "question": "What is this site doing with AI behind the scenes?",
  "pagePath": "/",
  "projectSlug": "pfaff-designs-portfolio",
  "history": []
}
```

Confirm that:
- `conversation_policy` sets `mode` to either `answer_direct` or `clarify_then_answer` when `isPortfolioQuestion` is true.
- `generate_answer` produces:
  - A clear explanation of how the portfolio uses AI (RAG, Copywriter + Orchestrator, JSON UI, Cmd+K, modal).
  - 2–3 named projects.
  - Exactly one follow-up question.
  - No apologies about context or "I do not have enough information".

---

## Checklist (Cursor, please verify before you’re done)

- [ ] `conversation_policy` now detects portfolio/site questions via `isPortfolioQuestion` (or equivalent) based on the raw question text.
- [ ] For portfolio questions, `conversation_policy`:
  - [ ] Sets `mode` to `answer_direct` for short, direct questions.
  - [ ] Sets `mode` to `clarify_then_answer` for longer / more complex questions.
  - [ ] Logs a debug note like `[conversation_policy] portfolioQuestion=true mode=...`.
- [ ] Non-portfolio questions still follow the existing mode routing logic.
- [ ] The `low_context_fallback` system prompt has been updated to:
  - [ ] Forbid apologies / "not enough context" language.
  - [ ] Require 2–3 sentences on how the portfolio and work use AI.
  - [ ] Require 2–3 named projects.
  - [ ] Require exactly one warm follow-up question.
- [ ] For portfolio questions tested via `/api/dev/modal-graph`, the final `answerText`:
  - [ ] Talks concretely about the portfolio’s AI system (RAG, agents, JSON UI, command palette).
  - [ ] Mentions at least 2 projects (e.g., Capital One Travel, PMI, Tanger, Coca-Cola, pfaff.design portfolio).
  - [ ] Ends with a single, friendly follow-up question.
  - [ ] Does **not** include "I don't have enough context" or similar language.
- [ ] No public types or external interfaces consumed by the UI were broken.
