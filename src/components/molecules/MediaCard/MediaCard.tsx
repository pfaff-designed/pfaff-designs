import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/molecules/Card";
import { Eyebrow } from "@/components/atoms/Eyebrow";
import { Heading } from "@/components/atoms/Heading";
import { BodyText } from "@/components/atoms/BodyText";
import { Tag } from "@/components/atoms/Tag";

export interface MediaCardProps extends React.HTMLAttributes<HTMLDivElement> {
  image?: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
  };
  eyebrow?: string;
  heading?: string;
  headingLevel?: 1 | 2 | 3;
  body?: string;
  tags?: string[];
  variant?: "default" | "highlight";
}

const MediaCard = React.forwardRef<HTMLDivElement, MediaCardProps>(
  (
    {
      image,
      eyebrow,
      heading,
      headingLevel = 3,
      body,
      tags,
      variant = "default",
      className,
      ...props
    },
    ref
  ) => {
    return (
      <Card ref={ref} variant={variant} className={cn("overflow-hidden", className)} {...props}>
        {image && (
          <div className="relative w-full aspect-[4/3] md:aspect-video overflow-hidden rounded-sm">
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className={cn("flex flex-col space-y-2 p-6 md:p-8", image && "pt-4")}>
          {eyebrow && <Eyebrow text={eyebrow} />}
          {heading && (
            <Heading
              text={heading}
              variant={headingLevel === 1 ? "h1" : headingLevel === 2 ? "h2" : "h3"}
              level={headingLevel}
            />
          )}
          {body && <BodyText body={body} variant="default" className="mt-2" />}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {tags.map((tag, index) => (
                <Tag key={index}>{tag}</Tag>
              ))}
            </div>
          )}
        </div>
      </Card>
    );
  }
);

MediaCard.displayName = "MediaCard";

export { MediaCard };

