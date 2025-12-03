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
      items: body ? [{ body }] : [],
      headlineVariant: "headline" as const,
    }
  ] : [];

  const imageContainer = imageSrc ? (
    <ImageContainer
      imageSrc={imageSrc}
      alt={imageAlt}
      aspectRatio={imageAspectRatio || (imageOnRight ? "portrait" : "landscape")}
      objectFit={imageObjectFit}
    />
  ) : null;

  const imageComponent = imageSrc && (
    <div className={cn("flex-1 shrink-0", imageAspectRatio === "auto" && "min-h-[20rem]")}>
      {imageLightbox ? (
        <ImageLightbox imageSrc={imageSrc} imageAlt={imageAlt}>
          {imageContainer}
        </ImageLightbox>
      ) : (
        imageContainer
      )}
    </div>
  );

  const contentComponent = (
    <div
      className={`flex-1 ${imageOnRight ? "pb-[6.625rem] pt-[2.1875rem]" : ""}`}
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

  const containerClasses = imageOnRight
    ? "flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-center"
    : "flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-center";

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

