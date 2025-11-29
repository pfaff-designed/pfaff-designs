# Phase 10.2 — CommandPalette Shell (Minimal UI)
Updated to Deprecate Cmd+K → Modal and Use Existing Input Styles

## 🎯 Goal
Build the **first functional UI** for the Cmd+K Atlas-style command palette.

This phase:
- Replaces the old behavior where **Cmd+K opens the AI modal**.
- Introduces a **pill-shaped floating input** near the cursor using the **existing input styling patterns** from the site.
- Wires the palette to the **Phase 10.1 command engine** (`Command`, `CommandContext`, `commandRegistry`, `filterCommands`).
- Does **not** implement inline chat or modal wiring yet (that’s 10.3–10.4).

---

## 0. Deprecate Old Cmd+K → Modal Behavior

### Requirements
1. Find wherever **Cmd+K currently opens the AI modal** (e.g. a global keydown handler or shortcut hook).
2. Remove / disable that behavior.
3. Ensure **Cmd+K now exclusively opens the new CommandPalette** (defined in this phase).

> After this phase, the only thing Cmd+K should do is open the command palette.

---

## 1. Global Command Palette State & Hook

Create a hook to manage palette state and keyboard shortcut handling.

### File
`src/lib/cmdk/useCommandPalette.ts`

### Responsibilities
- Track:
  - `isOpen: boolean`
  - `cursorPosition: { x: number; y: number } | null`
  - `input: string`
- Provide:
  - `openPalette(opts?: { x?: number; y?: number; initialInput?: string })`
  - `closePalette()`
  - `togglePalette()`
  - `setInput(value: string)`
- Install a **global keydown listener** for Cmd+K / Ctrl+K:
  - Prevent default browser behavior.
  - Use the **last known mouse position** as the default spawn point.

### Implementation Notes
- Track the last mouse position with a `mousemove` listener attached once at app level (or inside the hook with a layout effect).
- If no cursor position is known, default to a reasonable center-of-screen position.

---

## 2. `CommandPalette` React Component

### File
`src/components/cmdk/CommandPalette.tsx`

### Responsibilities
- Render **nothing** when `isOpen === false`.
- When open:
  - Render a **portal** overlay (top layer) containing the pill-shaped input + command list.
  - Position the input near `cursorPosition` (`style={{ top, left }}`) with some safety clamps so it doesn’t go off-screen.
  - Render:
    - An input field
    - A scrollable list of matching commands from `filterCommands(input, ctx)`
    - A highlighted “active” command (for keyboard navigation)

### Styling Requirements
- Reuse existing input styles for visual consistency:
  - Use the same Tailwind/shadcn patterns as your current text inputs (border radius, font, padding, colors).
- Wrap the input in a pill-like container by adjusting radius & padding:
  - e.g. `rounded-full`, `shadow-md`, `border` consistent with current design system.
- Support dark mode if already present in the app.

> The pill should visually feel like a sibling of your current inputs, not a brand new visual style.

---

## 3. Wiring to the Command Engine

Use the **Phase 10.1** pieces:
- `Command`
- `CommandContext`
- `commandRegistry`
- `filterCommands(input, ctx)`

### Steps
1. Construct a `CommandContext` instance inside `CommandPalette` using:
   - `path` from Next.js router (`usePathname()`)
   - `projectSlug` if available from your existing context/route
   - `selectionText`, `sectionHeadline`, `sectionText` can be stubbed as `undefined` for now
   - `openAiModal`, `openInlineChat`, `navigate`, `download` should call through to the stubbed implementations in 10.1 (for now they can still `console.log`)
2. Call `filterCommands(input, ctx)` whenever the input text changes.
3. Render the returned commands as a vertical list.

---

## 4. Keyboard & Interaction Behavior

Inside `CommandPalette`:

- Maintain `activeIndex` state.
- Keyboard handling when the palette is open:
  - **ArrowDown** → move `activeIndex` down (clamp to list length)
  - **ArrowUp** → move `activeIndex` up (clamp to 0)
  - **Enter** → execute `commands[activeIndex].run(ctx)`
  - **Escape** → `closePalette()`

### Click Behavior
- Clicking on a command row should:
  - Execute `command.run(ctx)`
  - Close the palette

### Closing Rules
- Palette closes on:
  - ESC key
  - Clicking outside the palette
  - Successful command execution

---

## 5. Integration in the App Shell

Render the `CommandPalette` **once** at a high level (e.g. in `layout.tsx` or a root provider component), using the hook.

Example pattern:

```tsx
export function AppShell({ children }: { children: React.ReactNode }) {
  const palette = useCommandPalette();

  return (
    <>
      {children}
      <CommandPalette palette={palette} />
    </>
  );
}
```

Alternatively, if you already have a global provider or layout for the AI modal, colocate the palette there.

---

## 6. Behavior Expectations (Post-10.2)

After this phase:

- Pressing **Cmd+K** (or Ctrl+K on Windows) should:
  - Open the command palette pill near the cursor.
  - Focus the input.
- Typing should filter commands in real time.
- Arrow keys and Enter should let you select and execute commands.
- Executing a command should log to the console (for now) via the `run(ctx)` implementations from Phase 10.1.
- The old behavior where Cmd+K opens the AI modal should be **fully removed**.

---

## ✅ Acceptance Checklist

Before stopping, verify:

- [ ] Old Cmd+K → AI modal shortcut is fully removed.
- [ ] Cmd+K now opens the new CommandPalette.
- [ ] The pill input visually matches existing input styles (same border, radius, typography, colors).
- [ ] The palette appears near the cursor and never renders off-screen.
- [ ] Commands are filtered via `filterCommands(input, ctx)`.
- [ ] Arrow keys move the active selection; Enter executes.
- [ ] ESC and outside clicks close the palette.
- [ ] No TypeScript errors.
- [ ] No regressions in existing AI modal behavior when opened via its own UI.

Make these changes now.