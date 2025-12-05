import * as React from "react";
import { ContentBlock, type ContentBlockItem } from "@/components/molecules/ContentBlock";
import { ImageContainer } from "@/components/atoms/ImageContainer";
import { ImageLightbox } from "@/components/molecules/ImageLightbox";
import { cn } from "@/lib/utils";

export interface TwoColumnImageProps {
  headline?: string;
  body?: string;
  eyebrow?: string;
  imageSrc?: string;
  imageAlt?: string;
  imageOnRight?: boolean;
  imageObjectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  imageAspectRatio?: "auto" | "square" | "video" | "portrait" | "landscape" | "wide";
  imageLightbox?: boolean;
}

export const TwoColumnImage: React.FC<TwoColumnImageProps> = ({
  headline,
  body,
  eyebrow,
  imageSrc,
  imageAlt = "",
  imageOnRight = true,
  imageObjectFit = "cover",
  imageAspectRatio,
  imageLightbox = false,
}) => {
  const topicLabel = headline || "This section";

  // Convert headline/body to contentBlocks format for ContentBlock component
  const contentBlocks: Array<{
    headline: string;
    items: ContentBlockItem[];
    headlineVariant?: "display" | "hero" | "headline" | "subheading" | "h1" | "h2" | "h3";
  }> = headline || body ? [
    {
      headline: headline || "",
      items: body ? [{ eyebrow, body }] : [],
      headlineVariant: "headline" as const,
    }
  ] : [];

  const imageContainer = imageSrc ? (
    <ImageContainer
      imageSrc={imageSrc}
      alt={imageAlt}
      aspectRatio={imageAspectRatio || "portrait"}
      objectFit={imageObjectFit}
      containerClassName={imageAspectRatio === "auto" ? "h-full w-full" : undefined}
    />
  ) : null;

  const imageComponent = imageSrc && (
    <div className={cn("flex-1 shrink-0", imageAspectRatio === "auto" && "flex h-full")}>
      {imageLightbox ? (
        <ImageLightbox imageSrc={imageSrc} imageAlt={imageAlt} className={imageAspectRatio === "auto" ? "h-full w-full flex-1" : "w-full"}>
          {imageContainer}
        </ImageLightbox>
      ) : (
        <div className={imageAspectRatio === "auto" ? "h-full w-full" : "w-full"}>
          {imageContainer}
        </div>
      )}
    </div>
  );

  // Use items-stretch for full height when aspectRatio is auto, otherwise center items
  const shouldStretchImage = imageAspectRatio === "auto";

  const contentComponent = (
    <div
      className={cn("flex-1 flex flex-col", shouldStretchImage ? "justify-start" : "justify-center")}
      data-ai-interactive="content-section"
      data-ai-topic-label={topicLabel}
    >
      {contentBlocks.map((block, index) => (
        <ContentBlock
          key={index}
          headline={block.headline}
          items={block.items}
          headlineVariant={block.headlineVariant}
        />
      ))}
    </div>
  );
  const containerClasses = shouldStretchImage
    ? "flex flex-col gap-8 lg:flex-row lg:items-stretch lg:justify-center"
    : "flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-center";

  return (
    <div className={containerClasses}>
      {imageOnRight ? (
        <>
          {contentComponent}
          {imageComponent}
        </>
      ) : (
        <>
          {imageComponent}
          {contentComponent}
        </>
      )}
    </div>
  );
};

// Export aliases for backward compatibility
export const TwoColumnImageRight = TwoColumnImage;
export const TwoColumnImageLeft: React.FC<TwoColumnImageProps> = (props) => (
  <TwoColumnImage {...props} imageOnRight={false} />
);

