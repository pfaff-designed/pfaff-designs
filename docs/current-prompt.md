

# Prompt: Modal Graph Tone & Answer Quality Patch

You are working in the **pfaff-designs** repo.

## Goal

Improve the **AI modal / modal graph answers** so they:

1. Use a consistent, high-quality voice: calm, clear, and a bit like a short **99% Invisible / NPR / NYT Magazine** segment.
2. Lead with a **direct answer to the user’s question**, grounded in the portfolio’s knowledge base (no vague biography filler).
3. Stay **short and scannable** (1–3 short paragraphs, plus optional bullets) with light **markdown formatting** for readability.
4. Avoid generic, résumé-like or “marketing” answers, especially on case study pages.
5. Keep correctness and grounding intact: **no new facts** beyond what’s in the context.

Do **not** change function signatures or overall control flow of the modal graph. We want a **safe, localized patch** that improves tone and answer shape without breaking existing behavior.

---

## Context

- The AI conversation flow is implemented as a **modal graph** (something like `modalGraph`, `ModalGraphState`, `conversationPolicy` / `conversationPolicyNode`, `generateAnswerNode`, etc.).
- There is a **context blob** being built with lines like:
  - `PAGE PATH: /...`
  - `PROJECT: ...`
  - `SECTION: ...`
  - `[PORTFOLIO_FACTS]`, `[PROJECT_FACTS]`, etc.
- The final answer text is stored as something like `answerText` on the modal state.
- Routing modes include values like:
  - `answer_direct`
  - `clarify_then_answer`
  - `low_context_fallback`
- Previously we experimented with a Copywriter agent; for **chat in the modal**, that is now disabled.

Your job in this prompt is to:

1. **Locate** where the LLM prompt for the modal’s final answer is constructed.
2. **Update the prompt text and answer shaping**, without touching the surrounding wiring.
3. **Improve low-context behavior** so it stays helpful and conversational, not just “I don’t have enough information.”

If you’re unsure where to start, search for these clues:

- `build_context_blob` or similar functions.
- debug notes like `"[generate_answer] handled answer_direct via LLM"`.
- references to `mode = "answer_direct"` or `"low_context_fallback"`.
- the code that ultimately calls the LLM and sets `answerText`.

---

## Requirements

### 1. Set the tone: small, reusable system prompt

Find the **system message** (or equivalent) used when calling the LLM for the modal graph answer. Replace or refactor it so the tone is defined as a **small, reusable block** that looks like this (you can adapt exact wording, but keep the intent):

> **SYSTEM (tone & style):**
> - You are a clear, grounded explainer for Charles Pfaff’s portfolio.
> - Your voice is similar to a short segment from 99% Invisible or an NPR/NYTimes feature: calm, curious, precise.
> - Use **short sentences** and **short paragraphs**. Aim for **1–3 paragraphs max**, plus optional bullets.
> - Lead with the **direct answer** to the user’s question, not a preamble.
> - Use light **markdown** for readability: you may bold 1–3 key phrases or section labels, and use short bullet lists when listing tools, roles, or steps.
> - Never use marketing clichés (e.g. "innovative", "passionate", "at its core", "in today’s world").
> - Never invent facts. If the context does not provide something, say what you *can* infer and optionally suggest a clarifying question.
> - Avoid roleplay language (e.g. "I’m just an AI" or "I lean in").

Attach this tone block **before** any task-specific instructions so the model consistently follows it.

### 2. Shape the user-facing answer

In the **user message** (or combined prompt) that you send to the model, ensure the following structure:

1. **Provide context** (page, project, section, facts, retrieved snippets, history) *briefly*, similar to the existing `contextBlob`, but you do not have to change its structure.
2. Then give clear **task instructions**, for example:

> - Answer the user’s question as if you are explaining the work to a thoughtful recruiter or hiring manager.
> - Use the project and portfolio facts above as your source of truth.
> - **Always start by directly answering the user’s question in 1–2 short paragraphs.**
> - If the question is about a **specific project** (you have `projectSlug` and project facts), focus your answer on:
>   - **Client**
>   - **Role**
>   - **What Charles actually did**
>   - **Tools/stack**
>   - **How he worked with other disciplines**
>   - **Impact / why it mattered**
> - Keep the total length under ~220–250 words.
> - Use at least **one bolded phrase** to help scanning.
> - Optionally end with **one short follow-up question** that invites the user to go deeper (for example: "If you’d like, I can walk through how the component system was structured."), but only if it feels natural.

