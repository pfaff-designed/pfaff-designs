import { config } from "dotenv";
import { Client } from "langsmith";
import * as fs from "fs";

// Load .env.local explicitly
config({ path: ".env.local" });

async function pushDataset(name: string, filePath: string) {
  const client = new Client({
    apiKey: process.env.LANGSMITH_API_KEY,
  });

  const data = fs.readFileSync(filePath, "utf8");

  // JSONL ingestion
  const rows = data
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));

  console.log(`Uploading dataset "${name}" with ${rows.length} rows...`);

  // Try to create dataset, but continue if it already exists
  try {
    await client.createDataset(name);
    console.log(`Created new dataset: ${name}`);
  } catch (err: any) {
    if (err.status === 409) {
      console.log(`Dataset "${name}" already exists, continuing...`);
    } else {
      throw err;
    }
  }

  for (const row of rows) {
    await client.createExample({
      dataset_name: name,
      inputs: row.input,
      outputs: {
        expected_mode: row.expected_mode ?? undefined,
        expected_trajectory: row.expected_trajectory ?? undefined,
        good_answer_description: row.good_answer_description ?? undefined,
      },
      metadata: { id: row.id },
    });
  }

  console.log(`Finished: ${name}`);
}

async function main() {
  await pushDataset(
    "ds-final-answer-quality",
    "langsmith/datasets/ds-final-answer-quality.jsonl"
  );
  await pushDataset(
    "ds-mode-routing",
    "langsmith/datasets/ds-mode-routing.jsonl"
  );
  await pushDataset(
    "ds-trajectory",
    "langsmith/datasets/ds-trajectory.jsonl"
  );
}

main();