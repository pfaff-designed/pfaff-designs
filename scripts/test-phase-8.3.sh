#!/bin/bash
# Test Phase 8.3 - generate_answer Mode Handling
# Usage: ./scripts/test-phase-8.3.sh

BASE_URL="http://localhost:3000/api/dev/modal-graph"

echo "🧪 Testing Phase 8.3 - generate_answer Mode Handling"
echo "====================================================="
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
    answerText: (.answerText | .[0:300]),
    hasFollowUp: (.answerText | contains("?")),
    debugNotes: (.debugNotes | map(select(. | contains("[generate_answer]"))) | .[0:3])
  }'
echo ""
echo "✅ Expected: mode='answer_direct', direct answer, NO follow-up question"
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
    answerText: (.answerText | .[0:300]),
    hasFollowUp: (.answerText | contains("?")),
    debugNotes: (.debugNotes | map(select(. | contains("[generate_answer]"))) | .[0:3])
  }'
echo ""
echo "✅ Expected: mode='clarify_then_answer', partial answer + ONE follow-up"
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
    answerText: (.answerText | .[0:300]),
    hasFollowUp: (.answerText | contains("?")),
    mentionsProjects: (.answerText | test("(?i)(tanger|coke|capital|pmi)")),
    debugNotes: (.debugNotes | map(select(. | contains("[generate_answer]"))) | .[0:3])
  }'
echo ""
echo "✅ Expected: mode='low_context_fallback', overview + project names + ONE follow-up"
echo ""

echo "✅ All Phase 8.3 tests complete!"
echo ""
echo "Check the responses above to verify:"
echo "  - Mode is set correctly"
echo "  - Answer format matches mode behavior"
echo "  - Debug notes use [generate_answer] prefix"
echo "  - Follow-up questions appear only when expected"

