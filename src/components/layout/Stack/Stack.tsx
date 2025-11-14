import * as React from "react";
import { cn } from "@/lib/utils";

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  // Modular spacing preferred: 3 (12px), 6 (24px), 9 (36px), 12 (48px), 18 (72px), 24 (96px)
  // Also supports smaller gaps: 1, 2, 4 for tight spacing
  gap?: 1 | 2 | 3 | 4 | 6 | 9 | 12 | 18 | 24;
  children: React.ReactNode;
}

const gapMap: Record<number, string> = {
  1: "gap-1", // 4px - tight spacing
  2: "gap-2", // 8px - small spacing
  3: "gap-3", // 12px - modular
  4: "gap-4", // 16px - default
  6: "gap-6", // 24px - modular
  9: "gap-9", // 36px - modular
  12: "gap-12", // 48px - modular
  18: "gap-18", // 72px - modular
  24: "gap-24", // 96px - modular
};

const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ gap = 6, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col", gapMap[gap], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Stack.displayName = "Stack";

export { Stack };

