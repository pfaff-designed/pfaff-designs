import * as React from "react";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { ImageContainer } from "@/components/atoms/ImageContainer";
import { cn } from "@/lib/utils";
import { getSectionImageURLSync } from "@/lib/media/sectionImages";
import {
  FullWidth,
  TwoColumnImage,
  CardGallery,
  TextWithImage,
  AnnotatedVisual,
  HalfAndHalfColumn,
  Timeline,
  DefaultSection,
} from "./variants";

export type ContentSectionVariant =
  | "2-column-split"
  | "full-width"
  | "2-column-image-right"
  | "2-column-image-left"
  | "card-gallery"
  | "text-with-image"
  | "annotated-visual"
  | "half-and-half-column"
  | "timeline"
  | "default";

export interface ContentSectionProps {
  variant: ContentSectionVariant;
  // Standardized props (used by most variants)
  headline?: string;
  body?: string;
  eyebrow?: string;
  imageSrc?: string;
  imageAlt?: string;
  isAI?: boolean;
  // Special props for specific variants
  contentBlocks?: Array<{
    eyebrow?: string;
    body: string;
    richText?: boolean;
  }>;
  galleryImages?: Array<{
    url: string;
    alt?: string;
  }>;
  annotations?: Array<{
    x: number;
    y: number;
    label: string;
    description?: string;
  }>;
  timelineItems?: Array<{
    year?: string;
    title: string;
    description: string;
  }>;
  leftImageSrc?: string;
  leftImageAlt?: string;
  leftLabel?: string;
  leftContent?: string;
  rightImageSrc?: string;
  rightImageAlt?: string;
  rightLabel?: string;
  rightContent?: string;
  projectDetails?: {
    client?: string;
    role?: string;
    year?: string;
  };
  sectionVariant?: "light" | "dark" | "default";
  containerSize?: "default" | "narrow" | "wide";
  className?: string;
  children?: React.ReactNode;
  // Section image props (for images below sections)
  sectionImageSrc?: string;
  sectionImageAlt?: string;
  projectSlug?: string; // Auto-fetch section image if provided with sectionIndex
  sectionIndex?: number; // 1-based section index for auto-fetching
}

const ContentSection = React.forwardRef<HTMLElement, ContentSectionProps>(
  (
    {
      variant,
      headline,
      body,
      eyebrow,
      imageSrc,
      imageAlt = "",
      isAI = false,
      contentBlocks,
      galleryImages,
      annotations,
      timelineItems,
      leftImageSrc,
      leftImageAlt = "",
      leftLabel,
      leftContent,
      rightImageSrc,
      rightImageAlt = "",
      rightLabel,
      rightContent,
      projectDetails,
      sectionVariant = "default",
      containerSize = "default",
      className,
      children,
      sectionImageSrc,
      sectionImageAlt,
      projectSlug,
      sectionIndex,
    },
    ref
  ) => {
    // Determine section image URL
    // Priority: sectionImageSrc > auto-fetch from projectSlug + sectionIndex
    const [finalSectionImageSrc, setFinalSectionImageSrc] = React.useState<string | undefined>(
      sectionImageSrc
    );

    React.useEffect(() => {
      // Auto-fetch section image if projectSlug and sectionIndex are provided
      console.log("[ContentSection] useEffect check:", {
        finalSectionImageSrc,
        projectSlug,
        sectionIndex,
        hasProjectSlug: !!projectSlug,
        hasSectionIndex: !!sectionIndex,
      });
      
      if (!finalSectionImageSrc && projectSlug && sectionIndex) {
        const url = getSectionImageURLSync(projectSlug, sectionIndex);
        console.log("[ContentSection] Generated URL:", url);
        if (url) {
          setFinalSectionImageSrc(url);
        }
      }
    }, [finalSectionImageSrc, projectSlug, sectionIndex]);
    const renderVariant = () => {
      switch (variant) {

        case "full-width":
          return (
            <FullWidth
              headline={headline}
              body={body}
              eyebrow={eyebrow}
              imageSrc={imageSrc}
              imageAlt={imageAlt}
              projectDetails={projectDetails}
            />
          );

        case "2-column-image-right":
          return (
            <TwoColumnImage
              headline={headline}
              body={body}
              eyebrow={eyebrow}
              imageSrc={imageSrc}
              imageAlt={imageAlt}
              imageOnRight={true}
            />
          );

        case "2-column-image-left":
          return (
            <TwoColumnImage
              headline={headline}
              body={body}
              eyebrow={eyebrow}
              imageSrc={imageSrc}
              imageAlt={imageAlt}
              imageOnRight={false}
            />
          );

        case "card-gallery":
          return <CardGallery images={galleryImages} />;

        case "text-with-image":
          return (
            <TextWithImage
              headline={headline}
              body={body}
              eyebrow={eyebrow}
              imageSrc={imageSrc}
              imageAlt={imageAlt}
            />
          );

        case "annotated-visual":
          return (
            <AnnotatedVisual
              headline={headline}
              body={body}
              eyebrow={eyebrow}
              imageSrc={imageSrc}
              imageAlt={imageAlt}
              annotations={annotations}
            />
          );

        case "half-and-half-column":
          return (
            <HalfAndHalfColumn
              leftImageSrc={leftImageSrc}
              leftImageAlt={leftImageAlt}
              leftLabel={leftLabel}
              leftContent={leftContent}
              rightImageSrc={rightImageSrc}
              rightImageAlt={rightImageAlt}
              rightLabel={rightLabel}
              rightContent={rightContent}
            />
          );

        case "timeline":
          return <Timeline timelineItems={timelineItems} />;

        case "default":
          return (
            <DefaultSection
              headline={headline}
              body={body}
              eyebrow={eyebrow}
              imageSrc={imageSrc}
              imageAlt={imageAlt}
              isAI={isAI}
              contentBlocks={contentBlocks}
            />
          );

        default:
          return null;
      }
    };

    // Render section image below content
    const renderSectionImage = () => {
      if (!finalSectionImageSrc) {
        return null;
      }

      const altText = sectionImageAlt || 
        (projectSlug && sectionIndex 
          ? `${projectSlug} section ${sectionIndex} UI image`
          : "Section image");

      // Log section image (not hero images)
      console.log("Section Image:", {
        url: finalSectionImageSrc,
        projectSlug,
        sectionIndex,
        alt: altText,
      });

      return (
        <div className="w-full mt-12 md:mt-16 max-w-[52.5625rem] mx-auto">
          <ImageContainer
            imageSrc={finalSectionImageSrc}
            alt={altText}
            aspectRatio="wide"
            containerClassName="w-full"
          />
        </div>
      );
    };

    // For full-width, card-gallery, annotated-visual, text-with-image, and default variants, don't wrap in Container/Section as they handle their own layout
    if (variant === "full-width" || variant === "card-gallery" || variant === "annotated-visual" || variant === "text-with-image" || variant === "default") {
      return (
        <div ref={ref as any} className={className}>
          {renderVariant()}
          {children}
          {renderSectionImage()}
        </div>
      );
    }

    return (
      <Section ref={ref} variant={sectionVariant} className={cn(className, '')}>
        <Container size={containerSize}>
          {renderVariant()}
          {children}
          {renderSectionImage()}
        </Container>
      </Section>
    );
  }
);

ContentSection.displayName = "ContentSection";

export { ContentSection };

