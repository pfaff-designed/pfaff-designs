"use client";

import * as React from "react";
import { ContentSection } from "@/components/page-components/ContentSection";
import { useTypewriter } from "@/hooks/useTypewriter";
import type { PageJSON } from "@/components/utility/Renderer";

export interface SectionAIAnswerProps {
  sectionId: string;
  answerId: string;
  answerLayout: PageJSON | null;
  status: "idle" | "loading" | "success" | "error";
  isStreaming?: boolean;
  responseId?: string;
}

/**
 * Component for rendering AI answers inline within a section
 * Uses typing animation while streaming, then renders static content
 */
export const SectionAIAnswer: React.FC<SectionAIAnswerProps> = ({
  sectionId,
  answerId,
  answerLayout,
  status,
  isStreaming = false,
  responseId,
}) => {
  // Debug logging
  React.useEffect(() => {
    console.log("[SectionAIAnswer] Render", {
      sectionId,
      answerId,
      status,
      hasAnswerLayout: !!answerLayout,
      answerLayoutKeys: answerLayout ? Object.keys(answerLayout) : null,
      answerLayoutPreview: answerLayout ? JSON.stringify(answerLayout).substring(0, 300) : null,
    });
  }, [sectionId, answerId, status, answerLayout]);

  // Extract body text from answerLayout for typing animation and rendering
  const answerBody = React.useMemo(() => {
    if (!answerLayout?.page?.blocks) {
      console.log("[SectionAIAnswer] No answerLayout.page.blocks");
      return "";
    }
    
    // Helper to recursively find body text
    const findBodyText = (blocks: any[]): string => {
      for (const block of blocks) {
        if (block.component === "ContentSection" && block.props?.body) {
          console.log("[SectionAIAnswer] Found ContentSection body:", block.props.body.substring(0, 100));
          return block.props.body;
        }
        if (block.component === "AnswerBlock" && block.props?.body) {
          console.log("[SectionAIAnswer] Found AnswerBlock body:", block.props.body.substring(0, 100));
          return block.props.body;
        }
        if (block.component === "BodyText" && block.props?.body) {
          console.log("[SectionAIAnswer] Found BodyText body:", block.props.body.substring(0, 100));
          return block.props.body;
        }
        
        // Check children recursively
        if (block.children && Array.isArray(block.children)) {
          const childBody = findBodyText(block.children);
          if (childBody) return childBody;
        }
      }
      return "";
    };
    
    const body = findBodyText(answerLayout.page.blocks);
    console.log("[SectionAIAnswer] Extracted body text length:", body.length);
    return body;
  }, [answerLayout]);

  // Use typewriter animation if streaming/loading
  const visibleBody = useTypewriter({
    fullText: answerBody,
    enabled: isStreaming || status === "loading",
    responseId: responseId || answerId,
  });

  // While loading/streaming, show typing animation with partial text
  if (status === "loading" || isStreaming) {
    return (
      <ContentSection
        variant="default"
        eyebrow="AI · Generated Response"
        headline=""
        body={visibleBody || "Thinking…"}
        isAI={true}
      />
    );
  }

  // If error, show error message
  if (status === "error") {
    return (
      <ContentSection
        variant="default"
        eyebrow="AI · Generated Response"
        headline="Error"
        body="Something went wrong while generating this answer. Please try asking a simpler question, or reload the page."
        isAI={true}
      />
    );
  }

  // If we have answerLayout, render it using ContentSection components
  // Extract content from the PageJSON structure
  if (answerLayout?.page?.blocks) {
    // For now, render the first content block as a simple ContentSection
    // In the future, we could render the full PageJSON structure inline
    const firstBlock = answerLayout.page.blocks[0];
    
    console.log("[SectionAIAnswer] Rendering answerLayout", {
      firstBlockComponent: firstBlock?.component,
      firstBlockProps: firstBlock?.props ? Object.keys(firstBlock.props) : null,
      answerBodyLength: answerBody.length,
    });
    
    if (firstBlock?.component === "ContentSection") {
      const props = firstBlock.props || {};
      console.log("[SectionAIAnswer] Rendering ContentSection with body length:", (props.body || "").length);
      return (
        <ContentSection
          variant={props.variant || "default"}
          eyebrow={props.eyebrow || "AI · Generated Response"}
          headline={props.headline || ""}
          body={props.body || ""}
          isAI={true}
        />
      );
    }
    
    // Fallback: render as default section with extracted body
    if (answerBody) {
      console.log("[SectionAIAnswer] Rendering fallback ContentSection with body length:", answerBody.length);
      return (
        <ContentSection
          variant="default"
          eyebrow="AI · Generated Response"
          headline=""
          body={answerBody}
          isAI={true}
        />
      );
    }
  }

  // No content to render - log why
  console.warn("[SectionAIAnswer] Returning null", {
    hasAnswerLayout: !!answerLayout,
    hasPage: !!answerLayout?.page,
    hasBlocks: !!answerLayout?.page?.blocks,
    status,
    answerBodyLength: answerBody.length,
  });
  return null;
};

SectionAIAnswer.displayName = "SectionAIAnswer";

