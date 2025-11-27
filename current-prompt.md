# Cursor Prompt — Improve Cross‑Project Understanding & Tools Logic in modalGraph

You are working in the **pfaff-designs** repo.  
This document is an instruction file for you (Cursor) telling you what code to modify.

---

## Goal

Improve the LangGraph modal agent so that when the user asks:

- **“What other projects has he worked on?”**
- **“Which other projects use these tools?”**
- **“Highlight a specific one.”**
- **“Tell me about his other work.”**

…the agent uses the **full KB**, not just the current page/section.

The agent should:

1. Know the list of **all portfolio projects** from the KB.
2. Confidently reference those projects in conversation.
3. Understand combined intents like “projects + tools”.
4. Still honor the **current section** but not be trapped in it.
5. Avoid vague phrasing ("likely", "probably", "modern web technologies").
6. Use a warm, conversational tone.

---

## Required Changes

### ✅ 1. Create or use a `loadAllProjects()` helper

Search for existing KB utilities in:

```
src/lib/kb/
src/lib/ai/kb/
src/lib/kb/loader.ts
```

If you find a function that loads all project metadata (PMI, Tanger, Capital One, Top Secret Real Estate Client, etc.), use it.

If not, create a new helper in:

```
src/lib/ai/modalGraph.ts
```

called:

```ts
async function loadAllProjects(): Promise<ProjectFacts[]> { ... }
```

This should return:

```ts
type ProjectFacts = {
  slug: string;
  name: string;
  client?: string;
  role?: string;
  summary?: string;
  tools?: string[];
};
```

Cursor may derive these from the same KB used for RAG or from existing hardcoded metadata.

---

### ✅ 2. Extend `ModalGraphState`

Open:

```
src/lib/ai/modalGraph.ts
```

Modify `ModalGraphState` so it includes:

```ts
allProjects?: ProjectFacts[];
```

This field must be **carried through every node** by spreading the state (`...state`).

---

### ✅ 3. Load all projects in derive_context

Inside `derive_context`, after reading:

- pagePath
- projectSlug
- sectionHeadline

Load all KB projects:

```ts
const allProjects = await loadAllProjects();
```

Append a debug note:

```ts
state.debugNotes.push("derive_context: loaded allProjects");
```

Then return:

```ts
return {
  ...state,
  allProjects,
};
```

---

### ✅ 4. Update build_context_blob to include other projects

Append a readable list of projects:

```
--- OTHER PROJECTS ---
- PMI — front-end engineer
- Tanger — design system
- Top Secret Real Estate Client — prototyping and UX
- Coke — AI vending machine concept
```

Use whatever metadata is available.

---

### ✅ 5. Modify generate_answer to correctly detect project questions

Before calling Anthropic, insert routing logic:

```ts
const q = state.question.toLowerCase();
const toolsQ = q.includes("tools") || q.includes("tech stack");
const projectsQ =
  q.includes("other projects") ||
  q.includes("worked on") ||
  q.includes("another project") ||
  q.includes("different project") ||
  q.includes("highlight a specific one");

const projectsAndToolsQ = projectsQ && toolsQ;
```

---

### ✅ 6. Handle combined “projects + tools” first

If user asks “what other projects use these tools?”:

- Identify the current project’s tools (if present)
- Filter `state.allProjects` for overlapping tools
- Return 1–3 matching projects with concrete info

Append to history and add this debug note:

```ts
state.debugNotes.push("generate_answer: cross-project-tools");
```

---

### ✅ 7. Handle project-only questions

If the user asks:

- “what other projects has he worked on?”
- “highlight a specific one”

Use `state.allProjects` and list 1–3 with client + role + summary.

---

### ✅ 8. Handle tools-only questions (current project)

If user asks “what tools did you use?”:

- Use the current project’s facts (from retrievedChunks or projectFacts)
- Never hedge
- Always give a concrete list
- Then invite deeper exploration

---

### ✅ 9. Improve the Anthropic system prompt

Add new rules to the system message:

- **“You may reference any project from the KB when relevant. Don’t assume the user only wants information about the current section.”**
- **“When facts are present, state them confidently. Avoid hedging.”**
- **“Use the project list in contextBlob when answering cross-project questions.”**

Do not alter the agent identity.

---

## Definition of Done

1. “What tools did you use?” returns a concrete tool list.
2. “What other projects has he worked on?” returns real KB projects.
3. “Which other projects use these tools?” returns filtered matches.
4. “Highlight a specific one.” returns a short overview.
5. System prompt permits cross-project references.
6. No TypeScript errors.

Make these changes now.
# Cursor Prompt — Implement Cross‑Project & Tools Logic in `modalGraph`

You are working in the **pfaff-designs** repo.
This file is an instruction sheet for you (Cursor) telling you what code to modify.

Your job: **update the LangGraph modal agent** so it can talk intelligently about:
- Other projects Charles has worked on
- Which projects use which tools
- The current section **and** the broader portfolio

Do all of this by editing the TypeScript code in the repo. Do **not** invent new folders or tech stacks.

---

## High‑Level Goal

When a user is on a specific project page (e.g. Capital One Travel) and asks things like:

- "What tools did you use?"
- "What other projects has he worked on?"
- "Which other projects use these tools?"
- "Highlight a specific one."

…the **modal graph agent** should:

1. Use the **full project KB**, not just the current section.
2. Answer with **concrete facts** from the KB (client, role, tools, summary).
3. Honor the **current project + section** as context, but not be trapped in it.
4. Detect when a question is about **projects**, **tools**, or **both**.
5. Use a **warm conversational tone** (no robotic boilerplate).

You will implement this primarily in:

- `src/lib/ai/modalGraph.ts`
- Any KB loader utilities under `src/lib/kb/` or `src/lib/ai/kb/` as needed.

---

## Step 1 — Add a `ProjectFacts` type and `loadAllProjects()` helper

1. Open `src/lib/ai/modalGraph.ts`.
2. Near the top of the file, define a lightweight type:

   ```ts
   type ProjectFacts = {
     slug: string;
     name: string;
     client?: string;
     role?: string;
     summary?: string;
     tools?: string[];
   };
   ```

3. Implement an async helper in the same file:

   ```ts
   async function loadAllProjects(): Promise<ProjectFacts[]> {
     // TODO: replace stub with real KB integration when available
     // For now, use a static list derived from existing short-form KB
     return [
       {
         slug: "capital-one-travel",
         name: "Capital One Travel",
         client: "Capital One",
         role: "Front-end engineer via AKQA",
         summary:
           "Modular front-end experience for airport lounges and travel rewards.",
         tools: ["React", "TypeScript", "Next.js", "Storybook", "Figma"],
       },
       {
         slug: "pmi",
         name: "PMI.org Redesign",
         client: "Project Management Institute",
         role: "Front-end engineer / technologist",
         summary:
           "Redesigned PMI.org with modular components, improved IA, and a scalable design system.",
         tools: ["React", "TypeScript", "Next.js", "Storybook", "Figma"],
       },
       {
         slug: "tanger",
         name: "Tanger Experience Platform",
         client: "Tanger",
         role: "Front-end engineer / design systems collaborator",
         summary:
           "Helped build a component-driven marketing platform with reusable patterns.",
         tools: ["React", "TypeScript", "Next.js", "Storybook", "Figma"],
       },
       {
         slug: "coke-ai-vending",
         name: "Coke AI Vending Concept",
         client: "Coca-Cola",
         role: "Creative technologist / prototyper",
         summary:
           "Prototype for an AI-powered vending experience exploring conversational product discovery.",
         tools: ["React", "TypeScript", "Node.js", "Figma"],
       },
       {
         slug: "pfaff-design-portfolio",
         name: "pfaff.design — Generative UI Portfolio",
         client: "Self-initiated",
         role: "Design-minded applied AI engineer",
         summary:
           "RAG-powered generative UI portfolio blending deterministic layouts with AI-authored content.",
         tools: [
           "React",
           "TypeScript",
           "Next.js",
           "Tailwind",
           "Supabase",
           "LangChain",
         ],
       },
     ];
   }
   ```

4. If there is an existing KB loader that already exposes equivalent data, you may refactor `loadAllProjects()` to call into that instead of using static data. Keep the `ProjectFacts` shape the same.

---

## Step 2 — Extend `ModalGraphState` to carry `allProjects`

In `src/lib/ai/modalGraph.ts`, find the `ModalGraphState` type.

1. Add a field:

   ```ts
   allProjects?: ProjectFacts[];
   ```

2. Ensure every place that constructs or returns `ModalGraphState` **spreads the previous state** so `allProjects` is not dropped:

   ```ts
   return {
     ...state,
     // other updates here
   };
   ```

