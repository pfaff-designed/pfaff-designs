/**
 * About Page Content Model
 */

export interface AboutSection {
  eyebrow: string;
  headline: string;
  body: string;
  imageSrc?: string;
  imageAlt?: string;
  variant?: "default" | "2-column-image-right" | "2-column-image-left" | "text-with-image" | "annotated-visual";
  imageObjectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  imageAspectRatio?: "auto" | "square" | "video" | "portrait" | "landscape" | "wide";
  imageLightbox?: boolean;
  annotations?: Array<{
    x: number;
    y: number;
    label: string;
    description?: string;
  }>;
}

export interface AboutPageData {
  sections: AboutSection[];
}

