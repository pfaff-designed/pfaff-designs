# Cursor Prompt — Phase 9.3 — UI & Interaction Polish

You are working in the **pfaff-designs** repo. Your task is to implement **UI & interaction polish** for the modal assistant in accordance with the V1 Roadmap. This phase focuses on *frontend interaction only* — do NOT modify LangGraph, the backend API, or agent behavior.

---

## 1. Centralize All Modal Invocation Logic

### Goal
All “Ask AI” triggers (hover pills, chips, inline prompts, buttons) must consistently:
- Open the modal
- Dispatch the **same** request format to `/api/ai/modal`
- Provide a unified, predictable interaction experience

### Instructions

### (A) Create a unified modal invocation helper
Create a reusable function or hook, e.g.:
```ts
openAiModal({ question, pagePath, projectSlug, sectionHeadline, sectionText }): void
```
This helper must:
- Open the modal if closed
- Insert a user message in the modal UI state
- Trigger the API call to `/api/ai/modal` using the same request payload shape the modal already expects
- Append the assistant response (including mode) to modal state

Place this helper alongside other modal logic (e.g., inside a `useAiModal` hook or modal provider).

### (B) Update all UI triggers to use this helper
Find and update:
- Hover pills / chips (e.g., “Tools”, “Role”, “Process”, “Overview”)
- Inline prompts within case study sections
- The main site AI trigger(s)

Replace any existing direct API calls or outdated logic with the new unified `openAiModal()` helper.

Ensure all triggers supply:
- `question`
- `pagePath`
- `projectSlug`
- `sectionHeadline`
- `sectionText`

Use existing context utilities (if available) to populate these fields.

---

## 2. Add Subtle Mode-Based UI Hints in the Modal

We already have `mode` carried through from the backend. Now reflect it in the UI in a **user-friendly and subtle** way.

### Instructions

### (A) Update the message bubble component
In the assistant message bubble component (e.g. `ChatMessageBubble`), add a small caption for the first assistant message of each turn:

```tsx
{message.role === "assistant" && message.mode && (
  <div className="mb-1 text-xs text-muted-foreground opacity-80">
    {message.mode === "answer_direct" && "Direct answer"}
    {message.mode === "clarify_then_answer" && "Answer + follow-up"}
    {message.mode === "low_context_fallback" && "Overview from limited context"}
  </div>
)}
```

### Constraints
- This caption **must be user-visible**, not just dev-visible
- Styling should be minimal and consistent with your existing design system
- Do **not** make it a large banner or intrusive element
- Place it immediately above the assistant message’s main content

---

## 3. Ensure Interaction Consistency

After centralizing modal invocation and adding mode hints, verify:
- Hover chips → open modal → send request → mode hint shows
- Inline prompts → open modal → send request → mode hint shows
- Main AI button → same behavior

### Interaction rules
- The modal should never open silently with no user message
- All triggers must behave identically and produce one user message followed by one assistant response

---

## Cursor Checklist
Before stopping, verify:

- [ ] A single helper (e.g. `openAiModal`) now handles ALL modal invocations
- [ ] Hover pills/chips use the unified helper
- [ ] Inline section prompts use the unified helper
- [ ] Main AI button uses the unified helper
- [ ] Assistant bubbles now show subtle user-facing mode hints
- [ ] Interaction feels consistent across all entry points
- [ ] No TypeScript errors introduced
- [ ] No regressions in modal behavior

---

Make these changes now.

---

## 📝 Clarifying Questions

**Date:** 2024-12-19

### 1. Mode Hints — User-Visible vs Dev-Only Conflict

**Issue:** The prompt states mode hints should be **"user-visible, not just dev-visible"** (Section 2, line 69), but we just implemented a dev-only label in Phase 9.2B that uses `process.env.NEXT_PUBLIC_NODE_ENV === "development"`.

**Question:** Should we:
- **Option A:** Make the mode hints user-visible for all users (remove the dev-only check)?
- **Option B:** Keep the current dev-only implementation and update the prompt to reflect this?
- **Option C:** Have two different labels — one dev-only (technical) and one user-facing (simpler language)?

