"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaletteMode } from "./types";

export interface CommandPaletteContainerProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode; // Optional - only used when open
  className?: string;
  // Props for persistent pill (closed state)
  onOpenPalette?: () => void;
  pillHover?: boolean;
  onPillHoverStart?: () => void;
  onPillHoverEnd?: () => void;
  initialPillWidth?: number;
  isAiModalOpen?: boolean; // Hide when AI modal is open
}

/**
 * CommandPaletteContainer
 * 
 * Handles container behavior for the command palette.
 * 
 * The container does NOT handle animation - that's handled by CommandPaletteContent.
 */
export const CommandPaletteContainer = React.forwardRef<
  HTMLDivElement,
  CommandPaletteContainerProps
>(
  (
    {
      isOpen,
      onClose,
      children,
      className,
      onOpenPalette,
      pillHover,
      onPillHoverStart,
      onPillHoverEnd,
      initialPillWidth = 200,
      isAiModalOpen = false,
    },
    ref,
  ) => {

    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const [footerHeight, setFooterHeight] = React.useState<number>(0);
    
    // Merge refs: both forward ref and internal ref
    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref && "current" in ref) {
          // Type assertion needed because RefObject.current is read-only in types
          // but we need to assign it in practice
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [ref],
    );

    // Track footer position and adjust palette position when footer is in view
    React.useEffect(() => {
      const updatePalettePosition = () => {
        const footer = document.querySelector("footer");
        if (!footer) {
          setFooterHeight(0);
          return;
        }

        const footerRect = footer.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // Check if footer is visible in viewport
        // If footer top is above viewport bottom, we need to position palette above it
        if (footerRect.top < viewportHeight) {
          // Footer is in view, position palette above it with 24px spacing
          const spaceAboveFooter = viewportHeight - footerRect.top;
          // Position palette above footer with 24px spacing between palette and footer
          setFooterHeight(spaceAboveFooter + 24);
        } else {
          // Footer is below viewport, palette can stay at bottom
          setFooterHeight(0);
        }
      };

      // Initial check
      updatePalettePosition();

      // Update on scroll and resize
      window.addEventListener("scroll", updatePalettePosition, { passive: true });
      window.addEventListener("resize", updatePalettePosition);
      
      // Use ResizeObserver to watch for footer size changes
      const footer = document.querySelector("footer");
      if (footer) {
        const resizeObserver = new ResizeObserver(updatePalettePosition);
        resizeObserver.observe(footer);
        
        return () => {
          window.removeEventListener("scroll", updatePalettePosition);
          window.removeEventListener("resize", updatePalettePosition);
          resizeObserver.disconnect();
        };
      }

      return () => {
        window.removeEventListener("scroll", updatePalettePosition);
        window.removeEventListener("resize", updatePalettePosition);
      };
    }, []);

    // Click outside closes palette (more reliable than onClick on background)
    React.useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          onClose();
        }
      };

      document.addEventListener("mousedown", handleClickOutside, true);
      return () => document.removeEventListener("mousedown", handleClickOutside, true);
    }, [isOpen, onClose]);

    const handleBackgroundClick = () => {
      onClose();
    };

    // Hide when AI modal is open and palette is closed
    if (!isOpen && isAiModalOpen) {
      return null;
    }

    return (
      <div
        className="sticky z-50 pointer-events-none w-full flex justify-center"
        style={{
          bottom: footerHeight > 0 ? `${footerHeight}px` : "1.5rem", // 6 * 4px = 24px (bottom-6)
        }}
        onClick={handleBackgroundClick}
      >
        {/* Persistent pill - closed state */}
        {!isOpen && onOpenPalette && (
          <motion.button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenPalette();
            }}
            className="rounded-full border border-[color:var(--accent-primary)] bg-neutral-50/50 backdrop-blur-md shadow-sm px-4 py-2 flex items-center justify-between gap-2 hover:bg-neutral-50/60 transition-colors flex-shrink-0 h-[2.5rem] pointer-events-auto"
            aria-label="Open command palette"
            initial={false}
            animate={{
              width: pillHover ? 240 : initialPillWidth,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            style={{ originX: 0.5 }}
            onHoverStart={onPillHoverStart}
            onHoverEnd={onPillHoverEnd}
          >
            <span className="text-sm text-[color:var(--text-default)]/70 whitespace-nowrap">
              Ask me anything
            </span>
            <div
              className="flex -mr-2 items-center justify-center size-6 rounded-full border border-[color:var(--accent-primary)] text-[color:var(--accent-primary)] bg-transparent cursor-not-allowed flex-shrink-0"
              aria-label="Submit"
            >
              <ArrowDown className="size-3" />
            </div>
          </motion.button>
        )}

        {/* Expanded palette - open state */}
        {isOpen && (
          <div
            ref={setRefs}
            className={cn(
              "flex flex-col gap-2 items-center pointer-events-auto",
              className,
            )}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: "calc(100vh - 96px)",
              overflowY: "auto",
            }}
          >
            {children}
          </div>
        )}
      </div>
    );
  },
);

CommandPaletteContainer.displayName = "CommandPaletteContainer";

