"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Input } from "@/components/atoms/Input";
import { filterCommands, createCommandContext, type Command } from "@/lib/cmdk";
import { cn } from "@/lib/utils";
import type { UseCommandPaletteReturn } from "@/lib/cmdk/useCommandPalette";
import type { UseInlineChatReturn } from "@/lib/inline-chat/useInlineChat";

export interface CommandPaletteProps {
  palette: UseCommandPaletteReturn;
  inlineChat: UseInlineChatReturn;
}

/**
 * CommandPalette
 * 
 * Atlas-style command palette that appears near the cursor when Cmd+K is pressed.
 * Renders a pill-shaped input with a filtered list of commands.
 */
export function CommandPalette({ palette, inlineChat }: CommandPaletteProps) {
  const { isOpen, palettePosition, input, setInput, closePalette, setPalettePosition } = palette;
  const pathname = usePathname();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartPos = React.useRef<{ x: number; y: number } | null>(null);
  const [showAllQuickActions, setShowAllQuickActions] = React.useState(false);

  // Extract projectSlug from pathname (same logic as AiKeyboardShortcut)
  const projectSlug = React.useMemo(() => {
    const projectSlugMatch = pathname?.match(/^\/work\/([^/]+)/);
    if (projectSlugMatch) {
      let slug = projectSlugMatch[1];
      // Normalize PMI paths
      if (slug === "pmi" || slug === "pmi-agile" || slug === "pmi-acp" || slug.startsWith("pmi-")) {
        slug = "pmi";
      }
      return slug;
    }
    return undefined;
  }, [pathname]);

  // Create CommandContext with real openInlineChat implementation
  const ctx = React.useMemo(
    () =>
      createCommandContext(input, pathname ?? "", {
        projectSlug: projectSlug ?? null,
        selectionText: undefined,
        sectionHeadline: undefined,
        sectionText: undefined,
        openInlineChat: (args) => {
          console.log("[CommandPalette] openInlineChat called with:", args);
          // Open inline chat with offset position (palette will close after command.run)
          const position = palettePosition
            ? {
                x: palettePosition.x + 20,
                y: palettePosition.y + 20,
              }
            : undefined;
          console.log("[CommandPalette] Opening inline chat at position:", position);
          inlineChat.openInlineChat({
            ...args,
            pagePath: pathname ?? undefined,
            projectSlug: projectSlug ?? null,
            position,
          });
        },
      }),
    [input, pathname, projectSlug, palettePosition, closePalette, inlineChat]
  );

  // Filter commands based on input
  const allCommands = React.useMemo(() => {
    const filtered = filterCommands(input, ctx);
    console.log("[CommandPalette] Filtered commands for input:", input, "→", filtered.map(c => ({ id: c.id, label: c.label, kind: c.kind })));
    return filtered;
  }, [input, ctx]);

  // Separate ai_quick commands from others
  const { quickActions, otherCommands } = React.useMemo(() => {
    const quick = allCommands.filter((c) => c.kind === "ai_quick");
    const others = allCommands.filter((c) => c.kind !== "ai_quick");
    console.log("[CommandPalette] Separated commands - quickActions:", quick.length, quick.map(c => c.label), "otherCommands:", others.length);
    return { quickActions: quick, otherCommands: others };
  }, [allCommands]);

  // Check if there are more than 3 quick actions
  const hasMoreQuickActions = React.useMemo(() => {
    return quickActions.length > 3;
  }, [quickActions.length]);

  // Limit quick actions display to 3 max
  const displayedQuickActions = React.useMemo(() => {
    if (showAllQuickActions) {
      return quickActions;
    }
    // Always limit to 3, even if there are exactly 3
    return quickActions.slice(0, 3);
  }, [quickActions, showAllQuickActions]);

  // Combine displayed commands
  const commands = React.useMemo(() => {
    const result: typeof allCommands = [];
    
    // Add displayed quick actions (max 3)
    result.push(...displayedQuickActions);
    
    // Add "Show more" option if there are more than 3 quick actions total
    if (!showAllQuickActions && hasMoreQuickActions) {
      result.push({
        id: "show-more-quick-actions",
        kind: "help" as const,
        label: `… Show ${quickActions.length - 3} more`,
        description: "Expand to see all quick AI actions",
        keywords: ["more", "expand", "show"],
        run: () => {
          setShowAllQuickActions(true);
        },
      });
    }
    
    // Add other commands
    result.push(...otherCommands);
    
    console.log("[CommandPalette] Final commands:", result.length, "displayedQuickActions:", displayedQuickActions.length, "totalQuickActions:", quickActions.length, "hasMore:", hasMoreQuickActions, "showAll:", showAllQuickActions);
    console.log("[CommandPalette] Result commands:", result.map(c => ({ id: c.id, label: c.label, kind: c.kind })));
    
    return result;
  }, [displayedQuickActions, otherCommands, showAllQuickActions, hasMoreQuickActions, quickActions.length]);

  // Reset active index when commands change
  React.useEffect(() => {
    console.log("[CommandPalette] Commands changed, resetting activeIndex to 0. Commands length:", commands.length);
    setActiveIndex(0);
    // Reset showAllQuickActions when input changes
    setShowAllQuickActions(false);
  }, [commands.length, input]);

  // Focus input when palette opens
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Calculate position with safety clamps
  // Position is frozen when palette opens, so this only recalculates if palettePosition changes
  const position = React.useMemo(() => {
    if (!palettePosition) {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }

    const offsetX = 20;
    const offsetY = 20;
    const paletteWidth = 400; // Approximate width
    const paletteHeight = 300; // Approximate height

    let left = palettePosition.x + offsetX;
    let top = palettePosition.y + offsetY;

    // Clamp to viewport
    if (left + paletteWidth > window.innerWidth) {
      left = window.innerWidth - paletteWidth - 10;
    }
    if (top + paletteHeight > window.innerHeight) {
      top = window.innerHeight - paletteHeight - 10;
    }
    if (left < 10) left = 10;
    if (top < 10) top = 10;

    return { top: `${top}px`, left: `${left}px` };
  }, [palettePosition]);

  // Handle keyboard navigation
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, commands.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      } else if (event.key === "Enter") {
        event.preventDefault();
        console.log("[CommandPalette] Enter pressed. activeIndex:", activeIndex, "commands.length:", commands.length);
        if (commands[activeIndex]) {
          const command = commands[activeIndex];
          console.log("[CommandPalette] Executing command:", command.id, command.label, "kind:", command.kind);
          console.log("[CommandPalette] All available commands:", commands.map((c, i) => ({ index: i, id: c.id, label: c.label, kind: c.kind })));
          command.run(ctx);
          closePalette();
        } else {
          console.error("[CommandPalette] No command at activeIndex:", activeIndex, "commands.length:", commands.length);
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        closePalette();
      }
    },
    [commands, activeIndex, ctx, closePalette]
  );

  // Handle click outside to close
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closePalette();
      }
    };

    // Use capture phase to catch clicks before they bubble
    document.addEventListener("mousedown", handleClickOutside, true);
    return () => document.removeEventListener("mousedown", handleClickOutside, true);
  }, [isOpen, closePalette]);

  // Handle command click
  const handleCommandClick = React.useCallback(
    (command: Command) => {
      console.log("[CommandPalette] Clicking command:", command.id, command.label, "kind:", command.kind);
      command.run(ctx);
      closePalette();
    },
    [ctx, closePalette]
  );

  // Handle drag start
  const handleMouseDown = React.useCallback(
    (event: React.MouseEvent) => {
      // Only start drag if clicking on the header area (not input or buttons)
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "BUTTON" || target.closest("button")) {
        return;
      }

      // Check if clicking in the header area (first 60px or so)
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect && event.clientY - rect.top < 60) {
        setIsDragging(true);
        dragStartPos.current = {
          x: event.clientX - (palettePosition?.x ?? 0),
          y: event.clientY - (palettePosition?.y ?? 0),
        };
        event.preventDefault();
      }
    },
    [palettePosition]
  );

  // Handle drag move
  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (!dragStartPos.current) return;

      const newX = event.clientX - dragStartPos.current.x;
      const newY = event.clientY - dragStartPos.current.y;

      // Clamp to viewport
      const paletteWidth = 400;
      const paletteHeight = 500;
      const clampedX = Math.max(10, Math.min(newX, window.innerWidth - paletteWidth - 10));
      const clampedY = Math.max(10, Math.min(newY, window.innerHeight - paletteHeight - 10));

      setPalettePosition({ x: clampedX, y: clampedY });
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
  }, [isDragging, setPalettePosition]);

  if (!isOpen) return null;

  const paletteContent = (
    <div
      ref={containerRef}
      className="fixed z-50 flex flex-col bg-[color:var(--bg-default)] border border-[color:var(--border-subtle)] rounded-lg shadow-lg min-w-[400px] max-w-[600px] max-h-[500px] overflow-hidden"
      style={{ ...position, cursor: isDragging ? "grabbing" : "default" }}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
    >
      {/* Input */}
      <div className="p-3 border-b border-[color:var(--border-subtle)] cursor-move" style={{ userSelect: "none" }}>
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a command or search..."
          className="w-full"
        />
      </div>

            {/* Command List */}
            <div className="overflow-y-auto flex-1">
              {commands.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-[color:var(--text-default)] opacity-50">
                  No commands found
                </div>
              ) : (
                <ul className="py-2">
                  {commands.map((command, index) => {
                    const isShowMore = command.id === "show-more-quick-actions";
                    const isQuickAction = command.kind === "ai_quick";
                    const isFirstOtherCommand = !isQuickAction && !isShowMore && index === displayedQuickActions.length + (hasMoreQuickActions && !showAllQuickActions ? 1 : 0);
                    
                    return (
                      <React.Fragment key={command.id}>
                        {/* Add separator before first non-quick command */}
                        {isFirstOtherCommand && displayedQuickActions.length > 0 && (
                          <li className="px-4 py-2 border-t border-[color:var(--border-subtle)] my-1">
                            <div className="text-xs font-medium text-[color:var(--text-default)] opacity-50 uppercase tracking-wide">
                              Other Commands
                            </div>
                          </li>
                        )}
                        <li>
                          <button
                            type="button"
                            onClick={() => {
                              if (isShowMore) {
                                setShowAllQuickActions(true);
                              } else {
                                handleCommandClick(command);
                              }
                            }}
                            className={cn(
                              "w-full px-4 py-2 text-left text-sm transition-colors cursor-pointer",
                              "hover:bg-[color:var(--state-hover)] focus:bg-[color:var(--state-hover)] focus:outline-none",
                              index === activeIndex && "bg-[color:var(--state-hover)]",
                              "text-[color:var(--text-default)]",
                              isShowMore && "opacity-70 italic"
                            )}
                            onMouseEnter={() => setActiveIndex(index)}
                          >
                            <div className="font-medium">
                              {isShowMore ? "…" : command.label}
                            </div>
                            {command.description && (
                              <div className="text-xs opacity-70 mt-0.5">{command.description}</div>
                            )}
                          </button>
                        </li>
                      </React.Fragment>
                    );
                  })}
                </ul>
              )}
            </div>
    </div>
  );

  // Render via portal to document.body
  if (typeof window !== "undefined") {
    return createPortal(paletteContent, document.body);
  }

  return null;
}

