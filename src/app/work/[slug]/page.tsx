import { notFound } from "next/navigation";
import { getCaseStudyBySlug } from "@/lib/caseStudies/data";
import { ContentSection } from "@/components/page-components/ContentSection";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import Link from "next/link";

interface CaseStudyPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CaseStudyPage({ params }: CaseStudyPageProps) {
  const { slug } = await params;
  const caseStudy = getCaseStudyBySlug(slug);

  if (!caseStudy) {
    notFound();
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
        {caseStudy.sections.map((section) => (
          <Section key={section.id} id={section.id} className="py-[4rem] md:py-[6rem]">
            <Container>
              <ContentSection
                variant="default"
                eyebrow={section.eyebrow}
                headline={section.heading}
                body={section.body}
              />
            </Container>
          </Section>
        ))}
      </div>
    </main>
  );
}

