import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <select
        className={cn(
          "flex w-full rounded-xs border bg-default-surface px-3 py-2 text-base font-normal text-text-default ring-offset-default-surface focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-opacity-30 disabled:cursor-not-allowed disabled:opacity-50",
          error
            ? "border-state-error focus-visible:border-state-error focus-visible:ring-state-error"
            : "border-[rgba(38,41,29,0.18)] focus-visible:border-text-default focus-visible:ring-text-default",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Select.displayName = "Select";

export { Select };

