# Full Page Generation vs AI Modal

## Summary

Yes! You have **two separate systems**:

1. **Full Page Generation** → `/api/generate` and `/api/ai/query`
2. **AI Modal** → `/api/ai/modal`

---

## 1. Full Page Generation

### Endpoints

**`/api/generate`** - Intent-driven full page generation
- Uses: Copywriter → Orchestrator → Renderer pipeline
- Output: Complete `PageJSON` with structured layout blocks
- Use case: Generate entire pages dynamically

**`/api/ai/query`** - Global AI query endpoint
- Uses: Copywriter → Orchestrator → Renderer pipeline (conditionally)
- Output: `PageJSON` for inline answers + suggestions
- Use case: Generate answer blocks inline on pages (e.g., case studies)

### Flow

```
User Query
  ↓
/api/generate or /api/ai/query
  ↓
runCopywriterPipeline()
  ├─ RAG Retrieval → Get KB chunks
  ├─ Copywriter → Generate structured answer blocks (JSON)
  ├─ Orchestrator → Convert blocks to PageJSON layout
  └─ Renderer → Renders PageJSON into React components
  ↓
Full Page Layout (with structured content blocks)
```

### What It Produces

- Structured `PageJSON` with:
  - Hero sections
  - Content sections
  - Answer blocks (with eyebrow, heading, body)
  - Media galleries
  - Navigation elements

### Frontend Usage

Used by components that need to render full page layouts:
- `GlobalComposer` → `/api/ai/query` for inline answers
- Any component needing structured page generation → `/api/generate`

---

## 2. AI Modal

### Endpoint

**`/api/ai/modal`** - Conversational AI modal
- Uses: Modal Graph (LangGraph state machine)
- Output: Plain text answer + conversation mode + actions
- Use case: Quick Q&A in a modal overlay

### Flow

```
User Question
  ↓
/api/ai/modal
  ↓
Modal Graph (LangGraph)
  ├─ derive_context → Load project facts
  ├─ retrieve_chunks → Get KB chunks (currently stubbed)
  ├─ build_context_blob → Build context string
  ├─ conversation_policy → Decide mode (direct/clarify/fallback)
  └─ generate_answer → Generate answer (deterministic rules OR LLM)
  ↓
Plain Text Answer + Mode + Actions
```

### What It Produces

- Plain text answer (not structured blocks)
- Conversation mode (`answer_direct`, `clarify_then_answer`, `low_context_fallback`)
- Smart actions (scroll, navigate, suggest question)
- Debug notes (dev mode only)

### Frontend Usage

Used by the AI Modal component:
- `AiModalHost` → Calls `/api/ai/modal` for each question
- Maintains conversation history in the modal
- Shows plain text answers in a conversation card

---

## Key Differences

| Aspect | Full Page Generation | AI Modal |
|--------|---------------------|----------|
| **Endpoint** | `/api/generate` or `/api/ai/query` | `/api/ai/modal` |
| **Uses Copywriter?** | ✅ Yes | ❌ No |
| **Uses Orchestrator?** | ✅ Yes | ❌ No |
| **Uses Modal Graph?** | ❌ No | ✅ Yes |
| **Output Format** | Structured `PageJSON` | Plain text + actions |
| **Output Type** | Layout blocks (AnswerBlock, ContentSection, etc.) | Text string |
| **Rendering** | Full page components | Conversation card |
| **Conversation** | Single-turn | Multi-turn |
| **Use Case** | Generate full pages | Quick Q&A in modal |

---

## Architecture Diagrams

### Full Page Generation

```
User Query: "Tell me about Capital One"
  ↓
/api/generate
  ↓
RAG → Retrieve KB chunks about Capital One
  ↓
Copywriter → Generate structured answer blocks:
  [
    { eyebrow: "Overview", heading: "...", body: "..." },
    { eyebrow: "Role", heading: "...", body: "..." }
  ]
  ↓
Orchestrator → Convert to PageJSON:
  {
    version: "1",
    page: {
      blocks: [
        { component: "HeroCaseStudy", ... },
        { component: "ContentSection", ... },
        { component: "AnswerBlock", ... }
      ]
    }
  }
  ↓
Renderer → Renders as React components
  ↓
Full page layout displayed
```

### AI Modal

```
User Question: "What tools did you use?"
  ↓
/api/ai/modal
  ↓
Modal Graph:
  - derive_context → Load Capital One project facts
  - retrieve_chunks → Get relevant chunks (or stubbed data)
  - build_context_blob → Combine into string
  - conversation_policy → Detect it's a tools question → answer_direct
  - generate_answer → Use deterministic rules:
    "For this project, Charles used:
    - React
    - TypeScript
    - Next.js
    ..."
  ↓
Response:
  {
    answer: "For this project, Charles used: ...",
    mode: "answer_direct",
    actions: [
      { type: "suggest_question", ... },
      { type: "scroll", targetSectionId: "tools" }
    ]
  }
  ↓
Modal displays plain text answer
```

---

## When to Use Which

### Use Full Page Generation (`/api/generate` or `/api/ai/query`) when:

- You need structured content blocks
- You want to render full page layouts
- You need the Copywriter + Orchestrator pipeline
- You want answer blocks with eyebrow, heading, body structure
- You need media galleries, hero sections, etc.

### Use AI Modal (`/api/ai/modal`) when:

- You want quick conversational Q&A
- You need multi-turn conversation support
- You want plain text answers (not structured blocks)
- You need policy-based routing (direct vs clarify)
- You're building the modal overlay experience

---

## Current State

✅ **Full Page Generation** - Fully implemented
- Copywriter + Orchestrator + Renderer pipeline working
- Produces structured PageJSON layouts

✅ **AI Modal** - Fully implemented  
- Modal Graph (LangGraph) working
- Produces plain text answers
- Handles conversation state

❌ **Not yet connected**
- The modal graph doesn't use the copywriter
- They're separate systems serving different purposes

---

## Summary

You have **both systems working**:

1. **Full page generation** = `/api/generate` + `/api/ai/query` → Uses Copywriter pipeline → Structured layouts
2. **AI modal** = `/api/ai/modal` → Uses Modal Graph → Plain text conversations

They serve different use cases and can coexist. The modal is for quick Q&A, the page generation is for structured content layouts.

