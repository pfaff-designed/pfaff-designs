


# 🛠️ Cursor Refactor Prompt — Apply Repository Audit (Do Not Break Behavior)

Cursor, you’ve just produced a detailed repository audit report. Now I want you to **apply that audit safely**.

Your goal is to:

1. Bring the repo into alignment with the **atomic design taxonomy** and audit findings.
2. **Make no behavioral changes** to the site: all pages, routes, and AI features must continue to work exactly as before.
3. Keep the refactor **small, mechanical, and low-risk**, focused on **moving and wiring components**, not redesigning them.

Use this document as the **single source of truth** for what to change.

---

## 🔭 High-Level Rules

Before touching any code:

- ✅ **Do**: Move files, update imports, and adjust exports so structure matches the audit.
- ✅ **Do**: Add comments/TODOs where full cleanup would be risky or too invasive.
- ❌ **Do NOT**:
  - Change component behavior or appearance.
  - Change props or public APIs of components.
  - Change business logic.
  - Delete components without first verifying they are truly unused.

After every set of edits, you must ensure:

- `pnpm lint` **or** `pnpm test` (if present) produces no new errors.
- `pnpm dev` (or `pnpm next dev`) can run the app successfully.
- TypeScript builds cleanly for all changed files.

---

## 1. Apply Critical Moves from the Audit (Phase A)

These are the “must fix” changes that realign the structure with the audit, but should not change runtime behavior.

### 1.1 Move `Header` from `page-components/` to `organisms/`

**Current location:**

- `src/components/page-components/Header/Header.tsx`
- `src/components/page-components/Header/Header.stories.tsx`
- `src/components/page-components/Header/index.ts`

**Target location:**

- `src/components/organisms/Header/Header.tsx`
- `src/components/organisms/Header/Header.stories.tsx`
- `src/components/organisms/Header/index.ts`

**Implementation details:**

1. Physically move the `Header` folder from `page-components` to `organisms`.
2. Update **all imports** of `Header` to point to the new path, including:
   - `src/app/layout.tsx`
   - Any other files that import `Header` (search for `"Header"` imports).
3. Make sure the barrel file (`index.ts`) still re-exports correctly from the new path.
4. Ensure Storybook still loads the `Header` stories from the new path (update story imports if necessary).

> ✅ Goal: `Header` is now treated as an **organism** (reusable, section-level) rather than a page-specific component.

---

### 1.2 Move `Footer` from `page-components/` to `organisms/`

**Current location:**

- `src/components/page-components/Footer/Footer.tsx`
- `src/components/page-components/Footer/Footer.stories.tsx`
- `src/components/page-components/Footer/index.ts`

**Target location:**

- `src/components/organisms/Footer/Footer.tsx`
- `src/components/organisms/Footer/Footer.stories.tsx`
- `src/components/organisms/Footer/index.ts`

**Implementation details:**

1. Move the `Footer` folder from `page-components` to `organisms`.
2. Update **all imports** of `Footer`, including:
   - `src/app/layout.tsx`
   - Any other consumers you find via search.
3. Keep the exports (`index.ts`) consistent so external callsites don’t need API changes.

> ✅ Goal: `Footer` becomes an **organism** that can be reused across pages.

---

### 1.3 Move `CaseStudyHero` from `templates/` to `page-components/`

**Current location:**

- `src/components/templates/CaseStudyHero.tsx`

**Target location:**

- `src/components/page-components/CaseStudyHero/CaseStudyHero.tsx`
- `src/components/page-components/CaseStudyHero/index.ts`

**Implementation details:**

1. Create a new folder:  
   `src/components/page-components/CaseStudyHero/`
2. Move `CaseStudyHero.tsx` into that folder and rename if needed:  
   `CaseStudyHero/CaseStudyHero.tsx`
3. Add an `index.ts` that re-exports the component:

   ```ts
   // src/components/page-components/CaseStudyHero/index.ts
   export { CaseStudyHero } from "./CaseStudyHero";
   ```

4. Update **all imports** of `CaseStudyHero` to use the new path, including:
   - `src/lib/registry/componentRegistry.ts`
   - Any other files that reference `CaseStudyHero`.

5. In `componentRegistry.ts`, update the import to match the new location, for example:

   ```ts
   // Before (example)
   import { CaseStudyHero } from "@/components/templates/CaseStudyHero";

   // After
   import { CaseStudyHero } from "@/components/page-components/CaseStudyHero";
   ```

