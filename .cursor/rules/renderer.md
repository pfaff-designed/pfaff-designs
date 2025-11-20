renderer.md

Updated to reflect real implementation + validation behavior

The Renderer is a deterministic component responsible for transforming a PageJSON structure (produced by the Orchestrator) into actual React UI using the project’s approved component registry.

The Renderer only handles Page Mode layouts.
It does not render AI modal content and must never be used in conversational UI flows.

⸻

1. Input Format (Corrected)

Renderer receives PageJSON, NOT { type: "page", layout: [...] }.

Actual input shape (RendererProps + PageJSON):

export interface RendererProps {
  data: PageJSON | null;
  className?: string;
  status?: "idle" | "loading" | "success" | "error";
  responseId?: string | number;
  isLatest?: boolean;
}

export interface PageJSON {
  version: string;      // Must be "1"
  page: PageData;
}

export interface PageData {
  id: string;           // Unique page identifier
  kind: string;         // "case_study", etc.
  blocks: Block[];      // The actual renderable content tree
}

Block interface (actual)

export interface Block {
  id: string;
  component: string;        // Name in component registry
  props?: Record<string, any>;
  children?: Block[];
  text?: string;            // For primitive text blocks
}

This is the canonical definition.

2. Schema Validation (Corrected)

Previous docs incorrectly stated that Renderer uses Zod validation.

Correct behavior: Renderer does NOT use Zod.

Instead, Renderer uses:
	•	Component registry validation
Ensures component exists and is renderable.
	•	Prop validation
Ensures the props passed match required prop sets.
	•	Media validation
Ensures alt text, safe autoplay rules, correct gallery sizes, etc.
	•	Parent-child validation
Ensures valid nesting (some components cannot accept children).

Renderer enforces correctness through custom validators, not Zod.

⸻

3. Component Registry (Corrected to match actual code)

Actual registry lives at:


@/lib/registry/componentRegistry.ts

Registry entries include:

Atoms
	•	Heading
	•	BodyText
	•	Eyebrow
	•	ImageContainer
	•	Video

(Tag + Metric exist as atoms but are not in the registry; Orchestrator does not generate them.)

Molecules
	•	Card / CardHeader / CardContent / CardFooter
	•	CardTitle / CardDescription
	•	MediaFigure
	•	MediaGallery
	•	SideBySideMedia

(ContentBlock, MediaCard, NavItem exist in code but are NOT in the registry today.)

Page Components
	•	ContentSection
	•	CaseStudyHero
	•	AnswerBlock

(Header + Footer exist as page-components, but are not driven by Renderer.)

Layout
	•	Section
	•	Container

(Stack exists as layout but is NOT registry-connected.)

Renderer only renders components in this registry.
Attempting to render a component NOT in the registry → ErrorBlock.

⸻

4. Prop Normalization (New Section)

Renderer includes a prop normalization system that:
	•	Converts legacy names → new names
	•	e.g. title → headline
	•	description → body
	•	content → body
	•	Converts primitive string children → props
	•	For Heading → headline
	•	For BodyText → body
	•	Drops invalid props
	•	Warns about common typos
(e.g. imageSrc instead of src)

Purpose
	•	Allow older JSON formats to still render
	•	Enforce uniform prop naming
	•	Reduce impact of breaking changes

Normalization happens before component rendering.

⸻

5. Section Index Assignment (Case Study Enhancement)

For case study pages (page.kind === "case_study"):

Renderer automatically injects:
	•	projectSlug
	•	sectionIndex

Into ContentSection blocks.

Why?

This enables:
	•	Scroll linking
	•	Local navigation
	•	Section-aware interactions (e.g., future AI Deep Dive into a section)

How?

Renderer:
	1.	Extracts projectSlug from page ID
	2.	Traverses blocks
	3.	Assigns each ContentSection an index based on order

This is not done for other page types.

⸻

6. Error Handling (Expanded)

Renderer uses a non-blocking error model:

6.1 ErrorBlock UI

Instead of throwing exceptions, Renderer renders:
	•	A visible <ErrorBlock> component in place of the failing block
	•	An error message describing what went wrong
	•	A safe fallback layout

6.2 Console Logging

Errors are also logged to console for debugging.

