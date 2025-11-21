import * as React from "react";
import { cn } from "@/lib/utils";

export interface HeadingProps extends Omit<React.HTMLAttributes<HTMLHeadingElement>, "children"> {
  text: string;
  variant?: "display" | "hero" | "headline" | "subheading" | "h1" | "h2" | "h3";
  level?: 1 | 2 | 3;
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ text, variant, level, className, ...props }, ref) => {
    const headingVariant = variant || (level === 1 ? "h1" : level === 2 ? "h2" : level === 3 ? "h3" : "h2");
    const htmlLevel = level || (headingVariant === "display" || headingVariant === "hero" || headingVariant === "h1" ? 1 : headingVariant === "headline" || headingVariant === "h2" ? 2 : headingVariant === "subheading" || headingVariant === "h3" ? 3 : 2);

    // Figma specs + Major 4th pattern (1.333) for unspecified variants
    // Display: 64px/72px, Bold, uppercase, tracking 2.56px (mobile: 48px/56px)
    // Hero: 37px/48px, Bold, uppercase, tracking 1.48px (mobile: 28px/36px)
    // Headline: 28px/36px, Bold, tracking -0.28px (mobile: 24px/32px)
    // Subheading: 21px/28px, Medium, tracking -0.42px (mobile: 18px/24px)
    // Using major 4th for h1, h2, h3: 48px, 36px, 27px (with mobile adjustments)
    const variantStyles = {
      display: "text-[3rem] leading-[3.5rem] md:text-[4rem] md:leading-[4.5rem] font-bold uppercase tracking-[2.56px] max-w-[90vw] md:max-w-none",
      hero: "text-[1.75rem] leading-[2.25rem] md:text-[2.3125rem] md:leading-[3rem] font-bold uppercase tracking-[1.48px] max-w-[90vw] md:max-w-none",
      headline: "text-[1.5rem] leading-[2rem] md:text-[1.75rem] md:leading-[2.25rem] font-bold tracking-[-0.28px] max-w-[90vw] md:max-w-none",
      subheading: "text-[1.125rem] leading-[1.5rem] md:text-[1.3125rem] md:leading-[1.75rem] font-medium tracking-[-0.42px] max-w-[90vw] md:max-w-none",
      // Major 4th pattern variants (1.333 ratio)
      h1: "text-[2.5rem] leading-[3rem] md:text-[3rem] md:leading-[3.5rem] font-bold uppercase tracking-[1.92px] max-w-[90vw] md:max-w-none", // mobile: 40px, desktop: 48px
      h2: "text-[1.75rem] leading-[2.25rem] md:text-[2.25rem] md:leading-[2.75rem] font-bold tracking-[0.72px] max-w-[90vw] md:max-w-none", // mobile: 28px, desktop: 36px
      h3: "text-[1.375rem] leading-[1.75rem] md:text-[1.6875rem] md:leading-[2rem] font-medium tracking-[-0.54px] max-w-[90vw] md:max-w-none", // mobile: 22px, desktop: 27px
    };

    const baseClasses = cn(
      "text-left text-text-default break-words",
      variantStyles[headingVariant] || variantStyles.h2,
      className
    );

    const headingProps = {
      ref,
      className: baseClasses,
      ...props,
    };

    switch (htmlLevel) {
      case 1:
        return <h1 {...headingProps}>{text}</h1>;
      case 2:
        return <h2 {...headingProps}>{text}</h2>;
      case 3:
        return <h3 {...headingProps}>{text}</h3>;
      default:
        return <h2 {...headingProps}>{text}</h2>;
    }
  }
);

Heading.displayName = "Heading";

export { Heading };

