import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  variant?: "light" | "dark" | "default";
  children: React.ReactNode;
}

const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ variant = "default", className, children, ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={cn(
          "w-full",
          // Modular spacing: 48px (py-12), 72px (py-18), 96px (py-24)
          "py-12 md:py-18 lg:py-24",
          {
            "bg-default": variant === "default",
            "bg-default-surface": variant === "light",
            "bg-dark text-light": variant === "dark",
          },
          className
        )}
        {...props}
      >
        {children}
      </section>
    );
  }
);

Section.displayName = "Section";

export { Section };

