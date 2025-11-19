"use client";

import * as React from "react";
import { caseStudies } from "@/lib/caseStudies/data";
import { homePageData } from "@/lib/pages/home/data";
import { ContentSection } from "@/components/page-components/ContentSection";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import Link from "next/link";
import { Heading } from "@/components/atoms/Heading";
import { BodyText } from "@/components/atoms/BodyText";
import { Renderer } from "@/components/utility/Renderer";
import { TypingIndicator } from "@/components/ui/TypingIndicator";
import { useAIAnswer } from "@/components/ai/AIAnswerContext";

export default function Home() {
  const { state } = useAIAnswer();
  const { answerLayout, status } = state;

  return (
    <main className="min-h-screen bg-[var(--bg-default)]">
      {/* Static Content - Only show when no AI content */}
      {status === "idle" && !answerLayout && (
        <>
          {/* Hero Section */}
          <Section className="pt-[6rem] md:pt-[8rem] pb-[4rem] md:pb-[6rem]">
            <Container>
              <ContentSection
                variant="default"
                eyebrow={homePageData.hero.eyebrow}
                headline={homePageData.hero.headline}
                body={homePageData.hero.body}
              />
            </Container>
          </Section>

          {/* Selected Work Section */}
          <Section className="py-[4rem] md:py-[6rem]">
            <Container>
              <div className="space-y-[3rem] md:space-y-[4rem]">
                <ContentSection
                  variant="default"
                  eyebrow={homePageData.selectedWork.eyebrow}
                  headline={homePageData.selectedWork.headline}
                  body={homePageData.selectedWork.body}
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

      {status === "idle" && !answerLayout && (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="max-w-[25rem] text-left">
            <p className="text-base leading-5 text-[var(--text-default)]">
              {homePageData.welcomeMessage}
            </p>
          </div>
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
    </main>
  );
}
