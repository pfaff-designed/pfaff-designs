import * as React from "react";
import { ContentBlock, type ContentBlockItem } from "@/components/molecules/ContentBlock";
import { ImageContainer } from "@/components/atoms/ImageContainer";

export interface TwoColumnImageProps {
  contentBlocks?: Array<{
    headline: string;
    items: ContentBlockItem[];
    headlineVariant?: "display" | "hero" | "headline" | "subheading" | "h1" | "h2" | "h3";
  }>;
  imageUrl?: string;
  imageAlt?: string;
  imageOnRight?: boolean;
}

export const TwoColumnImage: React.FC<TwoColumnImageProps> = ({
  contentBlocks,
  imageUrl,
  imageAlt = "",
  imageOnRight = true,
}) => {
  const imageComponent = imageUrl && (
    <div className="flex-1 shrink-0">
      <ImageContainer
        imageSrc={imageUrl}
        alt={imageAlt}
        aspectRatio={imageOnRight ? "portrait" : "landscape"}
      />
    </div>
  );

  const contentComponent = (
    <div className={`flex-1 ${imageOnRight ? "pb-[6.625rem] pt-[2.1875rem]" : ""}`}>
      {contentBlocks?.map((block, index) => (
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
    ? "flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-[13.1875rem]"
    : "flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12";

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

