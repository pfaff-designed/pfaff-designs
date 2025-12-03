"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AskAiPill } from "./AskAiPill";
import { useAiModal } from "./AiModalContext";

interface HoverState {
  active: boolean;
  x: number;
  y: number;
  topicLabel: string;
  isVisible: boolean; // for fade-out before unmount
}

/**
 * Linear interpolation helper for smooth movement easing
 */
const lerp = (start: number, end: number, amt: number) => start + (end - start) * amt;

/**
 * AiHoverPillHost
 * 
 * Global component that manages hover/tap-based AI pill interaction.
 * 
 * Desktop:
 * - Tracks cursor over AI-interactive regions ([data-ai-interactive])
 * - Shows pill attached to cursor position with inertial easing (lerp)
 * - Uses requestAnimationFrame for smooth 60fps tracking
 * - Fades out before unmounting (150ms delay)
 * 
 * Mobile/Touch:
 * - Tap on AI-interactive region → pill at top-center of viewport
 * - Tap outside → pill hidden with slide-up + fade
 * 
 * Motion polish:
 * - Desktop: fade + scale-in (150ms), lerp movement (0.22 easing)
 * - Mobile: fade + scale + slide-down (200ms)
 * - Soft fade-out on exit (150ms before unmount)
 * 
 * This component is mounted once at the app root level.
 */
