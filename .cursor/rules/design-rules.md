# Design Rules

These rules define the **visual system** for the generative-UI portfolio. They apply to:

- Human designers & developers  
- AI assistants (Cursor, orchestrator, copywriter)

Goals:

- Editorial, minimal, warm  
- Grid-driven and disciplined (Müller-Brockmann inspired)
- Highly legible and recruiter-friendly  
- Responsive and mobile-first  

---

## 1. Design Philosophy

Grounded in Josef Müller-Brockmann’s grid approach:

**Core principles**

- **Objectivity** – Neutral, functional solutions; let content dictate form.  
- **Consistency** – Reuse modules, alignments, spacing across pages.  
- **Hierarchy** – Use scale, weight, contrast, position.  
- **Proportion** – Rational ratios; whitespace is an active element.  
- **Alignment** – Snap type and images to grid axes.  
- **Reduction** – Few typefaces, sizes, colors to reinforce clarity.

**Intentional feel**

- Editorial, not “app-y”  
- Calm, confident, spacious  
- Primarily **left-aligned** text; centered text is rare and deliberate
- Images support the narrative, not overpower it  

---

## 2. Grid & Layout System

The system uses three responsive grids: **desktop, tablet, mobile**.

### 2.1 Desktop Grid

- Columns: **12**  
- Margin: **32px** left/right  
- Gutter: **24px**  

### 2.2 Tablet Grid

- Columns: **8**  
- Margin: **24px**  
- Gutter: **20px**

### 2.3 Mobile Grid

- Columns: **4**  
- Margin: **20px**  
- Gutter: **16px**

**Rules**

- Sections and components must align to grid columns.  
- Text blocks snap to column boundaries (no arbitrary widths).  
- Images occupy whole columns (no fractional widths).  
- Max body line length ≈ 60–75 characters.  

### 2.4 Container Widths

Align this section with `Container.tsx`:

- **Default** container: `max-w-7xl` (~1280px ≈ 80rem)  
- **Narrow** container: `max-w-4xl` (~896px ≈ 56rem)  
- **Wide** container: `max-w-[1400px]` (explicit 1400px max)  

Rules:

- Use `Container` for all page sections; do **not** hand-roll max-width.  
- Choose:
  - Narrow for dense text  
  - Default for most sections  
  - Wide for media-heavy / hero layouts  

### 2.5 Breakpoints (Tailwind Defaults)

- `sm`: `640px`  
- `md`: `768px`  
- `lg`: `1024px`  
- `xl`: `1280px`  

All responsive behavior should use these breakpoints.

---

## 3. Layout Patterns (Summary)

These are the canonical layout patterns the orchestrator and humans should use.

- `classic_editorial` – 7/5 text/image split; structured, professional.  
- `hero_statement` – centered hero type; used for big intros.  
- `alternating_columns` – 6/6 alternation of text/image rows.  
- `gallery_grid` – 3×4 / 4×3 grids on desktop; 2×N or 1×N on smaller screens.  
- `text_with_pull_quote` – 8/4 text/callout split.  
- `annotated_visual` – large image + labeled callouts.  
- `comparative_split` – 6/6 before/after or A/B.  
- `timeline_vertical` – central spine, alternating events.

The long-form descriptions in the existing `design-rules.md` remain valid for detailed behavior; this section is the high-level map.

---

## 4. Typography

### 4.1 Typefaces

**Primary:**  
- **PP Neue Montreal** – for headings and body.

**Secondary:**  
- **PP Neue Montreal Mono** – for small text, labels, metadata, and code snippets.

Rules:

- Use mono for: meta labels, time stamps, AI indicators, code-like text.  
- Use primary for everything else.

### 4.2 Typographic Scale (Aligned to Tokens)

The system uses a **Major 4th-like scale** with explicit tokens already defined:

- `xs`: 12px – supporting/meta  
- `sm`: 14px – labels, small UI text  
- `base`: 16px – body  
- `lg`: 21px – small headings, pull-quote support  
- `xl`: 28px – section headings  
- `2xl`: 37px – major headings  
- `3xl`: 50px – hero headings  
- `4xl`: 67px – primary site hero (rare, used sparingly)

