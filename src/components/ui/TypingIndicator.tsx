import * as React from "react";
import { cn } from "@/lib/utils";

export interface TypingIndicatorProps {
  label?: string;
  className?: string;
}

/**
 * TypingIndicator - Shows a subtle text-like ellipsis while AI is thinking
 * 
 * Features:
 * - Three dots styled like text periods with subtle opacity fade
 * - Uses design tokens for colors
 * - Editorial minimalism - looks like natural text ellipsis
 * - Optional label text (defaults to empty for inline use)
 */
const TypingIndicator = React.forwardRef<HTMLDivElement, TypingIndicatorProps>(
  ({ label = "", className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("inline-flex items-baseline gap-0", className)}
        role="status"
        aria-label={label || "AI is thinking"}
      >
        {label && (
          <span className="text-base leading-5 text-[color:var(--text-default)] mr-1">
            {label}
          </span>
        )}
        <span className="text-4xl leading-5 tracking-tight opacity-60">
          <span 
            className="text-[color:var(--text-default)] animate-typing-bounce"
            style={{ animationDelay: "0ms" }}
          >
            .
          </span>
          <span 
            className="text-[color:var(--text-default)] animate-typing-bounce"
            style={{ animationDelay: "150ms" }}
          >
            .
          </span>
          <span 
            className="text-[color:var(--text-default)] animate-typing-bounce"
            style={{ animationDelay: "300ms" }}
          >
            .
          </span>
        </span>
      </div>
    );
  }
);

TypingIndicator.displayName = "TypingIndicator";

export { TypingIndicator };

