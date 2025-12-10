# Testing Guide for Phase 10.3 — Inline Chat Window

## Quick Start

1. Start the dev server:
```bash
npm run dev
```

2. Open your browser and navigate to any page (e.g., `http://localhost:3000`)

3. Press **Cmd+K** (Mac) or **Ctrl+K** (Windows/Linux) to open the CommandPalette

4. Type "summarize" and select an `ai_quick` command

---

## ✅ Manual Testing Checklist

### 1. Basic Functionality

- [ ] **Open CommandPalette**
  - Press Cmd+K
  - Palette should appear near cursor

- [ ] **Execute ai_quick command**
  - Type "summarize page" or "summarize"
  - Press Enter on an `ai_quick` command
  - CommandPalette should **close immediately**
  - Inline chat window should **open at offset position** (20px down, 20px right)

- [ ] **Window positioning**
  - Inline chat should appear near where CommandPalette was
  - Should be offset by 20px down and 20px right
  - Should never render off-screen (test near edges)

### 2. Loading State

- [ ] **"Thinking…" appears**
  - After executing command, window should show:
    - Question
    - "Thinking…" text
  - Should not show answer yet

- [ ] **Answer appears**
  - After a few seconds, "Thinking…" should be replaced with answer
  - Answer should be plain text (no markdown formatting)

### 3. Window Content

- [ ] **Header**
  - Should show "Quick answer" title
  - Should have close button ("×")

- [ ] **Question display**
  - Should show the question that was asked
  - Should be clearly labeled "Question:"

- [ ] **Answer display**
  - Should show plain text answer
  - Should be 3-6 sentences (as per system prompt)
  - Should be readable and well-formatted

### 4. Close Behavior

- [ ] **Close button**
  - Click the "×" button
  - Window should close

- [ ] **ESC key**
  - Press ESC while window is open
  - Window should close

- [ ] **Click outside**
  - Click anywhere outside the window
  - Window should close

### 5. All ai_quick Commands

- [ ] **Summarize page**
  - Type "summarize page" in CommandPalette
  - Execute command
  - Should open inline chat with page summary

- [ ] **Summarize selection** (if selectionText is available)
  - Note: Currently stubbed as `undefined` per Phase 10.3 spec
  - Command should still work but won't have selection context

- [ ] **Rewrite selection** (if selectionText is available)
  - Note: Currently stubbed as `undefined` per Phase 10.3 spec
  - Command should still work but won't have selection context

### 6. Visual Design

- [ ] **Styling**
  - Window should use design system colors (CSS variables)
  - Should have rounded corners (`rounded-lg`)
  - Should have shadow (`shadow-lg`)
  - Should have border using `var(--border-subtle)`

- [ ] **Size**
  - Width should be 360px
  - Max height should be 400px
  - Should be scrollable if content exceeds max height

- [ ] **Z-index**
  - Window should appear **above** CommandPalette
  - Uses `z-[60]` (CommandPalette uses `z-50`)

### 7. API Integration

- [ ] **Network request**
  - Open browser DevTools → Network tab
  - Execute an `ai_quick` command
  - Should see POST request to `/api/ai/quick`
  - Request should include:
    - `question`
    - `pagePath` (if available)
    - `projectSlug` (if available)
    - `sectionText` (if available)

- [ ] **Response**
  - Response should be `{ answer: "..." }`
  - Answer should appear in the window

### 8. Error Handling

- [ ] **API error simulation**
  - Temporarily break the API (e.g., wrong endpoint)
  - Execute command
  - Should show fallback message:
    "Something went wrong fetching a quick answer. Try again in a moment."
  - Should log error to console

### 9. CommandPalette Interaction

- [ ] **Palette closes on ai_quick**
  - Execute any `ai_quick` command
  - CommandPalette should close **before** inline chat opens
  - They should **not** appear at the same time

- [ ] **Other commands still work**
  - Execute a navigation command (e.g., "home")
  - Should still work (logs to console for now)
  - CommandPalette should close

### 10. Edge Cases

- [ ] **Rapid commands**
  - Execute multiple `ai_quick` commands quickly
  - Should handle gracefully (no duplicate windows)

- [ ] **Long answers**
  - If answer is very long, window should scroll
  - Should not break layout

