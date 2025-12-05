getting-started.md

Updated to match the real codebase + Cursor’s feedback

# Getting Started  
_Updated for the actual `pfaff-designs` codebase_

This document explains how to set up, run, and contribute to the `pfaff-designs` Next.js project.  
Everything here accurately reflects the current implementation.

---

# 1. Prerequisites

The project requires:

- **Node.js 18+**  
  Check version:  
  ```bash
  node --version
  ```

- **npm 9+**  
  Check version:  
  ```bash
  npm --version
  ```

- **macOS or Linux recommended**  
- **Cursor or VSCode** (Cursor is preferred)

---

# 2. Install Dependencies

Install all packages:

```bash
npm install
```

---

# 3. Available Commands

From `package.json`, the valid commands are:

```bash
npm run dev           # Start Next.js locally
npm run build         # Build for production
npm run start         # Start production build

npm run lint          # Run ESLint
npm run storybook     # Start Storybook (pre-configured)
npm run embed-projects  # Embeds project metadata (internal tooling)
```

### ⚠️ Not implemented:
- No `test` script exists  
- No Jest config exists  
- No test files exist  

Testing is **planned** but currently **not configured**.

---

# 4. Project Stack (Exact Versions)

### Runtime & Framework
- **Next.js: 14.2.33** (App Router)
- **React: 18.3.1**
- **TypeScript: 5.9.3**

### Styling & UI
- **Tailwind CSS v4** (via `@tailwindcss/postcss`)
- **shadcn/ui** (generated components in `src/components/ui/`)
- **Radix Primitives** (via shadcn/ui)
- **globals.css** includes:
  - CSS variables (colors, radii, spacing, typography)
  - `@import "tailwindcss";` (Tailwind v4 syntax)

### AI & Orchestration
- **Anthropic (Haiku/Sonnet/Opus)**  
- **LangChain** (retrieval, pipeline, orchestration)
- **RAG system** (custom implementation)

### Data & Storage
- **Supabase**  
  - Database  
  - Storage (images)  
  - Public image URLs resolved via media registry

### Tooling
- Storybook 10  
- ESLint  
- Prettier  
- tsx  
- Vercel deployment ready

---

# 5. Folder Structure (Accurate to Codebase)

```
src/
  app/
    api/             # Next.js App Router API routes
    globals.css      # Imports Tailwind + design tokens
    layout.tsx
    page.tsx
  components/
    atoms/           
    molecules/
    organisms/
    page-components/
    templates/
    layout/
    media/
    utility/         # Renderer, AIIndicator, Divider, Spacer
    ui/              # shadcn/ui primitives
    ai/              # Legacy AI components (Composer, SectionAIAnswer, etc.)
    # ai-modal/     # Planned, NOT implemented yet
  docs/              # Internal documentation
  hooks/
    useTypewriter.ts
  lib/
    ai/              # AI pipeline, orchestrator, copywriter
    caseStudies/
    kb/
    layout/          # Block schemas, AnswerBlock schema
    media/
    pages/
    projects/
    rag/
    registry/        # componentRegistry
    supabase/        # Supabase client utilities
    utils/
    validation/
  stories/           # Storybook stories
```

### Notes
- `src/pages/` does **not** exist — this is **App Router**, not Pages Router.
- `src/tests/` does **not** exist.
- `src/styles/` does **not** exist — styles live in `globals.css`.

---

# 6. AI System Overview (Implemented vs Planned)

The system currently has **only one AI response pathway**:

### ✔ Implemented: Page Mode Pipeline
```
Retrieval → Copywriter → Orchestrator → Renderer → UI
```

### ⚠️ Planned but NOT implemented yet: AI Modal Path
The following do **not exist yet**:

- `src/components/ai-modal/`
- `AskAiPill`
- `AiModal`
- `/api/ai/modal`

The document references these as part of the **future conversational overlay**, but they are not yet in the codebase.

Today, the only API route is:

```
/api/ai/query
```

This powers standard Q&A across the site.

---

# 7. Styling (Tailwind v4 + shadcn/ui Notes)

### Tailwind v4 uses:

- `@import "tailwindcss"` (not @tailwind directives)
- PostCSS plugin: `@tailwindcss/postcss`
- Build-time class scanning

### shadcn/ui

To add new components:

```bash
npx shadcn-ui@latest add button
```

Components go to:

```
src/components/ui/
```

---

# 8. Environment Variables

Create `.env.local` with the following:

```env
# AI
ANTHROPIC_API_KEY=""

# Supabase
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""

# Optional: media fallbacks
NEXT_PUBLIC_SUPABASE_PLACEHOLDER_IMAGE_URL=""

# LangSmith (optional)
LANGSMITH_API_KEY=""
LANGSMITH_ENDPOINT="https://api.smith.langchain.com"

# Optional logging behavior
DEBUG=""
```

These must be set for AI responses + media loading.

---

# 9. Supabase Setup

The project expects:

- A Supabase project for image hosting
- `public/projects/` or similar folder structure
- Public URLs for all media
- Images registered in:
  ```
  src/lib/media/mediaRegistry.ts
  ```

When adding new images:

1. Upload to Supabase Storage.
2. Add entry to `mediaRegistry`.
3. Use ID (not URL) in the KB YAML.

---

# 10. LangChain Setup

AI pipeline lives in:

```
src/lib/ai/
```

Components:
- `pipeline.ts`
- `retrieval.ts`
- `copywriter.ts`
- `orchestrator.ts`

Requires:
- Anthropic API key
- Knowledge Base loaded from `/lib/kb/`

---

# 11. Case Study Data

Case studies live in:

```
src/lib/caseStudies/
src/lib/pages/
src/lib/projects/
```

These define:
- Metadata
- Descriptions
- KB references
- Layouts (via Orchestrator)

Use `npm run embed-projects` to regenerate project metadata.

---

# 12. Storybook

Storybook is fully configured.

Run:

```bash
npm run storybook
```

Supports:
- Atoms
- Molecules
- Page components
- Layout previews

---

# 13. Testing (Planned, Not Implemented)

The project currently:

- Has **no Jest config**
- Has **no test scripts**
- Has **no test files**

Testing is planned but not yet ready.

This document references testing only as a **future requirement**.

---

# 14. Quick Start

For a new contributor:

1. Clone the repo  
2. Run:  
   ```bash
   npm install
   ```
3. Create `.env.local` using the template in Section 8  
4. Start the dev server:  
   ```bash
   npm run dev
   ```
5. Start Storybook (optional):  
   ```bash
   npm run storybook
   ```
6. Explore components under `src/components/`  
7. Review AI pipeline under `src/lib/ai/`  

---

# 15. What’s Next?

Read these documents next:

- `architecture.md`
- `component-inventory.md`
- `design-rules.md`
- `dev-rules.md`

These define:
- System behavior  
- Generative UI rules  
- Component registry  
- AI modal future architecture  

---

# 16. Summary

This guide now accurately reflects the **current state** of the project:

✔ Correct commands  
✔ Correct folder structure  
✔ Correct versions  
✔ Realistic stack  
✔ Accurate AI flow  
✔ Clear separation of implemented vs planned features  
✔ Accurate Supabase + LangChain setup  
✔ Correct absence of Jest/tests  

This is now a reliable on-ramp for anyone working in the repo.