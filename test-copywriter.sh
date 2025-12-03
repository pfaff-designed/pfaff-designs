#!/bin/bash

# Quick test script for copywriter API
# Make sure dev server is running: npm run dev

BASE_URL="http://localhost:3000"

echo "🧪 Testing Copywriter API..."
echo ""

# Test 1: About question
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 1: About question"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST "$BASE_URL/api/copywriter" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How do you work with AI?",
    "context": "Context about AI approach and methodology",
    "sectionTitle": "AI Approach",
    "sectionBody": "",
    "globalAboutSections": "",
    "retrievedChunks": [],
    "projectShortFacts": "{}"
  }' | jq '.'

echo ""
echo ""

# Test 2: Project tools question
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 2: Project tools question"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST "$BASE_URL/api/copywriter" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What tools did you use on PMI?",
    "context": "PMI project involved React, TypeScript, and modern tooling",
    "sectionTitle": "Tools",
    "sectionBody": "",
    "globalAboutSections": "",
    "retrievedChunks": [],
    "projectShortFacts": "{\"client\":\"PMI\",\"role\":\"Front-End Engineer\"}"
  }' | jq '.'

echo ""
echo ""

# Test 3: Verify schema structure
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 3: Checking response structure..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/copywriter" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Test question",
    "context": "Test context",
    "sectionTitle": "Test",
    "sectionBody": "",
    "globalAboutSections": "",
    "retrievedChunks": [],
    "projectShortFacts": "{}"
  }')

echo "✅ Has answer_blocks: $(echo $RESPONSE | jq 'has("answer_blocks")')"
echo "✅ Has question_type: $(echo $RESPONSE | jq 'has("question_type")')"
echo "✅ Has focus_tags: $(echo $RESPONSE | jq 'has("focus_tags")')"
echo "✅ answer_blocks is array: $(echo $RESPONSE | jq '.answer_blocks | type')"
echo "✅ First block has required fields:"
echo $RESPONSE | jq '.answer_blocks[0] | {type, eyebrow, heading, hasBody: has("body"), hasImageId: has("imageId")}'

echo ""
echo "✅ Test complete! Check output above for any errors."

