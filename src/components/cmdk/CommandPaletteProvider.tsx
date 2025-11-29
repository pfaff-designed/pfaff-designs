"use client";

import * as React from "react";
import { CommandPalette } from "./CommandPalette";
import { useCommandPalette } from "@/lib/cmdk/useCommandPalette";
import { useInlineChat } from "@/lib/inline-chat/useInlineChat";
import { InlineChatWindow } from "@/components/inline-chat";

/**
 * CommandPaletteProvider
 * 
 * Client component wrapper that provides the CommandPalette and InlineChat hooks and renders both.
 * This is needed because layout.tsx is a server component.
 */
export function CommandPaletteProvider() {
  const palette = useCommandPalette();
  const inlineChat = useInlineChat();

  const handleBackToPalette = React.useCallback(() => {
    // Close inline chat
    inlineChat.closeInlineChat();
    // Reopen command palette at the same position (or use the inline chat's anchor position)
    const position = inlineChat.state.anchorPosition;
    palette.openPalette({
      x: position?.x ? position.x - 20 : undefined, // Offset back to original palette position
      y: position?.y ? position.y - 20 : undefined,
    });
  }, [inlineChat, palette]);

  // Handle Cmd+K / Ctrl+K globally
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

        // Check for selected text
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();

        if (selectedText && selectedText.length > 0) {
          // Open inline chat with quoted passage
          const question = `Can you tell me more about this?\n\n"${selectedText}"`;
          
          // Get cursor position for anchoring
          const range = selection?.getRangeAt(0);
          const rect = range?.getBoundingClientRect();
          const position = rect
            ? {
                x: rect.left + rect.width / 2,
                y: rect.bottom + 10, // Position below selection
              }
            : undefined;

          inlineChat.openInlineChat({
            question,
            selectionText: selectedText,
            position,
          });
        } else {
          // No selection - open command palette as normal
          palette.togglePalette();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [palette, inlineChat]);

  return (
    <>
      <CommandPalette palette={palette} inlineChat={inlineChat} />
      <InlineChatWindow
        state={inlineChat.state}
        onClose={inlineChat.closeInlineChat}
        setAnchorPosition={inlineChat.setAnchorPosition}
        onBack={handleBackToPalette}
        onSendFollowUp={inlineChat.sendFollowUp}
      />
    </>
  );
}

