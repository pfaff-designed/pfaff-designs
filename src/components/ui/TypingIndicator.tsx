import * as React from "react";
import { cn } from "@/lib/utils";

export interface TypingIndicatorProps {
  label?: string;
  className?: string;
}

const TypingIndicator = React.forwardRef<HTMLDivElement, TypingIndicatorProps>(
  ({ label = "Thinking…", className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2", className)}
        role="status"
        aria-label={label}
      >
        <span className="text-base leading-5 text-[#26291d]">{label}</span>
        <div className="flex items-center gap-1">
          <div
            className="w-1.5 h-1.5 bg-[#26291d] rounded-full animate-typing-dot"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-1.5 h-1.5 bg-[#26291d] rounded-full animate-typing-dot"
            style={{ animationDelay: "200ms" }}
          />
          <div
            className="w-1.5 h-1.5 bg-[#26291d] rounded-full animate-typing-dot"
            style={{ animationDelay: "400ms" }}
          />
        </div>
      </div>
    );
  }
);

TypingIndicator.displayName = "TypingIndicator";

export { TypingIndicator };

