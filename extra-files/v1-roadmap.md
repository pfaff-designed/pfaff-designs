# Phase 1 — Foundations & Early Architecture  
### Phase Steps
1. Initialize Next.js project with TypeScript.
2. Install Tailwind, PostCSS, and Autoprefixer.
3. Set up shadcn/ui and Radix dependencies.
4. Create initial file structure (`app/`, `components/`, `lib/`).
5. Build first version of Copywriter → Orchestrator → Renderer pipeline.
6. Validate early UI with Storybook.

**Status: Complete**  
**Time: ~18–22 hrs (Nov 8–12)**

## 1.1 Framework & Runtime Setup  
**Estimated Time: 6–8 hrs**

**Goal**  
Get a modern, stable React/Next.js baseline with TypeScript and styling so all later work has a solid foundation.

**Deliverables**
- Next.js 14 (App Router) project initialized
- React 18 + TypeScript 5 configured
- Tailwind 4 + PostCSS + Autoprefixer wired up
- Base layout and `_app` / root config working

## 1.2 Initial Generative‑UI Architecture  
**Estimated Time: 6–7 hrs**

**Goal**  
Define the core generative-UI pipeline so every later phase can plug into a predictable Copywriter → Orchestrator → Renderer flow.

**Deliverables**
- Two‑agent pipeline sketched:
  - Copywriter (YAML) → Orchestrator (JSON) → Renderer (deterministic UI)
- Draft schemas for:
  - Components  
  - Blocks  
  - Pages  
- Strict JSON → React mapping rules (no arbitrary HTML)

## 1.3 First Modal Assistant Prototype (Non‑LangGraph)  
**Estimated Time: 6–7 hrs**

**Goal**  
Experiment with a basic conversational assistant to understand UX constraints before introducing LangGraph.

**Deliverables**
- Early conversational assistant using Anthropic Haiku
- Direct LLM → UI pipeline (no graph)
- Working prototype showing key limitations:
  - No determinism  
  - No mode routing  
  - No evaluation or debugging surface  
  - Unstable behavior across runs

---

#### 📘 Phase History (Nov 8–12)
- Nov 8: Project bootstrapped; initial modal assistant introduced.  
- Nov 9–10: Early pipeline defined (Copywriter → Orchestrator → Renderer).  
- Nov 11: Recognized need for deterministic agent behavior → LangGraph direction established.  
- Nov 12: Phase 1 declared complete.

---

# Phase 2 — RAG & Knowledge Base Setup  
### Phase Steps
1. Import all project longform + shortform KB.
2. Normalize formats and folder structure.
3. Build Supabase embedding loader.
4. Chunk longform text into RAG-ready units.
5. Implement first pass of retrieval helper.
6. Connect retrieval output to Copywriter.

**Status: Complete**  
**Time: ~10–12 hrs (Nov 10–13)**

## 2.1 KB Import & Formatting  
**Estimated Time: 3–4 hrs**

**Goal**  
Centralize all portfolio content into a structured, model-ready knowledge base.

**Deliverables**
- Imported longform + shortform project KB:
  - Capital One  
  - PMI  
  - Tanger  
  - Coke  
  - Portfolio metadata  
- Standardized formats: `.yaml`, `.json`, `.md`
- Logical folder structure for KB assets

## 2.2 RAG Stubbed Implementation  
**Estimated Time: 3–4 hrs**

**Goal**  
Stand up the first retrieval layer to prove that KB → embeddings → query → chunks works.

**Deliverables**
- Vector store loader using Supabase embeddings
- Initial chunking strategy for longform content
- Retrieval helper that returns top‑N chunks for a query

## 2.3 Copywriter Agent Structure (Pre‑LangGraph)  
**Estimated Time: 3–4 hrs**

**Goal**  
Wire retrieval into the Copywriter agent to generate structured YAML answers from KB context.

**Deliverables**
- Non‑deterministic but functional YAML generator
- Copywriter prompt that consumes retrieved chunks
- Early page composition via RAG → Copywriter

---

#### 📘 Phase History (Nov 10–13)
- This phase originally overlapped with modal development and was later decoupled.  
- Nov 12: RAG + KB stabilized enough to push LangGraph work.

