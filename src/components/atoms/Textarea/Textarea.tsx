import * as React from "react";
import { Textarea as BaseTextarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.ComponentProps<typeof BaseTextarea> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error = false, ...props }, ref) => {
    return (
      <BaseTextarea
        ref={ref}
        className={cn(
          "min-h-[80px] rounded-md border border-[color:var(--text-muted)] bg-[color:var(--bg-default)] px-3 py-2 text-base leading-5 text-[color:var(--text-default)] placeholder:text-[color:var(--text-default)] placeholder:opacity-50 transition-all duration-200 focus-visible:border-2 focus-visible:border-[color:var(--accent-secondary)] focus-visible:outline-none focus-visible:ring-0 disabled:opacity-50",
          error && "border-state-error focus-visible:border-state-error",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };

