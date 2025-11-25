

# V1 Roadmap — Generative-UI Portfolio
*A fully conversational, AI-enhanced, editorial portfolio experience.*

---

# 🎯 Overview
V1 of your portfolio delivers a deterministic generative-UI system, a conversational AI modal, an intent-aware interaction model, a global Cmd+K palette, and a seamless contact flow — all wrapped inside a beautifully minimal, editorial design language.

This roadmap describes exactly how V1 is built, end-to-end.

---


# Phase 0–4 — Foundations
**Estimated Hours: 10–12 hrs**

Establish the architecture that enables deterministic layout generation and consistent UI.

## 0.1 Technical Foundations
- Next.js 14 (App Router)
- React 18
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui primitives
- lucide-react icons
- Storybook for visual testing
- ESLint + Prettier

## 0.2 Generative-UI Pipeline
- RAG pipeline (Supabase embeddings + vector search)
- Copywriter Agent (structured YAML synthesis)
- Orchestrator Agent (YAML → JSON component tree)
- Renderer (maps component JSON → deterministic React components)

## 0.3 Design System & Tokens
- Modular spacing, typography, radius tokens
- Editorial grid system
- Neutral palette + primary accent for AI identity
- Motion tokens (150–180ms ease-in/out)

## Success Criteria
- Asking “Tell me about Tanger” generates a full page layout
- Renderer shows stable, deterministic visual results
- RAG, copywriter, and orchestrator operate within schema boundaries

---


# Phase 5 — Intelligent Conversations
**Estimated Hours: 12–16 hrs**

Enable site-wide question answering — not just on case study pages.

## 1.1 Copywriter + RAG Integration
- Copywriter Agent produces structured `answer_blocks`
- RAG retrieves relevant case study chunks
- Orchestrator produces deterministic `PageJSON`

## 1.2 Universal Answering
The user should be able to ask:
- “What are your AI skills?”
- “What did you do for Coke?”
- “What’s your background?”

And receive:
- A generated heading
- Eyebrow type
- Body content
- Optional actions

## Success Criteria
- Zero hallucinated content (must come from KB)
- Fast responses (<2s server round trip)
- Clean AnswerBlock layout in Renderer

---


# Phase 6 — Interaction Model (Hover Pill + Modal)
**Status: Completed**
**Estimated Hours: 18–24 hrs**

Your signature interaction: selectable content → contextual AI modal.

## 2.1 Hover-Pill Pattern
- User hovers any ContentSection
- Cursor transforms into your custom interactive cursor
- A pill appears attached to cursor: “Ask AI about this”
- Clicking opens the AI in contextual mode
- Automatically passes section title, section ID, page path, selected text (if any)

## 2.2 AI Modal (V1 Architecture)
- Blur + fade-in
- No rounded corners
- Off-white background
- Editorial typography
- Conversation rows
- Inline actions
- Composer input

## 2.3 Lifecycle
States:
- `idle`
- `opening`
- `thinking`
- `answer_showing`
- `waiting_for_input`
- `closing`
- `error`

## Success Criteria
- Hover feels smooth across desktop
- Pill only appears on ContentSection hover
- Modal is fast and stable
- No page navigation required for conversation

---


# Phase 7 — UX Polish
**Status: Done**
**Estimated Hours: 12–16 hrs**
**Actual Hours: 5**

Refine the modal into a polished, delightful interaction.

## 3.1 Thinking State
- Inline TypingIndicator in an AI row
- Composer stays enabled

## 3.2 Error Handling
- AI row for errors (non-technical)
- Auto-clear on next submit

## 3.3 Composer Refinements
- Autofocus on open and after successful answer
- Shift+Enter → newline
- Enter → submit

## 3.4 Message Management
- Keep last 8–10 messages
- Clean trimming logic

## 3.5 Mobile UX
- Full-width modal card
- Scrollable content region
- Composer visible above keyboard

## 3.6 Visual Tuning
- Alignment with ContentBlock spacing
- AI accent color on eyebrow
- Editorial spacing rhythm

---


# Phase 8 — Global Command Palette (Cmd + K)
**Status: Not Started**
**Estimated Hours: 18–22 hrs**

A universal entry point for asking questions, navigating, and searching.