---

# Phase 3 — Renderer & Component Registry  
### Phase Steps
1. Create component whitelist and schemas.
2. Implement Page → LayoutTree → React rendering pipeline.
3. Build Section/Hero/AnswerBlock base components.
4. Implement deterministic JSON renderer.
5. Add animation layer (typewriter + in-view animations).
6. Validate rendering through Storybook.

**Status: Complete**  
**Time: ~8–10 hrs (Nov 11–14)**

## 3.1 Component Whitelist  
**Estimated Time: 2–3 hrs**

**Goal**  
Define the strict set of components the Orchestrator is allowed to use.

**Deliverables**
- Component whitelist: Hero, Section, AnswerBlocks, CaseStudyBlocks
- Zod schemas for each component type
- Mapping from component type → React implementation

## 3.2 Layout Tree Rendering  
**Estimated Time: 3–4 hrs**

**Goal**  
Turn orchestrator JSON into deterministic React trees.

**Deliverables**
- JSON → React mapping pipeline
- Layout tree structure with predictable nesting
- Guard rails to prevent arbitrary HTML injection

## 3.3 Animation Layer (Initial)  
**Estimated Time: 3–4 hrs**

**Goal**  
Add just enough motion to make generative content feel alive and intentional.

**Deliverables**
- Typewriter / entrance animations for generated blocks
- Smooth scroll anchoring to sections
- Basic intersection observer or in‑view logic

---

#### 📘 Phase History (Nov 11–14)
- Phase originally included CMD+K integration but was split out later.  
- Renderer matured quickly and remained stable.

---

# Phase 4 — Early Modal UX & Interaction Model  
### Phase Steps
1. Build modal shell with input and message list.
2. Add typing indicator + transitions.
3. Connect modal to early LLM endpoint.
4. Build page context extraction (pagePath, sectionText).
5. Add message normalization and metadata.
6. Test multi-turn behaviors.

**Status: Complete**  
**Time: ~12–14 hrs (Nov 12–16)**

## 4.1 Modal UI Shell  
**Estimated Time: 4–5 hrs**

**Goal**  
Create a focused, pleasant conversational surface that fits the site’s editorial style.

**Deliverables**
- Modal layout with message list + input
- Typing indicator component
- Open/close transitions and overlay behavior

## 4.2 Integration With Non‑LangGraph Agent  
**Estimated Time: 4–5 hrs**

**Goal**  
Hook the modal to the early LLM endpoint to support real conversations.

**Deliverables**
- API call from modal to direct LLM
- Response rendering in message list
- Basic error handling and loading states
- Documented limitations:
  - No memory  
  - No mode routing  
  - No debug visibility

## 4.3 Input Normalization & Context  
**Estimated Time: 4–5 hrs**

**Goal**  
Attach enough context to each message so future agents can reason about where the user is in the site.

**Deliverables**
- Extraction of `pagePath`
- Capture of section context (headline, text)
- Topic metadata on messages
- Multi-turn behavior smoke tests

---

#### 📘 Phase History (Nov 12–16)
- Many behaviors defined here were later replaced by LangGraph modalGraphApp.  
- Messaging model remained valuable and carried forward.

---

# Phase 5 — Intent Routing (Pre‑LangGraph)  
### Phase Steps
1. Create intent schema (nav, scroll, QA, project lookup).
2. Build intent router prototype.
3. Test navigation vs QA intent separation.
4. Integrate router with early modal.
5. Evaluate limitations.
6. Mark components for replacement by LangGraph.

**Status: Partially Replaced**  
**Time: ~6–8 hrs (Nov 14–15)**

## 5.1 Intent Schema & Router Prototype  
**Estimated Time: 3–4 hrs**

**Goal**  
Give the assistant a first-pass way to distinguish between navigation and Q&A.

**Deliverables**
- Intent schema with:
  - Navigation  
  - Scrolling  
  - QA  
  - Project lookups
- Router prototype that picks an intent per user message
- Wiring from router → early modal behaviors

## 5.2 Limitations & Lessons  
**Estimated Time: 3–4 hrs**