3. Fix any TypeScript errors that result from this change.

---

## Step 3 — Load all projects inside `derive_context`

Still in `modalGraph.ts`, locate the node/function that derives context (likely named `derive_context` or similar).

1. After it inspects `pagePath`, `projectSlug`, and `sectionHeadline`, call:

   ```ts
   const allProjects = await loadAllProjects();
   ```

2. Append a debug note:

   ```ts
   state.debugNotes.push("derive_context: loaded allProjects");
   ```

3. Return the new state:

   ```ts
   return {
     ...state,
     allProjects,
   };
   ```

Make sure `derive_context` remains compatible with LangGraph’s expected node signature.

---

## Step 4 — Enrich `build_context_blob` with other projects

Find the node/function that builds `contextBlob` (e.g. `build_context_blob`).

1. After including `PAGE PATH`, `PROJECT`, `SECTION`, and the project-specific context, append a readable list of other projects using `state.allProjects`:

   ```ts
   const otherProjectsLines = (state.allProjects ?? [])
     .map((p) => {
       const role = p.role ? ` — ${p.role}` : "";
       return `- ${p.name}${role}`;
     })
     .join("\n");

   const otherProjectsBlock = otherProjectsLines
     ? `\n--- OTHER PROJECTS ---\n${otherProjectsLines}`
     : "";

   const contextBlob =
     baseContextBlob +
     projectFactsBlock +
     conversationHistoryBlock +
     otherProjectsBlock;
   ```

2. Ensure `contextBlob` is written back into state:

   ```ts
   return {
     ...state,
     contextBlob,
   };
   ```

3. Keep existing debug notes; you may add one like:

   ```ts
   state.debugNotes.push("build_context_blob: added otherProjects");
   ```

---

## Step 5 — Add project/tools detection in `generate_answer`

Locate the node/function responsible for generating the answer text (e.g. `generate_answer_node` or similar). This is where you call Anthropic.

Before calling the LLM, add simple routing logic based on the question text:

```ts
const q = state.question.toLowerCase();
const toolsQ = q.includes("tools") || q.includes("tech stack");
const projectsQ =
  q.includes("other projects") ||
  q.includes("worked on") ||
  q.includes("another project") ||
  q.includes("different project") ||
  q.includes("highlight a specific one");

const projectsAndToolsQ = projectsQ && toolsQ;
```

You will use these flags to decide whether to:
- Answer about **current project tools**
- Answer about **other projects**
- Answer about **other projects that use these tools**
- Or fall back to the general LLM path

---

## Step 6 — Implement cross‑project tools logic

In `generate_answer`, before the generic Anthropic call:

1. If `projectsAndToolsQ` is true **and** `state.allProjects` is defined:

   - Derive the current project’s tools from KB context (prefer `state.retrievedChunks` / `contextBlob` / `allProjects` match by `projectSlug`).
   - Filter `state.allProjects` for projects that share at least one tool with the current project, excluding the current project:

     ```ts
     const current = (state.allProjects ?? []).find(
       (p) => p.slug === state.projectSlug
     );
     const currentTools = new Set(current?.tools ?? []);

     const related = (state.allProjects ?? []).filter((p) => {
       if (p.slug === state.projectSlug) return false;
       if (!p.tools || p.tools.length === 0) return false;
       return p.tools.some((t) => currentTools.has(t));
     });

     const topRelated = related.slice(0, 3);
     ```

   - If `topRelated.length > 0`, build a **manual answer string** without calling Anthropic:

     ```ts
     const answer = [
       "Great question. Beyond this Capital One Travel work, there are a few other projects where Charles used a similar stack:",
       ...topRelated.map((p) => {
         const client = p.client ? ` for ${p.client}` : "";
         const tools = p.tools?.join(", ") ?? "the same core tools";
         return `- ${p.name}${client} — using ${tools}`;
       }),
       "If you’d like, I can go deeper on one of those projects.",
     ].join("\n");

     state.debugNotes.push("generate_answer: cross-project-tools");

     return {
       ...state,
       answerText: answer,
     };
     ```

2. This path should **not** call Anthropic.

---

## Step 7 — Implement project‑only questions

Still in `generate_answer`, after the cross-project tools branch:

1. If `projectsQ` is true and `projectsAndToolsQ` is false:

   - Use `state.allProjects`.
   - List 2–3 projects with client + role + short summary.

   Example structure:

   ```ts
   const others = (state.allProjects ?? []).filter(
     (p) => p.slug !== state.projectSlug
   );

   const top = others.slice(0, 3);

   if (top.length > 0) {
     const answer = [
       "Outside of this project, Charles has worked on several others:",
       ...top.map((p) => {
         const client = p.client ? ` for ${p.client}` : "";
         const role = p.role ? ` (${p.role})` : "";
         const summary = p.summary ?? "";
         return `- ${p.name}${client}${role}${summary ? ` — ${summary}` : ""}`;
       }),
       "If one of those sounds interesting, I can go deeper on it.",
     ].join("\n");

     state.debugNotes.push("generate_answer: project-list");

     return {
       ...state,
       answerText: answer,
     };
   }
   ```

2. Again, this branch can skip Anthropic if you have enough structured data.

---

## Step 8 — Implement tools‑only questions for the current project

If `toolsQ` is true and `projectsQ` is false:

1. Use the current project’s tools from `state.allProjects` (matched by `projectSlug`).
2. Return a **confident, concrete list** — no “likely”, “probably”, or “modern web technologies” vagueness.

Example:

```ts
const current = (state.allProjects ?? []).find(
  (p) => p.slug === state.projectSlug
);
const tools = current?.tools ?? [];

if (tools.length > 0) {
  const answer = [
    "For this project, Charles used:",
    ...tools.map((t) => `- ${t}`),
    "Those tools made it easier to build a modular, maintainable front-end that could evolve over time.",
  ].join("\n");

  state.debugNotes.push("generate_answer: current-project-tools");

  return {
    ...state,
    answerText: answer,
  };
}
```

If no tools are found, fall back to the existing Anthropic-based answer.

---

## Step 9 — Update the Anthropic system prompt

Find the Anthropic system prompt used in `generate_answer` (it may be an inline string or imported template).

Add these **additional rules** without changing the existing identity:

- "You may reference any project from the KB or the project list in contextBlob when it helps answer the question."
- "Do not assume the user only cares about the current section; they may be asking about other projects."
- "When facts are present, state them confidently. Avoid hedging words like 'likely', 'probably', or 'modern web technologies'."
- "Use a warm, conversational tone and acknowledge the user’s question directly before elaborating."

Do not remove existing tone/identity rules; just extend them.

---

## Step 10 — Keep Anthropic as the general fallback

If none of the special branches apply:

- Continue to use the existing Anthropic call.
- Pass `contextBlob`, `question`, and `history` as you already do.
- Let the LLM handle nuanced conversational answers where simple deterministic logic isn’t enough.

Ensure that when Anthropic errors, you still return a **graceful, conversational fallback** (as the code already does).

---

## Definition of Done

You are done when:

1. Asking "What tools did you use?" on a project page returns a concrete, accurate list of tools from `allProjects`.
2. Asking "What other projects has he worked on?" returns real projects from `allProjects`.
3. Asking "Which other projects use these tools?" returns 1–3 projects that overlap with the current project’s tools.
4. Asking "Highlight a specific one" after a projects answer returns a short, specific highlight.
5. The Anthropic system prompt explicitly allows cross-project references and discourages hedging.
6. `pnpm lint` and `pnpm test` (or the equivalent commands in this repo) run without TypeScript errors.

Make these changes now.


## Cursor Prompt — Improve `conversation_policy` in `modalGraph`

You are working in the **pfaff-designs** repo.  
This file is an instruction sheet for you (Cursor) telling you what code to modify.

Your goal in this section: **tighten the `conversation_policy` logic in the LangGraph modal agent** so that it:

1. Handles cross-project questions more intelligently.
2. Handles “list other projects” questions clearly.
3. Decides when to answer directly vs. ask a clarifying question vs. fall back to a low-context overview.
4. Emits useful debug notes about how it made its decision.

Do all of this by editing the TypeScript code in the repo. Do **not** invent new folders or tech stacks.

---

### Step 1 — Add a `ConversationMode` type and scoring helper

1. Open:

   ```txt
   src/lib/ai/modalGraph.ts
   ```

2. Near the `ModalGraphState` definition, define a small union type for conversation modes:

   ```ts
   type ConversationMode = "answer_direct" | "clarify_then_answer" | "low_context_fallback";
   ```

