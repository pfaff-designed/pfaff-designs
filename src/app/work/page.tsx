"use client";

import * as React from "react";
import { caseStudies } from "@/lib/caseStudies/data";
import { workPageData } from "@/lib/pages/work/data";
import { ContentSection } from "@/components/page-components/ContentSection";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Renderer } from "@/components/utility/Renderer";
import { TypingIndicator } from "@/components/ui/TypingIndicator";
import { useAIAnswer } from "@/components/organisms/ai/AIAnswerContext";
import { ProjectCardGrid } from "@/components/molecules/ProjectCardGrid";
import { useRouter } from "next/navigation";

export default function Work() {
  const { state } = useAIAnswer();
  const { answerLayout, status } = state;
  const router = useRouter();

  // Map first 3 case studies to ProjectCardGrid format
  const projectCards = React.useMemo(() => {
    // Filter out Tanger (temporarily hidden)
    const filteredStudies = caseStudies.filter(s => s.slug !== "tanger-outlets");
    const selectedStudies = filteredStudies.slice(0, 3);
    const projectTypeMap: Record<string, string> = {
      "capital-one-travel": "Travel Platform",
      "pmi": "Certification Site",
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
              <ProjectCardGrid cards={projectCards} />
            </Container>
          </Section>
        </>
      )}
    </main>
  );
}

