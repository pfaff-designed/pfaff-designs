import { commandRegistry } from "./command-registry";
import type { CommandContext } from "./command-context";
import type { Command } from "./command-types";

/**
 * filterCommands
 * 
 * Deterministically filters commands based on user input.
 * 
 * Matching logic:
 * 1. Check if command is visible (if visible function exists)
 * 2. Match input against command label and keywords (case-insensitive substring)
 * 3. If no matches, return only the help command
 * 
 * @param input - The raw Cmd+K query string
 * @param ctx - The command context
 * @returns Array of matching commands, or help command if no matches
 */
export function filterCommands(input: string, ctx: CommandContext): Command[] {
  const q = input.toLowerCase().trim();

  // If input is empty, return all visible commands
  if (q.length === 0) {
    return commandRegistry.filter((cmd) => {
      return cmd.visible ? cmd.visible(ctx) : true;
    });
  }

  // Filter commands by visibility and keyword matching
  const matches = commandRegistry.filter((cmd) => {
    // Check visibility first
    const visible = cmd.visible ? cmd.visible(ctx) : true;
    if (!visible) return false;

    // Build searchable haystack from label and keywords
    const haystack = `${cmd.label} ${cmd.keywords.join(" ")} ${cmd.description || ""}`.toLowerCase();

    // Check if query matches (substring search)
    return haystack.includes(q);
  });

  // If we have matches, return them
  if (matches.length > 0) {
    return matches;
  }

  // Fallback: return only the help command
  return commandRegistry.filter((cmd) => cmd.kind === "help");
}

