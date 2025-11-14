import * as React from "react";
import { Heading } from "@/components/atoms/Heading";
import { BodyText } from "@/components/atoms/BodyText";
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
  return (
    <div className={cn("relative w-full overflow-hidden h-[100vh]", className)}>
      {/* Background Image - Full Hero Background */}
      {imageSrc && (
        <div className="absolute inset-0 z-0">
          <ImageContainer
            imageSrc={imageSrc}
            alt={imageAlt}
            fill={true}
            containerClassName="absolute inset-0 w-full h-full"
            imageClassName="object-cover"
            sizes="100vw"
          />
          {/* 80% Opacity Overlay */}
          <div className="absolute inset-0 bg-black/80" />
        </div>
      )}

      {/* Content Overlay */}
      <div className="relative z-10 flex items-center justify-center min-h-[100vh] px-6 md:px-8 lg:px-12">
        <div className="w-full max-w-7xl mx-auto flex flex-col justify-center gap-[26.75rem] py-[8.375rem]">
          {/* Top Section: Headline and Eyebrow */}
          {(headline || eyebrow) && (
            <div className="flex flex-col gap-[1.4375rem] max-w-[50%]">
              {headline && (
                <Heading
                  text={headline}
                  variant="display"
                  className="text-[#fdf9f4] uppercase"
                />
              )}
              {eyebrow && (
                <p className="font-medium text-[1.4375rem] leading-[2rem] tracking-[-0.014375rem] text-[#fdf9f4]">
                  {eyebrow}
                </p>
              )}
            </div>
          )}

          {/* Bottom Section: Body and Project Details */}
          <div className="flex flex-col lg:flex-row items-start justify-between w-full gap-6">
            {/* Body */}
            {body && (
              <p className="font-medium text-[1.4375rem] leading-[2rem] tracking-[-0.014375rem] text-[#fdf9f4] flex-1 max-w-[25rem]">
                {body}
              </p>
            )}

            {/* Project Details */}
            {projectDetails && (
              <div className="flex flex-col gap-0 flex-shrink-0">
                {/* Labels Row */}
                <div className="flex gap-6 font-medium text-[1.4375rem] leading-[2rem] tracking-[-0.014375rem] text-[#fdf9f4]">
                  {projectDetails.client !== undefined && (
                    <p className="min-w-[7.3125rem]">Client</p>
                  )}
                  {projectDetails.role !== undefined && (
                    <p className="min-w-[7.3125rem]">Role</p>
                  )}
                  {projectDetails.year !== undefined && (
                    <p className="min-w-[7.3125rem]">Year</p>
                  )}
                </div>
                {/* Values Row */}
                <div className="flex gap-6 font-medium text-[1.4375rem] leading-[2rem] tracking-[-0.014375rem] text-[#fdf9f4]">
                  {projectDetails.client && (
                    <p className="min-w-[7.3125rem]">{projectDetails.client}</p>
                  )}
                  {projectDetails.role && (
                    <p className="min-w-[7.3125rem]">{projectDetails.role}</p>
                  )}
                  {projectDetails.year && (
                    <p className="min-w-[7.3125rem]">{projectDetails.year}</p>
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

