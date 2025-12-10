# RAG Audit – AI Modal & Command Palette

### 1. Current RAG Architecture (What We Actually Have)
- Flow: user (modal/⌘K) → `/api/ai/modal` → `modalGraphApp` (derive_context → retrieve_chunks [stubbed] → build_context_blob → conversation_policy → generate_answer) → answer/actions back to UI.
- Retrieval: modal graph uses hard-coded chunks for a few slugs (`capital-one-travel`, `pmi`, `pfaff-designs`) and otherwise returns empty; no Supabase call or rerank in this path. Separately, the page-generation path (`retrieveProjectChunks`) does vector search via Supabase RPC `match_project_chunks` with query embedding.
- Context building: `build_context_blob` stitches `[PROJECT_FACTS]` from retrieved chunks + KB facts and optionally `[PORTFOLIO_FACTS]`; includes pagePath/section info; suppresses portfolio facts on project pages unless the question is portfolio-level.
- Prompting: three inline system prompts (answer_direct / clarify_then_answer / low_context_fallback) share `TONE_BLOCK` enforcing answer-first, short paragraphs, recruiter tone; portfolio/project behavior instructions and Tanger suppression baked in; prompts are not pulled from LangSmith.
- Mode routing: `conversation_policy` picks modes via heuristics on pagePath, projectSlug, question intent, and context presence; low_context_fallback only when almost no context; deterministic branches for tools/project lists.
- pageContext/projectSlug: normalized from pagePath, PMI aliases handled; projectFacts loaded from KB loader; context blob prioritizes project facts on project pages and portfolio facts on `/`.
- Testing/tracing: `scripts/tests/cannonical-questions.test.ts` smoke-tests modal answers against canonical questions; modal graph logging emits debugNotes and metadata but no LangSmith tracing; LangSmith is used in the copywriter/orchestrator path, not in modal graph chat.

### 2. Gaps vs Best Practices
1) Retrieval quality  
- What’s Good: pgvector RPC + embeddings exist for page-generation path; chunk schema carries `projectId`, `sectionType`, `tags`.  
- What’s Missing: modal graph does not call retrieval; no hybrid lexical filter, no reranking, no metadata filters (doc_type/project/section), no score-based filtering or dedupe; query embedding model unspecified here; chunking rules not enforced in modal path.  
- Why It Matters: chat answers can drift or be generic because they’re grounded only in hand-written snippets; missing hybrid/rerank hurts relevance on short queries.

2) Prompting & grounding  
- What’s Good: answer-first tone block; project vs portfolio behavior spelled out; Tanger suppression guard; low-context rules exist.  
- What’s Missing: prompts are inline (not versioned in LangSmith); no explicit “use only provided context” / citation discipline; low-context fallback doesn’t clearly admit gaps; persona oscillates (context facts in first person, prompt refers to Charles in third person); no guard against hallucinated tools beyond a note.  
- Why It Matters: without consistent grounding instructions and prompt versioning, behavior drifts and is hard to audit or roll back.

3) Output structure  
- What’s Good: mandates first sentence direct answer; discourages bullets unless asked; short paragraphs target recruiters.  
- What’s Missing: no structured template for key facts (role/tools/impact) beyond prose ordering; no explicit “can’t answer” pattern; deterministic branches can produce long lists without scannability constraints.  
- Why It Matters: answers may bury the lead or ramble; lack of explicit gap-handling can mislead.

4) Evaluation & observability  
- What’s Good: canonical Jest smoke test for modal endpoint; LangSmith tracing present for copywriter/orchestrator.  
- What’s Missing: modal graph not traced; no automated groundedness/attribution checks; tests don’t assert citation/use-of-context; no eval dataset in LangSmith.  
- Why It Matters: regressions in retrieval grounding or persona will slip; debugging modal answers is harder without traces.

5) Knowledge architecture  
- What’s Good: KB in Supabase with projects/sections/media/profile; identity long-form “master profile” exists; loader falls back to filesystem.  
- What’s Missing: modal graph does not automatically retrieve master profile or project sections; no enforced doc_type slices (project vs global) in chat; hidden-project filter only in prompt text.  
- Why It Matters: chat lacks consistent global grounding and project-scoped facts, leading to generic answers and risk of mentioning hidden/irrelevant data.

### 3. Prioritized Recommendations
- **Tier 1 – High impact, low/medium effort (do now)**
  - Wire modal graph retrieval to `retrieveProjectChunks` (with `projectSlug` filter when present) and pass scores/tags into `build_context_blob`; file: `src/lib/ai/modalGraph.ts`, `src/lib/rag/retrieveProjectChunks.ts`.
  - Always include a small “master profile” slice (identity long-form) in chat context; file: `modalGraph.ts`, KB loader to expose profile snippet.
  - Centralize modal system prompt via `getModalGraphSystemPrompt` (LangSmith-backed) and add a strict “use only provided context; if insufficient, say so briefly” rule; file: `modalGraph.ts`, `src/lib/ai/promptLoader.ts`.
  - Strengthen low-context fallback copy to surface options (project list, ask for focus) and explicitly note when context is thin; file: `modalGraph.ts`.
  - Normalize persona to third-person about Charles across prompts and deterministic branches; file: `modalGraph.ts`.

- **Tier 2 – Medium impact or higher effort (do soon)**
  - Add hybrid retrieval: lexical filter (tsvector or `ilike`/`@@ plainto_tsquery`) combined with vector search in `match_project_chunks`; expose `doc_type`/`project_slug` filters; file: Supabase RPC + `retrieveProjectChunks.ts`.
  - Add lightweight reranker on top-k chunks (e.g., cosine score sort + length/section-type preference or small LLM rerank); file: `retrieveProjectChunks.ts`, `modalGraph.ts`.
  - Trim and structure `contextBlob` (cap tokens, label sections, include scores) to keep prompts concise; file: `modalGraph.ts`.
  - Instrument modal graph with LangSmith traces (wrap nodes or use `withConfig` callbacks); file: `modalGraph.ts`, `src/app/api/ai/modal/route.ts`.

- **Tier 3 – Nice to have (future)**
  - Add answer validator/groundedness scorer node that flags low-support answers; file: new helper + `modalGraph.ts`.
  - Turn canonical questions into LangSmith eval dataset; file: `scripts/tests/cannonical-questions.test.ts`, LangSmith project.
  - Add metadata-aware caching (cache by projectSlug + query intent) to reduce repeated retrieval; file: `modalGraph.ts`.

### 4. Concrete Implementation Plan (Next Steps)
1. Create `kb/master_profile.md` (or reuse identity long-form) and expose it via KB loader with a compact “profile blurb” accessor; embed if using pgvector.  
2. Update `modalGraph.ts` retrieve node to call `retrieveProjectChunks` (project-filtered when available) and pass scores/tags; adjust `build_context_blob` to include master profile + retrieved chunk metadata.  
3. Swap modal prompts to `getModalGraphSystemPrompt` and add grounding rules: “answer only from context, otherwise say what’s missing; keep Charles in third person.”  
4. Tighten low_context_fallback copy to list 2–3 projects and offer concrete follow-ups (tools/process/impact) while acknowledging limited context.  
5. Add a simple rerank/score-threshold filter and log chunk usage to LangSmith for modal runs; optionally add a groundedness flag for responses.  
6. Convert canonical modal questions into a LangSmith eval set and keep the Jest smoke test as a quick local gate.  

