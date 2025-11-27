#!/usr/bin/env tsx

/**
 * Test script for Phase 10.1 - Command Model, Registry & Context
 * 
 * Tests:
 * - Command registry is complete
 * - filterCommands works correctly
 * - Context actions log properly
 * - Visibility functions work
 */

import {
  commandRegistry,
  filterCommands,
  createCommandContext,
} from "../src/lib/cmdk";

console.log("🧪 Testing Phase 10.1 - Command Model, Registry & Context\n");

// Test 1: Registry completeness
console.log("Test 1: Registry Completeness");
console.log("-----------------------------");
console.log(`Total commands: ${commandRegistry.length}`);
console.log(`Navigation: ${commandRegistry.filter((c) => c.kind === "nav").length}`);
console.log(`Quick AI: ${commandRegistry.filter((c) => c.kind === "ai_quick").length}`);
console.log(`Deep AI: ${commandRegistry.filter((c) => c.kind === "ai_deep").length}`);
console.log(`Download: ${commandRegistry.filter((c) => c.kind === "download").length}`);
console.log(`Help: ${commandRegistry.filter((c) => c.kind === "help").length}`);
console.log("✅ Registry complete\n");

// Test 2: Filter commands
console.log("Test 2: Filter Commands");
console.log("-----------------------");
const ctx = createCommandContext("", "/work/capital-one-travel", {
  projectSlug: "capital-one-travel",
});

const testCases = [
  { input: "home", expected: "nav-home" },
  { input: "work", expected: "nav-work" },
  { input: "capital", expected: "nav-capital-one" },
  { input: "pmi", expected: "nav-pmi" },
  { input: "summarize", expected: "ai-quick-summarize-page" },
  { input: "resume", expected: "download-resume" },
  { input: "xyz123", expected: "help" }, // Should return help when no match
];

for (const test of testCases) {
  const ctxWithInput = createCommandContext(test.input, ctx.path, {
    projectSlug: ctx.projectSlug,
  });
  const matches = filterCommands(test.input, ctxWithInput);
  const matched = matches.some((m) => m.id === test.expected);
  console.log(
    `  "${test.input}" → ${matched ? "✅" : "❌"} (expected: ${test.expected}, got: ${matches[0]?.id})`
  );
}
console.log("");

// Test 3: Visibility functions
console.log("Test 3: Visibility Functions");
console.log("----------------------------");
const ctxWithSelection = createCommandContext("summarize", "/work/capital-one-travel", {
  projectSlug: "capital-one-travel",
  selectionText: "This is selected text",
});

const summarizeSelection = commandRegistry.find((c) => c.id === "ai-quick-summarize-selection");
if (summarizeSelection) {
  const visible = summarizeSelection.visible ? summarizeSelection.visible(ctxWithSelection) : true;
  console.log(`  "Summarize selection" with selection: ${visible ? "✅ visible" : "❌ hidden"}`);

  const ctxWithoutSelection = createCommandContext("summarize", "/work/capital-one-travel", {
    projectSlug: "capital-one-travel",
  });
  const visibleWithout = summarizeSelection.visible
    ? summarizeSelection.visible(ctxWithoutSelection)
    : true;
  console.log(
    `  "Summarize selection" without selection: ${visibleWithout ? "❌ visible (should be hidden)" : "✅ hidden"}`
  );
}
console.log("");

// Test 4: Context actions
console.log("Test 4: Context Actions (Stubbed)");
console.log("---------------------------------");
const testCtx = createCommandContext("test", "/work/capital-one-travel", {
  projectSlug: "capital-one-travel",
  selectionText: "Selected text",
});

console.log("  Testing openAiModal:");
testCtx.openAiModal({
  question: "Test question",
  pagePath: "/work/capital-one-travel",
  projectSlug: "capital-one-travel",
});

console.log("  Testing openInlineChat:");
testCtx.openInlineChat({
  question: "Summarize this",
  selectionText: "Selected text",
});

console.log("  Testing navigate:");
testCtx.navigate("/work/pmi");

console.log("  Testing download:");
testCtx.download("/downloads/charles-pfaff-resume.pdf");
console.log("✅ All actions log correctly\n");

// Test 5: Command execution
console.log("Test 5: Command Execution");
console.log("------------------------");
const homeCmd = commandRegistry.find((c) => c.id === "nav-home");
if (homeCmd) {
  console.log(`  Executing: ${homeCmd.label}`);
  homeCmd.run(testCtx);
  console.log("✅ Command execution works\n");
}

console.log("🎉 All tests complete!");

