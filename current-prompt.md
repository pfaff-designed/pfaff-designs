# Phase 10.3b — Inline Chat Polish (Animations, Clamping, Hierarchy)

## 🎯 Goal  
Enhance the Phase 10.3 inline chat window with animations, UI polish, viewport clamping, and better interaction patterns — without adding new functional features.  
This is UX refinement only.

After this phase:

- The inline chat window pops in smoothly and fades out.
- It clamps to the viewport edges.
- It has a clear visual hierarchy (header, question, answer).
- It supports ESC + click‑outside to close.
- It is draggable (already implemented — retain this).
- It appears offset from the CommandPalette anchor.
- All existing logic from 10.3 stays intact.

---

# 1. Add Smooth Open + Close Animations

### Requirements:
- The window should animate **on mount**:
  - Opacity: `0 → 100`
  - Scale: `0.96 → 1.00`
  - Duration: ~150–200ms
- On close:
  - Fade out (`opacity 100 → 0`)
  - Then unmount

### Implementation:
Wrap the chat window in a small internal state to drive “visible/not visible”:

```ts
const [isVisible, setIsVisible] = useState(false);

useEffect(() => {
  if (state.isOpen) {
    requestAnimationFrame(() => setIsVisible(true));
  } else {
    setIsVisible(false);
  }
}, [state.isOpen]);
```

### Tailwind classes:
```
transition-all duration-200
transform
opacity-0 scale-95
&.visible {
  opacity-100 scale-100
}
```

---

# 2. Improve Viewport Clamping

When computing `anchorPosition`, clamp the coordinates so the chat never renders off screen.

### Clamp logic (add inside InlineChatWindow):

```ts
const width = 360;
const height = 400;
const margin = 16;

let x = anchor.x;
let y = anchor.y;

if (x + width + margin > window.innerWidth) {
  x = window.innerWidth - width - margin;
}
if (y + height + margin > window.innerHeight) {
  y = window.innerHeight - height - margin;
}
if (x < margin) x = margin;
if (y < margin) y = margin;
```

Use `x`, `y` for styling.

---

# 3. Clarify Layout Hierarchy (Header, Question, Answer)

### Header:
- Row with:
  - “Quick answer” left‑aligned
  - A tiny badge based on command type (optional for now)
  - Close “×” button right‑aligned

### Body:
- “You asked:” label (small, muted)
- The question text in a small, muted style
- Divider line
- Answer:
  - Plain text only
  - Scrollable if large (`overflow-y-auto`, max height 320px)

---

# 4. ESC + Click‑Outside Close

Add:

- Global ESC listener while `state.isOpen === true`
- Click-outside handler similar to CommandPalette

Clicking outside the window should close it.

---

# 5. Offset Position from CommandPalette

When opening via `openInlineChat`, offset the chat window:

```ts
position: {
  x: palettePosition.x + 20,
  y: palettePosition.y + 20,
}
```

Keep offset constant.

---

# 6. Z‑Index Order (so it renders above palette)

Set:
- `z-50` = CommandPalette
- `z-60` = InlineChatWindow

---

# 7. Existing Functionality Should Not Change

Do NOT modify:

- The command engine
- Any modalGraph logic
- Any deep-question behavior
- Navigation / download commands (still stubbed)
- SelectionText behavior (still `undefined` for now)

---

# 8. Acceptance Checklist

- [ ] Inline chat animates in smoothly (scale + fade)
- [ ] Inline chat fades out gracefully
- [ ] Draggable behavior preserved
- [ ] Chat always clamps within viewport
- [ ] ESC closes it
- [ ] Click‑outside closes it
- [ ] Structured visual hierarchy (header → question → answer)
- [ ] Plain text answer only
- [ ] Renders offset from Cmd+K palette
- [ ] Renders above palette (z‑60)
- [ ] 10.3 functionality preserved without modification

Make these 10.3b polish refinements now.