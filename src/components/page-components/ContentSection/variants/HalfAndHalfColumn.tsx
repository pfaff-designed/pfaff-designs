import * as React from "react";
import { BodyText } from "@/components/atoms/BodyText";
import { ImageContainer } from "@/components/atoms/ImageContainer";

export interface HalfAndHalfColumnProps {
  leftImageUrl?: string;
  leftImageAlt?: string;
  leftLabel?: string;
  leftContent?: string;
  rightImageUrl?: string;
  rightImageAlt?: string;
  rightLabel?: string;
  rightContent?: string;
}

export const HalfAndHalfColumn: React.FC<HalfAndHalfColumnProps> = ({
  leftImageUrl,
  leftImageAlt = "",
  leftLabel,
  leftContent,
  rightImageUrl,
  rightImageAlt = "",
  rightLabel,
  rightContent,
}) => {
  return (
    <div className="flex flex-col lg:flex-row items-center gap-6 w-full">
      {/* Left Column */}
      <div className="flex flex-col gap-6 w-full lg:flex-1 lg:min-w-0">
        {/* Image */}
        {leftImageUrl && (
          <div className="h-[40.5625rem] w-full relative">
            <ImageContainer
              imageSrc={leftImageUrl}
              alt={leftImageAlt}
              fill={true}
              containerClassName="absolute inset-0 w-full h-full"
              imageClassName="object-cover"
            />
          </div>
        )}
        {/* Text Content */}
        {(leftLabel || leftContent) && (
          <div className="flex gap-6 items-start w-full">
            {leftLabel && (
              <p className="font-medium text-[1.3125rem] leading-[1.75rem] tracking-[-0.02625rem] text-[#26291d] w-[7.3125rem] shrink-0">
                {leftLabel}
              </p>
            )}
            {leftContent && (
              <div className="flex-1">
                <BodyText body={leftContent} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-6 w-full lg:flex-1 lg:min-w-0">
        {/* Image */}
        {rightImageUrl && (
          <div className="h-[40.5625rem] w-full relative">
            <ImageContainer
              imageSrc={rightImageUrl}
              alt={rightImageAlt}
              fill={true}
              containerClassName="absolute inset-0 w-full h-full"
              imageClassName="object-cover"
            />
          </div>
        )}
        {/* Text Content */}
        {(rightLabel || rightContent) && (
          <div className="flex gap-6 items-start w-full">
            {rightLabel && (
              <p className="font-medium text-[1.3125rem] leading-[1.75rem] tracking-[-0.02625rem] text-[#26291d] w-[7.3125rem] shrink-0">
                {rightLabel}
              </p>
            )}
            {rightContent && (
              <div className="flex-1">
                <BodyText body={rightContent} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

