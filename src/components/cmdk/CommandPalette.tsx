"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { filterCommands, createCommandContext, type Command } from "@/lib/cmdk";
import type { UseCommandPaletteReturn } from "@/lib/cmdk/useCommandPalette";
import type { UseInlineChatReturn } from "@/lib/inline-chat/useInlineChat";

// Feature flag: Set to false to disable inline chat and use AI modal instead
const ENABLE_INLINE_CHAT = false;
import { useAiModal } from "@/components/ai-modal/AiModalContext";
import { motion } from "framer-motion";
import { CommandPaletteContainer } from "./CommandPaletteContainer";
import { CommandPaletteContent } from "./CommandPaletteContent";

export interface CommandPaletteProps {
  palette: UseCommandPaletteReturn;
  inlineChat: UseInlineChatReturn;
}

/**
 * CommandPalette
 *
 * Global command palette that appears when Cmd+K is pressed.
 * Renders a pill-shaped input with a filtered list of commands, plus a persistent
 * pill that appears across all pages to open the palette.
 * 
 * Composed of CommandPaletteContainer (positioning/animation) and CommandPaletteContent (UI).
 */
export function CommandPalette({
  palette,
  inlineChat,
}: CommandPaletteProps) {
  const {
    isOpen,
    input,
    setInput,
    closePalette,
    openPalette,
  } = palette;

  const pathname = usePathname();
  const router = useRouter();
  const { openAiModal, isOpen: isAiModalOpen } = useAiModal();

  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [activeIndex, setActiveIndex] = React.useState(0);

  const [showAllCommands, setShowAllCommands] = React.useState(false);
  const [showQuickActions, setShowQuickActions] = React.useState(false);

  // Hover state for the persistent pill
  const [pillHover, setPillHover] = React.useState(false);
  // Track if pill was hovered when clicked, to start animation from correct width
  const [startFromHover, setStartFromHover] = React.useState(false);

  // Extract projectSlug from pathname (same logic as AiKeyboardShortcut)
  const projectSlug = React.useMemo(() => {
    const projectSlugMatch = pathname?.match(/^\/work\/([^/]+)/);
    if (projectSlugMatch) {
      let slug = projectSlugMatch[1];
      // Normalize PMI paths
      if (
        slug === "pmi" ||
        slug === "pmi-agile" ||
        slug === "pmi-acp" ||
        slug.startsWith("pmi-")
      ) {
        slug = "pmi";
      }
      return slug;
    }
    return undefined;
  }, [pathname]);

  // Command context wires up inline chat, AI modal, navigation, and downloads
  const ctx = React.useMemo(
    () =>
      createCommandContext(input, pathname ?? "", {
        projectSlug: projectSlug ?? null,
        selectionText: undefined,
        sectionHeadline: undefined,
        sectionText: undefined,
        openInlineChat: (args) => {
          if (ENABLE_INLINE_CHAT) {
            // Position inline chat near the command palette (bottom center)
            const position = typeof window !== "undefined"
              ? {
                  x: window.innerWidth / 2,
                  y: window.innerHeight - 100,
                }
              : undefined;

            inlineChat.openInlineChat({
              ...args,
              pagePath: pathname ?? undefined,
              projectSlug: projectSlug ?? null,
              position,
            });
          } else {
            // Use AI modal instead
            closePalette();
            openAiModal({
              question: args.question,
              pagePath: pathname ?? undefined,
              projectSlug: projectSlug ?? undefined,
              sectionText: args.selectionText ?? args.sectionText,
            });
          }
        },
        openAiModal: (args) => {
          // Close the palette before opening the modal
          closePalette();

          const effectivePagePath =
            args.pagePath ?? (pathname ? pathname : undefined);
          const effectiveProjectSlug =
            args.projectSlug ?? (projectSlug ? projectSlug : undefined);

          openAiModal({
            question: args.question,
            pagePath: effectivePagePath,
            projectSlug: effectiveProjectSlug,
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
            window.open(path, "_blank");
          } else {
            const link = document.createElement("a");
            link.href = path;
            link.download = path.split("/").pop() || "download";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        },
      }),
    [
      input,
      pathname,
      projectSlug,
      closePalette,
      inlineChat,
      openAiModal,
      router,
    ],
  );

  // Filter commands based on input
  const allCommands = React.useMemo(() => {
    return filterCommands(input, ctx);
  }, [input, ctx]);

  // Determine displayed commands (max 6: 5 commands + "Show more")
  const commands = React.useMemo(() => {
    const MAX_DISPLAYED = 5;

    if (showAllCommands) {
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
      return allCommands;
    }

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


  // Keyboard navigation
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

        if (input.trim().length > 0 && allCommands.length === 0) {
          // No matching commands: fall back to AI modal (inline chat disabled)
          closePalette();
          if (ENABLE_INLINE_CHAT) {
            const position = typeof window !== "undefined"
              ? {
                  x: window.innerWidth / 2,
                  y: window.innerHeight - 100,
                }
              : undefined;

            inlineChat.openInlineChat({
              question: input.trim(),
              pagePath: pathname ?? undefined,
              projectSlug: projectSlug ?? null,
              position,
            });
          } else {
            openAiModal({
              question: input.trim(),
              pagePath: pathname ?? undefined,
              projectSlug: projectSlug ?? undefined,
            });
          }
        } else if (commands[activeIndex]) {
          const command = commands[activeIndex];
          command.run(ctx);

          // closePalette() is called inside openAiModal/openInlineChat for AI commands
          if (command.kind !== "ai_deep" && command.kind !== "ai_quick") {
            closePalette();
          }
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        closePalette();
      }
    },
    [
      commands,
      allCommands,
      activeIndex,
      ctx,
      closePalette,
      input,
      pathname,
      projectSlug,
      inlineChat,
    ],
  );

  // Command click handler
  const handleCommandClick = React.useCallback(
    (command: Command) => {
      command.run(ctx);
      if (command.kind !== "ai_deep" && command.kind !== "ai_quick") {
        closePalette();
      }
    },
    [ctx, closePalette],
  );


  // Show/hide quick actions based on animation lifecycle
  React.useEffect(() => {
    if (!isOpen) {
      setShowQuickActions(false);
      // Reset startFromHover when palette closes
      setStartFromHover(false);
    }
  }, [isOpen]);

  // Hide command palette when AI modal is open
  const shouldShowPalette = isOpen && !isAiModalOpen;

  // Persistent pill - appears on all pages when palette is closed
  if (!isOpen) {
    // Hide persistent pill when AI modal is open
    if (isAiModalOpen) {
      return null;
    }
    return (
      <div className="sticky bottom-6 z-50 pointer-events-auto w-full flex justify-center">
        <motion.button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            // Capture hover state at click time to start animation from correct width
            setStartFromHover(pillHover);

            // Open palette (always opens at bottom center)
            openPalette();
          }}
          className="rounded-full border border-[color:var(--border-subtle)] bg-background/80 backdrop-blur-sm shadow-sm px-4 py-2 flex items-center gap-2 hover:bg-background/90 transition-colors flex-shrink-0 h-[2.5rem]"
          aria-label="Open command palette"
          initial={false}
          animate={{
            width: pillHover ? 240 : 200,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
          style={{ originX: 0.5 }}
          onHoverStart={() => setPillHover(true)}
          onHoverEnd={() => setPillHover(false)}
        >
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground whitespace-nowrap">
            Cmd+K
          </span>
          <span className="text-sm text-[color:var(--text-default)] whitespace-nowrap">
            Ask or search…
          </span>
        </motion.button>
      </div>
    );
  }

  return (
    <CommandPaletteContainer
      ref={containerRef}
      isOpen={shouldShowPalette}
      onClose={closePalette}
    >
      <CommandPaletteContent
        isOpen={shouldShowPalette}
        input={input}
        onInputChange={setInput}
        onClose={closePalette}
        commands={commands}
        activeIndex={activeIndex}
        onActiveIndexChange={setActiveIndex}
        showQuickActions={showQuickActions}
        onShowQuickActionsChange={setShowQuickActions}
        onCommandClick={handleCommandClick}
        showAllCommands={showAllCommands}
        onShowAllCommandsChange={setShowAllCommands}
        initialWidth={startFromHover ? 240 : 200}
        inputRef={inputRef}
        onKeyDown={handleKeyDown}
      />
    </CommandPaletteContainer>
  );
}

