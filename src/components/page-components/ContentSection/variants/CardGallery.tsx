import * as React from "react";
import { ImageContainer } from "@/components/atoms/ImageContainer";

export interface CardGalleryProps {
  images?: Array<{
    url: string;
    alt?: string;
  }>;
}

export const CardGallery: React.FC<CardGalleryProps> = ({ images }) => {
  // Default to 6 images if none provided
  const displayImages = images || Array(6).fill(null).map((_, i) => ({
    url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=60",
    alt: `Gallery image ${i + 1}`,
  }));

  return (
    <div className="mx-auto w-full max-w-7xl flex flex-col lg:flex-row items-center justify-center gap-6 px-[0.5rem] min-h-[100vh]">
      {/* Left Column */}
      <div className="flex flex-col sm:flex-row gap-6 items-start w-full lg:flex-1 lg:min-w-0">
        {/* Tall image on left */}
        <div className="h-[25rem] sm:h-[31.25rem] lg:h-[48.9375rem] w-full sm:w-1/2 lg:w-1/2 relative">
          <ImageContainer
            imageSrc={displayImages[0]?.url}
            alt={displayImages[0]?.alt || "Gallery image 1"}
            fill={true}
            containerClassName="absolute inset-0 w-full h-full"
            imageClassName="object-cover"
          />
        </div>
        {/* Two stacked images */}
        <div className="flex flex-col gap-6 w-full sm:w-1/2 lg:w-1/2">
          <div className="h-[12.5rem] sm:h-[14.8125rem] lg:h-[23.75rem] w-full relative">
            <ImageContainer
              imageSrc={displayImages[1]?.url}
              alt={displayImages[1]?.alt || "Gallery image 2"}
              fill={true}
              containerClassName="absolute inset-0 w-full h-full"
              imageClassName="object-cover"
            />
          </div>
          <div className="h-[12.5rem] sm:h-[14.8125rem] lg:h-[23.875rem] w-full relative">
            <ImageContainer
              imageSrc={displayImages[2]?.url}
              alt={displayImages[2]?.alt || "Gallery image 3"}
              fill={true}
              containerClassName="absolute inset-0 w-full h-full"
              imageClassName="object-cover"
            />
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-6 w-full lg:flex-1 lg:min-w-0">
        {/* Top image */}
        <div className="h-[12.5rem] sm:h-[18.75rem] lg:h-[23.875rem] w-full relative">
          <ImageContainer
            imageSrc={displayImages[3]?.url}
            alt={displayImages[3]?.alt || "Gallery image 4"}
            fill={true}
            containerClassName="absolute inset-0 w-full h-full"
            imageClassName="object-cover"
          />
        </div>
        {/* Two images side by side at bottom */}
        <div className="flex flex-col sm:flex-row gap-6 items-end">
          <div className="h-[12.5rem] sm:h-[18.75rem] lg:h-[23.875rem] w-full sm:w-1/2 lg:w-1/2 relative">
            <ImageContainer
              imageSrc={displayImages[4]?.url}
              alt={displayImages[4]?.alt || "Gallery image 5"}
              fill={true}
              containerClassName="absolute inset-0 w-full h-full"
              imageClassName="object-cover"
            />
          </div>
          <div className="h-[12.5rem] sm:h-[18.75rem] lg:h-[23.75rem] w-full sm:w-1/2 lg:w-1/2 relative">
            <ImageContainer
              imageSrc={displayImages[5]?.url}
              alt={displayImages[5]?.alt || "Gallery image 6"}
              fill={true}
              containerClassName="absolute inset-0 w-full h-full"
              imageClassName="object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

