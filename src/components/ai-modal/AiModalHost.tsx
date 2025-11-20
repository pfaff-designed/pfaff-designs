"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AiModal } from "./AiModal";
import { AiConversationRow, type AiConversationRowProps } from "./AiConversationRow";
import { AiActionsRow, type AiAction } from "./AiActionsRow";
import { useAiModal } from "./AiModalContext";
import { Composer } from "@/components/molecules/Composer";
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

  // Local state for messages and actions (NOT in state machine)
  const [messages, setMessages] = React.useState<AiConversationRowProps[]>([]);
  const [actions, setActions] = React.useState<AiAction[]>([]);
  
  // Ref for auto-scrolling to bottom of conversation
  const bottomRef = React.useRef<HTMLDivElement>(null);

  // "Replace while open" helper for opening from selection
  const handleOpenFromSelection = React.useCallback(
    (payload: { selectedText: string; headline?: string }) => {
      openFromSelection(payload);
      setMessages([]);
      setActions([]);
    },
    [openFromSelection]
  );

  // "Replace while open" helper for opening globally
  const handleOpenGlobal = React.useCallback(
    (payload?: { headline?: string }) => {
      openGlobal(payload ?? {});
      setMessages([]);
      setActions([]);
    },
    [openGlobal]
  );

  // Handle composer submission
  const handleComposerSubmit = React.useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      // 1. Tell the state machine a question was submitted
      submitQuestion({ question: trimmed });

      // 2. Add a user message locally
      setMessages((prev) => [...prev, { role: "user", body: trimmed }]);

      // 3. Build conversation history (last 2 turns = 4 messages)
      const history = messages.slice(-4).map((m) => ({
        role: m.role,
        text: m.body,
      }));

      // 4. Call the real API
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

        // 5. Append AI message
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            body: answerText,
          },
        ]);

        // 6. Update actions if any (for future use)
        if (data.actions && data.actions.length > 0) {
          setActions(data.actions);
        }

        // 7. Notify the state machine that an answer has been received
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
  const handleActionClick = React.useCallback((action: AiAction) => {
    // For now, just log. Real behavior comes in a later phase.
    if (process.env.NODE_ENV !== "production") {
      console.log("AI action clicked", action);
    }
  }, []);

  // Auto-scroll to bottom when messages change or thinking state changes
  React.useEffect(() => {
    if (isOpen && bottomRef.current) {
      // Small delay to ensure DOM has updated with new content
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
  }, [messages, isThinking, hasError, isOpen]);

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

            {/* Show thinking state as AI conversation row */}
            {isThinking && (
              <AiConversationRow
                role="ai"
                body="Thinking…"
              />
            )}

            {/* Show error state as AI conversation row */}
            {hasError && state.errorMessage && (
              <AiConversationRow
                role="ai"
                body={`Error: ${state.errorMessage}`}
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
          />
        )}
      />
    </>
  );
}

AiModalHost.displayName = "AiModalHost";

