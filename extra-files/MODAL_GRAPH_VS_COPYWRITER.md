# Modal Graph vs Copywriter: How They Work Together

## Overview

Your portfolio has **two different AI systems** that serve different purposes:

1. **Copywriter Agent** — Generates structured content blocks for conversational AI responses
2. **Modal Graph** — Orchestrates the conversational flow in the AI modal using LangGraph

They work at different levels of the system and serve different use cases.

---

## The Copywriter Agent

### Purpose
The **Copywriter Agent** is an LLM-based content generator that synthesizes structured JSON content blocks from your Knowledge Base (KB).

### What It Does
- Takes a question, context, retrieved KB chunks, and project facts
- Uses a LangSmith prompt (`pfaff-copywriter-answer-blocks-v3`) to generate structured JSON
- Outputs **AnswerBlocks** — structured content blocks with eyebrow, heading, body, and optional imageId
- Returns a `CopywriterOutput` with an array of 1-5 answer blocks

### Inputs
```typescript
{
  question: string;
  context: string;                    // Merged text from retrieved chunks
  sectionTitle: string;
  sectionBody: string;
  projectShortFacts?: string;         // JSON string of project facts
  retrievedChunks?: RetrievedChunk[]; // Full array of retrieved KB chunks
  globalAboutSections?: string;       // Formatted about/identity sections
  projectId?: string;
  intent?: "recruiter" | "hiring_manager" | "client" | "general";
}
```

### Outputs
```typescript
{
  answer_blocks: [
    {
      type: "answer_block",
      eyebrow: "Overview",
      heading: "Direct 1-sentence answer",
      body: "Markdown-formatted body with **bold** highlights and links",
      imageId: null
    }
  ],
  question_type?: string,
  focus_tags?: string[]
}
```

### Key Characteristics
- **Structured output**: Always returns valid JSON following a strict schema
- **Grounded in KB**: Can only use information from the Knowledge Base
- **Tone-aware**: Follows tone rules from `current-prompt.md` (direct, human, conversational)
- **Single-purpose**: Just generates content blocks, doesn't handle conversation flow

### Where It's Used
- `/api/copywriter` — Direct endpoint for testing copywriter output
- `/api/ai/modal` → Pipeline (planned, not yet implemented)
- `/api/generate` → Full page generation pipeline

---

## The Modal Graph

### Purpose
The **Modal Graph** is a LangGraph-based state machine that orchestrates the entire conversational flow in the AI modal.

### What It Does
- Manages conversation state and context
- Decides how to answer questions (direct, clarify, or fallback)
- Retrieves chunks, builds context blobs, loads project facts
- Generates final answer text (either deterministically or via LLM call)
- Handles multi-turn conversations

### Graph Flow
```
START
  ↓
derive_context      → Load project facts, all projects, normalize slugs
  ↓
retrieve_chunks     → Get relevant KB chunks (currently stubbed for some projects)
  ↓
build_context_blob  → Combine all context into a readable string
  ↓
conversation_policy → Decide on answer mode (answer_direct, clarify_then_answer, low_context_fallback)
  ↓
generate_answer     → Generate answer (deterministic rules OR LLM call)
  ↓
END
```

### Inputs
```typescript
{
  question: string;
  pagePath?: string;
  projectSlug?: string;
  sectionHeadline?: string;
  sectionText?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}
```

### Outputs
```typescript
{
  answerText: string;           // Plain text answer (not structured blocks)
  mode?: "answer_direct" | "clarify_then_answer" | "low_context_fallback";
  debugNotes?: string[];
  // ... other state fields
}
```

### Key Characteristics
- **State management**: Tracks conversation history, context, and decisions
- **Policy-driven**: Has rules for when to answer directly vs clarify
- **Multi-turn aware**: Maintains conversation history across turns
- **Deterministic + LLM hybrid**: Uses rules for simple questions (tools, projects), LLM for complex ones
- **Context-aware**: Knows about page path, project slug, section context

### Where It's Used
- `/api/ai/modal` — The main endpoint for AI modal conversations

---

## How They're Different

| Aspect | Copywriter | Modal Graph |
|--------|-----------|-------------|
| **Purpose** | Generate structured content blocks | Orchestrate conversational flow |
| **Output** | JSON with answer blocks | Plain text answer string |
| **Context** | Just KB chunks + facts | Full conversation state + page context |
| **Decision Making** | None (just content generation) | Policy-based routing (direct/clarify/fallback) |
| **Conversation** | Single-turn only | Multi-turn aware |
| **Structure** | LLM prompt → JSON schema | State machine with nodes |
| **Use Case** | Content synthesis | Conversation orchestration |

---

## Current Architecture

### Where Copywriter IS Used

1. **`/api/generate`** → Full page generation pipeline
   - Uses `runCopywriterPipeline()` which includes copywriter
   - Produces structured PageJSON with answer blocks

2. **`/api/ai/query`** → Global AI query endpoint
   - Uses `runCopywriterPipeline()` conditionally
   - Generates inline answers on case study pages

3. **`/api/copywriter`** → Direct copywriter endpoint
   - Testing/development endpoint
   - Direct access to copywriter output

