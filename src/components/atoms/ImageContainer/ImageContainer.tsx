import * as React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export interface ImageContainerProps {
  imageSrc?: string;
  alt?: string;
  aspectRatio?: "auto" | "square" | "video" | "portrait" | "landscape" | "wide";
  containerClassName?: string;
  imageClassName?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
}

const aspectRatioClasses = {
  auto: "",
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  landscape: "aspect-[4/3]",
  wide: "aspect-[16/9]",
};

const ImageContainer = React.forwardRef<HTMLDivElement, ImageContainerProps>(
  (
    {
      aspectRatio = "auto",
      containerClassName,
      imageClassName,
      imageSrc,
      alt = "",
      fill = true,
      width,
      height,
      priority = false,
      sizes = "100vw",
      objectFit = "cover",
    },
    ref
  ) => {
    const objectFitClass = `object-${objectFit}`;
    const defaultImageSrc =
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=60";
    const finalImageSrc = imageSrc || defaultImageSrc;

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden",
          aspectRatio !== "auto" && aspectRatioClasses[aspectRatio],
          containerClassName
        )}
      >
        {fill ? (
          <Image
            src={finalImageSrc}
            alt={alt || "Image placeholder"}
            fill
            className={cn(objectFitClass, imageClassName)}
            sizes={sizes || "100vw"}
            priority={priority}
          />
        ) : (
          <Image
            src={finalImageSrc}
            alt={alt || "Image placeholder"}
            width={width || 800}
            height={height || 600}
            className={cn(objectFitClass, "w-full h-auto", imageClassName)}
            priority={priority}
          />
        )}
      </div>
    );
  }
);

ImageContainer.displayName = "ImageContainer";

export { ImageContainer };

