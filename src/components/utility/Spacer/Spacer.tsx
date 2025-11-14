import * as React from "react";
import { cn } from "@/lib/utils";

export interface SpacerProps extends React.HTMLAttributes<HTMLDivElement> {
  // Modular spacing: 12, 24, 36, 48, 72, 96, 144px
  size?: 3 | 6 | 9 | 12 | 18 | 24 | 36;
}

const sizeMap: Record<number, string> = {
  3: "h-3", // 12px
  6: "h-6", // 24px
  9: "h-9", // 36px
  12: "h-12", // 48px
  18: "h-18", // 72px
  24: "h-24", // 96px
  36: "h-36", // 144px
};

const Spacer = React.forwardRef<HTMLDivElement, SpacerProps>(
  ({ size = 12, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("w-full", sizeMap[size], className)}
        {...props}
        aria-hidden="true"
      />
    );
  }
);

Spacer.displayName = "Spacer";

export { Spacer };

