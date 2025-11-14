Atoms

1. Typography primitives
	•	<Eyebrow>
	•	Use for section labels and meta text.
	•	Font size: 12px
	•	Weight: 500
	•	Case: uppercase
	•	Letterspacing: +0.08em
	•	Color: muted (--pfaff-gray mixed with --pfaff-dark)
	•	Margin-bottom when followed by a heading: 8px.
	•	<Heading>
	•	Variants: display, h1, h2, h3.
	•	Display: 48–64px, weight 500.
	•	H1: 40px, weight 500.
	•	H2: 28–32px, weight 500.
	•	H3: 22–24px, weight 500.
	•	Color: --pfaff-dark (or --pfaff-cream on dark sections).
	•	Tight leading (line-height: 1.1–1.2).
	•	<BodyText>
	•	Variants: default, muted, small.
	•	Default: 16px, weight 400, color --pfaff-dark.
	•	Muted: 16px, color is a slightly lighter mix of dark/gray.
	•	Small: 14px, same color rules.

⸻

2. Button
	•	Variants: primary, secondary, ghost, destructive, inline.
	•	Shared:
	•	Font: 14–15px, weight 500.
	•	Padding: px-4 py-2 (default).
	•	Radius: --radius-sm.
	•	Transition: background-color, color, border-color, transform (150–200ms ease-out).
	•	Focus ring: 2px outline using --pfaff-dark or --pfaff-blue.
	•	Primary:
	•	BG: --pfaff-coral.
	•	Color: --pfaff-cream.
	•	Border: none.
	•	Hover: darken coral slightly, add -translate-y-[1px].
	•	Secondary:
	•	BG: --pfaff-cream.
	•	Color: --pfaff-dark.
	•	Border: 1px solid --pfaff-dark.
	•	Hover: subtle elevation (small shadow, slightly darker border).
	•	Ghost:
	•	BG: transparent.
	•	Color: --pfaff-dark.
	•	Border: 1px solid transparent.
	•	Hover: light tinted background rgba(38,41,29,0.04).
	•	Destructive:
	•	BG: --pfaff-red.
	•	Color: --pfaff-cream.
	•	Hover: darker red.

⸻

3. Inputs (Input, Textarea, Select)
	•	Font: 16px, weight 400.
	•	BG: white or light cream.
	•	Border: 1px solid rgba(38,41,29,0.18).
	•	Radius: --radius-xs.
	•	Padding: px-3 py-2 (input), px-3 py-2.5 (textarea).
	•	Placeholder color: --pfaff-gray at 70% opacity.
	•	Focus:
	•	Border-color: --pfaff-dark or --pfaff-blue.
	•	Outline: 1–2px ring with low-opacity blue/dark.
	•	Error:
	•	Border-color: --pfaff-red.
	•	Optional error text below: body-sm, --pfaff-red.

⸻

4. Tag / Chip
	•	Radius: --radius-pill.
	•	BG: --pfaff-yellow.
	•	Text: --pfaff-dark, 11–12px, uppercase, tracking +0.08em.
	•	Padding: px-3 py-1.
	•	Border: 1px solid rgba(38,41,29,0.12) (optional).

⸻

5. Divider / Rule
	•	Horizontal line used between sections or in cards.
	•	Height: 1px.
	•	Color: rgba(38,41,29,0.12) on light backgrounds, rgba(253,249,244,0.16) on dark.

⸻

Molecules

6. Card
	•	Used for case studies, proof points, content blocks.
	•	BG: --pfaff-cream.
	•	Border: 1px solid rgba(38,41,29,0.08).
	•	Radius: --radius-md.
	•	Padding: 24px (default), 32px for feature cards.
	•	Layout:
	•	Optional eyebrow → heading → body.
	•	Spacing between elements: 8–12px.
	•	Variant: “highlight” card:
	•	BG: --pfaff-yellow.
	•	Same radius + padding.
	•	Border: none or subtle.

