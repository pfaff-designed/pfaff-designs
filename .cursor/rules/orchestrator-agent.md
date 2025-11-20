# Orchestrator Agent  
_Updated to reflect the current implementation + planned AI Modal mode_

The Orchestrator Agent is responsible for converting structured **CopywriterOutput JSON** into deterministic UI layout data. Unlike the Copywriter Agent (which produces structured content), the Orchestrator uses explicit rules, schemas, and registry mappings to produce safe, predictable component structures.

The orchestrator currently supports:

1. **Page Mode** – The fully implemented flow.  
2. **AI Modal Mode** – Documented and architected, but not yet implemented. (See Section 7.)

---

# 1. Inputs (Corrected to Match Implementation)

The orchestrator does **not** receive YAML. It receives **CopywriterOutput JSON** produced by the Copywriter Agent.

Current OrchestratorInput (from `src/lib/ai/orchestrator.ts`):

```ts
export interface OrchestratorInput {
  copywriterOutput: CopywriterOutput; 
  intent: IntentResult;
  registrySummary: { components: string[]; categories: string[] };
  questionFocus?: QuestionFocus;
  audienceIntent?: "recruiter" | "hiring_manager" | "client" | "general";
  preferredComponents?: string[];
}
```

### 1.1 CopywriterOutput Schema

(from `src/lib/ai/copywriterSchemas.ts`):

```ts
export const CopywriterOutputSchema = z.object({
  answer_blocks: z.array(AnswerBlockSchema).min(1).max(5),
  question_type: z.enum([...]).optional(),
  focus_tags: z.array(z.string()).optional(),
});
```

### 1.2 What the orchestrator actually receives
- `copywriterOutput.answer_blocks` = the primary unit of layout  
- `intent` = the user’s question intent  
- `questionFocus` = deep-dive or contextual focus  
- `audienceIntent` = recruiter/client/general  
- `preferredComponents` = optional UI hints  
- `registrySummary` = component availability map  

This matches the code and must remain the authoritative input definition.

---

# 2. Output Modes

The orchestrator has **two conceptual modes**, but only one is implemented today.

---

## 2.1 Page Mode (Implemented)

This is the ONLY fully implemented orchestrator flow.

The output shape is **PageJSON**, NOT wrapped in `{ type: "page" }`.

Actual output (from `orchestrator.ts`):

```ts
const result: PageJSON = {
  version: "1",
  page,
};
```

### 2.1.1 PageJSON Schema

PageJSON consists of:

- A version  
- A `page` field containing an ordered list of deterministic layout blocks  

These blocks must conform to:

- `AnswerBlockSchema`
- `HeroCaseStudyBlockSchema`
- `BlockSchema`

(from `@/lib/layout/blockSchema` and `@/lib/layout/answerBlock`)

### 2.1.2 Components Used in Page Mode

The orchestrator currently outputs:

- `CaseStudyHero`  
- `AnswerBlock`  
- (occasionally) supporting blocks depending on data  

Notably, it does **NOT** currently output:

- ContentSection variants  
- Timeline  
- Half-and-Half  
- TwoColumnImage  
- MediaCard  
- ProjectCardGrid  

These are documented for future expansion.

### 2.1.3 Layout Recipe Note

The file contains multiple **legacy layout recipes** (e.g., `caseStudyOverviewRecipe`, `caseStudyToolsRecipe`) in lines 740–904, but they are NOT used in the current implementation.

Today, **layout is entirely driven by `answer_blocks` mapping**, not recipes.

Recipes may be revived if you expand beyond AnswerBlock-driven layouts.

---

## 2.2 AI Modal Mode (Planned, Not Implemented Yet)

The architecture supports a second orchestrator mode for the conversational AI Modal experience.

Status:  
🟡 **Documented + approved**  
🔴 **NOT implemented in `orchestrator.ts` yet**

Planned output shape:

```ts
{
  type: "modal",
  headline: string,
  messages: { role: "user" | "ai"; text: string }[],
  actions: {
    type: "navigate" | "scroll" | "deep_dive";
    label: string;
    target?: string;
    topic?: string;
  }[];
}
```

Clarification:
- This mode will *not* use Renderer.
- Modal content is rendered exclusively by `src/components/ai-modal/*`.

A TODO section has been added below.

---

