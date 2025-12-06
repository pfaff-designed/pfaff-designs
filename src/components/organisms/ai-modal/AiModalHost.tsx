"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { AiModal } from "./AiModal";
import { AiConversationRow, type AiConversationRowProps } from "./AiConversationRow";
import { AiActionsRow, type AiModalAction } from "./AiActionsRow";
import { RelatedProjectsRow } from "./RelatedProjectsRow";
import { useAiModal } from "./AiModalContext";
import { trackAIAnswerShown, trackAIContactClickFromAI, trackAIQuestionAsked } from "@/lib/analytics/ai";
import { Composer } from "@/components/molecules/Composer";
import { TypingIndicator } from "@/components/ui/TypingIndicator";
import type { ModalRequestBody, ModalResponseBody, RelatedProject } from "@/app/api/ai/modal/route";
import { Button } from "@/components/atoms/Button";

/**
 * AiModalHost
 * 
 * Global component that:
 * - Subscribes to useAiModal() for lifecycle + metadata
 * - Maintains local state for messages and actions
 * - Renders the AiModal with proper content
 * 
 * This is rendered once at the app root level.
 * 
 * TODO (Phase 7.1 Testing): Add tests for:
 * - Message queuing when AI is thinking
 * - Composer stays enabled during thinking state
 * - Queued message auto-sends when AI finishes
 * - Queue clears when modal closes
 * - TypingIndicator displays correctly
 * 
 * TODO (Phase 7.2 Testing): Add tests for:
 * - Error message displays with icon and correct text
 * - Retry button appears when there's an error
 * - Retry button resubmits the last question
 * - Error clears when retry is successful
 * - lastQuestion is tracked correctly
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

  const deriveProjectSlug = React.useCallback((path: string): string | null => {
    const match = path.match(/^\/work\/([^/]+)/);
    return match ? match[1] : null;
  }, []);

  const getPageMeta = React.useCallback(() => {
    const pagePath = state.pagePath ?? pathname;
    const projectSlug = state.projectSlug ?? deriveProjectSlug(pagePath);
    return { pagePath, projectSlug };
  }, [deriveProjectSlug, pathname, state.pagePath, state.projectSlug]);

  // Detect mobile for relative Composer positioning
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Local state for messages and actions (NOT in state machine)
  const [messages, setMessages] = React.useState<AiConversationRowProps[]>([]);
  const [actions, setActions] = React.useState<AiModalAction[]>([]);
  const [relatedProjects, setRelatedProjects] = React.useState<RelatedProject[]>([]);
  
  // Local state for composer value (used for pre-filling suggested questions)
  const [composerValue, setComposerValue] = React.useState<string>("");
  const lastAnswerModeRef = React.useRef<string | undefined>(undefined);
  
  // Message queue state for queuing user messages while AI is thinking
  const [queuedUserMessage, setQueuedUserMessage] = React.useState<string | null>(null);
  
  // Track last question for retry functionality
  const [lastQuestion, setLastQuestion] = React.useState<string>("");
  
  // Refs for auto-scroll and autofocus
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const actionsRef = React.useRef<HTMLDivElement>(null);
  const composerInputRef = React.useRef<HTMLTextAreaElement>(null);

  // Clear all local state when modal closes or opens to ensure fresh start
  const prevIsOpenRef = React.useRef(isOpen);
  React.useEffect(() => {
    const wasOpen = prevIsOpenRef.current;
    const isNowOpen = isOpen;
    
    // Clear state when modal closes OR when it transitions from closed to open
    if (!isNowOpen || (!wasOpen && isNowOpen)) {
      setMessages([]);
      setActions([]);
      setRelatedProjects([]);
      setComposerValue("");
      setQueuedUserMessage(null);
      setLastQuestion("");
    }
    
    prevIsOpenRef.current = isNowOpen;
  }, [isOpen]);

  // "Replace while open" helper for opening from selection
  const handleOpenFromSelection = React.useCallback(
    (payload: { selectedText: string; headline?: string }) => {
      openFromSelection(payload);
      setMessages([]);
      setActions([]);
      setComposerValue("");
      setQueuedUserMessage(null);
      setLastQuestion("");
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
      setLastQuestion("");
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

      // 3. Store the question for retry functionality
      setLastQuestion(trimmed);

      // Analytics: question asked
      const { pagePath: metaPagePath, projectSlug: metaProjectSlug } = getPageMeta();
      trackAIQuestionAsked({
        pagePath: metaPagePath,
        projectSlug: metaProjectSlug,
        question: trimmed,
      });

      // 4. Tell the state machine a question was submitted
      submitQuestion({ question: trimmed });

      // 5. Add a user message locally
      setMessages((currentMessages) => [
        ...currentMessages,
        { role: "user" as const, body: trimmed },
      ]);

      // 5. Call the real API
      try {
        // Use state.pagePath if available (from openAiModal), otherwise fallback to pathname
        const effectivePagePath = state.pagePath ?? pathname;
        const { pagePath: metaPagePath, projectSlug: metaProjectSlug } = getPageMeta();
        const questionForTracking = trimmed;
        
        const requestBody: ModalRequestBody = {
          question: trimmed,
          topicLabel: state.topicLabel ?? state.sectionHeadline ?? undefined,
          topicId: state.topicId ?? undefined,
          source: state.source ?? "button",
          pagePath: effectivePagePath,
          projectSlug: state.projectSlug ?? undefined,
          sectionHeadline: state.sectionHeadline ?? undefined,
          sectionText: state.sectionText ?? undefined,
        };

        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        try {
          const res = await fetch("/api/ai/modal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!res.ok) {
            throw new Error(`Modal API failed with status ${res.status}`);
          }

          const data: ModalResponseBody = await res.json();

        // Handle navigation intent - navigate immediately and close modal
        if (data.navigationIntent?.path) {
          close();
          setTimeout(() => {
            router.push(data.navigationIntent!.path);
          }, 200); // Small delay to let modal close animation finish
          return;
        }

        const answerText =
          data.answer?.trim() ||
          "I couldn't generate an answer for that question.";

        // 6. Append AI message with mode
        setMessages((currentMessages) => [
          ...currentMessages,
          {
            role: "ai" as const,
            body: answerText,
            mode: data.mode,
          },
        ]);

        // Track last answer mode for contact CTA
        lastAnswerModeRef.current = data.mode ?? undefined;

        // Analytics: answer shown
        trackAIAnswerShown({
          pagePath: metaPagePath,
          projectSlug: metaProjectSlug,
          mode: data.mode,
          question: questionForTracking,
          answer: answerText,
        });

        // 7. Update actions if any
        if (data.actions && data.actions.length > 0) {
          setActions(data.actions);
        }

        // 8. Update related projects if any
        if (data.relatedProjects && data.relatedProjects.length > 0) {
          setRelatedProjects(data.relatedProjects);
        }

        // 9. Notify the state machine that an answer has been received
        markAnswerReceived();
        } finally {
          // Always clear timeout
          clearTimeout(timeoutId);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error && error.name === "AbortError"
            ? "Request timed out. Please try again."
            : error instanceof Error
            ? error.message
            : "Sorry, something went wrong answering that question.";
        
        // Ensure we transition out of thinking state on error
        setError(errorMessage);
        // Remove the user message if it was added but the API failed
        setMessages((currentMessages) => {
          // Remove the last user message if it matches the question that failed
          const lastMessage = currentMessages[currentMessages.length - 1];
          if (lastMessage?.role === "user" && lastMessage.body === trimmed) {
            return currentMessages.slice(0, -1);
          }
          return currentMessages;
        });
      }
    },
    [
      submitQuestion,
        markAnswerReceived,
      setError,
      isThinking,
      hasError,
      state.topicLabel,
      state.topicId,
      state.source,
      state.pagePath,
      state.projectSlug,
      state.sectionHeadline,
      state.sectionText,
      pathname,
      close,
      router,
      getPageMeta,
    ]
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

  // Handle retry button click
  const handleRetry = React.useCallback(() => {
    if (!lastQuestion) return;
    
    // Resubmit the last question
    handleComposerSubmit(lastQuestion);
  }, [lastQuestion, handleComposerSubmit]);

  // Auto-scroll to show actions or bottom when content changes
  React.useEffect(() => {
    if (!isOpen) return;
    
    // Small delay to ensure DOM has updated with new content
    const timeoutId = setTimeout(() => {
      // If actions are present, scroll to show them
      if (actionsRef.current && (actions.length > 0 || (hasError && lastQuestion))) {
        actionsRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      } else if (bottomRef.current) {
        // Otherwise scroll to bottom
        bottomRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 150);
    
    return () => clearTimeout(timeoutId);
  }, [messages, isThinking, hasError, isOpen, actions, lastQuestion]);

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

  // Detect when openAiModal was called and trigger API call
  React.useEffect(() => {
    // Check if openAiModal was used: status is "thinking", lastQuestion is set,
    // but no user message exists yet (messages array doesn't contain the question)
    if (
      isThinking &&
      state.lastQuestion &&
      state.lastQuestion.trim().length > 0 &&
      !messages.some((m) => m.role === "user" && m.body === state.lastQuestion)
    ) {
      const question = state.lastQuestion;
      
      // Add user message first
      setMessages((currentMessages) => [
        ...currentMessages,
        { role: "user" as const, body: question },
      ]);

      // Build conversation history from updated messages
      // Filter out "system" role and ensure only "user" | "ai" roles
      const updatedMessages = [...messages, { role: "user" as const, body: question }];
      const history = updatedMessages
        .slice(-4)
        .filter((m) => m.role === "user" || m.role === "ai")
        .map((m) => ({
          role: m.role === "ai" ? ("ai" as const) : ("user" as const),
          text: typeof m.body === "string" ? m.body : "",
        }));

      // Make API call directly (don't use handleComposerSubmit to avoid duplicate message)
      const makeApiCall = async () => {
        try {
          const effectivePagePath = state.pagePath ?? pathname;
          
          const requestBody: ModalRequestBody = {
            question,
            topicLabel: state.topicLabel ?? state.sectionHeadline ?? undefined,
            topicId: state.topicId ?? undefined,
            source: state.source ?? "button",
            pagePath: effectivePagePath,
            projectSlug: state.projectSlug ?? undefined,
            sectionHeadline: state.sectionHeadline ?? undefined,
            sectionText: state.sectionText ?? undefined,
            history,
          };

          // Add timeout to prevent hanging
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

          try {
            const res = await fetch("/api/ai/modal", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(requestBody),
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!res.ok) {
              throw new Error(`Modal API failed with status ${res.status}`);
            }

            const data: ModalResponseBody = await res.json();

            // Handle navigation intent - navigate immediately and close modal
            if (data.navigationIntent?.path) {
              close();
              setTimeout(() => {
                router.push(data.navigationIntent!.path);
              }, 200); // Small delay to let modal close animation finish
              return;
            }

            const answerText =
              data.answer?.trim() ||
              "I couldn't generate an answer for that question.";

            // Append AI message with mode
            setMessages((currentMessages) => [
              ...currentMessages,
              {
                role: "ai" as const,
                body: answerText,
                mode: data.mode,
              },
            ]);

            // Update actions if any
            if (data.actions && data.actions.length > 0) {
              setActions(data.actions);
            }

            // Update related projects if any
            if (data.relatedProjects && data.relatedProjects.length > 0) {
              setRelatedProjects(data.relatedProjects);
            }

            // Notify the state machine that an answer has been received
            markAnswerReceived();
          } finally {
            // Always clear timeout
            clearTimeout(timeoutId);
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error && error.name === "AbortError"
              ? "Request timed out. Please try again."
              : error instanceof Error
              ? error.message
              : "Sorry, something went wrong answering that question.";
          
          // Ensure we transition out of thinking state on error
          setError(errorMessage);
          // Remove the user message if it was added but the API failed
          setMessages((currentMessages) => {
            // Remove the last user message if it matches the question that failed
            const lastMessage = currentMessages[currentMessages.length - 1];
            if (lastMessage?.role === "user" && lastMessage.body === question) {
              return currentMessages.slice(0, -1);
            }
            return currentMessages;
          });
        }
      };

      // Use a small delay to ensure state is updated
      setTimeout(() => {
        makeApiCall();
      }, 0);
    }
  }, [
    isThinking,
    state.lastQuestion,
    state.pagePath,
    state.projectSlug,
    state.sectionHeadline,
    state.sectionText,
    state.topicLabel,
    state.topicId,
    state.source,
    messages,
    markAnswerReceived,
    setError,
    pathname,
    close,
    router,
  ]);

  // Clear queue when modal closes
  React.useEffect(() => {
    if (!isOpen && queuedUserMessage) {
      setQueuedUserMessage(null);
    }
  }, [isOpen, queuedUserMessage]);

  return (
    <>
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
            {messages.map((msg, index) => {
              // Determine if this is the first assistant message of a turn
              // (i.e., previous message is a user message)
              const previousMessage = index > 0 ? messages[index - 1] : null;
              const isFirstAssistantMessageOfTurn =
                msg.role === "ai" && previousMessage?.role === "user";

              return (
                <AiConversationRow
                  key={msg.id ?? index}
                  role={msg.role}
                  body={msg.body}
                  eyebrowLabel={msg.eyebrowLabel}
                  mode={msg.mode}
                  isFirstAssistantMessageOfTurn={isFirstAssistantMessageOfTurn}
                />
              );
            })}

            {/* Show thinking state with TypingIndicator */}
            {isThinking && messages.length > 0 && messages[messages.length - 1].role === "user" && (
              <AiConversationRow
                role="ai"
                eyebrowLabel="AI"
                body={<TypingIndicator label="" />}
              />
            )}

            {/* Show error state with icon and message */}
            {hasError && state.errorMessage && (
              <AiConversationRow
                role="ai"
                eyebrowLabel="AI"
                body={
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[color:var(--text-default)] opacity-60" />
                    <span className="text-base leading-5 text-[color:var(--text-default)]">
                      Something went wrong — try asking that again.
                    </span>
                  </div>
                }
              />
            )}

            {/* Show related projects if any */}
            {relatedProjects.length > 0 && (
              <RelatedProjectsRow 
                projects={relatedProjects}
                onLinkClick={() => {
                  close();
                }}
              />
            )}

            {/* Sentinel element for auto-scroll with padding to ensure full visibility */}
            <div ref={bottomRef} className="h-14" />
          </>
        )}
        renderActions={() => {
          // TEMPORARILY DISABLED: Quick actions disabled
          return null;
          
          // Show retry button if there's an error and we have a last question
          // if (hasError && lastQuestion) {
          //   return (
          //     <div ref={actionsRef}>
          //       <AiActionsRow
          //         actions={[
          //           {
          //             type: "suggest_question",
          //             label: "Try again",
          //             suggestedQuestion: lastQuestion,
          //           },
          //         ]}
          //         onActionClick={() => handleRetry()}
          //       />
          //     </div>
          //   );
          // }
          
          // Otherwise show regular actions
          // if (actions.length > 0) {
          //   return (
          //     <div ref={actionsRef}>
          //       <AiActionsRow
          //         actions={actions}
          //         onActionClick={handleActionClick}
          //       />
          //     </div>
          //   );
          // }
          
          // return null;
        }}
        renderComposer={() => (
          <Composer
            placeholder="Ask a question…"
            onSubmit={handleComposerSubmit}
            status={isThinking ? "loading" : "idle"}
            hideStatus={true}
            value={composerValue}
            onValueChange={setComposerValue}
            inputRef={composerInputRef}
            relative={isMobile}
          />
        )}
        renderFooter={() => (
          <div className="w-full flex justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                const { pagePath: metaPagePath, projectSlug: metaProjectSlug } = getPageMeta();
                trackAIContactClickFromAI({
                  pagePath: metaPagePath,
                  projectSlug: metaProjectSlug,
                  mode: lastAnswerModeRef.current,
                });
                close();
                router.push("/contact");
              }}
            >
              Contact Charles
            </Button>
          </div>
        )}
      />
    </>
  );
}

AiModalHost.displayName = "AiModalHost";

