import * as React from "react";
import { cn } from "@/lib/utils";

export interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
  text: string;
}

const Eyebrow = React.forwardRef<HTMLSpanElement, EyebrowProps>(
  ({ text, className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "text-xs font-medium uppercase tracking-[0.08em] text-text-muted mb-2 block",
          className
        )}
        {...props}
      >
        {text}
      </span>
    );
  }
);

Eyebrow.displayName = "Eyebrow";

export { Eyebrow };

