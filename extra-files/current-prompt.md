# Prompt: Internal Linking & AI-Driven Navigation

You are working in the **pfaff-designs** repo.

## Goal

Improve how the AI helps users move around the site:

1. When the AI mentions projects, it should **link to the correct internal case study pages**.
2. When users type things like **“take me to…”** or **“navigate to…”**, the system should treat that as a navigation intent and **actually move them** to the right page.

This should work both:
- In **AI answers** (links in text / buttons).
- In the **command palette / inline chat** where navigation makes sense.

---

## Context (high-level)

- Project routes follow a pattern like:  
  `/work/[slug]` → e.g. `capital-one-travel`, `coca-cola`, `pmi`, `pfaff-designs-portfolio`.
- There is already a **project registry / KB** that maps slugs to:
  - `name` (display name, e.g. “Capital One Travel”)
  - `client` (e.g. “Capital One”)
  - `shortName` or similar fields.
- The **command palette** already has a `navigate` helper in the command context.
- The AI modal / renderer already knows how to render AnswerBlocks and link-like UI pieces.

You should infer exact file paths and helpers from the codebase (e.g. KB loader, project registry, command context, renderer).

---

## Part 1 — Internal project linking in AI answers

**Goal:** When the AI answers questions and references a project, it should surface **clickable navigation** to that project.

### Requirements

1. **Project mention → internal link**
   - When the AI mentions any of these projects:
     - “Capital One Travel”
     - “Coca-Cola”
     - “Project Management Institute” / “PMI” / “PMI.org redesign”
     - “This portfolio” / “pfaff.design”
   - It should be able to map them to **canonical slugs**:
     - Capital One → `/work/capital-one-travel`
     - Coca-Cola → `/work/coca-cola`
     - PMI / PMI-ACP / PMI Agile → `/work/pmi`
     - Portfolio / pfaff.design → `/work/pfaff-designs-portfolio` or `/`
   - Use the existing normalization rules already in the KB / modal graph (don’t invent a new mapping; reuse the canonical PMI logic).

2. **Add optional link metadata to answers**
   - When generating an answer for a project question, add **structured metadata** like:
     - `relatedProjects: Array<{ slug: string; label: string; reason?: string }>`
   - The renderer should:
     - If `relatedProjects` exists, show **small inline or footer pills/buttons** that link to those pages:
       - e.g. “View Capital One Case Study”, “View Coca-Cola Case Study”.

3. **Answer-level link formatting**
   - The prose itself can say:
     - “You can dive deeper in the Capital One case study.”
   - But the **actual navigable element** should come from structured data so it’s predictable to render.
   - The renderer should use Next.js `<Link>` (or the project’s NavLink abstraction) to push to `/work/[slug]`.

4. **Keep it minimal**
   - Don’t overwhelm the user with 6+ links. For most answers, **1–3 related project links** is enough.
   - Prioritize:
     - The project currently in context (if on `/work/[slug]`).
     - One or two related projects by tools/role.

---

## Part 2 — “Take me to…” / navigation intents

**Goal:** When the user clearly asks to go somewhere, we navigate them, not just describe it.

### Requirements

1. **Detect navigation-style queries**
   - Examples:
     - “take me to the Capital One page”
     - “navigate me to coke”
     - “go to the PMI case study”
     - “show me the work page”
   - Create a small helper to detect these:
     - Check for verbs like `["go", "take", "navigate", "open", "show"]`
     - Plus targets like `["capital one", "coke", "coca-cola", "pmi", "project management institute", "portfolio", "home", "work"]`
   - Use **lowercased, trimmed** input for detection.

2. **Map navigation intent → route**
   - Reuse the same slug mapping as above.
   - Examples:
     - “capital one”, “capital one travel” → `/work/capital-one-travel`
     - “coke”, “coca-cola” → `/work/coca-cola`
     - “pmi”, “project management institute” → `/work/pmi`
     - “portfolio”, “home”, “landing page” → `/`
     - “work” → `/work`
     - “contact”, “reach out”, “get in touch” → `/contact`

3. **Command palette / inline chat**
   - In the **command palette**:
     - Add or update a command that:
       - Detects navigation intents in the input.
       - Calls the existing `navigate(path)` helper in the command context.
     - If a navigation intent is detected, **prioritize executing navigation** instead of sending this as an AI question.
   - In **inline chat / modal**:
     - If the user types something like “take me to capital one”:
       - Either:
         - Immediately redirect, or
         - Answer with “Sure, taking you to the Capital One case study” and trigger navigation.
     - Prefer the approach that matches the existing UX patterns.

4. **Guardrails**
   - If the system can’t confidently map the phrase to a known page:
     - Don’t guess.
     - Respond with something like:
       - “I’m not sure which page you mean. I can take you to the Work page, or you can ask about Capital One, Coca-Cola, PMI, or this portfolio.”
   - This should be friendly and match the current tone (calm, clear, 99%-Invisible-ish).

---

## Part 3 — Testing & Verification

Add a short, inline checklist to the PR description or comments verifying:

- [ ] From the home page, ask: “What projects have you worked on?”  
      → Answer mentions projects and shows links/pills to their pages.
- [ ] On the Capital One page, ask: “What other projects are similar?”  
      → Answer includes links to at least one other case study (e.g. PMI or Tanger).
- [ ] Type “take me to the Capital One page” into:
      - [ ] Command palette  
      - [ ] AI modal / inline chat  
      → Both navigate to `/work/capital-one-travel`.
- [ ] Type “take me to the work page”  
      → Navigates to `/work`.
- [ ] Type “take me to something I haven’t built”  
      → No navigation; answer falls back to a clarifying message.

Do not change unrelated logic. Keep all existing working behavior intact.