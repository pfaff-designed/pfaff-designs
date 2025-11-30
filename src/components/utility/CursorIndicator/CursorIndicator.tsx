"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * CursorIndicator
 * 
 * A floating ⌘K indicator that follows the cursor globally across the site.
 * Similar to how AskAiPill appears, but always visible and follows the mouse.
 * 
 * - Position: fixed (viewport coordinates)
 * - Always visible, follows cursor with smooth easing
 * - Positioned offset from cursor to avoid blocking interaction
 */
export function CursorIndicator() {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = React.useState(false);
  const latestPosRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animationFrameRef = React.useRef<number | null>(null);

  // Linear interpolation for smooth movement
  const lerp = React.useCallback((start: number, end: number, amt: number) => {
    return start + (end - start) * amt;
  }, []);

  // Track mouse movement with smooth easing
  React.useEffect(() => {
    let isRunning = false;

    const handleMouseMove = (event: MouseEvent) => {
      latestPosRef.current = { x: event.clientX, y: event.clientY };
      setIsVisible(true);

      if (!isRunning) {
        isRunning = true;
        const updatePosition = () => {
          setPosition((prev) => {
            const newX = lerp(prev.x, latestPosRef.current.x + 12, 0.22);
            const newY = lerp(prev.y, latestPosRef.current.y + 12, 0.22);
            
            // Continue animating if we're not close enough
            const threshold = 0.5;
            if (
              Math.abs(newX - latestPosRef.current.x - 12) > threshold ||
              Math.abs(newY - latestPosRef.current.y - 12) > threshold
            ) {
              animationFrameRef.current = requestAnimationFrame(updatePosition);
            } else {
              isRunning = false;
            }

            return { x: newX, y: newY };
          });
        };
        animationFrameRef.current = requestAnimationFrame(updatePosition);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      isRunning = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      isRunning = false;
    };
  }, [lerp]);

  return (
    <div
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      className={cn(
        "fixed z-[9999] pointer-events-none",
        "text-[10px] leading-tight tracking-wide",
        "text-[color:var(--text-default)]",
        "transition-opacity duration-150",
        isVisible ? "opacity-50" : "opacity-0"
      )}
    >
      ⌘K
    </div>
  );
}

CursorIndicator.displayName = "CursorIndicator";

