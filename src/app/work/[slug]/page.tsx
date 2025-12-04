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
import { MediaImage } from "@/components/media/MediaImage";
import { getProjectBySlug } from "@/lib/projects/registry";
import { getMediaItemById, SUPABASE_MEDIA_BUCKET } from "@/lib/media/registry";
import { getPublicStorageURL } from "@/lib/supabase/storage";
import { getToolsForCaseStudy } from "@/lib/caseStudies/tools";
import Link from "next/link";

export default function CaseStudyPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  // Temporarily block Tanger page
  if (slug === "tanger-outlets") {
    notFound();
  }
  
  const caseStudy = getCaseStudyBySlug(slug);
  const projectMeta = getProjectBySlug(slug);
  
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
          {projectMeta && (() => {
            const heroMedia = getMediaItemById(projectMeta.heroImageId);
            const heroImageUrl = heroMedia ? getPublicStorageURL(SUPABASE_MEDIA_BUCKET, heroMedia.path) : undefined;
            // Filter out empty strings (when Supabase is not configured)
            const validHeroImageUrl = heroImageUrl && heroImageUrl.trim() !== "" ? heroImageUrl : undefined;
            
            // Truncate body to 30 words max
            const truncateToWords = (text: string, maxWords: number): string => {
              const words = text.trim().split(/\s+/);
              if (words.length <= maxWords) return text;
              return words.slice(0, maxWords).join(" ") + "...";
            };
            
            // Use heroSummary and truncate to 30 words
            const heroBody = truncateToWords(caseStudy.heroSummary || "", 30);
            
            // Normalize year format to "year-year" format
            const normalizeYearFormat = (timeframe: string | undefined): string | undefined => {
              if (!timeframe) return undefined;
              
              // Replace " to " with "-"
              let normalized = timeframe.replace(/\s+to\s+/gi, "-");
              
              // Replace en-dash (U+2013) or em-dash (U+2014) with regular hyphen
              normalized = normalized.replace(/[–—]/g, "-");
              
              // Trim any extra whitespace
              normalized = normalized.trim();
              
              return normalized;
            };
            
            const formattedYear = normalizeYearFormat(caseStudy.timeframe);
            
            return (
              <ContentSection
                variant="full-width"
                eyebrow={formattedYear}
                headline={caseStudy.projectName}
                body={heroBody}
                imageSrc={validHeroImageUrl}
                imageAlt={heroMedia?.alt || `${caseStudy.projectName} hero image`}
                projectDetails={{
                  tools: getToolsForCaseStudy(slug),
                  role: caseStudy.roleSummary,
                  year: caseStudy.timeframe,
                }}
                projectUrl={caseStudy.url}
              />
            );
          })()}

          {/* Content Sections */}
          <div className="pb-[6rem] md:pb-[8rem]">
            {caseStudy.sections.map((section, index) => {
              const sectionAnswer = getSectionAnswer(section.id);
              
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
                        sectionId={section.id}
                        projectSlug={slug}
                        sectionIndex={index + 1}
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