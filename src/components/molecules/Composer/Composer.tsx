import * as React from "react";
import { Input } from "@/components/atoms/Input";
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

const EqualizerIcon = () => (
  <span
    aria-hidden="true"
    className="flex h-5 w-5 items-end justify-center gap-[0.125rem]"
  >
    <span className="h-[0.75rem] w-[0.1875rem] rounded-full bg-[#fdf9f4]" />
    <span className="h-4 w-[0.1875rem] rounded-full bg-[#fdf9f4]" />
    <span className="h-2 w-[0.1875rem] rounded-full bg-[#fdf9f4]" />
    <span className="h-4 w-[0.1875rem] rounded-full bg-[#fdf9f4]" />
  </span>
);

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

    const displayQuery = localRecentQuery || recentQuery;
    const displayResponse = recentResponse;

    return (
      <div
        ref={ref}
        className={cn(
          "fixed bottom-0 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-[3.3125rem] w-[24.875rem] pb-6",
          className
        )}
      >
        {/* Input Field with Button */}
        <div className="relative w-full">
          <div
            ref={containerRef}
            className={cn(
              "relative flex items-center w-full rounded-full border border-[#26291d] bg-[#fdf9f4] pr-2 pl-6 py-[0.5rem] transition-all",
              isFocused && "outline-none ring-2 ring-[#9ec8d2] ring-offset-6"
            )}
            style={isFocused ? { isolation: 'isolate' } : undefined}
          >
            <div className="relative z-[1] flex-1" style={{ isolation: 'isolate' }}>
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                focusOff={true}
                className={cn(
                  "relative w-full border-0 bg-transparent px-0 py-0 text-base leading-5 text-[#26291d] placeholder:text-[#26291d] placeholder:opacity-50",
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
              <EqualizerIcon />
            </button>
          </div>
        </div>

        {/* Recent Query Display */}
        {(displayQuery || displayResponse) && (
          <div className="flex flex-col gap-[0.6875rem] w-[24.875rem]">
            {displayQuery && (
              <div className="flex items-center w-[24.875rem] rounded-full border border-[#26291d] bg-[#fdf9f4] pl-[1.4375rem] pr-[3.5rem] py-[0.5rem]">
                <p className="flex-1 text-base leading-5 text-[#26291d]">
                  {displayQuery}
                </p>
                <div className="h-9 w-9 shrink-0" aria-hidden="true" />
              </div>
            )}
            {displayResponse && (
              <p className="text-base leading-5 text-[#26291d] w-[24.875rem]">
                {displayResponse}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Composer.displayName = "Composer";

export { Composer };
