You are working in the `pfaff-designs` repo on the Command Palette UI.

## Goal

Fix a mobile overflow bug in the Command Palette so that:

- On small screens (mobile), the palette **never expands beyond the viewport width**.
- There is **no horizontal scrolling** when the palette is open.
- The palette remains **centered** horizontally, with a comfortable margin from the viewport edges.
- Existing **desktop behavior and animations** must stay intact.
- Existing **height clamping** (`max-height: calc(100vh - 96px)`) must remain in place.

Right now, on mobile:

- When the Command Palette opens, the UI is centered correctly.
- But the **palette content (input + quick actions) can be wider than the viewport**, causing horizontal overflow.
- This is especially noticeable when the quick action buttons wrap in odd ways.
- This behavior does **not** occur on desktop.

## Relevant components

Start by inspecting these files:

- `src/components/organisms/CommandPalette/CommandPaletteContent.tsx`
- `src/components/organisms/CommandPalette/CommandPaletteHost.tsx` (or similar host/portal file that mounts the palette overlay)
- Any shared layout wrapper used specifically for the Command Palette (e.g. a container inside the host).

Current `CommandPaletteContent` root element looks like this (for reference):

```tsx
return (
  <div
    ref={ref}
    onKeyDown={onKeyDown}
    className="flex flex-col w-full max-w-[40rem] sm:max-w-none"
    style={{
      maxHeight: "calc(100vh - 96px)",
      overflowY: "auto",
    }}
  >
    {/* ... */}
  </div>
);
```

The animated input container currently has:

```tsx
<motion.div
  key="palette-input"
  className={cn(
    "rounded-full border border-[color:var(--accent-primary)]",
    "bg-[color:var(--bg-default)] shadow-sm",
    "overflow-hidden",
    "px-4 py-2 flex items-center justify-center gap-2 h-[2.5rem]",
    "w-full",
  )}
  initial={{
    width: "100%",
    scale: 0.8,
    opacity: 0,
  }}
  animate={{ width: "100%", scale: 1, opacity: 1 }}
  exit={{ width: "100%", scale: 0.8, opacity: 0 }}
  transition={{
    type: "spring",
    stiffness: 260,
    damping: 24,
  }}
  style={{
    originX: 0.5,
    flexShrink: 0,
    maxWidth: "400px",
  }}
  onAnimationComplete={handleAnimationComplete}
>
  {/* input + submit button */}
</motion.div>
```

## Requirements

### 1. Mobile width clamping

On mobile/small screens:

- The **entire palette container** (including quick actions grid) must be constrained to the viewport width **minus a small horizontal margin**.
- Use a **responsive max width** that:
  - Clamps to `100vw - 2rem` (or similar) on mobile.
  - Preserves the existing 40rem-ish max width for larger screens.

Concretely, update the root wrapper and/or host so that on small screens:

- It uses something like:

  - `w-full`
  - `max-w-[min(100vw-2rem,40rem)]` (or equivalent Tailwind utility)
  - `mx-auto`
  - `px-4` on mobile, no extra padding on larger screens.

- The goal is: **no horizontal scroll**, palette remains centered, and it feels like a “pill” floating comfortably inside the viewport.

Do **not** re-introduce the bug where the palette jumps sideways or “snaps” to the left when opening.

### 2. Quick actions + grid behavior

The quick actions section currently uses a `grid grid-cols-3 gap-3 w-full` layout.

You should:

- Keep the overall layout and behavior (3 columns, wrapping, show-more/collapse row, etc.).
- Ensure that **grid children never force the container to be wider than the clamped width**.
- If needed, allow labels to wrap or shrink slightly on very small screens, instead of stretching the container.

It is acceptable to:

- Add mobile-specific constraints to button text (`text-xs` on very small screens, for example).
- Allow multi-line labels when necessary instead of forcing `whitespace-nowrap` everywhere.
- Add `overflow-x-hidden` to the palette container as a last-resort guardrail, but the primary fix should be **correct width constraints**, not just hiding overflow.

### 3. Preserve existing behavior

Do **not**:

- Change routing or keyboard shortcuts.
- Change the open/close logic for the Command Palette.
- Change the height clamping behavior (`max-height: calc(100vh - 96px)`).
- Break any desktop layouts.

Do:

- Keep the animation feel (spring, scale, fade) the same.
- Keep the pill-like shape and visual styling.
- Keep the current order of special commands (show more / collapse) and regular commands.

### 4. Implementation steps

1. Inspect the Command Palette host to see how it is positioned (likely fixed/absolute in the viewport).
2. Introduce a **responsive width clamp** at the **highest appropriate container** for the palette (likely inside the host, wrapping `CommandPaletteContent`).
3. Adjust `CommandPaletteContent`’s root div so it:
   - Uses `w-full` consistently.
   - Uses a **responsive max width** that clamps on mobile (see above).
   - Applies horizontal padding on mobile (`px-4`) to keep the pill from touching the edges.
4. If necessary, tweak the quick actions grid/button text styles so they do not create overflow on very narrow viewports.
5. Verify:
   - Mobile: iPhone-ish viewport in devtools with the palette open, no horizontal scroll, no width overflow, still centered.
   - Desktop: behavior unchanged, still looks and feels like before, no regressions to centering or animation.

### 5. Testing

- Use the browser devtools responsive mode to test multiple viewport widths (e.g., 320px, 375px, 414px).
- Confirm:
  - No horizontal scrollbar appears when the palette is open.
  - The palette width is visually clamped with some breathing room from the edges.
  - Quick actions grid wraps gracefully and doesn’t push the layout wider.

When you’re done:

- Summarize the exact changes you made (files + className/style updates).
- Call out any tradeoffs you had to make specifically for very small viewports.
