Component Inventory

Source of truth for UI components in this project.
Cursor MUST obey this inventory when creating or modifying UI.

	•	Tech: Next.js 14, React 18, TypeScript 5, Tailwind 4, shadcn/ui
	•	Design system: central tokens (spacing, color, type, radius, motion, etc.)

Global rules for Cursor:
	1.	DO NOT recreate existing components.
	•	Always import from the paths listed here.
	2.	DO add tests and run them (Jest) when modifying or creating components.
	•	Add/update .test.tsx where appropriate.
	•	Run the test suite and ensure it passes before moving on.
	3.	ALWAYS use existing design tokens for color, spacing, typography, motion.
	4.	ALWAYS use responsive styling when appropriate (Tailwind breakpoints).
	5.	ALWAYS use rem units if raw CSS values are needed and Tailwind tokens are not sufficient.
	6.	New components must follow the folder pattern:
	•	ComponentName/ComponentName.tsx
	•	ComponentName/ComponentName.stories.tsx
	•	ComponentName/index.ts
	•	ComponentName/tests/ComponentName.test.tsx (or equivalent tests)

⸻

1. Atoms (src/components/atoms)

Small, reusable primitives with minimal logic.

1.1 Typography

Heading
	•	Path: atoms/Heading/Heading.tsx
	•	Role: Main typographic heading component for the system.
	•	Props (high level):
	•	variant: "display" | "hero" | "headline" | "subheading" | "h1" | "h2" | "h3"
	•	level?: 1 | 2 | 3 (HTML heading level when needed)
	•	className?
	•	children
	•	Rules:
	•	Use existing variant values. Do not invent new variants without updating this doc and the component.
	•	Choose level to maintain semantic heading structure on pages.

Eyebrow
	•	Path: atoms/Eyebrow/Eyebrow.tsx
	•	Role: Small label (section labels, “User”, “AI”, metadata).
	•	Props:
	•	children
	•	className?

BodyText
	•	Path: atoms/BodyText/BodyText.tsx
	•	Role: Primary body copy component.
	•	Props:
	•	children
	•	className?

⸻

1.2 Forms / Inputs

Input
	•	Path: atoms/Input/Input.tsx
	•	Role: Base text input, typically wraps shadcn/ui input.
	•	Props: match implementation (value, onChange, etc.).
	•	Use in forms and compositional components like InputWithButton.

Textarea
	•	Path: atoms/Textarea/Textarea.tsx
	•	Role: Base multi-line input.
	•	Props: match implementation.

Select
	•	Path: atoms/Select/Select.tsx
	•	Role: Base select-dropdown control, powered by Radix/shadcn under the hood.

⸻

1.3 Media

ImageContainer
	•	Path: atoms/ImageContainer/ImageContainer.tsx
	•	Role: Standardized frame for images (ratios, radii, overflow rules).
	•	Must be used instead of raw <img> where consistent styling matters.

Video
	•	Path: atoms/Video/Video.tsx
	•	Role: Basic video player wrapper.

⸻

1.4 Semantic Tags / Chips

Tag
	•	Path: atoms/Tag/Tag.tsx
	•	Role: Small label chip (e.g., “Case Study”, “RAG”, “React”).
	•	Props: match implementation.

Metric
	•	Path: atoms/Metric/Metric.tsx
	•	Role: Small stat + label (similar to “StatBlock” concept).
	•	Props:
	•	likely value, label (check component for exact naming).

⸻

1.5 Buttons

There are two button layers in this project:
	•	Design-system / primitives in ui/button.tsx (shadcn)
	•	App-level Button atom in atoms/Button/Button.tsx

atoms/Button
	•	Path: atoms/Button/Button.tsx
	•	Role: Project-level button component built on top of shadcn ui/button.
	•	Props:
	•	variant: must match implementation (e.g. "primary" | "secondary" | "ghost" | "destructive" or whatever is defined).
	•	size?
	•	className?
	•	...buttonProps
	•	Rule:
	•	Do not add new variants without updating this doc and Button.tsx.
	•	Always use this Button in page-level components rather than the raw shadcn button directly, unless you’re building another atom/molecule.

⸻

2. Layout (src/components/layout)

Layout primitives that define structure and spacing.

Container
	•	Path: layout/Container/Container.tsx
	•	Role: Centers and constrains content width.
	•	Props:
	•	Likely size or maxWidth variants ("normal", "wide", etc.); confirm implementation.
	•	Rule: Use for any page section that needs consistent horizontal rhythm.

Section
	•	Path: layout/Section/Section.tsx
	•	Role: Vertical section wrapper with padding, background, etc.
	•	Props:
	•	Likely variant and id/anchor style.
	•	Rule: Wrap major page blocks like case study sections.

Stack
	•	Path: layout/Stack/Stack.tsx
	•	Role: Stacked layout utility (vertical spacing between children).
	•	Props:
	•	gap or spacing prop controlling vertical rhythm.

GlobalComposer (LEGACY AI)
	•	Path: layout/GlobalComposer.tsx
	•	Role: Old global composer entry for AI interactions.
	•	Status:
	•	LEGACY / to be deprecated once the AI modal is fully implemented.
	•	Cursor must not create new usages.
	•	It may be removed/stripped as part of migration to AI modal.

