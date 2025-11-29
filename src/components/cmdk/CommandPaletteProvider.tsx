"use client";

import * as React from "react";
import { CommandPalette } from "./CommandPalette";
import { useCommandPalette } from "@/lib/cmdk/useCommandPalette";

/**
 * CommandPaletteProvider
 * 
 * Client component wrapper that provides the CommandPalette hook and renders the palette.
 * This is needed because layout.tsx is a server component.
 */
export function CommandPaletteProvider() {
  const palette = useCommandPalette();
  return <CommandPalette palette={palette} />;
}

