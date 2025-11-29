# Testing Guide for Phase 10.2 — CommandPalette Shell

## Quick Start

1. Start the dev server:
```bash
npm run dev
```

2. Open your browser and navigate to any page (e.g., `http://localhost:3000`)

3. Press **Cmd+K** (Mac) or **Ctrl+K** (Windows/Linux)

---

## ✅ Manual Testing Checklist

### 1. Basic Functionality

- [ ] **Cmd+K opens the palette**
  - Press Cmd+K (or Ctrl+K)
  - Palette should appear near your cursor
  - Input should be focused automatically

- [ ] **Palette positioning**
  - Move your mouse to different positions
  - Press Cmd+K
  - Palette should appear near the cursor (20px offset)
  - Palette should never render off-screen (test near edges)

- [ ] **Default position**
  - Clear browser cache/localStorage if needed
  - Press Cmd+K without moving mouse first
  - Palette should appear at center of screen

### 2. Command Filtering

- [ ] **Type "home"**
  - Should show "Go to Home" command
  - Should be highlighted (active)

- [ ] **Type "work"**
  - Should show "Go to Work" command

- [ ] **Type "capital"**
  - Should show "Go to Capital One Travel" command

- [ ] **Type "summarize"**
  - Should show summarize-related commands (if on a page with selection)

- [ ] **Type "xyz123"** (no matches)
  - Should show only the "Show available actions" (help) command

- [ ] **Clear input**
  - Backspace to clear
  - Should show all commands

### 3. Keyboard Navigation

- [ ] **Arrow Down**
  - Press Arrow Down
  - Active command should move down
  - Should stop at last command

- [ ] **Arrow Up**
  - Press Arrow Up
  - Active command should move up
  - Should stop at first command

- [ ] **Enter**
  - Navigate to a command with arrows
  - Press Enter
  - Command should execute (check console for log)
  - Palette should close

- [ ] **Escape**
  - Press Escape
  - Palette should close
  - Input should be cleared

### 4. Mouse Interaction

- [ ] **Hover over command**
  - Hover over a command
  - That command should become active (highlighted)

- [ ] **Click command**
  - Click on a command
  - Command should execute (check console)
  - Palette should close

- [ ] **Click outside**
  - Click anywhere outside the palette
  - Palette should close

### 5. Visual Design

- [ ] **Input styling**
  - Input should have pill shape (`rounded-full`)
  - Should match existing input styles (border, colors, typography)
  - Should use design system CSS variables

- [ ] **Palette container**
  - Should have shadow
  - Should have border using design system colors
  - Should have rounded corners

- [ ] **Active command highlight**
  - Active command should have background color
  - Should use `var(--state-hover)` color

- [ ] **Command list**
  - Should be scrollable if many commands
  - Should show command label and description

### 6. Edge Cases

- [ ] **Type in input/textarea**
  - Focus an input field on the page
  - Press Cmd+K
  - Should NOT open palette (should allow normal typing)

- [ ] **Multiple rapid Cmd+K presses**
  - Press Cmd+K multiple times quickly
  - Should toggle open/close smoothly

- [ ] **Long command names**
  - Commands with long labels should wrap properly

- [ ] **Many matching commands**
  - Type a common letter like "a"
  - Should show scrollable list
  - Should be able to scroll and navigate

### 7. Context Awareness

- [ ] **On homepage (`/`)**
  - Press Cmd+K
  - Type "capital"
  - Should show Capital One command
  - Execute it
  - Should navigate to `/work/capital-one-travel`

- [ ] **On project page (`/work/capital-one-travel`)**
  - Press Cmd+K
  - Context should include `projectSlug: "capital-one-travel"`
  - Commands should work correctly

- [ ] **On PMI page (`/work/pmi` or `/work/pmi-agile`)**
  - Press Cmd+K
  - Context should normalize to `projectSlug: "pmi"`

### 8. Regression Testing

- [ ] **AI Modal still works**
  - Click on AI hover pill (if available)
  - Click on floating AI button (mobile)
  - AI modal should still open correctly
  - Cmd+K should NOT open AI modal anymore

- [ ] **Other keyboard shortcuts**
  - Test other browser shortcuts
  - Should not interfere

---

## Console Verification

When testing, check the browser console for:

1. **Command execution logs:**
   - `[CommandContext] navigate /work/capital-one-travel`
   - `[CommandContext] openAiModal {...}`
   - `[CommandContext] download /downloads/charles-pfaff-resume.pdf`

2. **No errors:**
   - Should not see React errors
   - Should not see TypeScript errors
   - Should not see portal rendering errors

---

## Test Scenarios

### Scenario 1: Navigate to a Project
1. Press Cmd+K
2. Type "capital"
3. Press Enter
4. **Expected:** Navigate to `/work/capital-one-travel` (check console log)

### Scenario 2: Quick Navigation
1. Press Cmd+K
2. Type "home"
3. Press Enter
4. **Expected:** Navigate to `/` (check console log)

### Scenario 3: No Matches
1. Press Cmd+K
2. Type "zzzzz"
3. **Expected:** Show only help command
4. Press Enter
5. **Expected:** Execute help command (check console log)

### Scenario 4: Keyboard Navigation
1. Press Cmd+K
2. Press Arrow Down 3 times
3. **Expected:** Active command moves down
4. Press Arrow Up 2 times
5. **Expected:** Active command moves up
6. Press Enter
7. **Expected:** Execute active command

### Scenario 5: Mouse + Keyboard Hybrid
1. Press Cmd+K
2. Hover over a command
3. **Expected:** That command becomes active
4. Press Arrow Down
5. **Expected:** Next command becomes active
6. Click on a command
7. **Expected:** Execute clicked command

---

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)

---

## Mobile Testing (Optional)

- [ ] Touch devices may not have Cmd+K
- [ ] Verify palette doesn't break on mobile viewports
- [ ] Verify positioning works on smaller screens

---

## Performance Checks

- [ ] **Opening palette**
  - Should appear instantly (< 100ms)
  - No jank or layout shift

- [ ] **Filtering commands**
  - Typing should filter instantly
  - No lag with many commands

- [ ] **Mouse tracking**
  - Should not cause performance issues
  - Should not lag when moving mouse

---

## Common Issues to Watch For

1. **Palette appears off-screen**
   - Check position calculation logic
   - Verify safety clamps work

2. **Input not focused**
   - Check `useEffect` for focus logic
   - Verify input ref is set correctly

3. **Commands not filtering**
   - Check `filterCommands` is called
   - Verify `CommandContext` is constructed correctly

4. **Keyboard navigation not working**
   - Check event handlers
   - Verify `activeIndex` state updates

5. **Portal not rendering**
   - Check `createPortal` usage
   - Verify `document.body` exists

---

## Quick Test Script

Run this in the browser console to verify the hook is working:

```javascript
// Check if CommandPalette is mounted
document.querySelector('[class*="CommandPalette"]') !== null

// Check if mousemove listener is active
// (Move mouse and check if cursor position updates)
```

---

## Success Criteria

Phase 10.2 is complete when:

✅ Cmd+K opens CommandPalette (not AI modal)  
✅ Palette appears near cursor  
✅ Commands filter as you type  
✅ Arrow keys navigate, Enter executes  
✅ ESC and outside clicks close palette  
✅ Visual design matches existing inputs  
✅ No TypeScript errors  
✅ No regressions in AI modal  

---

## Next Steps After Testing

If all tests pass, you're ready for:
- **Phase 10.3** — Wire commands to actual actions (navigate, open AI modal, etc.)
- **Phase 10.4** — Inline chat integration
- **Phase 10.5** — Unsupported query suggestions

