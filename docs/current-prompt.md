# Task: Switch modalGraph to use a full ChatPromptTemplate for `generate_answer` (Option 1)

You are working in the **pfaff-designs** repo.

## Goal

Update the **AI modal graph** so that the `generate_answer` node uses a full `ChatPromptTemplate` loaded from LangSmith (slug: `pfaff-modal-graph-generate-answer`), instead of a raw system string.

We want **Option 1**:

- **One unified system message** that contains all rules for the modal.
- **One human message template** that receives variables like `mode`, `question`, `context_blob`, `pagePath`, `projectSlug`, and `retrieved_chunks`.
- No examples for now; just a clean, two-message chat prompt.

This should **not** change the external API contract of `/api/ai/modal` — only how the LLM prompt is built.

---

## 1. Prompt loader changes

**File:** `src/lib/ai/promptLoader.ts`

1. Locate how prompts are currently loaded from LangSmith (for example, anything like `getCopywriterPromptTemplate`, `getPromptTemplate`, or other helpers that load a `ChatPromptTemplate`).

2. Add a new exported helper:

```ts
import { ChatPromptTemplate } from "@langchain/core/prompts";
// … keep existing imports

export async function getModalGraphPromptTemplate(): Promise<ChatPromptTemplate> {
  // Reuse the same LangSmith loading pattern used for other prompts,
  // but with slug "pfaff-modal-graph-generate-answer".

  // Pseudocode shape (adapt to existing utilities):
  //
  // try {
  //   const prompt = await loadPromptFromLangSmith("pfaff-modal-graph-generate-answer");
  //   // Ensure it's a ChatPromptTemplate
  //   return prompt as ChatPromptTemplate;
  // } catch (err) {
  //   console.warn("[PromptLoader] Failed to load modal graph prompt from LangSmith, using fallback", err);
  //   return ChatPromptTemplate.fromMessages([
  //     [
  //       "system",
  //       "You are the AI assistant for Charles Pfaff’s portfolio site. Use ONLY the provided context to answer questions about Charles, his work, skills, and projects. If the context is insufficient, say so briefly and suggest what the user can ask instead. Answer in a concise, recruiter-friendly tone.",
  //     ],
  //     [
  //       "human",
  //       "Mode: {mode}\nPage path: {pagePath}\nProject slug: {projectSlug}\n\nContext:\n{context_blob}\n\nQuestion:\n{question}",
  //     ],
  //   ]);
  // }
}
```

3. Reuse any existing **logging style** from the file (e.g., `[PromptLoader] ...`) so logs are consistent. It’s fine to keep a `console.warn` with the `[PromptLoader]` prefix.

4. If there is an older helper like `getModalGraphSystemPrompt`, **remove it** once all references are updated (see next section).

---

## 2. modalGraph `generate_answer` node changes

**File:** `src/lib/ai/modalGraph.ts`

### 2.1. Update imports

- Import `getModalGraphPromptTemplate` from `promptLoader`:

```ts
import { getModalGraphPromptTemplate } from "./promptLoader"; // adjust relative path as needed
```

- Remove any imports of `getModalGraphSystemPrompt` or old modal system-prompt helpers.

### 2.2. Replace system-string prompt usage

Find the **`generate_answer` node/function** in the modal graph — the part that currently:

- Resolves a **system prompt string** (via `getModalGraphSystemPrompt` or similar).
- Builds an array of messages manually, something like:

```ts
const systemPrompt = await getModalGraphSystemPrompt();
const messages = [
  { role: "system", content: systemPrompt },
  { role: "user", content: /* question + context blob */ },
];
const answer = await llm.invoke(messages, config);
```

Replace that logic so it:

1. Loads a `ChatPromptTemplate`:

```ts
const promptTemplate = await getModalGraphPromptTemplate();
```

2. Renders it into messages using the **existing modal graph state**. At minimum, pass:

- `mode`
- `question`
- `context_blob`
- `pagePath`
- `projectSlug`
- `retrieved_chunks` or a serialized version such as `retrieval_debug_notes` if that already exists

For example:

```ts
const { mode, question, context_blob, pagePath, projectSlug, retrieved_chunks } = state;

const messages = await promptTemplate.formatMessages({
  mode,
  question,
  context_blob,
  pagePath,
  projectSlug,
  retrieved_chunks,
});
```

3. Pass those `messages` to the LLM in the same way the old array was used:

```ts
const llmResponse = await llm.invoke(messages, {
  // keep existing config/metadata (e.g. runName, tags, etc.)
});
```

4. Keep the **rest of the node behavior identical**:

- How we parse/normalize the final answer text.
- How we attach `citations`, `used_chunks`, `mode`, etc. to the returned state.
- How errors are caught and surfaced.

### 2.3. Variable coverage

Make sure that **everything** the old system prompt used (e.g., `context_blob`, `pagePath`, `projectSlug`, debug notes about retrieval) remains available to the template.

If:

- There is a field like `state.retrieval_debug_notes`,
- Or a field representing which page/project we’re on,

then include it in the `formatMessages` call and in the fallback prompt template if needed. It’s fine to add extra variables, even if the LangSmith template doesn’t use all of them yet, as long as they’re serializable.

---

## 3. Cleanup

1. Remove any unused constants or helper functions that were only needed for the old system-string setup (e.g., `MODAL_GRAPH_SYSTEM_PROMPT_TEXT`, `getModalGraphSystemPrompt`).

2. Ensure there are **no remaining references** to the old helper in the repo:

```bash
pnpm test modalGraph.wiring
# or
pnpm test -- modalGraph
```

(or whatever the existing test command is for modalGraph wiring).

3. Confirm that `/api/ai/modal` still:

- Accepts the same payload.
- Returns the same JSON shape.
- Logs no new errors related to prompt loading (unless LangSmith is actually unreachable, in which case we should see the fallback log and still get a valid answer).

---

## 4. Quick manual sanity check

After changes:

1. Run the dev server:

```bash
pnpm dev
```

2. From the home page, open the AI modal and try questions like:

- “What does Charles do?”
- “Tell me about his experience at AKQA.”
- “How should I use this assistant?”

3. Verify:

- The answers are grounded in the KB.
- The tone is concise and recruiter-friendly.
- No `[PromptLoader]` errors appear unless LangSmith is down, in which case the fallback template still works.

---

If anything is ambiguous, prefer to:

- **Reuse existing helper patterns** in `promptLoader.ts`.
- Keep changes localized to **`promptLoader.ts` and the `generate_answer` node** in `modalGraph.ts`.
- Avoid introducing new dependencies beyond what’s already used for prompt templates.
