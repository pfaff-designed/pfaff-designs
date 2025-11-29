"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Input } from "@/components/atoms/Input";
import { filterCommands, createCommandContext, type Command } from "@/lib/cmdk";
import { cn } from "@/lib/utils";
import type { UseCommandPaletteReturn } from "@/lib/cmdk/useCommandPalette";

export interface CommandPaletteProps {
  palette: UseCommandPaletteReturn;
}

/**
 * CommandPalette
 * 
 * Atlas-style command palette that appears near the cursor when Cmd+K is pressed.
 * Renders a pill-shaped input with a filtered list of commands.
 */
export function CommandPalette({ palette }: CommandPaletteProps) {
  const { isOpen, palettePosition, input, setInput, closePalette } = palette;
  const pathname = usePathname();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

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

  // Create CommandContext
  const ctx = React.useMemo(
    () =>
      createCommandContext(input, pathname ?? "", {
        projectSlug: projectSlug ?? null,
        selectionText: undefined,
        sectionHeadline: undefined,
        sectionText: undefined,
      }),
    [input, pathname, projectSlug]
  );

  // Filter commands based on input
  const commands = React.useMemo(() => filterCommands(input, ctx), [input, ctx]);

  // Reset active index when commands change
  React.useEffect(() => {
    setActiveIndex(0);
  }, [commands.length]);

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
        if (commands[activeIndex]) {
          commands[activeIndex].run(ctx);
          closePalette();
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
      command.run(ctx);
      closePalette();
    },
    [ctx, closePalette]
  );

  if (!isOpen) return null;

  const paletteContent = (
    <div
      ref={containerRef}
      className="fixed z-50 flex flex-col bg-[color:var(--bg-default)] border border-[color:var(--border-subtle)] rounded-lg shadow-lg min-w-[400px] max-w-[600px] max-h-[500px] overflow-hidden"
      style={position}
      onKeyDown={handleKeyDown}
    >
      {/* Input */}
      <div className="p-3 border-b border-[color:var(--border-subtle)]">
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
            {commands.map((command, index) => (
              <li key={command.id}>
                <button
                  type="button"
                  onClick={() => handleCommandClick(command)}
                  className={cn(
                    "w-full px-4 py-2 text-left text-sm transition-colors",
                    "hover:bg-[color:var(--state-hover)] focus:bg-[color:var(--state-hover)] focus:outline-none",
                    index === activeIndex && "bg-[color:var(--state-hover)]",
                    "text-[color:var(--text-default)]"
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <div className="font-medium">{command.label}</div>
                  {command.description && (
                    <div className="text-xs opacity-70 mt-0.5">{command.description}</div>
                  )}
                </button>
              </li>
            ))}
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

