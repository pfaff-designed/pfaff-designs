#!/bin/bash
# Test script for modal graph scenarios
# Usage: ./scripts/test-modal-graph-scenarios.sh

BASE_URL="http://localhost:3000/api/dev/modal-graph"

echo "🧪 Testing Modal Graph Scenarios"
echo "================================"
echo ""

# Test 1: Tools question
echo "Test 1: Tools question (answer_direct)"
echo "----------------------------------------"
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What tools did you use?",
    "pagePath": "/work/capital-one-travel",
    "projectSlug": "capital-one-travel",
    "sectionHeadline": "Travel rewards, refined",
    "sectionText": "Short description",
    "history": []
  }' | jq '{mode, answerText, debugNotes: .debugNotes[-3:]}'
echo ""
echo ""

# Test 2: Other projects question
echo "Test 2: Other projects (clarify_then_answer)"
echo "---------------------------------------------"
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What other projects has he worked on?",
    "pagePath": "/work/capital-one-travel",
    "projectSlug": "capital-one-travel",
    "sectionHeadline": "Travel rewards, refined",
    "history": []
  }' | jq '{mode, answerText, debugNotes: .debugNotes[-3:]}'
echo ""
echo ""

# Test 3: Combined projects + tools
echo "Test 3: Projects + tools (cross-project-tools)"
echo "------------------------------------------------"
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Which other projects use these tools?",
    "pagePath": "/work/capital-one-travel",
    "projectSlug": "capital-one-travel",
    "sectionHeadline": "Travel rewards, refined",
    "history": []
  }' | jq '{mode, answerText, debugNotes: .debugNotes[-3:]}'
echo ""
echo ""

# Test 4: Low context fallback
echo "Test 4: Low context fallback"
echo "-----------------------------"
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "tell me more",
    "pagePath": "/work",
    "projectSlug": "",
    "sectionHeadline": "",
    "history": []
  }' | jq '{mode, answerText, debugNotes: .debugNotes[-3:]}'
echo ""
echo ""

# Test 5: Simple factual question
echo "Test 5: Simple factual (answer_direct)"
echo "----------------------------------------"
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the role?",
    "pagePath": "/work/capital-one-travel",
    "projectSlug": "capital-one-travel",
    "sectionHeadline": "Travel rewards, refined",
    "sectionText": "Description",
    "history": []
  }' | jq '{mode, answerText, debugNotes: .debugNotes[-3:]}'
echo ""
echo ""

echo "✅ All tests complete!"

