import * as React from "react";
import { ImageContainer } from "@/components/atoms/ImageContainer";
import { BodyText } from "@/components/atoms/BodyText";
import { cn } from "@/lib/utils";

export interface MediaFigureProps {
  imageSrc: string;
  alt: string; // Required
  caption?: string;
  className?: string;
  aspectRatio?: "auto" | "square" | "video" | "portrait" | "landscape" | "wide";
}

/**
 * MediaFigure component
 * Image with optional caption
 */
const MediaFigure = React.forwardRef<HTMLDivElement, MediaFigureProps>(
  ({ imageSrc, alt, caption, className, aspectRatio = "auto" }, ref) => {
    return (
      <figure ref={ref} className={cn("flex flex-col gap-2", className)}>
        <ImageContainer
          imageSrc={imageSrc}
          alt={alt}
          aspectRatio={aspectRatio}
          containerClassName="w-full"
        />
        {caption && (
          <figcaption className="text-sm text-text-muted">
            <BodyText body={caption} />
          </figcaption>
        )}
      </figure>
    );
  }
);

MediaFigure.displayName = "MediaFigure";

export { MediaFigure };

