#!/bin/bash

# Test script for Phase 9.3 - UI & Interaction Polish
# Run this after starting the dev server: npm run dev

BASE_URL="http://localhost:3000"

echo "🧪 Testing Phase 9.3 - UI & Interaction Polish"
echo "=============================================="
echo ""

# Test 1: openAiModal with full context
echo "Test 1: openAiModal with full context"
echo "-------------------------------------"
curl -X POST "$BASE_URL/api/ai/modal" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What tools did you use?",
    "pagePath": "/work/capital-one-travel",
    "projectSlug": "capital-one-travel",
    "sectionHeadline": "Overview",
    "sectionText": "This is a test section about Capital One Travel project.",
    "history": []
  }' | jq '{
    answer: .answer,
    mode: .mode,
    hasAnswer: (.answer | length > 0),
    hasMode: (.mode != null)
  }'
echo ""

# Test 2: Mode hint display (check that mode is returned)
echo "Test 2: Mode routing (should return mode)"
echo "------------------------------------------"
curl -X POST "$BASE_URL/api/ai/modal" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is this project about?",
    "pagePath": "/work/capital-one-travel",
    "projectSlug": "capital-one-travel",
    "history": []
  }' | jq '{
    mode: .mode,
    modeTypes: ["answer_direct", "clarify_then_answer", "low_context_fallback"],
    hasValidMode: (.mode == "answer_direct" or .mode == "clarify_then_answer" or .mode == "low_context_fallback")
  }'
echo ""

# Test 3: PMI normalization (should work with openAiModal)
echo "Test 3: PMI path normalization"
echo "------------------------------"
curl -X POST "$BASE_URL/api/ai/modal" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What tools did you use?",
    "pagePath": "/work/pmi-agile",
    "projectSlug": "pmi",
    "sectionHeadline": "Overview",
    "history": []
  }' | jq '{
    answer: .answer,
    mode: .mode,
    hasPMITools: (.answer | contains("React") or contains("TypeScript") or contains("Next.js"))
  }'
echo ""

# Test 4: Markdown support (check that **bold** works)
echo "Test 4: Markdown support"
echo "-------------------------"
echo "Note: This test requires manual verification in the UI."
echo "Ask the AI: 'Can you format your answer with **bold text** and *italic text*?'"
echo "Then check the chat UI to see if markdown renders correctly."
echo ""

echo "✅ API tests complete!"
echo ""
echo "📋 Manual UI Tests:"
echo "==================="
echo ""
echo "1. Hover Pill Test:"
echo "   - Navigate to /work/capital-one-travel"
echo "   - Hover over a content section"
echo "   - Click the 'Ask AI about this' pill"
echo "   - Verify: Modal opens with section context"
echo "   - Verify: Mode hint appears above first AI response"
echo ""
echo "2. Floating Button Test (Mobile):"
echo "   - Resize browser to mobile width (< 768px)"
echo "   - Click the floating AI button (bottom-right)"
echo "   - Verify: Modal opens"
echo "   - Verify: Question is pre-filled"
echo ""
echo "3. Mode Hints Test:"
echo "   - Ask a question in the modal"
echo "   - Verify: Mode hint appears above first AI response"
echo "   - Verify: Hint text matches mode (Direct answer / Answer + follow-up / Overview)"
echo "   - Verify: Hint only appears on first assistant message of each turn"
echo ""
echo "4. Markdown Rendering Test:"
echo "   - Ask: 'Can you format your answer with **bold text** and *italic text*?'"
echo "   - Verify: Bold text renders as bold"
echo "   - Verify: Italic text renders as italic"
echo ""
echo "5. Context Passing Test:"
echo "   - Open browser DevTools → Network tab"
echo "   - Click hover pill on a section"
echo "   - Check the POST request to /api/ai/modal"
echo "   - Verify: Request includes projectSlug, sectionHeadline, sectionText"
echo ""

