import * as React from "react";
import { BodyText } from "@/components/atoms/BodyText";
import { cn } from "@/lib/utils";

export type AiConversationRole = "user" | "ai" | "system";

export type ConversationMode =
  | "answer_direct"
  | "clarify_then_answer"
  | "low_context_fallback";

export interface AiConversationRowProps {
  id?: string;
  role: AiConversationRole;
  eyebrowLabel?: string;
  body: string | React.ReactNode;
  className?: string;
  isExiting?: boolean; // Used for trimming animation
  mode?: ConversationMode; // Conversation mode from modalGraphApp (dev-only display)
  // TODO (V2 streaming): Add optional props:
  // - isStreaming?: boolean - to show streaming indicator
  // - partialContent?: string - to display partial/incomplete text
}

export const AiConversationRow: React.FC<AiConversationRowProps> = ({
  id,
  role,
  eyebrowLabel,
  body,
  className,
  isExiting = false,
  mode,
}) => {
  // Compute the label: use provided eyebrowLabel or default based on role
  const computedLabel = eyebrowLabel || (role === "user" ? "User" : role === "ai" ? "AI" : "System");

  // Compute eyebrow color and styling based on role - match ContentBlock
  const eyebrowClassName = cn(
    "flex w-full shrink-0 items-start font-bold text-base leading-5 md:w-[7.25rem]",
    role === "ai" 
      ? "text-[color:var(--accent-primary)]" 
      : role === "system"
      ? "text-[color:var(--accent-secondary)]"
      : "text-[color:var(--text-default)]"
  );

  return (
    <div 
      className={cn(
        "flex flex-col gap-6 md:flex-row md:gap-6 mt-[19px] first:mt-0",
        // User messages: appear instantly (no animation)
        // AI messages: subtle fade + slide-from-bottom animation (180ms ease-out)
        role === "ai" && !isExiting && "message-enter",
        // Exit animation: fade out when trimming (180ms ease-in)
        isExiting && "message-exit",
        className
      )} 
      data-conversation-id={id}
      data-role={role}
    >
      {/* Eyebrow Label - matches ContentBlock layout */}
      <div className={eyebrowClassName}>
        {computedLabel}
      </div>
      
      {/* Body Content - matches ContentBlock layout */}
      <div 
        className={cn(
          "flex-1 max-w-[24.25rem]"
        )}
      >
        {/* Dev-only mode label for assistant messages */}
        {role === "ai" && mode && process.env.NEXT_PUBLIC_NODE_ENV === "development" && (
          <span className="mb-1 block text-xs text-[color:var(--text-muted)] opacity-60">
            {mode === "answer_direct" && "Direct answer"}
            {mode === "clarify_then_answer" && "Answer + follow-up"}
            {mode === "low_context_fallback" && "Low-context overview"}
          </span>
        )}
        {/* TODO (V2 streaming): When isStreaming is true, render partial content
            with a cursor/indicator. Display partialContent instead of body. */}
        {typeof body === "string" ? (
          <BodyText body={body} markdown={role === "ai"} />
        ) : (
          body
        )}
      </div>
    </div>
  );
};

AiConversationRow.displayName = "AiConversationRow";

