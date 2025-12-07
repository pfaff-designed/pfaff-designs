import * as React from "react";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

// TODO: Component size violation - 330 lines exceeds molecule limit (250 lines)
// Consider: Moving to ai-modal/ or utility/ directory, or splitting into smaller molecules
// See: docs/repo-audit-2024-12-04.md section 4.1

export interface ComposerProps {
  placeholder?: string;
  onSubmit?: (query: string) => void;
  recentQuery?: string;
  recentResponse?: string;
  status?: "idle" | "loading" | "success" | "error";
  lastPrompt?: string | null;
  lastUpdatedAt?: string | null;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  hideStatus?: boolean;
  value?: string; // Optional controlled value
  onValueChange?: (value: string) => void; // Optional controlled onChange
  inputRef?: React.RefObject<HTMLTextAreaElement>; // Changed to HTMLTextAreaElement for multi-line
  relative?: boolean; // If true, use relative positioning instead of fixed (for modal usage)
}


/**
 * Format a date to relative time (e.g., "2 seconds ago", "1 minute ago")
 */
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds !== 1 ? "s" : ""} ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
};

const Composer = React.forwardRef<HTMLDivElement, ComposerProps>(
  (
    {
      placeholder = "Tell me about yourself",
      onSubmit,
      recentQuery,
      recentResponse,
      status = "idle",
      lastPrompt,
      lastUpdatedAt,
      className,
      inputClassName,
      buttonClassName,
      hideStatus = false,
      value,
      onValueChange,
      inputRef: externalInputRef,
      relative = false,
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState("");
    const [localRecentQuery, setLocalRecentQuery] = React.useState<string | undefined>(recentQuery);
    const [isFocused, setIsFocused] = React.useState(false);
    const [footerHeight, setFooterHeight] = React.useState(0);
    const [isComposing, setIsComposing] = React.useState(false); // IME composition tracking
    const [userUnfocused, setUserUnfocused] = React.useState(false); // Track if user manually unfocused
    const [isMultiline, setIsMultiline] = React.useState(false); // Track if textarea has multiple lines
    // TODO (V2 streaming): Track partial message composition here for streaming responses
    const internalInputRef = React.useRef<HTMLTextAreaElement>(null);
    const inputRef = externalInputRef || internalInputRef;
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Use controlled value if provided, otherwise use internal state
    const inputValue = value !== undefined ? value : internalValue;
    const setInputValue = React.useCallback((newValue: string) => {
      if (value !== undefined) {
        // Controlled mode: notify parent
        onValueChange?.(newValue);
        return;
      }
      // Uncontrolled mode: update internal state
      setInternalValue(newValue);
    }, [onValueChange, value]);

    const handleSubmit = React.useCallback(() => {
      if (inputValue.trim()) {
        setLocalRecentQuery(inputValue.trim());
        onSubmit?.(inputValue.trim());
        // Clear the input after successful submit
        setInputValue("");
        // Reset user unfocus flag when they submit
        setUserUnfocused(false);
      }
    }, [inputValue, onSubmit, setInputValue]);

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Enter without Shift = submit (unless composing via IME)
        if (e.key === "Enter" && !e.shiftKey && !isComposing) {
          e.preventDefault();
          handleSubmit();
        }
        // Shift+Enter = newline (default behavior, no action needed)
      },
      [handleSubmit, isComposing]
    );

    // Auto-resize textarea as content grows
    // TODO (V2 streaming): When we implement streaming, ensure auto-resize runs on every chunk append
    const autoResize = React.useCallback(() => {
      const textarea = inputRef.current;
      if (!textarea) return;

      // Reset height to auto to get accurate scrollHeight
      textarea.style.height = "auto";
      
      // Calculate new height (capped at 144px from modular scale)
      const newHeight = Math.min(textarea.scrollHeight, 144);
      textarea.style.height = `${newHeight}px`;
      
      // Check if multiline (scrollHeight > single line height ~36px)
      setIsMultiline(textarea.scrollHeight > 36);
      
      // TODO (V2 streaming): May need to debounce auto-resize if chunks arrive very quickly
    }, [inputRef]);

    // Trigger auto-resize when value changes
    React.useEffect(() => {
      autoResize();
    }, [inputValue, autoResize]);

    // Update local state when prop changes
    React.useEffect(() => {
      if (recentQuery !== undefined) {
        setLocalRecentQuery(recentQuery);
      }
    }, [recentQuery]);

    // Track footer position and adjust composer position when footer is in view
    React.useEffect(() => {
      const updateComposerPosition = () => {
        const footer = document.querySelector("footer");
        if (!footer) {
          setFooterHeight(0);
          return;
        }

        const footerRect = footer.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const composerHeight = containerRef.current?.offsetHeight || 0;
        
        // Check if footer is visible in viewport
        // If footer top is above viewport bottom, we need to position composer above it
        if (footerRect.top < viewportHeight) {
          // Footer is in view, position composer above it
          const spaceAboveFooter = viewportHeight - footerRect.top;
          // Position composer above footer with some spacing
          setFooterHeight(spaceAboveFooter); // 4.5rem spacing (72px)
        } else {
          // Footer is below viewport, composer can stay at bottom
          setFooterHeight(0);
        }
      };

      // Initial check
      updateComposerPosition();

      // Update on scroll and resize
      window.addEventListener("scroll", updateComposerPosition, { passive: true });
      window.addEventListener("resize", updateComposerPosition);
      
      // Use ResizeObserver to watch for footer size changes
      const footer = document.querySelector("footer");
      if (footer) {
        const resizeObserver = new ResizeObserver(updateComposerPosition);
        resizeObserver.observe(footer);
        
        return () => {
          window.removeEventListener("scroll", updateComposerPosition);
          window.removeEventListener("resize", updateComposerPosition);
          resizeObserver.disconnect();
        };
      }

      return () => {
        window.removeEventListener("scroll", updateComposerPosition);
        window.removeEventListener("resize", updateComposerPosition);
      };
    }, []);

    const displayQuery = localRecentQuery || recentQuery;
    const displayResponse = recentResponse;

    // Auto-hide the query after 5 seconds
    React.useEffect(() => {
      if (displayQuery) {
        const timer = setTimeout(() => {
          setLocalRecentQuery(undefined);
        }, 5000);

        return () => {
          clearTimeout(timer);
        };
      }
    }, [displayQuery]);

    return (
      <div
        ref={ref}
        className={cn(
          relative
            ? "relative w-full flex flex-col gap-[1rem]"
            : "fixed left-1/2 -translate-x-1/2 z-50 flex flex-col gap-[1rem] w-[24.875rem]",
          "transition-[filter] duration-200",
          "drop-shadow-[0_-2px_8px_rgba(0,0,0,0.08),0_-1px_2px_rgba(255,255,255,0.5)]",
          className
        )}
        style={{
          bottom: relative ? undefined : (footerHeight > 0 ? `${footerHeight}px` : "3rem"),
        }}
      >
        {/* Status Display - Thinking or Last Updated */}
        {!hideStatus && (
          <>
        {status === "loading" && lastPrompt ? (
          <p className="text-base leading-5 text-[var(--text-default)] w-[24.875rem] text-left pl-[2rem] opacity-75">
            Thinking about: &quot;{lastPrompt}&quot;
          </p>
        ) : status === "success" && lastPrompt && lastUpdatedAt ? (
          <p className="text-base leading-5 text-[var(--text-default)] w-[24.875rem] text-left pl-[2rem] opacity-50">
            Last updated {formatRelativeTime(lastUpdatedAt)} based on: &quot;{lastPrompt}&quot;
          </p>
        ) : displayQuery ? (
          <p className="text-base leading-5 text-[var(--text-default)] w-[24.875rem] text-left pl-[2rem] opacity-50">
            {displayQuery}
          </p>
        ) : null}
          </>
        )}

        {/* Input Field with Button */}
        <div className="relative w-full">
          <div
            ref={containerRef}
            className={cn(
              "flex items-center w-full",
              "rounded-full border border-[color:var(--accent-primary)]",
              "bg-[color:var(--bg-default)] shadow-sm",
              "overflow-hidden px-4 py-2 h-[2.5rem]",
              isFocused && "border-[color:var(--accent-secondary)]",
            )}
            style={{ transition: "border 150ms ease-out" }}
          >
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                setIsFocused(true);
              }}
              onBlur={() => {
                setIsFocused(false);
                setUserUnfocused(true);
              }}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder={placeholder}
              rows={1}
              className={cn(
                "bg-transparent outline-none text-sm flex-1 min-w-0 placeholder:text-muted-foreground",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "resize-none overflow-y-hidden",
                "h-full",
                inputClassName,
              )}
              style={{
                width: "100%",
                wordWrap: "break-word",
                whiteSpace: "pre-wrap",
                overflowWrap: "break-word",
              }}
            />
            <button
              type="button"
              onClick={handleSubmit}
              aria-label="Submit query"
              className={cn(
                "flex items-center justify-center size-6 rounded-full bg-[color:var(--accent-primary)] text-[color:var(--primary-foreground)] hover:opacity-90 transition-opacity flex-shrink-0 -mr-2",
                buttonClassName,
              )}
            >
              <ArrowDown className="size-3" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    );
  }
);

Composer.displayName = "Composer";

export { Composer };
