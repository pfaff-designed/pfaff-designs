#!/bin/bash
# Test conversation policy modes
# Usage: ./scripts/tests/test-conversation-policy.sh

BASE_URL="http://localhost:3000/api/dev/modal-graph"

echo "🧪 Testing Conversation Policy Modes"
echo "====================================="
echo ""

# Test A: answer_direct
echo "Test A: answer_direct mode"
echo "---------------------------"
echo "Question: 'What tools did you use on this project?'"
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What tools did you use on this project?",
    "pagePath": "/work/capital-one-travel",
    "projectSlug": "capital-one-travel",
    "sectionHeadline": "Travel rewards, refined",
    "sectionText": "Short description",
    "history": []
  }' | jq '{
    mode,
    answerText: (.answerText | .[0:200]),
    policyNote: (.debugNotes | map(select(. | contains("conversation_policy"))) | .[0])
  }'
echo ""
echo ""

# Test B: clarify_then_answer
echo "Test B: clarify_then_answer mode"
echo "---------------------------------"
echo "Question: 'What other projects has he worked on?'"
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What other projects has he worked on?",
    "pagePath": "/work/capital-one-travel",
    "projectSlug": "capital-one-travel",
    "sectionHeadline": "Travel rewards, refined",
    "history": []
  }' | jq '{
    mode,
    answerText: (.answerText | .[0:200]),
    policyNote: (.debugNotes | map(select(. | contains("conversation_policy"))) | .[0])
  }'
echo ""
echo ""

# Test C: low_context_fallback
echo "Test C: low_context_fallback mode"
echo "----------------------------------"
echo "Question: 'What kind of work does he do?' (no context)"
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What kind of work does he do?",
    "pagePath": "/work",
    "projectSlug": "",
    "sectionHeadline": "",
    "sectionText": "",
    "history": []
  }' | jq '{
    mode,
    answerText: (.answerText | .[0:200]),
    policyNote: (.debugNotes | map(select(. | contains("conversation_policy"))) | .[0])
  }'
echo ""
echo ""

echo "✅ All conversation policy tests complete!"
echo ""
echo "Expected results:"
echo "  Test A: mode should be 'answer_direct'"
echo "  Test B: mode should be 'clarify_then_answer'"
echo "  Test C: mode should be 'low_context_fallback'"

