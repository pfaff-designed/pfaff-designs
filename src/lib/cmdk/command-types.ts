import type { CommandContext } from "./command-context";

/**
 * CommandKind
 * 
 * Categories of commands in the command palette.
 */
export type CommandKind =
  | "nav"
  | "ai_quick"
  | "ai_deep"
  | "download"
  | "help";

/**
 * Command
 * 
 * Represents a single command in the command palette.
 * Each command has an ID, kind, label, optional description,
 * keywords for matching, optional visibility function, and a run handler.
 */
export interface Command {
  id: string;
  kind: CommandKind;
  label: string;
  description?: string;
  keywords: string[];
  visible?: (ctx: CommandContext) => boolean;
  run: (ctx: CommandContext) => void | Promise<void>;
}