**Goal**  
Evaluate the shortcomings of a simple intent router to inform the later LangGraph design.

**Deliverables**
- Documented limitations:
  - Too coarse  
  - No rebuilding of conversation context  
  - No evaluation surface
- Notes that later informed LangGraph conversation policy design
- Components marked for replacement by LangGraph

---

#### 📘 Phase History (Nov 14–15)
- Intent router informed later LangGraph conversation policy design.

---

# Phase 6 — Copywriter & Orchestrator Refinement  
### Phase Steps
1. Rewrite Copywriter prompt (structured YAML).
2. Add stricter output rules.
3. Improve orchestrator merging logic.
4. Add block-level validation.
5. Strengthen error printing & fallback.
6. Validate JSON → React stability.

**Status: Complete**  
**Time: ~10–12 hrs (Nov 15–18)**

## 6.1 Copywriter Improvements  
**Estimated Time: 5–6 hrs**

**Goal**  
Make the Copywriter’s YAML structured, reliable, and aligned with recruiter-facing tone.

**Deliverables**
- Rewritten Copywriter prompt with structured YAML sections
- Clear output rules (no markdown, fenced code, or prose)
- Warm, recruiter‑friendly tone
- Better handling of missing KB fields

## 6.2 Orchestrator JSON Stability  
**Estimated Time: 5–6 hrs**

**Goal**  
Harden the orchestrator so that it reliably converts YAML into valid page JSON.

**Deliverables**
- Stricter Zod validation for page/blocks
- Improved merging of YAML sections into a single layout
- Error printing & fallback paths for invalid blocks
- JSON → React stability validated in Storybook

---

#### 📘 Phase History (Nov 15–18)
- This phase ended early when we realized modal needed stronger context reasoning → LangGraph.

---

# Phase 7 — Evaluation Prep (Pre‑LangGraph)  
### Phase Steps
1. Draft early evaluation heuristics.
2. Attempt rule-based scoring.
3. Identify major issues.
4. Scrap heuristics approach.
5. Replace with LangSmith directional plan.
6. Archive phase as deprecated.

**Status: Deleted**  
**Time: ~4 hrs (Nov 17)**

## 7.1 Heuristics Attempt & Pivot  
**Estimated Time: 4 hrs**

**Goal**  
Explore naive evaluation heuristics and decide whether they’re viable.

**Deliverables**
- Drafted early evaluation heuristics (rule-based)
- Attempted scoring on a small set of examples
- Identified major issues with heuristic-only evaluation
- Decision to move to LangSmith dataset + judge approach

---

#### 📘 Phase History (Nov 17)
- Work replaced by dataset‑based evaluation approach.

---

# Phase 8 — LangGraph Dev Harness & Evaluation  
### Phase Steps
1. Scaffold modalGraphApp + ModalGraphState.
2. Implement derive_context node.
3. Add retrieve_chunks node.
4. Build context_blob merger.
5. Create conversation_policy logic.
6. Add generate_answer prompt + mode routing.
7. Build /api/dev/modal-graph dev route.
8. Add debugNotes + deterministic traversal.
9. Build LangSmith datasets A/B/C.
10. Create custom LLM judge.
11. Build target function runModalGraphEval.

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
### Phase Steps
1. Replace direct Copywriter call with modalGraphApp.
2. Add mode-carrying through API and UI.
3. Update modal renderer to show mode hints.
4. Unify modal triggers (buttons, inline prompts, hover chips).
5. Stabilize UI interaction model.
6. Validate modal behavior end-to-end.

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

# Phase 10 — Cmd+K Command Palette (Atlas-Style)
### Phase Steps
1. Define Command schema + registry.
2. Build CommandContext object.
3. Implement deterministic command filtering.
4. Implement Cmd+K listener.
5. Build command palette UI shell.
6. Add quick AI actions + inline chat.
7. Add deep AI actions (modalGraph).
8. Add unsupported query handler.

**Status: Not Started**  
**Estimated Time: 22–30 hrs**

