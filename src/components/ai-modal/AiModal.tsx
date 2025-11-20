"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Heading } from "@/components/atoms/Heading";
import { Button } from "@/components/atoms/Button";

export interface AiModalProps {
  isOpen: boolean;
  onClose: () => void;
  headline?: string;
  renderBody?: () => React.ReactNode;
  renderActions?: () => React.ReactNode;
  renderComposer?: () => React.ReactNode;
}

/**
 * Simple focus trap helper
 * Finds all focusable elements within a container and traps focus
 */
const useFocusTrap = (
  containerRef: React.RefObject<HTMLElement>,
  isActive: boolean
) => {
  React.useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const getFocusableElements = (): HTMLElement[] => {
      return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
    };

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTab);
    return () => {
      container.removeEventListener('keydown', handleTab);
    };
  }, [isActive, containerRef]);
};

export const AiModal: React.FC<AiModalProps> = ({
  isOpen,
  onClose,
  headline = "Ask about this portfolio",
  renderBody,
  renderActions,
  renderComposer,
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElementRef = React.useRef<HTMLElement | null>(null);
  const headlineId = React.useId();

  // Body scroll lock
  React.useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      
      // Lock body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Focus management
  React.useEffect(() => {
    if (isOpen && cardRef.current) {
      // Small delay to ensure animations have started
      const timeoutId = setTimeout(() => {
        const closeButton = cardRef.current?.querySelector<HTMLElement>('[data-close-button]');
        if (closeButton) {
          closeButton.focus();
        } else {
          // Fallback: focus the card itself
          cardRef.current?.focus();
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    } else if (!isOpen && previousActiveElementRef.current) {
      // Restore focus to previously focused element
      previousActiveElementRef.current.focus();
      previousActiveElementRef.current = null;
    }
  }, [isOpen]);

  // ESC key handler
  React.useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Click outside to close
  const handleOverlayClick = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Don't close if clicking inside the card
      if (cardRef.current && cardRef.current.contains(e.target as Node)) {
        return;
      }
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // Focus trap
  useFocusTrap(cardRef, isOpen);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Modal Overlay and Card */}
      <div
        ref={modalRef}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headlineId}
      >
      {/* Backdrop with blur and dim */}
      <div
        className="absolute inset-0 bg-[color:var(--bg-default)]/80 backdrop-blur-[6px] opacity-100 transition-opacity duration-[180ms] ease-[cubic-bezier(0.33,1,0.68,1)]"
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        ref={cardRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative z-50 w-full max-w-[680px] max-h-[70vh]",
          "bg-[color:var(--bg-default)]",
          "overflow-y-auto",
          "transition-all duration-[180ms] ease-[cubic-bezier(0.33,1,0.68,1)]",
          "p-6 md:p-8",
          "transform",
          isOpen ? "scale-100 opacity-100" : "scale-[0.96] opacity-0"
        )}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--border-subtle) transparent',
          maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)',
          maskComposite: 'intersect',
          WebkitMaskComposite: 'source-in',
        }}
      >
        {/* Header with Close Button */}
        <div className="flex items-start justify-end mb-6">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close AI assistant"
            data-close-button
            className="shrink-0 inline-flex items-center justify-center size-10 rounded-full p-0 text-[color:var(--text-default)] hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-default)] transition-opacity cursor-pointer z-10 relative"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content - styled like DefaultSection */}
        <div className="flex flex-col items-center justify-center w-full">
          <div className="w-full max-w-[33.625rem]">
            {headline && (
              <Heading
                text={headline}
                variant="display"
                level={1}
                id={headlineId}
                className="mb-0 text-[4rem] leading-[4.5rem] tracking-[0.04em] uppercase text-left w-full"
              />
            )}
            {/* Body Content */}
            {renderBody && <div className="mt-[19px]">{renderBody()}</div>}
            {/* Actions */}
            {renderActions && renderActions()}
          </div>
        </div>

        {/* Composer will render separately outside modal card */}
      </div>
    </div>

      {/* Composer - rendered separately at bottom center */}
      {renderComposer && renderComposer()}
    </>
  );
};

AiModal.displayName = "AiModal";

