"use client";

import * as React from "react";

export interface UseCommandPaletteReturn {
  isOpen: boolean;
  palettePosition: { x: number; y: number } | null; // frozen when opened
  input: string;
  openPalette: (opts?: { x?: number; y?: number; initialInput?: string }) => void;
  closePalette: () => void;
  togglePalette: () => void;
  setInput: (value: string) => void;
}

/**
 * Hook to manage command palette state and keyboard shortcuts.
 * 
 * The palette position is frozen when opened - it does not follow the cursor.
 * We track mouse position separately (in a ref) to determine where to open,
 * but once opened, the position stays fixed.
 */
export function useCommandPalette(): UseCommandPaletteReturn {
  const [isOpen, setIsOpen] = React.useState(false);
  const [palettePosition, setPalettePosition] = React.useState<{ x: number; y: number } | null>(null);
  const [input, setInput] = React.useState("");

  // Track last mouse position in a ref (doesn't trigger re-renders)
  const lastMousePosition = React.useRef<{ x: number; y: number } | null>(null);

  // Update lastMousePosition on mousemove (no re-renders)
  React.useLayoutEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      lastMousePosition.current = { x: event.clientX, y: event.clientY };
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const openPalette = React.useCallback(
    (opts?: { x?: number; y?: number; initialInput?: string }) => {
      const fallbackX = window.innerWidth / 2;
      const fallbackY = window.innerHeight / 3;
      const fromRef = lastMousePosition.current;

      // Set palette position once (frozen) - use opts, then ref, then fallback
      setPalettePosition({
        x: opts?.x ?? fromRef?.x ?? fallbackX,
        y: opts?.y ?? fromRef?.y ?? fallbackY,
      });

      if (opts?.initialInput !== undefined) {
        setInput(opts.initialInput);
      } else {
        setInput("");
      }

      setIsOpen(true);
    },
    []
  );

  const closePalette = React.useCallback(() => {
    setIsOpen(false);
    setInput("");
    // Keep palettePosition set (it will be reset on next open)
  }, []);

  const togglePalette = React.useCallback(() => {
    if (isOpen) {
      closePalette();
    } else {
      openPalette();
    }
  }, [isOpen, openPalette, closePalette]);

  // Global Cmd+K / Ctrl+K listener
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

        togglePalette();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePalette]);

  return {
    isOpen,
    palettePosition,
    input,
    openPalette,
    closePalette,
    togglePalette,
    setInput,
  };
}

