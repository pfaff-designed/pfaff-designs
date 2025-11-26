#!/bin/bash
# Test script for modal graph with structured context
# Usage: ./scripts/test-modal-graph.sh

echo "🧪 Testing Modal Graph with Capital One Travel context..."
echo ""

curl -X POST http://localhost:3000/api/dev/modal-graph \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What tools were used?",
    "pagePath": "/work/capital-one-travel",
    "projectSlug": "capital-one-travel",
    "sectionHeadline": "Travel rewards, refined",
    "sectionText": "Short description of this section",
    "history": []
  }' | jq '.'

echo ""
echo "✅ Test complete! Check the response above."

