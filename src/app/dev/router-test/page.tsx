/**
 * Dev Harness for Router Testing
 * 
 * A simple page to manually test the router with various queries
 */

"use client";

import { useState } from "react";
import { callRouter } from "@/lib/ai/routerClient";
import type { RouterInput, RouterResult } from "@/lib/ai/routerTypes";

const TEST_QUERIES = [
  "take me to the PMI page",
  "tell me about tools",
  "what is your approach to AI?",
  "scroll to the outcomes section",
  "open the Capital One case study",
];

export default function RouterTestPage() {
  const [query, setQuery] = useState("");
  const [pageSlug, setPageSlug] = useState("/");
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [projectSlug, setProjectSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RouterResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const input: RouterInput = {
        query,
        pageSlug,
        sectionId,
        projectSlug,
      };

      const routerResult = await callRouter(input);
      setResult(routerResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleTestQuery = (testQuery: string) => {
    setQuery(testQuery);
  };

  return (
    <div className="min-h-screen p-8 bg-[color:var(--bg-default)]">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-[color:var(--text-default)]">
          Router Test Harness
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium mb-2 text-[color:var(--text-default)]">
              Query
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg bg-[color:var(--bg-surface)] text-[color:var(--text-default)]"
              placeholder="Enter a query..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-[color:var(--text-default)]">
                Page Slug
              </label>
              <input
                type="text"
                value={pageSlug}
                onChange={(e) => setPageSlug(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg bg-[color:var(--bg-surface)] text-[color:var(--text-default)]"
                placeholder="/"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-[color:var(--text-default)]">
                Section ID (optional)
              </label>
              <input
                type="text"
                value={sectionId || ""}
                onChange={(e) => setSectionId(e.target.value || null)}
                className="w-full px-4 py-2 border rounded-lg bg-[color:var(--bg-surface)] text-[color:var(--text-default)]"
                placeholder="overview, process, etc."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[color:var(--text-default)]">
              Project Slug (optional)
            </label>
            <input
              type="text"
              value={projectSlug || ""}
              onChange={(e) => setProjectSlug(e.target.value || null)}
              className="w-full px-4 py-2 border rounded-lg bg-[color:var(--bg-surface)] text-[color:var(--text-default)]"
              placeholder="capital-one-travel, tanger-outlets, etc."
            />
          </div>

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-2 bg-[color:var(--accent-primary)] text-[color:var(--text-default)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Routing..." : "Route Query"}
          </button>
        </form>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-[color:var(--text-default)]">
            Test Queries
          </h2>
          <div className="flex flex-wrap gap-2">
            {TEST_QUERIES.map((testQuery) => (
              <button
                key={testQuery}
                onClick={() => handleTestQuery(testQuery)}
                className="px-4 py-2 text-sm bg-[color:var(--bg-surface)] text-[color:var(--text-default)] rounded-lg hover:opacity-80"
              >
                {testQuery}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[color:var(--text-default)]">
              Router Result
            </h2>
            <div className="p-4 bg-[color:var(--bg-surface)] rounded-lg">
              <pre className="text-sm text-[color:var(--text-default)] overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[color:var(--text-default)]">
                Actions ({result.actions.length})
              </h3>
              {result.actions.map((action) => (
                <div
                  key={action.id}
                  className="p-4 border rounded-lg bg-[color:var(--bg-surface)]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-[color:var(--text-default)]">
                      {action.label}
                    </span>
                    <span className="text-sm text-[color:var(--text-muted)]">
                      Confidence: {(action.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-sm text-[color:var(--text-muted)]">
                    Type: <code className="bg-[color:var(--bg-default)] px-2 py-1 rounded">{action.type}</code>
                  </div>
                  {action.type === "navigate" && (
                    <div className="mt-2 text-sm text-[color:var(--text-default)]">
                      → <code>{action.href}</code>
                    </div>
                  )}
                  {action.type === "scroll" && (
                    <div className="mt-2 text-sm text-[color:var(--text-default)]">
                      → Section: <code>{action.sectionId}</code>
                    </div>
                  )}
                  {action.type === "quick_answer" && (
                    <div className="mt-2 text-sm text-[color:var(--text-default)]">
                      Answer: <pre className="mt-1 p-2 bg-[color:var(--bg-default)] rounded text-xs overflow-auto">
                        {JSON.stringify(action.answerJSON, null, 2)}
                      </pre>
                    </div>
                  )}
                  {action.type === "open_modal" && (
                    <div className="mt-2 text-sm text-[color:var(--text-default)]">
                      Modal Query: <code>{action.modalQuery}</code>
                    </div>
                  )}
                  {action.type === "clarify" && (
                    <div className="mt-2 text-sm text-[color:var(--text-default)]">
                      Options:
                      <ul className="list-disc list-inside mt-1">
                        {action.options.map((option, idx) => (
                          <li key={idx}>{option}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