### Where Copywriter is NOT Used

1. **`/api/ai/modal`** → Modal Graph (LangGraph)
   - Uses its own direct LLM calls
   - Generates plain text answers
   - Does NOT use copywriter

2. **`/api/ai/quick`** → Quick Answer API
   - Lightweight endpoint for fast answers
   - Direct Anthropic API call (no copywriter, no graph)
   - Simple prompt-based system

### AI Modal Flow (What's Actually Implemented)

```
User Question
  ↓
/api/ai/modal
  ↓
Modal Graph (LangGraph)
  ├─ derive_context      → Load project facts
  ├─ retrieve_chunks     → Get KB chunks
  ├─ build_context_blob  → Build context string
  ├─ conversation_policy → Decide mode
  └─ generate_answer     → Generate answer (LLM or deterministic)
  ↓
Plain Text Answer → Frontend
```

**The modal graph currently does NOT use the copywriter.** It generates answers directly via:
1. Deterministic rules (for tools/projects questions)
2. Direct Anthropic API calls (for complex questions)

### Quick Answer Flow (Also Separate)

```
User Question
  ↓
/api/ai/quick
  ↓
Direct Anthropic API Call
  ├─ Simple system prompt
  ├─ Conversation history
  └─ Lightweight response
  ↓
Plain Text Answer → Frontend
```

**Quick answer does NOT use copywriter either** — it's a separate, lightweight endpoint for fast responses.

### Future Architecture (Planned)

The architecture documents suggest a future where the modal graph could use the copywriter:

```
User Question
  ↓
/api/ai/modal
  ↓
Modal Graph (LangGraph)
  ├─ derive_context
  ├─ retrieve_chunks
  ├─ build_context_blob
  ├─ conversation_policy
  └─ generate_answer
      ↓
      Copywriter Agent  ← Generate structured blocks
      ↓
      Structured Answer Blocks → Frontend
```

But this is **not yet implemented**. Right now, the modal graph generates plain text answers directly.

---

## Why Two Separate Systems?

### Copywriter is for Structured Content
- Produces structured JSON that can be rendered as UI components
- Used in page generation (`/api/generate`)
- Could be used for richer modal responses in the future
- Follows strict schemas for validation

### Modal Graph is for Conversation Flow
- Handles the conversational experience (multi-turn, context, policy)
- Produces simple text answers (easier for quick Q&A)
- Manages state across conversation turns
- Makes routing decisions (when to clarify, when to answer directly)

---

## When to Use Which

### Use `/api/copywriter` when:
- Testing the copywriter's content generation
- Generating structured answer blocks for page rendering
- You want JSON output with schema validation

### Use `/api/ai/modal` (Modal Graph) when:
- Handling actual AI modal conversations
- You need multi-turn conversation support
- You want policy-based routing (direct vs clarify)
- You need simple text answers quickly

---

## Key Files

### Copywriter
- `src/lib/ai/copywriter.ts` — Copywriter implementation
- `src/lib/ai/copywriterSchemas.ts` — Input/output schemas
- `src/lib/ai/promptLoader.ts` — LangSmith prompt loading
- `src/app/api/copywriter/route.ts` — Direct copywriter endpoint

### Modal Graph
- `src/lib/ai/modalGraph.ts` — LangGraph state machine definition
- `src/app/api/ai/modal/route.ts` — Modal endpoint that uses the graph
- `src/lib/ai/promptLoader.ts` — Also loads modal graph system prompt

---

## The 405 Error You're Seeing

The error you're getting with `/api/copywriter` is likely because:

1. **LangSmith prompt doesn't exist**: The prompt `pfaff-copywriter-answer-blocks-v3` might not be in LangSmith yet
2. **Missing variables**: The prompt template might not have all the new variables (`section_title`, `section_body`, `retrieved_chunks`, `global_about_sections`)
3. **Prompt loading fails**: The prompt loader throws an error, causing the copywriter to return a fallback

**The modal graph works independently** — it uses its own prompt (`pfaff-modal-graph-generate-answer`) which also shows a 404 in your logs, but the modal graph has fallback prompts built in, so it continues working.

---

## Summary

- **Copywriter** = Content generator (structured JSON blocks)
- **Modal Graph** = Conversation orchestrator (text answers + state management)
- **Quick Answer** = Lightweight fast responses (separate from both)

### Current Usage

**Copywriter IS used by:**
- `/api/generate` → Full page generation
- `/api/ai/query` → Global query endpoint
- `/api/copywriter` → Testing endpoint

**Copywriter is NOT used by:**
- `/api/ai/modal` → Uses modal graph (separate system)
- `/api/ai/quick` → Uses direct LLM calls (separate system)

### The Answer to Your Question

**No, the copywriter is NOT only used by quick answer.** In fact:
- **Quick answer does NOT use the copywriter at all**
- Copywriter is used by the full page generation pipeline (`/api/generate` and `/api/ai/query`)
- Quick answer is a completely separate, lightweight endpoint that just calls Anthropic directly

The copywriter is primarily used for generating structured content blocks in full page layouts, not for the quick answer feature.

