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
          "min-h-[80px] rounded-md border border-[#c2c0b4] bg-[#fdf9f4] px-3 py-2 text-base leading-5 text-[#26291d] placeholder:text-[#26291d] placeholder:opacity-50 transition-all duration-200 focus-visible:border-2 focus-visible:border-[#9ec8d2] focus-visible:outline-none focus-visible:ring-0 disabled:opacity-50",
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

