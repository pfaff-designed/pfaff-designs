import * as React from "react";
import { cn } from "@/lib/utils";

export interface BodyTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  body: string;
  variant?: "default" | "muted" | "small";
}

const BodyText = React.forwardRef<HTMLParagraphElement, BodyTextProps>(
  ({ body, variant = "default", className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn(
          "text-left font-normal leading-[1.5]",
          {
            "text-base text-text-default": variant === "default",
            "text-base text-text-muted": variant === "muted",
            "text-sm text-text-default": variant === "small",
          },
          className
        )}
        {...props}
      >
        {body}
      </p>
    );
  }
);

BodyText.displayName = "BodyText";

export { BodyText };

