"use client";

import * as React from "react";
import { ContentSection } from "@/components/page-components/ContentSection";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { aboutPageData } from "@/lib/pages/about/data";
import { Renderer } from "@/components/utility/Renderer";
import { TypingIndicator } from "@/components/ui/TypingIndicator";
import { useAIAnswer } from "@/components/ai/AIAnswerContext";

export default function About() {
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

      {/* Static About Content - Show when no AI answer or idle */}
      {(!answerLayout || status === "idle") && (
        <>
          {aboutPageData.sections.map((section, index) => (
            <ContentSection
              key={index}
              variant={section.variant || "default"}
              eyebrow={section.eyebrow}
              headline={section.headline}
              body={section.body}
              imageSrc={section.imageSrc}
              imageAlt={section.imageAlt}
              containerSize={section.variant === "text-with-image" ? "wide" : "default"}
            />
          ))}
        </>
      )}
    </main>
  );
}