Phase 10 introduces an **Atlas-style command environment**, triggered via Cmd+K, enabling global navigation, quick inline AI actions, deep modal queries, and system-level behaviors (download resume, jump to sections, etc.). V1 focuses on deterministic command execution; V2 will expand into full generative-UI composition.

---

## 10.1 Command Model, Registry & Context Object (No UI)
**Estimated Time: 5–7 hrs**

### Goal
Implement the core “brain” of the command palette: a structured command schema, a centralized registry, and a context object describing the current page, selection, and available actions.

### Deliverables
- `Command` interface with fields for:
  - `id`, `kind`, `label`, `keywords`, `visible(ctx)`, `run(ctx)`
- Supported command kinds:
  - `nav`, `ai_quick`, `ai_deep`, `download`, `help`
- Full command registry including:
  - Navigation commands (Home, Work, each project)
  - Quick AI actions (summaries, rewrites, explainers)
  - Deep AI actions (open modalGraph via `openAiModal()`)
  - Download commands (resume)
  - Help / fallback command
- `CommandContext` object containing:
  - Current path
  - Project slug
  - Selected text
  - Section headline/body
  - Actions: `openAiModal`, `openInlineChat`, `navigate`, `download`
- Deterministic `filterCommands(input, ctx)` helper
- No UI yet

---

## 10.2 CommandPalette Shell (Minimal UI)
**Estimated Time: 6–8 hrs**

### Goal
Build a keyboard-driven command palette UI similar to Atlas.

### Deliverables
- Cmd+K listener
- Pill-shaped input positioned near the cursor
- Simple fuzzy search on commands
- Scrollable result list
- Arrow-key navigation & Enter to execute
- Show/hide animations

---

## 10.3 Inline Chat Window (Quick Responses)
**Estimated Time: 5–7 hrs**

### Goal
Build a lightweight, movable chat window for JSON-level responses: summarize, rewrite, explain.

### Deliverables
- Draggable floating window component
- Renders single-turn Q → A
- Uses simplified `/api/ai/quick` route
- Accepts selectionText and sectionText
- Not tied to modalGraph

---

## 10.4 Modal Deep-Link Integration
**Estimated Time: 3–5 hrs**

### Goal
Use existing modalGraph (modal assistant) for deeper or multi-turn queries.

### Deliverables
- Commands with `kind: "ai_deep"` call `openAiModal()`
- Modal opens even if palette is up
- Uses mode-carrying from Phase 9

---

## 10.5 Unsupported Query Handling
**Estimated Time: 2–3 hrs**

### Goal
Provide helpful suggestions when users attempt unsupported actions.

### Deliverables
- Detect no-match queries
- Trigger `help` command
- Suggest relevant groups:
  - Navigation
  - Ask AI (quick)
  - Deep AI
  - Downloads

---

#### 📘 Phase History (Updated)
- Nov 25–26: Phase respecified after modal stabilization; aligned with Atlas browser model.
- V2 notes added for generative-UI composition via orchestrator.

---

#### 📘 Phase History (Nov 15–26)
- Palette postponed until modal stabilized  
- Phase likely begins after 9.3 completes

---

# Phase 11 — Contact Flow & Scheduling  
### Phase Steps
1. Build contact page UI shell.
2. Implement form state + zod validation.
3. Build Postmark email route.
4. Add scheduling CTA section.
5. Integrate Calendly via env var.
6. Add Cmd+K "Contact Charles" command.

**Status: In Progress**  
**Estimate: 10–14 hrs**

Unified contact + scheduling:
- Contact form  
- Email integration  
- Calendar link  
- Cmd+K “Contact Charles” command

---

## 11.1 Contact Page UI Shell  
**Estimated Time: 2–3 hrs**

**Goal**  
Create a visually consistent `/contact` page that fits the editorial portfolio aesthetic and provides a clear place for people to reach out.

**Deliverables**
- Page at `/contact` wired into existing navigation
- Simple layout: heading, description, form section, scheduling CTA section
- Uses existing layout primitives and typography tokens
- No AI logic, no API calls yet

---

## 11.2 Form Behavior & Validation (zod)  
**Estimated Time: 3–4 hrs**

