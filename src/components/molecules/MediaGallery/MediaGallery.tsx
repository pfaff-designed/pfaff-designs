import * as React from "react";
import { ImageContainer } from "@/components/atoms/ImageContainer";
import { cn } from "@/lib/utils";

export interface MediaGalleryItem {
  imageSrc: string;
  alt: string; // Required
  caption?: string;
}

export interface MediaGalleryProps {
  items: MediaGalleryItem[];
  columns?: 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  className?: string;
}

const gapClasses = {
  sm: "gap-4",
  md: "gap-6",
  lg: "gap-8",
};

const columnClasses = {
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
};

/**
 * MediaGallery component
 * Optimized grid layout for multiple images
 * Implements lazy-loading and performance optimizations per architecture
 */
const MediaGallery = React.forwardRef<HTMLDivElement, MediaGalleryProps>(
  ({ items, columns = 3, gap = "md", className }, ref) => {
    // Memoize items to prevent re-renders (client-side memoization per architecture)
    const memoizedItems = React.useMemo(() => items, [items]);

    return (
      <div
        ref={ref}
        className={cn(
          "grid w-full",
          columnClasses[columns],
          gapClasses[gap],
          className
        )}
      >
        {memoizedItems.map((item, index) => (
          <div key={index} className="w-full">
            <ImageContainer
              imageSrc={item.imageSrc}
              alt={item.alt}
              aspectRatio="landscape"
              priority={index < 3} // Prioritize first 3 images
              containerClassName="w-full"
            />
            {item.caption && (
              <p className="mt-2 text-sm text-text-muted">{item.caption}</p>
            )}
          </div>
        ))}
      </div>
    );
  }
);

MediaGallery.displayName = "MediaGallery";

export { MediaGallery };

