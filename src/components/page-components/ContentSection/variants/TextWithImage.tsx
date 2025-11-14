import * as React from "react";
import { Heading } from "@/components/atoms/Heading";
import { BodyText } from "@/components/atoms/BodyText";
import { ImageContainer } from "@/components/atoms/ImageContainer";

export interface TextWithImageProps {
  headline?: string;
  body?: string;
  imageUrl?: string;
  imageAlt?: string;
}

export const TextWithImage: React.FC<TextWithImageProps> = ({
  headline,
  body,
  imageUrl,
  imageAlt = "",
}) => {
  return (
    <div className="flex flex-col lg:flex-row items-start justify-between gap-8 w-full max-h-screen">
      {/* Text Content */}
      <div className="flex flex-col gap-6 pt-16 w-full lg:flex-[1] lg:min-w-0 pl-[0.5rem]">
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
      {imageUrl && (
        <div className="w-full lg:flex-[2] lg:min-w-0 h-screen relative">
          <ImageContainer
            imageSrc={imageUrl}
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