**Recommendation:** Option C seems best — keep the dev label for debugging, add a subtle user-facing hint with friendlier language.

---

### 2. Component Naming — "ChatMessageBubble" vs Actual Component

**Issue:** The prompt references `ChatMessageBubble` (Section 2, line 56), but the actual component appears to be `AiConversationRow`.

**Question:** Should I:
- Update `AiConversationRow.tsx` (the actual component)?
- Or is there a separate `ChatMessageBubble` component I should locate?

**Current State:** `AiConversationRow` already has mode support and a dev-only label.

---

### 3. Modal Invocation Helper — Hook vs Function

**Issue:** The prompt suggests creating `openAiModal()` but doesn't specify if it should be:
- A React hook (e.g., `useOpenAiModal()`)
- A regular function
- Part of the existing `useAiModal` hook

**Question:** 
- Should this be added to the existing `useAiModal` hook from `AiModalContext`?
- Or should it be a separate utility function?
- What's the preferred pattern in this codebase?

**Current State:** There's already a `useAiModal` hook that provides `openFromSelection`, `openGlobal`, `submitQuestion`, etc.

---

### 4. Hover Pills/Chips — Do They Exist?

**Issue:** The prompt mentions "hover pills / chips (e.g., 'Tools', 'Role', 'Process', 'Overview')" but I need to verify these exist in the codebase.

**Question:**
- Where are these hover pills/chips located?
- Are they in case study pages, content sections, or elsewhere?
- What components render them?

**Action Needed:** I'll search the codebase, but confirmation would help ensure I find all instances.

---

### 5. Inline Prompts — Location and Implementation

**Issue:** The prompt mentions "inline prompts within case study sections" but doesn't specify where these are.

**Question:**
- Are these part of `ContentSection` components?
- Are they in case study page templates?
- Do they currently exist, or should they be created?

**Action Needed:** I'll search for existing inline prompt implementations.

---

### 6. Main AI Button — Which Component?

**Issue:** The prompt mentions "The main site AI trigger(s)" but doesn't specify which component(s).

**Question:**
- Is this the ⌘K command palette?
- A button in the header/navigation?
- Multiple triggers that should all use the same helper?

**Action Needed:** I'll search for AI trigger components, but confirmation would help.

---

### 7. Helper Function Parameters — Optional vs Required

**Issue:** The helper signature shows:
```ts
openAiModal({ question, pagePath, projectSlug, sectionHeadline, sectionText }): void
```

**Question:**
- Which parameters are required vs optional?
- Should `pagePath` be derived from `usePathname()` if not provided?
- Should `projectSlug` be derived from `pagePath` if not provided?
- How should we handle missing context gracefully?

---

### 8. Mode Hint Text — User-Friendly Language

**Issue:** The prompt shows:
- "Direct answer"
- "Answer + follow-up"
- "Overview from limited context"

But the current dev label uses:
- "Direct answer"
- "Answer + follow-up"
- "Low-context overview"

**Question:** Should the user-facing hints use the same text, or should they be more conversational (e.g., "Quick answer", "I can go deeper", "General overview")?

---

### 9. Mode Hints — All Messages or First Only?

**Issue:** The prompt says "add a small caption for the **first assistant message of each turn**" (Section 2, line 56, emphasis added).

**Question:**
- Should mode hints appear on **every** assistant message, or only the first one in a conversation turn?
- If only the first, how do we determine "first message of each turn" — is it the first message after a user question?

**Current State:** The dev label currently shows on all assistant messages with a mode.

---

### 10. Existing Modal State Management

**Issue:** The prompt says to "Insert a user message in the modal UI state" and "Append the assistant response" but `AiModalHost` already manages message state.

**Question:**
- Should the helper directly manipulate `AiModalHost`'s internal state?
- Or should it use the existing `useAiModal` state machine methods (`submitQuestion`, `markAnswerReceived`)?
- How should this integrate with the existing state machine?

**Current State:** `AiModalHost` uses local `useState` for messages and calls the API directly.

---

**Recommendation:** Once these questions are answered, I can proceed with a clear implementation plan that aligns with the existing architecture and design patterns.