/**
 * Media Registry
 * Central registry for all media assets (images, videos) stored in Supabase Storage
 * Maps media IDs to Supabase bucket + path for deterministic URL resolution
 * Used by the Renderer and media resolution logic
 */

export type MediaId =
  | "hero-capital-one"
  | "hero-pmi"
  | "hero-tanger"
  | "hero-coke"
  | "hero-real-estate"
  | "hero-pfaff-designs";

export interface MediaItem {
  id: MediaId;
  bucket: string; // Supabase Storage bucket name (e.g., "media")
  path: string; // File path within bucket (e.g., "capital-one/hero.jpg")
  alt: string; // Alt text for accessibility
  aspectRatio?: string; // optional, e.g., "16:9"
}

export const MEDIA_REGISTRY: MediaItem[] = [
  {
    id: "hero-capital-one",
    bucket: "media",
    path: "capital-one/hero.jpg",
    alt: "Capital One Travel interface showing trip planning and booking UI.",
    aspectRatio: "16:9",
  },
  {
    id: "hero-pmi",
    bucket: "media",
    path: "pmi/hero.jpg",
    alt: "PMI Agile certification experience with course content and navigation.",
    aspectRatio: "16:9",
  },
  {
    id: "hero-tanger",
    bucket: "media",
    path: "tanger/hero.jpg",
    alt: "Tanger Outlets digital experience highlighting stores and deals.",
    aspectRatio: "16:9",
  },
  {
    id: "hero-coke",
    bucket: "media",
    path: "coke/hero.jpg",
    alt: "Conceptual UI for an AI-enabled Coca-Cola vending or retail experience.",
    aspectRatio: "16:9",
  },
  {
    id: "hero-real-estate",
    bucket: "media",
    path: "real-estate/hero.jpg",
    alt: "Abstracted, anonymized real estate platform dashboard UI.",
    aspectRatio: "16:9",
  },
  {
    id: "hero-pfaff-designs",
    bucket: "media",
    path: "pfaff-designs/hero.jpg",
    alt: "Generative-UI RAG portfolio interface with chat and dynamic layout.",
    aspectRatio: "16:9",
  },
];

/**
 * Get media item by ID
 */
export function getMediaItemById(id: MediaId): MediaItem | undefined {
  return MEDIA_REGISTRY.find((m) => m.id === id);
}

/**
 * Get all media items
 */
export function getAllMediaItems(): MediaItem[] {
  return MEDIA_REGISTRY;
}

/**
 * Supabase Storage bucket name (centralized constant)
 */
export const SUPABASE_MEDIA_BUCKET = "media";