These are the **source of truth**. Tailwind font-size utilities should map to these values.

### 4.3 Usage

- **Body text**: 16px, line-height 1.5–1.6, left-aligned.  
- **Small text / meta / code**: 12–14px, often mono.  
- **Headings**:
  - H4 ≈ 21px  
  - H3 ≈ 28px  
  - H2 ≈ 37px  
  - H1 ≈ 50–67px

### 4.4 Alignment & Rhythm

- Most body and headings are **left-aligned**.  
- Center alignment reserved for:
  - Hero statements
  - Occasional timelines or key emphasis moments  
- Maintain spacing with spacing tokens (see Section 5).

---

## 5. Spacing & Sizing

The system uses **px-based CSS variables** for spacing, but components should be styled using Tailwind classes that ultimately map to these tokens.

### 5.1 Conceptual Spacing Scale

Design thinking uses increments: 12, 24, 36, 48, 72, 96, 144px.

These map to Tailwind spacing + your `--spacing-*` vars (e.g. `--spacing-1: 4px`, `--spacing-2: 8px`, etc.). Use these increments for:

- Section padding  
- Gaps between stacked blocks  
- Card internal padding  

Examples:

- Section vertical padding:
  - Mobile: 48px  
  - Tablet: ~64px  
  - Desktop: 72–96px  
- Card internal padding:
  - 24px (default), 32px for feature cards  

### 5.2 `px` vs `rem`

- CSS variables are defined in **px** (e.g. `--spacing-3: 12px`).  
- Tailwind utilities are **rem-based** at runtime.  

Rules:

- Use Tailwind utilities whenever possible (they already map to the spacing scale).  
- When writing raw CSS (rare), convert px to rem based on 16px = 1rem:
  - 16px = 1rem  
  - 24px = 1.5rem  
  - 32px = 2rem  

In short: **design tokens are px**, **implementation prefers rem-based utilities**.

---

## 6. Color System

### 6.1 Base Palette

Raw colors (unchanged):

- `#26291D` – dark  
- `#FFF8A7` – primary (dark theme accent)  
- `#FDF9F4` – light  
- `#E76F51` – primary (light theme accent)  
- `#9EC8D2` – secondary  
- `#6D7F5C` – success  
- `#E75151` – error  
- `#C2C0B4` – hover  
- `#DAC1BD` – border / accent  

### 6.2 CSS Variables (Light Theme)

Codebase-level CSS vars (examples):

- `--bg-default` = `#FDF9F4`  
- `--bg-surface` = `#FFFFFF` or near-tint  
- `--text-default` = `#26291D`  
- `--text-muted` = `#C2C0B4`  

- `--accent-primary` = `#E76F51`  
- `--accent-secondary` = `#9EC8D2`  
- `--accent-yellow` = `#FFF8A7`  

- `--border-subtle` = `#DAC1BD`  
- `--state-success` = `#6D7F5C`  
- `--state-error` = `#E75151`  
- `--state-hover` = `#C2C0B4`  

Usage in Tailwind:

- `bg-[color:var(--bg-default)]`  
- `text-[color:var(--text-muted)]`  
- or via configured Tailwind theme keys (preferred).

### 6.3 Dark Theme (Conceptual)

Dark theme should invert semantics:

- Background = `#26291D`  
- Text default = `#FDF9F4`  
- Muted text, border, and accents reuse the same core hex values as light theme with adjusted contrast.

Implementation: dark theme vars mirror light theme names under a `.dark` selector.

### 6.4 Rules

- Always use **semantic vars** (`--bg-*`, `--text-*`, `--accent-*`) rather than raw hex in components.  
- Bright accents (primary, error, success) are reserved for key CTAs and states, not body text.  
- AI-generated highlight states (e.g., “AI” labels) should use subtle accent or muted colors, not pure red/green.

---

## 7. Radii & Elevation

Use the actual radius tokens:

- `--radius-xs`: 2px  
- `--radius-sm`: 4px  
- `--radius-md`: 8px  
- `--radius-lg`: 12px  

Examples:

- Inputs: `--radius-xs`  
- Cards: `--radius-md`  
- Tags/pills: `--radius-pill` (full pill)

Rules:

- Do not invent ad-hoc radii.  
- AI modal card should use `--radius-lg` for a slightly softer feel.

Elevation:

- Base card:
  - Subtle border: 1px solid `rgba(38,41,29,0.08)`  
  - Very subtle or no shadow.  
- Highlight / interactive cards:
  - Slightly stronger shadow + optional color shifts.  
- AI modal card:
  - Stronger drop shadow for “window” feel:
    - e.g., `0 24px 60px rgba(0, 0, 0, 0.18)`.

---

## 8. Card & Project Card Design

This is where we formalize cards, including `ProjectCard` and `ProjectCardGrid`.

### 8.1 Base Card

From existing system:

- Background: `--bg-surface` or `--bg-default`  
- Border: `1px solid rgba(38,41,29,0.08)`  
- Radius: `--radius-md`  
- Padding: 24px (default), 32px for feature cards  
- Layout:
  - Optional Eyebrow  
  - Heading  
  - Body text  
  - Optional tags  

Spacing inside:

- 8–12px between eyebrow, heading, body  
- 16px between media and text when media is present

### 8.2 Media Card

Media-focused variant (used in case study teasers etc.):

- Same base styling as Card.  
- Image at top with `--radius-sm`.  
- Eyebrow, heading, body, tags below image.  
- Image aspect ratio: 4:3 or 16:9, `object-cover`.  
- Spacing between image and text: 16px.

### 8.3 ProjectCard

`ProjectCard` should be treated as a **formal specialization** of Media Card for the Work/Home grid.

Structure:

- Optional tag row (e.g. “Case Study”, “RAG”, “Frontend”).  
- Project name as Heading (h3).  
- Client name as Eyebrow or supporting text.  
- Project type (e.g., “RAG Portfolio”, “AI Prototype”) as short label.  
- Optional one-line summary.

Visual rules:

- Use Card base:
  - `--bg-surface` or `--bg-default`  
  - `--radius-md`  
  - Border subtle, or none in hover-elevated variants.  
- Hover:
  - Slight elevation:
    - Small shadow + `-translate-y-[1px]` or `-translate-y-[2px]`  
  - Optional border opacity increase.  
  - Optional subtle 3D/floating motion on Work grid to emphasize “selectability”.  
- Disabled state:
  - Reduced opacity on text and media.  
  - No elevation on hover; keep border subtle.  
  - Cursor: `not-allowed` or default arrow.

Text constraints:

- Card content should be **tight**:
  - Project name: 2–3 words if possible.  
  - Client: 1–3 words.  
  - Type: “RAG Portfolio”, “Case Study”, etc.  

### 8.4 ProjectCardGrid

`ProjectCardGrid` arranges `ProjectCard` items:

- Desktop: 3 cards per row (matching your screenshot / intent).  
- Tablet: 2 per row.  
- Mobile: 1 per row.  
- Consistent vertical spacing between rows (approx. 36–48px).  
- Cards aligned to grid columns; equal column widths.

---

## 9. Motion & Interaction

### 9.1 Motion Tokens (Conceptual)

Even if not yet implemented as CSS vars, we standardize these values:

- `motion.duration.fast` ≈ 120ms  
- `motion.duration.medium` ≈ 180ms  
- `motion.duration.slow` ≈ 280ms  

- `motion.easing.in` → `cubic-bezier(0.32, 0, 0.67, 0)`  
- `motion.easing.out` → `cubic-bezier(0.33, 1, 0.68, 1)`  
- `motion.easing.standard` → `cubic-bezier(0.25, 0.1, 0.25, 1)`

Implementation:

- Use Tailwind `transition` utilities combined with these durations and easing functions where CSS-in-JS or custom CSS is needed.

### 9.2 Hover & Focus

- Hover: small scale, shadow, or tint changes; **never** big transforms.  
- Focus: always show a visible focus ring (accessibility).  
- Links and buttons should maintain contrast-compliant states.

---

## 10. AI Modal Visual Design

The AI modal is now a **first-class pattern**, separate from orchestrated layouts.

### 10.1 Backdrop

- Blur: 12–16px.  
- Dim overlay: `rgba(0, 0, 0, 0.08–0.12)`.  
- Open animation:
  - Opacity 0 → 1  
  - Blur 0 → 12/16px  
  - Duration: 180–280ms, easing: `motion.easing.out`.  
- Close animation:
  - Reverse with `motion.easing.in`.

### 10.2 Modal Card

- Background: `--bg-surface` or slightly elevated variant.  
- Max width: 680–720px.  
- Max height: 70vh (with internal scroll).  
- Radius: `--radius-lg`.  
- Shadow: e.g., `0 24px 60px rgba(0, 0, 0, 0.18)` for “floating window” feel.  
- Internal padding:
  - ~2rem (x) and ~1.75rem (y).  

Scale animation:

- On open: scale from 0.96 → 1 over 180–220ms, `motion.easing.out`.  
- On close: 1 → 0.96 over ~150–180ms, `motion.easing.in`.

### 10.3 Layout Inside Modal

Structure:

1. **Headline** – summarizing the topic or question.  
2. **Conversation list** – stacked `AiConversationRow` elements:  
   - Eyebrow (“User” / “AI”)  
   - BodyText with the message  
3. **Actions row** – max 4 buttons (navigate / scroll / deep_dive).  
4. **Composer** – at the bottom, sticky inside the card.

Spacing:

- Headline → first row: ~1.5rem.  
- Between rows: 0.75–1rem.  
- Last row → actions: ~1.25rem.  
- Actions → composer: ~1.25rem.

### 10.4 Composer

- Style: input + submit built from existing atoms/molecules (Input, Button, or a new `AiComposer` molecule).  
- Rounded, with subtle border.  
- Should feel integrated with the card, not separate UI chrome.  

### 10.5 Typing & Thinking

- THINKING state uses `TypingIndicator` (or updated implementation).  
- Typing animation (target spec):
  - Start delay: 120–160ms.  
  - Char step: ~30–40ms/character, but cap total visible typing to ~2–3 seconds, then fade in remaining text if needed.

---

## 11. Selection → “Ask AI” Pill

When user selects text inside `ContentSection`:

- Show an “Ask AI about this” pill near the selection:
  - Rounded pill (`--radius-pill`)  
  - Accent or surface background, subtle shadow  
  - Small type (12–14px)  

Behavior:

- Appears when:
  - Selection length ≥ 3 characters  
  - Selection inside a valid content area  
- Hides when:
  - Selection cleared  
  - User clicks elsewhere  
  - User scrolls > ~50px  
  - Modal opens  

On mobile:

- Pill may anchor to bottom-center instead of near selection, due to OS text handles.

---

## 12. Accessibility & Contrast

- Maintain WCAG-compliant contrast for:
  - Text on backgrounds  
  - Focus states  
  - Disabled states (still readable, just de-emphasized).  
- Always provide:
  - Focusable elements with proper `:focus-visible` styling.  
  - ARIA labels where semantics are not obvious (e.g. close button in AI modal).  
- ESC should close the modal; focus should return to the element that opened it.

---

## 13. Summary

This design system defines:

- A grid- and ratio-driven visual architecture  
- Canonical layout patterns for orchestrated pages  
- A type scale mapped to real CSS tokens  
- A semantic color system using `--bg-*`, `--text-*`, `--accent-*`, `--state-*` vars  
- Formal card patterns (Card, MediaCard, ProjectCard, ProjectCardGrid)  
- A cinematic AI modal as the single surface for conversational AI  
- Clear rules for spacing, radii, motion, and accessibility  

All generative and manual layouts must respect these rules to maintain an editorial, warm, and intentional portfolio experience that still feels highly functional and recruiter-friendly.