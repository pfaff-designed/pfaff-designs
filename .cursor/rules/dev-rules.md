dev-rules.md

Development & Implementation Rules for Cursor

These rules define exactly how Cursor must behave when reading, modifying, and generating code in the pfaff-designs project.
They ensure stability, prevent drift, enforce design integrity, and guide Cursor to build features safely and predictably.

Cursor must follow this document strictly.

⸻

1. Source of Truth Hierarchy

Whenever there is a conflict:

1. The existing codebase is the ultimate source of truth.

2. design-rules.md

3. component-inventory.md

4. architecture.md

5. dev-rules.md (this file)

Cursor must NOT assume conceptual descriptions override implemented logic, tokens, or component structure.

⸻

2. Required File Reading Order

Before making ANY changes, Cursor must read these files in this exact order:
	1.	design-rules.md
	2.	component-inventory.md
	3.	architecture.md
	4.	dev-rules.md
	5.	Then the specific component(s) being modified
	6.	Parent components
	7.	Storybook files
	8.	Test files

Cursor must confirm that it has read and aligned all files before generating code.

⸻

3. General Development Principles

Cursor must:
	•	Follow TypeScript strict mode (strict: true).
	•	Use semantic color tokens (--bg-*, --text-*, --accent-*).
	•	Use Tailwind utilities for spacing, type, color, and layout.
	•	Use rem if raw CSS is required.
	•	Respect existing layout, card, and typography systems.
	•	Follow established Responsiveness and A11y patterns.
	•	Use path aliases (@/components/..., @/lib/...).
	•	Files should follow these STRICT rules:
		• Ideal Target (Most Files): 50–150 lines
		• Acceptable for More Complex Files: 150–250 lines
		• Large but Sometimes Unavoidable: 250–400 lines
		• Anti-Pattern Threshold: 400+ lines

Cursor must NOT:
	•	Introduce new components that duplicate existing ones.
	•	Invent new design tokens.
	•	Invent new component variants without updating docs.
	•	Modify global CSS without confirmation.

⸻

4. Testing Requirements (Jest)

This project uses Jest + React Testing Library.

Cursor must ensure:

Required Files:

jest.config.ts  
src/setupTests.ts  

package.json must include:

"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}

Naming convention:
	•	ComponentName.test.tsx
	•	ComponentName.spec.tsx

Cursor MUST write tests for:
	•	New components
	•	Modified logic
	•	All new AI modal components
	•	All state machine behavior
	•	Accessibility (focus, tab, ESC close, aria-roles)

Cursor must run tests and ensure they pass before completing a step.

If Jest is not fully configured, Cursor must ask for instructions before generating tests.

⸻

5. Storybook Requirements

Cursor MUST:
	•	Create a *.stories.tsx file for each new component.
	•	Include:
	•	Default story
	•	Variants (loading, long content, empty states if applicable)
	•	Use tokens + structure defined in design-rules.md.

Cursor must run Storybook (npm run storybook) to visually validate UI changes when relevant.

⸻

6. Code Style, ESLint & Prettier Rules

Cursor must:
	•	Run npm run lint after changes.
	•	Fix ESLint errors unless doing so would introduce new behavior.
	•	Use consistent import order.
	•	Format all code with Prettier.

Cursor must NEVER disable ESLint rules unless instructed.

⸻

7. Motion, Easing & Animation Rules

Design-rules defines conceptual motion tokens. Since they are not yet implemented in CSS vars:

Cursor must treat motion tokens as:

Durations
	•	Fast: 120ms
	•	Medium: 180ms
	•	Slow: 280ms

Easing
	•	Ease-out: cubic-bezier(0.33, 1, 0.68, 1)
	•	Ease-in: cubic-bezier(0.32, 0, 0.67, 0)
	•	Standard: cubic-bezier(0.25, 0.1, 0.25, 1)

Use inline styles or Tailwind utilities; do NOT invent motion.* classes.

⸻

8. Component Modification Rules

Before modifying a component, Cursor must:
	1.	Read the file and its index.
	2.	Read its story.
	3.	Read its tests.
	4.	Read any variants or sibling components.
	5.	Read its parent component.
	6.	Check imports and ensure it uses tokens.

Cursor must NOT:
	•	Change prop names without approval.
	•	Add new props casually.
	•	Modify design tokens.
	•	Add new layout systems without updating documentation.
	•	Break existing visual patterns.

Cursor MUST:
	•	Update stories if behavior changes.
	•	Update or add tests covering new logic.
	•	Maintain full responsiveness.
	•	Maintain accessibility (focus trap, aria roles, keyboard support).

⸻

9. AI Modal Folder & Component Rules

The new AI Modal must live in:

src/components/ai-modal/

NOT in src/components/ai/ (which contains legacy components).

Cursor may create only the following new components:

src/components/ai-modal/AiModal.tsx
src/components/ai-modal/AiModalCard.tsx
src/components/ai-modal/AiConversationRow.tsx
src/components/ai-modal/AiActionsRow.tsx
src/components/ai-modal/AiComposer.tsx
src/components/ai-modal/AskAiPill.tsx

Each must include:
	•	A story
	•	A test file
	•	An index file

Cursor must NOT create other AI-related components.

⸻

10. AI Modal Architecture Rules

Cursor must follow the state machine defined in architecture.md.

Valid States:

IDLE
OPENING
THINKING
ANSWER_SHOWING
WAITING_FOR_INPUT
ERROR
CLOSING

Cursor must implement:
	•	Backdrop blur + dim
	•	Centered card
	•	Focus trap
	•	ESC close
	•	Typing animation
	•	Deep dive action behavior
	•	Scroll & navigation actions
	•	Error UI
	•	Safe close
	•	Return focus to previously focused element

Cursor must NOT:
	•	Insert AI output into pages.
	•	Modify ContentSection, CaseStudyHero, etc.
	•	Use any legacy AI components (QuestionComposer, AIAnswerContext, etc.).

⸻

11. Legacy Component Policy

These components are LEGACY:
	•	QuestionComposer
	•	Composer
	•	GlobalComposer
	•	AIAnswerContext
	•	SectionContext
	•	SectionAIAnswer
	•	AnswerBlock

Rules:
	•	Legacy means: do NOT extend or build on them.
	•	Cursor must search for references before removing them.
	•	They may be cleaned up only after verifying nothing depends on them.

⸻

12. Import Path Rules

Use:

import Something from "@/components/...";

Never:

import Something from "../../../components/...";

13. Error Prevention Rules

Cursor must NOT:
	•	Modify global CSS tokens
	•	Add new dependencies without approval
	•	Introduce circular imports
	•	Generate code in folders that don’t exist
	•	Break Storybook
	•	Change environment variables

Cursor must ensure safe, incremental changes.

⸻

14. Pruning Rules

Cursor may remove code only if:
	•	Component is marked LEGACY
	•	Cursor confirmed via text search that it is unused
	•	Related tests and stories are also updated
	•	No pages import it
	•	No logic depends on it

Cursor must request confirmation if unsure.

⸻

15. Step-by-Step Execution Rules

Cursor must:
	1.	Break every implementation request into clear steps.
	2.	After each step:
	•	Run tests
	•	Update stories
	•	Ensure visual alignment with design rules
	•	Clean up unused logic
	3.	Ask clarifying questions when uncertain.

Cursor must NOT attempt to do everything in one giant change.

⸻

16. Final Rule

If any instruction is ambiguous, Cursor MUST ask before executing.