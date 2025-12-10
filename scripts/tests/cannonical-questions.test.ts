/**
 * AI Modal Smoke Test
 *
 * Runs a batch of canonical questions against the modal-graph / AI endpoint
 * to catch regressions in tone, routing, and answer quality.
 *
 * Assumes:
 * - dev server running on http://localhost:3000
 * - POST /api/ai/query (or adjust URL below)
 */

import type { Response } from "node-fetch";
import { describe, it, expect, jest } from "@jest/globals";

// If you don't already have fetch in your test env, uncomment this:
// import fetch, { Response } from "node-fetch";
// (global as any).fetch = fetch;

type ModalGraphRequest = {
  question: string;
  pagePath: string;
  projectSlug?: string | null;
  sectionHeadline?: string | null;
  sectionText?: string | null;
  history?: any[];
};

type ModalGraphResponse = {
  answer: string;
  mode?: string;
  debugNotes?: string[];
  actions: Array<any>;
  relatedProjects?: Array<any>;
  navigationIntent?: {
    path: string;
    label: string;
  };
};

const API_URL = "http://localhost:3000/api/ai/modal"; // adjust if needed

const SMOKE_CASES: {
  name: string;
  pagePath: string;
  projectSlug?: string | null;
  questions: string[];
}[] = [
  {
    name: "Home – portfolio AI overview",
    pagePath: "/",
    projectSlug: "pfaff-designs-portfolio",
    questions: [
      "How does this portfolio use AI?",
      "What’s special about how this portfolio is built?",
      "How does the command palette work on this site?",
      "How is this different from a normal portfolio?",
    ],
  },
  {
    name: "Capital One Travel – core case study questions",
    pagePath: "/work/capital-one-travel",
    projectSlug: "capital-one-travel",
    questions: [
      "What did you do on this project?",
      "What tools did you use here?",
      "How did you work with other disciplines on this project?",
      "What was the impact of this work?",
      "Can you give me a quick overview of this case study?",
    ],
  },
  {
    name: "Coca-Cola – AI and creative tech",
    pagePath: "/work/coca-cola",
    projectSlug: "coca-cola",
    questions: [
      "Tell me about your work on this project.",
      "How did AI show up in this project?",
      "What was challenging about this work?",
      "How did you collaborate with other teams here?",
    ],
  },
  {
    name: "PMI – project-scoped, normalized identity",
    pagePath: "/work/pmi",
    projectSlug: "pmi",
    questions: [
      "What did you do on this project?",
      "How did you improve the site for PMI?",
      "What tools and frameworks were you using here?",
      "How did you collaborate with designers and PMs on this?",
    ],
  },
  {
    name: "Low-context / portfolio-wide questions",
    pagePath: "/",
    projectSlug: "pfaff-designs-portfolio",
    questions: [
      "Can you tell me about Charles’s early career?",
      "What did he work on before these case studies?",
      "What are some things that aren’t clear from this portfolio?",
    ],
  },
];

async function callModalGraph(
  payload: ModalGraphRequest,
): Promise<ModalGraphResponse> {
  const res: Response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }) as any;

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Request failed: ${res.status} ${res.statusText} – ${text}`,
    );
  }

  const json = (await res.json()) as ModalGraphResponse;

  if (!json.answer) {
    throw new Error("Modal graph returned no answer");
  }

  return json;
}

describe("AI Modal – smoke test across key flows", () => {
  // give the tests plenty of time; we're calling the model a bunch
  jest.setTimeout(120_000);

  for (const testCase of SMOKE_CASES) {
    describe(testCase.name, () => {
      for (const question of testCase.questions) {
        it(`answers: "${question}"`, async () => {
          const payload: ModalGraphRequest = {
            question,
            pagePath: testCase.pagePath,
            projectSlug: testCase.projectSlug ?? null,
            history: [],
          };

          const res = await callModalGraph(payload);

          // Log for manual inspection when needed
          // (you can comment this out once things stabilize)
          // eslint-disable-next-line no-console
          console.log("\n---");
          console.log(`Case: ${testCase.name}`);
          console.log(`Q: ${question}`);
          console.log(`Mode: ${res.mode}`);
          console.log(
            `Answer:\n${res.answer.slice(0, 600)}${
              res.answer.length > 600 ? "..." : ""
            }`,
          );
          if (res.debugNotes?.length) {
            console.log("Debug notes (last 3):", res.debugNotes.slice(-3));
          }

          // Minimal assertions to catch obvious regressions

          // 1. We should not hit the "brick wall" fallback text anymore
          const lower = res.answer.toLowerCase();
          expect(lower).not.toMatch(
            /do not have enough contextual information|cannot generate a meaningful response/,
          );

          // 2. Answers should be at least somewhat substantive
          expect(res.answer.length).toBeGreaterThan(80);

          // 3. Project pages should mention the client name at least once
          if (testCase.projectSlug === "capital-one-travel") {
            expect(lower).toMatch(/capital one/);
          }
          if (testCase.projectSlug === "coca-cola") {
            expect(lower).toMatch(/coca[-\s]?cola/);
          }
          if (testCase.projectSlug === "pmi") {
            expect(lower).toMatch(
              /project management institute|pmi(\.org)?/,
            );
          }

          // 4. Home-page AI explanation should mention AI system basics
          if (testCase.pagePath === "/" && question.includes("AI")) {
            expect(lower).toMatch(/rag|retrieval|generative ui|command palette/);
          }
        });
      }
    });
  }
});