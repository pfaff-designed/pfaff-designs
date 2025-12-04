# Fallback Prompt Update

## Summary

Updated the copywriter to use a comprehensive fallback prompt when LangSmith is unavailable or down. The fallback now uses the full system prompt from `current-prompt.md`.

## Changes Made

### 1. Enabled Fallback Behavior

**File:** `src/lib/ai/promptLoader.ts`

- Changed `getCopywriterPromptTemplate()` to return fallback instead of throwing errors
- Updated return type to include `"fallback" | "langsmith"` source indicator
- All error paths now gracefully fall back to the hardcoded prompt

### 2. Replaced Fallback Prompt

**File:** `src/lib/ai/promptLoader.ts`

- Replaced the simple fallback prompt with the comprehensive copywriter system prompt
- Includes all tone rules, style guidelines, refusal behavior, and output formats
- Supports all required variables:
  - `{question}`
  - `{context}`
  - `{section_title}`
  - `{section_body}`
  - `{project_short_facts}`
  - `{retrieved_chunks}`
  - `{global_about_sections}`

## Behavior

**When LangSmith is available:**
- Loads prompt from LangSmith (prompt ID: `pfaff-copywriter-answer-blocks-v3`)
- Returns `{ template, source: "langsmith" }`

**When LangSmith is unavailable or fails:**
- Uses comprehensive fallback prompt
- Returns `{ template, source: "fallback" }`
- Logs warning messages for debugging

## Testing

To test the fallback:

1. **Disable LangSmith temporarily:**
   ```bash
   # Comment out or remove LANGSMITH_API_KEY from .env.local
   ```

2. **Use the AI modal:**
   - Ask a question in the modal
   - Check server logs for: `[PromptLoader] LangSmith not configured, using fallback copywriter prompt`
   - Verify the answer is generated using the fallback prompt

3. **Re-enable LangSmith:**
   - Uncomment `LANGSMITH_API_KEY`
   - Restart dev server
   - Verify it loads from LangSmith again

## Benefits

- **Resilience:** System works even when LangSmith is down
- **Consistency:** Fallback uses the same comprehensive prompt rules
- **Transparency:** Logs indicate when fallback is being used
- **No Breaking Changes:** Existing code continues to work

## Next Steps

The copywriter will now work reliably even when LangSmith is unavailable, using the comprehensive fallback prompt that matches all the tone and style requirements from `current-prompt.md`.

