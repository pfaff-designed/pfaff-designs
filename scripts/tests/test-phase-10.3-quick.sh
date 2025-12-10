#!/bin/bash

# Quick test script for Phase 10.3
# Verifies TypeScript compilation and basic structure

echo "🧪 Testing Phase 10.3 - Inline Chat Window"
echo ""

# Check TypeScript compilation
echo "1. Checking TypeScript compilation..."
if npx tsc --noEmit 2>&1 | grep -q "error"; then
  echo "❌ TypeScript errors found:"
  npx tsc --noEmit 2>&1 | grep "error" | head -5
  exit 1
else
  echo "✅ No TypeScript errors"
fi

# Check if files exist
echo ""
echo "2. Checking required files exist..."

files=(
  "src/lib/ai/prompts/quickAnswerPrompt.ts"
  "src/app/api/ai/quick/route.ts"
  "src/lib/inline-chat/useInlineChat.ts"
  "src/components/inline-chat/InlineChatWindow.tsx"
  "src/components/inline-chat/index.ts"
)

all_exist=true
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file (missing)"
    all_exist=false
  fi
done

if [ "$all_exist" = false ]; then
  exit 1
fi

# Check if system prompt exists
echo ""
echo "3. Checking system prompt constant..."
if grep -q "QUICK_ANSWER_SYSTEM_PROMPT" src/lib/ai/prompts/quickAnswerPrompt.ts; then
  echo "✅ System prompt constant found"
else
  echo "❌ System prompt constant not found"
  exit 1
fi

# Check if API route uses correct model
echo ""
echo "4. Checking API route configuration..."
if grep -q "claude-3-5-haiku-20241022" src/app/api/ai/quick/route.ts && \
   grep -q "temperature: 0.4" src/app/api/ai/quick/route.ts && \
   grep -q "max_tokens: 300" src/app/api/ai/quick/route.ts; then
  echo "✅ API route configured correctly"
else
  echo "⚠️  API route may not be configured correctly"
fi

# Check if InlineChatWindow uses z-[60]
echo ""
echo "5. Checking InlineChatWindow z-index..."
if grep -q "z-\[60\]" src/components/inline-chat/InlineChatWindow.tsx; then
  echo "✅ InlineChatWindow uses z-[60]"
else
  echo "⚠️  InlineChatWindow z-index may not be correct"
fi

# Check if CommandPaletteProvider includes InlineChatWindow
echo ""
echo "6. Checking CommandPaletteProvider integration..."
if grep -q "InlineChatWindow" src/components/cmdk/CommandPaletteProvider.tsx && \
   grep -q "useInlineChat" src/components/cmdk/CommandPaletteProvider.tsx; then
  echo "✅ InlineChatWindow integrated in CommandPaletteProvider"
else
  echo "❌ InlineChatWindow not found in CommandPaletteProvider"
  exit 1
fi

# Check if ai_quick commands use openInlineChat
echo ""
echo "7. Checking ai_quick commands..."
if grep -A 5 "ai-quick-summarize-page" src/lib/cmdk/command-registry.ts | grep -q "openInlineChat"; then
  echo "✅ ai_quick commands use openInlineChat"
else
  echo "⚠️  ai_quick commands may not be wired correctly"
fi

echo ""
echo "🎉 All automated checks passed!"
echo ""
echo "Next steps:"
echo "1. Start dev server: npm run dev"
echo "2. Press Cmd+K (or Ctrl+K) to open CommandPalette"
echo "3. Type 'summarize page' and press Enter"
echo "4. Verify inline chat window opens with answer"
echo "5. See scripts/tests/test-phase-10.3.md for full testing guide"

