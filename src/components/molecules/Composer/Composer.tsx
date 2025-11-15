import * as React from "react";
import Image from "next/image";
import { Input as BaseInput } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ComposerProps {
  placeholder?: string;
  onSubmit?: (query: string) => void;
  recentQuery?: string;
  recentResponse?: string;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
}


const Composer = React.forwardRef<HTMLDivElement, ComposerProps>(
  (
    {
      placeholder = "Tell me about yourself",
      onSubmit,
      recentQuery,
      recentResponse,
      className,
      inputClassName,
      buttonClassName,
    },
    ref
  ) => {
    const [inputValue, setInputValue] = React.useState("");
    const [localRecentQuery, setLocalRecentQuery] = React.useState<string | undefined>(recentQuery);
    const [isFocused, setIsFocused] = React.useState(false);
    const [footerHeight, setFooterHeight] = React.useState(0);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const handleSubmit = React.useCallback(() => {
      if (inputValue.trim()) {
        setLocalRecentQuery(inputValue.trim());
        onSubmit?.(inputValue.trim());
        setInputValue("");
      }
    }, [inputValue, onSubmit]);

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
        }
      },
      [handleSubmit]
    );

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
          setFooterHeight(spaceAboveFooter + 24); // 24px spacing
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

    return (
      <div
        ref={ref}
        className={cn(
          "fixed left-1/2 -translate-x-1/2 z-50 flex flex-col gap-[1rem] w-[24.875rem] pb-6",
          "drop-shadow-[0_-2px_8px_rgba(0,0,0,0.08),0_-1px_2px_rgba(255,255,255,0.5)]",
          className
        )}
        style={{
          bottom: footerHeight > 0 ? `${footerHeight}px` : "1.5rem",
        }}
      >
        {/* Recent Query Display - Plain Text Above */}
        {displayQuery && (
          <p className="text-base leading-5 text-[var(--text-default)] w-[24.875rem] text-left pl-[2rem] opacity-50">
            {displayQuery}
          </p>
        )}

        {/* Input Field with Button */}
        <div className="relative w-full">
          <div
            ref={containerRef}
            className={cn(
              "relative flex items-center w-full rounded-full",
              "bg-[rgba(253,249,244,0.7)] backdrop-blur-md",
              "border border-[rgba(38,41,29,0.1)]",
              "pr-2 pl-6 py-[0.5rem] transition-all",
              isFocused && "outline-none ring-2 ring-[#9ec8d2] ring-offset-6"
            )}
            style={isFocused ? { isolation: 'isolate' } : undefined}
          >
            <div className="relative z-[1] flex-1" style={{ isolation: 'isolate' }}>
              <BaseInput
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                className={cn(
                  "relative w-full border-0 bg-transparent px-0 py-0 text-base leading-5 text-[#26291d] placeholder:text-[#26291d] placeholder:opacity-50",
                  "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none",
                  inputClassName
                )}
                style={{ caretColor: '#26291d' }}
              />
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              aria-label="Submit query"
              className={cn(
                "relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e76f51] p-0 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e76f51] focus-visible:ring-offset-2",
                buttonClassName
              )}
            >
              <Image
                src="/composer-button.svg"
                alt=""
                width={36}
                height={36}
                className="h-9 w-9"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </div>
    );
  }
);

Composer.displayName = "Composer";

export { Composer };
