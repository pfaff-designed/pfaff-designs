import * as React from "react";
import { Heading } from "@/components/atoms/Heading";
import { BodyText } from "@/components/atoms/BodyText";
import { cn } from "@/lib/utils";

export interface ContentBlockItem {
  eyebrow?: string;
  body: string;
}

export interface ContentBlockProps {
  headline: string;
  items: ContentBlockItem[];
  headlineVariant?: "display" | "hero" | "headline" | "subheading" | "h1" | "h2" | "h3";
  headlineClassName?: string;
  eyebrowClassName?: string;
  bodyClassName?: string;
  className?: string;
  itemGap?: string;
}

const ContentBlock = React.forwardRef<HTMLDivElement, ContentBlockProps>(
  (
    {
      headline,
      items,
      headlineVariant = "display",
      headlineClassName,
      eyebrowClassName,
      bodyClassName,
      className,
      itemGap = "gap-6",
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn("flex flex-col gap-[19px] max-w-[33.625rem]", className)}>
        {/* Headline */}
        <Heading
          text={headline}
          variant={headlineVariant}
          className={headlineClassName}
        />

        {/* Items Stack */}
        <div className={cn("flex flex-col", itemGap)}>
          {items.map((item, index) => (
            <div
              key={index}
              className="flex flex-col gap-6 md:flex-row md:gap-6"
            >
              {/* Eyebrow Label */}
              {item.eyebrow && (
                <div
                  className={cn(
                    "flex w-full shrink-0 items-start font-bold text-base leading-5 text-text-default md:w-[116px]",
                    eyebrowClassName
                  )}
                >
                  {item.eyebrow}
                </div>
              )}

              {/* Body Text */}
              <BodyText
                body={item.body}
                className={cn("flex-1 max-w-[388px]", bodyClassName)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }
);

ContentBlock.displayName = "ContentBlock";

export { ContentBlock };

