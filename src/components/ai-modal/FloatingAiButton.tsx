"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAiModal } from "./AiModalContext";

export interface FloatingAiButtonProps {
  className?: string;
}

/**
 * FloatingAiButton - Mobile-only FAB (Floating Action Button)
 * Appears in bottom-right corner on mobile (< md breakpoint)
 * Opens the AI modal when tapped
 */
export const FloatingAiButton: React.FC<FloatingAiButtonProps> = ({ className }) => {
  const { openGlobal } = useAiModal();

  const handleClick = React.useCallback(() => {
    openGlobal({
      headline: "Ask about this portfolio",
      source: "floating-button",
    });
  }, [openGlobal]);

  return (
    <button
      onClick={handleClick}
      aria-label="Ask AI about this portfolio"
      className={cn(
        // Mobile-only (< md)
        "md:hidden",
        // Fixed positioning - bottom-right with safe-area padding
        "fixed bottom-4 right-4 z-40",
        // Size
        "h-14 w-14",
        // Styling
        "rounded-full",
        "bg-[color:var(--accent-primary)]",
        "text-white",
        // Shadow for depth
        "shadow-lg",
        // Flex centering
        "flex items-center justify-center",
        // Interactions
        "hover:opacity-90 active:scale-95",
        "transition-all duration-200 ease-out",
        // Focus states
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-default)]",
        className
      )}
      style={{
        // Safe area support for notched devices
        bottom: "max(1rem, env(safe-area-inset-bottom))",
        right: "max(1rem, env(safe-area-inset-right))",
      }}
    >
      <Sparkles className="h-6 w-6" strokeWidth={2} />
    </button>
  );
};

