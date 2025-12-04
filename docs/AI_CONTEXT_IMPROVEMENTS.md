# AI Context Understanding Improvements

## Current Issues

1. **Limited Page Context**: The intent router only receives minimal context (pageId, route, projectSlug, section IDs)
2. **No Content Awareness**: The AI doesn't know what content is already visible or what sections contain
3. **No Answer History**: The AI doesn't know if a section already has an AI-generated answer
4. **Weak Scroll vs Answer Logic**: The decision between scrolling and generating is based on heuristics that don't consider actual page state

## Recommended Improvements

### 1. Enhance PageContext Schema

Add more context to help the AI make better decisions:

```typescript
export const PageContextSchema = z.object({
  pageId: z.enum(["home", "work-index", "case-study", "about", "contact"]),
  route: z.string(),
  projectSlug: z.string().optional(),
  currentSectionId: z.string().optional(),
  
  // NEW: Enhanced context
  sections: z.array(z.object({
    id: z.string(),
    eyebrow: z.string(),
    heading: z.string(),
    label: z.string().optional(),
    // NEW: Add content preview
    bodyPreview: z.string().optional(), // First 200 chars of section body
    hasAIAnswer: z.boolean().optional(), // Whether this section already has an AI answer
    isVisible: z.boolean().optional(), // Whether section is in viewport
  })).optional(),
  
  // NEW: Viewport information
  viewportInfo: z.object({
    scrollY: z.number().optional(),
    visibleSectionIds: z.array(z.string()).optional(), // Sections currently in viewport
  }).optional(),
  
  // NEW: Existing AI answers on page
  existingAnswers: z.array(z.object({
    sectionId: z.string(),
    answerId: z.string(),
    status: z.enum(["idle", "loading", "error"]),
  })).optional(),
});
```

### 2. Improve Intent Router System Prompt

Update the system prompt in `intentRouter.ts` with clearer decision rules:

**Key additions to the prompt:**

```typescript
--------------------
SCROLL vs ANSWER DECISION RULES
--------------------

CRITICAL: When deciding between scrolling and generating an answer, consider:

1. **If user is asking a QUESTION** (what, how, why, tell me, explain):
   - ALWAYS set answerMode: "full" (generate an answer)
   - Even if a matching section exists, generate an answer
   - Set scrollRelevance: "optional" or "strong" if the section would be helpful context
   - Example: "What was your role?" → answerMode: "full", scrollRelevance: "optional"

2. **If user is giving a NAVIGATION COMMAND** (scroll to, go to, show me):
   - If it's a pure command with NO question → answerMode: "none", scrollRelevance: "strong"
   - If it's a command WITH a question → answerMode: "brief", scrollRelevance: "strong"
   - Example: "Scroll to the process section" → answerMode: "none", scrollRelevance: "strong"
   - Example: "Show me the process section and tell me about it" → answerMode: "brief", scrollRelevance: "strong"

3. **If the target section ALREADY HAS an AI answer**:
   - Check pageContext.existingAnswers for the section
   - If answer exists and is recent → answerMode: "none", scrollRelevance: "strong"
   - If answer exists but user asks a NEW question → answerMode: "full", scrollRelevance: "optional"

4. **If the target section is ALREADY VISIBLE**:
   - Check pageContext.viewportInfo.visibleSectionIds
   - If section is visible → scrollRelevance: "none" (no need to scroll)
   - Still generate answer if user asked a question

5. **If user is on the WRONG page**:
   - If bestPageId !== current pageId → navigationRelevance: "strong"
   - Still generate answer if user asked a question (answerMode: "full")
   - Example: User on home page asks "What was your role on Capital One?"
     → navigationRelevance: "strong", answerMode: "full", bestPageId: "case-study"

--------------------
CONTEXT AWARENESS
--------------------

You receive enhanced context about the current page:

- sections[].bodyPreview: First 200 characters of each section's content
- sections[].hasAIAnswer: Whether a section already has an AI-generated answer
- sections[].isVisible: Whether a section is currently in the viewport
- viewportInfo.visibleSectionIds: List of section IDs currently visible
- existingAnswers: Array of existing AI answers on the page

USE THIS CONTEXT to make smarter decisions:

- If a section already has an answer and user asks about it → scroll to it, don't regenerate
- If a section is already visible → don't suggest scrolling
- If section content is relevant but user asks a question → generate answer AND suggest scrolling for context
```

### 3. Update Intent Router Context Building

Enhance the context passed to the AI in `intentRouter.ts`:

