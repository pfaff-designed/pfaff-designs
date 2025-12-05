import type { Command } from "./command-types";
import type { CommandContext } from "./command-context";
import { caseStudies } from "@/lib/caseStudies/data";

/**
 * commandRegistry
 * 
 * Complete list of all available commands in the command palette.
 * Commands are organized by kind: navigation, quick AI, deep AI, download, and help.
 */
export const commandRegistry: Command[] = [
  // ============================================================
  // CTA Commands (appear first)
  // ============================================================
  {
    id: "nav-contact",
    kind: "nav",
    label: "Contact",
    description: "Navigate to the contact page",
    keywords: ["contact", "reach", "get in touch", "email", "message"],
    run: (ctx) => {
      ctx.navigate("/contact");
    },
  },

  // ============================================================
  // Navigation Commands
  // ============================================================
  {
    id: "nav-home",
    kind: "nav",
    label: "Go to Home",
    description: "Navigate to the home page",
    keywords: ["home", "index", "start", "main"],
    run: (ctx) => {
      ctx.navigate("/");
    },
  },
  {
    id: "nav-work",
    kind: "nav",
    label: "Go to Work",
    description: "Navigate to the work page",
    keywords: ["work", "projects", "case studies", "portfolio"],
    run: (ctx) => {
      ctx.navigate("/work");
    },
  },
  // Dynamically generate case study navigation commands
  ...caseStudies
    .filter((study) => study.slug !== "tanger-outlets" && study.slug !== "real-estate-platform") // Exclude Tanger (blocked) and Real Estate Platform (not released)
    .map((study) => {
      // Generate keywords from slug, client, and project name
      const slugKeywords = study.slug.split("-");
      const keywords = [
        ...slugKeywords,
        study.client.toLowerCase(),
        study.projectName.toLowerCase(),
      ];
      
      // Add specific keywords for known case studies
      if (study.slug === "coca-cola-creative-technology") {
        keywords.push("coke", "coca cola", "coca-cola", "creative", "technology", "ai", "vending");
      } else if (study.slug === "capital-one-travel") {
        keywords.push("capital one", "capitalone", "travel", "booking");
      } else if (study.slug === "pmi") {
        keywords.push("agile", "certification", "acp", "project management");
      } else if (study.slug === "pfaff-designs") {
        keywords.push("pfaff", "designs", "portfolio", "generative", "ai portfolio", "pfaff.design");
      }
      
      // Use custom label for specific case studies
      let label = study.projectName;
      if (study.slug === "coca-cola-creative-technology") {
        label = "Coke";
      }
      
      return {
        id: `nav-${study.slug}`,
        kind: "nav" as const,
        label: label,
        description: `View the ${study.projectName} case study`,
        keywords: keywords.filter((k) => k.length > 0),
        run: (ctx: CommandContext) => {
          ctx.navigate(`/work/${study.slug}`);
        },
      };
    }),

  // ============================================================
  // Quick AI Commands (inline chat)
  // ============================================================
  {
    id: "ai-quick-summarize-selection",
    kind: "ai_quick",
    label: "Summarize selected text",
    description: "Get a quick summary of the selected text",
    keywords: ["summarize", "summary", "brief", "explain", "selected", "selection"],
    visible: (ctx) => !!ctx.selectionText && ctx.selectionText.trim().length > 0,
    run: (ctx) => {
      ctx.openInlineChat({
        question: ctx.input || "Summarize this selection in plain language.",
        selectionText: ctx.selectionText,
      });
    },
  },
  {
    id: "ai-quick-rewrite-selection",
    kind: "ai_quick",
    label: "Rewrite selection to be clearer",
    description: "Rewrite the selected text to be clearer and more concise",
    keywords: ["rewrite", "clarify", "clean", "simplify", "improve", "selected", "selection"],
    visible: (ctx) => !!ctx.selectionText && ctx.selectionText.trim().length > 0,
    run: (ctx) => {
      ctx.openInlineChat({
        question: ctx.input || "Rewrite this to be clearer and less technical, but keep the meaning.",
        selectionText: ctx.selectionText,
      });
    },
  },

  // ============================================================
  // Deep AI Commands (full modal)
  // ============================================================
  {
    id: "ai-deep-project-walkthrough",
    kind: "ai_deep",
    label: "Walk me through this project",
    description: "Get a comprehensive walkthrough of the current project",
    keywords: ["walkthrough", "walk through", "guide", "overview", "project", "full", "complete"],
    visible: (ctx) => !!ctx.projectSlug,
    run: (ctx) => {
      const baseQuestion =
        ctx.input?.trim() ||
        "Give me a deep walkthrough of this project: context, solution, and impact.";
      
      ctx.openAiModal({
        question: baseQuestion,
        // pagePath, projectSlug, etc. are filled in by CommandContext
      });
    },
  },
  {
    id: "ai-deep-cross-project",
    kind: "ai_deep",
    label: "Compare with other projects",
    description: "Compare this project with other work and identify patterns",
    keywords: ["compare", "comparison", "other", "projects", "similar", "patterns", "cross"],
    visible: (ctx) => !!ctx.projectSlug,
    run: (ctx) => {
      const baseQuestion =
        ctx.input?.trim() ||
        "Compare this project with other work Charles has done and note any patterns.";
      
      ctx.openAiModal({
        question: baseQuestion,
        // pagePath, projectSlug, etc. are filled in by CommandContext
      });
    },
  },

  // ============================================================
  // Download Commands
  // ============================================================
  {
    id: "download-resume",
    kind: "download",
    label: "Resume",
    description: "Download Charles Pfaff's resume",
    keywords: ["resume", "cv", "pdf", "download", "charles", "pfaff"],
    run: (ctx) => {
      ctx.download("https://ijwldoqqihdtwegdjjwf.supabase.co/storage/v1/object/sign/Resume/Resume.pages?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9kNmUwN2M2ZS0zYTdlLTQxNzItYjRhOC02Y2FkM2I0ZTA3NmYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJSZXN1bWUvUmVzdW1lLnBhZ2VzIiwiaWF0IjoxNzY0NDY2ODE1LCJleHAiOjE3OTYwMDI4MTV9.VtraXDZwuJfoMUXrAiyJTf78STHs-P-f4f06PMhoCMg");
    },
  },

];

