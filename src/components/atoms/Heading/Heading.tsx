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
    // Display: 64px/72px, Bold, uppercase, tracking 2.56px
    // Hero: 37px/48px, Bold, uppercase, tracking 1.48px
    // Headline: 28px/36px, Bold, tracking -0.28px
    // Subheading: 21px/28px, Medium, tracking -0.42px
    // Using major 4th for h1, h2, h3: 48px, 36px, 27px
    const variantStyles = {
      display: "text-[64px] leading-[72px] font-bold uppercase tracking-[2.56px]",
      hero: "text-[37px] leading-[48px] font-bold uppercase tracking-[1.48px]",
      headline: "text-[28px] leading-[36px] font-bold tracking-[-0.28px]",
      subheading: "text-[21px] leading-[28px] font-medium tracking-[-0.42px]",
      // Major 4th pattern variants (1.333 ratio)
      h1: "text-[48px] leading-[56px] font-bold uppercase tracking-[1.92px]", // 64/1.333 = 48px
      h2: "text-[36px] leading-[44px] font-bold tracking-[0.72px]", // 48/1.333 = 36px
      h3: "text-[27px] leading-[32px] font-medium tracking-[-0.54px]", // 36/1.333 = 27px
    };

    const baseClasses = cn(
      "text-left text-text-default",
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

