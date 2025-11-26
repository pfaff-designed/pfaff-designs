## Cursor Prompt — Implement 8.3 `generate_answer` Mode Handling (with Clarifications)

You are working in the **pfaff-designs** repo.  
This section advances **Phase 8.3 — Behavior Definition (Answer Quality)** by updating the `generate_answer` node in the modal graph.

Your goal:  
Make `generate_answer` explicitly use:

- The new `ConversationMode` (`"answer_direct" | "clarify_then_answer" | "low_context_fallback"`),
- The `GENERATE_ANSWER_SYSTEM_PROMPT` constant described below,
- And a structured user message that includes all relevant context.

Do all work in TypeScript, using the existing LangChain / Anthropic setup.  
**Do NOT change the client implementation** — keep using `anthropic.messages.create()`.

---

# 🔧 Clarifications for Cursor (Important)

These clarifications override any ambiguity in earlier prompts:

### **1. DO NOT change the API client**
Keep using:

```ts
anthropic.messages.create({...})
```

The example using `client.invoke([ ... ])` in earlier text was illustrative only.

---

### **2. Use the new structured user message format as the PRIMARY format**
Replace the old free‑form message with a structured, labeled one:

```
QUESTION: ...
MODE: ...
PAGE_PATH: ...
PROJECT_SLUG: ...
SECTION_HEADLINE: ...
SECTION_TEXT: ...
HISTORY_SUMMARY:
...
CONTEXT_SECTION:
...
CONTEXT_BLOB:
...
```

You **must** keep `historySummary` and `contextSection`, but they should appear in labeled sections inside this structured format.

---

### **3. Keep the existing special-case deterministic routing logic**
The current early-return logic for tools, stack, and project listings **must stay**.

Only apply the new system prompt + userContent structure to the **LLM path** (when the early-return logic does not trigger).

---

### **4. Always normalize mode**  
Even though `conversation_policy` usually sets a mode, keep the fallback:

```ts
const effectiveMode: ConversationMode = mode ?? "clarify_then_answer";
```

---

### **5. Replace the fallback error message**
Use this exact text:

```
Something went wrong while generating that answer. I can still help though—try asking again or narrowing the question to a specific project, role, or set of tools.
```

---

### **6. Use the debug note prefix exactly**
All debug notes from this node must begin with:

```
[generate_answer]
```

You must include:

```ts
state.debugNotes.push(`[generate_answer] mode=${effectiveMode}`);
```

---

### **7. HISTORY must remain in the user message**
Include it as:

```
HISTORY_SUMMARY:
<existing summary or "(none)">
```

Do not remove history.  
Do not keep the old message format.  
Fold it into the structured format.

---

# 📌 Now implement 8.3 according to these rules:

---

## 8.3.a — Add / Wire the `GENERATE_ANSWER_SYSTEM_PROMPT` Constant

1. Open:

```
src/lib/ai/modalGraph.ts
```

2. Ensure the file defines:

```ts
const GENERATE_ANSWER_SYSTEM_PROMPT = `...full system prompt from earlier definition...`
```

Replace any existing system prompt used for generate_answer with the full version defined earlier (the multi-section prompt describing behavior for each mode).

---

## 8.3.b — Make `generate_answer` Mode-Aware

Inside `generateAnswerNode`:

```ts
const {
  question,
  mode,
  pagePath,
  projectSlug,
  sectionHeadline,
  sectionText,
  contextBlob,
  historySummary,
  contextSection,
} = state;

const effectiveMode: ConversationMode = mode ?? "clarify_then_answer";

state.debugNotes.push(`[generate_answer] mode=${effectiveMode}`);
```

---

## 8.3.c — Build the Structured User Message

Construct:

```ts
const userContentLines = [
  `QUESTION: ${question}`,
  "",
  `MODE: ${effectiveMode}`,
  "",
  pagePath ? `PAGE_PATH: ${pagePath}` : "",
  projectSlug ? `PROJECT_SLUG: ${projectSlug}` : "",
  sectionHeadline ? `SECTION_HEADLINE: ${sectionHeadline}` : "",
  sectionText ? `SECTION_TEXT: ${sectionText}` : "",
  "",
  "HISTORY_SUMMARY:",
  historySummary ?? "(none)",
  "",
  "CONTEXT_SECTION:",
  contextSection ?? "(none)",
  "",
  "CONTEXT_BLOB:",
  contextBlob ?? "(none)",
].filter(Boolean);

const userContent = userContentLines.join("\n");
```

This is the **only** user message passed to the model.

---

## 8.3.d — Use `GENERATE_ANSWER_SYSTEM_PROMPT` in the Anthropic Call

Modify the call:

```ts
const response = await anthropic.messages.create({
  model: "...",
  system: GENERATE_ANSWER_SYSTEM_PROMPT,
  messages: [
    {
      role: "user",
      content: userContent,
    },
  ],
});
```

Extract `answerText` and store:

```ts
state.debugNotes.push("[generate_answer] answer generated successfully");

return {
  ...state,
  answerText,
};
```

---

## 8.3.e — Preserve AND Replace Fallback

Replace your current error fallback with:

```ts
"Something went wrong while generating that answer. I can still help though—try asking again or narrowing the question to a specific project, role, or set of tools."
```

Ensure you log:

```ts
state.debugNotes.push("[generate_answer] Anthropic error, using fallback answer");
```

---

## 8.3.f — Manual Dev Harness Tests

Test answers for:

### `answer_direct`
- “What tools did you use on this project?”
- Expect: direct answer, **no** follow-up.

### `clarify_then_answer`
- “What other projects has he worked on?”
- Expect: partial answer + **one** follow-up.

### `low_context_fallback`
- No section context.
- “What kind of work does he do?”
- Expect: overview + project names + **one** guiding follow-up.

---

## ✔ Final Checklist for Cursor

- [ ] Keep `anthropic.messages.create()` — do NOT change client format.
- [ ] Replace old message-building logic with the structured labeled format.
- [ ] Keep deterministic special-case shortcut logic.
- [ ] Normalize mode with `mode ?? "clarify_then_answer"`.
- [ ] Use `[generate_answer]` debug note prefix.
- [ ] Use updated fallback string.
- [ ] Verify all behavior in `/api/dev/modal-graph`.

Make these changes now.