3. Ensure `ModalGraphState` includes an optional `mode` field:

   ```ts
   type ModalGraphState = {
     // existing fields…
     mode?: ConversationMode;
     debugNotes: string[];
   };
   ```

   If `debugNotes` is not present, add it as an array of strings and initialize it wherever state is first created.

4. Below the `ModalGraphState` definition (or near the `conversation_policy` node), add a helper function to compute basic context scores:

   ```ts
   function computeContextScores(state: ModalGraphState) {
     const { question, sectionText, retrievedChunks, projectSlug } = state;

     const hasSectionContext = !!sectionText && sectionText.trim().length > 0;
     const hasRetrieved = !!retrievedChunks && retrievedChunks.length > 0;

     const bestChunk = hasRetrieved ? retrievedChunks[0] : null;
     const topScore = bestChunk?.relevanceScore ?? 0;
     const topProject = bestChunk?.projectSlug ?? null;

     const crossProjectDrift =
       projectSlug &&
       topProject &&
       topProject !== projectSlug &&
       topScore > 0.6; // tweakable threshold

     return {
       hasSectionContext,
       hasRetrieved,
       topScore,
       crossProjectDrift,
     };
   }
   ```

   Adjust property names on `retrievedChunks` if they differ in the actual codebase (e.g., `score` instead of `relevanceScore`).

---

### Step 2 — Update `conversation_policy` node to use deterministic logic

1. Locate the node/function that implements the conversation policy in `modalGraph`. It will be something like:

   ```ts
   async function conversationPolicyNode(state: ModalGraphState) { … }
   ```

2. Replace the internal logic of this node so it uses the `computeContextScores` helper and sets a `mode` on the state.

   Use this structure:

   ```ts
   async function conversationPolicyNode(state: ModalGraphState): Promise<ModalGraphState> {
     const scores = computeContextScores(state);
     const q = state.question.toLowerCase();

     const isSimpleFact =
       q.startsWith("what is ") ||
       q.startsWith("who ") ||
       q.startsWith("when ") ||
       q.startsWith("where ") ||
       q.includes("tools you use") ||
       q.includes("skills") ||
       q.includes("tech stack");

     const askingForOtherProjects =
       q.includes("other projects") ||
       q.includes("what else have you worked on") ||
       q.includes("show me more work");

     let mode: ConversationMode;

     if (!scores.hasSectionContext && !scores.hasRetrieved) {
       mode = "low_context_fallback";
       state.debugNotes.push("[conversation_policy] No context → low_context_fallback");
     } else if (askingForOtherProjects || scores.crossProjectDrift) {
       mode = "clarify_then_answer";
       state.debugNotes.push("[conversation_policy] Cross-project / list-other-projects → clarify_then_answer");
     } else if (isSimpleFact && (scores.hasSectionContext || scores.topScore > 0.5)) {
       mode = "answer_direct";
       state.debugNotes.push("[conversation_policy] Simple factual question with context → answer_direct");
     } else {
       mode = "clarify_then_answer";
       state.debugNotes.push("[conversation_policy] Ambiguous question → clarify_then_answer");
     }

     return {
       ...state,
       mode,
     };
   }
   ```

3. Make sure all returns from this node use the spread pattern (`...state`) so no existing state fields (like `allProjects`) are lost.

---

### Step 3 — Keep node wiring intact and fix TypeScript

1. Ensure the `conversation_policy` node is still wired into the LangGraph execution order (for example: `derive_context → retrieve_chunks → build_context_blob → conversation_policy → generate_answer`).

2. Fix any TypeScript errors resulting from:
   - The new `ConversationMode` type.
   - The new `mode` field on `ModalGraphState`.
   - Any property name mismatches in `computeContextScores`.

3. Run the usual commands (for example: `pnpm lint`, `pnpm test`) to verify types compile and tests still pass.

---

### Definition of Done for this section

You are done with this prompt when:

1. `ModalGraphState` has a `mode?: ConversationMode` field.
2. `computeContextScores` exists and is used inside the conversation policy node.
3. `conversation_policy` sets one of `"answer_direct"`, `"clarify_then_answer"`, or `"low_context_fallback"` on the state.
4. The node emits clear `debugNotes` explaining which branch was taken.
5. There are no TypeScript errors caused by these changes.

Make these changes now.
# Cursor Prompt — System Prompt for `generate_answer`

Add the following system prompt constant inside `src/lib/ai/modalGraph.ts` and use it inside the `generate_answer` node.  
Replace any existing system prompt used by `generate_answer` with this one.

```ts
const GENERATE_ANSWER_SYSTEM_PROMPT = `
You are Charles's portfolio guide. You answer questions about his work as an applied AI engineer and front‑end technologist.

Your task is to generate warm, clear, grounded responses based on:
- the user's QUESTION
- the selected MODE ("answer_direct", "clarify_then_answer", "low_context_fallback")
- the page and section context
- the stitched CONTEXT_BLOB from RAG

Follow these rules exactly:

----------------------------------------
MODE: answer_direct
----------------------------------------
Use this when the question is clear and grounded.

Behavior:
- Answer immediately and directly.
- Keep it concise (1–3 short paragraphs).
- Use sectionHeadline and sectionText when relevant.
- Stay anchored in the current project unless the question explicitly asks otherwise.
- No clarifying question.
- No hedging (“likely”, “probably”).
- Prefer concrete, factual details from the KB.

----------------------------------------
MODE: clarify_then_answer
----------------------------------------
Use this when the question is broad, ambiguous, cross‑project, or multi‑intent.

Behavior:
- First, give a helpful partial answer based on what you DO know.
- Then ask ONE (and only one) clarifying follow-up question.
- The follow-up should be warm and simple, e.g.:
  - "Are you more interested in tools, process, or outcomes?"
  - "Would you like an overview or something more detailed?"
  - "Do you want examples from one project or across several?"
- Never ask for clarification before giving an initial answer.

----------------------------------------
MODE: low_context_fallback
----------------------------------------
Use this when there is no section context or very weak retrieval.

Behavior:
- Provide a short overview of Charles’s professional identity.
- Mention 2–3 representative projects by name only.
- Keep it general but concrete.
- End with ONE warm follow-up question guiding the user:
  - e.g. "Would you like to explore a specific project, or dive into tools or process?"

----------------------------------------
GLOBAL RULES (Apply to Every Mode)
----------------------------------------
Tone:
- Warm, conversational, human.
- Professional but approachable.
- No AI-speak (“As an AI…”, “leveraging cutting-edge technologies…”).

Style:
- Short paragraphs, no filler.
- No made-up facts; rely only on KB material.
- If information is missing, stay general rather than inventing.

Content:
- You may reference ANY project from the KB when relevant.
- Use visible context when present (sectionHeadline, sectionText) but do not become trapped by it.
- Prefer concrete details over abstractions.
- Keep the output scannable and recruiter-friendly.

Your output should ONLY be the final answer text. No metadata, no reasoning traces.
`;
```

After adding this constant, update `generate_answer` so it uses this system prompt when calling Anthropic.

Make no other changes.
#


## Cursor Prompt — Implement 8.1 Conversation Policy (Full Code Steps)

You are working in the **pfaff-designs** repo.  
This section completes **Phase 8.1** by implementing the deterministic `conversation_policy` logic in `modalGraph.ts`.

Your job:  
Update the LangGraph modal agent so it sets a reliable `mode` field on `ModalGraphState`:
- `"answer_direct"`
- `"clarify_then_answer"`
- `"low_context_fallback"`

This must be fully deterministic and testable via `/api/dev/modal-graph`.

Follow the steps below.

---

### **8.1.a — Add `ConversationMode` + extend `ModalGraphState`**

In `src/lib/ai/modalGraph.ts`, near your existing types:

```ts
type ConversationMode = "answer_direct" | "clarify_then_answer" | "low_context_fallback";

type ModalGraphState = {
  // existing fields…
  question: string;
  pagePath?: string | null;
  projectSlug?: string | null;
  sectionHeadline?: string | null;
  sectionText?: string | null;
  retrievedChunks?: Array<{
    text: string;
    relevanceScore?: number;
    projectSlug?: string | null;
  }>;
  mode?: ConversationMode;
  debugNotes: string[];
};
```

Ensure wherever the initial state is created, `debugNotes: []` is included.

---

### **8.1.b — Add `computeContextScores` helper**

Place this helper near your conversation node:

