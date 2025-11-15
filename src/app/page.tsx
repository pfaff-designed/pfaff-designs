"use client";

import * as React from "react";
import { Composer } from "@/components/molecules/Composer";
import { Renderer } from "@/components/utility/Renderer";
import type { PageJSON } from "@/components/utility/Renderer";

interface QueryResponse {
  query: string;
  response: string;
  timestamp: number;
}

export default function Home() {
  const [renderedContent, setRenderedContent] = React.useState<PageJSON | null>(null);
  const [queries, setQueries] = React.useState<QueryResponse[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentQuery, setCurrentQuery] = React.useState<string | undefined>();
  const [currentResponse, setCurrentResponse] = React.useState<string | undefined>();

  const handleComposerSubmit = React.useCallback(
    async (query: string) => {
      setIsLoading(true);
      setCurrentQuery(query);
      setCurrentResponse(undefined);

      try {
        // Call API route to process query server-side
        const response = await fetch("/api/query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("API error response:", errorData);
          throw new Error(`API error: ${response.status} ${errorData.error?.message || response.statusText}`);
        }

        const pageJSON = await response.json();

        // Debug: Log the received JSON
        console.log("Received pageJSON:", pageJSON);
        console.log("PageJSON blocks:", pageJSON?.page?.blocks);

        // Validate that we received a valid PageJSON structure (not an error)
        if (pageJSON.error) {
          console.error("API returned error:", pageJSON);
          throw new Error(pageJSON.message || pageJSON.error || "API returned an error");
        }

        // Validate PageJSON structure
        if (!pageJSON.version || !pageJSON.page || !pageJSON.page.blocks) {
          console.error("Invalid PageJSON structure:", pageJSON);
          throw new Error("Invalid response structure from API");
        }

        // Update rendered content
        setRenderedContent(pageJSON);

        // Generate a simple text response for the composer display
        // In the real implementation, this would come from the AI response
        const responseText = `I've generated a response to your query: "${query}". The content is displayed above.`;

        setCurrentResponse(responseText);

        // Add to queries history
        setQueries((prev) => [
          {
            query,
            response: responseText,
            timestamp: Date.now(),
          },
          ...prev,
        ]);
      } catch (error) {
        console.error("Error handling query:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Full error details:", error);
        setCurrentResponse(`Sorry, there was an error processing your query: ${errorMessage}`);
        // Don't clear renderedContent on error - keep previous content visible
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return (
    <main className="min-h-screen bg-default">
      {/* Renderer Content Area */}
      <div>
        <Renderer data={renderedContent} />
      </div>

      {/* Composer - Fixed at bottom */}
      <Composer
        placeholder="Tell me about yourself"
        onSubmit={handleComposerSubmit}
        recentQuery={currentQuery}
        recentResponse={currentResponse}
      />
    </main>
  );
}