export function AiHoverPillHost() {
  const { openAiModal } = useAiModal();
  const pathname = usePathname();
  const [state, setState] = React.useState<HoverState>({
    active: false,
    x: 0,
    y: 0,
    topicLabel: "",
    isVisible: false,
  });

  // Only show hover pill on case study pages (paths starting with /work/)
  const isCaseStudyPage = pathname?.startsWith("/work/") ?? false;

  // Refs for desktop cursor tracking
  const latestPosRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const activeRegionRef = React.useRef<HTMLElement | null>(null);
  const topicLabelRef = React.useRef<string>("");
  const fadeOutTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const isMobileRef = React.useRef<boolean>(false);
  const pillRef = React.useRef<HTMLDivElement | null>(null);

  // Detect if device is mobile/touch (coarse pointer)
  React.useEffect(() => {
    const checkMobile = () => {
      isMobileRef.current = window.matchMedia("(pointer: coarse)").matches;
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Desktop: mousemove with requestAnimationFrame + lerp easing
  React.useEffect(() => {
    function handleMouseMove(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      latestPosRef.current = { x: event.clientX, y: event.clientY };

      if (!target) {
        activeRegionRef.current = null;
        topicLabelRef.current = "";
        return;
      }

      // Check if cursor is over the pill itself - if so, keep it active
      if (pillRef.current && pillRef.current.contains(target)) {
        // Keep the current active state (don't clear the region)
        return;
      }

      const region = target.closest<HTMLElement>("[data-ai-interactive]");
      if (!region || !isCaseStudyPage) {
        activeRegionRef.current = null;
        topicLabelRef.current = "";
        return;
      }

      activeRegionRef.current = region;
      const rawLabel = region.dataset.aiTopicLabel ?? "";
      topicLabelRef.current =
        rawLabel.trim().length > 0 ? rawLabel.trim() : "This section";
    }

    function handleClick(event: MouseEvent) {
      // If pill is active and user clicks anywhere in the active region, open modal
      if (!state.active) return;

      const target = event.target as HTMLElement | null;
      if (!target) return;

      // Check if click is on the pill itself (already handled by pill's onClick)
      if (pillRef.current && pillRef.current.contains(target)) {
        return;
      }

      // Check if click is within an AI-interactive region
      const region = target.closest<HTMLElement>("[data-ai-interactive]");
      if (region && activeRegionRef.current === region) {
        // Extract text content from the region for context
        const textContent = region.textContent?.trim() || "";
        const sectionHeadline = state.topicLabel || "This section";
        
        // Derive projectSlug from pathname (same logic as API route)
        const projectSlugMatch = pathname?.match(/^\/work\/([^/]+)/);
        let projectSlug: string | undefined;
        if (projectSlugMatch) {
          let slug = projectSlugMatch[1];
          // Normalize PMI paths
          if (slug === "pmi" || slug === "pmi-agile" || slug === "pmi-acp" || slug.startsWith("pmi-")) {
            slug = "pmi";
          }
          projectSlug = slug;
        }
        
        // Use openAiModal with unified helper
        openAiModal({
          question: `Tell me more about ${sectionHeadline}`,
          pagePath: pathname ?? undefined,
          projectSlug,
          sectionHeadline,
          sectionText: textContent,
        });
      }
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("click", handleClick);

    // Animation loop for smooth cursor tracking with lerp easing
    let frameId: number;
    function loop() {
      const region = activeRegionRef.current;
      
      if (!region) {
        // Start fade-out
        setState((prev) => {
          if (prev.active) {
            // Clear any pending fade-out
            if (fadeOutTimeoutRef.current) {
              clearTimeout(fadeOutTimeoutRef.current);
            }
            // Trigger fade-out animation
            setState((p) => ({ ...p, isVisible: false }));
            // After animation completes, set active to false
            fadeOutTimeoutRef.current = setTimeout(() => {
              setState((p) => ({ ...p, active: false, topicLabel: "" }));
            }, 100);
            return { ...prev, isVisible: false };
          }
          return prev;
        });
      } else {
        // Clear any pending fade-out
        if (fadeOutTimeoutRef.current) {
          clearTimeout(fadeOutTimeoutRef.current);
          fadeOutTimeoutRef.current = null;
        }

        // Lerp interpolation for smooth inertial movement
        const targetX = latestPosRef.current.x;
        const targetY = latestPosRef.current.y;
        
        setState((prev) => {
          const nextX = prev.active ? lerp(prev.x, targetX, 0.5) : targetX;
          const nextY = prev.active ? lerp(prev.y, targetY, 0.5) : targetY;
          
          return {
            active: true,
            x: nextX,
            y: nextY,
            topicLabel: topicLabelRef.current || "This section",
            isVisible: true,
          };
        });
      }
      frameId = window.requestAnimationFrame(loop);
    }

    frameId = window.requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      window.cancelAnimationFrame(frameId);
      if (fadeOutTimeoutRef.current) {
        clearTimeout(fadeOutTimeoutRef.current);
      }
    };
  }, [state.active, state.topicLabel, openAiModal, pathname, isCaseStudyPage]);

  // Mobile/Touch: tap on region shows pill at top-center
  React.useEffect(() => {
    function handleTouchStart(event: TouchEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const region = target.closest<HTMLElement>("[data-ai-interactive]");
      if (!region || !isCaseStudyPage) {
        // Tap outside → start fade-out
        setState((prev) => {
          if (prev.active) {
            // Clear any pending fade-out
            if (fadeOutTimeoutRef.current) {
              clearTimeout(fadeOutTimeoutRef.current);
            }
            // Trigger fade-out animation
            setState((p) => ({ ...p, isVisible: false }));
            // After animation completes, set active to false
            fadeOutTimeoutRef.current = setTimeout(() => {
              setState((p) => ({ ...p, active: false, topicLabel: "" }));
            }, 150); // Mobile uses 150ms
            return { ...prev, isVisible: false };
          }
          return prev;
        });
        return;
      }

      const rawLabel = region.dataset.aiTopicLabel ?? "";
      const topicLabel =
        rawLabel.trim().length > 0 ? rawLabel.trim() : "This section";

      // Show pill at top-center of viewport
      const x = window.innerWidth / 2;
      const y = 80; // px from top

      // Clear any pending fade-out
      if (fadeOutTimeoutRef.current) {
        clearTimeout(fadeOutTimeoutRef.current);
        fadeOutTimeoutRef.current = null;
      }

      setState({
        active: true,
        x,
        y,
        topicLabel,
        isVisible: true,
      });
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
    };
  }, [isCaseStudyPage]);

  // Don't render until active
  if (!state.active) {
    return null;
  }

  return (
    <div ref={pillRef}>
      <AskAiPill
        x={state.x}
        y={state.y}
        isVisible={state.isVisible}
        isMobile={isMobileRef.current}
        onClick={() => {
          // Extract text content from the active region for context
          const textContent = activeRegionRef.current?.textContent?.trim() || "";
          const sectionHeadline = state.topicLabel || "This section";
          
          // Derive projectSlug from pathname (same logic as API route)
          const projectSlugMatch = pathname?.match(/^\/work\/([^/]+)/);
          let projectSlug: string | undefined;
          if (projectSlugMatch) {
            let slug = projectSlugMatch[1];
            // Normalize PMI paths
            if (slug === "pmi" || slug === "pmi-agile" || slug === "pmi-acp" || slug.startsWith("pmi-")) {
              slug = "pmi";
            }
            projectSlug = slug;
          }
          
          // Use openAiModal with unified helper
          openAiModal({
            question: `Tell me more about ${sectionHeadline}`,
            pagePath: pathname ?? undefined,
            projectSlug,
            sectionHeadline,
            sectionText: textContent,
          });
        }}
      />
    </div>
  );
}

AiHoverPillHost.displayName = "AiHoverPillHost";