```ts
function computeContextScores(state: ModalGraphState) {
  const { sectionText, retrievedChunks, projectSlug } = state;

  const hasSectionContext = !!sectionText && sectionText.trim().length > 0;
  const hasRetrieved = !!retrievedChunks && retrievedChunks.length > 0;

  const bestChunk = hasRetrieved ? retrievedChunks![0] : null;
  const topScore =
    (bestChunk as any)?.relevanceScore ??
    (bestChunk as any)?.score ??
    0;

  const topProject = (bestChunk as any)?.projectSlug ?? null;

  const crossProjectDrift =
    !!projectSlug &&
    !!topProject &&
    topProject !== projectSlug &&
    topScore > 0.6;

  return {
    hasSectionContext,
    hasRetrieved,
    topScore,
    crossProjectDrift,
  };
}
```

---

### **8.1.c — Implement `conversationPolicyNode`**

Replace your existing policy logic with:

```ts
async function conversationPolicyNode(
  state: ModalGraphState
): Promise<ModalGraphState> {
  const scores = computeContextScores(state);
  const q = state.question.toLowerCase();

  const isSimpleFact =
    q.startsWith("what is ") ||
    q.startsWith("who ") ||
    q.startsWith("when ") ||
    q.startsWith("where ") ||
    q.includes("tools you use") ||
    q.includes("what tools") ||
    q.includes("skills") ||
    q.includes("tech stack");

  const askingForOtherProjects =
    q.includes("other projects") ||
    q.includes("what else have you worked on") ||
    q.includes("what else has he worked on") ||
    q.includes("show me more work") ||
    q.includes("other work");

  let mode: ConversationMode;

  if (!scores.hasSectionContext && !scores.hasRetrieved) {
    mode = "low_context_fallback";
    state.debugNotes.push(
      "[conversation_policy] No section context + no retrieved chunks → low_context_fallback"
    );
  } else if (askingForOtherProjects || scores.crossProjectDrift) {
    mode = "clarify_then_answer";
    state.debugNotes.push(
      "[conversation_policy] Cross-project / list-other-projects signal → clarify_then_answer"
    );
  } else if (isSimpleFact && (scores.hasSectionContext || scores.topScore > 0.5)) {
    mode = "answer_direct";
    state.debugNotes.push(
      "[conversation_policy] Simple factual question with context → answer_direct"
    );
  } else {
    mode = "clarify_then_answer";
    state.debugNotes.push(
      "[conversation_policy] Ambiguous question → clarify_then_answer"
    );
  }

  if (!("executionSteps" in state)) {
    (state as any).executionSteps = [];
  }
  (state as any).executionSteps.push("conversation_policy");

  return {
    ...state,
    mode,
  };
}
```

---

### **8.1.d — Dev Harness Tests (Manual)**

Use `/api/dev/modal-graph` to verify the node:

#### **Test A — answer_direct**
- Question: “What tools did you use on this project?”
- Expect:  
  `mode: "answer_direct"`

#### **Test B — clarify_then_answer**
- Question: “What other projects has he worked on?”
- Expect:  
  `mode: "clarify_then_answer"`

#### **Test C — low_context_fallback**
- No sectionText + no retrievedChunks  
- Question: “What kind of work does he do?”
- Expect:  
  `mode: "low_context_fallback"`

---

### Definition of Done for 8.1

8.1 is complete when:

- `ConversationMode` + `mode` field exist in `ModalGraphState`.
- `computeContextScores` is implemented.
- `conversationPolicyNode` fully uses the deterministic logic above.
- Mode outputs match expectations in the dev harness.
- No TypeScript errors.

Make these changes now.
You are working in the `pfaff-designs` repo.

## Goal (Phase 9.1)

Rewire the **AI modal assistant** to use the LangGraph `modalGraphApp` as its backend brain instead of the old low-context logic / copywriter pipeline.

High-level behavior we want:
- The modal sends a rich request (question + page context + history) to an API route.
- The API route builds a `ModalGraphState`-compatible object.
- The route calls `modalGraphApp.invoke(initialState)`.
- The response returns a conversational payload:
  - `mode` (conversation mode)
  - `answer` (final answer string from the graph)
  - optional `debugNotes` (for dev)
- The frontend uses `answer` as the assistant message content.

We **do not** need to change the dev harness (`/api/dev/modal-graph`) in this phase.

---

## 1. Locate the current modal API route and types

1. Search for the existing modal assistant API route, likely under one of:
   - `src/app/api/ai/modal/route.ts`
   - `src/app/api/modal/route.ts`
   - or any file that handles the modal assistant POST request.

2. Open that route file and identify:
   - The **request body type** (e.g. `ModalRequest`, `AiModalRequest`, etc.).
   - The **response type** (e.g. `ModalResponse`, `AiModalResponse`).
   - The current AI call (this might be a copywriter/orchestrator pipeline or a simpler LLM call).

3. Do **not** delete the old logic yet; we will replace the internal AI call but keep the route shape stable for the frontend.

---

## 2. Locate the modal graph and state type

1. Search for `modalGraphApp` in the repo.
   - It should live in something like `src/lib/ai/modalGraph.ts` (or similar).

2. In that module, find and note:
   - The `modalGraphApp` export.
   - The `ModalGraphState` type (or equivalent) that the graph uses as its input and output state.

3. Confirm that the state fields include, at minimum, fields like:
   - `question: string`
   - `pagePath: string`
   - `projectSlug?: string`
   - `sectionHeadline: string`
   - `sectionText: string`
   - `history: Array<{ role: "user" | "assistant"; content: string }>`
   - `answerText?: string`
   - `debugNotes?: string[]`
   - and any other required fields.

If there is already a helper like `buildInitialState` or `buildModalGraphStateFromRequest` (used by `/api/dev/modal-graph` or `runModalGraphEval`), prefer to reuse it instead of duplicating mapping logic.

---

## 3. Add a helper to map modal requests → ModalGraphState

In a shared location (either within the modal API route file or a small helper module, depending on current structure), implement a helper that builds a valid `ModalGraphState` from the modal request body.

Prefer reusing existing helpers if they already exist (for the dev harness or eval target). Otherwise, create a new one.

Example shape (adjust property names to match real types):

```ts
import type { ModalGraphState } from "@/lib/ai/modalGraph";

// Use the actual modal request type if one exists.
// For example: import type { ModalRequest } from "...";

type ModalRequest = {
  question: string;
  pagePath: string;
  projectSlug?: string | null;
  sectionHeadline?: string;
  sectionText?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
};

function buildModalGraphStateFromModalRequest(body: ModalRequest): ModalGraphState {
  return {
    question: body.question,
    pagePath: body.pagePath,
    projectSlug: body.projectSlug ?? undefined,
    sectionHeadline: body.sectionHeadline ?? "",
    sectionText: body.sectionText ?? "",
    history: body.history ?? [],
    // Include any other required fields from ModalGraphState with safe defaults.
    // For example: retrievedChunks: [], contextBlob: "", debugNotes: [], etc.
  } as ModalGraphState;
}
```

Key rules:
- Match the actual `ModalGraphState` required fields.
- Use `undefined` (not `null`) for optional fields like `projectSlug`.
- Use empty strings for string fields that must exist.
- Use empty arrays for `history` and any list fields.

If there is already an equivalent helper used by `/api/dev/modal-graph` or `runModalGraphEval`, factor it into a shared file and reuse it here instead of defining a new one.

---

## 4. Replace the old AI call with `modalGraphApp.invoke`

Inside the modal API route handler (e.g. the POST handler in `route.ts`):

1. Parse the request body as usual:

```ts
const body = await req.json();
```

2. Build the initial graph state:

```ts
const initialState = buildModalGraphStateFromModalRequest(body);
```

3. Invoke the graph:

```ts
import { modalGraphApp } from "@/lib/ai/modalGraph";

const finalState = await modalGraphApp.invoke(initialState);
```

4. Extract the fields we care about for the modal:

```ts
const mode =
  (finalState as any).conversationMode ??
  (finalState as any).mode ??
  "answer_direct";

const answer: string =
  (finalState as any).answerText ??
  (finalState as any).answer ??
  "";

const debugNotes: string[] = (finalState as any).debugNotes ?? [];
```

5. Return a response object that is safe for the existing frontend.

If the frontend currently expects a shape like `{ answer: string }`, keep that and add new fields rather than breaking everything:

```ts
return NextResponse.json({
  answer,
  mode,
  debugNotes,
  // Optionally keep the finalState in dev for debugging only.
  // rawState: process.env.NODE_ENV === "development" ? finalState : undefined,
});
```

If there is an existing `ModalResponse` type, update it so that it includes at least:

```ts
export type ModalResponse = {
  answer: string;
  mode: "answer_direct" | "clarify_then_answer" | "low_context_fallback";
  debugNotes?: string[];
  // keep any legacy fields the UI relies on
};
```

Make sure the route’s return type matches this updated shape.

---

## 5. Update the frontend modal assistant to use the new response

1. Find the frontend code that calls the modal API route.
   - Likely a hook or component like `AiModal`, `ComposerModal`, or a `useModalAssistant` hook.
   - Search for `"/api/ai/modal"` or the modal route path.

2. Locate where the response is parsed, e.g.:

```ts
const res = await fetch("/api/ai/modal", { ... });
const data = await res.json();

// Before:
setMessages((prev) => [
  ...prev,
  { role: "assistant", content: data.answerText ?? data.answer },
]);
```

3. Update it so that it uses the new `answer` field from the modal graph response and (optionally) captures the mode for future behavior:

```ts
setMessages((prev) => [
  ...prev,
  {
    role: "assistant",
    content: data.answer,
    mode: data.mode, // optional; useful later for branching UI
  },
]);
```

4. Ensure that whatever message type you’re using on the frontend (e.g. `ChatMessage`) is updated to allow an optional `mode` field if you choose to store it.

For 9.1, it’s okay if the UI just displays `content` and ignores `mode` — the important part is that the **answer string is coming from the modal graph**.

---

## 6. Optional: add a feature flag

If you want a safety switch while integrating:

1. Add an env flag, e.g. `USE_MODAL_GRAPH_AGENT=true`.
2. In the API route, branch on this flag:

```ts
if (!process.env.USE_MODAL_GRAPH_AGENT) {
  // Existing behavior (legacy pipeline or simple LLM call)
  // return the old response shape here
}

// New behavior using modalGraphApp
const initialState = buildModalGraphStateFromModalRequest(body);
const finalState = await modalGraphApp.invoke(initialState);
// ...extract mode/answer/debugNotes and return
```

This lets you fall back quickly if something goes wrong.

---

## 7. Sanity checks

Before calling this done, verify:

- The dev harness `/api/dev/modal-graph` still works as before.
- The modal assistant in the UI:
  - Sends the correct request body (question + context + history).
  - Receives `{ answer, mode, debugNotes }` from the server with no runtime errors.
  - Displays the assistant answer from `data.answer`.
- The graph behavior (modes, follow-up questions, etc.) is visible in the live modal.

---

## ✅ Cursor Checklist (for you to verify before stopping)

- [ ] Located the modal API route and identified current request/response types.
- [ ] Located `modalGraphApp` and `ModalGraphState`.
- [ ] Implemented (or reused) a helper to map modal request → `ModalGraphState`.
- [ ] Replaced the old AI call with `modalGraphApp.invoke(initialState)` in the modal API route.
- [ ] Extracted `mode`, `answer`, and `debugNotes` from the final graph state.
- [ ] Returned a JSON response that includes at least `{ answer, mode, debugNotes }` and doesn’t break existing UI types.
- [ ] Updated the frontend modal assistant to use `data.answer` as the assistant’s message content.
- [ ] Confirmed the modal works end-to-end using the LangGraph agent.
- [ ] Verified `/api/dev/modal-graph` still works.
# Cursor Prompt — Phase 9.2 (PMI Fix + Mode-Carrying)

You are working in the `pfaff-designs` repo.

## Phase 9.2 Goals

1. **PMI Fix (Backend)**
   - Enrich the PMI project data so the agent has concrete tools + facts.
   - Prevent hallucinated answers like:
     “context for the PMI project is light… modern web technologies like Vue.js, TensorFlow…”
   - Ensure tools questions for PMI (and other projects) are answered from **grounded facts**, not guesses.

2. **Mode-Carrying in Modal (Frontend)**
   - Make the modal UI store and surface the `mode` returned from `modalGraphApp`:
     `"answer_direct"` | `"clarify_then_answer"` | `"low_context_fallback"`.
   - Preserve all current UX.
   - Add a small dev-only label indicating conversation mode.

---

## 9.2A — Fix PMI Data & Tools Behavior

### Step 1 — Locate PMI KB entries

Search for PMI data in:

```
src/lib/kb/
src/lib/ai/kb/
```

Look for:
- `pmi-longform.yaml`
- `pmi-shortform.json`
- Any aggregated project facts (`loadAllProjects`, `projectFacts`, etc.).

You will update both the short-form KB + the global ProjectFacts entry.

---

### Step 2 — Enrich PMI project facts

Update PMI's facts (shortform and ProjectFacts) to include:

**Role**
- Front-end engineer & technologist on the redesign of PMI.org.

**Summary**
- Redesigned PMI.org with a modular component system and improvements to IA, navigation, template patterns, and consistency across a content-heavy site.

**Tools (authoritative)**
- React  
- TypeScript  
- Next.js  
- Storybook  
- Figma  

**Process**
- Broke high-fidelity designs into reusable components.
- Improved information architecture consistency.
- Partnered with UX to refine complex layouts.
- Maintained component integrity during iterative development.

**Impact**
- Cleaner, more intuitive navigation.
- Reusable patterns across templates.
- Scalable frontend system for future updates.

Update the PMI entry in `loadAllProjects()` or its equivalent so `tools` matches:

```ts
{
  slug: "pmi",
  name: "PMI.org Redesign",
  client: "Project Management Institute",
  role: "Front-end engineer & technologist",
  summary:
    "Redesigned PMI.org with a modular component system and improvements to IA, navigation, and template consistency across a content-heavy site.",
  tools: ["React", "TypeScript", "Next.js", "Storybook", "Figma"],
}
```

---

### Step 3 — Strengthen deterministic tools answers

In `src/lib/ai/modalGraph.ts`, locate the `generate_answer` node.

Add or refine the deterministic tools branch:

```ts
const q = state.question.toLowerCase();
const toolsQ =
  q.includes("tools") ||
  q.includes("tech stack") ||
  q.includes("stack did you use") ||
  q.includes("what did you use");

if (toolsQ && state.projectSlug && state.allProjects && state.allProjects.length > 0) {
  const current = state.allProjects.find((p) => p.slug === state.projectSlug);
  const tools = current?.tools ?? [];

  if (tools.length > 0) {
    const answer = [
      "For this project, Charles used:",
      ...tools.map((t) => `- ${t}`),
      "These tools supported a modular, maintainable front-end that could evolve over time.",
    ].join("\n");

    state.debugNotes?.push("generate_answer: deterministic tools answer from ProjectFacts");

    return {
      ...state,
      answerText: answer,
    };
  }
}
```

If tools exist → **never call Anthropic** for a tools-only question.

---

### Step 4 — Prevent hallucinated toolkits in low-context mode

In `GENERATE_ANSWER_SYSTEM_PROMPT`, add:

- “Do not invent tools or frameworks that are not in the KB.”
- “Do not mention Vue.js, TensorFlow, PyTorch, or cloud platforms unless explicitly present in context.”
- “If tools are missing, stay high‑level about process and outcomes rather than guessing.”

---

## 9.2B — Carry Conversation Mode Through the Modal

### Step 5 — Update the chat message type

Find the message type used by the modal (e.g. `ChatMessage`).  
Add:

```ts
type ConversationMode =
  | "answer_direct"
  | "clarify_then_answer"
  | "low_context_fallback";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: ConversationMode;
};
```

---

### Step 6 — Pass mode from API response to chat messages

Where the modal calls the AI route:

```ts
const res = await fetch("/api/ai/modal", { ... });
const data = await res.json();

setMessages((prev) => [
  ...prev,
  {
    id: crypto.randomUUID?.() ?? String(Date.now()),
    role: "assistant",
    content: data.answer,
    mode: data.mode,
  },
]);
```

Log debug notes in dev mode:

```ts
if (process.env.NODE_ENV === "development") {
  console.log("[modalGraph] mode:", data.mode);
  console.log("[modalGraph] debugNotes:", data.debugNotes);
}
```

---

### Step 7 — Display a dev-only mode label in the assistant bubble

In the component that renders chat messages:

```tsx
{isAssistant && message.mode && process.env.NODE_ENV === "development" && (
  <span className="mb-1 block text-xs text-muted-foreground">
    {message.mode === "answer_direct" && "Direct answer"}
    {message.mode === "clarify_then_answer" && "Answer + follow-up"}
    {message.mode === "low_context_fallback" && "Low-context overview"}
  </span>
)}
```

This should be small, non-intrusive, and dev-only.

---

## Definition of Done

