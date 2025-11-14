# Design Rules

These rules define the **visual system** for the generative-UI portfolio. They apply to:

* Human designers & developers
* AI assistants (Cursor, orchestrator, copywriter)

The goals:

* Editorial, minimal, warm
* Grid-driven and disciplined (Müller-Brockmann inspired)
* Highly legible and recruiter-friendly
* Responsive and mobile-first

---

## 1. Design Philosophy

The design system is grounded in Josef Müller-Brockmann’s approach to grid-based design:

**Core principles**

* **Objectivity:** Prefer neutral, functional solutions over stylistic effects; let content dictate form.
* **Consistency:** Use recurring modules, alignments, and spacing to create coherence across pages and breakpoints.
* **Hierarchy:** Establish visual order through scale, weight, contrast, and position within the grid.
* **Proportion:** Base columns, rows, and margins on rational ratios; respect whitespace as an active structural element.
* **Alignment:** Snap type and images to grid axes; maintain clear edges and baselines for rhythm.
* **Reduction:** Remove non-essential elements; limit typefaces and sizes to reinforce clarity.

**Intentional feel**

* Editorial, not “app-y”
* Calm, confident, and spacious
* Primarily **left-aligned** text; center alignment is rare and deliberate
* Images support the narrative; they rarely overpower text

---

## 2. Grid & Layout System

The system uses three responsive grids: **mobile-first**, then tablet, then desktop.

### 2.1 Desktop Grid

* Columns: **12**
* Rows: modular (base 8+ as needed)
* Margin: **32px** (left/right)
* Gutter: **24px**

### 2.2 Tablet Grid

* Columns: **8**
* Rows: modular
* Margin: **24px**
* Gutter: **20px**

### 2.3 Mobile Grid

* Columns: **4**
* Rows: modular (base 8+)
* Margin: **20px**
* Gutter: **16px**

**Rules:**

* All sections and components must align to the grid columns.
* Text blocks should snap to column boundaries (no arbitrary widths).
* Images should occupy whole columns (no fractional widths).
* Max line length for body text ≈ 60–75 characters.

---

## 3. Layout Patterns

These are reusable layout templates the Orchestrator can choose from. Each pattern has a **name**, **use cases**, and **responsive behavior**.

### 3.1 Layout: `classic_editorial`

**Desktop**

* Columns: **7 / 5 split**
* Text: columns 1–7 (left)
* Image: columns 8–12 (right)

**Tablet**

* Approx. **5 / 3 split**
* Text: columns 1–5
* Image: columns 6–8

**Mobile**

* Stack vertically: text first, then image

**Use for:**

* Explanations
* Project context
* Design decisions

**Rules:**

* Top alignment between text and image
* Text aligned to left grid edge
* Image complements text; avoid overly dominant visuals

**Visual feel:** Structured, professional, calm.

---

### 3.2 Layout: `hero_statement`

**Desktop**

* Uses all 12 columns
* Headline + subtext centered in width, constrained to ~6 columns
* Optional image behind or below

**Tablet & Mobile**

* Text remains centered, constrained to comfortable width
* Image may move below text on smaller screens

**Use for:**

* Section intros
* High-level overviews
* Hero modules

**Rules:**

* Generous vertical whitespace above and below
* No dense body text here; keep it succinct

**Visual feel:** Confident, intentional, minimal.

---

### 3.3 Layout: `alternating_columns`

**Desktop**

* Columns: **6 / 6**
* Alternate text-left/image-right and image-left/text-right per section

**Tablet**

* Use 4/4 splits when side-by-side

**Mobile**

* Stack vertically, text then image; alternate subtle visual cues (e.g. alignment, labels), not full mirror layouts

**Use for:**

* Process explanations
* Step-by-step case studies

**Rules:**

* Maintain consistent image width (6 columns)
* Use ~64px vertical spacing between alternating rows

**Visual feel:** Rhythmic, engaging, editorial storytelling.

---

### 3.4 Layout: `gallery_grid`

**Desktop**

* 3×4 or 4×3 equal image grid

**Tablet**

* 2×N grid

**Mobile**

* 2×N or 1×N depending on image density

**Use for:**

* Work samples
* Visual comparisons
* Component or art showcases

**Rules:**

* Equal image aspect ratio (1:1 or 3:2 preferred)
* Optional captions below each image
* Hover/interaction should be subtle (e.g. soft scale, border, or label reveal)

**Visual feel:** Balanced, modular, quietly sophisticated.

---

### 3.5 Layout: `text_with_pull_quote`

**Desktop**

* Columns: **8 text / 4 pull quote or visual**
* Text: columns 1–8
* Callout: columns 9–12

**Tablet**

* Text full-width (8 cols)
* Pull quote below, aligned to grid (e.g. 2–7)

**Mobile**

* Stack: text, then pull quote

**Use for:**

* Case study storytelling
* Insights or reflection sections

**Rules:**

* Pull quote should be typographically distinct (larger size, or color accent)
* Maintain a strong link between quote and nearby text

**Visual feel:** Thoughtful, reflective, editorial magazine.

---

### 3.6 Layout: `annotated_visual`

**Desktop**

* Image spans ~10 columns, centered (columns 2–11)
* Annotations as callouts or overlays tied to specific points

**Tablet**

* Image full-width within margins, annotations as overlay tags or below

**Mobile**

* Image full-width
* Numbered callouts stacked below

**Use for:**

* Component breakdowns
* Diagrams
* Design explanations

**Rules:**

* Maintain minimum 48px padding around the visual
* Use clear numbered or labeled callouts

**Visual feel:** Analytical, clear, instructional.

---

### 3.7 Layout: `comparative_split`

**Desktop**

