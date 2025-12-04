# Debugging Copywriter Errors

## The Issue

You're getting the fallback error message, which means the copywriter is catching an error internally. Here's how to debug it:

## Step 1: Check Server Logs

**In your dev server terminal**, look for error messages like:

```
[Copywriter] Error: ...
[PromptLoader] Error: ...
```

Common error messages you might see:

1. **LangSmith Error:**
   ```
   [PromptLoader] ❌ Copywriter prompt requires LangSmith; fallback prompt is temporarily disabled.
   ```
   → **Fix:** Set `LANGSMITH_API_KEY` in `.env.local`

2. **Missing Variables Error:**
   ```
   Error: Missing required variables in prompt template
   ```
   → **Fix:** The LangSmith prompt template doesn't have all the variables we're passing

3. **API Key Error:**
   ```
   Error: Missing ANTHROPIC_API_KEY
   ```
   → **Fix:** Set `ANTHROPIC_API_KEY` in `.env.local`

## Step 2: Check Environment Variables

Make sure these are set in `.env.local`:

```bash
ANTHROPIC_API_KEY=your_key_here
LANGSMITH_API_KEY=your_key_here
```

## Step 3: Verify LangSmith Prompt Variables

The code is passing these variables to the prompt:
- `question`
- `context`
- `section_title`
- `section_body`
- `project_short_facts`
- `retrieved_chunks`
- `global_about_sections`

**The LangSmith prompt MUST have all these variables defined.**

If the prompt doesn't have them, you'll get an error when formatting.

## Step 4: Quick Test Without LangSmith

To test without LangSmith (using the fallback), temporarily comment out the LangSmith check in `promptLoader.ts` and use the fallback prompt.

**BUT** - The fallback prompt also needs to be updated with the new variables!

## Step 5: Most Likely Issue

Based on the code, the most likely issue is:

**The LangSmith prompt template (`pfaff-copywriter-answer-blocks-v3`) doesn't have the new variables yet.**

You need to update the prompt in LangSmith to include:
- `{section_title}`
- `{section_body}`  
- `{retrieved_chunks}`
- `{global_about_sections}`

## Quick Fix: Test with Minimal Variables

You can test if the basic copywriter works by checking if it fails at prompt loading or variable formatting:

1. Check server logs for the exact error
2. Share the error message and I can help fix it