⸻

3. Media (src/components/media)

MediaImage
	•	Path: media/MediaImage.tsx
	•	Role: Specialized media component for page imagery.
	•	Props: see implementation (likely extends ImageContainer).

⸻

4. Molecules (src/components/molecules)

Composed of atoms; small, reusable building blocks.

4.1 Content & Layout

Card
	•	Path: molecules/Card/Card.tsx
	•	Role: General-purpose card pattern (border, padding, shadow).
	•	Use in contexts where a generic card look is needed (NOT project cards).

ContentBlock
	•	Path: molecules/ContentBlock/ContentBlock.tsx
	•	Role: A block of content containing a headline and multiple items.
	•	Props (from Cursor feedback + code):
	•	headline: string
	•	items: ContentBlockItem[]
	•	headlineVariant?
	•	headlineClassName?
	•	eyebrowClassName?
	•	bodyClassName?
	•	itemGap?
	•	Rule:
	•	Do NOT simplify this to a single body string.
	•	Always pass an items array.
	•	Variants and className props are used for different layouts.

⸻

4.2 Forms

Composer (LEGACY)
	•	Path: molecules/Composer/Composer.tsx
	•	Role: Older inline composer used in earlier AI experiments.
	•	Status:
	•	LEGACY / to be deprecated in favor of the new AI modal + AiComposer.
	•	Cursor must NOT add new usages.

FormField
	•	Path: molecules/FormField/FormField.tsx
	•	Role: Label + input + error/warning/help text group.

InputWithButton
	•	Path: molecules/InputWithButton/InputWithButton.tsx
	•	Role: Text input plus button on the right (e.g. email capture).

TextareaWithButton
	•	Path: molecules/TextareaWithButton/TextareaWithButton.tsx
	•	Role: Multi-line input + submit button.

⸻

4.3 Media Molecules

MediaCard
	•	Path: molecules/MediaCard/MediaCard.tsx
	•	Role: Card layout that features an image/media block + text.

MediaFigure
	•	Path: molecules/MediaFigure/MediaFigure.tsx
	•	Role: Single media + caption figure.

MediaGallery
	•	Path: molecules/MediaGallery/MediaGallery.tsx
	•	Role: Grid/strip of multiple media items.

SideBySideMedia
	•	Path: molecules/SideBySideMedia/SideBySideMedia.tsx
	•	Role: Side-by-side media arrangement.

⸻

4.4 Navigation & Project Cards

NavItem
	•	Path: molecules/NavItem/NavItem.tsx
	•	Role: Individual navigation item used in Header.

ProjectCard
	•	Path: molecules/ProjectCard/ProjectCard.tsx
	•	Role: Project tile card for home/work pages.
	•	Props:
	•	Likely project name, client, type, etc.

ProjectCardGrid
	•	Path: molecules/ProjectCardGrid/ProjectCardGrid.tsx
	•	Role: Grid layout for multiple ProjectCards.
	•	This is effectively the WorkGrid concept.

⸻

5. Page Components (src/components/page-components)

Higher-level page-specific organisms.

Header
	•	Path: page-components/Header/Header.tsx
	•	Role: Site header; uses NavItem and layout primitives.
	•	This is what was previously referred to as SiteHeader.

Footer
	•	Path: page-components/Footer/Footer.tsx
	•	Role: Site footer; previously SiteFooter.

ContentSection
	•	Path: page-components/ContentSection/ContentSection.tsx
	•	Role: Core case study section organism with many variants.

Props (condensed from Cursor feedback):

{
  variant: 
    | "default"
    | "full-width"
    | "2-column-split"
    | "2-column-image-right"
    | "2-column-image-left"
    | "card-gallery"
    | "text-with-image"
    | "annotated-visual"
    | "half-and-half-column"
    | "timeline";

  imageSrc?: string;
  imageAlt?: string;

  leftImageSrc?: string;
  rightImageSrc?: string;

  contentBlocks?: ContentBlockData[];
  galleryImages?: ImageData[];
  annotations?: AnnotationData[];
  timelineItems?: TimelineItem[];

  projectDetails?: ProjectDetails;

  sectionVariant?: string;
  containerSize?: string;

  sectionImageSrc?: string;
  projectSlug?: string;
  sectionIndex?: number;
}

	•	Rule:
	•	Do not “simplify” ContentSection down to just eyebrow, headline, body.
	•	Always respect the variants and prop structure.
	•	New variants must be added both to this doc and to page-components/ContentSection/variants.

ContentSection Variants

Located at: page-components/ContentSection/variants/:
	•	AnnotatedVisual.tsx
	•	CardGallery.tsx
	•	DefaultSection.tsx
	•	FullWidth.tsx
	•	HalfAndHalfColumn.tsx
	•	TextWithImage.tsx
	•	Timeline.tsx
	•	TwoColumnImage.tsx

Each variant has its own layout rules. Cursor must NOT create new variant files without updating this doc.

