import type { CaseStudyPage } from "./types";

/**
 * Case Study Data
 * Static data for case study pages
 */

export const caseStudies: CaseStudyPage[] = [
  {
    slug: "capital-one-travel",
    client: "Capital One",
    projectName: "Capital One Travel",
    url: "https://capitalonetravel.com/",
    timeframe: "2023–2024",
    heroSummary:
      "Capital One Travel is a large-scale booking platform built to help travelers get more value from their rewards. I worked as a front-end engineer through AKQA, building and refining modular React components that supported evolving user flows across search, booking, pricing, offers, and loyalty benefits.",
    roleSummary:
      "Front-End Engineer / Technologist focused on translating detailed design specifications into flexible, maintainable components that strengthened consistency across the platform.",
    sections: [
      {
        id: "overview",
        eyebrow: "Overview",
        heading: "Travel rewards, refined",
        body: "Capital One Travel is a large-scale booking platform built to help travelers get more value from their rewards. The experience spans search, booking, pricing, offers, loyalty benefits, and customer support. Because of the scale of the platform, even small changes require careful engineering, thoughtful UI decisions, and strong coordination across teams.",
      },
      {
        id: "role",
        eyebrow: "Role & Scope",
        heading: "Built to flex",
        body: "I worked as a front-end engineer through AKQA, collaborating with designers, art directors, product owners, and back-end teams. Much of the work centered on translating detailed design specifications into modular components that could support evolving user flows. I focused on delivering components that were flexible, predictable, and easy to reuse so future updates could be implemented without rewriting the UI.",
      },
      {
        id: "tools",
        eyebrow: "Tools & Stack",
        heading: "React + TS + craft",
        body: "I built and refined a series of front-end components using React and TypeScript, working directly with designers to ensure every detail aligned with interaction expectations. The work required strong collaboration skills, responsive layout expertise, and a deep understanding of design system principles to ensure new modules fit cleanly into the existing system.",
      },
      {
        id: "process",
        eyebrow: "Process",
        heading: "Design meets code",
        body: "My workflow started with reviewing design files and validating technical feasibility with the broader team. I collaborated closely with designers to refine spacing, layout, and behavior, and I built modular components that followed Capital One's design system guidelines. After implementation, I worked through design QA, testing, and iteration, supporting cross-browser testing and documenting patterns for other engineers.",
      },
      {
        id: "impact",
        eyebrow: "Impact",
        heading: "Consistency at scale",
        body: "The components I developed became part of updated travel flows, supporting new booking logic, rewards interactions, and UI improvements. The work strengthened consistency across the platform and made it easier for teams to extend the system without rebuilding components from scratch. The project also improved the user experience by clarifying interactions and strengthening visual alignment across the booking journey.",
      },
    ],
  },
];

/**
 * Get a case study by slug
 */
export function getCaseStudyBySlug(slug: string): CaseStudyPage | undefined {
  return caseStudies.find((study) => study.slug === slug);
}

