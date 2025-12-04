"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import type { PaletteMode } from "./types";

export interface CommandPaletteContainerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
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
    },
    ref,
  ) => {

    const containerRef = React.useRef<HTMLDivElement>(null);
    
    // Merge refs: both forward ref and internal ref
    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        containerRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref],
    );

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

    // Always render container for exit animations, but only show pointer events when open

    return (
      <div
        className="sticky bottom-6 z-50 pointer-events-none w-full flex justify-center"
        onClick={handleBackgroundClick}
      >
        <div
          ref={setRefs}
          className={cn(
            "flex flex-col gap-2 items-center",
            isOpen ? "pointer-events-auto" : "pointer-events-none",
            className,
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    );
  },
);

CommandPaletteContainer.displayName = "CommandPaletteContainer";

