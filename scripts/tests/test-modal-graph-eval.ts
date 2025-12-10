import "dotenv/config";
import { runModalGraphEval, type ModalGraphEvalInput } from "@/lib/ai/eval/runModalGraphEval";
import * as fs from "fs";

async function testEvalFunction() {
  console.log("🧪 Testing runModalGraphEval function\n");

  // Test case 1: answer_direct mode
  console.log("Test 1: answer_direct mode");
  console.log("---------------------------");
  const test1: ModalGraphEvalInput = {
    question: "What tools did you use on this project?",
    pagePath: "/work/capital-one-travel",
    projectSlug: "capital-one-travel",
    sectionHeadline: "Travel rewards, refined",
    sectionText: "Short description of this section",
    history: [],
  };

  try {
    const result1 = await runModalGraphEval(test1);
    console.log("✅ Result:", {
      mode: result1.mode,
      answerLength: result1.answer.length,
      trajectory: result1.trajectory,
      debugNotesCount: result1.debugNotes?.length ?? 0,
    });
    console.log("Answer preview:", result1.answer.substring(0, 100) + "...\n");
  } catch (err) {
    console.error("❌ Error:", err);
  }

  // Test case 2: clarify_then_answer mode
  console.log("Test 2: clarify_then_answer mode");
  console.log("--------------------------------");
  const test2: ModalGraphEvalInput = {
    question: "What other projects has he worked on?",
    pagePath: "/work/capital-one-travel",
    projectSlug: "capital-one-travel",
    sectionHeadline: "Travel rewards, refined",
    sectionText: "",
    history: [],
  };

  try {
    const result2 = await runModalGraphEval(test2);
    console.log("✅ Result:", {
      mode: result2.mode,
      answerLength: result2.answer.length,
      trajectory: result2.trajectory,
      debugNotesCount: result2.debugNotes?.length ?? 0,
    });
    console.log("Answer preview:", result2.answer.substring(0, 100) + "...\n");
  } catch (err) {
    console.error("❌ Error:", err);
  }

  // Test case 3: low_context_fallback mode
  console.log("Test 3: low_context_fallback mode");
  console.log("----------------------------------");
  const test3: ModalGraphEvalInput = {
    question: "What kind of work does he do?",
    pagePath: "/work",
    projectSlug: null,
    sectionHeadline: "",
    sectionText: "",
    history: [],
  };

  try {
    const result3 = await runModalGraphEval(test3);
    console.log("✅ Result:", {
      mode: result3.mode,
      answerLength: result3.answer.length,
      trajectory: result3.trajectory,
      debugNotesCount: result3.debugNotes?.length ?? 0,
    });
    console.log("Answer preview:", result3.answer.substring(0, 100) + "...\n");
  } catch (err) {
    console.error("❌ Error:", err);
  }

  // Test case 4: Using actual dataset example
  console.log("Test 4: Using dataset example");
  console.log("-----------------------------");
  try {
    const datasetData = fs.readFileSync("langsmith/datasets/ds-mode-routing.jsonl", "utf8");
    const firstExample = JSON.parse(datasetData.split("\n")[0]);
    
    const test4: ModalGraphEvalInput = {
      question: firstExample.input.question,
      pagePath: firstExample.input.pagePath || "",
      projectSlug: firstExample.input.projectSlug || null,
      sectionHeadline: firstExample.input.sectionHeadline || "",
      sectionText: firstExample.input.sectionText || "",
      history: firstExample.input.history || [],
    };

    const result4 = await runModalGraphEval(test4);
    console.log("✅ Result:", {
      mode: result4.mode,
      expectedMode: firstExample.outputs?.expected_mode,
      modeMatch: result4.mode === firstExample.outputs?.expected_mode,
      answerLength: result4.answer.length,
      trajectory: result4.trajectory,
    });
    console.log("Full answer:", result4.answer);
    console.log("Debug notes:", result4.debugNotes?.slice(0, 5));
  } catch (err) {
    console.error("❌ Error:", err);
  }

  console.log("\n✅ All tests complete!");
}

testEvalFunction().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

