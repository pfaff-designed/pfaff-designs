# **Project Overview**

## **1. Purpose of the System**

This project is a **generative-UI portfolio platform** built for a design engineer. Its purpose is to:

- Communicate skills, experience, and case studies to **recruiters** and **potential freelance clients**.
- Reduce friction in discovery by letting users **ask questions in natural language**.
- Dynamically render UI and content using AI agents to provide **precise, context-aware answers**.

The website operates as a hybrid:

- A **normal, navigable portfolio** (Home, About, Work, Case Studies, Contact).
- A **conversational generative UI system** that intelligently composes page layouts and content blocks based on user queries.

---

## **2. Problem Statement**

Recruiters:

- Have limited time and prefer fast, scannable portfolios.
- Often skim multiple candidates and prioritize clarity, outcomes, and proof of craft.

Traditional portfolios:

- Hide information inside pages.
- Require high cognitive effort to navigate.
- Are not personalized to what the recruiter wants to know.

---

## **3. Solution Summary**

The system uses two agents:

- **Copywriter Agent** → Synthesizes structured content from a knowledge base.
- **Orchestrator Agent** → Converts structured content into a JSON layout using a curated component inventory.

A **renderer** then transforms the JSON into actual React UI.

This allows the site to:

- Respond directly to user queries (e.g., “Tell me about Capital One Travel”)
- Generate tailored case-study deep dives
- Build pages that highlight relevant skills or experiences
- Produce recruiter-friendly layouts automatically

The experience is:

- Efficient: users no longer need to hunt for information.
- Personalized: content adapts to user intent and audience type.
- Transparent: AI-generated sections are clearly marked.
- Reliable: strict schemas and validation ensure safe rendering.

---

## **4. High-Level Goals**

- Make it easy for recruiters to understand the candidate’s **skills**, **impact**, and **capabilities**.
- Provide **fast access** to case studies and background information.
- Maintain **truthfulness**, **accuracy**, and **transparency** in all AI-generated content.
- Keep monthly costs **predictable and under $100**.
- Ensure the system feels **professional**, **stable**, and **developer-friendly**.

---

## **5. Key System Principles**

### **Truthfulness & Accuracy**

All content must be grounded in the knowledge base. Agents cannot invent facts, metrics, titles, dates, or roles.

### **Recruiter-Centric Experience**

Generated content must be concise, scannable, and structured using familiar patterns.

### **Stable Layouts**

Generative UI must avoid chaotic or unpredictable page structures.

### **Strict Validation**

All agent outputs pass through schemas to ensure correctness before rendering.

### **Performance & Cost Control**

Efficient model selection, caching, and limited context windows ensure minimal cost per query.

### **Accessible Design**

All components follow accessible design and semantics.

---

## **6. Success Criteria**

- Recruiters can understand key skills/experience within 10–20 seconds.
- Case studies can be generated dynamically without sacrificing clarity.
- The system remains within cost limits even during moderate traffic.
- Components render deterministically based on strict schemas.
- The experience feels modern, responsive, and technically impressive without being gimmicky.

---

## **7. System Surface Areas**

The system supports dynamic generation of:

- Case study pages
- Experience summaries
- Skills breakdowns
- Project comparisons
- General Q&A about the candidate’s work or background

It **does not**:

- Allow AI to alter global navigation
- Generate arbitrary new component types
- Produce new project content not in the KB

---

## **8. Constraints**

- The knowledge base must be **editable without redeploying**.
- The system must operate deterministically for the same inputs.
- The orchestrator can only use **whitelisted components**.
- All agent outputs must be valid YAML/JSON following schemas.
- The composer uses **session-limited memory**.

---

## **9. High-Level Interaction Loop**

1. User enters a query in the composer.
2. System determines **intent**, **topic**, and **audience**.
3. Knowledge base retrieval returns relevant facts + narrative chunks.
4. Copywriter agent synthesizes a **structured YAML document**.
5. Orchestrator agent converts YAML into a **JSON component tree**.
6. Renderer validates, sanitizes, and renders the layout.
7. AI-generated sections display with transparency indicators.

---

## **10. Document Purpose**

This overview establishes:

- What the system is
- Why it exists
- What problems it solves
- Constraints it operates under
- High-level behavior

Subsequent documents define the deep technical architecture, agent prompts, renderer pipeline, component registry, and cost strategy.