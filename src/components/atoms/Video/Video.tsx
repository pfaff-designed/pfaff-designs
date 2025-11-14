import * as React from "react";
import { cn } from "@/lib/utils";
import { validateSupabaseURL } from "@/lib/utils/urlValidation";

export interface VideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  alt: string; // Required for accessibility
  poster?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  containerClassName?: string;
}

/**
 * Video component
 * Enforces Supabase URLs and required alt text per architecture
 */
const Video = React.forwardRef<HTMLVideoElement, VideoProps>(
  (
    {
      src,
      alt,
      poster,
      autoplay = false,
      loop = false,
      muted = false,
      controls = true,
      containerClassName,
      className,
      ...props
    },
    ref
  ) => {
    // Validate URL is from Supabase
    if (!validateSupabaseURL(src)) {
      console.error(`Invalid video URL: ${src}. Only Supabase URLs are allowed.`);
      return (
        <div className={cn("p-4 border border-red-300 bg-red-50 rounded", containerClassName)}>
          <p className="text-sm text-red-800">Invalid video URL. Only Supabase URLs are allowed.</p>
        </div>
      );
    }

    // Enforce no autoplay unless explicitly allowed (architecture requirement)
    const finalAutoplay = autoplay;

    return (
      <div className={cn("relative w-full", containerClassName)}>
        <video
          ref={ref}
          src={src}
          poster={poster}
          autoPlay={finalAutoplay}
          loop={loop}
          muted={muted || finalAutoplay} // Mute if autoplay
          controls={controls}
          className={cn("w-full h-auto", className)}
          aria-label={alt}
          {...props}
        />
      </div>
    );
  }
);

Video.displayName = "Video";

export { Video };