## 3.5.1 Trigger
- Press `Cmd + K` (Mac) / `Ctrl + K` (Windows/Linux)
- A tiny pill showing “⌘K” appears when cursor is not over interactable content

## 3.5.2 Palette Functions (Hybrid Model C)

### A) Ask AI
- “Ask a question”
- “Explain your skillset”
- “Tell me about your work”
- “Ask about a project”

→ Opens the AI modal in global mode (no section context)

### B) Search
- Fuzzy search across:
  - Case studies
  - Sections
  - Skills
  - Keywords

→ Navigates or opens modal deep dive

### C) Navigate
- Home
- Work
- Projects
- Contact

→ Pure navigation

## 3.5.3 Visual Style
- Editorial typography
- Snappy 150ms animation
- Clean list rendering

---


# Phase 9 — Content
**Status: In Progress**
**Estimated Hours: 20–30 hrs**

Ensure all material is complete, consistent, and ready for real-world consumption.

## 4.1 Case Studies
- PMI
- Tanger
- Coke
- Capital One
- Top Secret Real Estate
- This RAG Portfolio

Ensure each has:
- Facts JSON
- Long-form YAML
- Images in Supabase
- Proof points
- KB entries for RAG retrieval

## 4.2 Skills Pages
- AI engineering  
- Interaction design  
- Front-end engineering  
- Creative technology  

## 4.3 About Page
- Bio
- Headshot
- Philosophy
- Approach
- Toolset

---


# Phase 10 — Contact Flow (AI + Classic Page)
**Status: Not Started**
**Estimated Hours: 12–18 hrs**

A unified contact system that works both manually and through AI conversations.

## 4.5.1 Intent Detection
AI detects contact phrases:
- “Can I hire you?”
- “How do I reach you?”
- “Are you available?”
- “Let’s get in touch.”

Then switches modal into contact mode.

## 4.5.2 Inline Contact Form (Inside Modal)
Fields:
- Name
- Email
- Message

Features:
- Inline validation
- Editorial styling
- Success replaces form
- Composer hides while form is open

## 4.5.3 Backend Email Delivery
New endpoint: `/api/contact`

Payload:
```ts
{
  name,
  email,
  message,
  source: "ai-modal",
  pagePath
}
```

Sent via:
- Postmark or
- Resend

## 4.5.4 Classic Contact Page
At `/contact`:
- Standard form
- POST → `/api/contact`
- Confirmation message

## 4.5.5 AI Integration
AI may proactively suggest:
> “If you’d like to talk more, I can bring up the contact form.”

---


# Phase 11 — Launch Polish
**Status: Not Started**
**Estimated Hours: 10–14 hrs**

## 5.1 Visual Polish
- Margins
- Typography
- Responsive layout
- Image quality
- Favicon + OG images
- Loading transitions

## 5.2 SEO
- Meta descriptions
- Project schema
- Sitemap
- Social previews

## 5.3 Accessibility
- Keyboard navigation
- ARIA labels
- Focus traps
- High contrast

---


# Phase 12 — Performance
**Status: Not Started**
**Estimated Hours: 8–12 hrs**

## 6.1 Caching
- RAG result caching
- Copywriter output caching
- Suspense boundaries
- Static caching for non-AI pages

## 6.2 Speed
- Bundle size improvements
- Optimized images
- Avoid large client components

---


# Phase 13 — Analytics
**Status: Not Started**
**Estimated Hours: 6–10 hrs**

## 7.1 AI Analytics
- Questions asked
- Actions used
- Drop-off points
- Contact intent frequency

## 7.2 Page Analytics
- Navigation patterns
- Cmd+K usage
- Scroll depth

---


# Phase 14 — Maintenance
**Status: Not Started**
**Estimated Hours: 6–8 hrs**

## 8.1 KB Updates
- Add new case studies
- Update skills
- Add project assets

## 8.2 Code Quality
- ESLint
- Storybook coverage
- TypeScript upgrades

---

# 🚀 V1 Launch Criteria

You are ready to launch when:

### AI
- Modal answers reliably
- Hover-pill appears correctly
- Cmd+K works everywhere
- Contact flow fully functional (AI + classic)

### Content
- Case studies complete
- Skills + About page complete

### Design
- Editorial style consistent
- Smooth animations
- Fully responsive

### Tech
- No TS errors
- All endpoints tested
- Deterministic rendering stable

---

This completes the V1 roadmap.