import { ContentSection } from "@/components/page-components/ContentSection";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { aboutPageData } from "@/lib/pages/about/data";

export default function About() {
  return (
    <main className="min-h-screen bg-[var(--bg-default)]">
      {/* About Me Section */}
      <Section className="pt-[6rem] md:pt-[8rem] pb-[4rem] md:pb-[6rem]">
        <Container>
          <div className="max-w-3xl mx-auto space-y-[4rem] md:space-y-[6rem]">
            {aboutPageData.sections.map((section, index) => (
              <ContentSection
                key={index}
                variant="default"
                eyebrow={section.eyebrow}
                headline={section.headline}
                body={section.body}
              />
            ))}
          </div>
        </Container>
      </Section>
    </main>
  );
}

