"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { filterCommands, createCommandContext, type Command } from "@/lib/cmdk";
import { cn } from "@/lib/utils";
import type { UseCommandPaletteReturn } from "@/lib/cmdk/useCommandPalette";
import type { UseInlineChatReturn } from "@/lib/inline-chat/useInlineChat";
import { useAiModal } from "@/components/ai-modal/AiModalContext";
import { Button } from "@/components/atoms/Button";
import { X, Download } from "lucide-react";

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
  const router = useRouter();
  const { openAiModal } = useAiModal();
  
  // Store setPalettePosition in a ref to avoid closure issues
  const setPalettePositionRef = React.useRef(setPalettePosition);
  React.useEffect(() => {
    setPalettePositionRef.current = setPalettePosition;
  }, [setPalettePosition]);
  
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartPos = React.useRef<{ x: number; y: number } | null>(null);
  const [showAllCommands, setShowAllCommands] = React.useState(false);

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

  // Create CommandContext with real openInlineChat and openAiModal implementations
  const ctx = React.useMemo(
    () =>
      createCommandContext(input, pathname ?? "", {
        projectSlug: projectSlug ?? null,
        selectionText: undefined,
        sectionHeadline: undefined,
        sectionText: undefined,
        openInlineChat: (args) => {
          // Open inline chat with offset position (palette will close after command.run)
          const position = palettePosition
            ? {
                x: palettePosition.x + 20,
                y: palettePosition.y + 20,
              }
            : undefined;
          inlineChat.openInlineChat({
            ...args,
            pagePath: pathname ?? undefined,
            projectSlug: projectSlug ?? null,
            position,
          });
        },
        openAiModal: (args) => {
          // Close the palette before opening the modal
          closePalette();
          
          // Call the real openAiModal with correct context
          const effectivePagePath = args.pagePath ?? (pathname ? pathname : undefined);
          const effectiveProjectSlug = args.projectSlug ?? (projectSlug ? projectSlug : undefined);
          
          openAiModal({
            question: args.question,
            pagePath: effectivePagePath,
            projectSlug: effectiveProjectSlug,
            // Section-level context is currently not wired in; leave undefined
            sectionHeadline: undefined,
            sectionText: undefined,
            source: "keyboard", // Command palette uses keyboard source
          });
        },
        navigate: (path) => {
          closePalette();
          router.push(path);
        },
        download: (path) => {
          closePalette();
          
          // Handle external URLs (like Supabase storage)
          if (path.startsWith("http://") || path.startsWith("https://")) {
            // For external URLs, open in new tab to trigger download
            window.open(path, "_blank");
          } else {
            // For local paths, create a temporary anchor element to trigger download
            const link = document.createElement("a");
            link.href = path;
            link.download = path.split("/").pop() || "download";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        },
      }),
    [input, pathname, projectSlug, palettePosition, closePalette, inlineChat, openAiModal, router]
  );

  // Filter commands based on input
  const allCommands = React.useMemo(() => {
    const filtered = filterCommands(input, ctx);
    return filtered;
  }, [input, ctx]);

  // Determine displayed commands (max 6: 5 commands + "Show more")
  const commands = React.useMemo(() => {
    const MAX_DISPLAYED = 5;
    
    if (showAllCommands) {
      // Show all commands + "Collapse" button at the end
      const displayed = [...allCommands];
      displayed.push({
        id: "collapse-menu",
        kind: "help" as const,
        label: "Collapse",
        description: "Collapse to show fewer commands",
        keywords: ["collapse", "less", "fewer"],
        run: () => {
          setShowAllCommands(false);
        },
      });
      return displayed;
    }
    
    if (allCommands.length <= MAX_DISPLAYED) {
      // Show all commands if there are 5 or fewer
      return allCommands;
    }
    
    // Show first 5 commands + "Show more" button
    const displayed = allCommands.slice(0, MAX_DISPLAYED);
    const remainingCount = allCommands.length - MAX_DISPLAYED;
    
    displayed.push({
      id: "show-more-commands",
      kind: "help" as const,
      label: `Show ${remainingCount} more`,
      description: "Expand to see all commands",
      keywords: ["more", "expand", "show"],
      run: () => {
        setShowAllCommands(true);
      },
    });
    
    return displayed;
  }, [allCommands, showAllCommands]);

  // Reset active index when commands change
  React.useEffect(() => {
    setActiveIndex(0);
  }, [commands.length]);

  // Reset showAllCommands when input changes
  React.useEffect(() => {
    setShowAllCommands(false);
  }, [input]);

  // Focus input when palette opens
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Calculate position with viewport clamping (as per Phase 10 requirements)
  const clampedPosition = React.useMemo(() => {
    // Guard against SSR - window is not available on the server
    if (typeof window === "undefined") {
      return { x: 0, y: 0 };
    }

    if (!palettePosition) {
      return { x: window.innerWidth / 2, y: window.innerHeight / 3 };
    }

    const width = 400;   // approximate palette width
    const height = 260;  // approximate palette height
    const margin = 16;

    let x = palettePosition.x;
    let y = palettePosition.y;

    if (x + width + margin > window.innerWidth) {
      x = window.innerWidth - width - margin;
    }
    if (y + height + margin > window.innerHeight) {
      y = window.innerHeight - height - margin;
    }
    if (x < margin) x = margin;
    if (y < margin) y = margin;

    return { x, y };
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
        
        // If user has typed something but no commands match, open inline chat
        if (input.trim().length > 0 && allCommands.length === 0) {
          const position = palettePosition
            ? {
                x: palettePosition.x + 20,
                y: palettePosition.y + 20,
              }
            : undefined;
          inlineChat.openInlineChat({
            question: input.trim(),
            pagePath: pathname ?? undefined,
            projectSlug: projectSlug ?? null,
            position,
          });
          closePalette();
        } else if (commands[activeIndex]) {
          const command = commands[activeIndex];
          command.run(ctx);
          // Note: closePalette() is called inside openAiModal/openInlineChat for ai commands
          // Only close for non-AI commands (nav, download, help)
          if (command.kind !== "ai_deep" && command.kind !== "ai_quick") {
            closePalette();
          }
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        closePalette();
      }
    },
    [commands, allCommands, activeIndex, ctx, closePalette, input, pathname, projectSlug, palettePosition, inlineChat]
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
      command.run(ctx);
      // Note: closePalette() is called inside openAiModal/openInlineChat for ai commands
      // Only close for non-AI commands (nav, download, help)
      if (command.kind !== "ai_deep" && command.kind !== "ai_quick") {
        closePalette();
      }
    },
    [ctx, closePalette]
  );

  // Handle drag start - matches InlineChatWindow pattern
  const handleMouseDown = React.useCallback(
    (event: React.MouseEvent) => {
      // Only start drag if clicking on the header area (not buttons or content)
      const target = event.target as HTMLElement;
      if (target.tagName === "BUTTON" || target.closest("button") || target.tagName === "INPUT" || target.closest("input")) {
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

      const setPos = setPalettePositionRef.current;
      if (typeof setPos !== "function") {
        return;
      }

      const newX = event.clientX - dragStartPos.current.x;
      const newY = event.clientY - dragStartPos.current.y;

      // Clamp to viewport with margin
      const paletteWidth = 400;
      const paletteHeight = 500;
      const margin = 16;
      const clampedX = Math.max(margin, Math.min(newX, window.innerWidth - paletteWidth - margin));
      const clampedY = Math.max(margin, Math.min(newY, window.innerHeight - paletteHeight - margin));

      setPos({ x: clampedX, y: clampedY });
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
  }, [isDragging]);

  // Animation state for smooth open/close
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackgroundClick = () => {
    closePalette();
  };

  const paletteContent = (
    <div
      className="fixed inset-0 z-50 pointer-events-none"
      onClick={handleBackgroundClick}
    >
      <div
        ref={containerRef}
        className={cn(
          "absolute pointer-events-auto flex flex-col gap-2 min-w-[320px] max-w-[420px]",
          "transition-all duration-[180ms] ease-[cubic-bezier(0.33,1,0.68,1)]",
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}
        style={{
          top: `${clampedPosition.y}px`,
          left: `${clampedPosition.x}px`,
          cursor: isDragging ? "grabbing" : "default",
        }}
        onKeyDown={handleKeyDown}
        onMouseDown={handleMouseDown}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pill input */}
        <div className="rounded-full border border-[color:var(--border-subtle)] bg-background/80 backdrop-blur-sm shadow-sm px-4 py-2 flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Cmd+K
          </span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground"
            placeholder="Ask or search…"
          />
          <button
            type="button"
            onClick={closePalette}
            className="flex items-center justify-center size-4 text-muted-foreground hover:text-[color:var(--text-default)] transition-colors cursor-pointer"
            aria-label="Close command palette"
          >
            <X className="size-3" />
          </button>
        </div>

        {/* Actions grid */}
        {commands.length > 0 && (
          <div className="grid grid-cols-3 gap-3 auto-rows-auto">
            {commands.map((command, index) => {
              const isShowMore = command.id === "show-more-commands";
              const isCollapse = command.id === "collapse-menu";
              const isResume = command.id === "download-resume";
              const label = command.label;
              
              // Determine column span based on text length
              // Rough estimate: ~12-15 characters per column at text-sm
              const getColumnSpan = (text: string): number => {
                const length = text.length;
                if (length <= 15) return 1;
                if (length <= 30) return 2;
                return 3; // Max span for very long text
              };
              
              const columnSpan = getColumnSpan(label);
              
              return (
                <Button
                  key={command.id}
                  variant="outline"
                  isActive={index === activeIndex}
                  onClick={() => {
                    if (isShowMore) {
                      setShowAllCommands(true);
                    } else if (isCollapse) {
                      setShowAllCommands(false);
                    } else {
                      handleCommandClick(command);
                    }
                  }}
                  className={cn(
                    "justify-center text-center",
                    columnSpan === 2 && "col-span-2",
                    columnSpan === 3 && "col-span-3",
                    (isShowMore || isCollapse) && "opacity-70 italic"
                  )}
                  style={columnSpan > 1 ? { gridColumn: `span ${columnSpan}` } : undefined}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <span className="font-medium text-sm whitespace-nowrap flex items-center gap-1.5">
                    {isResume && <Download className="size-3" />}
                    {label}
                  </span>
                </Button>
              );
            })}
          </div>
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

