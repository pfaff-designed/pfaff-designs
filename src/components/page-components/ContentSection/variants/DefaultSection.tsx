import * as React from "react";
import { ContentBlock, type ContentBlockItem } from "@/components/molecules/ContentBlock";
import { ImageContainer } from "@/components/atoms/ImageContainer";

export interface DefaultSectionProps {
  headline?: string;
  body?: string;
  eyebrow?: string;
  imageSrc?: string;
  imageAlt?: string;
  contentBlocks?: Array<{
    eyebrow?: string;
    body: string;
    richText?: boolean;
  }>;
}

export const DefaultSection: React.FC<DefaultSectionProps> = ({
  headline,
  body,
  eyebrow,
  imageSrc,
  imageAlt = "",
  contentBlocks,
}) => {
  // Convert contentBlocks to ContentBlockItem format
  const contentBlockItems: ContentBlockItem[] = contentBlocks
    ? contentBlocks.map((block) => ({
        eyebrow: block.eyebrow,
        body: block.body,
        richText: block.richText,
      }))
    : body
    ? [
        {
          eyebrow: eyebrow,
          body: body,
          richText: false,
        },
      ]
    : [];

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Content Blocks */}
      {contentBlockItems.length > 0 && (
        <div className="w-full mt-[1.5rem] max-w-[33.625rem]">
          <ContentBlock
            headline={headline || ""}
            items={contentBlockItems}
            headlineVariant="display"
            className="max-w-none"
            headlineClassName={headline ? "mb-0 text-[4rem] leading-[4.5rem] tracking-[0.04em] uppercase text-left w-full" : "hidden"}
            eyebrowClassName="w-full md:w-[7.25rem]"
            bodyClassName="max-w-[24.25rem]"
          />
        </div>
      )}

      {/* Image Section */}
      {imageSrc && (
        <div className="w-full max-w-[52.5625rem] h-[28.125rem] relative">
          <ImageContainer
            imageSrc={imageSrc}
            alt={imageAlt}
            aspectRatio="landscape"
            containerClassName="w-full h-full"
          />
        </div>
      )}
    </div>
  );
};

