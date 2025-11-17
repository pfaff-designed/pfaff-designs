import { useState, useEffect, useRef } from "react";

export interface UseTypewriterOptions {
  fullText: string;
  enabled: boolean;
  speedMs?: number;
  responseId?: string | number;
}

/**
 * Typewriter hook that reveals text character by character
 * 
 * @param fullText - The complete text to reveal
 * @param enabled - Whether the animation should run
 * @param speedMs - Milliseconds per character (default: calculated for 2-3s max)
 * @param responseId - Unique ID for the response (resets animation when changed)
 * @returns The currently visible text
 */
export const useTypewriter = ({
  fullText,
  enabled,
  speedMs,
  responseId,
}: UseTypewriterOptions): string => {
  const [visibleText, setVisibleText] = useState<string>("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentIndexRef = useRef<number>(0);
  const previousResponseIdRef = useRef<string | number | undefined>(undefined);

  // Calculate speed: for long text, ensure animation completes in 2-3 seconds
  // For short text, use a reasonable per-character speed
  const calculateSpeed = (textLength: number): number => {
    if (speedMs !== undefined) {
      return speedMs;
    }
    
    // Target: complete in 2-3 seconds max
    const maxDuration = 2500; // 2.5 seconds
    const minSpeed = 10; // Minimum 10ms per character for very long text
    const defaultSpeed = 30; // Default 30ms per character
    
    if (textLength === 0) {
      return defaultSpeed;
    }
    
    const calculatedSpeed = maxDuration / textLength;
    return Math.max(minSpeed, Math.min(calculatedSpeed, defaultSpeed));
  };

  // Reset when responseId changes (new response)
  useEffect(() => {
    if (responseId !== undefined && responseId !== previousResponseIdRef.current) {
      setVisibleText("");
      currentIndexRef.current = 0;
      previousResponseIdRef.current = responseId;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [responseId]);

  useEffect(() => {
    // If disabled or no text, show full text immediately
    if (!enabled || !fullText) {
      setVisibleText(fullText || "");
      currentIndexRef.current = fullText?.length || 0;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Reset when fullText changes (new content)
    setVisibleText("");
    currentIndexRef.current = 0;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Start animation from current position
    const animate = () => {
      if (currentIndexRef.current < fullText.length) {
        setVisibleText(fullText.slice(0, currentIndexRef.current + 1));
        currentIndexRef.current += 1;
        
        const speed = calculateSpeed(fullText.length);
        timeoutRef.current = setTimeout(animate, speed);
      }
    };

    // Start animation if not already at the end
    if (currentIndexRef.current < fullText.length) {
      animate();
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [fullText, enabled]);

  return visibleText;
};

