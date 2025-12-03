#!/bin/bash

# Debug test script for copywriter
# Shows detailed error information

BASE_URL="http://localhost:3000"

echo "🔍 Testing Copywriter API with Debug Info..."
echo ""
echo "⚠️  Make sure your dev server is running and check the server logs!"
echo ""

# Test 1: Minimal test
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 1: Minimal request"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Request:"
echo '{
  "question": "Test question",
  "context": "Test context",
  "sectionTitle": "Test",
  "sectionBody": "",
  "globalAboutSections": "",
  "retrievedChunks": [],
  "projectShortFacts": "{}"
}'
echo ""
echo "Response:"
curl -v -X POST "$BASE_URL/api/copywriter" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Test question",
    "context": "Test context",
    "sectionTitle": "Test",
    "sectionBody": "",
    "globalAboutSections": "",
    "retrievedChunks": [],
    "projectShortFacts": "{}"
  }' 2>&1 | grep -E "(HTTP|error|Error|ERROR)"

echo ""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Check your dev server terminal for detailed error logs"
echo "2. Look for lines starting with '[Copywriter]' or 'Error'"
echo "3. Common issues:"
echo "   - Missing ANTHROPIC_API_KEY"
echo "   - Missing LANGSMITH_API_KEY"  
echo "   - LangSmith prompt doesn't have all variables"
echo "   - Prompt template format mismatch"
echo ""

