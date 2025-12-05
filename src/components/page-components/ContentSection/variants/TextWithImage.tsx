import * as React from "react";
import { Heading } from "@/components/atoms/Heading";
import { BodyText } from "@/components/atoms/BodyText";
import { Eyebrow } from "@/components/atoms/Eyebrow";
import { ImageContainer } from "@/components/atoms/ImageContainer";

export interface TextWithImageProps {
  headline?: string;
  body?: string;
  eyebrow?: string;
  imageSrc?: string;
  imageAlt?: string;
}

export const TextWithImage: React.FC<TextWithImageProps> = ({
  headline,
  body,
  eyebrow,
  imageSrc,
  imageAlt = "",
}) => {
  const topicLabel = headline || "This section";

  return (
    <div className="flex flex-col lg:flex items-center justify-center w-full min-h-screen">
      {/* Text Content */}
      <div className="flex flex-col mb-80 max-w-6xl gap-40 pt-16 px-6 md:px-8 lg:px-12 w-full lg:flex-shrink-0 lg:justify-center z-10">
        {headline && (
          <Heading
            text={headline}
            variant="display"
            
          />
        )}
        {body && (
          <div
            className="flex flex-col gap-6 md:flex-row md:gap-6 w-full"
            data-ai-interactive="content-section"
            data-ai-topic-label={topicLabel}
          >
            {eyebrow && (
              <div className="flex w-full shrink-0 items-start font-bold text-base leading-5 md:w-[116px] text-[color:var(--text-default)]">
                {eyebrow}
              </div>
            )}
            <BodyText body={body} className="flex-1" />
          </div>
        )}
      </div>

      {/* Image - Full width on desktop, extends to viewport edge */}
      {imageSrc && (
        <div className="w-full lg:w-screen mx-auto lg:flex lg:items-center lg:justify-center">
          <div className="w-full">
            <ImageContainer
              imageSrc={imageSrc}
              alt={imageAlt}
              fill={false}
              width={1920}
              height={1080}
              aspectRatio="auto"
              objectFit="contain"
              containerClassName="w-full"
              imageClassName="w-full h-auto"
              sizes="100vw"
            />
          </div>
        </div>
      )}
    </div>
  );
};

