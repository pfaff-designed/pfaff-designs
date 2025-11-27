# Testing Guide for Phase 10.1

## Quick Test (Automated)

Run the test script:

```bash
npx tsx scripts/test-cmdk-phase-10.1.ts
```

This will verify:
- ✅ Registry completeness (15 commands)
- ✅ Filter commands matching
- ✅ Visibility functions
- ✅ Context actions logging
- ✅ Command execution

---

## Manual Testing

### 1. Test Command Registry

Create a simple test file to explore the registry:

```typescript
// test-registry.ts
import { commandRegistry } from "./src/lib/cmdk";

console.log("All commands:");
commandRegistry.forEach(cmd => {
  console.log(`- ${cmd.id}: ${cmd.label} (${cmd.kind})`);
});
```

Run: `npx tsx test-registry.ts`

**Expected:** 15 commands listed with correct IDs, labels, and kinds.

---

### 2. Test Filter Commands

```typescript
// test-filter.ts
import { filterCommands, createCommandContext } from "./src/lib/cmdk";

const ctx = createCommandContext("", "/work/capital-one-travel", {
  projectSlug: "capital-one-travel",
});

// Test various queries
const queries = [
  "home",
  "work",
  "capital",
  "pmi",
  "summarize",
  "resume",
  "xyz123", // Should return help
];

queries.forEach(q => {
  const ctxWithInput = createCommandContext(q, ctx.path, {
    projectSlug: ctx.projectSlug,
  });
  const matches = filterCommands(q, ctxWithInput);
  console.log(`"${q}" → ${matches.length} match(es): ${matches.map(m => m.id).join(", ")}`);
});
```

**Expected:**
- "home" → matches `nav-home`
- "work" → matches `nav-work`
- "capital" → matches `nav-capital-one`
- "summarize" → matches summarize commands
- "xyz123" → matches `help` (fallback)

---

### 3. Test Visibility Functions

```typescript
// test-visibility.ts
import { commandRegistry, createCommandContext } from "./src/lib/cmdk";

// Test with selection
const ctxWithSelection = createCommandContext("", "/work/capital-one-travel", {
  projectSlug: "capital-one-travel",
  selectionText: "This is selected text",
});

// Test without selection
const ctxWithoutSelection = createCommandContext("", "/work/capital-one-travel", {
  projectSlug: "capital-one-travel",
});

const summarizeSelection = commandRegistry.find(c => c.id === "ai-quick-summarize-selection");
const rewriteSelection = commandRegistry.find(c => c.id === "ai-quick-rewrite-selection");

console.log("With selection:");
console.log(`  Summarize selection: ${summarizeSelection?.visible?.(ctxWithSelection) ? "visible" : "hidden"}`);
console.log(`  Rewrite selection: ${rewriteSelection?.visible?.(ctxWithSelection) ? "visible" : "hidden"}`);

console.log("\nWithout selection:");
console.log(`  Summarize selection: ${summarizeSelection?.visible?.(ctxWithoutSelection) ? "visible" : "hidden"}`);
console.log(`  Rewrite selection: ${rewriteSelection?.visible?.(ctxWithoutSelection) ? "visible" : "hidden"}`);
```

**Expected:**
- With selection: Both commands visible
- Without selection: Both commands hidden

---

### 4. Test Context Actions

```typescript
// test-actions.ts
import { createCommandContext } from "./src/lib/cmdk";

const ctx = createCommandContext("test", "/work/capital-one-travel", {
  projectSlug: "capital-one-travel",
  selectionText: "Selected text",
  sectionHeadline: "Overview",
  sectionText: "Section content",
});

console.log("Testing context actions:\n");

console.log("1. openAiModal:");
ctx.openAiModal({
  question: "What tools did you use?",
  pagePath: "/work/capital-one-travel",
  projectSlug: "capital-one-travel",
  sectionHeadline: "Overview",
});

console.log("\n2. openInlineChat:");
ctx.openInlineChat({
  question: "Summarize this",
  selectionText: "Selected text",
});

console.log("\n3. navigate:");
ctx.navigate("/work/pmi");

console.log("\n4. download:");
ctx.download("/downloads/charles-pfaff-resume.pdf");
```

**Expected:** All actions log to console with correct arguments.

---

### 5. Test Command Execution

```typescript
// test-execution.ts
import { commandRegistry, createCommandContext } from "./src/lib/cmdk";

const ctx = createCommandContext("", "/work/capital-one-travel", {
  projectSlug: "capital-one-travel",
  selectionText: "This is selected text",
});

// Test navigation command
const homeCmd = commandRegistry.find(c => c.id === "nav-home");
console.log("Executing nav-home:");
homeCmd?.run(ctx);

// Test AI command
const summarizeCmd = commandRegistry.find(c => c.id === "ai-quick-summarize-selection");
console.log("\nExecuting ai-quick-summarize-selection:");
summarizeCmd?.run(ctx);

// Test download command
const resumeCmd = commandRegistry.find(c => c.id === "download-resume");
console.log("\nExecuting download-resume:");
resumeCmd?.run(ctx);
```

**Expected:** Each command executes and calls the appropriate context action.

---

## Verification Checklist

- [ ] TypeScript compiles without errors
- [ ] Registry has exactly 15 commands
- [ ] All 5 command kinds are represented
- [ ] Navigation commands use correct slugs:
  - `/work/tanger-outlets` (not `/work/tanger`)
  - `/work/coca-cola-creative-technology` (not `/work/coke`)
  - `/work/pfaff-designs` (not `/work/pfaff-designs-portfolio`)
- [ ] Filter commands returns matches correctly
- [ ] Filter commands returns help when no matches
- [ ] Visibility functions work (selection-based commands)
- [ ] All context actions log correctly
- [ ] Commands execute and call context actions
- [ ] No UI components were created

---

## Quick Verification

Run this one-liner to verify everything compiles:

```bash
npx tsc --noEmit --project tsconfig.json
```

Then run the test script:

```bash
npx tsx scripts/test-cmdk-phase-10.1.ts
```

If both pass, Phase 10.1 is complete! ✅

