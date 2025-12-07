"use client";

import * as React from "react";
import Image from "next/image";
import type { MediaId } from "@/lib/media/registry";
import type { MediaResolution } from "@/lib/ai/mediaResolver";
import { resolveMediaId } from "@/lib/ai/mediaResolver";

export interface MediaImageProps {
  mediaId: MediaId;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  aspectRatio?: string;
}

/**
 * MediaImage Component
 * Resolves media IDs from registry to Supabase Storage URLs and renders Next.js Image
 * 
 * This component:
 * - Takes a MediaId from the registry
 * - Resolves it to a Supabase Storage URL
 * - Renders a Next.js Image component with proper alt text
 * - Shows a placeholder while loading
 */
export const MediaImage: React.FC<MediaImageProps> = ({
  mediaId,
  className,
  priority = false,
  fill = false,
  width,
  height,
  sizes = "100vw",
  aspectRatio,
}) => {
  const [media, setMedia] = React.useState<MediaResolution | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const loadMedia = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await resolveMediaId(mediaId);
        
        if (isMounted) {
          if (result) {
            console.log("[MediaImage] Resolved media", {
              mediaId,
              url: result.url,
              alt: result.alt,
            });
            
            // Test if image URL is accessible before setting state
            // This helps debug 400 errors
            try {
              const testResponse = await fetch(result.url, { method: "HEAD" });
              if (!testResponse.ok) {
                console.error(`[MediaImage] Image not accessible: ${result.url}`, {
                  status: testResponse.status,
                  statusText: testResponse.statusText,
                });
                setError(`Image not found (${testResponse.status}): ${result.url}`);
                setIsLoading(false);
                return;
              }
            } catch (fetchError) {
              console.error(`[MediaImage] Failed to fetch image: ${result.url}`, fetchError);
              // Still set media - let Next.js Image handle the error
            }
            
            setMedia(result);
          } else {
            setError(`Media ID not found: ${mediaId}`);
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : "Failed to load media";
          console.error(`[MediaImage] Error loading media ID ${mediaId}:`, err);
          setError(errorMessage);
          setIsLoading(false);
        }
      }
    };

    loadMedia();

    return () => {
      isMounted = false;
    };
  }, [mediaId]);

  // Show placeholder while loading
  if (isLoading || !media) {
    return (
      <div
        className={className}
        style={{
          aspectRatio: aspectRatio || "16 / 9",
          backgroundColor: "var(--bg-muted, #f3f4f6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "0.5rem",
        }}
      >
        {error ? (
          <div className="text-sm text-[var(--text-muted)] p-4 text-center">
            {error}
          </div>
        ) : (
          <div className="text-sm text-[var(--text-muted)]">Loading...</div>
        )}
      </div>
    );
  }

  // Render image with Next.js Image component
  if (fill) {
    return (
      <div className={`relative ${className || ""}`} style={{ aspectRatio: aspectRatio || "16 / 9" }}>
        <Image
          src={media.url}
          alt={media.alt}
          fill
          className="object-cover rounded-lg"
          priority={priority}
          sizes={sizes}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <Image
        src={media.url}
        alt={media.alt}
        width={width || 1600}
        height={height || 900}
        className="w-full h-auto rounded-lg object-cover"
        priority={priority}
        sizes={sizes}
        unoptimized={false}
        onError={(e) => {
          console.error(`[MediaImage] Image failed to load: ${media.url}`, {
            mediaId,
            url: media.url,
            error: e,
          });
        }}
        onLoad={() => {
          console.log(`[MediaImage] Image loaded successfully: ${media.url}`);
        }}
      />
    </div>
  );
};

