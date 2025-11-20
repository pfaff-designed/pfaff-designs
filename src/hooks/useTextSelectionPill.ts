import { useState, useEffect, useCallback } from "react";

export interface SelectionPillState {
  isVisible: boolean;
  x: number;
  y: number;
  selectedText: string;
}

export interface UseTextSelectionPillOptions {
  enabled?: boolean; // Allow caller to disable behavior
}

/**
 * useTextSelectionPill
 * 
 * Hook for managing text selection + pill positioning.
 * 
 * - Detects text selection via window.getSelection()
 * - Computes pill position based on selection bounding rect
 * - Hides pill on scroll or outside click
 * - Progressive enhancement: works on desktop + mobile wherever getSelection works
 * 
 * @param options - Configuration options
 * @returns pill state, handlers for mouse events, and manual hide function
 */
export function useTextSelectionPill(
  options?: UseTextSelectionPillOptions
): {
  pill: SelectionPillState;
  handleMouseUp: (event: React.MouseEvent) => void;
  hidePill: () => void;
} {
  const [pill, setPill] = useState<SelectionPillState>({
    isVisible: false,
    x: 0,
    y: 0,
    selectedText: "",
  });

  const enabled = options?.enabled !== false;

  // Hide pill and clear state
  const hidePill = useCallback(() => {
    setPill((prev) => ({
      ...prev,
      isVisible: false,
      selectedText: "",
    }));
  }, []);

  // Handle mouse up to detect selection
  const handleMouseUp = useCallback(
    (event: React.MouseEvent) => {
      if (!enabled) {
        return;
      }

      const selection = window.getSelection();

      // No selection or collapsed selection → hide
      if (!selection || selection.isCollapsed) {
        hidePill();
        return;
      }

      // Get selected text
      const selectedText = selection.toString().trim();

      // Too short → hide
      if (selectedText.length < 3) {
        hidePill();
        return;
      }

      // Get bounding rect of selection
      let rect: DOMRect | undefined;
      try {
        const range = selection.getRangeAt(0);
        rect = range.getBoundingClientRect();
      } catch {
        rect = undefined;
      }

      // No rect or zero-sized → hide
      if (!rect || (rect.width === 0 && rect.height === 0)) {
        hidePill();
        return;
      }

      // Compute pill coordinates (viewport space)
      const x = rect.left + rect.width / 2;
      const y = rect.top - 8; // Slightly above selection

      // Show pill
      setPill({
        isVisible: true,
        x,
        y,
        selectedText,
      });
    },
    [enabled, hidePill]
  );

  // Hide pill on scroll or outside click
  useEffect(() => {
    if (!pill.isVisible) {
      return;
    }

    const handleScrollOrClick = () => {
      hidePill();
    };

    // Attach listeners
    window.addEventListener("scroll", handleScrollOrClick, { passive: true });
    window.addEventListener("mousedown", handleScrollOrClick);

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScrollOrClick);
      window.removeEventListener("mousedown", handleScrollOrClick);
    };
  }, [pill.isVisible, hidePill]);

  return {
    pill,
    handleMouseUp,
    hidePill,
  };
}

