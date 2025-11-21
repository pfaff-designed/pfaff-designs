import * as React from "react";
import { Heading } from "@/components/atoms/Heading";
import { ImageContainer } from "@/components/atoms/ImageContainer";
import { cn } from "@/lib/utils";

export interface FullWidthProps {
  headline?: string;
  body?: string;
  eyebrow?: string;
  imageSrc?: string;
  imageAlt?: string;
  projectDetails?: {
    client?: string;
    role?: string;
    year?: string;
  };
  className?: string;
}

export const FullWidth: React.FC<FullWidthProps> = ({
  headline,
  body,
  eyebrow,
  imageSrc,
  imageAlt = "",
  projectDetails,
  className,
}) => {
  const topicLabel = headline || "This section";

  return (
    <div className={cn("relative w-full overflow-hidden h-[calc(100vh-5rem)]", className)}>
      {/* Background Image - Full Hero Background */}
      {imageSrc && (
        <div className="absolute inset-0 z-0">
          <ImageContainer
            imageSrc={imageSrc}
            alt={imageAlt}
            fill={true}
            containerClassName="absolute inset-0 w-full h-full"
            imageClassName="object-cover object-center"
            sizes="100vw"
          />
          {/* 50% Opacity Overlay - matching Figma design */}
          <div className="absolute inset-0 bg-[#292c21] opacity-50" />
        </div>
      )}

      {/* Content Overlay */}
      <div className="relative z-10 h-full px-4 md:px-6 lg:px-[9rem] flex items-center">
        <div className="w-full flex flex-col gap-16 md:gap-32 lg:gap-[20rem] items-start my-auto">
          {/* Top Section: Headline and Eyebrow */}
          <div className="flex flex-col gap-4 md:gap-6 w-full max-w-[30rem]">
            {headline && (
              <Heading
                text={headline}
                variant="display"
                className="text-white"
              />
            )}
            {eyebrow && (
              <p className="font-medium text-base md:text-[1.4375rem] leading-6 md:leading-[2rem] tracking-[-0.014375rem] text-white">
                {eyebrow}
              </p>
            )}
          </div>

          {/* Bottom Section: Body (left) and Project Details (right) */}
          <div className="flex flex-col lg:flex-row items-start justify-between w-full gap-4 md:gap-6">
            {/* Body - Bottom Left */}
            {body && (
              <p
                className="font-medium text-base md:text-[1.4375rem] leading-6 md:leading-[2rem] tracking-[-0.014375rem] text-white max-w-full md:w-[24.8125rem]"
                data-ai-interactive="content-section"
                data-ai-topic-label={topicLabel}
              >
                {body}
              </p>
            )}

            {/* Project Details - Bottom Right */}
            {projectDetails && (
              <div className="flex flex-col gap-2 flex-shrink-0 w-full md:w-[30rem]">
                {/* Labels Row */}
                <div className="flex gap-4 md:gap-6 font-medium text-sm md:text-[1.4375rem] leading-5 md:leading-[2rem] tracking-[-0.014375rem] text-white">
                  {projectDetails.client !== undefined && (
                    <p className="w-20 md:w-[10rem]">Client</p>
                  )}
                  {projectDetails.role !== undefined && (
                    <p className="w-20 md:w-[10rem]">Role</p>
                  )}
                  {projectDetails.year !== undefined && (
                    <p className="w-20 md:w-[10rem]">Year</p>
                  )}
                </div>
                {/* Values Row */}
                <div className="flex gap-4 md:gap-6 font-medium text-sm md:text-[1.4375rem] leading-5 md:leading-[2rem] tracking-[-0.014375rem] text-white">
                  {projectDetails.client && (
                    <p className="w-20 md:w-[10rem]">{projectDetails.client}</p>
                  )}
                  {projectDetails.role && (
                    <p className="w-20 md:w-[10rem]">{projectDetails.role}</p>
                  )}
                  {projectDetails.year && (
                    <p className="w-20 md:w-[10rem]">{projectDetails.year}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