- [ ] PMI facts enriched in KB & ProjectFacts.
- [ ] Deterministic tools answers now work for PMI.
- [ ] No hallucinated tools appear in PMI responses.
- [ ] System prompt prevents generic AI-toolkits.
- [ ] Modal API returns `mode` correctly.
- [ ] Assistants messages store `mode`.
- [ ] Dev-only label shows conversation mode.
- [ ] No TypeScript errors.

Make these changes now.
# Cursor Prompt — Unify PMI Identity in `pfaff-designs`

You are working in the **pfaff-designs** repo.

Your goal: **unify all references to the PMI project into a single canonical identity** so that the LangGraph modal agent, RAG, and UI all agree on what "PMI" is.

Right now, the same project is referred to as:
- "PMI"
- "Project Management Institute"
- "PMI.org"
- "PMI Agile"
- "PMI-ACP"
- page paths like `/work/pmi-agile`

This fragmentation causes:
- weak/empty retrieval for PMI
- `projectSlug` mismatches
- tools not being found for PMI
- hallucinated answers like generic toolkits

You will make **PMI.org Redesign** use one canonical identity throughout the system.

---

## Canonical PMI Identity

Use this as the **single source of truth** everywhere:

- **slug:** `"pmi"`
- **name:** `"PMI.org Redesign"`
- **client:** `"Project Management Institute"`

Tools (authoritative):
- React
- TypeScript
- Next.js
- Storybook
- Figma

Role (canonical):
- Front-end engineer & technologist on the redesign of PMI.org.

Summary (canonical):
- Redesigned PMI.org with a modular component system and improvements to IA, navigation, template patterns, and consistency across a content-heavy site.

You will align **all code + KB** to this identity.

---

## Step 1 — Normalize PMI in ProjectFacts / loadAllProjects

1. Find the central project facts/registry:
   - Look for `loadAllProjects`, `projectFacts`, or similar in:

   ```
   src/lib/ai/modalGraph.ts
   src/lib/kb/
   src/lib/ai/kb/
   ```

2. Locate the PMI entry.
   - It may be called `pmi`, `pmi-agile`, `pmi-acp`, or similar.

3. Replace or create the PMI entry so it **exactly** matches this shape:

   ```ts
   {
     slug: "pmi",
     name: "PMI.org Redesign",
     client: "Project Management Institute",
     role: "Front-end engineer & technologist",
     summary:
       "Redesigned PMI.org with a modular component system and improvements to IA, navigation, and template consistency across a content-heavy site.",
     tools: ["React", "TypeScript", "Next.js", "Storybook", "Figma"],
   }
   ```

4. Remove or rename any old PMI variants (e.g. `"pmi-agile"`, `"pmi-acp"`) so there is only **one** PMI-related ProjectFacts entry using `slug: "pmi"`.

---

## Step 2 — Normalize PMI in KB files

1. In `src/lib/kb/` or `src/lib/ai/kb/`, find the PMI KB files:
   - `pmi-longform.yaml` / `pmi-longform.YAML`
   - `pmi-shortform.json` or similar.

2. At the top of the longform KB, ensure the metadata clearly states:

   ```yaml
   project: PMI.org Redesign
   slug: pmi
   client: Project Management Institute
   ```

3. In short-form KB (JSON/TS), ensure the same canonical values are used for:
   - `slug: "pmi"`
   - `name: "PMI.org Redesign"`
   - `client: "Project Management Institute"`

4. Remove any obsolete references like:
   - `slug: "pmi-agile"`
   - `slug: "pmi-acp"`
   - inconsistent names like `"PMI Agile"` when they’re actually referring to the same redesign work.

Keep the **content** of the narrative intact; just normalize its identifiers.

---

## Step 3 — Map page paths to `projectSlug = "pmi"` in `derive_context`

1. Open `src/lib/ai/modalGraph.ts` and locate the node/function that derives context, likely called `derive_context`.

2. Find where `projectSlug` is determined from `pagePath`.
   - E.g. logic like:

   ```ts
   if (pagePath.startsWith("/work/capital-one-travel")) {
     projectSlug = "capital-one-travel";
   }
   ```

3. Add a **PMI mapping block** so that all PMI-related paths set the same slug:

   ```ts
   if (
     pagePath.startsWith("/work/pmi") ||
     pagePath.startsWith("/work/pmi-agile") ||
     pagePath.startsWith("/work/pmi-acp")
   ) {
     projectSlug = "pmi";
   }
   ```

4. Make sure this mapping happens **before** returning the updated state, and that the returned state uses the canonical `projectSlug`:

   ```ts
   return {
     ...state,
     pagePath,
     projectSlug,
     // other fields
   };
   ```

5. Append a debug note when PMI is detected to help with future debugging:

   ```ts
   if (projectSlug === "pmi") {
     state.debugNotes.push("derive_context: normalized projectSlug to 'pmi'");
   }
   ```

---

## Step 4 — Normalize PMI mentions in modalGraph logic

1. Still in `modalGraph.ts`, search for any hard-coded checks using older PMI identifiers, e.g.:

   ```ts
   "pmi-agile"
   "pmi-acp"
   "Project Management Institute" // in places where slug equality is needed
   ```

2. Where those checks are used to determine behavior for a *project*, update them to rely on the canonical slug instead:

   ```ts
   if (state.projectSlug === "pmi") {
     // PMI-specific logic here
   }
   ```

3. Do **not** remove human-readable mentions of "Project Management Institute" in answer text or KB content — just ensure **programmatic routing** uses `projectSlug === "pmi"`.

---

## Step 5 — Normalize PMI in any `loadAllProjects` or cross-project logic

1. Look for any cross-project logic that relies on slugs, such as:
   - `loadAllProjects()`
   - `state.allProjects`
   - cross-project tools filtering in `generate_answer`

2. Ensure PMI is represented exactly once with `slug: "pmi"` and uses the canonical tools list:

   ```ts
   tools: ["React", "TypeScript", "Next.js", "Storybook", "Figma"]
   ```

3. If there is any logic that tries to special-case `"pmi-agile"` or `"pmi-acp"`, update it to the canonical slug.

4. Confirm that tools-only questions on a PMI page (e.g. "What tools did you use on this project?") now:
   - set `projectSlug === "pmi"`
   - find the PMI entry from `allProjects`
   - return a deterministic answer with the canonical tools.

---

## Step 6 — Optional: Alias detection in user questions

If there is a simple, safe place to do it (and without adding heavy complexity), you may add minimal alias detection so that user questions like:

- "What did he do for PMI-ACP?"
- "What about PMI Agile?"

are recognized as PMI:

```ts
const lowerQ = state.question.toLowerCase();

if (
  !state.projectSlug &&
  (lowerQ.includes("pmi acp") ||
    lowerQ.includes("pmi-acp") ||
    lowerQ.includes("pmi agile") ||
    lowerQ.includes("pmi.org"))
) {
  state.projectSlug = "pmi";
  state.debugNotes.push("derive_context: normalized projectSlug to 'pmi' from question text");
}
```

This is optional but helpful for queries coming from non-PMI pages.

---

## Definition of Done

You are done when all of the following are true:

- [ ] There is exactly **one** PMI ProjectFacts entry using `slug: "pmi"` with the canonical name, client, tools, role, and summary.
- [ ] The PMI KB files (`pmi-longform.yaml`, `pmi-shortform.json`, etc.) use `slug: pmi` and `project: PMI.org Redesign` consistently.
- [ ] `derive_context` maps all PMI-related page paths (e.g. `/work/pmi`, `/work/pmi-agile`, `/work/pmi-acp`) to `projectSlug = "pmi"`.
- [ ] Any older references to `"pmi-agile"` or `"pmi-acp"` used for routing/logic have been updated to use `"pmi"`.
- [ ] Tools-only questions on PMI pages resolve to a deterministic tools list (React, TypeScript, Next.js, Storybook, Figma) **without** hallucinated stacks.
- [ ] `state.debugNotes` includes a note when PMI is normalized, making this behavior visible in the dev harness.

Make these changes now.
# Cursor Prompt — Unify PMI Identity in `pfaff-designs`

You are working in the **pfaff-designs** repo.

Your goal: **unify all references to the PMI project into a single canonical identity** so that the LangGraph modal agent, RAG, and UI all agree on what "PMI" is.

Right now, the same project is referred to as:
- "PMI"
- "Project Management Institute"
- "PMI.org"
- "PMI Agile"
- "PMI-ACP"
- page paths like `/work/pmi-agile`

This fragmentation causes:
- weak/empty retrieval for PMI
- `projectSlug` mismatches
- tools not being found for PMI
- hallucinated answers like generic toolkits

You will make **PMI.org Redesign** use one canonical identity throughout the system.

