"use client";

import * as React from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Error logged silently
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-default)]">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[var(--text-default)] mb-2">Something went wrong</h1>
        <p className="text-[var(--text-default)] opacity-70 mb-4">{error.message}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-[var(--accent-primary)] text-[var(--bg-default)] rounded-full hover:opacity-80 transition-opacity"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

