# V1 Roadmap — Generative‑UI Portfolio  
*A fully conversational, AI‑enhanced, editorial portfolio experience.*

This roadmap reflects **actual development from Nov 8 → Nov 26, 2025**, including:
- Phases that existed before the roadmap was formalized  
- Phases that were deleted, merged, or re‑scoped  
- Accurate time estimates and real time spent  
- A clean forward‑looking plan  
- Embedded **Phase History** sections at the bottom of each phase  

This document is a **living artifact** intended to guide future projects and establish realistic expectations for similar builds.

---

# Phase 1 — Foundations & Early Architecture  
**Status: Complete**  
**Time: ~18–22 hrs (Nov 8–12)**

### 1.1 Framework & Runtime Setup
- Next.js 14 (App Router)
- React 18
- TypeScript 5
- Tailwind 4 + PostCSS + Autoprefixer
- shadcn/ui (Radix Primitives)
- Storybook for local component development

### 1.2 Initial Generative‑UI Architecture
- Sketch the “two‑agent pipeline”:  
  Copywriter (YAML) → Orchestrator (JSON) → Renderer (deterministic UI)
- Defined schemas for:
  - Components  
  - Blocks  
  - Pages  
- Designed strict JSON → React mapping rules

### 1.3 First Modal Assistant Prototype (Non‑LangGraph)
- Early conversational assistant using Anthropic Haiku
- Direct LLM → UI pipeline
- Useful prototype, but:
  - No determinism  
  - No mode routing  
  - No evaluation or debugging surface  
  - Unstable behavior

---

#### 📘 Phase History (Nov 8–12)
- Nov 8: Project bootstrapped; initial modal assistant introduced.  
- Nov 9–10: Early pipeline defined (Copywriter → Orchestrator → Renderer).  
- Nov 11: Recognized need for deterministic agent behavior → LangGraph direction established.  
- Nov 12: Phase 1 declared complete.

---

# Phase 2 — RAG & Knowledge Base Setup  
**Status: Complete**  
**Time: ~10–12 hrs (Nov 10–13)**

### 2.1 KB Import & Formatting
- Imported longform + shortform project KB:
  - Capital One  
  - PMI  
  - Tanger  
  - Coke  
  - Portfolio metadata  
- Standardized formats: `.yaml`, `.json`, `.md`.

### 2.2 RAG Stubbed Implementation
- Implemented vector store loader (Supabase embeddings)
- Added chunk retrieval helper
- Early retrieval → Copywriter prompt wiring

### 2.3 Copywriter Agent Structure (Pre‑LangGraph)
- Non‑deterministic but functional YAML generator  
- Used for early page composition

---

#### 📘 Phase History (Nov 10–13)
- This phase originally overlapped with modal development and was later decoupled.  
- Nov 12: RAG + KB stabilized enough to push LangGraph work.

---

# Phase 3 — Renderer & Component Registry  
**Status: Complete**  
**Time: ~8–10 hrs (Nov 11–14)**

### 3.1 Component Whitelist
- Hero, Section, AnswerBlocks, CaseStudyBlocks  
- Strict zod schemas  
- Deterministic UI rendering

### 3.2 Layout Tree Rendering
- JSON → React mapping  
- Guaranteed structural safety  
- No arbitrary HTML injection

### 3.3 Animation Layer (Initial)
- Typewriter / entrance animations  
- Smooth scroll anchoring

---

#### 📘 Phase History (Nov 11–14)
- Phase originally included CMD+K integration but was split out later.  
- Renderer matured quickly and remained stable.

---

# Phase 4 — Early Modal UX & Interaction Model  
**Status: Complete**  
**Time: ~12–14 hrs (Nov 12–16)**

### 4.1 Modal UI Shell
- Message list + input  
- Typing indicator  
- Smooth transitions

### 4.2 Integration With Non‑LangGraph Agent
- Modal responses from direct LLM calls  
- Worked but lacked:
  - Memory  
  - Mode routing  
  - Debug visibility

### 4.3 Input Normalization
- PagePath  
- Section context  
- Topic metadata

---

#### 📘 Phase History (Nov 12–16)
- Many behaviors defined here were later replaced by LangGraph modalGraphApp.  
- Messaging model remained valuable and carried forward.

---

# Phase 5 — Intent Routing (Pre‑LangGraph)  
**Status: Partially Replaced**  
**Time: ~6–8 hrs (Nov 14–15)**

### 5.1 Intent Schema
- Navigation  
- Scrolling  
- QA  
- Project lookups

### 5.2 Limitations
- Too coarse  
- No rebuilding of conversation context  
- No evaluation surface

This phase became unnecessary after introducing LangGraph in Phase 8.

---

#### 📘 Phase History (Nov 14–15)
- Intent router informed later LangGraph conversation policy design.

---

# Phase 6 — Copywriter & Orchestrator Refinement  
**Status: Complete**  
**Time: ~10–12 hrs (Nov 15–18)**