> ✅ Goal: `CaseStudyHero` is now treated as a **page-component** (project-specific hero), which matches how it is used.

---

## 2. Oversized Components — Add TODOs, Don’t Restructure Yet

The audit flagged **Composer** as oversized and suggested moving it into `ai-modal/` or `utility/`. That’s a larger refactor and could be risky.

For now, we’ll **document the issue clearly** without changing behavior.

### 2.1 Composer Size Warning

**Location:**

- `src/components/molecules/Composer/Composer.tsx`

**Current state:**

- ~330 lines (above molecule limit of ~250 lines).
- Contains significant state and interaction logic.

**What to do now:**

1. At the top of `Composer.tsx`, add a clear comment:

   ```ts
   // TODO(pfaff-designs):
   // Composer currently exceeds the recommended size for a molecule (~330 lines).
   // It is tightly coupled to the AI modal system and may belong in `ai-modal/`
   // or should be split into smaller parts (presentation vs logic).
   // For V1 stability, DO NOT refactor this yet. Revisit in a post-launch cleanup.
   ```

2. Do **not** change imports, exports, or behavior.
3. Do **not** move the file yet.

> ✅ Goal: Flag the problem clearly without introducing risk before launch.

---

## 3. Potentially Unused Components — Mark for Verification Only

The audit listed several components that **might** be unused:

- `Metric` (atom)
- `MediaCard` (molecule)
- `InputWithButton` (molecule)
- `TextareaWithButton` (molecule)
- `AIIndicator` (utility)
- `Divider` (utility)
- `Spacer` (utility)
- `Stack` (layout)

**For this pass, DO NOT delete anything.** Instead, we will:

### 3.1 Add “Candidate for Removal” Comments

For each of the above components:

1. Open the main `.tsx` file for the component.
2. At the top of the file, add a comment like:

   ```ts
   // NOTE(pfaff-designs):
   // This component appears to be unused in the current codebase.
   // Before removing, verify usage across:
   // - All app routes and pages
   // - AI modal / command palette / inline chat
   // - Storybook stories
   // If still unused after verification, it is a good candidate for removal in a later cleanup pass.
   ```

3. Ensure there are **no behavior changes** — just comments.

> ✅ Goal: Prepare a clear list of cleanup candidates while keeping V1 fully stable.

---

## 4. Keep Atomic Design and Non-Atomic Folders Intact

Do **not** move or rename these directories:

- `ai/` — AI/RAG/modalGraph logic
- `ai-modal/` — AI modal system
- `cmdk/` — command palette system
- `inline-chat/` — inline chat system
- `layout/` — Section, Container, Stack (layout primitives)
- `media/` — media helpers
- `ui/` — shared UI primitives
- `utility/` — utilities like Toast, ImageLightbox, etc.

These are **system-level** or **layout-level** modules and sit **outside** the atoms/molecules/organisms taxonomy.

> ✅ Goal: Honor the audit’s taxonomy: atomic design is for UI primitives and compositions, while system folders remain separate.

---

## 5. Verification Steps (Required)

After applying all file moves and comments:

1. Run TypeScript check or build (whichever is standard in this repo).
2. Run lint/tests if configured (e.g., `pnpm lint`, `pnpm test`).
3. Start the dev server and confirm:
   - Home page renders.
   - Work/case study pages render.
   - AI modal opens and responds.
   - Command palette opens and is usable.
   - Contact page works.

If **any** runtime or type errors appear, fix them **without changing the intent** of this refactor. Focus on:

- Fixing broken import paths.
- Fixing incorrect barrel exports.
- Fixing any path updates caused by moves.

---

## 6. Output Summary

When you’re done, prepare a brief summary (in comments or PR description) that includes:

- Which files were moved.
- Which imports were updated.
- Which components received TODO/NOTE comments.
- Any follow-up work you recommend (e.g., Composer refactor, unused component removal).

---

### Final Reminder

This refactor is about **structure**, not **new behavior**.

- If a change would alter how a component renders or behaves, **don’t make it**.
- If you’re unsure about removing something, **leave it in** and mark it with a TODO/NOTE.

Apply this prompt now to bring the repo into alignment with the audit while keeping V1 fully stable.