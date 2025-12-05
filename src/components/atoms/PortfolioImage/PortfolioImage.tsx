import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface PortfolioImageProps {
  imageSrc: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  sizes?: string;
}

const PortfolioImage = React.forwardRef<HTMLDivElement, PortfolioImageProps>(
  (
    {
      imageSrc,
      alt,
      className,
      containerClassName,
      priority = false,
      objectFit = "contain",
      sizes = "100vw",
    },
    ref
  ) => {
    const objectFitClass = `object-${objectFit}`;

    return (
      <div
        ref={ref}
        className={cn("relative w-full", containerClassName)}
      >
        <Image
          src={imageSrc}
          alt={alt}
          fill
          className={cn(objectFitClass, className)}
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : "lazy"}
        />
      </div>
    );
  }
);

PortfolioImage.displayName = "PortfolioImage";

export { PortfolioImage };

