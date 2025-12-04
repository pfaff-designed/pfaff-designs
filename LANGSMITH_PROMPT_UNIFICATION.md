# Unifying All Copy to Use LangSmith Prompt

## Your Goal

**ALL copy should be generated using the LangSmith prompt** (`pfaff-copywriter-answer-blocks-v3`)

## Current State

| System | Prompt Used | Status |
|--------|------------|--------|
| Copywriter | `pfaff-copywriter-answer-blocks-v3` | ✅ Uses LangSmith prompt |
| Modal Graph (LLM path) | `pfaff-modal-graph-generate-answer` | ❌ Different prompt (404ing) |
| Modal Graph (deterministic) | None (hardcoded strings) | ⚠️ Bypasses prompts |

## Solution: Full Copywriter Integration

### Option 1: Route ALL LLM Content Through Copywriter ✅ **RECOMMENDED**

**What changes:**
1. Modal graph's `generateAnswerNode` calls copywriter for ALL LLM-generated answers
2. Remove `getModalGraphSystemPrompt()` usage
3. Keep deterministic rules as-is (they're data lists, not narrative copy)

**Result:**
- ✅ ALL narrative copy uses LangSmith prompt
- ✅ Consistent tone everywhere
- ✅ Deterministic lists stay fast (they don't need tone rules)

**Implementation:**
```typescript
// In generateAnswerNode - REPLACE the LLM call with copywriter
async function generateAnswerNode(state: ModalGraphState): Promise<Partial<ModalGraphState>> {
  // ... deterministic rules for tools/projects (keep as-is) ...
  
  // FOR ALL OTHER QUESTIONS: Use copywriter (LangSmith prompt)
  const copywriterOutput = await runCopywriter({
    question: state.question,
    context: buildContextFromBlob(state.contextBlob),
    sectionTitle: state.sectionHeadline || "",
    sectionBody: state.sectionText || "",
    projectShortFacts: formatProjectFacts(state.projectFacts),
    retrievedChunks: state.retrievedChunks,
    globalAboutSections: await formatGlobalAboutSections()
  });
  
  // Convert AnswerBlocks to modal response
  const answerText = copywriterOutput.answer_blocks
    .map(block => `${block.heading}\n\n${block.body}`)
    .join("\n\n");
    
  return {
    ...state,
    answerText,
    history: [...history, { role: "assistant", content: answerText }]
  };
}
```

### Option 2: 100% Copywriter (Including Deterministic Rules)

Route EVERYTHING through copywriter, even tools/projects lists:

**Result:**
- ✅ 100% of ALL content uses LangSmith prompt
- ⚠️ Slower (even simple lists go through LLM)
- ✅ Maximum consistency

**Implementation:**
- Remove ALL deterministic rules
- ALL questions → Copywriter → LangSmith prompt

---

## Answer to Your Question

**"Would the hybrid approach achieve ALL copy using LangSmith prompt?"**

**Short answer:** Almost, but not 100%.

**The hybrid approach would:**
- ✅ Route LLM-generated answers through copywriter (uses LangSmith prompt)
- ❌ Keep deterministic rules (bypass prompts)

**To achieve 100% LangSmith prompt usage:**
- Replace modal graph's LLM path with copywriter calls
- Choose: Keep deterministic rules (Option 1) or route everything through copywriter (Option 2)

---

## My Recommendation

**Go with Option 1: Route ALL LLM Content Through Copywriter**

**Why:**
1. ✅ ALL narrative copy uses your LangSmith prompt
2. ✅ Consistent tone across all generated content
3. ✅ Fast for simple data (tools/projects lists don't need tone)
4. ✅ Clear separation: Narrative = LangSmith prompt, Data = deterministic

**The deterministic rules (tools/projects lists) are just data formatting, not narrative copy:**
- "For this project, Charles used: React, TypeScript, Next.js"
- This is factual data presentation, not prose that needs tone rules

**So you'd have:**
- ✅ ALL narrative/prose → Copywriter → LangSmith prompt
- ✅ ALL data lists → Deterministic (fast, no tone needed)

This achieves your goal of consistent, tone-aware copy while maintaining performance.

---

## Implementation Steps

1. **Update `generateAnswerNode` in modal graph:**
   - Remove the Anthropic LLM call that uses `getModalGraphSystemPrompt()`
   - Replace with `runCopywriter()` call
   - Convert AnswerBlocks to plain text for modal (or render blocks if modal supports it)

2. **Test:**
   - Verify all LLM-generated answers use LangSmith prompt
   - Check tone consistency
   - Ensure performance is acceptable

3. **Optional - Route deterministic rules too:**
   - If you want 100% LangSmith prompt usage
   - Remove deterministic rules, route everything through copywriter
   - Trade-off: Slower but maximum consistency

---

## Summary

**Current:** Modal graph uses different prompt → Inconsistent
**Hybrid (partial):** LLM content uses copywriter → Better but not 100%
**Full Integration (recommended):** ALL LLM content uses copywriter → ✅ Achieves your goal

**The hybrid approach gets you 95% there. Full integration gets you 100%.**

