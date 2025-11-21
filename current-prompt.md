
---

## Phase 7.5 — Mobile Navigation (Hamburger Menu Pattern)

Before doing anything, Cursor must:
1. Re-read all Phase 7.5 mobile requirements.
2. Inspect the current Header/Nav components.
3. Ask any clarifying questions before implementation.

### Requirements

**1. Mobile-Only Navigation**
- A dedicated mobile navigation experience must be implemented.
- This navigation must only appear on `< md` breakpoints.
- Desktop navigation must remain completely unchanged.

**2. Mobile Header Layout**
- Left side: the existing site logo SVG (same behavior as desktop).
- Right side: a hamburger menu icon (use an existing lucide-react icon if available, e.g. `Menu`).
- Header must be compact, fixed at the top, and visually consistent with the AI modal header.

**3. Mobile Menu Behavior**
- Tapping the hamburger opens a mobile menu panel.
- This panel can slide down or fade in (use existing motion tokens).
- When open, it must show three links:
  - **About**
  - **Work**
  - **Contact Me**
- Each item should be full-width, tappable, and use the mobile typography scale.

**4. Interaction Rules**
- Tapping outside the menu or pressing the close/hamburger button again closes it.
- Logo always navigates home (`/`) even when menu is open.
- Menu must not interfere with the AI modal or the mobile AI button.
- Menu must not overlap with safe areas (top/bottom padding on mobile).

**5. Visual Style**
- The menu panel should:
  - Use the standard mobile background token (`var(--bg-default)`).
  - Use appropriate spacing and vertical stacking.
  - Use consistent typography from the mobile header/footer.
- Do NOT introduce new colors; use existing tokens only.

### Checklist for Cursor

- [ ] A mobile-only header exists with logo (left) and hamburger icon (right).
- [ ] Hamburger menu opens a mobile navigation panel containing About, Work, and Contact Me.
- [ ] Mobile nav is hidden on desktop; desktop nav remains unchanged.
- [ ] Navigation panel uses correct spacing, typography, and background tokens.
- [ ] Logo always navigates home and is clickable even when menu is open.
- [ ] Menu closes when tapping outside or re-tapping hamburger.
- [ ] Behavior does not conflict with AI modal or mobile AI button.
- [ ] Fully responsive on `< md` with no desktop regressions.