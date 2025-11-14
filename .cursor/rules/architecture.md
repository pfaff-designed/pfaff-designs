Architecture (Updated with Media Support)

1. System Overview

This system is a generative-UI portfolio platform composed of:
	•	AI agents (Copywriter + Orchestrator)
	•	A structured, editable Knowledge Base
	•	A deterministic JSON rendering pipeline
	•	React + Next.js components
	•	Supabase for all data and media storage
	•	Vercel for hosting + edge caching

Media (images/videos) are now first-class entities throughout the pipeline.

⸻

2. High-Level Flow

User Query → Intent Resolver → KB Retrieval → Copywriter (YAML) → Orchestrator (JSON) → Renderer (React UI)

Media flows alongside narrative and facts.

⸻

3. Media in the Architecture

3.1 Media Storage

Supabase Storage holds raw assets. Metadata is stored in the KB:
	•	id, project_slug, type
	•	url, thumb_url
	•	alt, caption, role
	•	width/height

3.2 Media in Retrieval

Media is retrieved alongside project sections and project metadata.

3.3 Media in Copywriter

Copywriter references media by ID only.

3.4 Media in Orchestrator

Orchestrator selects:
	•	Image
	•	Video
	•	MediaFigure
	•	SideBySideMedia
	•	MediaGallery

Placement rules determine where media appears.

3.5 Media in Renderer

Renderer enforces:
	•	required alt text
	•	correct components
	•	safe rendering

⸻

4. Performance Considerations
	•	Supabase CDN for optimized delivery
	•	Lazy-loading for images
	•	No autoplay videos unless explicitly allowed
	•	Galleries optimized for layout + performance
	•	Metadata-only retrieval protects token budget

⸻

5. Security & Validation
	•	URLs come only from Supabase
	•	Alt text required for every asset
	•	Renderer prevents structural misuse
	•	Repair Agent only applies structural fixes

⸻

6. Caching Strategy
	•	Session-level YAML caching
	•	Topic-level media + metadata caching
	•	Vercel edge caching for rendered HTML
	•	Client-side memoization for galleries and repeated media

⸻

7. Summary

Media is now fully integrated across:
	•	Storage
	•	Retrieval
	•	Copywriting
	•	Layout orchestration
	•	Rendering

The result is a visually rich, highly controlled generative UI system suitable for recruiter workflows and deep, flexible case-study exploration.