---

## Canonical PMI Identity

Use this as the **single source of truth** everywhere:

- **slug:** `"pmi"`
- **name:** `"PMI.org Redesign"`
- **client:** `"Project Management Institute"`

Tools (authoritative):
- React
- TypeScript
- Next.js
- Storybook
- Figma

Role (canonical):
- Front-end engineer & technologist on the redesign of PMI.org.

Summary (canonical):
- Redesigned PMI.org with a modular component system and improvements to IA, navigation, template patterns, and consistency across a content-heavy site.

You will align **all code + KB** to this identity.

---

## Step 1 — Normalize PMI in ProjectFacts / loadAllProjects

1. Find the central project facts/registry:
   - Look for `loadAllProjects`, `projectFacts`, or similar in:

   ```
   src/lib/ai/modalGraph.ts
   src/lib/kb/
   src/lib/ai/kb/
   ```

2. Locate the PMI entry.
   - It may be called `pmi`, `pmi-agile`, `pmi-acp`, or similar.

3. Replace or create the PMI entry so it **exactly** matches this shape:

   ```ts
   {
     slug: "pmi",
     name: "PMI.org Redesign",
     client: "Project Management Institute",
     role: "Front-end engineer & technologist",
     summary:
       "Redesigned PMI.org with a modular component system and improvements to IA, navigation, and template consistency across a content-heavy site.",
     tools: ["React", "TypeScript", "Next.js", "Storybook", "Figma"],
   }
   ```

4. Remove or rename any old PMI variants (e.g. `"pmi-agile"`, `"pmi-acp"`) so there is only **one** PMI-related ProjectFacts entry using `slug: "pmi"`.

---

## Step 2 — Normalize PMI in KB files

1. In `src/lib/kb/` or `src/lib/ai/kb/`, find the PMI KB files:
   - `pmi-longform.yaml` / `pmi-longform.YAML`
   - `pmi-shortform.json` or similar.

2. At the top of the longform KB, ensure the metadata clearly states:

   ```yaml
   project: PMI.org Redesign
   slug: pmi
   client: Project Management Institute
   ```

3. In short-form KB (JSON/TS), ensure the same canonical values are used for:
   - `slug: "pmi"`
   - `name: "PMI.org Redesign"`
   - `client: "Project Management Institute"`

4. Remove any obsolete references like:
   - `slug: "pmi-agile"`
   - `slug: "pmi-acp"`
   - inconsistent names like `"PMI Agile"` when they’re actually referring to the same redesign work.

Keep the **content** of the narrative intact; just normalize its identifiers.

---

## Step 3 — Map page paths to `projectSlug = "pmi"` in `derive_context`

1. Open `src/lib/ai/modalGraph.ts` and locate the node/function that derives context, likely called `derive_context`.

2. Find where `projectSlug` is determined from `pagePath`.
   - E.g. logic like:

   ```ts
   if (pagePath.startsWith("/work/capital-one-travel")) {
     projectSlug = "capital-one-travel";
   }
   ```

3. Add a **PMI mapping block** so that all PMI-related paths set the same slug:

   ```ts
   if (
     pagePath.startsWith("/work/pmi") ||
     pagePath.startsWith("/work/pmi-agile") ||
     pagePath.startsWith("/work/pmi-acp")
   ) {
     projectSlug = "pmi";
   }
   ```

4. Make sure this mapping happens **before** returning the updated state, and that the returned state uses the canonical `projectSlug`:

   ```ts
   return {
     ...state,
     pagePath,
     projectSlug,
     // other fields
   };
   ```

5. Append a debug note when PMI is detected to help with future debugging:

   ```ts
   if (projectSlug === "pmi") {
     state.debugNotes.push("derive_context: normalized projectSlug to 'pmi'");
   }
   ```

---

## Step 4 — Normalize PMI mentions in modalGraph logic

1. Still in `modalGraph.ts`, search for any hard-coded checks using older PMI identifiers, e.g.:

   ```ts
   "pmi-agile"
   "pmi-acp"
   "Project Management Institute" // in places where slug equality is needed
   ```

2. Where those checks are used to determine behavior for a *project*, update them to rely on the canonical slug instead:

   ```ts
   if (state.projectSlug === "pmi") {
     // PMI-specific logic here
   }
   ```

3. Do **not** remove human-readable mentions of "Project Management Institute" in answer text or KB content — just ensure **programmatic routing** uses `projectSlug === "pmi"`.

---

## Step 5 — Normalize PMI in any `loadAllProjects` or cross-project logic

1. Look for any cross-project logic that relies on slugs, such as:
   - `loadAllProjects()`
   - `state.allProjects`
   - cross-project tools filtering in `generate_answer`

2. Ensure PMI is represented exactly once with `slug: "pmi"` and uses the canonical tools list:

   ```ts
   tools: ["React", "TypeScript", "Next.js", "Storybook", "Figma"]
   ```

3. If there is any logic that tries to special-case `"pmi-agile"` or `"pmi-acp"`, update it to the canonical slug.

4. Confirm that tools-only questions on a PMI page (e.g. "What tools did you use on this project?") now:
   - set `projectSlug === "pmi"`
   - find the PMI entry from `allProjects`
   - return a deterministic answer with the canonical tools.

---

## Step 6 — Optional: Alias detection in user questions

If there is a simple, safe place to do it (and without adding heavy complexity), you may add minimal alias detection so that user questions like:

- "What did he do for PMI-ACP?"
- "What about PMI Agile?"

are recognized as PMI:

```ts
const lowerQ = state.question.toLowerCase();

if (
  !state.projectSlug &&
  (lowerQ.includes("pmi acp") ||
    lowerQ.includes("pmi-acp") ||
    lowerQ.includes("pmi agile") ||
    lowerQ.includes("pmi.org"))
) {
  state.projectSlug = "pmi";
  state.debugNotes.push("derive_context: normalized projectSlug to 'pmi' from question text");
}
```

This is optional but helpful for queries coming from non-PMI pages.

---

## Definition of Done

You are done when all of the following are true:

- [ ] There is exactly **one** PMI ProjectFacts entry using `slug: "pmi"` with the canonical name, client, tools, role, and summary.
- [ ] The PMI KB files (`pmi-longform.yaml`, `pmi-shortform.json`, etc.) use `slug: pmi` and `project: PMI.org Redesign` consistently.
- [ ] `derive_context` maps all PMI-related page paths (e.g. `/work/pmi`, `/work/pmi-agile`, `/work/pmi-acp`) to `projectSlug = "pmi"`.
- [ ] Any older references to `"pmi-agile"` or `"pmi-acp"` used for routing/logic have been updated to use `"pmi"`.
- [ ] Tools-only questions on PMI pages resolve to a deterministic tools list (React, TypeScript, Next.js, Storybook, Figma) **without** hallucinated stacks.
- [ ] `state.debugNotes` includes a note when PMI is normalized, making this behavior visible in the dev harness.

Make these changes now.
# Cursor Prompt — Final PMI Normalization Fixes

You are working in the **pfaff-designs** repo.
Your task: **complete PMI normalization** by addressing the final remaining items.

PMI unification is *almost* fully complete. The remaining work is small and focused.

---

## ✅ REQUIRED FIX 1 — Add canonical metadata to `pmi-shortform.json`

Open:
```
src/lib/kb/pmi-shortform.json
```

Add the missing top‑level metadata so it matches the structure used by other shortform KB files (e.g., Capital One, Tanger):

```jsonc
{
  "slug": "pmi",
  "name": "PMI.org Redesign",
  "client": "Project Management Institute",
  // keep the rest of the existing content intact
}
```

This makes shortform KB consistent with:
- `loadAllProjects()`
- `pmi-longform.YAML`
- modalGraph canonical slug

Do **not** rename or remove the existing narrative fields — only add the metadata.

---

## ⚠️ REQUIRED FIX 2 — Verify PMI identity is fully unified

Search the repo for:
```
pmi-agile
pmi-acp
```

These identifiers should appear **only** in:
- `derive_context` (path normalization like `/work/pmi-agile` → `projectSlug = "pmi"`)
- optional question‑based alias detection

If they appear **anywhere else** (slug definitions, ProjectFacts entries, KB metadata), update those references so the canonical value is always:

```ts
slug: "pmi"
```

The normalization logic *should stay* — don’t remove it.

---

## 🟢 REQUIRED FIX 3 — Do NOT modify narrative content

In `pmi-longform.yaml`, leave narrative references like:
- "PMI-ACP"
- "Agile certification"

These references are correct in the story and should **not** be rewritten.

