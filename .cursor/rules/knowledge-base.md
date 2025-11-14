Knowledge Base (KB)

This document defines the canonical truth layer for the generative-UI system. All AI-generated content must be grounded exclusively in this data.

The KB is stored in Supabase and is fully editable without redeploying.

⸻

1. Purpose of the Knowledge Base

The KB provides:
	•	Structured project, role, skills, and profile data
	•	Narrative chunks for case-study storytelling
	•	Media metadata (images/videos)
	•	Embeddings to support semantic retrieval

This ensures that the Copywriter and Orchestrator work from consistent, truthful, non-fabricated data.

⸻

2. Data Model

The KB consists of the following core tables.

⸻

2.1 Projects

Metadata for each case study.

Fields:
	•	id: UUID
	•	slug: string
	•	title: string
	•	one_liner: string
	•	client: string | null
	•	company: string | null
	•	timeframe: string
	•	role_title: string
	•	skills: string[]
	•	summary_short: string
	•	summary_long: text
	•	links: { label: string; url: string }[]

⸻

2.2 Project Sections (Narrative Chunks)

Short, semantically meaningful chunks used for storytelling.

Fields:
	•	id: UUID
	•	project_slug: string
	•	section_type: “context” | “problem” | “solution” | “process” | “outcome” | “reflections”
	•	content: text
	•	key_points: string[]
	•	metrics: { label: string; value: string; confidence: “high” | “medium” | “low” }[]
	•	embedding: vector

Chunking Rules:
	•	300–500 characters per chunk
	•	Single idea per chunk
	•	Each corresponds to one case-study section

⸻

2.3 Roles

Employment history.

Fields:
	•	id: UUID
	•	company: string
	•	title: string
	•	timeframe: string
	•	responsibilities: string[]
	•	skills: string[]
	•	projects: string[] (slugs referencing Projects)

⸻

2.4 Skills

Represents technical or creative capabilities.

Fields:
	•	id: UUID
	•	name: string
	•	category: string (e.g., “frontend”, “design systems”, “ai”)
	•	description: text
	•	related_projects: string[]

⸻

2.5 Profile Metadata

Top-level profile information.

Fields:
	•	id: UUID
	•	headline: string
	•	summary_short: string
	•	summary_long: text
	•	primary_skills: string[]
	•	tools: string[]
	•	values: string[]
	•	contact: { email: string; website?: string }

⸻

2.6 Media (Images & Videos)

All visual assets referenced by projects.

Fields:
	•	id: UUID
	•	project_slug: string | null
	•	type: “image” | “video”
	•	url: string (Supabase CDN URL)
	•	thumb_url: string (optional)
	•	alt: string (required for accessibility)
	•	caption: string (optional)
	•	role: “hero” | “inline” | “gallery” | “step”
	•	width: number (optional)
	•	height: number (optional)

Notes:
	•	The KB stores metadata, not blobs. Assets live in Supabase Storage.
	•	Copywriter only references media by ID.

⸻

3. Embeddings

Embeddings are used for semantic chunk retrieval.

Sources of embeddings:
	•	Project Sections (mandatory)
	•	Projects (optional summary embeddings)
	•	Roles (optional)
	•	Skills (optional)
	•	Media captions (optional)

Retrieval behavior:
	•	k = 3–6 semantic chunks
	•	Cosine similarity threshold ≈ 0.75
	•	Fallback to project metadata if insufficient chunks

⸻

4. Retrieval Layer

The Retrieval Layer combines:
	•	Semantic text chunks
	•	Structured facts
	•	Related project associations
	•	Media linked to the project/topic

Retrieval Rules by Topic

Project Topic

Return:
	•	Project metadata
	•	All narrative chunks for that project
	•	All media linked to that project
	•	Related projects

Skills Topic

Return:
	•	Matching skills
	•	Related projects
	•	Media tagged with those projects
	•	Relevant role responsibilities

Experience Topic

Return:
	•	All roles
	•	Ordered by timeframe
	•	Projects associated with each role
	•	Media linked to those projects

General Topic

Return a blend of:
	•	Profile metadata
	•	Most relevant projects
	•	A few narrative chunks
	•	High-level media (hero assets)

⸻

5. Copywriter Inputs

The Copywriter receives the following structure:

{
  "facts": {
    "projects": [...],
    "roles": [...],
    "skills": [...],
    "profile": {...}
  },
  "narrativeChunks": [...],
  "media": [...]
}

Important:
	•	Copywriter cannot use URLs directly.
	•	It references images/videos by media.id only.

YAML Example:

media:
  hero:
    id: "img-123"
  gallery:
    - id: "img-456"
    - id: "img-789"


⸻

6. Editing Workflow

Editing the KB does not require redeployment.

Workflow:
	1.	Update or insert data in Supabase
	2.	For narrative text:
	•	Split into chunks
	•	Generate embeddings
	•	Insert into project_sections
	3.	Upload media to Supabase Storage
	4.	Insert media metadata into media table

Changes take effect immediately.

⸻

7. Constraints
	•	All data must be factual
	•	No speculative or estimated values
	•	No long paragraphs (must be chunked)
	•	No media without alt text
	•	No external embedding models without consistency

⸻

8. Future Enhancements
	•	Versioned KB
	•	Admin dashboard for chunk + media management
	•	Auto-chunking tool for longer case studies
	•	Auto-embedding pipeline with cron refresh

⸻

9. Summary

The Knowledge Base is the single source of truth powering the generative UI. It provides structured data, narrative chunks, and media metadata enabling the Copywriter and Orchestrator to produce accurate, visually rich, and consistent results.