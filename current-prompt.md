# Phase 10.1 — Implement Command Model, Registry & Context Object (No UI)

## 🎯 Goal
Implement the underlying "brain" of the Cmd+K Atlas-style command palette. This task does **not** include any UI. You are building the deterministic command engine that the UI will call into during Phases 10.2–10.5.

---

## ✅ What You Must Build

### 1. `CommandKind` + `Command` Interface
Create a strongly typed command schema in `src/lib/cmdk/command-types.ts`:

```ts
export type CommandKind =
  | "nav"
  | "ai_quick"
  | "ai_deep"
  | "download"
  | "help";

export interface Command {
  id: string;
  kind: CommandKind;
  label: string;
  description?: string;
  keywords: string[];
  visible?: (ctx: CommandContext) => boolean;
  run: (ctx: CommandContext) => void | Promise<void>;
}
```

---

### 2. `CommandContext` Implementation
Create `src/lib/cmdk/command-context.ts`.

This object represents the environment in which commands run.

```ts
export interface CommandContext {
  input: string; // raw Cmd+K query
  path: string; // current page path
  projectSlug?: string | null;
  selectionText?: string;
  sectionHeadline?: string;
  sectionText?: string;

  openAiModal: (args: {
    question: string;
    pagePath?: string;
    projectSlug?: string | null;
    sectionHeadline?: string;
    sectionText?: string;
  }) => void;

  openInlineChat: (args: {
    question: string;
    selectionText?: string;
    sectionText?: string;
  }) => void;

  navigate: (path: string) => void;
  download: (path: string) => void;
}
```

During Phase 10.1, all actions can be **stubbed with console.log**. Actual wiring happens in Phase 10.2–10.4.

---

### 3. Build the `commandRegistry`
Create `src/lib/cmdk/command-registry.ts` with a complete list of commands.

Include:

#### 🔹 Navigation Commands
- Home → `/`
- Work → `/work`
- Each project route:
  - Capital One → `/work/capital-one-travel`
  - PMI → `/work/pmi`
  - Tanger → `/work/tanger`
  - Coke → `/work/coke`
  - Portfolio → `/work/pfaff-designs-portfolio`

#### 🔹 Quick AI Commands (`ai_quick`)
Use `ctx.openInlineChat()` for:
- “Summarize selected text” (visible only when `selectionText` exists)
- “Summarize this page”
- “Rewrite to be clearer” (only when selection exists)

#### 🔹 Deep AI Commands (`ai_deep`)
Use `ctx.openAiModal()` for:
- "Ask about this project"
- "Cross-project question"
- "Deep explanation"

#### 🔹 Download Commands
- Download resume → `/charles-pfaff-resume.pdf`

#### 🔹 Help Command
Shown when no command matches.

---

### 4. Implement Deterministic `filterCommands()`
Create `src/lib/cmdk/command-filter.ts`:

```ts
export function filterCommands(input: string, ctx: CommandContext): Command[] {
  const q = input.toLowerCase().trim();

  const matches = commandRegistry.filter(cmd => {
    const visible = cmd.visible ? cmd.visible(ctx) : true;
    if (!visible) return false;

    const haystack = `${cmd.label} ${cmd.keywords.join(" ")}`.toLowerCase();
    return haystack.includes(q);
  });

  if (matches.length > 0) return matches;

  // fallback: return only the help command
  return commandRegistry.filter(cmd => cmd.kind === "help");
}
```

---

## 📁 File Structure

Place files here:

```
src/lib/cmdk/
  command-types.ts
  command-context.ts
  command-registry.ts
  command-filter.ts
  index.ts
```

`index.ts` should export everything.

---

## 📌 Acceptance Criteria
- All TypeScript compiles
- No UI changes
- Commands log execution correctly
- filterCommands works deterministically
- Registry is complete and grouped properly
- Context object is correctly shaped

---

## 🚀 After Completion
Phase 10.2 will implement:
- Cmd+K listener
- Pill-shaped floating input
- Rendering of filtered commands
- Keyboard navigation
- Executing the `run(ctx)` handler

---

## 📝 Clarifying Questions

**Date:** 2024-12-19

### 1. Project Slug Discrepancies

The prompt lists these routes:
- Tanger → `/work/tanger` 
- Coke → `/work/coke`
- Portfolio → `/work/pfaff-designs-portfolio`

But the actual slugs in the codebase are:
- Tanger → `/work/tanger-outlets`
- Coke → `/work/coca-cola-creative-technology`
- Portfolio → `/work/pfaff-designs`

**Question:** Should I use the actual slugs from the codebase, or create aliases/multiple commands for both variants?

---

### 2. Resume Download Path

The prompt references `/charles-pfaff-resume.pdf`, but this file doesn't exist in the codebase.

**Question:** Should I:
- Stub it with `console.log` for now?
- Use a placeholder path?
- Skip the download command entirely?

---

### 3. `openInlineChat` Implementation

The `CommandContext` interface includes `openInlineChat()`, but this function doesn't exist in the codebase yet.

**Question:** Should I:
- Stub it with `console.log` for now (as mentioned in the prompt)?
- Leave it as a placeholder in the interface?

---

### 4. Command ID Format

The prompt doesn't specify a format for command IDs.

**Question:** What format should I use? For example:
- `nav-home`, `nav-work`, `ai-quick-summarize-selection`
- Or something else?

---

### 5. Command Keywords

The prompt doesn't specify keywords for each command.

**Question:** Should I infer reasonable keywords based on the command purpose, or do you have specific keywords in mind?

**Example keywords I'm considering:**
- Navigation: `["home", "index", "main"]` for Home command
- AI Quick: `["summarize", "summary", "brief"]` for summarize commands
- AI Deep: `["ask", "question", "explain", "tell me"]` for deep AI commands

---

### 6. Additional Projects

I found `real-estate-platform` in the case studies data, but it's not mentioned in the prompt.

**Question:** Should I include it in the navigation commands, or only include the projects listed in the prompt?

---

### 7. Help Command Details

The prompt mentions a help command shown when no matches are found, but doesn't specify:
- What the help command should do
- What its label/description should be
- What keywords it should have

**Question:** Should I create a generic help command that explains how to use the command palette, or something more specific?

```