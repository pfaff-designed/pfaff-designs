import * as React from "react";
import { ArrowUpRight } from "lucide-react";
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
    tools?: string[];
    role?: string;
    year?: string;
  };
  projectUrl?: string;
  className?: string;
}

export const FullWidth: React.FC<FullWidthProps> = ({
  headline,
  body,
  eyebrow,
  imageSrc,
  imageAlt = "",
  projectDetails,
  projectUrl,
  className,
}) => {
  const topicLabel = headline || "This section";

  return (
    <div className={cn("relative w-full overflow-hidden h-screen md:h-[calc(100vh-5rem)]", className)}>
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
          <div className="flex flex-col gap-4 md:gap-6 w-full max-w-[30rem] md:max-w-[33.625rem]">
            {headline && (
              <Heading
                text={headline}
                variant="display"
                className="text-[color:var(--neutral-50)]"
              />
            )}
            {eyebrow && (
              <p className="font-medium text-base md:text-[1.4375rem] leading-6 md:leading-[2rem] tracking-[-0.014375rem] text-[color:var(--neutral-50)]">
                {eyebrow}
              </p>
            )}
          </div>

          {/* Bottom Section: Body (left) and Project Details (right) */}
          <div className="flex flex-col lg:flex-row items-start justify-between w-full gap-4 md:gap-6">
            {/* Body - Bottom Left */}
            {body && (
              <p
                className="font-medium text-base md:text-[1.4375rem] leading-6 md:leading-[2rem] tracking-[-0.014375rem] text-[color:var(--neutral-50)] max-w-[25rem]"
                data-ai-interactive="content-section"
                data-ai-topic-label={topicLabel}
              >
                {body}
              </p>
            )}

            {/* Project Details - Bottom Right */}
            {(projectDetails || projectUrl) && (
              <div className="flex flex-wrap gap-2 md:gap-3 flex-shrink-0 w-full md:max-w-[33.625rem]">
                {/* View Project Link Badge - Primary color, glassmorphic, first in list */}
                {projectUrl && (
                  <a
                    href={projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1.5 rounded-full border border-[rgba(194,96,68,0.4)] bg-[rgba(194,96,68,0.4)] backdrop-blur-sm px-3 py-1.5 text-xs md:text-sm font-medium text-[color:var(--neutral-50)] hover:bg-[rgba(194,96,68,0.5)] hover:border-[rgba(194,96,68,0.5)] hover:ring-2 hover:ring-[rgba(194,96,68,0.5)] hover:ring-offset-2 hover:ring-offset-transparent transition-all"
                  >
                    View Project
                    <ArrowUpRight className="size-3 md:size-4 transition-transform group-hover:rotate-12" />
                  </a>
                )}
                {/* Role Badge - Dark glassmorphic styling */}
                {projectDetails?.role && (
                  <span className="inline-flex items-center rounded-full border border-white/20 bg-[rgba(28,31,23,0.4)] backdrop-blur-sm px-3 py-1.5 text-xs md:text-sm font-medium text-[color:var(--neutral-50)]">
                    {projectDetails.role}
                  </span>
                )}
                {/* Tools Badges */}
                {projectDetails?.tools && projectDetails.tools.length > 0 && (
                  <>
                    {projectDetails.tools.map((tool, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-full border border-[color:var(--neutral-50)]/30 bg-[color:var(--neutral-50)]/10 backdrop-blur-sm px-3 py-1.5 text-xs md:text-sm font-medium text-[color:var(--neutral-50)]"
                      >
                        {tool}
                      </span>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

