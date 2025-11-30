"use client";

import * as React from "react";
import Script from "next/script";
import { cn } from "@/lib/utils";

export interface CalendlyEmbedProps {
  /**
   * Your Calendly event URL (e.g., "https://calendly.com/your-username/meeting")
   * Get this from your Calendly account: Event Type → Settings → Add to Website
   */
  url: string;
  className?: string;
  /**
   * Customization options for the Calendly embed
   */
  options?: {
    /**
     * Hide event type details (photo, name, duration, location, description)
     * @default false
     */
    hideEventTypeDetails?: boolean;
    /**
     * Hide landing page details
     * @default false
     */
    hideLandingPageDetails?: boolean;
    /**
     * Hide GDPR/cookie banner
     * @default false
     */
    hideGdprBanner?: boolean;
    /**
     * Primary color (hex code, e.g., "#C26044")
     * Must be on a paid Calendly plan to use
     */
    primaryColor?: string;
    /**
     * Text color (hex code, e.g., "#26291D")
     * Must be on a paid Calendly plan to use
     */
    textColor?: string;
    /**
     * Background color (hex code, e.g., "#FDF9F4")
     * Must be on a paid Calendly plan to use
     */
    backgroundColor?: string;
    /**
     * Pre-fill invitee information
     */
    prefill?: {
      name?: string;
      email?: string;
    };
    /**
     * UTM parameters for tracking
     */
    utm?: {
      utmCampaign?: string;
      utmSource?: string;
      utmMedium?: string;
      utmContent?: string;
      utmTerm?: string;
    };
    /**
     * Custom height for the embed (in pixels or CSS value)
     * @default "700px"
     */
    height?: string;
    /**
     * Enable auto-resize to fit content
     * @default false
     */
    autoResize?: boolean;
  };
}

export const CalendlyEmbed: React.FC<CalendlyEmbedProps> = ({ url, className, options = {} }) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const embedRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isLoaded && embedRef.current && typeof window !== "undefined" && (window as any).Calendly) {
      try {
        const widgetConfig: any = {
          url: url,
          parentElement: embedRef.current,
        };

        // Apply customization options
        if (options.hideEventTypeDetails) {
          widgetConfig.hideEventTypeDetails = true;
        }
        if (options.hideLandingPageDetails) {
          widgetConfig.hideLandingPageDetails = true;
        }
        if (options.hideGdprBanner) {
          widgetConfig.hideGdprBanner = true;
        }
        if (options.primaryColor) {
          widgetConfig.primaryColor = options.primaryColor;
        }
        if (options.textColor) {
          widgetConfig.textColor = options.textColor;
        }
        if (options.backgroundColor) {
          widgetConfig.backgroundColor = options.backgroundColor;
        }
        if (options.prefill) {
          widgetConfig.prefill = options.prefill;
        }
        if (options.utm) {
          widgetConfig.utm = options.utm;
        }

        (window as any).Calendly.initInlineWidget(widgetConfig);
      } catch (error) {
        // Silently handle initialization errors
      }
    }
  }, [isLoaded, url, options]);

  const height = options.height || "700px";
  const minHeight = options.autoResize ? "auto" : height;

  return (
    <>
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="lazyOnload"
        onLoad={() => setIsLoaded(true)}
      />
      <div
        ref={embedRef}
        className={cn("w-full", className)}
        style={{ 
          minWidth: "320px", 
          height: "1000px",
          minHeight: minHeight,
        }}
        data-resize={options.autoResize ? "true" : undefined}
      />
    </>
  );
};

