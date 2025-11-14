import * as React from "react";
import { BodyText } from "@/components/atoms/BodyText";
import { ImageContainer } from "@/components/atoms/ImageContainer";

export interface AnnotatedVisualProps {
  headline?: string;
  body?: string;
  eyebrow?: string;
  imageSrc?: string;
  imageAlt?: string;
  imageClassName?: string;
  annotations?: Array<{
    x: number;
    y: number;
    label: string;
    description?: string;
  }>;
}

export const AnnotatedVisual: React.FC<AnnotatedVisualProps> = ({
  headline,
  body,
  eyebrow,
  imageSrc,
  imageAlt = "",
  imageClassName,
  annotations,
}) => {
  return (
    <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-[19.125rem] w-full">
      <div className="flex flex-col lg:flex-row items-end justify-between gap-6 w-full">
        {/* Text Content */}
        {(headline || body || eyebrow) && (
          <div className="flex flex-col gap-[10rem] w-full lg:flex-1 lg:min-w-0 lg:max-w-[16.0625rem] pl-[0.5rem]">
            {headline && (
              <div className="flex flex-col h-[6.875rem] justify-end">
                <p className="font-medium text-[1.3125rem] leading-[1.75rem] tracking-[-0.02625rem] text-[#26291d]">
                  {headline}
                </p>
              </div>
            )}
            {body && (
              <div className=" w-full">
                <BodyText body={body} />
              </div>
            )}
          </div>
        )}

        {/* Image */}
        {imageSrc && (
          <div className="h-[100vh] w-full lg:flex-[5] lg:min-w-0 relative">
            <ImageContainer
              imageSrc={imageSrc}
              alt={imageAlt}
              fill={true}
              containerClassName="absolute inset-0 w-full h-full"
              imageClassName={imageClassName || "object-cover"}
              sizes="100vw"
            />
          </div>
        )}
      </div>
    </div>
  );
};