⸻

7. Media Card (image + text)
	•	Same base styling as Card.
	•	Layout:
	•	Image at top with --radius-sm.
	•	Eyebrow, heading, body, tags below.
	•	Image aspect ratio: 4:3 or 16:9, object-cover.
	•	Spacing between image and text: 16px.

⸻

8. Stat Row / Metric
	•	Layout: horizontal stack of icon/label/value.
	•	Eyebrow as label.
	•	Metric value: h3 or larger; weight 500.
	•	Color:
	•	Label: muted.
	•	Value: --pfaff-dark, or --pfaff-olive for “positive”.

⸻

9. Nav Item (for header nav)
	•	Type: body-sm, weight 400–500.
	•	Color: --pfaff-dark.
	•	Hover: underline or 1px bottom border in --pfaff-dark.
	•	Active: bottom border using --pfaff-dark + slightly bolder weight.

⸻

10. Form Field (label + input + help text)
	•	Label: body-sm, weight 500, color --pfaff-dark, margin-bottom 4px.
	•	Input as described above.
	•	Help text: body-sm, muted color, margin-top 4px.
	•	Error text: body-sm, --pfaff-red, replaces or appears under help text.

⸻

Organisms

11. Header
	•	Layout: horizontal flex, align center, space-between.
	•	Height: 72–80px.
	•	BG: transparent or --pfaff-cream.
	•	Content:
	•	Left: wordmark / logo (text in h3 style).
	•	Center/right: nav items (spacing 24px).
	•	Right: primary CTA button.
	•	Border-bottom: optional 1px solid rgba(38,41,29,0.08) once scrolled.

⸻

12. Footer
	•	BG: --pfaff-dark.
	•	Text: --pfaff-cream (muted for secondary).
	•	Padding-y: 48px.
	•	Content:
	•	Columns with headings (eyebrow style) and links (body-sm).
	•	Social icons as simple glyphs or text links.

⸻

13. Hero Section (Home / Major Case Study)
	•	Section BG:
	•	Default: --pfaff-cream.
	•	For special hero: --pfaff-dark with light text and coral/yellow accents.
	•	Layout:
	•	Left: display headline + body + primary/secondary CTAs.
	•	Right: card or visual (grid, “AI output” frame, etc.).
	•	Spacing:
	•	Padding-y: 96px (desktop), 64 (tablet), 48 (mobile).
	•	Components:
	•	Eyebrow for context (“Design Engineer / Creative Technologist”).
	•	Display headline.
	•	Body copy in 2–3 short lines.
	•	Button row with primary + ghost/secondary.

⸻

14. Case Study Teaser List
	•	Repeated Media Card molecules in a vertical or grid layout.
	•	Consistent image aspect ratio.
	•	Each card:
	•	Eyebrow: role or type (e.g. “Product Design”, “Front-End”).
	•	Heading: project title (h3).
	•	Body: 2–3 line summary.
	•	Tags row: skills, tools.

⸻

15. Proof Strip / Logos Row
	•	Horizontal strip of logos or short proof points.
	•	BG: --pfaff-cream or --pfaff-yellow.
	•	Spacing:
	•	Padding-y: 24–32px.
	•	Logo spacing: 24px.
	•	Optional eyebrow text at top: “Teams I’ve worked with”, “Selected Clients”.

⸻

16. CTA Section
	•	BG: --pfaff-yellow or --pfaff-dark (for stronger emphasis).
	•	Center-aligned layout.
	•	Heading: h2.
	•	Body: short, 1–2 lines.
	•	Buttons: primary + ghost, aligned center with gap 16px.

⸻

Page Components / Templates

These combine organisms into layouts. Styling is inherited from the organisms; the key rule for Cursor:
	•	Use consistent section spacing:
	•	Desktop: 72–96px between major sections.
	•	Tablet: ~64px.
	•	Mobile: ~48px.
	•	Use max-w-[your chosen container] and center the content.