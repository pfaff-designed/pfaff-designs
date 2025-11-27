"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useAiModal } from "./AiModalContext";

/**
 * AiKeyboardShortcut
 * 
 * Global component that handles Cmd+K (Mac) / Ctrl+K (Windows/Linux) keyboard shortcut
 * to open the AI modal. Rendered once at the app root level.
 */
export function AiKeyboardShortcut() {
  const { openAiModal } = useAiModal();
  const pathname = usePathname();

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+K on Mac, Ctrl+K on Windows/Linux
      const isModKey = event.metaKey || event.ctrlKey;
      const isK = event.key === "k" || event.key === "K";

      if (isModKey && isK) {
        // Prevent browser default (e.g., Chrome's address bar search)
        event.preventDefault();
        event.stopPropagation();

        // Don't trigger if user is typing in an input/textarea
        const target = event.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }

        // Derive projectSlug from pathname if on a work page
        const projectSlugMatch = pathname?.match(/^\/work\/([^/]+)/);
        let projectSlug: string | undefined;
        if (projectSlugMatch) {
          let slug = projectSlugMatch[1];
          // Normalize PMI paths
          if (slug === "pmi" || slug === "pmi-agile" || slug === "pmi-acp" || slug.startsWith("pmi-")) {
            slug = "pmi";
          }
          projectSlug = slug;
        }

        // Open modal with default question
        openAiModal({
          question: "What can you tell me about this portfolio?",
          pagePath: pathname ?? undefined,
          projectSlug,
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openAiModal, pathname]);

  // This component doesn't render anything
  return null;
}

AiKeyboardShortcut.displayName = "AiKeyboardShortcut";

