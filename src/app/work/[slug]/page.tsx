"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { getCaseStudyBySlug } from "@/lib/caseStudies/data";
import { ContentSection, type ContentSectionVariant } from "@/components/page-components/ContentSection";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Renderer } from "@/components/utility/Renderer";
import { TypingIndicator } from "@/components/ui/TypingIndicator";
import { useAIAnswer } from "@/components/organisms/ai/AIAnswerContext";
import { useSection } from "@/components/organisms/ai/SectionContext";
import { SectionAIAnswer } from "@/components/organisms/ai/SectionAIAnswer";
import { MediaImage } from "@/components/organisms/media/MediaImage";
import { getProjectBySlug } from "@/lib/projects/registry";
import { getMediaItemById, SUPABASE_MEDIA_BUCKET } from "@/lib/media/registry";
import { getPublicStorageURL } from "@/lib/supabase/storage";
import { getToolsForCaseStudy } from "@/lib/caseStudies/tools";
import Link from "next/link";
import { getSectionImageURLSync } from "@/lib/media/sectionImages";

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
          <div className="">
            {caseStudy.sections.map((section, index) => {
              const sectionAnswer = getSectionAnswer(section.id);
              
              // Get section image URL first to determine if we should use image variants
              const sectionImageUrl = getSectionImageURLSync(slug, index + 1);
              const hasValidImage = sectionImageUrl && sectionImageUrl.trim() !== "";
              const isLastSection = index === caseStudy.sections.length - 1;
              
              // Determine section variant based on pattern:
              // - Even indices (0, 2, 4...): 2-column-image-right
              // - Odd indices (1, 3, 5...): 2-column-image-left
              // - Last section: text-with-image (if image available)
              // - Fall back to default if no image available
              const getSectionVariant = (): ContentSectionVariant => {
                // If no image, use default variant
                if (!hasValidImage) {
                  return "default";
                }
                
                // Last section uses text-with-image if image is available
                if (isLastSection) {
                  return "text-with-image";
                }
                
                // Alternate between right and left for other sections
                // Even indices (0, 2, 4...) → right
                // Odd indices (1, 3, 5...) → left
                return index % 2 === 0 ? "2-column-image-right" : "2-column-image-left";
              };
              
              const sectionVariant = getSectionVariant();
              const shouldUseSectionImage = (sectionVariant === "2-column-image-right" || sectionVariant === "2-column-image-left" || sectionVariant === "text-with-image") && hasValidImage;
              
              return (
                <React.Fragment key={section.id}>
                  {sectionVariant === "text-with-image" ? (
                    <>
                      {/* Full-width variant handles its own Section/Container */}
                      <div ref={sectionRefCallback(section.id, section.heading)} className="w-full max-w-none">
                        <ContentSection
                          variant={sectionVariant}
                          eyebrow={section.eyebrow}
                          headline={section.heading}
                          body={section.body}
                          sectionId={section.id}
                          projectSlug={slug}
                          sectionIndex={index + 1}
                          imageSrc={shouldUseSectionImage ? sectionImageUrl : undefined}
                          imageAlt={shouldUseSectionImage ? `${caseStudy.projectName} - ${section.heading}` : undefined}
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
                      </div>
                    </>
                  ) : (
                    <Section 
                      id={section.id} 
                      className="py-[4rem] md:py-[6rem]"
                      ref={sectionRefCallback(section.id, section.heading)}
                    >
                      <Container>
                        {/* Original human-authored content */}
                        <ContentSection
                          variant={sectionVariant}
                          eyebrow={section.eyebrow}
                          headline={section.heading}
                          body={section.body}
                          sectionId={section.id}
                          projectSlug={slug}
                          sectionIndex={index + 1}
                          imageSrc={shouldUseSectionImage ? sectionImageUrl : undefined}
                          imageAlt={shouldUseSectionImage ? `${caseStudy.projectName} - ${section.heading}` : undefined}
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
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}