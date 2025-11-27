import { config } from "dotenv";
import { Client } from "langsmith";
import { wrapOpenAI } from "langsmith/wrappers";
import OpenAI from "openai";
import { evaluate } from "langsmith/evaluation";
import { createLLMAsJudge } from "openevals";
import { runModalGraphEval, type ModalGraphEvalInput } from "../src/lib/ai/eval/runModalGraphEval";

// Load .env.local explicitly
config({ path: ".env.local" });

// Wrap the OpenAI client for LangSmith tracing
const openai = wrapOpenAI(new OpenAI());

// Define the application logic to evaluate
// Dataset inputs are automatically sent to this target function
async function target(inputs: ModalGraphEvalInput): Promise<{
  mode: string;
  answer: string;
  trajectory: string[];
  debugNotes?: string[];
}> {
  const result = await runModalGraphEval(inputs);
  return {
    mode: result.mode,
    answer: result.answer,
    trajectory: result.trajectory,
    debugNotes: result.debugNotes,
  };
}

// Define evaluators

// 1. Mode Routing Evaluator - checks if the mode matches expected_mode
async function modeRoutingEvaluator(params: {
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  referenceOutputs?: Record<string, unknown>;
}): Promise<{ key: string; score: number; comment?: string }> {
  const expectedMode = params.referenceOutputs?.expected_mode as string | undefined;
  const actualMode = params.outputs.mode as string;

  if (!expectedMode) {
    return { key: "mode_routing", score: 0, comment: "No expected_mode in reference outputs" };
  }

  const score = actualMode === expectedMode ? 1 : 0;
  const comment =
    score === 1
      ? `Correctly routed to ${actualMode}`
      : `Expected ${expectedMode}, got ${actualMode}`;

  return { key: "mode_routing", score, comment };
}

// 2. Answer Quality Evaluator - LLM-as-a-judge to evaluate answer quality
// Using openevals' createLLMAsJudge
const ANSWER_QUALITY_PROMPT = `You are evaluating an AI assistant's answer to a question about a portfolio/work experience.

Question: {question}
Expected Mode: {expected_mode}
Good Answer Description: {good_answer_description}

Actual Answer:
{answer}

Evaluate the answer on a scale of 0-1 based on:
1. Accuracy: Does it correctly answer the question?
2. Completeness: Does it provide sufficient detail?
3. Mode Compliance: Does it match the expected mode behavior (e.g., no follow-up for answer_direct, one follow-up for clarify_then_answer)?
4. Tone: Is it professional and appropriate?

Respond with ONLY a JSON object: { "score": <0-1>, "comment": "<brief explanation>" }`;

// Create the LLM judge evaluator using openevals
const answerQualityEvaluator = createLLMAsJudge({
  prompt: ANSWER_QUALITY_PROMPT,
  model: "openai:gpt-4o-mini",
  feedbackKey: "answer_quality",
});

// 3. Trajectory Evaluator - checks if trajectory includes expected nodes
async function trajectoryEvaluator(params: {
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  referenceOutputs?: Record<string, unknown>;
}): Promise<{ key: string; score: number; comment?: string }> {
  const expectedTrajectory =
    (params.referenceOutputs?.expected_trajectory as string[] | undefined) ||
    [];
  const actualTrajectory = (params.outputs.trajectory as string[]) || [];

  if (expectedTrajectory.length === 0) {
    // If no expected trajectory, check that we have the standard nodes
    const requiredNodes = [
      "derive_context",
      "retrieve_chunks",
      "build_context_blob",
      "conversation_policy",
      "generate_answer",
    ];
    const hasAllNodes = requiredNodes.every((node) =>
      actualTrajectory.includes(node)
    );
    return {
      key: "trajectory",
      score: hasAllNodes ? 1 : 0,
      comment: hasAllNodes
        ? "All required nodes present"
        : `Missing nodes: ${requiredNodes.filter((n) => !actualTrajectory.includes(n)).join(", ")}`,
    };
  }

  // Check if expected nodes are in actual trajectory
  const matches = expectedTrajectory.filter((node) =>
    actualTrajectory.includes(node)
  ).length;
  const score = expectedTrajectory.length > 0 ? matches / expectedTrajectory.length : 0;

  return {
    key: "trajectory",
    score,
    comment: `${matches}/${expectedTrajectory.length} expected nodes found`,
  };
}

async function main() {
  // Ensure datasets are pushed to LangSmith first
  console.log("📋 Make sure datasets are pushed to LangSmith:");
  console.log("   Run: npm run eval:push-datasets\n");

  const datasets = [
    {
      name: "ds-mode-routing",
      evaluators: [modeRoutingEvaluator],
      description: "Evaluates mode routing correctness",
    },
    {
      name: "ds-final-answer-quality",
      evaluators: [answerQualityEvaluator, modeRoutingEvaluator],
      description: "Evaluates answer quality and mode compliance",
    },
    {
      name: "ds-trajectory",
      evaluators: [trajectoryEvaluator],
      description: "Evaluates execution trajectory",
    },
  ];

  for (const dataset of datasets) {
    console.log(`\n🚀 Running evaluation on ${dataset.name}...`);
    console.log(`Description: ${dataset.description}`);

    try {
      const experimentPrefix = `experiment-${dataset.name}-${Date.now()}`;

      await evaluate(target, {
        data: dataset.name,
        evaluators: dataset.evaluators,
        experimentPrefix,
        maxConcurrency: 2,
      });

      console.log(`✅ Completed evaluation for ${dataset.name}`);
      console.log(`   Experiment: ${experimentPrefix}`);
      console.log(`   View results in LangSmith: https://smith.langchain.com`);
    } catch (err) {
      console.error(`❌ Error evaluating ${dataset.name}:`, err);
      if (err instanceof Error && err.message.includes("not found")) {
        console.error(`   💡 Tip: Make sure dataset "${dataset.name}" exists in LangSmith`);
        console.error(`   Run: npm run eval:push-datasets`);
      }
    }
  }

  console.log("\n✨ All evaluations complete!");
  console.log("📊 View results in LangSmith: https://smith.langchain.com");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

