import * as React from "react";
import { ImageContainer } from "@/components/atoms/ImageContainer";
import { cn } from "@/lib/utils";

export interface SideBySideMediaProps {
  leftImageSrc: string;
  leftAlt: string;
  rightImageSrc: string;
  rightAlt: string;
  className?: string;
  gap?: "sm" | "md" | "lg";
}

const gapClasses = {
  sm: "gap-4",
  md: "gap-6",
  lg: "gap-8",
};

/**
 * SideBySideMedia component
 * Two images displayed side by side
 */
const SideBySideMedia = React.forwardRef<HTMLDivElement, SideBySideMediaProps>(
  ({ leftImageSrc, leftAlt, rightImageSrc, rightAlt, className, gap = "md" }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col md:flex-row w-full", gapClasses[gap], className)}
      >
        <div className="flex-1 min-w-0">
          <ImageContainer imageSrc={leftImageSrc} alt={leftAlt} aspectRatio="landscape" />
        </div>
        <div className="flex-1 min-w-0">
          <ImageContainer imageSrc={rightImageSrc} alt={rightAlt} aspectRatio="landscape" />
        </div>
      </div>
    );
  }
);

SideBySideMedia.displayName = "SideBySideMedia";

export { SideBySideMedia };

