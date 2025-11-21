"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AiModal } from "./AiModal";
import { AiConversationRow, type AiConversationRowProps } from "./AiConversationRow";
import { AiActionsRow, type AiModalAction } from "./AiActionsRow";
import { useAiModal } from "./AiModalContext";
import { Composer } from "@/components/molecules/Composer";
import { TypingIndicator } from "@/components/ui/TypingIndicator";
import type { ModalRequestBody, ModalResponseBody } from "@/app/api/ai/modal/route";

/**
 * AiModalHost
 * 
 * Global component that:
 * - Subscribes to useAiModal() for lifecycle + metadata
 * - Maintains local state for messages and actions
 * - Renders the AiModal with proper content
 * - Provides dev-only debug trigger
 * 
 * This is rendered once at the app root level.
 * 
 * TODO (Phase 7.1 Testing): Add tests for:
 * - Message queuing when AI is thinking
 * - Composer stays enabled during thinking state
 * - Queued message auto-sends when AI finishes
 * - Queue clears when modal closes
 * - TypingIndicator displays correctly
 * - Auto-send queued message when thinking completes
 * - Queue clearing when modal closes
 * - Composer remains enabled during thinking state
 * Requires Jest configuration (jest.config.ts, setupTests.ts, test scripts in package.json)
 */
