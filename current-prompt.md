You must update the AI modal, conversation UI, and related components according to the Phase 7.6 Visual Tuning instructions below.

Before doing anything:
1. Re-read the entire current-prompt.md file (path: /Users/charlespfaff/Documents/Code/pfaff-designs/current-prompt.md).
2. Review all AI-related components:
   - AiModalHost
   - AiModalHeader
   - AiConversationRow (AI, user, system, error)
   - Composer
3. Review shared layout/typography primitives (e.g., ContentBlock).
4. Ask any clarifying questions before beginning implementation.
5. Do NOT start coding until you confirm you understand all requirements.

---

# PHASE 7.6 — VISUAL TUNING

Your goal is to refine the AI modal + conversation UI so that:
- It feels consistent with the site's editorial style.
- It uses the new semantic token system.
- It is visually balanced on both desktop and mobile.
- All AI/user/system/error messages have clear hierarchy and readable spacing.
- No hardcoded hex colors remain.

---

# 1. DESIGN TOKEN UPDATE (MUST BE DONE FIRST)

Update all styling in the AI modal and conversation components to use the **new semantic color system** defined in current-prompt.md.

### Use these semantic tokens instead of legacy tokens:
- Backgrounds → `--bg-default`, `--bg-surface`, `--bg-subtle-warm`
- Text → `--text-default`, `--text-muted`
- Accents → `--accent-primary`, `--accent-secondary`
- Borders → `--border-subtle`, `--border-strong`
- States → `--state-success`, `--state-error`, `--state-hover`
- Overlays → `--overlay-90`, `--overlay-70`, `--overlay-50`

### Remove/Replace all hex values:
If no semantic token exists:
- Use the closest suitable token
- Leave a `// TODO: consider adding semantic token for [context]` comment

### Legacy token migration:
The following must be replaced everywhere:
```
--color-dark      → --text-default / --neutral-900
--color-light     → --bg-default / --neutral-100
--color-primary-light → --accent-primary
--color-secondary → --accent-secondary
--color-success   → --state-success
--color-error     → --state-error
--color-hover     → --state-hover
--color-border    → --border-subtle
```

### Remove redundant tokens from :root:
- `--color-primary-dark`
- `--color-yellow`

All Phase 7.6 styling must use the updated token system.

---

# 2. TYPOGRAPHY & HIERARCHY

### AI messages:
- Headings → use the site’s section-subheading / `h4` scale
- Eyebrows → match case study eyebrow styling (size, weight, tracking)
- Body text → match site body text size

### User messages:
- Same type scale as AI body
- Slight visual distinction via weight or subtle token-based tint

### System messages:
- Blue-tinted styling using semantic tokens
- Slightly reduced opacity and/or lighter weight

### Error messages:
- Use `--state-error` for icon or left-accent
- Background must remain neutral and readable (no red blocks)

Do NOT invent new type sizes.

---

# 3. ALIGNMENT & WIDTH

### Desktop:
- AI + user messages must align to the same max-width as primary content (ContentBlock).
- Messages must never stretch to full viewport width.

### Mobile:
- Ensure comfortable left/right padding.
- Text must not hug screen edges.

---

# 4. VERTICAL SPACING & RHYTHM

Apply consistent spacing tokens:

- Follow the site’s spacing rhythm (e.g., 16 / 24 / 32 / 40 or 1.5× increments).
- Slightly tighter spacing for back-and-forth messages.
- More spacing around system/error messages and major breaks.
- AI modal needs correct top and bottom internal padding.

Use existing spacing tokens only — no arbitrary magic numbers.

---

# 5. VISUAL DIFFERENTIATION BETWEEN MESSAGE TYPES

### AI messages:
- Neutral background using semantic tokens
- Optional subtle border or left rule

### User messages:
- Same typography
- Slight tint or border for distinction

### System messages:
- Blue-tinted background or accent using semantic tokens
- Must feel auxiliary

### Error messages:
- Use error tokens for icon/border
- Keep background neutral for readability

---

# 6. ANIMATION & MICRO-INTERACTIONS

### AI messages:
- Subtle fade + slide-from-bottom animation
- Duration ~150–200ms

### User messages:
- Appear instantly (no animation)

### General:
- Use consistent easing
- No layout shift or jitter
- System and error messages should not be over-animated

---

# 7. REMOVE ALL HARDCODED COLORS

Search all AI modal + conversation components for:
- Inline hex codes
- Tailwind arbitrary hex classes
- CSS files with raw hex

Replace all of them with semantic tokens.

Add TODO notes where new tokens will be needed.

---

# FINAL CHECKLIST (Cursor must complete ALL items)

- [ ] All design tokens updated to semantic system
- [ ] No remaining hardcoded hex values
- [ ] AI/user/system/error messages follow correct typography hierarchy
- [ ] Width alignment matches ContentBlock on desktop
- [ ] Mobile spacing is consistent and readable
- [ ] Vertical spacing rhythm applied uniformly
- [ ] Role-based message styles implemented (AI/user/system/error)
- [ ] AI messages animate subtly; user messages do not
- [ ] No layout jitter introduced
- [ ] TODO comments added for missing future semantic tokens
- [ ] No regressions to desktop or mobile layouts