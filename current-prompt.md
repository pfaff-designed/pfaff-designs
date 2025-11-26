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