export function AiModalHost() {
  const {
    state,
    isOpen,
    isThinking,
    hasError,
    openFromSelection,
    openGlobal,
    submitQuestion,
    markAnswerReceived,
    setError,
    close,
  } = useAiModal();

  const pathname = usePathname();
  const router = useRouter();

  // Local state for messages and actions (NOT in state machine)
  const [messages, setMessages] = React.useState<AiConversationRowProps[]>([]);
  const [actions, setActions] = React.useState<AiModalAction[]>([]);
  
  // Local state for composer value (used for pre-filling suggested questions)
  const [composerValue, setComposerValue] = React.useState<string>("");
  
  // Message queue state for queuing user messages while AI is thinking
  const [queuedUserMessage, setQueuedUserMessage] = React.useState<string | null>(null);
  
  // Refs for auto-scroll and autofocus
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const composerInputRef = React.useRef<HTMLInputElement>(null);

  // "Replace while open" helper for opening from selection
  const handleOpenFromSelection = React.useCallback(
    (payload: { selectedText: string; headline?: string }) => {
      openFromSelection(payload);
      setMessages([]);
      setActions([]);
      setComposerValue("");
      setQueuedUserMessage(null);
    },
    [openFromSelection]
  );

  // "Replace while open" helper for opening globally
  const handleOpenGlobal = React.useCallback(
    (payload?: { headline?: string }) => {
      openGlobal(payload ?? {});
      setMessages([]);
      setActions([]);
      setComposerValue("");
      setQueuedUserMessage(null);
    },
    [openGlobal]
  );

  // Handle composer submission
  const handleComposerSubmit = React.useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      // 1. If AI is currently thinking, queue the message instead of sending
      if (isThinking) {
        setQueuedUserMessage(trimmed);
        // Input field clears automatically in Composer after onSubmit
        return;
      }

      // 2. Clear any existing error state
      if (hasError) {
        // Error will be cleared by state machine transition
      }

      // 3. Tell the state machine a question was submitted
      submitQuestion({ question: trimmed });

      // 4. Add a user message locally with trimming
      setMessages((prev) => {
        const updated = [...prev, { role: "user", body: trimmed }];
        // Trim to last 10 messages
        return updated.length > 10 ? updated.slice(-10) : updated;
      });

      // 4. Build conversation history (last 2 turns = 4 messages)
      const history = messages.slice(-4).map((m) => ({
        role: m.role,
        text: typeof m.body === "string" ? m.body : "",
      }));

      // 5. Call the real API
      try {
        const requestBody: ModalRequestBody = {
          question: trimmed,
          topicLabel: state.topicLabel ?? undefined,
          topicId: state.topicId ?? undefined,
          source: state.source ?? "hover-pill",
          pagePath: pathname,
          history,
        };

        if (process.env.NODE_ENV !== "production") {
          console.log("[AiModalHost] Calling /api/ai/modal", requestBody);
        }

        const res = await fetch("/api/ai/modal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
          throw new Error(`Modal API failed with status ${res.status}`);
        }

        const data: ModalResponseBody = await res.json();
        
        if (process.env.NODE_ENV !== "production") {
          console.log("[AiModalHost] API response received", {
            answerLength: data.answer?.length || 0,
            actionsCount: data.actions?.length || 0,
          });
        }

        const answerText =
          data.answer?.trim() ||
          "I couldn't generate an answer for that question.";

        // 6. Append AI message with trimming
        setMessages((prev) => {
          const updated = [
            ...prev,
            {
              role: "ai",
              body: answerText,
            },
          ];
          // Trim to last 10 messages
          return updated.length > 10 ? updated.slice(-10) : updated;
        });

        // 7. Update actions if any
        if (data.actions && data.actions.length > 0) {
          setActions(data.actions);
        }

        // 8. Notify the state machine that an answer has been received
        markAnswerReceived();
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[AiModalHost] Error calling API:", error);
        }
        
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Sorry, something went wrong answering that question.";
        
        setError(errorMessage);
      }
    },
    [submitQuestion, markAnswerReceived, setError, state.topicLabel, state.topicId, state.source, pathname]
  );

  // Handle action button clicks
  const handleActionClick = React.useCallback(
    (action: AiModalAction) => {
      switch (action.type) {
        case "scroll": {
          // Close the modal first
          close();
          // Scroll after a small delay to let the modal close animation finish
          setTimeout(() => {
            const selector = `[data-section-id="${action.targetSectionId}"]`;
            const el = document.querySelector(selector);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "start" });
            } else if (process.env.NODE_ENV !== "production") {
              console.warn(
                `[AiModalHost] Scroll target not found: ${selector}`
              );
            }
          }, 200);
          break;
        }
        case "navigate": {
          // Close modal and navigate
          close();
          router.push(action.targetPath);
          break;
        }
        case "suggest_question": {
          // Pre-fill the composer with the suggested question
          // Does NOT auto-submit - user must press Enter/Submit
          setComposerValue(action.suggestedQuestion);
          break;
        }
      }
    },
    [close, router]
  );

  // Auto-scroll to bottom when messages change or thinking state changes
  React.useEffect(() => {
    if (isOpen && bottomRef.current) {
      // Small delay to ensure DOM has updated with new content
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
  }, [messages, isThinking, hasError, isOpen]);

  // Autofocus composer when modal opens or after successful answer
  React.useEffect(() => {
    if (!isOpen) return;

    // Only autofocus in these cases:
    // 1. Modal just opened (transitioning from idle/opening)
    // 2. Just received an answer (transitioning to waiting_for_input)
    const shouldAutofocus =
      state.status === "waiting_for_input" || state.status === "answer_showing";

    if (shouldAutofocus) {
      // Small delay to ensure modal is fully rendered
      const timeoutId = setTimeout(() => {
        // Only focus if no other element in the modal currently has focus
        const modalElement = document.querySelector('[role="dialog"]');
        const activeElement = document.activeElement;

        if (
          modalElement &&
          (!activeElement ||
            !modalElement.contains(activeElement) ||
            activeElement === document.body)
        ) {
          composerInputRef.current?.focus();
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, state.status]);

  // Auto-send queued message when AI finishes thinking
  React.useEffect(() => {
    if (!isThinking && queuedUserMessage) {
      // AI just finished thinking and we have a queued message
      // Send it automatically
      const messageToSend = queuedUserMessage;
      setQueuedUserMessage(null);
      
      // Small delay to let the previous answer settle
      setTimeout(() => {
        handleComposerSubmit(messageToSend);
      }, 100);
    }
  }, [isThinking, queuedUserMessage, handleComposerSubmit]);

  // Clear queue when modal closes
  React.useEffect(() => {
    if (!isOpen && queuedUserMessage) {
      setQueuedUserMessage(null);
    }
  }, [isOpen, queuedUserMessage]);

  return (
    <>
      {/* Dev-only debug button - can be loud/obvious */}
      {process.env.NODE_ENV !== "production" && (
        <div className="fixed bottom-4 right-4 z-[60]">
          <button
            type="button"
            className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] bg-[color:var(--accent-primary)] text-white shadow-lg hover:opacity-90 rounded-md"
            onClick={() =>
              handleOpenGlobal({ headline: "Ask about this portfolio" })
            }
          >
            Debug: Open AI Modal
          </button>
        </div>
      )}

      {/* Always render AiModal - it handles visibility internally via isOpen */}
      <AiModal
        isOpen={isOpen}
        onClose={close}
        headline={state.headline ?? undefined}
        renderBody={() => (
          <>
            {/* Show selected text if present */}
            {state.selectedText && (
              <AiConversationRow
                role="user"
                body={state.selectedText}
                eyebrowLabel={state.source === "hover-pill" ? "Section context" : "Selected text"}
              />
            )}

            {/* Show messages (managed externally in local state) */}
            {messages.map((msg, index) => (
              <AiConversationRow
                key={msg.id ?? index}
                role={msg.role}
                body={msg.body}
                eyebrowLabel={msg.eyebrowLabel}
              />
            ))}

            {/* Show thinking state with TypingIndicator */}
            {isThinking && messages.length > 0 && messages[messages.length - 1].role === "user" && (
              <AiConversationRow
                role="ai"
                eyebrowLabel="AI"
                body={<TypingIndicator label="" />}
              />
            )}

            {/* Show error state as clean AI conversation row */}
            {hasError && state.errorMessage && (
              <AiConversationRow
                role="ai"
                eyebrowLabel="AI"
                body={
                  state.errorMessage.length > 100
                    ? "Sorry, something went wrong answering that. You can try again or ask a different question."
                    : state.errorMessage
                }
              />
            )}

            {/* Sentinel element for auto-scroll with padding to ensure full visibility */}
            <div ref={bottomRef} className="h-14" />
          </>
        )}
        renderActions={() => (
          <AiActionsRow
            actions={actions}
            onActionClick={handleActionClick}
          />
        )}
        renderComposer={() => (
          <Composer
            placeholder="Ask a question…"
            onSubmit={handleComposerSubmit}
            status={isThinking ? "loading" : "idle"}
            hideStatus={true}
            value={composerValue}
            onValueChange={setComposerValue}
            inputRef={composerInputRef}
          />
        )}
      />
    </>
  );
}

AiModalHost.displayName = "AiModalHost";

