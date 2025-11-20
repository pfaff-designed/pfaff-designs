/**
 * About Page Content Model
 */

export interface AboutSection {
  eyebrow: string;
  headline: string;
  body: string;
  imageSrc?: string;
  imageAlt?: string;
  variant?: "default" | "2-column-image-right" | "2-column-image-left" | "text-with-image";
}

export interface AboutPageData {
  sections: AboutSection[];
}

