import * as React from "react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface DividerProps extends React.ComponentProps<typeof Separator> {
  tone?: "light" | "dark";
}

const Divider = React.forwardRef<React.ElementRef<typeof Separator>, DividerProps>(
  ({ className, tone = "light", orientation = "horizontal", ...props }, ref) => {
    const colorClass =
      tone === "dark" ? "bg-[rgba(253,249,244,0.16)]" : "bg-[rgba(38,41,29,0.12)]";

    return (
      <Separator
        ref={ref}
        orientation={orientation}
        className={cn(
          "my-9 shrink-0",
          orientation === "horizontal" ? "h-px w-full" : "w-px h-full",
          colorClass,
          className
        )}
        {...props}
      />
    );
  }
);

Divider.displayName = "Divider";

export { Divider };

