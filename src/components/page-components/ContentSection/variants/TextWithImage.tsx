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
  return (
    <div className="flex flex-col lg:flex-row items-start justify-between gap-8 w-full max-h-screen">
      {/* Text Content */}
      <div className="flex flex-col gap-6 pt-16 w-full lg:flex-[1] lg:min-w-0 pl-[0.5rem]">
        {eyebrow && <Eyebrow text={eyebrow} />}
        {headline && (
          <Heading
            text={headline}
            variant="display"
          />
        )}
        {body && (
          <div className="w-full">
            <BodyText body={body} />
          </div>
        )}
      </div>

      {/* Image */}
      {imageSrc && (
        <div className="w-full lg:flex-[2] lg:min-w-0 h-screen relative">
          <ImageContainer
            imageSrc={imageSrc}
            alt={imageAlt}
            fill={true}
            containerClassName="absolute inset-0 w-full h-full"
            imageClassName="object-cover"
            sizes="100vw"
          />
        </div>
      )}
    </div>
  );
};

