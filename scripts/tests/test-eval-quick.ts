import "dotenv/config";
import { runModalGraphEval } from "@/lib/ai/eval/runModalGraphEval";

async function quickTest() {
  const result = await runModalGraphEval({
    question: "What tools did you use on this project?",
    pagePath: "/work/capital-one-travel",
    projectSlug: "capital-one-travel",
    sectionHeadline: "Travel rewards, refined",
    sectionText: "Short description",
    history: [],
  });

  console.log(JSON.stringify(result, null, 2));
}

quickTest();

