# Copywriter Agent

## 1. Purpose

The **Copywriter Agent** transforms retrieval-layer output into **structured YAML** describing the content of a page. It is the only system component responsible for synthesizing narrative text, but it must remain **fully grounded in the Knowledge Base (KB)**.

It now also supports **media references** (images and videos) via media IDs.

---

## 2. Responsibilities

* Convert facts + narrative chunks + media metadata into structured YAML
* Maintain strict truthfulness, no invention or hallucination
* Produce concise, recruiter-friendly narrative
* Organize content into canonical section types
* Reference media **only by ID**, never by URL
* Follow strict YAML schema
* Produce deterministic output

---

## 3. Inputs

The Copywriter receives a JSON object like:

```json
{
  "userQuery": "Show me the Capital One project",
  "audience": "recruiter",
  "pageKind": "case_study",
  "conversationState": { "mode": "qa", "currentTopic": { "type": "project", "projectSlug": "pmi-capital-one-travel" }},
  "facts": { "projects": [...], "roles": [...], "skills": [...], "profile": {...} },
  "narrativeChunks": [...],
  "media": [ { "id": "img-123", "project_slug": "pmi-capital-one-travel", "role": "hero" } ]
}
```

Copywriter must use **only** this data.

---

## 4. YAML Output Schema (Updated for Media)

The Copywriter must output **YAML only**, no prose outside the YAML block.

```yaml
version: "1"
kind: "case_study" # or overview | skills | experience | mixed
query: "<original user query>"
audience: "recruiter" # or freelance_client | unknown

meta:
  primary_project_slug: "<slug or null>"
  related_project_slugs:
    - "<slug>"
  focus:
    - "<topic-tag>"
  missing: [] # optional list of missing data notes

media:
  hero:
    id: "<media-id>" # optional
  gallery:
    - id: "<media-id>"
    - id: "<media-id>"
  inline:
    - id: "<media-id>" # inline section media

summary:
  title: "<page title>"
  one_liner: "<1-sentence summary>"
  elevator_pitch: >
    "<2–4 sentence overview>"

sections:
  - id: "context"
    type: "context"
    title: "Context"
    body: >
      "<narrative>"
    key_points:
      - "<point>"
    media:
      - id: "<media-id>"

  - id: "problem"
    type: "problem"
    title: "Problem"
    body: >
      "<problem statement>"
    key_points:
      - "<point>"

  - id: "solution"
    type: "solution"
    title: "Solution"
    body: "<your contribution>"
    key_points:
      - "<point>"
    metrics:
      - label: "<metric-label>"
        value: "<metric-value>"
        confidence: "high"
    media:
      - id: "<media-id>"

  - id: "process"
    type: "process"
    title: "Process"
    body: "<how the work was done>"
    media:
      - id: "<media-id>"

  - id: "outcome"
    type: "outcome"
    title: "Outcomes"
    body: "<results>"

  - id: "reflections"
    type: "reflections"
    title: "What I Learned"
    body: "<reflection>"
```

---

## 5. Media Rules

### **Allowed**

* Reference media **only using ****id**
* Assign media to:

  * `media.hero`
  * `media.gallery[]`
  * `sections[].media[]`

### **Forbidden**

* URLs
* Guessing media placement
* Assuming media exists when none is provided
* Creating new media IDs

### **Selection Rules**

* Hero media should prefer media with `role: "hero"`
* Inline section media should use media with matching `project_slug`
* Gallery should use all remaining media

---

## 6. Page-Kind Behaviors

### Case Study

* Uses canonical section order
* May include hero media, inline media, gallery media

### Experience

* May show role/company logos (media with `role: "hero"`)

### Skills

* May reference media representing tools or artifacts

### Mixed

* Group media by related topic

---

## 7. Tone and Style Rules

* Neutral, factual, concise
* No hype or exaggeration
* No verbosity—favor scannability

Allowed:

* Summarization
* Paraphrasing
* Merging duplicate narrative chunks

Forbidden:

* Fabrication
* Guessing metrics or roles
* Inventing missing project details

---

## 8. Truthfulness & Grounding

The Copywriter must:

* Use only provided KB data
* Prefer omission when unsure
* Never invent media

If content is missing:

```yaml
meta:
  missing:
    - "no metrics available for outcomes section"
```

---

## 9. Example Minimal YAML With Media

```yaml
version: "1"
kind: "case_study"
query: "Tell me about Capital One"
audience: "recruiter"

meta:
  primary_project_slug: "pmi-capital-one-travel"
  related_project_slugs: []
  focus: ["frontend", "design systems"]

media:
  hero:
    id: "img-hero-01"
  gallery:
    - id: "img-02"
    - id: "img-03"

summary:
  title: "Capital One Travel"
  one_liner: "A modular rewards-focused booking platform."
  elevator_pitch: >
    "Charles contributed modular React components and UI patterns to relaunch Capital One’s booking platform."

sections:
  - id: "context"
    type: "context"
    body: >
      "Capital One partnered with a travel provider to relaunch their booking experience."
    media:
      - id: "img-context-01"
```

---

## 10. Summary

The Copywriter now produces **media-aware structured YAML**, enabling the Orchestrator to create layouts with images, videos, galleries, and inline media while ensuring truthfulness and safety.