```typescript
// In runIntentRouter function, enhance contextLines:

const contextLines: string[] = [
  `CURRENT PAGE CONTEXT:`,
  `- pageId: ${pageContext.pageId}`,
  `- route: ${pageContext.route}`,
  `- projectSlug: ${pageContext.projectSlug ?? "null"}`,
  `- currentSectionId: ${pageContext.currentSectionId ?? "null"}`,
];

if (pageContext.sections && pageContext.sections.length > 0) {
  contextLines.push(`- sections:`);
  pageContext.sections.forEach((s) => {
    const hasAnswer = s.hasAIAnswer ? " [HAS AI ANSWER]" : "";
    const isVisible = s.isVisible ? " [VISIBLE]" : "";
    contextLines.push(
      `  - ${s.id}: "${s.heading}"${hasAnswer}${isVisible}`
    );
    if (s.bodyPreview) {
      contextLines.push(`    Preview: "${s.bodyPreview.substring(0, 100)}..."`);
    }
  });
} else {
  contextLines.push(`- sections: none`);
}

// Add viewport info
if (pageContext.viewportInfo?.visibleSectionIds) {
  contextLines.push(
    `- visible sections: ${pageContext.viewportInfo.visibleSectionIds.join(", ")}`
  );
}

// Add existing answers
if (pageContext.existingAnswers && pageContext.existingAnswers.length > 0) {
  contextLines.push(`- existing AI answers:`);
  pageContext.existingAnswers.forEach((a) => {
    contextLines.push(`  - section ${a.sectionId}: ${a.status}`);
  });
}
```

### 4. Client-Side Context Collection

Update the client-side code that sends queries to include enhanced context:

**In your query component (wherever you call `/api/ai/query`):**

```typescript
// Collect viewport information
const visibleSectionIds = useMemo(() => {
  // Use Intersection Observer or scroll position to detect visible sections
  const sections = document.querySelectorAll('[data-section-id]');
  const visible: string[] = [];
  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const sectionId = section.getAttribute('data-section-id');
      if (sectionId) visible.push(sectionId);
    }
  });
  return visible;
}, []);

// Collect existing answers
const existingAnswers = useMemo(() => {
  // Get from your AI answer context/state
  return sectionAnswers.map(answer => ({
    sectionId: answer.sectionId,
    answerId: answer.answerId,
    status: answer.status,
  }));
}, [sectionAnswers]);

// Enhanced page context
const enhancedPageContext = {
  ...pageContext,
  sections: pageContext.sections?.map(section => ({
    ...section,
    bodyPreview: getSectionBodyPreview(section.id), // Get first 200 chars
    hasAIAnswer: !!sectionAnswers.find(a => a.sectionId === section.id),
    isVisible: visibleSectionIds.includes(section.id),
  })),
  viewportInfo: {
    scrollY: window.scrollY,
    visibleSectionIds,
  },
  existingAnswers,
};
```

### 5. Improve Fallback Heuristics

Update the fallback logic in `intentRouter.ts` to be smarter:

```typescript
// In the catch block fallback:

// Check if section already has an answer
if (pageContext.existingAnswers) {
  const existingAnswer = pageContext.existingAnswers.find(
    a => a.sectionId === bestSectionId
  );
  if (existingAnswer && existingAnswer.status === "idle") {
    // Section already has an answer, just scroll
    answerMode = "none";
    scrollRelevance = "strong";
  }
}

// Check if section is already visible
if (pageContext.viewportInfo?.visibleSectionIds?.includes(bestSectionId || "")) {
  scrollRelevance = "none"; // No need to scroll
}

// Check if user is asking a question
const hasQuestionWords = /* ... existing logic ... */;
if (hasQuestionWords) {
  // Always generate answer if question is asked
  answerMode = "full";
  // But also suggest scrolling if section exists and isn't visible
  if (bestSectionId && !pageContext.viewportInfo?.visibleSectionIds?.includes(bestSectionId)) {
    scrollRelevance = "optional";
  }
}
```

### 6. Add Section Content Preview

Create a utility to get section content previews:

```typescript
// src/lib/utils/sectionPreview.ts

export function getSectionBodyPreview(
  sectionId: string,
  caseStudyData?: CaseStudyPage
): string | undefined {
  if (!caseStudyData) return undefined;
  
  const section = caseStudyData.sections.find(s => s.id === sectionId);
  if (!section?.body) return undefined;
  
  // Return first 200 characters
  return section.body.substring(0, 200).trim();
}
```

## Implementation Priority

1. **High Priority**:
   - Add `hasAIAnswer` and `isVisible` to sections in PageContext
   - Update intent router system prompt with clearer scroll vs answer rules
   - Add viewport detection on client side

2. **Medium Priority**:
   - Add `bodyPreview` to sections
   - Add `existingAnswers` array to PageContext
   - Improve fallback heuristics

3. **Low Priority**:
   - Add scroll position tracking
   - Add more detailed viewport information

## Testing Scenarios

After implementing, test these scenarios:

1. **User asks question about visible section**: Should generate answer, no scroll
2. **User asks question about section with existing answer**: Should scroll to answer, not regenerate
3. **User asks question about section off-screen**: Should generate answer AND suggest scroll
4. **User gives pure navigation command**: Should scroll only, no answer
5. **User asks question on wrong page**: Should navigate AND generate answer

## Expected Improvements

- Better understanding of what's already on the page
- Smarter decisions about when to scroll vs generate
- Avoids redundant answer generation
- More context-aware suggestions
- Better user experience with fewer unnecessary actions

