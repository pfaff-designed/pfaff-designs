"use client";

import * as React from "react";
import { ContentSection } from "@/components/page-components/ContentSection";
import { useTypewriter } from "@/hooks/useTypewriter";
import { useResponseContext } from "@/components/utility/Renderer/ResponseContext";
import { markdownToHtml } from "@/lib/utils/markdown";

export interface AnswerBlockProps {
  eyebrow?: string;
  heading: string;
  body: string;
  imageId?: string;
  imageSrc?: string;
  imageAlt?: string;
  className?: string;
  animate?: boolean;
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
    
    // Use contentBlocks to support richText rendering
    const contentBlocks = [
      {
        eyebrow: eyebrow,
        body: bodyHtml,
        richText: true,
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
        className={className}
      />
    );
  }
);

AnswerBlock.displayName = "AnswerBlock";

export { AnswerBlock };

