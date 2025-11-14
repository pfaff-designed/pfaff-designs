import * as React from "react";
import { Input as BaseInput } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<typeof BaseInput> {
  error?: boolean;
  focusOff?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error = false, focusOff = false, ...props }, ref) => {
    return (
      <BaseInput
        ref={ref}
        className={cn(
          "rounded-full border border-slate-300 bg-[#fdf9f4] px-3 py-2 text-base leading-5 text-[#26291d] placeholder:text-[#26291d] placeholder:opacity-50 transition-all duration-200 disabled:opacity-50",
          !focusOff && "focus-visible:border-2 focus-visible:border-[#9ec8d2] focus-visible:outline-none focus-visible:ring-0",
          focusOff && "focus:outline-none focus:ring-0 focus:border-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-0",
          error && "border-state-error focus-visible:border-state-error",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };

