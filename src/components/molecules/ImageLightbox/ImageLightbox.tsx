"use client";

import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface ImageLightboxProps {
  imageSrc: string;
  imageAlt: string;
  children: React.ReactNode;
  className?: string;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  imageSrc,
  imageAlt,
  children,
  className,
}) => {
  const [open, setOpen] = React.useState(false);

  const handleClick = () => {
    setOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  return (
    <>
      <div
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`View full size image: ${imageAlt}`}
        className={cn("cursor-pointer transition-opacity hover:opacity-90 w-full h-full", className)}
        style={{ margin: 0, padding: 0, border: "none", outline: "none" }}
      >
        {children}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-transparent border-0 shadow-none">
          <div className="relative w-full h-full max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            <Image
              src={imageSrc}
              alt={imageAlt}
              width={1920}
              height={1080}
              className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
              priority
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

