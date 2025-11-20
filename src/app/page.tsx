"use client";

import * as React from "react";
import { caseStudies } from "@/lib/caseStudies/data";
import { homePageData } from "@/lib/pages/home/data";
import { ContentSection } from "@/components/page-components/ContentSection";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Renderer } from "@/components/utility/Renderer";
import { TypingIndicator } from "@/components/ui/TypingIndicator";
import { useAIAnswer } from "@/components/ai/AIAnswerContext";
import { ImageContainer } from "@/components/atoms/ImageContainer";
import { SUPABASE_MEDIA_BUCKET } from "@/lib/media/registry";
import { getPublicStorageURL } from "@/lib/supabase/storage";
import { ProjectCardGrid } from "@/components/molecules/ProjectCardGrid";
import { useRouter } from "next/navigation";

export default function Home() {
  const { state } = useAIAnswer();
  const { answerLayout, status } = state;
  const router = useRouter();

  // Map first 3 case studies to ProjectCardGrid format
  const projectCards = React.useMemo(() => {
    const selectedStudies = caseStudies.slice(0, 3);
    const projectTypeMap: Record<string, string> = {
      "capital-one-travel": "Travel Platform",
      "pmi": "Certification Site",
      "tanger-outlets": "Digital Experience",
    };

    return selectedStudies.map((study, index) => ({
      id: study.slug,
      projectName: study.projectName,
      client: study.client,
      projectType: projectTypeMap[study.slug] || study.roleSummary,
      variant: index === 1 ? ("light" as const) : ("dark" as const),
      fillColor: "default" as const,
      onClick: () => router.push(`/work/${study.slug}`),
    })) as [
      { id: string; projectName: string; client: string; projectType: string; variant: "dark" | "light"; fillColor: "default"; onClick: () => void },
      { id: string; projectName: string; client: string; projectType: string; variant: "dark" | "light"; fillColor: "default"; onClick: () => void },
      { id: string; projectName: string; client: string; projectType: string; variant: "dark" | "light"; fillColor: "default"; onClick: () => void }
    ];
  }, [router]);

  return (
    <main className="min-h-screen bg-[var(--bg-default)]">
      {/* Static Content - Only show when no AI content */}
      {status === "idle" && !answerLayout && (
        <>
          {/* Introduction Section - Moved to top */}
          <Section className="h-[calc(100vh-13.33333rem)] flex items-center">
            <Container>
              <div className="max-w-[25rem] mx-auto text-left">
                <p className="text-base leading-5 text-[var(--text-default)]">
                  {homePageData.welcomeMessage}
                </p>
              </div>
            </Container>
          </Section>

          {/* Selected Work Section */}
          <Section 
            className="pt-[4rem] md:pt-[6rem] pb-[9rem] md:pb-[9rem] lg:pb-[9rem]"
            style={{ paddingBottom: '144px' }}
          >
            <Container>
              <div className="space-y-[3rem] md:space-y-[4rem]">
                <ContentSection
                  variant="default"
                  eyebrow={homePageData.selectedWork.eyebrow}
                  headline={homePageData.selectedWork.headline}
                  body={homePageData.selectedWork.body}
                />

                {/* Case Studies Grid */}
                <ProjectCardGrid cards={projectCards} />
              </div>
            </Container>
          </Section>

          {/* About Section */}
          <Section className="py-[4rem] md:py-[6rem]">
            <Container>
              <ContentSection
                variant="default"
                eyebrow={homePageData.about.eyebrow}
                headline={homePageData.about.headline}
                body={homePageData.about.body}
              />
              {/* About Section Image */}
              <div className="w-full mt-12 md:mt-16 max-w-[52.5625rem] mx-auto">
                <ImageContainer
                  imageSrc={getPublicStorageURL(SUPABASE_MEDIA_BUCKET, "home/about.jpg")}
                  alt="Design engineer working on AI-powered interfaces"
                  aspectRatio="wide"
                  containerClassName="w-full"
                />
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