### 6.1 Copywriter Improvements
- More structured YAML  
- Error‑resistant output rules  
- Warm, recruiter‑friendly tone

### 6.2 Orchestrator JSON Stability
- Stricter Zod validation  
- Better merging of YAML sections  
- Fine‑grained block composition

---

#### 📘 Phase History (Nov 15–18)
- This phase ended early when we realized modal needed stronger context reasoning → LangGraph.

---

# Phase 7 — Evaluation Prep (Pre‑LangGraph)  
**Status: Deleted**  
**Time: ~4 hrs (Nov 17)**

### Why Deleted
- Planned heuristics were insufficient  
- Replaced by LangSmith‑driven evaluation in Phase 8.4+

---

#### 📘 Phase History (Nov 17)
- Work replaced by dataset‑based evaluation approach.

---

# Phase 8 — LangGraph Dev Harness & Evaluation  
**Status: Complete**  
**Time: ~28–32 hrs (Nov 17–25)**

### 8.1 `modalGraphApp` Architecture
- Deterministic nodes:
  - derive_context  
  - retrieve_chunks  
  - build_context_blob  
  - conversation_policy  
  - generate_answer  
- Full `ModalGraphState`  
- Debug notes injected at every step

### 8.2 `/api/dev/modal-graph` Route
- Interactive harness  
- Enables tooling, debugging, and agent reasoning inspection

### 8.3 Behavioral Foundation
- Warm tone, no AI‑speak  
- Follow‑up questions when helpful  
- Low‑context fallback logic  
- Better cross‑project awareness

### 8.4 LangSmith Evaluation Strategy
- Dataset A (Answer Quality)  
- Dataset B (Routing)  
- Dataset C (Trajectory)
- Custom LLM judge

### 8.5 Target Functions
- `runModalGraphEval(input)`  
- Unified evaluation layer

### 8.6 Success Criteria
- Predictable mode routing  
- High answer quality  
- Stable conversation behavior

---

#### 📘 Phase History (Nov 17–25)
- Nov 17–18: modalGraphApp scaffolded  
- Nov 19–21: conversation policy + context logic rewritten  
- Nov 21–23: LangSmith datasets & judge built  
- Nov 23–25: Target functions + PMI fixes + evaluation  
- Phase 8 declared complete Nov 25

---

# Phase 9 — Modal Integration & Interaction Polish  
**Status: In Progress**  
**Time Estimate: ~12–16 hrs**  
**Time Spent (so far): ~8 hrs**

### 9.1 Replace Direct Copywriter Call  
- Modal now calls `modalGraphApp`  
- Unified backend shape: `{ answer, mode, debugNotes }`

### 9.2 Mode Carrying  
- API → frontend → UI  
- Assistant messages store `mode`  
- Dev‑only labels show modes for debugging

### 9.3 UI & Interaction Polish  
- Centralize all triggers into `openAiModal()`  
- Hover chips, inline prompts, global AI button all use the same modal invocation path  
- Subtle user‑visible hints show clarifying vs direct vs low‑context modes

### 9.4 Success Criteria  
- Modal feels cohesive and conversational  
- No more divergent behavior between entry points  
- User clearly understands when the assistant is clarifying

---

#### 📘 Phase History (Nov 22–26)
- Nov 22: modalGraphApp connected to modal  
- Nov 23–24: First end‑to‑end UI wiring  
- Nov 25: Mode‑carrying added  
- Nov 26: Unified trigger system introduced; subtle mode hints added

---

# Phase 10 — Cmd+K Palette  
**Status: Not Started**  
**Estimate: 18–24 hrs**

Global command system:
- Navigation  
- AI commands  
- Contact  
- Scrolling  
- Case study shortcuts

---

#### 📘 Phase History (Nov 15–26)
- Palette postponed until modal stabilized  
- Phase likely begins after 9.3 completes

---

# Phase 11 — Contact Flow & Scheduling  
**Status: Not Started**  
**Estimate: 10–14 hrs**

Unified contact + scheduling:
- Contact form  
- Email integration  
- Calendar link  
- Cmd+K “Contact Charles” command

---

#### 📘 Phase History (Nov 14–26)
- Originally part of early UX plans  
- Deferred due to AI system complexity

---

# Phase 12 — Analytics & Insight Layer  
**Status: Not Started**  
**Estimate: 8–12 hrs**

lightweight analytics post‑launch.

---

#### 📘 Phase History (Nov 14–26)
- Always intended as post‑V1 tracking  
- Waiting for modal + palette stability

---

# Total Time (Nov 8 → Nov 26)
**~96–114 hrs across all phases completed to date**

This includes:
- Architectural design  
- LangGraph engineering  
- Modal UX  
- Evaluation workflows  
- Prompt engineering  
- KB cleanup (notably PMI identity normalization)  

This roadmap is now accurate, historical, and ready to guide future project planning.