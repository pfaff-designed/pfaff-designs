"use client";

import * as React from "react";
import { caseStudies } from "@/lib/caseStudies/data";
import { homePageData } from "@/lib/pages/home/data";
import { ContentSection } from "@/components/page-components/ContentSection";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Renderer } from "@/components/utility/Renderer";
import { TypingIndicator } from "@/components/ui/TypingIndicator";
import { useAIAnswer } from "@/components/organisms/ai/AIAnswerContext";
import { ImageContainer } from "@/components/atoms/ImageContainer";
import { SUPABASE_MEDIA_BUCKET, getMediaItemById } from "@/lib/media/registry";
import { getPublicStorageURL } from "@/lib/supabase/storage";
import { ProjectCardGrid } from "@/components/molecules/ProjectCardGrid";
import { getSectionImageURLSync } from "@/lib/media/sectionImages";
import { useRouter } from "next/navigation";
import { Heading } from "@/components/atoms/Heading";
import { PortfolioImage } from "@/components/atoms/PortfolioImage";
import { BodyText } from "@/components/atoms/BodyText";

export default function Home() {
  const { state } = useAIAnswer();
  const { answerLayout, status } = state;
  const router = useRouter();

  // Map case studies to ProjectCardGrid format
  const projectCards = React.useMemo(() => {
    // Filter out Tanger (temporarily hidden) and Real Estate Platform (confidential)
    const filteredStudies = caseStudies.filter(s => s.slug !== "tanger-outlets" && s.slug !== "real-estate-platform");
    
    // Get specific case studies: Coke first, then Pfaff.Design, then the rest
    const cokeStudy = filteredStudies.find(s => s.slug === "coca-cola-creative-technology");
    const pfaffStudy = filteredStudies.find(s => s.slug === "pfaff-designs");
    
    // Build selected studies: Coke first, Pfaff.Design second, then the rest (excluding Coke and Pfaff)
    const selectedStudies: typeof filteredStudies = [];
    if (cokeStudy) {
      selectedStudies.push(cokeStudy);
    }
    if (pfaffStudy) {
      selectedStudies.push(pfaffStudy);
    }
    // Add the rest, excluding Coke and Pfaff
    const remainingStudies = filteredStudies.filter(
      s => s.slug !== "coca-cola-creative-technology" && s.slug !== "pfaff-designs"
    );
    selectedStudies.push(...remainingStudies);
    
    const projectTypeMap: Record<string, string> = {
      "capital-one-travel": "Travel Platform",
      "pmi": "Certification Site",
      "coca-cola-creative-technology": "Creative Technology",
      "pfaff-designs": "Portfolio Platform",
    };

    // Helper to extract first 1-2 sentences from text
    const getOneLiner = (text: string): string => {
      // Split by sentence endings (. ! ?)
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      // Take first 1-2 sentences, but limit to ~150 characters
      const oneLiner = sentences.slice(0, 2).join(' ').trim();
      return oneLiner.length > 150 ? oneLiner.substring(0, 147) + '...' : oneLiner;
    };

    // Helper to get background image for each case study
    const getBackgroundImage = (slug: string): string | undefined => {
      // Use hero image for Coke
      if (slug === "coca-cola-creative-technology") {
        const heroMedia = getMediaItemById("hero-coke");
        if (heroMedia) {
          return getPublicStorageURL(heroMedia.bucket, heroMedia.path);
        }
        return undefined;
      }
      
      // For other case studies, use final section image
      const finalSectionMap: Record<string, number> = {
        "capital-one-travel": 5,
        "pmi": 5,
        "pfaff-designs": 4,
      };
      
      const finalSection = finalSectionMap[slug];
      if (!finalSection) return undefined;
      
      const imageUrl = getSectionImageURLSync(slug, finalSection);
      return imageUrl || undefined;
    };

    const activeCards = selectedStudies.map((study, index) => ({
      id: study.slug,
      projectName: study.projectName,
      client: study.client,
      role: study.roleSummary,
      projectType: projectTypeMap[study.slug] || study.roleSummary,
      oneLiner: getOneLiner(study.heroSummary),
      variant: index === 1 ? ("light" as const) : ("dark" as const),
      fillColor: "dark" as const,
      backgroundImage: getBackgroundImage(study.slug),
      onClick: () => router.push(`/work/${study.slug}`),
    }));

    // Add disabled "coming soon" cards
    const comingSoonCards = [
      {
        id: "tanger-coming-soon",
        projectName: "Tanger",
        client: "",
        role: "coming soon",
        projectType: "",
        oneLiner: "",
        variant: "dark" as const,
        fillColor: "dark" as const,
        backgroundImage: "https://ijwldoqqihdtwegdjjwf.supabase.co/storage/v1/object/public/media/tanger/tanger-hero.jpg",
        disabled: true,
        onClick: undefined,
      },
      {
        id: "confidential-coming-soon",
        projectName: "Confidential",
        client: "",
        role: "coming soon",
        projectType: "",
        oneLiner: "",
        variant: "light" as const,
        fillColor: "dark" as const,
        backgroundImage: "https://ijwldoqqihdtwegdjjwf.supabase.co/storage/v1/object/public/media/RealBerry/RE-hero.jpg",
        disabled: true,
        onClick: undefined,
      },
    ];

    return [...activeCards, ...comingSoonCards];
  }, [router]);

  return (
    <main className="min-h-screen bg-[var(--bg-default)]">
      {/* Static Content - Only show when no AI content */}
      {status === "idle" && !answerLayout && (
        <>
          {/* Introduction Section - Moved to top */}
          <Section className="h-[85vh] flex items-center">
            <Container>
              <div className="max-w-[25rem] mx-auto text-left -mt-20">
                <BodyText
                  body={homePageData.welcomeMessage}
                  variant="default"
                  className="text-base leading-5"
                />
              </div>
            </Container>
          </Section>

          {/* Selected Work Section */}
          <Section 
            className="pt-[4rem] md:pt-[6rem] -mt-[15vh] px-[1.5rem] md:px-[2rem] lg:px-[3rem] !max-w-none"
          >
            {/* Case Studies Grid */}
            <ProjectCardGrid cards={projectCards} />
          </Section>

          {/* About Section */}
          <Section className="!pt-0 pb-12">
            <Container>
              <ContentSection
                variant="2-column-image-right"
                imageSrc="https://ijwldoqqihdtwegdjjwf.supabase.co/storage/v1/object/public/media/profile-pic.png"
                imageAlt="Profile picture"
                eyebrow={homePageData.about.eyebrow}
                headline={homePageData.about.headline}
                body={homePageData.about.body}
              />
              {/* <div className="w-full max-w-[26.28125rem] mx-auto">
                <PortfolioImage
                  imageSrc="https://ijwldoqqihdtwegdjjwf.supabase.co/storage/v1/object/public/media/profile-pic.png"
                  alt="Profile picture"
                  containerClassName="w-full aspect-[3/4]"
                  objectFit="contain"
                />
              </div> */}
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