Only identifiers (slug, project name, client) needed normalization — narrative content stays the same.

---

## 🧪 REQUIRED FIX 4 — Verify PMI responses via the dev harness

After making the above updates, test using:
```
/api/dev/modal-graph
```
With payload examples like:

### Example A — Tools question
```json
{
  "question": "What tools did you use on this project?",
  "pagePath": "/work/pmi",
  "projectSlug": "pmi",
  "sectionHeadline": "Overview",
  "sectionText": "",
  "history": []
}
```
Expected:
- `projectSlug: "pmi"`
- deterministic tools answer (React, TypeScript, Next.js, Storybook, Figma)
- **no hallucinated stacks**

### Example B — Alias detection
```json
{
  "question": "What did he do for PMI-ACP?",
  "pagePath": "/",
  "projectSlug": null,
  "sectionHeadline": "",
  "sectionText": "",
  "history": []
}
```
Expected:
- `projectSlug` normalized to `"pmi"`
- debugNotes includes alias detection
- answer grounded in PMI.org Redesign

---

## Definition of Done
PMI normalization is fully complete when:
- [ ] `pmi-shortform.json` includes `slug`, `name`, and `client` fields
- [ ] No KB files or project registrations use `pmi-agile` or `pmi-acp` as slugs
- [ ] Normalization logic only appears in path and alias detection
- [ ] Narrative content remains unchanged
- [ ] `/api/dev/modal-graph` tests show consistent PMI identity and correct deterministic tools answers

Make these changes now.
# Cursor Prompt — Phase 9.2B — Mode-Carrying in the Modal UI

You are working in the **pfaff-designs** repo.
Your task: **implement end-to-end mode-carrying** in the AI modal assistant so that:
- The modal API returns `mode` from the LangGraph agent.
- The frontend stores that `mode` on assistant messages.
- The UI displays a **dev-only label** showing which mode was used.

Do NOT modify layout, orchestrator, or RAG here. Only modal wiring.

---

## 1. Ensure the modal API returns `{ answer, mode, debugNotes }`

Open the modal assistant API route. It will be one of:
```
src/app/api/ai/modal/route.ts
src/app/api/modal/route.ts
```

Inside the POST handler:
- The old AI logic may still exist. **Replace only the AI call**, not the route shape.
- After building `initialState`, call:

```ts
const finalState = await modalGraphApp.invoke(initialState);
```

Extract safe values:

```ts
const mode =
  (finalState as any).conversationMode ||
  (finalState as any).mode ||
  "answer_direct";

const answer =
  (finalState as any).answerText ||
  (finalState as any).answer ||
  "";

const debugNotes = (finalState as any).debugNotes || [];
```

Return the modal response:

```ts
return NextResponse.json({
  answer,
  mode,
  debugNotes,
});
```

Make sure the API does NOT return the entire `finalState` in production.

---

## 2. Update the frontend chat message type

Find the modal message type (e.g. `ChatMessage`). Add:

```ts
type ConversationMode =
  | "answer_direct"
  | "clarify_then_answer"
  | "low_context_fallback";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: ConversationMode; // only for assistant messages
};
```

Fix any TypeScript errors in places that construct messages.

---

## 3. Store `mode` when appending assistant messages

Open the hook/component that sends the modal request. It likely does:
```ts
const res = await fetch("/api/ai/modal", {...});
const data = await res.json();
```

Update the message append logic:

```ts
setMessages((prev) => [
  ...prev,
  {
    id: crypto.randomUUID?.() ?? String(Date.now()),
    role: "assistant",
    content: data.answer,
    mode: data.mode,
  },
]);
```

Add dev logging:

```ts
if (process.env.NODE_ENV === "development") {
  console.log("[modalGraph] mode:", data.mode);
  console.log("[modalGraph] debugNotes:", data.debugNotes);
}
```

---

## 4. Add a dev-only mode label to the assistant bubble

Find the component rendering chat bubbles (e.g. `ChatMessageBubble`). Then:

```tsx
{message.role === "assistant" &&
  message.mode &&
  process.env.NODE_ENV === "development" && (
    <span className="mb-1 block text-xs text-muted-foreground">
      {message.mode === "answer_direct" && "Direct answer"}
      {message.mode === "clarify_then_answer" && "Answer + follow-up"}
      {message.mode === "low_context_fallback" && "Low-context overview"}
    </span>
)}
```

Keep the styling minimal and consistent.

---

## 5. Sanity Checks

After implementing:
- Ask “What tools did you use?” on a project page → label says **Direct answer**.
- Ask “What other projects has he worked on?” → label says **Answer + follow-up**.
- Ask “What does he do?” on the homepage → label shows **Low-context overview**.

Ensure:
- No TypeScript errors.
- No runtime errors.
- Modal still opens and scrolls properly.

---

## Cursor Checklist

- [ ] Modal API returns `{ answer, mode, debugNotes }`.
- [ ] ChatMessage type includes `mode?: ConversationMode`.
- [ ] Assistant messages store `mode`.
- [ ] Dev-only mode label renders in assistant bubbles.
- [ ] Everything compiles and UI works.

Make these changes now.

---

## 📝 Cursor Feedback & Observations

**Date:** 2024-12-19

### ✅ Implementation Status

Based on code review and conversation history, the following phases appear to be **complete**:

- ✅ **Phase 8.1** — Conversation Policy: `ConversationMode` type, `computeContextScores`, deterministic `conversationPolicyNode` implemented
- ✅ **Phase 8.3** — Generate Answer Mode Handling: Structured user message format, mode-aware system prompt, error handling
- ✅ **Phase 9.1** — Production Modal Rewiring: `/api/ai/modal` now uses `modalGraphApp.invoke()`
- ✅ **Phase 9.2A** — PMI Data & Tools: PMI facts enriched, deterministic tools answers, system prompt anti-hallucination rules
- ✅ **Phase 9.2B** — Mode-Carrying: Frontend stores `mode`, dev-only label implemented
- ✅ **PMI Normalization** — Canonical identity unified: `slug: "pmi"` throughout, path normalization, alias detection, KB files updated

### 📋 File Organization Suggestion

This file contains **multiple historical prompts** stacked sequentially. Consider:

1. **Archiving completed prompts** to a `prompts/archive/` directory
2. **Keeping only the active/current prompt** at the top
3. **Adding a status header** indicating which phase is currently active
4. **Creating a roadmap summary** that references archived prompts by phase number

This would make it easier to:
- Identify what work is currently needed
- Avoid confusion about which instructions are active
- Track progress through phases
- Reference historical context when needed

### 🔍 Code Quality Observations

**Strengths:**
- Well-structured LangGraph implementation with clear node separation
- Comprehensive debug notes for troubleshooting
- Deterministic routing logic prevents unnecessary LLM calls
- Good separation of concerns (derive → retrieve → build → policy → generate)

**Potential Improvements:**
- Consider extracting `GENERATE_ANSWER_SYSTEM_PROMPT` to a separate file if it grows
- The `loadAllProjects()` helper uses static data — consider documenting when/if this should be replaced with dynamic KB loading
- PMI normalization logic is well-implemented but could benefit from unit tests

### 🧪 Testing Recommendations

The test scripts created (`test-pmi-normalization.sh`, `test-phase-9.2.sh`) are helpful. Consider:

1. **Automated integration tests** for the modal graph nodes
2. **Snapshot tests** for deterministic answers (tools, project lists)
3. **E2E tests** for the modal UI flow
4. **Regression tests** for PMI normalization edge cases

### 📌 Next Steps (If Applicable)

If there's a **new active phase**, consider:
- Adding a clear header: `# ACTIVE PROMPT — Phase X.Y — [Description]`
- Moving completed phases to an archive section
- Updating the roadmap file (`extra-files/v1-roadmap.md`) with current status

### ⚠️ Potential Issues to Watch

1. **Environment Variables**: Ensure `NEXT_PUBLIC_NODE_ENV` is set correctly for dev-only features (mode labels)
2. **Type Safety**: Some `(finalState as any)` casts in API routes — consider stronger typing
3. **Error Handling**: Verify Anthropic API error fallbacks are user-friendly in production
4. **Performance**: Monitor graph execution time as more nodes are added

### 💡 Suggestions

1. **Documentation**: Consider adding JSDoc comments to key functions explaining the graph flow
2. **Logging**: The debug notes system is excellent — consider adding structured logging for production monitoring
3. **Validation**: Add runtime validation for `ModalGraphState` to catch type mismatches early

---

**Overall Assessment:** The implementation is well-structured and follows the prompts accurately. The main improvement would be organizing this prompt file to clearly indicate what's active vs. historical.