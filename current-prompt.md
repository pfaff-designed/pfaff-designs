You are working in the `pfaff-designs` repo.

Before making any edits:

1. **Read this entire prompt carefully.**
2. **Locate the KB files** under the `knowledge-base/` directory.
3. **Locate all project files** (YAML + JSON) for:
   - Tanger
   - Coca-Cola
   - Capital One Travel
   - PMI
   - Pfaff-Designs
4. **Do not begin editing** until you understand where each file lives and how it is structured.
5. **Do not begin** until you've asked clarifying questions, or if you have no answers confirmed you understand

We are implementing **Option A**:

> **The KB one_liner becomes the canonical short description.**
> **The database column `summary_short` must mirror this value.**

This fixes:
- Foreign key errors in `project_sections`  
- `NOT NULL` constraint violations on `projects.summary_short`  
- Missing project rows that block embedding

---

# GOAL

Implement a complete **project sync pipeline** that ensures:

### 1. Every project in the KB exists in the Supabase `projects` table  
### 2. `summary_short` always equals the KB `one_liner`  
### 3. Sync happens **before** embeddings are generated  
### 4. No KB files are modified  
### 5. Nothing breaks existing loaders

This requires:

- Adding `one_liner` support to the KB loader  
- Creating a new script to sync project metadata to Supabase  
- Updating npm scripts  
- Ensuring the embedding script (`scripts/embed-kb.ts`) can safely run afterward  

---

# PART 1 — Update KB Loader Types

File: `src/lib/kb/types.ts`

Add:

```ts
one_liner?: string;
```

to `ProjectKBEntry`.

Do not remove or rename any existing fields.

---

# PART 2 — Update `loadProjectsKB()` to expose `one_liner`

File: `src/lib/kb/loader.ts`

Inside `loadProjectsKB()`:

1. Load `one_liner` from **facts JSON** and/or longform YAML (`project.one_liner`)
2. Inject it into the returned `ProjectKBEntry`

Example shape:

```ts
return {
  id: proj.id,
  slug: proj.slug,
  client: proj.client,
  title: proj.title,
  summary: facts?.projectSummary,
  one_liner: facts?.one_liner ?? longform?.project?.one_liner ?? null,
  sections,
};
```

Do not modify how sections are created.

---

# PART 3 — Create script: `scripts/sync-projects-from-kb.ts`

This script must:

### ✔ Load all projects using `loadProjectsKB()`
### ✔ Connect to Supabase using:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### ✔ For each project:
Upsert into the `projects` table:

Required fields:
- `slug`
- `name` (project title)
- `client`
- `summary_short` ← **MUST equal `one_liner`**

Use:

```ts
onConflict: "slug"
```

### ✔ Log clear success/failure messages  
### ✔ Never modify KB content  
### ✔ Never write to `project_sections`  
### ✔ Do not break existing logic

Example structure:

```ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { loadProjectsKB } from "@/lib/kb/loader";

async function syncProjects() {
  console.log("[KB] Syncing projects…");

  const projects = loadProjectsKB();

  for (const proj of projects) {
    const oneLiner =
      proj.one_liner ??
      proj.summary ??
      "Portfolio project"; // safe fallback

    const { error } = await supabase.from("projects").upsert(
      {
        slug: proj.id,
        name: proj.title,
        client: proj.client,
        summary_short: oneLiner,
      },
      { onConflict: "slug" }
    );

    if (error) {
      console.error(`[KB] ❌ Failed to upsert project ${proj.id}`, error);
    } else {
      console.log(`[KB] ✅ Project synced: ${proj.id}`);
    }
  }

  console.log("[KB] Done.");
}

syncProjects().catch((err) => {
  console.error("[KB] sync-projects-from-kb failed", err);
  process.exit(1);
});
```

Place this file at:

```
scripts/sync-projects-from-kb.ts
```

---

# PART 4 — Update package.json scripts

Add:

```json
"sync:projects": "tsx scripts/sync-projects-from-kb.ts",
"sync-and-embed": "npm run sync:projects && npm run embed:kb"
```

Do not remove or modify existing scripts.

---

# PART 5 — Run order for embedding

Embedding script (`embed-kb.ts`) must run **after** the sync.

Correct workflow:

```
npm run sync:projects
npm run embed:kb
```

Or the combined script:

```
npm run sync-and-embed
```

---

# CHECKLIST (Cursor must verify all before finishing)

### Types
- [ ] `ProjectKBEntry` now includes `one_liner?: string`

### Loader
- [ ] `loadProjectsKB()` extracts one_liner correctly
- [ ] No other functionality is changed

### Project Sync Script
- [ ] `scripts/sync-projects-from-kb.ts` exists
- [ ] Uses `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Loads from KB, inserts into `projects`
- [ ] Sets `summary_short = one_liner`
- [ ] Uses `onConflict: "slug"`
- [ ] Logs success/failure

### package.json
- [ ] Contains `"sync:projects"` script
- [ ] Contains `"sync-and-embed"` script
- [ ] Existing scripts untouched

### Result
- [ ] Running sync fixes foreign key errors
- [ ] `projects` table is fully populated
- [ ] Embedding script can run with no FK failures

```