# 3. Component Registry

The orchestrator uses the real registry at:

```
@/lib/registry/componentRegistry
```

(Not the renderer folder.)

This registry defines:

- Allowed component names  
- Allowed variants  
- Allowed categories  

It mirrors the structure in `component-inventory.md`.

The orchestrator must only output components present in this registry.

---

# 4. Determinism (Expanded)

The orchestrator achieves determinism through:

### 4.1 Deterministic Mapping
Each `answer_block` → exactly one layout block using a stable mapping function.

### 4.2 No Randomness
No shuffling, randomization, or layout variation.  
Same input → same output.

### 4.3 Strict Schemas
All layout blocks must validate against:

```
@/lib/layout/blockSchema
@/lib/layout/answerBlock
```

### 4.4 Stable Component Registry
Only documented + allowed components are used.

### 4.5 Stable Ordering
Answer blocks appear in the order they are provided (unless explicitly reordered by a documented rule).

---

# 5. Media Resolution (New Section)

The orchestrator supports media IDs from the Copywriter Agent.

Implementation (src/lib/ai/orchestrator.ts:979):

```ts
const mediaResolutionMap = await resolveMediaIds(Array.from(mediaIds));
```

### 5.1 Process
1. Extract media IDs from answer blocks  
2. Call `resolveMediaIds`  
3. Replace IDs with:
   - `src` (Supabase URL)  
   - `alt`  
   - `width`, `height`  

### 5.2 Safety
If any media fails to resolve:
- Fallbacks are applied
- Validation logs an error
- The orchestrator continues without crashing

This should be documented as part of the orchestrator’s responsibilities.

---

# 6. Error Handling (Expanded)

Based on actual implementation:

### 6.1 Schema Validation Errors
Invalid blocks → logged → filtered out or replaced with backup blocks.

### 6.2 Media Resolution Failures
Graceful fallback to placeholder images.

### 6.3 Logging
LangSmith is used for:
- Detailed error messages  
- Execution tracing  
- Partial failures  

### 6.4 Component Registry Violations
If a block references a non-allowed component:
- Log error
- Replace or drop block
- Continue execution

### 6.5 Safe Defaults
If layout generation fails entirely:
- Return a minimal page layout with a single fallback AnswerBlock

---

# 7. AI Modal Mode — TODO Plan

Since Modal Mode is NOT yet implemented, the document must reflect that.

### 7.1 Implementation Path
The orchestrator will gain a second function:

```ts
generateModalJSON(copywriterOutput, intent, context?): ModalResponse
```

### 7.2 Trigger Conditions
Used when:
- Selection → “Ask AI About This”
- ⌘K questions
- Deep dive actions
- Composer follow-ups

### 7.3 Output Will Not Use Renderer
Modal output is mapped directly into:
- AiModal
- AiConversationRow
- AiActionsRow

### 7.4 Required Fields
- Headline summarizing user question
- Combined history messages
- Navigation/scroll/deep_dive actions

### 7.5 Determinism Requirements
Same input + history → same modal card output.

---

# 8. Pipeline Context (New Section)

The orchestrator is Stage 3 of the pipeline:

```
1. Retrieval → 
2. Copywriter → 
3. Orchestrator → 
4. Renderer (Page Mode only)
```

Modal flow:

```
Selection / Command → 
API route → 
Copywriter → 
Orchestrator (Modal Mode) → 
AiModal (NO renderer)
```

Renderer is **not** involved in conversational responses.

---

# 9. Legacy Code Note

The file `orchestrator.ts` contains:

- Legacy recipe functions (740–904)
- Unused layout-generation ideas
- Older mappings for ContentSection variants

Current implementation intentionally bypasses them.

These are safe to keep for reference but should not be used unless rewritten into new patterns.

---

# 10. Summary

This updated document now reflects the real state of the orchestrator:

- Accepts JSON (CopywriterOutput), NOT YAML  
- Produces PageJSON directly  
- Uses AnswerBlock + CaseStudyHero  
- Validates through `@/lib/layout/blockSchema`  
- Uses componentRegistry from `@/lib/registry/componentRegistry`  
- Includes media resolution  
- Contains legacy recipes  
- Supports determinism  
- Modal Mode is documented but not yet implemented  

This version is now fully aligned with the current code and architecture.