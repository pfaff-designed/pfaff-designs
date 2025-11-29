"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/atoms/Input";
import type { InlineChatState } from "@/lib/inline-chat/useInlineChat";

export interface InlineChatWindowProps {
  state: InlineChatState;
  onClose: () => void;
  setAnchorPosition: (position: { x: number; y: number } | null) => void;
  onBack?: () => void;
  onSendFollowUp: (question: string) => void;
}

/**
 * InlineChatWindow
 * 
 * Small floating chat window for quick AI answers.
 * Appears near the CommandPalette position with a 20px offset.
 */
export function InlineChatWindow({ state, onClose, setAnchorPosition, onBack, onSendFollowUp }: InlineChatWindowProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartPos = React.useRef<{ x: number; y: number } | null>(null);
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  
  // Animation state for smooth open/close
  const [isVisible, setIsVisible] = React.useState(false);

  // Handle animation on mount/unmount
  React.useEffect(() => {
    if (state.isOpen) {
      // Trigger animation after mount
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
    }
  }, [state.isOpen]);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages, state.isLoading]);

  // Focus input when window opens
  React.useEffect(() => {
    if (state.isOpen && !state.isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [state.isOpen, state.isLoading]);

  const handleSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed && !state.isLoading) {
        onSendFollowUp(trimmed);
        setInputValue("");
      }
    },
    [inputValue, state.isLoading, onSendFollowUp]
  );

  // Calculate position with improved viewport clamping
  const position = React.useMemo(() => {
    if (!state.anchorPosition) {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }

    const width = 360;
    const height = 500;
    const margin = 16;

    let x = state.anchorPosition.x;
    let y = state.anchorPosition.y;

    // Clamp to viewport with margin
    if (x + width + margin > window.innerWidth) {
      x = window.innerWidth - width - margin;
    }
    if (y + height + margin > window.innerHeight) {
      y = window.innerHeight - height - margin;
    }
    if (x < margin) x = margin;
    if (y < margin) y = margin;

    return { top: `${y}px`, left: `${x}px` };
  }, [state.anchorPosition]);

  // Handle ESC key
  React.useEffect(() => {
    if (!state.isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isOpen, onClose]);

  // Handle click outside
  React.useEffect(() => {
    if (!state.isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside, true);
    return () => document.removeEventListener("mousedown", handleClickOutside, true);
  }, [state.isOpen, onClose]);

  // Handle drag start
  const handleMouseDown = React.useCallback(
    (event: React.MouseEvent) => {
      // Only start drag if clicking on the header area (not buttons or content)
      const target = event.target as HTMLElement;
      if (target.tagName === "BUTTON" || target.closest("button")) {
        return;
      }

      // Check if clicking in the header area (first 50px or so)
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect && event.clientY - rect.top < 50) {
        setIsDragging(true);
        dragStartPos.current = {
          x: event.clientX - (state.anchorPosition?.x ?? 0),
          y: event.clientY - (state.anchorPosition?.y ?? 0),
        };
        event.preventDefault();
      }
    },
    [state.anchorPosition]
  );

  // Handle drag move
  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (!dragStartPos.current) return;

      const newX = event.clientX - dragStartPos.current.x;
      const newY = event.clientY - dragStartPos.current.y;

      // Clamp to viewport with margin
      const windowWidth = 360;
      const windowHeight = 500;
      const margin = 16;
      const clampedX = Math.max(margin, Math.min(newX, window.innerWidth - windowWidth - margin));
      const clampedY = Math.max(margin, Math.min(newY, window.innerHeight - windowHeight - margin));

      setAnchorPosition({ x: clampedX, y: clampedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartPos.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, setAnchorPosition]);

  // Keep component mounted during fade-out animation
  const [shouldRender, setShouldRender] = React.useState(state.isOpen);
  
  React.useEffect(() => {
    if (state.isOpen) {
      setShouldRender(true);
    } else {
      // Delay unmount to allow fade-out animation (200ms)
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [state.isOpen]);

  if (!shouldRender) return null;

  // Determine if we have the initial question/answer pair or follow-ups
  const hasInitialPair = state.messages.length >= 2 && 
    state.messages[0]?.role === "user" && 
    state.messages[1]?.role === "assistant";
  const initialQuestion = hasInitialPair ? state.messages[0]?.content : null;
  const initialAnswer = hasInitialPair ? state.messages[1]?.content : null;
  const followUpMessages = hasInitialPair ? state.messages.slice(2) : state.messages;

  const windowContent = (
    <div
      ref={containerRef}
      className={cn(
        "fixed z-[60] flex flex-col bg-[color:var(--bg-default)] border border-[color:var(--border-subtle)] rounded-lg shadow-lg w-[360px] max-h-[500px] overflow-hidden",
        "transition-all duration-200 transform",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      )}
      style={{ ...position, cursor: isDragging ? "grabbing" : "default" }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--border-subtle)] cursor-move"
        style={{ userSelect: "none" }}
      >
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="text-[color:var(--text-default)] opacity-70 hover:opacity-100 transition-opacity p-1 -ml-1"
              aria-label="Back to command palette"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <h3 className="text-sm font-medium text-[color:var(--text-default)]">Quick answer</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[color:var(--text-default)] opacity-70 hover:opacity-100 transition-opacity text-xl leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {hasInitialPair ? (
          <>
            {/* Initial Question/Answer with clear hierarchy */}
            <div className="space-y-3">
              {/* Question section */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-[color:var(--text-default)] opacity-60 uppercase tracking-wide">
                  You asked:
                </p>
                <p className="text-sm text-[color:var(--text-default)] opacity-80">
                  {initialQuestion}
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-[color:var(--border-subtle)] my-3" />

              {/* Answer section */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-[color:var(--text-default)] opacity-60 uppercase tracking-wide">
                  Answer:
                </p>
                {state.isLoading && !initialAnswer ? (
                  <div className="text-sm text-[color:var(--text-default)] opacity-60">
                    Thinking…
                  </div>
                ) : (
                  <div className="text-sm text-[color:var(--text-default)] whitespace-pre-wrap max-h-[320px] overflow-y-auto">
                    {initialAnswer}
                  </div>
                )}
              </div>
            </div>

            {/* Follow-up messages (if any) */}
            {followUpMessages.length > 0 && (
              <>
                <div className="border-t border-[color:var(--border-subtle)] my-3" />
                <div className="space-y-3">
                  {followUpMessages.map((message, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex flex-col",
                        message.role === "user" ? "items-end" : "items-start"
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-lg px-3 py-2 max-w-[85%] text-sm",
                          message.role === "user"
                            ? "bg-[color:var(--accent-primary)] text-[color:var(--bg-default)]"
                            : "bg-[color:var(--state-hover)] text-[color:var(--text-default)]"
                        )}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Loading indicator for follow-ups */}
            {state.isLoading && followUpMessages.length > 0 && initialAnswer && (
              <div className="flex items-start">
                <div className="bg-[color:var(--state-hover)] rounded-lg px-3 py-2 text-sm text-[color:var(--text-default)] opacity-60">
                  Thinking…
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Chat-style messages when no initial pair */}
            {state.messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex flex-col",
                  message.role === "user" ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 max-w-[85%] text-sm",
                    message.role === "user"
                      ? "bg-[color:var(--accent-primary)] text-[color:var(--bg-default)]"
                      : "bg-[color:var(--state-hover)] text-[color:var(--text-default)]"
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {state.isLoading && (
              <div className="flex items-start">
                <div className="bg-[color:var(--state-hover)] rounded-lg px-3 py-2 text-sm text-[color:var(--text-default)] opacity-60">
                  Thinking…
                </div>
              </div>
            )}
          </>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-[color:var(--border-subtle)] p-3">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a follow-up question..."
            disabled={state.isLoading}
            className="flex-1 text-sm"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || state.isLoading}
            className={cn(
              "px-3 py-2 rounded-lg transition-colors",
              "bg-[color:var(--accent-primary)] text-[color:var(--bg-default)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)] focus:ring-offset-2"
            )}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );

  // Render via portal to document.body
  if (typeof window !== "undefined") {
    return createPortal(windowContent, document.body);
  }

  return null;
}

