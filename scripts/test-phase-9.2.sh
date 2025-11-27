#!/bin/bash

# Test script for Phase 9.2 - PMI Fix + Mode-Carrying
# Run this after starting the dev server: npm run dev

BASE_URL="http://localhost:3000"

echo "🧪 Testing Phase 9.2 - PMI Fix + Mode-Carrying"
echo "=============================================="
echo ""

# Test 1: PMI tools question (should return deterministic answer)
echo "Test 1: PMI tools question (deterministic)"
echo "-------------------------------------------"
curl -X POST "$BASE_URL/api/ai/modal" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What tools did he use on the PMI project?",
    "pagePath": "/work/pmi-agile",
    "topicLabel": "Overview",
    "history": []
  }' | jq '{
    answer: .answer,
    mode: .mode,
    hasTools: (.answer | contains("React") or contains("TypeScript") or contains("Next.js")),
    noHallucinatedTools: (.answer | (contains("Vue.js") or contains("TensorFlow") or contains("PyTorch")) | not)
  }'
echo ""

# Test 2: Capital One tools question (should also be deterministic)
echo "Test 2: Capital One tools question (deterministic)"
echo "---------------------------------------------------"
curl -X POST "$BASE_URL/api/ai/modal" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What tools did you use?",
    "pagePath": "/work/capital-one-travel",
    "topicLabel": "Overview",
    "history": []
  }' | jq '{
    answer: .answer,
    mode: .mode,
    hasTools: (.answer | contains("React") or contains("TypeScript")),
    noHallucinatedTools: (.answer | (contains("Vue.js") or contains("TensorFlow")) | not)
  }'
echo ""

# Test 3: Low context question (should not hallucinate tools)
echo "Test 3: Low context question (no hallucinated tools)"
echo "-----------------------------------------------------"
curl -X POST "$BASE_URL/api/ai/modal" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What kind of work does he do?",
    "pagePath": "/",
    "history": []
  }' | jq '{
    answer: .answer,
    mode: .mode,
    noHallucinatedTools: (.answer | (contains("Vue.js") or contains("TensorFlow") or contains("PyTorch")) | not),
    isLowContext: (.mode == "low_context_fallback")
  }'
echo ""

# Test 4: Verify mode is returned in response
echo "Test 4: Mode in API response"
echo "-----------------------------"
curl -X POST "$BASE_URL/api/ai/modal" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What tools did he use?",
    "pagePath": "/work/capital-one-travel",
    "history": []
  }' | jq '{
    hasMode: (.mode != null),
    mode: .mode,
    validMode: (.mode == "answer_direct" or .mode == "clarify_then_answer" or .mode == "low_context_fallback")
  }'
echo ""

# Test 5: Different modes based on question type
echo "Test 5: Mode routing (answer_direct)"
echo "--------------------------------------"
curl -X POST "$BASE_URL/api/ai/modal" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What tools did you use on this project?",
    "pagePath": "/work/capital-one-travel",
    "topicLabel": "Overview",
    "history": []
  }' | jq '{ mode: .mode, expected: "answer_direct" }'
echo ""

echo "Test 5b: Mode routing (clarify_then_answer)"
echo "--------------------------------------------"
curl -X POST "$BASE_URL/api/ai/modal" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What other projects has he worked on?",
    "pagePath": "/work/capital-one-travel",
    "history": []
  }' | jq '{ mode: .mode, expected: "clarify_then_answer" }'
echo ""

echo "✅ API tests complete!"
echo ""
echo "📋 Manual UI Testing Checklist:"
echo ""
echo "1. PMI Tools Test:"
echo "   - Go to /work/pmi-agile"
echo "   - Open modal (⌘K)"
echo "   - Ask: 'What tools did he use on this project?'"
echo "   - ✅ Should see: React, TypeScript, Next.js, Storybook, Figma"
echo "   - ✅ Should NOT see: Vue.js, TensorFlow, PyTorch"
echo "   - ✅ Should see mode label in dev: 'Direct answer'"
echo ""
echo "2. Mode Label Test:"
echo "   - Open modal and ask questions"
echo "   - Check assistant messages for mode labels:"
echo "     • 'Direct answer' (answer_direct)"
echo "     • 'Answer + follow-up' (clarify_then_answer)"
echo "     • 'Low-context overview' (low_context_fallback)"
echo ""
echo "3. Console Logs Test:"
echo "   - Open browser DevTools Console"
echo "   - Ask a question in the modal"
echo "   - ✅ Should see: [modalGraph] mode: <mode>"
echo "   - ✅ Should see: [modalGraph] debugNotes: [...]"
echo ""
echo "4. No Hallucinated Tools Test:"
echo "   - Ask vague questions on pages with low context"
echo "   - ✅ Should NOT mention Vue.js, TensorFlow, PyTorch"
echo "   - ✅ Should stay high-level about process/outcomes"

