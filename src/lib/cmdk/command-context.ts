/**
 * CommandContext
 * 
 * Represents the environment in which commands run.
 * Provides access to current page state, user input, and action handlers.
 * 
 * During Phase 10.1, all actions are stubbed with console.log.
 * Actual wiring happens in Phases 10.2–10.4.
 */
export interface CommandContext {
  // Current state
  input: string; // raw Cmd+K query
  path: string; // current page path
  projectSlug?: string | null;
  selectionText?: string;
  sectionHeadline?: string;
  sectionText?: string;

  // Action handlers (stubbed in Phase 10.1)
  openAiModal: (args: {
    question: string;
    pagePath?: string;
    projectSlug?: string | null;
    sectionHeadline?: string;
    sectionText?: string;
  }) => void;

  openInlineChat: (args: {
    question: string;
    selectionText?: string;
    sectionText?: string;
  }) => void;

  navigate: (path: string) => void;
  download: (path: string) => void;
}

/**
 * createCommandContext
 * 
 * Factory function to create a CommandContext with stubbed actions.
 * Used during Phase 10.1 for testing and development.
 * 
 * In Phase 10.2+, this will be replaced with real implementations.
 */
export function createCommandContext(
  input: string,
  path: string,
  options?: {
    projectSlug?: string | null;
    selectionText?: string;
    sectionHeadline?: string;
    sectionText?: string;
    openInlineChat?: (args: {
      question: string;
      selectionText?: string;
      sectionText?: string;
    }) => void;
    openAiModal?: (args: {
      question: string;
      pagePath?: string;
      projectSlug?: string | null;
      sectionHeadline?: string;
      sectionText?: string;
    }) => void;
    navigate?: (path: string) => void;
    download?: (path: string) => void;
  }
): CommandContext {
  return {
    input,
    path,
    projectSlug: options?.projectSlug ?? null,
    selectionText: options?.selectionText,
    sectionHeadline: options?.sectionHeadline,
    sectionText: options?.sectionText,

    // Use provided openAiModal or stub
    openAiModal: options?.openAiModal ?? (() => {
      // Stub implementation
    }),

    // Use provided openInlineChat or stub
    openInlineChat: options?.openInlineChat ?? (() => {
      // Stub implementation
    }),

    // Use provided navigate or stub
    navigate: options?.navigate ?? (() => {
      // Stub implementation
    }),

    // Use provided download or stub
    download: options?.download ?? (() => {
      // Stub implementation
    }),
  };
}

