import * as React from "react";
import { cn } from "@/lib/utils";

export interface AskAiPillProps {
  x: number; // viewport x (px)
  y: number; // viewport y (px)
  onClick: () => void;
  isVisible?: boolean; // controls fade + scale animation
  isMobile?: boolean; // adds slide-down on mobile
}

/**
 * AskAiPill
 * 
 * A small, floating pill that appears near text selections.
 * When clicked, triggers the AI modal with the selected text as context.
 * 
 * - Position: fixed (viewport coordinates)
 * - Editorial minimal styling with fade + scale transitions
 * - Does not manage modal state directly
 * 
 * Motion:
 * - Desktop: fade + scale-in (150ms)
 * - Mobile: fade + scale-in + slide-down (200ms)
 */
export function AskAiPill({ x, y, onClick, isVisible = true, isMobile = false }: AskAiPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={(e) => {
        e.preventDefault(); // Prevent selection from clearing
        e.stopPropagation(); // Prevent window listener from hiding pill
      }}
      style={{ left: x, top: y }}
      className={cn(
        "fixed z-[10000] px-3 py-1.5",
        "text-[10px] leading-tight tracking-[0.16em] uppercase",
        "bg-[color:var(--accent-primary)] text-[color:var(--bg-default)]",
        "rounded-full whitespace-nowrap pointer-events-auto",
        // Desktop: fade + scale (quick and subtle)
        !isMobile && "transition-all duration-100 ease-out",
        !isMobile && (isVisible ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"),
        // Mobile: fade + scale + slide-down
        isMobile && "transition-all duration-150 ease-out",
        isMobile && (isVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-[0.98] -translate-y-1")
      )}
    >
      Ask AI
    </button>
  );
}

AskAiPill.displayName = "AskAiPill";

