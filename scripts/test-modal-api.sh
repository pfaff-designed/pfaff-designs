#!/bin/bash

# Test script for Phase 9.1 - Modal API using LangGraph
# Run this after starting the dev server: npm run dev

BASE_URL="http://localhost:3000"

echo "🧪 Testing Modal API (Phase 9.1)"
echo "================================"
echo ""

# Test 1: Basic question without context
echo "Test 1: Basic question (low context)"
echo "-------------------------------------"
curl -X POST "$BASE_URL/api/ai/modal" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What kind of work does he do?",
    "pagePath": "/",
    "history": []
  }' | jq '{ answer: .answer, mode: .mode, hasActions: (.actions | length > 0) }'
echo ""

# Test 2: Project-specific question
echo "Test 2: Project-specific question (answer_direct)"
echo "-------------------------------------------------"
curl -X POST "$BASE_URL/api/ai/modal" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What tools did he use on the Capital One project?",
    "pagePath": "/work/capital-one-travel",
    "topicLabel": "Overview",
    "history": []
  }' | jq '{ answer: .answer, mode: .mode, hasActions: (.actions | length > 0) }'
echo ""

# Test 3: Vague question (should trigger clarify_then_answer)
echo "Test 3: Vague question (clarify_then_answer)"
echo "--------------------------------------------"
curl -X POST "$BASE_URL/api/ai/modal" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "tell me more",
    "pagePath": "/work/capital-one-travel",
    "topicLabel": "Overview",
    "history": []
  }' | jq '{ answer: .answer, mode: .mode, hasActions: (.actions | length > 0) }'
echo ""

# Test 4: With conversation history
echo "Test 4: With conversation history"
echo "----------------------------------"
curl -X POST "$BASE_URL/api/ai/modal" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What other projects has he worked on?",
    "pagePath": "/work/capital-one-travel",
    "history": [
      { "role": "user", "text": "What tools did he use?" },
      { "role": "ai", "text": "For this project, Charles used: React, TypeScript, Next.js..." }
    ]
  }' | jq '{ answer: .answer, mode: .mode, hasActions: (.actions | length > 0) }'
echo ""

# Test 5: Verify dev harness still works
echo "Test 5: Dev harness (/api/dev/modal-graph)"
echo "-------------------------------------------"
curl -X POST "$BASE_URL/api/dev/modal-graph" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What tools did he use?",
    "pagePath": "/work/capital-one-travel",
    "projectSlug": "capital-one-travel",
    "sectionHeadline": "Overview",
    "sectionText": "Capital One Travel project",
    "history": []
  }' | jq '{ answerText: .answerText, mode: .mode, debugNotesCount: (.debugNotes | length) }'
echo ""

echo "✅ All tests complete!"
echo ""
echo "📋 Manual Testing Checklist:"
echo "  1. Open the modal in the browser (⌘K or select text)"
echo "  2. Ask a question and verify the answer appears"
echo "  3. Check browser console for debug logs"
echo "  4. Verify actions appear below the answer"
echo "  5. Test multi-turn conversation (ask follow-up questions)"
echo "  6. Verify mode changes based on question type"