Update the existing prompt template so these rules are clearly expressed. The key is: **lead with the answer**, keep it short, and frame it like a thoughtful explanation of real work.

### 3. Fix project-specific answers vs. generic biography

Right now, answers sometimes fall back to generic biography even when the user is on a **case study page**.

Update the prompt logic so that:

- If `projectSlug` is present **and** project facts are available:
  - Treat the question as **project-scoped by default**.
  - Encourage the model to anchor heavily in that project’s facts.
  - For questions like:
    - "What did you do on this project?"
    - "How did you work with other disciplines here?"
    - "What tools did you use on this?"
  - The answer should:
    - Name the **client** (e.g. Capital One, Coca-Cola, PMI).
    - State the **role**.
    - Describe **what Charles did** in practical, concrete terms.
    - Mention **tools and collaboration**.
    - Highlight **impact** in 1–2 clear sentences.

You can implement this as **additional instructions in the prompt**, keyed off the presence of `projectSlug` and case-study-style phrasing in the question. You do **not** need to rewrite the routing or introduce a new mode; just ensure the prompt text makes the expectation explicit.

### 4. Improve low-context fallback copy (without changing routing)

For now, keep the existing routing modes (`answer_direct`, `clarify_then_answer`, `low_context_fallback`) and when they are chosen — do **not** restructure the graph in this prompt.

Instead, improve the **content** of low-context answers by updating the fallback instructions:

- When the mode is `low_context_fallback`, the model should:
  - Be honest about limited context, but still **offer something useful**.
  - For example:

> - Briefly say what is and isn’t known from the portfolio.
> - Offer one concrete next step: a follow-up question or a suggestion for what the user could ask next.
> - Keep the same tone rules (short, clear, no clichés).

- Avoid answers like:
  - "I do not have enough contextual information to generate a meaningful response."

You can do this by:

- Adding a small conditional block in the prompt instructions when `mode === "low_context_fallback"`.
- Or by slightly altering the existing low-context template to include the behavior above.

### 5. Preserve correctness and avoid regressions

While making these changes:

- **Do not** change function signatures.
- **Do not** change the shape of the state (`ModalGraphState`) or API responses.
- **Do not** re-enable the Copywriter agent for chat.
- **Do not** alter the way `answerText` is stored or returned.
- **Do not** modify the command palette or inline chat behavior.

Limit your changes to:

- The **prompt text** and instructions sent to the LLM.
- The **branch-specific prompt fragments** used for `answer_direct` and `low_context_fallback` (and optionally `clarify_then_answer`).

Add or update inline comments where you adjust the prompt (e.g. `// Tone & answer-shaping patch: Dec 2025`).

---

## Post-Change Smoke Tests

After implementing the prompt updates, manually run a few checks in the dev environment:

1. **Home page (`/`)**
   - Ask: "How does this portfolio use AI?"
   - Expect: 1–2 short paragraphs, clearly describing the RAG + generative UI system, with bolded key phrases and an optional follow-up question.

2. **Capital One Travel page**
   - Ask: "What did you do on this project?" and "How did you work with other disciplines here?"
   - Expect: concrete, project-specific explanations (client, role, tools, collaboration, impact), not generic biography.

3. **Coca-Cola page**
   - Ask: "Tell me about your work on this project" and "How did AI show up here?"
   - Expect: concise, project-focused answers with the new tone and structure.

4. **Low-context scenario** (e.g. page or project with little content)
   - Ask a broad question.
   - Expect: the model says what it can infer, notes what’s missing in a friendly way, and suggests a next question, instead of a hard "I don’t have enough context" wall.

If any of these start returning generic or résumé-like answers, refine the **prompt text only** (not the routing) until they match the desired tone and structure.

- Save all changes.
- Do not commit or run any additional formatting beyond what the repo already uses.