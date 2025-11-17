import * as React from "react";
import { cn } from "@/lib/utils";

export interface BodyTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  body: string;
  variant?: "default" | "muted" | "small";
  richText?: boolean;
}

const BodyText = React.forwardRef<HTMLParagraphElement, BodyTextProps>(
  ({ body, variant = "default", richText = false, className, ...props }, ref) => {
    const baseClasses = cn(
      "text-left font-normal leading-[1.5]",
      {
        "text-base text-text-default": variant === "default",
        "text-base text-text-muted": variant === "muted",
        "text-sm text-text-default": variant === "small",
      },
      className
    );

    if (richText) {
      return (
        <div
          ref={ref as React.Ref<HTMLDivElement>}
          className={baseClasses}
          dangerouslySetInnerHTML={{ __html: body }}
          {...(props as React.HTMLAttributes<HTMLDivElement>)}
        />
      );
    }

    return (
      <p
        ref={ref}
        className={baseClasses}
        {...props}
      >
        {body}
      </p>
    );
  }
);

BodyText.displayName = "BodyText";

export { BodyText };

