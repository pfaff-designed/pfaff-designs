import * as React from "react";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Heading } from "@/components/atoms/Heading";
import { BodyText } from "@/components/atoms/BodyText";
import type { ContentBlockItem } from "@/components/molecules/ContentBlock";
import {
  FullWidth,
  TwoColumnImage,
  CardGallery,
  TextWithImage,
  AnnotatedVisual,
  HalfAndHalfColumn,
  Timeline,
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
  | "timeline";

export interface ContentSectionProps {
  variant: ContentSectionVariant;
  // Standardized props (used by most variants)
  headline?: string;
  body?: string;
  eyebrow?: string;
  imageSrc?: string;
  imageAlt?: string;
  // Special props for specific variants
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
    },
    ref
  ) => {
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

        default:
          return null;
      }
    };

    // For full-width, card-gallery, annotated-visual, and text-with-image variants, don't wrap in Container/Section as they handle their own layout
    if (variant === "full-width" || variant === "card-gallery" || variant === "annotated-visual" || variant === "text-with-image") {
      return (
        <div ref={ref as any} className={className}>
          {renderVariant()}
          {children}
        </div>
      );
    }

    return (
      <Section ref={ref} variant={sectionVariant} className={className}>
        <Container size={containerSize}>
          {renderVariant()}
          {children}
        </Container>
      </Section>
    );
  }
);

ContentSection.displayName = "ContentSection";

export { ContentSection };

