"use client";

import * as React from "react";

/**
 * AiKeyboardShortcut
 * 
 * DEPRECATED: Cmd+K now opens the CommandPalette instead of the AI modal.
 * This component is kept for backwards compatibility but no longer handles Cmd+K.
 * The AI modal can still be opened via other UI elements (hover pills, floating button, etc.).
 * 
 * @deprecated Cmd+K behavior moved to CommandPalette in Phase 10.2
 */
export function AiKeyboardShortcut() {
  // Cmd+K is now handled by useCommandPalette hook
  // This component is kept to maintain the export but does nothing
  return null;
}

AiKeyboardShortcut.displayName = "AiKeyboardShortcut";