6.3 Types of errors handled
	•	Unknown component in registry
	•	Missing required props
	•	Invalid parent-child relationship
	•	Media validation errors
	•	Version mismatch
	•	Null/undefined data
	•	RendererProps misuse

Renderer never crashes the page.
It degrades gracefully.

⸻

7. ResponseContext (Undocumented Behavior)

Renderer wraps output in a ResponseContext provider:

const contextValue: ResponseContextValue = {
  status,
  responseId: responseId || data?.page?.id,
  isLatest,
};

Purpose
	•	Track which response is newest (for typing animations, highlight states)
	•	Assist AI-augmented layouts (future integration)
	•	Provide status signals to children (loading, success, etc.)

This is separate from the new AI modal and is Renderer-specific.

⸻

8. Empty State Logic

If data is null:

Renderer shows a branded fallback message:

“Hey, I’m Charles. This page is still being composed…”

(this matches the actual source string)

This ensures:
	•	Pages never break
	•	There is always human-friendly fallback UI

⸻

9. Version Validation

Renderer requires:

data.version === "1"

If invalid:
	•	Show ErrorBlock
	•	Log a warning
	•	Skip all blocks

This ensures schema migrations stay manageable.

⸻

10. Media Validation Rules

Renderer enforces the following:

Video
	•	Autoplay requires muted: true
	•	Warn if missing alt/caption
	•	Warn if video props are incomplete

MediaGallery
	•	Warn if exactly 2 items (use SideBySideMedia instead)

MediaFigure
	•	Caption must be a string
	•	Image must have alt text

ImageContainer
	•	Must receive src, alt, and appropriate dimensions

⸻

11. Prop Key Validation

Renderer detects common mistakes:

Examples:
	•	src vs imageSrc
	•	title vs headline
	•	Missing required props
	•	Unexpected keys

Renderer logs a warning and:
	•	Fixes the issue if possible
	•	Otherwise shows an ErrorBlock

⸻

12. Project Slug Extraction

Renderer derives projectSlug using rules:

strip: 
- "pmi-"
- "tanger-"
- "case-study-"
- "page-"

Slug is used to:
	•	Build section anchors
	•	Provide context for future AI interactions
	•	Support internal linking

⸻

13. Children Handling Rules

Some components do not accept children:
	•	Heading
	•	BodyText

Renderer converts children → props.

Other components may accept children recursively.

Renderer merges:
	•	primitive text
	•	nested blocks
	•	normalized props

into the final component output.

⸻

14. Recursive Rendering

Renderer processes blocks recursively:
	1.	Map block → component
	2.	Normalize props
	3.	Render children recursively
	4.	Inject nested structures
	5.	Validate at each step

This allows for arbitrarily deep layout trees.

⸻

15. RendererProps Documentation

Renderer accepts:

export interface RendererProps {
  data: PageJSON | null;
  className?: string;
  status?: "idle" | "loading" | "success" | "error";
  responseId?: string | number;
  isLatest?: boolean;
}

Purpose of props:
	•	data: The layout to render
	•	status: Helps control the ResponseContext
	•	responseId: Unique ID tied to current render cycle
	•	isLatest: Prevents multiple async renders from conflicting
	•	className: Allows wrapping container styles

⸻

16. Relationship to Component Registry

Renderer uses:

import { componentRegistry } from "@/lib/registry/componentRegistry";

The registry defines:
	•	Allowable component names
	•	Which components accept children
	•	Which props each component supports
	•	Safe fallbacks

Renderer must never render a component not in the registry.

⸻

17. What Renderer Does NOT Do

Renderer does NOT:
	•	Fetch data
	•	Modify data
	•	Render AI modal content
	•	Generate new components
	•	Infer layouts
	•	Perform RAG retrieval
	•	Perform copywriting or YAML generation
	•	Handle conversational UI

Renderer only turns PageJSON → predictable, validated React UI.

⸻

18. Summary

This document now reflects the real Renderer:

✔ True input shape

✔ Actual registry components

✔ Recursive rendering

✔ Prop normalization

✔ Section index injection

✔ ResponseContext

✔ ErrorBlock behavior

✔ Media validation

✔ Prop key validation

✔ Version enforcement

✔ Exact Block interface

✔ Exact RendererProps

✔ No Zod validation

Renderer = deterministic, defensive, schema-bound page layout renderer
(not used for AI modal or conversational UI)