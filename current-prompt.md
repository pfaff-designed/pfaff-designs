

# Phase 12 — Custom 404 Page (Next.js App Router)

## 🎯 Goal
Implement a simple, branded 404 experience that matches the site’s editorial aesthetic, works with the App Router, and makes it easy for visitors to recover when they hit an unknown route.

For this phase:
- ✅ Use **Next.js App Router** conventions for not-found handling
- ✅ Create a centered, minimal 404 layout that fits the existing design language
- ✅ Provide clear navigation back to the homepage (and optionally Work)
- ✅ Ensure Cmd+K and global UI patterns still work on the 404 screen
- ❌ Do **not** change any AI, modalGraph, or command palette logic
- ❌ Do **not** introduce new dependencies or complex routing logic

---

## 0. Files & Structure

You will likely need to work with:

- `app/not-found.tsx` — **new file** for App Router 404 handling
- (Optional) `app/layout.tsx` or root layout — only if needed for composition, but avoid structural changes

Do **not** add a legacy `pages/404.tsx`; this project is App Router only.

---

## 1. Implement `app/not-found.tsx`

Create a new file at `app/not-found.tsx` that:

1. Uses the existing layout primitives / typography tokens (as much as possible) to stay on-brand.
2. Renders a full-height section with **centered content**, including:
   - A **large, bold** `404` heading
   - A short supporting line, e.g. `"This page doesn’t exist (yet)."`
   - A small hint that Cmd+K can help, e.g. `"You can also press Cmd + K to jump somewhere else."`
3. Includes at least one primary call to action:
   - A main button/link: `"Back to home"` → `/`
   - Optionally a secondary link: `"View work"` → `/work`

### Layout expectations

- Vertically center the content using flex utilities or equivalent.
- Respect the site’s max-width patterns (e.g., `max-w-xl` or similar) and horizontal padding.
- Use the existing button component (e.g., `Button` from `@/components/ui/button`) if available.

Example structure (you can adapt classNames to match the codebase):

```tsx
// app/not-found.tsx

import Link from "next/link";
import { Button } from "@/components/ui/button"; // adjust import if needed

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4">
      <section className="max-w-xl text-center space-y-4">
        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Not found</p>
        <h1 className="text-5xl font-semibold tracking-tight">404</h1>
        <p className="text-sm text-muted-foreground">
          This page doesn’t exist (yet).
        </p>
        <p className="text-xs text-muted-foreground">
          You can head back home, explore the work, or press <kbd>Cmd</kbd> + <kbd>K</kbd> to jump somewhere else.
        </p>
        <div className="flex items-center justify-center gap-3 pt-4">
          <Button asChild>
            <Link href="/">Back to home</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/work">View work</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
```

Adjust naming, imports, and spacing utilities to match existing patterns in the repo.

---

## 2. Keep Global Behaviors Intact

The 404 page should behave like any other page in terms of global UI:

- Cmd+K should still work if it’s wired globally (do **not** special-case or disable it here).
- Global navigation (if present in the layout) should still render as usual.
- Do **not** alter the root layout structure beyond what is absolutely necessary.

If `app/layout.tsx` wraps all pages, `not-found.tsx` should implicitly use that layout by default (App Router convention). Avoid changing layout composition unless something is clearly broken.

---

## 3. Styling & Aesthetic Alignment

Make sure the 404 page feels like part of the portfolio, not a default boilerplate:

- Use the same typography scale and color system as the rest of the site.
- Respect the spacing rhythm (e.g., vertical spacing tokens, max-widths).
- Keep it **minimal and editorial**, no extra decorative elements needed.

If you see existing patterns for section headings, small eyebrow text, or layout wrappers, reuse them instead of inventing new ones.

---

## 4. Routing Behavior & Verification

Verify that:

1. Visiting a clearly non-existent route (e.g., `/this-page-does-not-exist`) shows the new 404 page.
2. Links behave correctly:
   - `Back to home` → `/`
   - `View work` → `/work`
3. Cmd+K still opens the command palette on the 404 screen.
4. The 404 page looks correct on both desktop and a mobile viewport via DevTools.

You do **not** need to add automated tests for this phase, but if a 404-related test harness already exists, update it as needed.

---

## 5. Do NOT

- Do **not** modify any AI / modalGraph / LangGraph logic.
- Do **not** change command palette behavior.
- Do **not** add new dependencies.
- Do **not** create additional routes beyond `app/not-found.tsx`.

---

## ✅ Acceptance Checklist (Phase 12)

- [ ] `app/not-found.tsx` exists and uses the App Router 404 convention
- [ ] 404 page shows a large, centered `404` heading
- [ ] 404 page includes a short explanatory line
- [ ] 404 page mentions `Cmd + K` as a way to navigate
- [ ] Primary CTA navigates back to `/`
- [ ] Optional secondary CTA navigates to `/work`
- [ ] Page layout matches the site’s editorial style
- [ ] Cmd+K works on the 404 page
- [ ] Non-existent routes show the custom 404 page correctly

Make these Phase 12 changes now.