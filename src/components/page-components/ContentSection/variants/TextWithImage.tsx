import * as React from "react";
import { Heading } from "@/components/atoms/Heading";
import { BodyText } from "@/components/atoms/BodyText";
import { Eyebrow } from "@/components/atoms/Eyebrow";
import { ImageContainer } from "@/components/atoms/ImageContainer";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";

export interface TextWithImageProps {
  headline?: string;
  body?: string;
  eyebrow?: string;
  imageSrc?: string;
  imageAlt?: string;
}

export const TextWithImage: React.FC<TextWithImageProps> = ({
  headline,
  body,
  eyebrow,
  imageSrc,
  imageAlt = "",
}) => {
  const topicLabel = headline || "This section";

  return (
    <Section>
      <Container>
        <div className="flex flex-col lg:flex-row items-start justify-center gap-8 w-full max-h-screen">
          {/* Text Content */}
          <div className="flex flex-col gap-6 pt-16 w-full lg:flex-[1] lg:min-w-0 lg:max-w-[33.625rem]">
            {eyebrow && <Eyebrow text={eyebrow} />}
            {headline && (
              <Heading
                text={headline}
                variant="display"
              />
            )}
            {body && (
              <div
                className="w-full"
                data-ai-interactive="content-section"
                data-ai-topic-label={topicLabel}
              >
                <BodyText body={body} />
              </div>
            )}
          </div>

          {/* Image */}
          {imageSrc && (
            <div className="w-full lg:flex-[2] lg:min-w-0 h-screen relative">
              <ImageContainer
                imageSrc={imageSrc}
                alt={imageAlt}
                fill={true}
                containerClassName="absolute inset-0 w-full h-full"
                imageClassName="object-cover"
                sizes="100vw"
              />
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
};

