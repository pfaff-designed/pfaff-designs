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
  title?: string;
  titleVariant?: "display" | "hero" | "headline" | "subheading" | "h1" | "h2" | "h3";
  description?: string;
  contentBlocks?: Array<{
    headline: string;
    items: ContentBlockItem[];
    headlineVariant?: "display" | "hero" | "headline" | "subheading" | "h1" | "h2" | "h3";
  }>;
  leftContent?: string;
  rightContent?: string;
  leftLabel?: string;
  rightLabel?: string;
  leftImageUrl?: string;
  leftImageAlt?: string;
  rightImageUrl?: string;
  rightImageAlt?: string;
  imageUrl?: string;
  imageAlt?: string;
  cards?: Array<{
    title: string;
    description?: string;
    content?: React.ReactNode;
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
  subtitle?: string;
  quote?: string;
  projectDetails?: {
    client?: string;
    role?: string;
    year?: string;
  };
  sectionVariant?: "light" | "dark" | "default";
  containerSize?: "default" | "narrow" | "wide";
  className?: string;
}

const ContentSection = React.forwardRef<HTMLElement, ContentSectionProps>(
  (
    {
      variant,
      title,
      titleVariant = "headline",
      description,
      contentBlocks,
      leftContent,
      rightContent,
      leftLabel,
      rightLabel,
      leftImageUrl,
      leftImageAlt = "",
      rightImageUrl,
      rightImageAlt = "",
      imageUrl,
      imageAlt = "",
      cards,
      galleryImages,
      annotations,
      timelineItems,
      subtitle,
      quote,
      projectDetails,
      sectionVariant = "default",
      containerSize = "default",
      className,
    },
    ref
  ) => {
    const renderVariant = () => {
      switch (variant) {

        case "full-width":
          return (
            <FullWidth
              imageUrl={imageUrl}
              imageAlt={imageAlt}
              title={title}
              subtitle={subtitle}
              quote={quote}
              projectDetails={projectDetails}
            />
          );

        case "2-column-image-right":
          return (
            <TwoColumnImage
              contentBlocks={contentBlocks}
              imageUrl={imageUrl}
              imageAlt={imageAlt}
              imageOnRight={true}
            />
          );

        case "2-column-image-left":
          return (
            <TwoColumnImage
              contentBlocks={contentBlocks}
              imageUrl={imageUrl}
              imageAlt={imageAlt}
              imageOnRight={false}
            />
          );

        case "card-gallery":
          return <CardGallery images={galleryImages} />;

        case "text-with-image":
          return (
            <TextWithImage
              headline={title}
              body={description}
              imageUrl={imageUrl}
              imageAlt={imageAlt}
            />
          );

        case "annotated-visual":
          return (
            <AnnotatedVisual
              title={title}
              description={description}
              imageUrl={imageUrl}
              imageAlt={imageAlt}
              annotations={annotations}
            />
          );

        case "half-and-half-column":
          return (
            <HalfAndHalfColumn
              leftImageUrl={leftImageUrl}
              leftImageAlt={leftImageAlt}
              leftLabel={leftLabel}
              leftContent={leftContent}
              rightImageUrl={rightImageUrl}
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
        </div>
      );
    }

    return (
      <Section ref={ref} variant={sectionVariant} className={className}>
        <Container size={containerSize}>
          {renderVariant()}
        </Container>
      </Section>
    );
  }
);

ContentSection.displayName = "ContentSection";

export { ContentSection };

