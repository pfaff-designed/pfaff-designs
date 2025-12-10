"use server";

import { notFound } from "next/navigation";
import { getCaseStudyBySlug } from "@/lib/caseStudies/data";
import { getProjectBySlug } from "@/lib/projects/registry";
import { getToolsForCaseStudy } from "@/lib/caseStudies/tools";
import { CaseStudyPageClient } from "./pageClient";

export default async function CaseStudyPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  
  // Block Tanger page (temporarily hidden) and Real Estate Platform (confidential)
  if (slug === "tanger-outlets" || slug === "real-estate-platform") {
    notFound();
  }
  
  const caseStudy = getCaseStudyBySlug(slug);
  const projectMeta = getProjectBySlug(slug);
  if (!caseStudy) {
    notFound();
  }

  const tools = await getToolsForCaseStudy(slug);

  return (
    <CaseStudyPageClient
      slug={slug}
      caseStudy={caseStudy}
      projectMeta={projectMeta}
      tools={tools}
                        />
  );
}