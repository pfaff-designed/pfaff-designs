"use client";

import * as React from "react";
import { caseStudies } from "@/lib/caseStudies/data";
import { workPageData } from "@/lib/pages/work/data";
import { ContentSection } from "@/components/page-components/ContentSection";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import Link from "next/link";
import { Heading } from "@/components/atoms/Heading";
import { BodyText } from "@/components/atoms/BodyText";
import { Renderer } from "@/components/utility/Renderer";
import { TypingIndicator } from "@/components/ui/TypingIndicator";
import { useAIAnswer } from "@/components/ai/AIAnswerContext";

export default function Work() {
  const { state } = useAIAnswer();
  const { answerLayout, status } = state;

  return (
    <main className="min-h-screen bg-[var(--bg-default)]">
      {/* AI Content - Show when answerLayout is available */}
      {status === "loading" && (
        <div className="flex items-center justify-center min-h-[50vh]">
          <TypingIndicator />
        </div>
      )}

      {answerLayout && (
        <Renderer 
          data={answerLayout} 
          status={status}
          responseId={state.lastUpdatedAt || answerLayout?.page?.id}
          isLatest={true}
        />
      )}

      {/* Static Work Content - Show when no AI answer or idle */}
      {(!answerLayout || status === "idle") && (
        <>
          {/* Hero Section */}
          <Section className="pt-[6rem] md:pt-[8rem] pb-[4rem] md:pb-[6rem]">
            <Container>
              <ContentSection
                variant="default"
                eyebrow={workPageData.hero.eyebrow}
                headline={workPageData.hero.headline}
                body={workPageData.hero.body}
              />
            </Container>
          </Section>

          {/* Case Studies Grid */}
          <Section className="py-[4rem] md:py-[6rem]">
            <Container>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[2rem] md:gap-[3rem]">
                {caseStudies.map((study) => (
                  <Link
                    key={study.slug}
                    href={`/work/${study.slug}`}
                    className="group block"
                  >
                    <div className="border border-[var(--border-subtle)] rounded-md p-[1.5rem] md:p-[2rem] bg-[var(--bg-default)] hover:border-[var(--text-default)] hover:border-opacity-20 transition-colors h-full flex flex-col">
                      <div className="space-y-[0.75rem] flex-1">
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
                          className="text-sm line-clamp-4"
                        />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Container>
          </Section>
        </>
      )}
    </main>
  );
}

