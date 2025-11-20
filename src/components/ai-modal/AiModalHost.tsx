"use client";

import * as React from "react";
import { AiModal } from "./AiModal";
import { AiConversationRow, type AiConversationRowProps } from "./AiConversationRow";
import { AiActionsRow, type AiAction } from "./AiActionsRow";
import { useAiModal } from "./AiModalContext";
import { Composer } from "@/components/molecules/Composer";
import { BodyText } from "@/components/atoms/BodyText";

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
    close,
  } = useAiModal();

  // Local state for messages and actions (NOT in state machine)
  const [messages, setMessages] = React.useState<AiConversationRowProps[]>([]);
  const [actions, setActions] = React.useState<AiAction[]>([]);

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
    (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      // 1. Tell the state machine a question was submitted
      submitQuestion({ question: trimmed });

      // 2. Add a user message locally
      setMessages((prev) => [...prev, { role: "user", body: trimmed }]);

      // 3. Simulate async AI answer (FAKE - for Phase 3 only)
      // TODO: Replace with real /api/ai/modal call in Phase 4
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            body: "This is a fake AI response from AiModalHost. The real AI pipeline will replace this later.",
          },
        ]);

        // 4. Notify the state machine that an answer has been received
        markAnswerReceived();
      }, 800);
    },
    [submitQuestion, markAnswerReceived]
  );

  // Handle action button clicks
  const handleActionClick = React.useCallback((action: AiAction) => {
    // For now, just log. Real behavior comes in a later phase.
    console.log("AI action clicked", action);
  }, []);

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
        headline={state.headline}
        renderBody={() => (
          <>
            {/* Show selected text if present */}
            {state.selectedText && (
              <AiConversationRow
                role="user"
                body={state.selectedText}
                eyebrowLabel="Selected text"
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

            {/* Show thinking state */}
            {isThinking && (
              <div className="mt-[19px]">
                <BodyText body="Thinking…" variant="muted" />
              </div>
            )}

            {/* Show error state */}
            {hasError && state.errorMessage && (
              <div className="mt-[19px]">
                <BodyText body={`Error: ${state.errorMessage}`} variant="muted" />
              </div>
            )}
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
          />
        )}
      />
    </>
  );
}

AiModalHost.displayName = "AiModalHost";

