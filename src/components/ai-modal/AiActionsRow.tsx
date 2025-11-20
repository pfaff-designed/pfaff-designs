import * as React from "react";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";

export type AiActionType = "navigate" | "scroll" | "deep_dive";

export interface AiAction {
  type: AiActionType;
  label: string;
  target?: string;
  topic?: string;
}

export interface AiActionsRowProps {
  actions: AiAction[];
  onActionClick: (action: AiAction) => void;
  className?: string;
}

export const AiActionsRow: React.FC<AiActionsRowProps> = ({
  actions,
  onActionClick,
  className,
}) => {
  // Limit to 4 actions maximum
  const displayActions = actions.slice(0, 4);

  if (displayActions.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-6 md:flex-row md:gap-6 mt-[19px]", className)}>
      {/* Empty spacer to align with body content - matches eyebrow column width */}
      <div className="hidden md:block md:w-[7.25rem] shrink-0" aria-hidden="true" />
      
      {/* Actions container - aligned with body text */}
      <div className="flex flex-wrap gap-3 flex-1 max-w-[24.25rem]">
        {displayActions.map((action, index) => (
          <Button
            key={`${action.type}-${index}`}
            variant="outline"
            onClick={() => onActionClick(action)}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

AiActionsRow.displayName = "AiActionsRow";