**Goal**  
Turn the contact form into a fully validated, accessible form using zod on the client.

**Deliverables**
- `contactFormSchema` with fields: `name`, `email`, `subject` (optional), `message`
- Client-side validation using `safeParse`
- Controlled inputs with `useState` (or existing form helper)
- Field-level error messages and `aria-invalid` / `aria-describedby`
- Basic status state: `idle`, `submitting`, `success`, `error`
- Inline success + error messages

---

## 11.3 Postmark Email Integration  
**Estimated Time: 3–4 hrs**

**Goal**  
Wire the validated form to **Postmark** so submissions actually send an email.

**Deliverables**
- `POST /api/contact` route handler
- Server-side zod validation mirroring the client schema
- Use of `POSTMARK_SERVER_TOKEN`, `POSTMARK_FROM_EMAIL`, `POSTMARK_TO_EMAIL` from env
- Single email to Charles with name, email, subject, message
- Clear JSON responses for success / validation errors / server errors
- Frontend submit handler that calls `/api/contact` and updates status

---

## 11.4 Scheduling CTA (Calendly)  
**Estimated Time: 1–2 hrs**

**Goal**  
Add a simple, reliable “Schedule time” CTA that links out to Calendly.

**Deliverables**
- Standalone scheduling section on `/contact` below the form
- Env-driven URL: `NEXT_PUBLIC_SCHEDULING_URL="https://calendly.com/pfaff-designs"`
- Button that opens the scheduling URL in a new tab when configured
- Disabled state + inline message when env var is missing
- No changes to form behavior

---

## 11.5 Cmd+K Contact Command  
**Estimated Time: 1–2 hrs**

**Goal**  
Expose the contact flow via the global command palette.

**Deliverables**
- `command` entry for “Contact Charles” / “Open contact page”
- Command appears under a sensible group (e.g., "Navigation" or "Contact")
- Executing the command navigates to `/contact`
- Optional: command for “Schedule time” that opens Calendly

---

#### 📘 Phase History (Nov 14–26)
- Originally part of early UX plans  
- Deferred due to AI system complexity  
- Re-scoped into clear sub-phases in line with Phase 10 style

---

# Phase 12 — Custom 404 Page
### Phase Steps
1. Create /404 page.
2. Add centered 404 typography.
3. Ensure layout matches site aesthetic.
4. Add link back to homepage.
5. Validate route fallback behavior.

**Status: Not Started**  
**Estimate: 1–2 hrs**

A simple, branded 404 page to gracefully handle unknown routes.

---

## 12.1 Basic 404 Layout  
**Estimated Time: 0.5–1 hr**

**Goal**  
Create a `/404` page that matches the site’s visual system.

**Deliverables**
- Next.js 404 page using App Router conventions
- Full-height layout with centered content
- Large, bold "404" headline
- Short supporting copy

---

## 12.2 Navigation & Polish  
**Estimated Time: 0.5–1 hr**

**Goal**  
Make it easy to recover from a 404.

**Deliverables**
- Clear link/button back to the homepage
- Optional link to the Work page
- Alignment with typography/spacing tokens
- Confirm 404 behavior by visiting nonexistent routes

---

#### 📘 Phase History (Nov 26)
- Added as a final polish item after core Cmd+K and modal systems stabilized  
- Simple implementation intended for V1 completeness

---

# Phase 13 — Final Content Pass
### Phase Steps
1. Full editorial review of all website content.
2. Review KB content for accuracy.
3. Improve incomplete or low-context sections.
4. Normalize naming across projects.
5. Add external project links to all relevant case study pages.
6. Ensure composer appears on landing page with a cue like "If you need me, you can always press Cmd + K".
7. Verify that all project cards display correct images.
8. Ensure all website embeds appear correctly.
9. Ensure all images load properly and accurately represent their intended subject.
10. Polish typography, spacing, and section rhythm across all pages.
11. Final editorial + visual review.
12. ensure all case studies are present

**Status: Not Started**  
**Estimate: 4–6 hrs**

A final polishing phase focused on editorial and visual coherence across the site.

---

## 13.1 KB Audit & Accuracy  
**Estimated Time: 1–2 hrs**

