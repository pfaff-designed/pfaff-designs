import * as React from "react";
import { cn } from "@/lib/utils";

export interface AIIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
}

const AIIndicator = React.forwardRef<HTMLDivElement, AIIndicatorProps>(
  ({ label = "AI‑generated", className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-2 rounded-md border border-border-subtle bg-default-surface px-2 py-1",
          className
        )}
        {...props}
      >
        <span className="h-2 w-2 rounded-full bg-accent-primary" aria-hidden="true" />
        <span className="font-mono text-xs text-text-muted uppercase tracking-wide">
          {label}
        </span>
      </div>
    );
  }
);

AIIndicator.displayName = "AIIndicator";

export { AIIndicator };