- [ ] **Empty question**
  - Commands should use default questions when `ctx.input` is empty
  - Should still work correctly

---

## Console Verification

When testing, check the browser console for:

1. **API calls:**
   - Should see POST to `/api/ai/quick`
   - Should see response with `answer` field

2. **No errors:**
   - Should not see React errors
   - Should not see TypeScript errors
   - Should not see portal rendering errors

3. **Error logging (if API fails):**
   - Should see: `[useInlineChat] Error fetching quick answer: ...`

---

## Test Scenarios

### Scenario 1: Summarize Page
1. Press Cmd+K
2. Type "summarize page"
3. Press Enter
4. **Expected:**
   - CommandPalette closes
   - Inline chat opens at offset position
   - Shows "Thinking…"
   - After ~2-3 seconds, shows page summary

### Scenario 2: Custom Question
1. Press Cmd+K
2. Type "explain this project"
3. Select an `ai_quick` command (if available)
4. **Expected:**
   - Uses your custom question
   - Shows answer based on your question

### Scenario 3: Error Handling
1. Temporarily break `/api/ai/quick` endpoint
2. Execute an `ai_quick` command
3. **Expected:**
   - Shows fallback error message
   - Logs error to console

### Scenario 4: Close Methods
1. Open inline chat
2. Test each close method:
   - Click "×" button → should close
   - Press ESC → should close
   - Click outside → should close

### Scenario 5: Multiple Commands
1. Execute "summarize page"
2. Wait for answer
3. Close window
4. Execute another `ai_quick` command
5. **Expected:**
   - New window opens correctly
   - Previous state doesn't interfere

---

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)

---

## Performance Checks

- [ ] **Opening window**
  - Should appear instantly (< 100ms)
  - No jank or layout shift

- [ ] **API response**
  - Should receive answer within 2-5 seconds
  - No timeout errors

- [ ] **Scrolling**
  - If answer is long, scrolling should be smooth
  - No lag or stutter

---

## Common Issues to Watch For

1. **Window appears in wrong position**
   - Check position calculation logic
   - Verify offset (20px, 20px) is applied correctly
   - Check safety clamps work

2. **Palette doesn't close**
   - Check `closePalette()` is called before `openInlineChat`
   - Verify CommandPalette receives `inlineChat` prop

3. **Answer doesn't appear**
   - Check API response in Network tab
   - Verify `useInlineChat` updates state correctly
   - Check for console errors

4. **Window doesn't close**
   - Check ESC key handler
   - Check click-outside handler
   - Verify `onClose` prop is wired correctly

5. **Z-index issues**
   - Window should be above CommandPalette
   - Check `z-[60]` is applied correctly

6. **Portal not rendering**
   - Check `createPortal` usage
   - Verify `document.body` exists

---

## Quick Test Script

Run this in the browser console to verify the hook is working:

```javascript
// Check if InlineChatWindow is mounted
document.querySelector('[class*="Quick answer"]') !== null

// Check if API endpoint exists
fetch('/api/ai/quick', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ question: 'test' })
}).then(r => r.json()).then(console.log)
```

---

## Success Criteria

Phase 10.3 is complete when:

✅ Cmd+K opens CommandPalette  
✅ Executing `ai_quick` command closes palette and opens inline chat  
✅ Inline chat appears at offset position (20px, 20px)  
✅ Shows "Thinking…" while loading  
✅ Displays plain text answer  
✅ Closes on ESC, click outside, or close button  
✅ All three `ai_quick` commands work  
✅ No TypeScript errors  
✅ No regressions in CommandPalette or AI modal  

---

## Next Steps After Testing

If all tests pass, you're ready for:
- **Phase 10.4** — Wire `ai_deep` commands to AI modal
- **Phase 10.5** — Unsupported query suggestions
- **Phase 10.6** — Text selection tracking (future)

---

## API Testing (Optional)

You can also test the API directly:

```bash
curl -X POST http://localhost:3000/api/ai/quick \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is this portfolio about?",
    "pagePath": "/",
    "sectionText": "This is a test section"
  }'
```

Expected response:
```json
{
  "answer": "This portfolio showcases Charles Pfaff's work as a design engineer..."
}
```

