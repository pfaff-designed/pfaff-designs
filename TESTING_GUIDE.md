# Testing Guide for AI Modal Copywriter Updates

This guide helps you test the changes made to the AI Modal copywriter pipeline.

## Prerequisites

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Ensure environment variables are set:**
   - `ANTHROPIC_API_KEY`
   - `LANGSMITH_API_KEY` (for prompt loading)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (if you want to sync KB)

3. **Sync Knowledge Base (optional but recommended):**
   ```bash
   npm run sync-and-embed
   ```

## Testing Approaches

### 1. Direct Copywriter API Testing

Test the copywriter in isolation via `/api/copywriter`:

```bash
curl -X POST http://localhost:3000/api/copywriter \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How did you get started?",
    "context": "Test context about background",
    "sectionTitle": "Background",
    "sectionBody": "",
    "globalAboutSections": "=== ABOUT SECTIONS ===\n\n[Background & Path]\nI did not start in engineering...",
    "retrievedChunks": [],
    "projectShortFacts": "{}"
  }'
```

**Expected Response:**
```json
{
  "answer_blocks": [
    {
      "type": "answer_block",
      "eyebrow": "Background",
      "heading": "...",
      "body": "... (markdown allowed)",
      "imageId": null
    }
  ],
  "question_type": "general",
  "focus_tags": []
}
```

### 2. Full Pipeline Testing via `/api/ai/query`

Test the complete pipeline (RAG → Copywriter → Orchestrator):

```bash
curl -X POST http://localhost:3000/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What tools did you use on PMI?",
    "pageContext": {
      "pageId": "case-study",
      "pageSlug": "pmi",
      "sections": []
    },
    "forceGenerate": true
  }'
```

### 3. Manual UI Testing

**Via Command Palette (⌘K):**
1. Open your site at `http://localhost:3000`
2. Press `⌘K` (or `Ctrl+K`) to open command palette
3. Try the test questions below

**Via Text Selection:**
1. Navigate to a case study page (e.g., `/work/capital-one-travel`)
2. Select some text
3. Click the "Ask AI" pill that appears
4. Ask questions

## Test Cases (from current-prompt.md)

### ✅ Test 1: About Questions

**Questions to test:**
- "How did you get started?"
- "How do you work with AI?"

**What to check:**
- ✅ Response has human, conversational tone
- ✅ No em dashes (`—`) in the text
- ✅ Markdown formatting works (bold, links, lists)
- ✅ Content is grounded in KB (from `global_about_sections`)

**How to verify:**
```bash
curl -X POST http://localhost:3000/api/copywriter \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How did you get started?",
    "context": "",
    "sectionTitle": "Background",
    "sectionBody": "",
    "globalAboutSections": "<will be loaded automatically>",
    "retrievedChunks": [],
    "projectShortFacts": "{}"
  }'
```

### ✅ Test 2: Project Facts

**Questions to test:**
- "What tools did you use on PMI?"
- "What was your role on Tanger?"

**What to check:**
- ✅ Content is strictly grounded (no hallucinations)
- ✅ Tools/role match the KB facts
- ✅ No invented projects, clients, or metrics
- ✅ Answer blocks have correct structure

### ✅ Test 3: Deep Dives

**Questions to test:**
- "Explain the pfaff.design AI pipeline."
- "How does the Coke hydration system work?"

**What to check:**
- ✅ Detailed but grounded answer blocks
- ✅ Uses retrieved chunks metadata correctly
- ✅ Markdown preserved in body text
- ✅ Multiple answer blocks if appropriate

## Verification Checklist

### Variables Check

Verify all variables are being passed (check server logs):

```
[Copywriter] Variables passed:
- question: ✅
- context: ✅
- section_title: ✅
- section_body: ✅
- project_short_facts: ✅
- retrieved_chunks: ✅ (should be JSON array)
- global_about_sections: ✅ (should contain about data)
```

### Schema Validation

Check that the response matches `CopywriterOutputSchema`:

```typescript
{
  answer_blocks: [
    {
      type: "answer_block",
      eyebrow: string,
      heading: string,
      body: string,  // markdown
      imageId: null | string
    }
  ],
  question_type: string,  // not enum anymore
  focus_tags: string[]
}
```

