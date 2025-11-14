import * as React from "react";
import { cn } from "@/lib/utils";

export interface MetricProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string;
  variant?: "default" | "positive";
  icon?: React.ReactNode;
}

const Metric = React.forwardRef<HTMLDivElement, MetricProps>(
  ({ label, value, variant = "default", icon, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-row items-center gap-3", className)}
        {...props}
      >
        {icon && <div className="flex-shrink-0">{icon}</div>}
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-text-muted">
          {label}
        </span>
        <span
          className={cn("text-2xl md:text-3xl font-medium", {
            "text-text-default": variant === "default",
            "text-state-success": variant === "positive",
          })}
        >
          {value}
        </span>
      </div>
    );
  }
);

Metric.displayName = "Metric";

export { Metric };