* Columns: **6 / 6**
* Two visuals or states side-by-side

**Tablet**

* 4/4 split across 8 columns

**Mobile**

* Stack vertically (before then after), with labels

**Use for:**

* Before/after
* Dark/light theme examples
* Design evolution comparisons

**Rules:**

* Align both sides vertically and horizontally
* Clear labels (e.g. "Before" / "After")
* Neutral background to maintain clarity

**Visual feel:** Rational, balanced, precise.

---

### 3.8 Layout: `timeline_vertical`

**Desktop**

* 12-column grid
* Vertical spine in central columns (e.g. 6–7)
* Events alternate left and right

**Tablet**

* Spine remains central, content slightly condensed

**Mobile**

* Single column timeline, events stacked top-to-bottom

**Use for:**

* Process or evolution timelines
* Step-by-step flows

**Rules:**

* Equal spacing between events (≈120px+)
* Clear visual markers (dots, icons, or lines)

**Visual feel:** Narrative, directional, logical progression.

---

## 4. Typography

### 4.1 Typefaces

**Primary Typeface:**

* **PP Neue Montreal** (for both headings and body text)

**Secondary Typeface:**

* **PP Neue Montreal Mono**

  * Use for small text, labels, metadata, and code snippets

### 4.2 Typographic Scale (Major 4th)

Base scale uses a **Major 4th ratio (~1.333)**.

Approximate sizes:

* `xs`: 12px (supporting/meta)
* `sm`: 14px (labels, small UI text)
* `base`: 16px (body)
* `lg`: 21px (small headings, pull quote supporting text)
* `xl`: 28px (section headings)
* `2xl`: 37px (major headings)
* `3xl`: 50px (hero headings)
* `4xl`: 67px (primary site hero, rare)

### 4.3 Usage

* **Body text**: 16px, line-height 1.5–1.6, left-aligned.
* **Small text / meta / code**: 12–14px, PP Neue Montreal Mono.
* **Headings**:

  * H4 ≈ 21px
  * H3 ≈ 28px
  * H2 ≈ 37px
  * H1 ≈ 50–67px (used sparingly)

### 4.4 Alignment & Rhythm

* Most body and headings are **left-aligned**.
* Center alignment is reserved for:

  * Hero statements (`hero_statement` layout)
  * Occasional timeline labels or key emphasis moments
* Maintain consistent spacing:

  * Use spacing tokens derived from the same modular thinking as type (e.g. 12, 24, 36, 48, 72, 96, 144px).

---

## 5. Color System

### 5.1 Base Palette

Raw colors:

* `#26291D` – dark
* `#FFF8A7` – primary (dark theme accent)
* `#FDF9F4` – light
* `#E76F51` – primary (light theme accent)
* `#9EC8D2` – secondary
* `#6D7F5C` – success
* `#E75151` – error
* `#C2C0B4` – hover
* `#DAC1BD` – border / accent

### 5.2 Semantic Tokens (Light Theme)

Examples:

* `color.bg.default = #FDF9F4`
* `color.bg.surface = #FFFFFF` (or a near-tint)
* `color.text.default = #26291D`
* `color.text.muted = #C2C0B4`
* `color.accent.primary = #E76F51`
* `color.accent.secondary = #9EC8D2`
* `color.border.subtle = #DAC1BD`
* `color.state.success = #6D7F5C`
* `color.state.error = #E75151`
* `color.state.hover = #C2C0B4`

### 5.3 Semantic Tokens (Dark Theme)

Examples:

* `color.bg.default = #26291D`
* `color.bg.surface = #26291D` or darker variant
* `color.text.default = #FDF9F4`
* `color.text.muted = #C2C0B4`
* `color.accent.primary = #FFF8A7`
* `color.accent.secondary = #9EC8D2`

**Rules:**

* Use **semantic tokens** in Tailwind via CSS variables (e.g. `bg-surface`, `text-muted`, `border-subtle`).
* Do not hard-code hex values in components.
* Reserve strong colors (primary, error, success) for emphasis, states, and key CTAs.

---

## 6. Components & Layout Behavior

* All components must be **mobile-first**.
* On mobile:

  * Most complex layouts collapse into single-column stacks.
  * Maintain generous spacing between sections.
* On tablet/desktop:

  * Use the defined layout patterns (classic_editorial, hero_statement, etc.)
  * Avoid ad hoc layouts outside the defined patterns.

**Images & media:**

* Align images to grid columns.
* Maintain consistent aspect ratios within the same section or gallery.
* Use captions sparingly, left-aligned and small.

**Pull quotes:**

* Larger type (e.g. 21–28px), often in PP Neue Montreal
* May use color accents (primary or secondary) for quote marks or rules

---

## 7. AI-Specific Guidance (For Orchestrator & Copywriter)

* When choosing a layout, prefer:

  * `classic_editorial` for context and explanatory sections
  * `hero_statement` for top-of-page and major transitions
  * `alternating_columns` or `timeline_vertical` for process stories
  * `gallery_grid` or `comparative_split` for visual-heavy content
  * `text_with_pull_quote` for reflections and lessons learned

* Avoid combining more than **2–3 layout types** on a single page; consistency matters.

* Do not center-align long-form body copy.

* Do not use more than **3 text sizes** within a single section.

* Use color accents sparingly; most text should be the default body color.

---

## 8. Summary

This design system defines:

* A grid- and ratio-driven visual architecture
* Eight canonical layout patterns
* A typographic scale built on the Major 4th
* A semantic color system for light and dark modes
* Clear guidance for media, alignment, and hierarchy

All generative layouts must respect these rules to maintain an editorial, warm, and intentional portfolio experience that still feels highly functional and recruiter-friendly.
