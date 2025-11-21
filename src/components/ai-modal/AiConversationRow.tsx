import * as React from "react";
import { BodyText } from "@/components/atoms/BodyText";
import { cn } from "@/lib/utils";

export type AiConversationRole = "user" | "ai";

export interface AiConversationRowProps {
  id?: string;
  role: AiConversationRole;
  eyebrowLabel?: string;
  body: string | React.ReactNode;
  className?: string;
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
}) => {
  // Compute the label: use provided eyebrowLabel or default based on role
  const computedLabel = eyebrowLabel || (role === "user" ? "User" : "AI");

  // Compute eyebrow color and styling based on role - match ContentBlock
  const eyebrowClassName = cn(
    "flex w-full shrink-0 items-start font-bold text-base leading-5 md:w-[7.25rem]",
    role === "ai" 
      ? "text-[color:var(--accent-primary)]" 
      : "text-[color:var(--text-default)]"
  );

  return (
    <div 
      className={cn("flex flex-col gap-6 md:flex-row md:gap-6 mt-[19px] first:mt-0", className)} 
      data-conversation-id={id}
    >
      {/* Eyebrow Label - matches ContentBlock layout */}
      <div className={eyebrowClassName}>
        {computedLabel}
      </div>
      
      {/* Body Content - matches ContentBlock layout */}
      <div className="flex-1 max-w-[24.25rem]">
        {/* TODO (V2 streaming): When isStreaming is true, render partial content
            with a cursor/indicator. Display partialContent instead of body. */}
        {typeof body === "string" ? (
          <BodyText body={body} />
        ) : (
          body
        )}
      </div>
    </div>
  );
};

AiConversationRow.displayName = "AiConversationRow";

