// DEPRECATED in v1.5: kept only to fail loudly. All conversational AI MUST go through /api/ai/modal.
export async function POST() {
  return new Response(
    JSON.stringify({
      error: "This endpoint is deprecated in v1.5 — use /api/ai/modal instead.",
    }),
    { status: 410, headers: { "Content-Type": "application/json" } },
    );
}

