#!/bin/bash

# Test script for PMI Identity Normalization
# Run this after starting the dev server: npm run dev

BASE_URL="http://localhost:3000"

echo "🧪 Testing PMI Identity Normalization"
echo "======================================"
echo ""

# Test 1: Path normalization - /work/pmi
echo "Test 1: Path normalization (/work/pmi)"
echo "---------------------------------------"
curl -X POST "$BASE_URL/api/dev/modal-graph" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What tools did you use?",
    "pagePath": "/work/pmi",
    "sectionHeadline": "Overview",
    "history": []
  }' | jq '{
    projectSlug: .projectSlug,
    expectedSlug: "pmi",
    hasNormalizationNote: (.debugNotes | map(select(. | contains("normalized projectSlug to '\''pmi'\''"))) | length > 0),
    projectFacts: .projectFacts.name
  }'
echo ""

# Test 2: Path normalization - /work/pmi-agile
echo "Test 2: Path normalization (/work/pmi-agile)"
echo "---------------------------------------------"
curl -X POST "$BASE_URL/api/dev/modal-graph" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What tools did you use?",
    "pagePath": "/work/pmi-agile",
    "sectionHeadline": "Overview",
    "history": []
  }' | jq '{
    projectSlug: .projectSlug,
    expectedSlug: "pmi",
    hasNormalizationNote: (.debugNotes | map(select(. | contains("normalized projectSlug to '\''pmi'\''"))) | length > 0),
    projectFacts: .projectFacts.name
  }'
echo ""

# Test 3: Path normalization - /work/pmi-acp
echo "Test 3: Path normalization (/work/pmi-acp)"
echo "-------------------------------------------"
curl -X POST "$BASE_URL/api/dev/modal-graph" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What tools did you use?",
    "pagePath": "/work/pmi-acp",
    "sectionHeadline": "Overview",
    "history": []
  }' | jq '{
    projectSlug: .projectSlug,
    expectedSlug: "pmi",
    hasNormalizationNote: (.debugNotes | map(select(. | contains("normalized projectSlug to '\''pmi'\''"))) | length > 0),
    projectFacts: .projectFacts.name
  }'
echo ""

# Test 4: Alias detection in question (no pagePath)
echo "Test 4: Alias detection from question text"
echo "-------------------------------------------"
curl -X POST "$BASE_URL/api/dev/modal-graph" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What did he do for PMI-ACP?",
    "pagePath": "/",
    "history": []
  }' | jq '{
    projectSlug: .projectSlug,
    expectedSlug: "pmi",
    hasAliasNote: (.debugNotes | map(select(. | contains("normalized projectSlug to '\''pmi'\'' from question text"))) | length > 0),
    projectFacts: .projectFacts.name
  }'
echo ""

# Test 5: Alias detection - PMI Agile
echo "Test 5: Alias detection (PMI Agile)"
echo "------------------------------------"
curl -X POST "$BASE_URL/api/dev/modal-graph" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What about PMI Agile?",
    "pagePath": "/",
    "history": []
  }' | jq '{
    projectSlug: .projectSlug,
    expectedSlug: "pmi",
    hasAliasNote: (.debugNotes | map(select(. | contains("normalized projectSlug to '\''pmi'\'' from question text"))) | length > 0)
  }'
echo ""

# Test 6: Tools question on PMI page (deterministic answer)
echo "Test 6: Tools question (should return canonical tools)"
echo "--------------------------------------------------------"
curl -X POST "$BASE_URL/api/dev/modal-graph" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What tools did you use on this project?",
    "pagePath": "/work/pmi",
    "sectionHeadline": "Overview",
    "history": []
  }' | jq '{
    answer: .answerText,
    projectSlug: .projectSlug,
    hasReact: (.answerText | contains("React")),
    hasTypeScript: (.answerText | contains("TypeScript")),
    hasNextjs: (.answerText | contains("Next.js")),
    hasStorybook: (.answerText | contains("Storybook")),
    hasFigma: (.answerText | contains("Figma")),
    noHallucinatedTools: (.answerText | (contains("Vue.js") or contains("TensorFlow") or contains("PyTorch")) | not)
  }'
echo ""

# Test 7: Production API route normalization
echo "Test 7: Production API route (/api/ai/modal)"
echo "----------------------------------------------"
curl -X POST "$BASE_URL/api/ai/modal" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What tools did you use?",
    "pagePath": "/work/pmi-agile",
    "topicLabel": "Overview",
    "history": []
  }' | jq '{
    answer: .answer,
    mode: .mode,
    hasCanonicalTools: (.answer | (contains("React") and contains("TypeScript") and contains("Next.js"))),
    noHallucinatedTools: (.answer | (contains("Vue.js") or contains("TensorFlow")) | not)
  }'
echo ""

# Test 8: Variant slug normalization
echo "Test 8: Variant slug normalization (pmi-agile as projectSlug)"
echo "---------------------------------------------------------------"
curl -X POST "$BASE_URL/api/dev/modal-graph" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What tools did you use?",
    "pagePath": "/work/pmi",
    "projectSlug": "pmi-agile",
    "sectionHeadline": "Overview",
    "history": []
  }' | jq '{
    projectSlug: .projectSlug,
    expectedSlug: "pmi",
    hasVariantNote: (.debugNotes | map(select(. | contains("normalized projectSlug variant to '\''pmi'\''"))) | length > 0),
    projectFacts: .projectFacts.name
  }'
echo ""

echo "✅ All API tests complete!"
echo ""
echo "📋 Manual UI Testing Checklist:"
echo ""
echo "1. Path Normalization Test:"
echo "   - Navigate to /work/pmi (or /work/pmi-agile, /work/pmi-acp)"
echo "   - Open modal (⌘K)"
echo "   - Ask: 'What tools did you use on this project?'"
echo "   - ✅ Should return: React, TypeScript, Next.js, Storybook, Figma"
echo "   - ✅ Check browser console for debugNotes showing normalization"
echo ""
echo "2. Alias Detection Test:"
echo "   - Go to home page (/)"
echo "   - Open modal"
echo "   - Ask: 'What did he do for PMI-ACP?' or 'What about PMI Agile?'"
echo "   - ✅ Should recognize PMI and return relevant answer"
echo "   - ✅ Check console for alias detection debug note"
echo ""
echo "3. Tools Answer Test:"
echo "   - On any PMI page, ask: 'What tools did you use?'"
echo "   - ✅ Should return deterministic list (no hallucinations)"
echo "   - ✅ Should NOT mention Vue.js, TensorFlow, PyTorch"
echo ""
echo "4. Cross-Project Tools Test:"
echo "   - On PMI page, ask: 'Which other projects use these tools?'"
echo "   - ✅ Should list projects that share React/TypeScript/Next.js"
echo "   - ✅ Should use canonical 'pmi' slug internally"
echo ""
echo "5. Debug Notes Verification:"
echo "   - Open browser DevTools Console"
echo "   - Ask questions on PMI pages"
echo "   - ✅ Should see: 'derive_context: normalized projectSlug to '\''pmi'\'''"
echo "   - ✅ Should see: 'derive_context: loaded projectFacts for pmi'"

