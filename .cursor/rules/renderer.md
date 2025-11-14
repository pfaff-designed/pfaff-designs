Renderer

1. Purpose

The Renderer is the final stage of the generative-UI pipeline. It converts the Orchestrator’s validated JSON layout tree into actual React components. It ensures:
	•	Strict schema validation
	•	Deterministic rendering
	•	Safe component resolution
	•	Controlled error recovery
	•	Proper media handling (images, videos, galleries)

The Renderer is non-AI. It is fully deterministic.

⸻

2. Responsibilities
	1.	Validate Orchestrator output against:
	•	version number
	•	page structure schema
	•	component registry schemas
	2.	Walk the layout tree recursively
	3.	Resolve:
	•	component name → React component
	•	props → validated props
	•	children → recursively rendered blocks
	4.	Enforce structural rules:
	•	no unauthorized components
	•	no unexpected props
	•	no illegal parent-child pairs
	5.	Render media components correctly:
	•	Image
	•	Video
	•	MediaFigure
	•	MediaGallery
	•	SideBySideMedia
	6.	Handle rendering failures gracefully with fallback UI

⸻

3. Input JSON Schema

The Renderer consumes Orchestrator output:

{
  "version": "1",
  "page": {
    "id": "string",
    "kind": "case_study",
    "blocks": [ { /* block */ } ]
  }
}

Each block:

{
  "id": "string",
  "component": "ComponentName",
  "props": { ... },
  "children": [ ... ]
}


⸻

4. Rendering Algorithm

Step-by-step

renderPage(page):
  validate page schema
  return page.blocks.map(renderBlock)

renderBlock(block):
  verify block.component exists in registry
  validate props using registry schema
  const Component = registry[block.component]
  const children = block.children?.map(renderBlock)
  return <Component {...props}>{children}</Component>

Media-specific logic
	•	Image → lazy-loaded, aspect-ratio enforced, alt text required
	•	Video → no autoplay by default unless explicitly allowed
	•	MediaFigure → wraps media + caption
	•	MediaGallery → grid layout, optimized for performance

⸻

5. Validation Layer

Before React rendering:
	•	Validate component name (must exist)
	•	Validate props via Zod schema
	•	Validate children against allowed component set:

if (!registry[Parent].allowedChildren.includes(Child)) error

If any validation fails:
	•	Return structured error info
	•	Optionally invoke Repair Agent
	•	Fallback UI renders an error block visually

⸻

6. Error Handling

Renderer must NEVER crash.

Errors fall into categories:
	1.	Schema mismatch → invalid props
	2.	Missing component → Orchestrator error
	3.	Invalid child placement
	4.	Unexpected keys
	5.	Missing media field

Fallback blocks

<ErrorBlock title="Rendering Error" details="Missing alt text for image" />

Renderer logs all errors for debugging.

⸻

7. Media Rendering Rules

Images
	•	Must include src and alt
	•	Should include width/height if known
	•	Lazy load by default

Videos
	•	poster required if autoplay is false
	•	Never autoplay unless explicitly set
	•	Muted required for autoplay

Galleries
	•	2-item gallery → SideBySideMedia
	•	3+ items → MediaGallery

Captions
	•	If provided → wrap in MediaFigure
	•	If not → render raw Image/Video

⸻

8. Layout Integration

Renderer must:
	•	Respect layout instructions encoded by Orchestrator
	•	Allow components to define their own layout (CSS/Tailwind)
	•	Never guess additional layout structure

⸻

9. Example Render Flow

Given this JSON:

{
  "id": "context-media-01",
  "component": "MediaFigure",
  "props": {
    "mediaType": "image",
    "src": "https://cdn.supabase.com/img-context-01.jpg",
    "alt": "Context image",
    "caption": "Initial design exploration."
  }
}

Renderer outputs:

<MediaFigure mediaType="image" src="..." alt="..." caption="Initial design exploration." />


⸻

10. Summary

The Renderer is the final guardrail ensuring reliable, safe, deterministic generative UI. It:
	•	Enforces truthfulness indirectly through validation
	•	Prevents structural errors
	•	Ensures media is rendered accessibly and consistently
	•	Makes the entire generative UI pipeline robust and production-ready