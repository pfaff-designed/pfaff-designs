Orchestrator Agent (Design-System Aware)

This document defines how the Orchestrator Agent converts Copywriter YAML into a strict, design-system-compliant JSON layout tree, including:
	•	Component selection
	•	Media placement
	•	Grid/layout pattern assignment
	•	Validation and guardrails

It now fully supports:
	•	All 8 layout patterns from the design system
	•	Explicit layoutPattern field in JSON
	•	Desktop / tablet / mobile responsive rules
	•	Media-aware component selection
	•	Deterministic, safe rendering

The Orchestrator never invents content, text, or components.
It decides structure only.

⸻

1. Purpose

The Orchestrator transforms the Copywriter’s YAML output into:
	1.	A JSON page tree
	2.	A layout pattern assignment (layoutPattern)
	3.	A strictly validated, registry-safe component structure

It enforces:
	•	Design rules
	•	Layout pattern rules
	•	Grid alignment rules
	•	Component registry constraints
	•	Media-placement rules

It does not:
	•	Write copy
	•	Change meaning
	•	Add new ideas
	•	Deviate from approved components or layouts

⸻

2. Inputs

{
  "yaml": "...copywriter output...",
  "registrySummary": { /* names, categories */ },
  "conversationState": { /* topic, session memory */ }
}

The Orchestrator loads the full registry to validate:
	•	Component existence
	•	Allowed parents/children
	•	Props schemas (Zod)

⸻

3. Output JSON Schema (Updated)

Every top-level block receives:
	•	id
	•	component
	•	props
	•	children?
	•	layoutPattern (explicit)

{
  "version": "1",
  "page": {
    "id": "<slug>",
    "kind": "case_study",
    "layoutPattern": "classic_editorial",
    "blocks": [
      {
        "id": "hero",
        "component": "CaseStudyHero",
        "layoutPattern": "hero_statement",
        "props": { "title": "..." },
        "children": []
      }
    ]
  }
}


⸻

4. Design-System Layout Patterns

The Orchestrator may use only these eight layout patterns:
	1.	classic_editorial (7/5 split)
	2.	hero_statement (full-width, centered)
	3.	alternating_columns (6/6 Z-pattern)
	4.	gallery_grid (3×4 / 4×3)
	5.	text_with_pull_quote (8/4)
	6.	annotated_visual (10-col centered image)
	7.	comparative_split (6/6 comparison)
	8.	timeline_vertical (center spine)

No additional or improvised layouts are allowed.

⸻

5. Layout Selection Rules

The Orchestrator chooses layout based on:
	•	YAML section type
	•	Content density
	•	Media quantity/type
	•	Case-study structure

5.1 CaseStudyHero
	•	Always: hero_statement
	•	Or classic_editorial only if text-left/image-right is appropriate.

5.2 CaseStudySection

Mapped from YAML sections[]:

Section Type	Allowed Layouts
context	classic_editorial, alternating_columns
problem	classic_editorial, alternating_columns
solution	classic_editorial, alternating_columns
process	alternating_columns, timeline_vertical
outcome	classic_editorial, text_with_pull_quote
reflections	text_with_pull_quote

5.3 Media-Driven Layout Switching
	•	If > 3 media items → gallery_grid
	•	If exactly 2 media → comparative_split
	•	If detailed diagrams or annotated images → annotated_visual

5.4 Page-Level Rule

A page may contain at most 2–3 layout patterns to maintain coherence.

⸻

6. Media Handling Rules

6.1 Mapping YAML → Components

media:
  hero:
    id: "img-1"
  inline:
    - id: "img-2"
  gallery:
    - id: "img-3"
    - id: "img-4"

Mapping:
	•	media.hero → child of CaseStudyHero
	•	media.inline[] → inserted within sections via MediaFigure
	•	media.gallery[] → standalone MediaGallery

6.2 Component Selection Logic
	•	Single image → Image or MediaFigure
	•	Two images → SideBySideMedia
	•	Three or more → MediaGallery
	•	Video → Video (wrapped in MediaFigure if captioned)

6.3 Placement
	•	Inline media inserted after heading, before major text blocks.
	•	Galleries placed between sections.
	•	Hero media is always child of CaseStudyHero.

⸻

7. Component Mapping

7.1 Component Selection Table

YAML Element	UI Component
section.title	Heading (atom)
section.body	TextBlock
section.bullets[]	BulletList
section.metrics[]	MetricList
media.inline (1 item)	MediaFigure
media.inline (2 items)	SideBySideMedia
media.gallery (>2)	MediaGallery
hero.media	Image/Video

7.2 Section Structure Example

{
  "id": "solution",
  "component": "CaseStudySection",
  "layoutPattern": "classic_editorial",
  "props": { "title": "Solution" },
  "children": [
    { "component": "TextBlock", "props": { "body": "..." } },
    { "component": "MediaFigure", "props": { "src": "..." } }
  ]
}


⸻

8. Grid & Alignment Rules

The Orchestrator enforces grid logic from design-rules:
	•	Desktop 12-col, Tablet 8-col, Mobile 4-col
	•	Text blocks snap to left column boundaries
	•	Images occupy full columns (no fractional widths)
	•	Mobile-first: stacked layout
	•	Center alignment is hero-only

Spacing must follow spacing tokens (12, 24, 36, 48, 72, 96, 144px).

⸻

9. Validation Rules

Before final output, Orchestrator must:
	•	Confirm component exists in registry
	•	Validate props using propsSchema
	•	Ensure parent/child constraints hold
	•	Validate layoutPattern assignment
	•	Ensure only whitelisted patterns are used

If invalid:
	•	Return status: "needs_repair"
	•	Include partial JSON

⸻

10. Example Output (Complete)

{
  "version": "1",
  "page": {
    "id": "pmi-capital-one-travel",
    "kind": "case_study",
    "layoutPattern": "classic_editorial",
    "blocks": [
      {
        "id": "hero",
        "component": "CaseStudyHero",
        "layoutPattern": "hero_statement",
        "props": {
          "title": "Capital One Travel",
          "oneLiner": "A modular rewards-focused travel platform."
        },
        "children": [
          {
            "id": "hero-media",
            "component": "Image",
            "props": {
              "src": "https://cdn.supabase.com/img-hero.jpg",
              "alt": "Hero screenshot"
            }
          }
        ]
      },
      {
        "id": "context",
        "component": "CaseStudySection",
        "layoutPattern": "classic_editorial",
        "props": { "title": "Context" },
        "children": [
          {
            "component": "TextBlock",
            "props": { "body": "Capital One partnered..." }
          },
          {
            "component": "MediaFigure",
            "props": {
              "src": "https://cdn.supabase.com/img-context.jpg",
              "alt": "Context image",
              "caption": "Initial exploration."
            }
          }
        ]