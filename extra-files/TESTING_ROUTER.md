# Testing the Router

## Method 1: Dev Harness (Easiest)

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:3000/dev/router-test`

3. Use the test interface to:
   - Try pre-populated test queries
   - Enter custom queries
   - Adjust context (page slug, section ID, project slug)
   - View router results with confidence scores

## Method 2: API Testing (curl)

Test the API endpoint directly:

```bash
curl -X POST http://localhost:3000/api/palette/route \
  -H "Content-Type: application/json" \
  -d '{
    "query": "take me to the PMI page",
    "pageSlug": "/",
    "sectionId": null,
    "projectSlug": null
  }'
```

## Method 3: Programmatic Testing

Use the client helper in your code:

```typescript
import { callRouter } from "@/lib/ai/routerClient";

const result = await callRouter({
  query: "tell me about tools",
  pageSlug: "/work",
  sectionId: null,
  projectSlug: null,
});

console.log(result.actions);
```

## Expected Results

### Navigation Query
**Input:** `"take me to the PMI page"`  
**Expected:** Action with `type: "navigate"`, `href: "/work/pmi"`, `confidence: ≥0.9`

### Quick Answer Query
**Input:** `"what is your approach to AI?"`  
**Expected:** Action with `type: "quick_answer"`, `answerJSON` with answer text, `confidence: ≥0.8`

### Scroll Query
**Input:** `"scroll to the outcomes section"`  
**Expected:** Action with `type: "scroll"`, `sectionId: "outcomes"`, `confidence: ≥0.9`

### Modal Query
**Input:** `"tell me about tools"`  
**Expected:** Action with `type: "open_modal"`, `modalQuery` set, `confidence: 0.6-0.8`

## Troubleshooting

### "RPC function not found" errors
- The router retrieval may need a `match_project_sections` RPC function in Supabase
- The code has fallback logic, but vector similarity won't work optimally
- Check Supabase logs for RPC errors

### Empty results or low confidence
- Check that `ANTHROPIC_API_KEY` is set in `.env.local`
- Verify Supabase connection (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- Check browser console and server logs for errors

### No relevant context retrieved
- Ensure project sections are embedded in Supabase
- Run `npm run sync-and-embed` to populate the knowledge base
- Check that `project_sections` table has data

