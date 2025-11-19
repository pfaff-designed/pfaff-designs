"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { getCaseStudyBySlug } from "@/lib/caseStudies/data";
import { ContentSection } from "@/components/page-components/ContentSection";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Renderer } from "@/components/utility/Renderer";
import { TypingIndicator } from "@/components/ui/TypingIndicator";
import { useAIAnswer } from "@/components/ai/AIAnswerContext";
import { useSection } from "@/components/ai/SectionContext";
import { SectionAIAnswer } from "@/components/ai/SectionAIAnswer";
import Link from "next/link";

export default function CaseStudyPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const caseStudy = getCaseStudyBySlug(slug);
  
  if (!caseStudy) {
    notFound();
  }

  const { state, getSectionAnswer } = useAIAnswer();
  const { answerLayout, status, sectionAnswers } = state;
  const { registerSection, unregisterSection } = useSection();

  // Register sections when they mount - use callback refs
  const sectionRefCallback = React.useCallback(
    (sectionId: string, sectionHeading: string) => (el: HTMLElement | null) => {
      if (el) {
        registerSection(sectionId, sectionHeading, el);
      } else {
        unregisterSection(sectionId);
      }
    },
    [registerSection, unregisterSection]
  );

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

      {/* Static Case Study Content - Show when no AI answer or idle */}
      {(!answerLayout || status === "idle") && (
        <>
          {/* Hero Section */}
          <Section className="pt-[6rem] md:pt-[8rem] pb-[4rem] md:pb-[6rem]">
            <Container>
              <div className="max-w-4xl space-y-[1.5rem]">
                <ContentSection
                  variant="default"
                  eyebrow={`Case Study · ${caseStudy.client}`}
                  headline={caseStudy.projectName}
                  body={`${caseStudy.timeframe ? `${caseStudy.timeframe} — ` : ""}${caseStudy.roleSummary} ${caseStudy.heroSummary}`}
                />
                {caseStudy.url && (
                  <div>
                    <Link
                      href={caseStudy.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--accent-primary)] hover:opacity-80 transition-opacity text-sm"
                    >
                      Visit {caseStudy.projectName} →
                    </Link>
                  </div>
                )}
              </div>
            </Container>
          </Section>

          {/* Content Sections */}
          <div className="pb-[6rem] md:pb-[8rem]">
            {caseStudy.sections.map((section) => {
              const sectionAnswer = getSectionAnswer(section.id);
              
              // Debug logging
              React.useEffect(() => {
                console.log("[CaseStudyPage] Section render", {
                  sectionId: section.id,
                  sectionHeading: section.heading,
                  hasSectionAnswer: !!sectionAnswer,
                  answerStatus: sectionAnswer?.status,
                  hasAnswerLayout: !!sectionAnswer?.answerLayout,
                  allSectionIds: Array.from(state.sectionAnswers.keys()),
                });
              }, [section.id, sectionAnswer, state.sectionAnswers]);
              
              return (
                <React.Fragment key={section.id}>
                  <Section 
                    id={section.id} 
                    className="py-[4rem] md:py-[6rem]"
                    ref={sectionRefCallback(section.id, section.heading)}
                  >
                    <Container>
                      {/* Original human-authored content */}
                      <ContentSection
                        variant="default"
                        eyebrow={section.eyebrow}
                        headline={section.heading}
                        body={section.body}
                      />
                      
                      {/* Inline AI answer (rendered below original content) */}
                      {sectionAnswer && (
                        <SectionAIAnswer
                          sectionId={section.id}
                          answerId={sectionAnswer.answerId}
                          answerLayout={sectionAnswer.answerLayout}
                          status={sectionAnswer.status}
                          isStreaming={sectionAnswer.status === "loading"}
                          responseId={sectionAnswer.answerId}
                        />
                      )}
                    </Container>
                  </Section>
                </React.Fragment>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}