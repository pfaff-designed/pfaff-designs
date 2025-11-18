import { ContentSection } from "@/components/page-components/ContentSection";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";

export default function About() {
  return (
    <main className="min-h-screen bg-[var(--bg-default)]">
      {/* About Me Section */}
      <Section className="pt-[6rem] md:pt-[8rem] pb-[4rem] md:pb-[6rem]">
        <Container>
          <div className="max-w-3xl mx-auto space-y-[4rem] md:space-y-[6rem]">
            <ContentSection
              variant="default"
              eyebrow="About"
              headline="Design-minded engineer focused on generative UI"
              body="I'm a front-end engineer and technologist who specializes in building scalable AI products using generative UI. My work sits at the intersection of design, engineering, and applied AI—I help teams translate complex AI capabilities into intuitive, user-focused experiences. I've worked with companies like Capital One, building modular component systems and RAG-driven interfaces that make AI feel natural and accessible."
            />

            <ContentSection
              variant="default"
              eyebrow="How I work"
              headline="Collaboration-first approach to design engineering"
              body="I believe the best products come from close collaboration between design, engineering, and product teams. My workflow starts with understanding user needs and design intent, then translating those into flexible, maintainable code. I focus on building component systems that are both beautiful and extensible, ensuring that design decisions scale across teams and products. Whether working with React, TypeScript, or integrating AI capabilities, I prioritize clarity, consistency, and user experience."
            />
          </div>
        </Container>
      </Section>
    </main>
  );
}

