"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/atoms/Button";
import type { Command } from "@/lib/cmdk";

export interface CommandPaletteContentProps {
  isOpen: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onClose: () => void;
  commands: Command[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  showQuickActions: boolean;
  onShowQuickActionsChange: (show: boolean) => void;
  onCommandClick: (command: Command) => void;
  showAllCommands: boolean;
  onShowAllCommandsChange: (show: boolean) => void;
  initialWidth?: number;
  inputRef?: React.RefObject<HTMLInputElement>;
  onKeyDown?: (event: React.KeyboardEvent) => void;
}

/**
 * CommandPaletteContent
 * 
 * Purely presentational component that renders the command palette UI:
 * - Animated pill input that expands from center outward
 * - Quick actions that appear after expansion completes
 */
export const CommandPaletteContent = React.forwardRef<
  HTMLDivElement,
  CommandPaletteContentProps
>(
  (
    {
      isOpen,
      input,
      onInputChange,
      onClose,
      commands,
      activeIndex,
      onActiveIndexChange,
      showQuickActions,
      onShowQuickActionsChange,
      onCommandClick,
      showAllCommands,
      onShowAllCommandsChange,
      initialWidth = 200,
      inputRef,
      onKeyDown,
    },
    ref,
  ) => {
    const handleAnimationComplete = React.useCallback(() => {
      if (isOpen) {
        onShowQuickActionsChange(true);
      } else {
        onShowQuickActionsChange(false);
      }
    }, [isOpen, onShowQuickActionsChange]);

    const handleCommandButtonClick = React.useCallback(
      (command: Command, index: number) => {
        const isShowMore = command.id === "show-more-commands";
        const isCollapse = command.id === "collapse-menu";

        if (isShowMore) {
          onShowAllCommandsChange(true);
        } else if (isCollapse) {
          onShowAllCommandsChange(false);
        } else {
          onCommandClick(command);
        }
      },
      [onCommandClick, onShowAllCommandsChange],
    );

    const getColumnSpan = React.useCallback((text: string): number => {
      const length = text.length;
      if (length <= 15) return 1;
      if (length <= 30) return 2;
      return 3;
    }, []);

    const quickActionsContent = (
      <AnimatePresence>
        {showQuickActions && commands.length > 0 && (
          <motion.div
            key="quick-actions"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-3 gap-3 auto-rows-auto mb-2 w-full"
          >
            {commands.map((command, index) => {
              const isShowMore = command.id === "show-more-commands";
              const isCollapse = command.id === "collapse-menu";
              const isResume = command.id === "download-resume";
              const label = command.label;
              const columnSpan = getColumnSpan(label);

              return (
                <div
                  key={command.id}
                  style={{
                    ...(columnSpan > 1
                      ? { gridColumn: `span ${columnSpan}` }
                      : {}),
                  }}
                >
                  <Button
                    variant="outline"
                    isActive={index === activeIndex}
                    onClick={() => handleCommandButtonClick(command, index)}
                    className={cn(
                      "justify-center text-center w-full",
                      columnSpan === 2 && "col-span-2",
                      columnSpan === 3 && "col-span-3",
                      (isShowMore || isCollapse) && "opacity-70 italic",
                    )}
                    onMouseEnter={() => onActiveIndexChange(index)}
                  >
                    <span className="font-medium text-sm whitespace-nowrap flex items-center gap-1.5">
                      {isResume && <Download className="size-3" />}
                      {label}
                    </span>
                  </Button>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    );

    return (
      <div ref={ref} onKeyDown={onKeyDown} className="flex flex-col">
        {/* Quick Actions - always render above input */}
        {quickActionsContent}

        {/* Command Palette - the input that expands */}
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              key="palette-input"
              className={cn(
                "rounded-full border border-[color:var(--border-subtle)]",
                "bg-background/80 backdrop-blur-sm shadow-sm",
                "overflow-hidden",
                "px-4 py-2 flex items-center gap-2 h-[2.5rem]",
              )}
              initial={{
                width: initialWidth,
                scale: 0.8,
                opacity: 0,
              }}
              animate={{ width: 400, scale: 1, opacity: 1 }}
              exit={{ width: initialWidth, scale: 0.8, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 24,
              }}
              style={{
                originX: 0.5,
                flexShrink: 0,
              }}
              onAnimationComplete={handleAnimationComplete}
            >
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                Cmd+K
              </span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                className="bg-transparent outline-none text-sm flex-1 min-w-0 placeholder:text-muted-foreground"
                placeholder="Ask or search…"
              />
              <button
                type="button"
                onClick={onClose}
                className="flex items-center justify-center size-4 text-muted-foreground hover:text-[color:var(--text-default)] transition-colors flex-shrink-0"
                aria-label="Close command palette"
              >
                <X className="size-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  },
);

CommandPaletteContent.displayName = "CommandPaletteContent";

