import type { Command } from "./command-types";
import type { CommandContext } from "./command-context";

/**
 * commandRegistry
 * 
 * Complete list of all available commands in the command palette.
 * Commands are organized by kind: navigation, quick AI, deep AI, download, and help.
 */
export const commandRegistry: Command[] = [
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
  {
    id: "nav-capital-one",
    kind: "nav",
    label: "Capital One Travel",
    description: "View the Capital One Travel case study",
    keywords: ["capital one", "capitalone", "travel", "booking"],
    run: (ctx) => {
      ctx.navigate("/work/capital-one-travel");
    },
  },
  {
    id: "nav-pmi",
    kind: "nav",
    label: "PMI Agile Certification",
    description: "View the PMI Agile Certification case study",
    keywords: ["pmi", "agile", "certification", "acp", "project management"],
    run: (ctx) => {
      ctx.navigate("/work/pmi");
    },
  },
  {
    id: "nav-tanger",
    kind: "nav",
    label: "Tanger Outlets",
    description: "View the Tanger Outlets case study",
    keywords: ["tanger", "outlets", "retail", "shopping"],
    run: (ctx) => {
      ctx.navigate("/work/tanger-outlets");
    },
  },
  {
    id: "nav-coke",
    kind: "nav",
    label: "Coca-Cola Creative Technology",
    description: "View the Coca-Cola Creative Technology case study",
    keywords: ["coca cola", "coke", "coca-cola", "creative", "technology", "ai", "vending"],
    run: (ctx) => {
      ctx.navigate("/work/coca-cola-creative-technology");
    },
  },
  {
    id: "nav-pfaff-designs",
    kind: "nav",
    label: "Pfaff Designs Portfolio",
    description: "View the Pfaff Designs Portfolio case study",
    keywords: ["pfaff", "designs", "portfolio", "generative", "ai portfolio"],
    run: (ctx) => {
      ctx.navigate("/work/pfaff-designs");
    },
  },

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
      if (!ctx.selectionText) return;
      ctx.openInlineChat({
        question: `Summarize this: ${ctx.selectionText}`,
        selectionText: ctx.selectionText,
      });
    },
  },
  {
    id: "ai-quick-summarize-page",
    kind: "ai_quick",
    label: "Summarize this page",
    description: "Get a quick summary of the current page",
    keywords: ["summarize", "summary", "page", "overview", "brief"],
    run: (ctx) => {
      ctx.openInlineChat({
        question: "Summarize this page",
        sectionText: ctx.sectionText,
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
      if (!ctx.selectionText) return;
      ctx.openInlineChat({
        question: `Rewrite this to be clearer: ${ctx.selectionText}`,
        selectionText: ctx.selectionText,
      });
    },
  },

  // ============================================================
  // Deep AI Commands (full modal)
  // ============================================================
  {
    id: "ai-deep-project",
    kind: "ai_deep",
    label: "Ask about this project",
    description: "Open the AI modal to ask questions about the current project",
    keywords: ["ask", "question", "project", "explain", "tell me", "about"],
    visible: (ctx) => !!ctx.projectSlug,
    run: (ctx) => {
      ctx.openAiModal({
        question: "What can you tell me about this project?",
        pagePath: ctx.path,
        projectSlug: ctx.projectSlug ?? null,
        sectionHeadline: ctx.sectionHeadline,
        sectionText: ctx.sectionText,
      });
    },
  },
  {
    id: "ai-deep-cross-project",
    kind: "ai_deep",
    label: "Ask cross-project question",
    description: "Open the AI modal to ask questions across multiple projects",
    keywords: ["cross", "compare", "projects", "multiple", "all projects"],
    run: (ctx) => {
      ctx.openAiModal({
        question: "Compare projects or ask about multiple projects",
        pagePath: ctx.path,
        projectSlug: ctx.projectSlug ?? null,
      });
    },
  },
  {
    id: "ai-deep-explanation",
    kind: "ai_deep",
    label: "Deep explanation",
    description: "Get a detailed explanation about a topic",
    keywords: ["explain", "deep", "detailed", "elaborate", "more", "details"],
    run: (ctx) => {
      ctx.openAiModal({
        question: "Can you provide a detailed explanation?",
        pagePath: ctx.path,
        projectSlug: ctx.projectSlug ?? null,
        sectionHeadline: ctx.sectionHeadline,
        sectionText: ctx.sectionText,
      });
    },
  },

  // ============================================================
  // Download Commands
  // ============================================================
  {
    id: "download-resume",
    kind: "download",
    label: "Download Charles' resume",
    description: "Download Charles Pfaff's resume (PDF)",
    keywords: ["resume", "cv", "pdf", "download", "charles", "pfaff"],
    run: (ctx) => {
      ctx.download("/downloads/charles-pfaff-resume.pdf");
    },
  },

  // ============================================================
  // Help Command
  // ============================================================
  {
    id: "help",
    kind: "help",
    label: "Show available actions",
    description: "Suggestions for navigation, AI actions, and downloads",
    keywords: ["help", "options", "commands", "what", "can", "do"],
    run: (ctx) => {
      console.log("[Command] Help: showing available actions");
      console.log("[Command] Available commands:", commandRegistry.length);
    },
  },
];

