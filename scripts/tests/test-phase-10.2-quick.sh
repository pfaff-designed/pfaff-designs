#!/bin/bash

# Quick test script for Phase 10.2
# Verifies TypeScript compilation and basic structure

echo "🧪 Testing Phase 10.2 - CommandPalette Shell"
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
  "src/lib/cmdk/useCommandPalette.ts"
  "src/components/cmdk/CommandPalette.tsx"
  "src/components/cmdk/CommandPaletteProvider.tsx"
  "src/components/cmdk/index.ts"
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

# Check if AiKeyboardShortcut is deprecated
echo ""
echo "3. Checking AiKeyboardShortcut is deprecated..."
if grep -q "DEPRECATED" src/components/ai-modal/AiKeyboardShortcut.tsx; then
  echo "✅ AiKeyboardShortcut properly deprecated"
else
  echo "⚠️  AiKeyboardShortcut may not be fully deprecated"
fi

# Check if CommandPaletteProvider is in layout
echo ""
echo "4. Checking CommandPaletteProvider is in layout..."
if grep -q "CommandPaletteProvider" src/app/layout.tsx; then
  echo "✅ CommandPaletteProvider integrated in layout"
else
  echo "❌ CommandPaletteProvider not found in layout"
  exit 1
fi

echo ""
echo "🎉 All automated checks passed!"
echo ""
echo "Next steps:"
echo "1. Start dev server: npm run dev"
echo "2. Press Cmd+K (or Ctrl+K) to test the palette"
echo "3. See scripts/tests/test-phase-10.2.md for full testing guide"

