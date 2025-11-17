"use client";

import * as React from "react";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Heading } from "@/components/atoms/Heading";
import { ContentBlock, type ContentBlockItem } from "@/components/molecules/ContentBlock";
import type { CaseStudyHeroFacts } from "@/lib/kb/CaseStudyHeroFacts";

export interface CaseStudyHeroProps extends CaseStudyHeroFacts {
  className?: string;
}

const CaseStudyHero = React.forwardRef<HTMLElement, CaseStudyHeroProps>(
  (
    {
      client,
      projectNameOrUrl,
      role,
      description,
      yearOrTimeline,
      team,
      className,
    },
    ref
  ) => {
    // Check if projectNameOrUrl is a URL
    const isUrl = projectNameOrUrl.startsWith("http://") || projectNameOrUrl.startsWith("https://");
    const projectUrl = isUrl ? projectNameOrUrl : undefined;
    const projectName = isUrl ? new URL(projectNameOrUrl).hostname.replace(/^www\./, "") : projectNameOrUrl;

    // Build content block items from hero facts
    const contentItems: ContentBlockItem[] = [
      { eyebrow: "Role", body: role },
      { body: description },
      { eyebrow: "Timeline", body: yearOrTimeline },
      { eyebrow: "Team", body: team },
    ];

    return (
      <Section ref={ref} className={className}>
        <Container>
          <div className="flex flex-col gap-6 w-full">
            {/* Client name as main heading */}
            <Heading text={client} variant="hero" level={1} />
            
            {/* Project name/URL as subheading */}
            {projectUrl ? (
              <a 
                href={projectUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-accent-primary hover:underline"
              >
                <Heading text={projectName} variant="subheading" level={2} />
              </a>
            ) : (
              <Heading text={projectName} variant="subheading" level={2} />
            )}
            
            {/* Content block with role, description, timeline, team */}
            <ContentBlock
              headline=""
              items={contentItems}
              headlineVariant="headline"
              headlineClassName="hidden"
            />
          </div>
        </Container>
      </Section>
    );
  }
);

CaseStudyHero.displayName = "CaseStudyHero";

export { CaseStudyHero };

