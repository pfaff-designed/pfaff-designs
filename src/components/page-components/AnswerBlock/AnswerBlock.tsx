"use client";

import * as React from "react";
import { ContentSection } from "@/components/page-components/ContentSection";
import { useTypewriter } from "@/hooks/useTypewriter";
import { useResponseContext } from "@/components/utility/Renderer/ResponseContext";
import { markdownToHtml } from "@/lib/utils/markdown";
import { cn } from "@/lib/utils";

export interface AnswerBlockProps {
  eyebrow?: string;
  heading: string;
  body: string;
  imageId?: string;
  imageSrc?: string;
  imageAlt?: string;
  className?: string;
  animate?: boolean;
  isAI?: boolean;
}

const AnswerBlock = React.forwardRef<HTMLElement, AnswerBlockProps>(
  (
    {
      eyebrow,
      heading,
      body,
      imageId,
      imageSrc,
      imageAlt,
      className,
      animate = true,
      isAI = false,
    },
    ref
  ) => {
    const { status, responseId, isLatest } = useResponseContext();
    
    // Only animate if:
    // - animate prop is true (default)
    // - status is success
    // - this is the latest response
    const shouldAnimate = animate && status === "success" && isLatest;
    
    const animatedBody = useTypewriter({
      fullText: body,
      enabled: shouldAnimate,
      responseId,
    });
    
    // Use animated body if animating, otherwise use full body
    const displayBody = shouldAnimate ? animatedBody : body;
    
    // Convert markdown to HTML for rich text rendering
    const bodyHtml = markdownToHtml(displayBody);
    
    // When isAI is true, override eyebrow with "AI · Generated Response"
    const displayEyebrow = isAI ? "AI · Generated Response" : eyebrow;

    // Use contentBlocks to support richText rendering
    const contentBlocks = [
      {
        eyebrow: displayEyebrow,
        body: bodyHtml,
        richText: true,
        isAI: isAI,
      },
    ];
    
    return (
      <ContentSection
        ref={ref}
        variant="default"
        headline={heading}
        contentBlocks={contentBlocks}
        imageSrc={imageSrc}
        imageAlt={imageAlt || heading || "Answer block image"}
        className={cn(className, "w-[31.25rem]")}
      />
    );
  }
);

AnswerBlock.displayName = "AnswerBlock";

export { AnswerBlock };

