"use client";

import { useState } from "react";

type HistoryItem = {
  role: "user" | "assistant";
  content: string;
};

export default function ModalGraphDevPage() {
  const [question, setQuestion] = useState("tell me more");
  const [pagePath, setPagePath] = useState("/work/capital-one-travel");
  const [projectSlug, setProjectSlug] = useState("capital-one-travel");
  const [sectionHeadline, setSectionHeadline] = useState("Travel rewards, refined");
  const [sectionText, setSectionText] = useState("Short description of this section");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Before calling fetch, append the user's question to history
      const userTurn: HistoryItem = { role: "user", content: question };
      const updatedHistory = [...history, userTurn];
      setHistory(updatedHistory);

      const payload = {
        question,
        pagePath,
        projectSlug,
        sectionHeadline,
        sectionText,
        history: updatedHistory,
      };

      console.log("[DevModalGraph] Request payload:", payload);

      const res = await fetch("/api/dev/modal-graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      console.log("[DevModalGraph] Response data:", data);

      setResponse(data);

      // After receiving the response, append the assistant's answer to history
      if (data.answerText) {
        setHistory((prev) => [
          ...prev,
          { role: "assistant", content: data.answerText },
        ]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error("[DevModalGraph] Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    setResponse(null);
    setError(null);
  };

  return (
    <div className="min-h-screen p-8 bg-[color:var(--bg-default)]">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-[color:var(--text-default)]">
          Modal Graph Dev Harness
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium mb-2 text-[color:var(--text-default)]">
              Question *
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg bg-[color:var(--bg-surface)] text-[color:var(--text-default)]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-[color:var(--text-default)]">
                Page Path
              </label>
              <input
                type="text"
                value={pagePath}
                onChange={(e) => setPagePath(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg bg-[color:var(--bg-surface)] text-[color:var(--text-default)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-[color:var(--text-default)]">
                Project Slug
              </label>
              <input
                type="text"
                value={projectSlug}
                onChange={(e) => setProjectSlug(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg bg-[color:var(--bg-surface)] text-[color:var(--text-default)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[color:var(--text-default)]">
              Section Headline
            </label>
            <input
              type="text"
              value={sectionHeadline}
              onChange={(e) => setSectionHeadline(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg bg-[color:var(--bg-surface)] text-[color:var(--text-default)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[color:var(--text-default)]">
              Section Text
            </label>
            <textarea
              value={sectionText}
              onChange={(e) => setSectionText(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg bg-[color:var(--bg-surface)] text-[color:var(--text-default)] min-h-[80px]"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="px-6 py-2 bg-[color:var(--accent-primary)] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Invoking..." : "Invoke Graph"}
            </button>

            {history.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="px-6 py-2 bg-[color:var(--bg-surface)] text-[color:var(--text-default)] border rounded-lg hover:opacity-80"
              >
                Clear History
              </button>
            )}
          </div>
        </form>

        {/* Conversation History UI */}
        {history.length > 0 && (
          <div className="mb-8 p-4 bg-[color:var(--bg-surface)] rounded-lg border">
            <h2 className="text-xl font-semibold mb-4 text-[color:var(--text-default)]">
              Conversation History ({history.length} turns)
            </h2>
            <ul className="space-y-2">
              {history.map((turn, i) => (
                <li key={i} className="text-sm">
                  <strong className={turn.role === "user" ? "text-[color:var(--text-default)]" : "text-[color:var(--accent-primary)]"}>
                    {turn.role === "user" ? "You" : "Agent"}:
                  </strong>{" "}
                  <span className="text-[color:var(--text-muted)]">{turn.content}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}

        {response && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[color:var(--text-default)]">
              Response
            </h2>
            <div className="p-4 bg-[color:var(--bg-surface)] rounded-lg border">
              <pre className="text-sm text-[color:var(--text-default)] overflow-auto whitespace-pre-wrap">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>

            {response.answerText && (
              <div className="p-4 bg-[color:var(--bg-surface)] rounded-lg border">
                <h3 className="text-lg font-semibold mb-2 text-[color:var(--text-default)]">
                  Answer Text
                </h3>
                <p className="text-[color:var(--text-default)] whitespace-pre-wrap">
                  {response.answerText}
                </p>
              </div>
            )}

            {response.mode && (
              <div className="p-4 bg-[color:var(--bg-surface)] rounded-lg border">
                <h3 className="text-lg font-semibold mb-2 text-[color:var(--text-default)]">
                  Mode
                </h3>
                <code className="text-sm text-[color:var(--text-default)]">
                  {response.mode}
                </code>
              </div>
            )}

            {response.debugNotes && response.debugNotes.length > 0 && (
              <div className="p-4 bg-[color:var(--bg-surface)] rounded-lg border">
                <h3 className="text-lg font-semibold mb-2 text-[color:var(--text-default)]">
                  Debug Notes
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-[color:var(--text-muted)]">
                  {response.debugNotes.map((note: string, i: number) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

            {response.contextBlob && (
              <div className="p-4 bg-[color:var(--bg-surface)] rounded-lg border">
                <h3 className="text-lg font-semibold mb-2 text-[color:var(--text-default)]">
                  Context Blob
                </h3>
                <pre className="text-sm text-[color:var(--text-muted)] whitespace-pre-wrap overflow-auto">
                  {response.contextBlob}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

