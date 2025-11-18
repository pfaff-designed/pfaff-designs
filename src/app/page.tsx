"use client";

import * as React from "react";
import { caseStudies } from "@/lib/caseStudies/data";
import { ContentSection } from "@/components/page-components/ContentSection";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import Link from "next/link";
import { Heading } from "@/components/atoms/Heading";
import { BodyText } from "@/components/atoms/BodyText";
import { Composer } from "@/components/molecules/Composer";
import { Renderer } from "@/components/utility/Renderer";
import type { PageJSON } from "@/components/utility/Renderer";
import { TypingIndicator } from "@/components/ui/TypingIndicator";

type QueryStatus = "idle" | "loading" | "success" | "error";

export default function Home() {
  const [renderedContent, setRenderedContent] = React.useState<PageJSON | null>(null);
  const [status, setStatus] = React.useState<QueryStatus>("idle");
  const [lastPrompt, setLastPrompt] = React.useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState<string | null>(null);
  const [currentResponseId, setCurrentResponseId] = React.useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = React.useState<string | undefined>();

  const handleComposerSubmit = React.useCallback(
    async (query: string) => {
      setStatus("loading");
      setLastPrompt(query);
      setCurrentQuery(query);
      setCurrentResponseId(null);

      try {
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

        if (apiResponse.error) {
          console.error("API returned error:", apiResponse);
          throw new Error(apiResponse.message || apiResponse.error || "API returned an error");
        }

        if (!apiResponse.id || !apiResponse.prompt || !apiResponse.createdAt || !apiResponse.layout) {
          console.error("Invalid response structure:", apiResponse);
          throw new Error("Invalid response structure from API");
        }

        const pageJSON = apiResponse.layout;
        if (!pageJSON.version || !pageJSON.page || !pageJSON.page.blocks) {
          console.error("Invalid layout structure:", pageJSON);
          throw new Error("Invalid layout structure in API response");
        }

        setRenderedContent(pageJSON);
        setStatus("success");
        setLastUpdatedAt(apiResponse.createdAt);
        setCurrentResponseId(apiResponse.id);
      } catch (error) {
        console.error("Error handling query:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Full error details:", error);
        
        setStatus("error");
      }
    },
    []
  );

  return (
    <main className="min-h-screen bg-[var(--bg-default)]">
      {/* Static Content - Only show when no AI content */}
      {status === "idle" && !renderedContent && (
        <>
          {/* Hero Section */}
          <Section className="pt-[6rem] md:pt-[8rem] pb-[4rem] md:pb-[6rem]">
            <Container>
              <ContentSection
                variant="default"
                eyebrow="Design-minded engineer · Applied AI"
                headline="Building scalable AI products with generative UI"
                body="I'm a design-minded engineer focused on creating RAG-driven front-ends and generative UI experiences. I work at the intersection of design, engineering, and AI to build products that are both beautiful and intelligent. This portfolio showcases my work building scalable AI products that help teams deliver better user experiences."
              />
            </Container>
          </Section>

          {/* Selected Work Section */}
          <Section className="py-[4rem] md:py-[6rem]">
            <Container>
              <div className="space-y-[3rem] md:space-y-[4rem]">
                <ContentSection
                  variant="default"
                  eyebrow="Selected Work"
                  headline="Case studies"
                  body="A selection of projects where I've applied design engineering principles to build scalable, user-focused products."
                />

                {/* Case Studies Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[2rem] md:gap-[3rem]">
                  {caseStudies.map((study) => (
                    <Link
                      key={study.slug}
                      href={`/work/${study.slug}`}
                      className="group block"
                    >
                      <div className="border border-[var(--border-subtle)] rounded-md p-[1.5rem] md:p-[2rem] bg-[var(--bg-default)] hover:border-[var(--text-default)] hover:border-opacity-20 transition-colors">
                        <div className="space-y-[0.75rem]">
                          <div className="flex items-start justify-between gap-[1rem]">
                            <div className="flex-1">
                              <p className="text-sm text-[var(--text-muted)] mb-[0.5rem]">
                                {study.client}
                              </p>
                              <Heading
                                text={study.projectName}
                                variant="subheading"
                                level={3}
                                className="group-hover:text-[var(--accent-primary)] transition-colors"
                              />
                            </div>
                            {study.timeframe && (
                              <p className="text-sm text-[var(--text-muted)] whitespace-nowrap">
                                {study.timeframe}
                              </p>
                            )}
                          </div>
                          <BodyText
                            body={study.roleSummary}
                            variant="default"
                            className="text-sm line-clamp-3"
                          />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </Container>
          </Section>
        </>
      )}

      {/* AI Content Area */}
      {status === "loading" && (
        <div className="flex items-center justify-center min-h-[50vh]">
          <TypingIndicator />
        </div>
      )}

      {status === "idle" && !renderedContent && (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="max-w-[25rem] text-left">
            <p className="text-base leading-5 text-[var(--text-default)]">
              Hey 👋, my name is Charles, I'm a design-minded engineer interested in helping you build scalable ai products using generative ui. Thanks for checking out my portfolio don't forget to say hi below vvv
            </p>
          </div>
        </div>
      )}

      {renderedContent && (
        <Renderer 
          data={renderedContent} 
          status={status}
          responseId={currentResponseId || lastUpdatedAt || renderedContent?.page?.id}
          isLatest={true}
        />
      )}

      {/* Composer - Fixed at bottom */}
      <Composer
        placeholder="Tell me about yourself"
        onSubmit={handleComposerSubmit}
        recentQuery={currentQuery}
        status={status}
        lastPrompt={lastPrompt}
        lastUpdatedAt={lastUpdatedAt}
      />
    </main>
  );
}
