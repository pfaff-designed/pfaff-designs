"use client";

import * as React from "react";
import { Composer } from "@/components/molecules/Composer";
import { Renderer } from "@/components/utility/Renderer";
import type { PageJSON } from "@/components/utility/Renderer";
import { TypingIndicator } from "@/components/ui/TypingIndicator";

type QueryStatus = "idle" | "loading" | "success" | "error";

interface QueryResponse {
  query: string;
  response: string;
  timestamp: number;
}

/**
 * Format a date to relative time (e.g., "2 seconds ago", "1 minute ago")
 */
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds !== 1 ? "s" : ""} ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
};

export default function Home() {
  const [renderedContent, setRenderedContent] = React.useState<PageJSON | null>(null);
  const [queries, setQueries] = React.useState<QueryResponse[]>([]);
  const [status, setStatus] = React.useState<QueryStatus>("idle");
  const [lastPrompt, setLastPrompt] = React.useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState<string | null>(null);
  const [currentResponseId, setCurrentResponseId] = React.useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = React.useState<string | undefined>();
  const [currentResponse, setCurrentResponse] = React.useState<string | undefined>();

  const handleComposerSubmit = React.useCallback(
    async (query: string) => {
      // Set loading state
      setStatus("loading");
      setLastPrompt(query);
      setCurrentQuery(query);
      setCurrentResponse(undefined);
      setCurrentResponseId(null);

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

        const apiResponse = await response.json();

        // Validate that we received a valid response structure (not an error)
        if (apiResponse.error) {
          console.error("API returned error:", apiResponse);
          throw new Error(apiResponse.message || apiResponse.error || "API returned an error");
        }

        // Validate new response shape
        if (!apiResponse.id || !apiResponse.prompt || !apiResponse.createdAt || !apiResponse.layout) {
          console.error("Invalid response structure:", apiResponse);
          throw new Error("Invalid response structure from API");
        }

        // Validate layout structure
        const pageJSON = apiResponse.layout;
        if (!pageJSON.version || !pageJSON.page || !pageJSON.page.blocks) {
          console.error("Invalid layout structure:", pageJSON);
          throw new Error("Invalid layout structure in API response");
        }

        // Update rendered content with the layout
        setRenderedContent(pageJSON);

        // Set success state with response metadata
        setStatus("success");
        setLastUpdatedAt(apiResponse.createdAt);
        setCurrentResponseId(apiResponse.id);

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
        
        // Set error state
        setStatus("error");
        setCurrentResponse(`Sorry, there was an error processing your query: ${errorMessage}`);
        // Don't clear renderedContent on error - keep previous content visible
      }
    },
    []
  );

  return (
    <main className="min-h-screen bg-default">
      {/* Renderer Content Area */}
      <div>
        {status === "loading" ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <TypingIndicator />
          </div>
        ) : status === "idle" && !renderedContent ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="max-w-[25rem] text-left">
              <p className="text-base leading-5 text-[#26291d]">
                Hey 👋, my name is Charles, I'm a design-minded engineer interested in helping you build scalable ai products using generative ui. Thanks for checking out my portfolio don't forget to say hi below vvv
              </p>
            </div>
          </div>
        ) : (
          <Renderer 
            data={renderedContent} 
            status={status}
            responseId={currentResponseId || lastUpdatedAt || renderedContent?.page?.id}
            isLatest={true}
          />
        )}
      </div>

      {/* Composer - Fixed at bottom */}
      <Composer
        placeholder="Tell me about yourself"
        onSubmit={handleComposerSubmit}
        recentQuery={currentQuery}
        recentResponse={currentResponse}
        status={status}
        lastPrompt={lastPrompt}
        lastUpdatedAt={lastUpdatedAt}
      />
    </main>
  );
}