**Goal**  
Ensure all knowledge base content (YAML/JSON/MD) accurately reflects real work.

**Deliverables**
- Full read-through of all project KB
- Fix factual inaccuracies or outdated phrasing
- Remove vestigial or experimental content not meant for recruiters

---

## 13.2 Low-Context Fixes & Naming  
**Estimated Time: 1–2 hrs**

**Goal**  
Strengthen any weak or underspecified project descriptions and unify naming.

**Deliverables**
- Enhanced descriptions for projects with thin context (e.g., PMI)
- Canonical naming applied across site (e.g., "PMI.org redesign" vs "PMI Agile")
- Consistent references to roles, tools, and outcomes

---

## 13.3 External Links & Proof Points  
**Estimated Time: 1 hr**

**Goal**  
Make it easy for recruiters to jump to live work.

**Deliverables**
- Clear external links to live sites or case studies on each relevant page
- Consistent visual treatment for outbound links
- Optional "View live" pills/cards on project pages

---

## 13.4 Editorial & Visual Polish  
**Estimated Time: 1–2 hrs**

**Goal**  
Tighten the overall narrative and visual rhythm.

**Deliverables**
- Pass over headlines, subheadlines, and body text
- Adjust spacing, alignment, and section breaks where needed
- Confirm tone is warm, clear, and recruiter-friendly

---

#### 📘 Phase History (Nov 26)
- Added as a last-mile polish step before Analytics & Insights

---

# Phase 14 — Analytics & Insight Layer  
### Phase Steps
1. Select analytics provider.
2. Add lightweight page view tracking.
3. Add cmd+K usage tracking.
4. Add modalGraph usage tracking.
5. Add event schemas.
6. Add dashboard for insights.

**Status: Not Started**  
**Estimate: 8–12 hrs**

Lightweight analytics post‑launch.

---

## 14.1 Provider Selection & Setup  
**Estimated Time: 1–2 hrs**

**Goal**  
Choose a minimal, privacy-conscious analytics provider (e.g., Plausible, Fathom, or simple PostHog setup).

**Deliverables**
- Provider chosen and installed
- Base script integrated into layout

---

## 14.2 Page & Section Tracking  
**Estimated Time: 2–3 hrs**

**Goal**  
Track how recruiters move through the portfolio.

**Deliverables**
- Pageview events for key routes (Home, Work, individual projects, Contact)
- Optional section impression tracking for major sections

---

## 14.3 Cmd+K & Modal Usage  
**Estimated Time: 2–3 hrs**

**Goal**  
Understand how the AI layer is used.

**Deliverables**
- Events for Cmd+K open/close
- Events for command execution (by category)
- Events for modalGraph open/close
- Optional: mode distribution (answer_direct, clarify_then_answer, low_context)

---

## 14.4 Basic Insights View  
**Estimated Time: 3–4 hrs**

**Goal**  
Create a small internal view of key metrics.

**Deliverables**
- Simple dashboard (could be in the analytics provider UI)
- Key charts: page views, command usage, AI usage
- Notes for future optimization (what to simplify, what to expand)

---

#### 📘 Phase History (Nov 14–26)
- Always intended as post‑V1 tracking  
- Waiting for modal + palette stability

---  

# Phase 15 — QA Pass  
### Phase Steps
1. Define the QA test matrix (pages × devices × features).
2. Run functional tests for all core flows (browse, Cmd+K, modal, contact, scheduling).
3. Verify KB-backed content and case studies in the live UI.
4. Run accessibility and keyboard-only checks.
5. Do basic performance + error-state checks.
6. Triage and fix launch-blocking issues.

**Status: Not Started**  
**Estimate: 6–10 hrs**

A focused, pre-launch QA phase to make sure the portfolio behaves reliably across key flows, devices, and contexts.

---

## 15.1 Functional QA (Core Flows)  
**Estimated Time: 3–4 hrs**

**Goal**  
Verify that all primary user journeys work end-to-end without errors.