### Tone Check

Look for these **forbidden patterns** in responses:

- ❌ Em dashes (`—`)
- ❌ "X not Y" constructions
- ❌ Rule-of-three cadence
- ❌ Vague adjectives ("pivotal", "groundbreaking")
- ❌ AI-speak ("leveraging", "underscore", "tapestry")

### Markdown Rendering

Verify markdown in body text renders correctly:
- **Bold text** appears bold
- *Italic text* appears italic
- Links are clickable
- Lists render properly
- Emoji display correctly

## Debugging Tips

### Check Server Logs

Watch for these log messages:

```
[RAG] Retrieved chunks: { count: X, ... }
[Copywriter] ✅ Using LangSmith prompt: pfaff-copywriter-answer-blocks-v3
[Copywriter] Formatted messages for model: ...
```

### Check Variable Passing

Add temporary logging in `copywriter.ts`:

```typescript
console.log("[DEBUG] Copywriter input:", {
  question: input.question,
  hasContext: !!input.context,
  hasRetrievedChunks: !!input.retrievedChunks,
  retrievedChunksCount: input.retrievedChunks?.length || 0,
  hasGlobalAbout: !!input.globalAboutSections,
  globalAboutLength: input.globalAboutSections?.length || 0,
});
```

### Test Retrieved Chunks Format

Verify chunks have metadata:

```typescript
console.log("[DEBUG] Retrieved chunks sample:", 
  retrievedChunks?.slice(0, 1).map(c => ({
    id: c.id,
    source: c.source,
    sectionType: c.sectionType,
    score: c.score,
  }))
);
```

### Test Global About Sections

Check the loader works:

```typescript
import { formatGlobalAboutSections } from "@/lib/kb/loader";
const about = formatGlobalAboutSections();
console.log("[DEBUG] Global about sections length:", about.length);
console.log("[DEBUG] First 500 chars:", about.substring(0, 500));
```

## Common Issues & Fixes

### Issue: "retrieved_chunks is undefined"

**Fix:** Check that `retrievedChunks` is being passed in pipeline.ts:
```typescript
retrievedChunks: retrievedChunks, // Should be the array from retrieveProjectChunks
```

### Issue: "global_about_sections is empty"

**Fix:** Verify YAML files exist:
- `knowledge-base/identity/about-global.yaml`
- `knowledge-base/identity/identity-long-form.YAML`

Check the loader:
```typescript
import { formatGlobalAboutSections } from "@/lib/kb/loader";
console.log(formatGlobalAboutSections());
```

### Issue: Schema validation fails

**Fix:** Verify the response matches `CopywriterOutputSchema`:
- `answer_blocks` must be an array (1-5 items)
- Each block must have: `type`, `eyebrow`, `heading`, `body`
- `question_type` should be a string (not enum)

### Issue: Tone violations (em dashes, etc.)

**Fix:** Update the LangSmith prompt with the exact text from `current-prompt.md` section 1.1

## Next Steps

After testing:

1. ✅ Update LangSmith prompt with section 1.1 text
2. ✅ Verify all test cases pass
3. ✅ Check for any console errors
4. ✅ Confirm markdown renders correctly in UI
5. ✅ Test in production build: `npm run build && npm start`

## Quick Test Script

Save this as `test-copywriter.sh`:

```bash
#!/bin/bash

# Test 1: About question
echo "Test 1: About question"
curl -X POST http://localhost:3000/api/copywriter \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How do you work with AI?",
    "context": "Test context",
    "sectionTitle": "AI Approach",
    "sectionBody": "",
    "globalAboutSections": "",
    "retrievedChunks": [],
    "projectShortFacts": "{}"
  }' | jq '.'

# Test 2: Project question
echo "\n\nTest 2: Project question"
curl -X POST http://localhost:3000/api/copywriter \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What tools did you use?",
    "context": "PMI project context",
    "sectionTitle": "Tools",
    "sectionBody": "",
    "globalAboutSections": "",
    "retrievedChunks": [],
    "projectShortFacts": "{\"client\":\"PMI\",\"role\":\"Front-End Engineer\"}"
  }' | jq '.'
```

Make it executable: `chmod +x test-copywriter.sh`

Then run: `./test-copywriter.sh`

