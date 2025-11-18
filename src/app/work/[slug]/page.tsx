"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { notFound } from "next/navigation";
import { routeQuestion, type CurrentRoute } from "@/lib/ai/router";
import type { CopywriterInput, CopywriterOutput } from "@/lib/ai/copywriter";
import { getCaseStudyBySlug } from "@/lib/caseStudies/data";
import { ContentSection } from "@/components/page-components/ContentSection";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import Link from "next/link";

type AiAnswerBlock = {
  id: string;
  sectionId: string | null; // null can mean page-level answer, but for case studies we'll usually use a real section id
  question: string;
  body: string;
};

export default function CaseStudyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const slug = params.slug as string;
  
  const caseStudy = getCaseStudyBySlug(slug);
  
  if (!caseStudy) {
    notFound();
  }

  const [aiAnswers, setAiAnswers] = useState<AiAnswerBlock[]>([]);
  const [isAnswering, setIsAnswering] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const processedQuestionRef = useRef<string | null>(null);

  const answerOnThisPage = useCallback(
    async (question: string, sectionId: string | null) => {
      if (!caseStudy) return;

      // Choose which section this answer belongs to:
      // 1) If router gave us a valid sectionId, use that.
      // 2) Else if we already have a currentSectionId, stick with it.
      // 3) Else default to the first section.
      let targetSection =
        (sectionId &&
          caseStudy.sections.find((s) => s.id === sectionId)) ||
        (currentSectionId &&
          caseStudy.sections.find((s) => s.id === currentSectionId)) ||
        caseStudy.sections[0];

      if (!targetSection) return;

      // Track the "active" section for follow-up questions.
      setCurrentSectionId(targetSection.id);
      setIsAnswering(true);

      const context = [
        caseStudy.heroSummary,
        caseStudy.roleSummary,
        `Section: ${targetSection.eyebrow} — ${targetSection.heading}`,
        targetSection.body,
      ]
        .filter(Boolean)
        .join("\n\n");

      const projectShortFacts = {
        client: caseStudy.client,
        projectNameOrUrl: caseStudy.projectName || caseStudy.url,
        role: caseStudy.roleSummary,
        description: caseStudy.heroSummary,
        yearOrTimeline: caseStudy.timeframe,
      };

      try {
        const copywriterInput: CopywriterInput = {
          question,
          context,
          projectId: caseStudy.slug,
          sectionTitle: targetSection.heading,
          sectionBody: targetSection.body,
          projectShortFacts,
        };

        const response = await fetch("/api/copywriter", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(copywriterInput),
        });

        if (!response.ok) {
          throw new Error(`Copywriter API error: ${response.statusText}`);
        }

        const output: CopywriterOutput = await response.json();
        const aiBody =
          output.answer_blocks?.[0]?.body?.trim() || targetSection.body;

        // Append a new AI answer block - stack it below the target section
        setAiAnswers((prev) => [
          ...prev,
          {
            id: `${targetSection.id}-${Date.now()}`,
            sectionId: targetSection.id,
            question,
            body: aiBody,
          },
        ]);

        // Scroll to the target section so the user sees the new answer
        setTimeout(() => {
          document
            .getElementById(targetSection.id)
            ?.scrollIntoView({ behavior: "smooth" });
        }, 0);
      } catch (err) {
        console.error("❌ Copywriter error:", err);
      } finally {
        setIsAnswering(false);
      }
    },
    [caseStudy, currentSectionId]
  );

  useEffect(() => {
    const question = searchParams.get("q");

    if (question) {
      // Check if we've already processed this question in this session
      const processedKey = `processed-${slug}-${question}`;
      const wasProcessed = sessionStorage.getItem(processedKey);
      
      if (!wasProcessed && question !== processedQuestionRef.current) {
        processedQuestionRef.current = question;
        sessionStorage.setItem(processedKey, "true");

        // Defer to avoid state updates during render
        setTimeout(() => {
          // Save current scroll position before processing
          const scrollY = window.scrollY;
          
          const currentRoute: CurrentRoute = { kind: "case_study", slug };
          const intent = routeQuestion(currentRoute, question);

          if (intent.type === "answer_on_page") {
            answerOnThisPage(question, intent.sectionId ?? null);
          } else if (intent.type === "go_to_case_study" && intent.slug === slug) {
            answerOnThisPage(question, null);
          }
          
          // Restore scroll position if we haven't scrolled yet
          // (answerOnThisPage will scroll to section, but this prevents jump to top)
          requestAnimationFrame(() => {
            if (window.scrollY === 0 && scrollY > 0) {
              window.scrollTo(0, scrollY);
            }
          });
        }, 0);
      }
    }
  }, [searchParams, slug, answerOnThisPage]);

  async function handleQuestionSubmit(question: string) {
    // ✅ question is now in scope because it's a fn arg
    const currentRoute: CurrentRoute = { kind: "case_study", slug }; // ✅ slug comes from props

    const intent = routeQuestion(currentRoute, question);
    console.log("🧠 AI router intent:", intent);

    if (intent.type === "go_to_case_study") {
      if (intent.slug === slug) {
        // same page → treat as page-local answer
        await answerOnThisPage(question, null);
      } else {
        router.push(`/work/${intent.slug}?q=${encodeURIComponent(question)}`);
      }
      return;
    }

    if (intent.type === "answer_on_page") {
      await answerOnThisPage(question, intent.sectionId ?? null);
      return;
    }

    if (intent.type === "go_to_about") {
      router.push(`/about?q=${encodeURIComponent(question)}`);
      return;
    }

    if (intent.type === "go_to_contact") {
      router.push(
        `/contact?message=${encodeURIComponent(intent.originalQuestion)}`
      );
      return;
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg-default)]">
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
          const sectionAnswers = aiAnswers.filter(
            (a) => a.sectionId === section.id
          );

          return (
            <Section key={section.id} id={section.id} className="py-[4rem] md:py-[6rem]">
              <Container>
                <div className="space-y-6 md:space-y-8">
                  {/* Original human-authored section */}
                  <ContentSection
                    variant="default"
                    eyebrow={section.eyebrow}
                    headline={section.heading}
                    body={section.body}
                  />

                  {/* Stacked AI answers beneath this section */}
                  {sectionAnswers.map((answer) => (
                    <ContentSection
                      key={answer.id}
                      variant="default"
                      eyebrow="AI · Generated Response"
                      headline=""
                      body={answer.body}
                      isAI={true}
                    />
                  ))}
                </div>
              </Container>
            </Section>
          );
        })}
      </div>
    </main>
  );
}