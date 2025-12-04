# Troubleshooting: Copywriter Fallback Error

## The Error You're Seeing

```
AI answer

I ran into an issue while generating a detailed answer, but I'm still here. Try rephrasing the question or asking something a bit simpler.
```

This is the **fallback error message** from the copywriter, which means an error was caught internally.

## How to Debug

### Step 1: Check Server Logs

**In your dev server terminal**, look for error messages. You should see something like:

```
[Copywriter] Error: ...
[Copywriter] Error formatting prompt template: ...
[ModalGraph] ⚠️ Copywriter returned fallback error
```

### Step 2: Common Issues

#### Issue 1: LangSmith Prompt Doesn't Exist

**Error message:**
```
[PromptLoader] ❌ Failed to load LangSmith prompt; fallback disabled: No prompt data returned for pfaff-copywriter-answer-blocks-v3
```

**Fix:**
- Create the prompt `pfaff-copywriter-answer-blocks-v3` in LangSmith
- OR ensure you have `LANGSMITH_API_KEY` set in `.env.local`

#### Issue 2: Missing Required Variables in Prompt

**Error message:**
```
[Copywriter] Error formatting prompt template: Missing required variables
[Copywriter] Expected variables: question, context, section_title, section_body, project_short_facts, retrieved_chunks, global_about_sections
```

**Fix:**
- Update the LangSmith prompt to include ALL these variables:
  - `{question}`
  - `{context}`
  - `{section_title}`
  - `{section_body}`
  - `{project_short_facts}`
  - `{retrieved_chunks}`
  - `{global_about_sections}`

#### Issue 3: Missing API Keys

**Error message:**
```
[PromptLoader] ❌ Copywriter prompt requires LangSmith; LANGSMITH_API_KEY is not set.
```

**Fix:**
- Add to `.env.local`:
  ```bash
  LANGSMITH_API_KEY=your_key_here
  ANTHROPIC_API_KEY=your_key_here
  ```

#### Issue 4: Prompt Template Format Mismatch

**Error message:**
```
[Copywriter] Error formatting prompt template: ...
```

**Fix:**
- Ensure the LangSmith prompt is a ChatPromptTemplate format
- Or check that all variables are properly defined in the prompt

### Step 3: Check What's Being Passed

The modal graph now logs what it's passing to the copywriter. Look for:

```
[ModalGraph] Calling copywriter with input: {
  question: "...",
  contextLength: ...,
  hasProjectFacts: ...,
  chunksCount: ...,
  hasGlobalSections: ...
}
```

This will show you if any required data is missing.

## Quick Test

To test if the copywriter works at all, try calling the direct endpoint:

```bash
curl -X POST http://localhost:3000/api/copywriter \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Test question",
    "context": "Test context",
    "sectionTitle": "Test",
    "sectionBody": "",
    "globalAboutSections": "",
    "retrievedChunks": [],
    "projectShortFacts": "{}"
  }'
```

**Check your server logs** for the actual error message. That will tell you exactly what's wrong.

## Most Likely Issue

Based on the error, the most likely issue is:

**The LangSmith prompt `pfaff-copywriter-answer-blocks-v3` either:**
1. Doesn't exist yet
2. Doesn't have all the required variables
3. Has a format mismatch

**Solution:** Check your LangSmith dashboard and verify the prompt exists with all required variables, OR check your server logs for the exact error message.

