import * as React from "react";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";

// ============================================================
// AI MODAL ACTION TYPES (Phase 6.2)
// ============================================================

export type AiModalAction =
  | {
      type: "scroll";
      label: string;
      targetSectionId: string; // e.g. "overview" | "process" | "impact"
    }
  | {
      type: "navigate";
      label: string;
      targetPath: string; // e.g. "/work/coke"
    }
  | {
      type: "suggest_question";
      label: string;
      suggestedQuestion: string;
    };

export interface AiActionsRowProps {
  actions: AiModalAction[];
  onActionClick: (action: AiModalAction) => void;
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

