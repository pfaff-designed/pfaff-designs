Getting Started: pfaff-designs

You are working in an existing Next.js 14 + TypeScript project located at:

~/Documents/code/pfaff-designs

Do not create a new app. Use the existing repo and follow these steps whenever you need to set up or repair the environment.

⸻

1. Open the Project
	1.	Use this directory as the project root:

    cd ~/Documents/code/pfaff-designs

    	2.	Use the existing package.json and next.config rather than scaffolding new ones.

⸻

2. Install Core Dependencies

If dependencies are missing, add them using npm from the project root.

Runtime dependencies:

npm install \
  @supabase/supabase-js \
  @anthropic-ai/sdk \
  langchain \
  clsx \
  tailwind-merge \
  zod

  Dev dependencies (if any are missing):

npm install -D \
  typescript \
  @types/node \
  @types/react \
  @types/react-dom \
  eslint \
  eslint-config-next \
  prettier \
  tailwindcss \
  postcss \
  autoprefixer \
  @storybook/react \
  @storybook/addon-essentials \
  jest \
  @testing-library/react \
  @testing-library/jest-dom

Keep all installs scoped to this project (no global installs).

⸻

3. Tailwind Setup

The project uses Tailwind CSS with tokens in globals.css.
	1.	Confirm Tailwind config file (tailwind.config.ts or .js) includes the app, components, and stories:

    // tailwind.config.ts or tailwind.config.js
module.exports = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/stories/**/*.{ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      // hook into CSS variables for colors, typography, spacing
    },
  },
  plugins: [],
};

2.	Use src/app/globals.css for:

	•	CSS variables (colors, typography scale, spacing, breakpoints).
	•	Resets and base styles.

	3.	Use Tailwind utility classes inside components instead of new CSS files.

⸻

4. shadcn/ui Setup

The project uses shadcn/ui as the primitive library.
	1.	Initialize shadcn in this project (if not already done):

    npx shadcn-ui@latest init

	•	App Router
	•	TypeScript
	•	Components directory: ./src/components/ui

	2.	When you need primitives, add them via:

    npx shadcn-ui@latest add button card input textarea dialog tabs accordion


	3.	Usage rules:

	•	Always import primitives like:

    import { Button } from "@/components/ui/button";

    	•	Wrap shadcn primitives into atoms and molecules when they become reusable patterns (e.g. PrimaryButton, CardWithEyebrow).

⸻

5. Storybook Setup

The project documents atoms and molecules in Storybook.
	1.	Initialize Storybook for this repo if .storybook does not exist:

    npx storybook@latest init

    	•	Framework: React with TypeScript.
	•	Integrate with Next.js.

	2.	Make sure Storybook loads Tailwind styles. In .storybook/preview.ts (or preview.js):

    import "../src/app/globals.css";

const preview: Preview = {
  parameters: {},
};

export default preview;

	3.	Ensure package.json contains these scripts:

    {
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}

	4.	Storybook rules:

	•	Every atom and molecule should have a *.stories.tsx file.
	•	Use CSF stories that demonstrate key states and variants.

⸻

6. Folder Structure & Atomic Design

Work inside this structure (create subfolders if missing):

src/
  app/
    (Next.js App Router: layouts, pages, route handlers)
  components/
    atoms/
      (buttons, links, text, icons, inputs)
    molecules/
      (card patterns, nav items, list items, form groups)
    organisms/
      (hero sections, footers, nav bars, case-study sections)
    page-components/
      (page-level blocks composed of organisms)
    templates/
      (layout templates used by the Orchestrator JSON)
    ui/
      (shadcn/ui primitives live here)
  lib/
    (utilities, zod schemas, data fetching, client wrappers)
  stories/
    (standalone stories if needed)
  docs/
    (markdown docs for design rules, agents, renderer)

    Rules for dependencies:
	•	Atoms only depend on other atoms and shared utilities.
	•	Molecules depend on atoms.
	•	Organisms depend on molecules and atoms.
	•	Page-components and templates depend on organisms/molecules/atoms.
	•	Do not import high-level components into lower-level ones (no organism → atom import loops).

When adding new UI:
	1.	Check for an existing atom/molecule first.
	2.	If it’s reused in multiple places and composed of several atoms, make it a molecule.
	3.	If it’s a whole section (hero, case-study summary, etc.), make it an organism.

⸻

7. Running the Project

From the project root:
	•	Start the Next app:

    npm run dev

    	•	Start Storybook:

        npm run storybook

        Keep these commands as the primary way to run the project and validate UI and component behavior.
    