AnswerBlock
	•	Path: page-components/AnswerBlock/AnswerBlock.tsx
	•	Role: Displays AI-generated answers on page (legacy inline approach).
	•	Status:
	•	Likely LEGACY once AI modal is canonical.
	•	New work should favor the modal over on-page AnswerBlock injection, unless explicitly allowed.

⸻

6. Templates (src/components/templates)

CaseStudyHero
	•	Path: templates/CaseStudyHero.tsx
	•	Role: Standardized case study hero (client, project name, role, year, etc.).
	•	This replaces the generic “Hero” concept from earlier docs.

⸻

7. UI (shadcn primitives) (src/components/ui)

These are shadcn/ui wrappers and should generally not be used directly in page-level components; prefer atoms/molecules that wrap them.
	•	accordion.tsx
	•	badge.tsx
	•	button.tsx
	•	card.tsx
	•	dialog.tsx
	•	input.tsx
	•	separator.tsx
	•	tabs.tsx
	•	textarea.tsx
	•	TypingIndicator.tsx

TypingIndicator.tsx
	•	Role: Visual indicator used for AI thinking/typing states (can be reused in AI modal).

⸻

8. Utility Components (src/components/utility)

Divider
	•	Path: utility/Divider/Divider.tsx
	•	Role: Visual separator line.

Spacer
	•	Path: utility/Spacer/Spacer.tsx
	•	Role: Adjustable spacing / empty block.

AIIndicator
	•	Path: utility/AIIndicator/AIIndicator.tsx
	•	Role: Visual badge/icon to indicate AI-generated content.

Renderer
	•	Path: utility/Renderer/Renderer.tsx
	•	Role: Renders structured layouts from orchestrator output.
	•	Important: This is for orchestrated layouts (case studies, etc.), not for AI modal responses.

⸻

9. AI Components (Existing, Legacy vs New)

9.1 Existing AI Components (src/components/ai)

AIAnswerContext
	•	Context provider for AI answers.
	•	Status: LEGACY; used by early inline-answer experiments.

QuestionComposer
	•	Inline question composer used in older pattern.
	•	Status: LEGACY. Replaced by AI Modal + AiComposer conceptually.
	•	Cursor must not add new usages.

SectionAIAnswer
	•	Inline section-level AI answer renderer.
	•	Status: LEGACY under the new modal architecture.

SectionContext
	•	Context for per-section AI behavior.
	•	Status: Likely LEGACY with the move to a centralized AI modal.

Migration Rule:
All of the above AI components are candidates for removal once the AI modal is implemented and validated. Cursor may:
	•	Remove usages
	•	Simplify/strip them
	•	But MUST NOT create new usages or expand them.

⸻

9.2 New AI Modal Components (TO BE CREATED)

These components do not exist yet but are the canonical target design for the new experience described in architecture.md.

Cursor is allowed to create these NEW components, once, in the appropriate folders, following the folder/file/test pattern and using existing tokens.

AiModal (Organism)
	•	New path (proposed): components/ai-modal/AiModal.tsx or components/organisms/AiModal/AiModal.tsx
	•	Role: Full-screen overlay with blur + card + conversation + actions + composer.
	•	Controlled by the AI modal state machine.

AiModalCard (Organism / large molecule)
	•	Encapsulates:
	•	Headline
	•	Conversation rows
	•	Actions row
	•	Composer

AiConversationRow (Molecule)
	•	Displays:
	•	Eyebrow: “User” or “AI”
	•	Body: message text

AiActionsRow (Molecule)
	•	Renders a row/grid of action buttons (navigate / scroll / deep_dive).

AiComposer (Molecule)
	•	Modal’s bottom input.
	•	Props (must be defined when implemented):

{
  disabled: boolean;
  onSubmit: (text: string) => void;
  placeholder?: string;
}

AskAiPill (Molecule)
	•	Floating pill that appears near selected text.
	•	Props:

{
  visible: boolean;
  position: { x: number; y: number };
  onClick: () => void;
}

Important:
	•	New AI modal components must not conflict with existing QuestionComposer, Composer, SectionAIAnswer, etc.
	•	They represent the new architecture: AI lives in the modal, not in-line.

⸻

10. Testing Requirements (Jest + Storybook)

For every new component or significant change:
	1.	Stories
	•	Add or update .stories.tsx.
	•	Use realistic props and states (loading, error, long content).
	2.	Tests
	•	Add Jest tests (snapshot + behavioral).
	•	For AI-related components, test:
	•	Render in each state (IDLE, THINKING, ANSWER_SHOWING, etc.)
	•	Buttons/fire events call the right callbacks.
	3.	Run tests before moving to the next step
	•	Use existing test commands (npm test, npm run test, or project’s configured script).
	4.	No new components without tests.

⸻

11. Styling Rules
	•	Use existing design tokens for:
	•	spacing, radii, color, typography, motion.
	•	Use responsive Tailwind classes (sm:, md:, lg:, xl:) whenever layout needs to adapt.
	•	When Tailwind scales are insufficient and raw CSS is needed:
	•	Use rem units.
	•	Avoid px except for things like borders and hairlines.