import * as React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { validateSupabaseURL } from "@/lib/utils/urlValidation";

export interface ImageContainerProps {
  imageSrc?: string;
  alt: string; // Required per architecture
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
      alt,
      fill = true,
      width,
      height,
      priority = false,
      sizes = "100vw",
      objectFit = "cover",
    },
    ref
  ) => {
    // Enforce alt text requirement
    if (!alt || alt.trim() === "") {
      console.error("ImageContainer: alt text is required for accessibility");
      return (
        <div className={cn("p-4 border border-red-300 bg-red-50 rounded", containerClassName)}>
          <p className="text-sm text-red-800">Image missing required alt text.</p>
        </div>
      );
    }

    // Validate URL if provided
    if (imageSrc && !validateSupabaseURL(imageSrc)) {
      console.error(`Invalid image URL: ${imageSrc}. Only Supabase URLs are allowed.`);
      return (
        <div className={cn("p-4 border border-red-300 bg-red-50 rounded", containerClassName)}>
          <p className="text-sm text-red-800">Invalid image URL. Only Supabase URLs are allowed.</p>
        </div>
      );
    }

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
            alt={alt}
            fill
            className={cn(objectFitClass, imageClassName)}
            sizes={sizes || "100vw"}
            priority={priority}
            loading={priority ? undefined : "lazy"}
          />
        ) : (
          <Image
            src={finalImageSrc}
            alt={alt}
            width={width || 800}
            height={height || 600}
            className={cn(objectFitClass, "w-full h-auto", imageClassName)}
            priority={priority}
            loading={priority ? undefined : "lazy"}
          />
        )}
      </div>
    );
  }
);

ImageContainer.displayName = "ImageContainer";

export { ImageContainer };