**Deliverables**
- Test checklist covering:
  - Home → Work → Project → Contact navigation
  - Cmd+K open/close and command execution
  - Modal assistant open/close and basic questioning
  - Contact form submission (happy path + validation errors)
  - Scheduling CTA click-through to Calendly
- Bug list for any broken or confusing behaviors
- Fixes applied for all launch-blocking issues

---

## 15.2 Cross-Browser & Responsive QA  
**Estimated Time: 2–3 hrs**

**Goal**  
Ensure the site looks and behaves correctly across common screen sizes and modern browsers.

**Deliverables**
- Manual checks on:
  - Desktop: Chrome, Safari, Firefox
  - Mobile viewport using DevTools (and real device if available)
- Verification that:
  - Layouts don't clip or overflow in key sections (hero, work grid, project pages, contact)
  - Cmd+K palette and inline chat position correctly and remain usable on smaller screens
  - 404 page renders cleanly on all viewports
- Bug list + fixes for any layout or interaction issues found

---

## 15.3 Accessibility & UX Polish  
**Estimated Time: 1–2 hrs**

**Goal**  
Make sure core interactions are accessible and feel smooth for real humans (keyboard and screen readers).

**Deliverables**
- Keyboard-only pass for:
  - Global navigation
  - Cmd+K palette
  - Modal assistant
  - Contact form
- Spot-checks for:
  - Focus states on interactive elements
  - Form labels, `aria-*` attributes, and error messaging
  - Button/link semantics (no divs pretending to be buttons)
- Small UX polish fixes where friction is obvious (e.g., confusing labels, missing hover cues)

---

## 15.4 Pre-Launch Sanity & Regression  
**Estimated Time: 1–2 hrs**

**Goal**  
Do one last full sweep to catch regressions and confirm the system is ready for real recruiters.

**Deliverables**
- Final pass through all key pages:
  - Home, Work, each case study, Contact, 404
- Quick sanity tests for:
  - AI modal (simple factual question, cross-project question, low-context question)
  - Cmd+K (navigation + at least one AI command)
  - Contact + scheduling flows
- Short list of non-blocking issues (nice-to-have post-launch fixes)

---

#### 📘 Phase History (Planned)
- Added as the last gate before calling V1 "done"  
- Intentionally scoped to be tight and pragmatic, not a full testing framework

---
# Phase 16 — Replace History Summary with Sliding Message Window (Option C)  
### Phase Steps
1. Add history[] to modalGraph input.
2. Build rolling window (4–6 messages).
3. Replace historySummary node.
4. Update derive_context with history.
5. Update conversation_policy to use multi-turn context.
6. Update generate_answer prompt.
7. Update Cmd+K + inline chat to send history.
8. Add LangSmith multi-turn dataset.

**Status: Not Started**  
**Estimate: 6–8 hrs**

Upgrade the conversation memory model to use a short rolling window of recent messages (Atlas-style) instead of the current history summary. This will improve contextual coherence in multi-turn conversations without compromising determinism or blowing up token usage.



## 16.1 History Window Implementation  
**Estimated Time: 2–3 hrs**

**Goal**  
Add a bounded `history: Message[]` field to the modalGraph input and wire it end-to-end.

**Deliverables**
- `history` added to state and input schema
- Frontend captures last N messages and sends them with each request

---

## 16.2 Node & Policy Updates  
**Estimated Time: 2–3 hrs**

**Goal**  
Replace the summary node with a rolling window and teach the graph to reason over multi-turn context.

**Deliverables**
- `historySummary` node removed or deprecated
- `derive_context` updated to consider recent history
- `conversation_policy` updated to use history for:
  - Follow-up detection
  - Project continuity
  - Context drift

---

## 16.3 Prompt & Evaluation Updates  
**Estimated Time: 2–3 hrs**

**Goal**  
Ensure prompts and evaluations understand and benefit from the new history model.

**Deliverables**
- `generate_answer` prompt updated with a “Conversation history (last few messages)” block
- Cmd+K + inline chat wired to send history alongside the question
- New LangSmith dataset and judge cases for multi-turn behavior

---

#### 📘 Phase History
- Planned as a post‑V1 enhancement to replace brittle summary history with a more robust, Atlas-style sliding window.

---

