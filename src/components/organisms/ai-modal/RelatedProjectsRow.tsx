"use client";

import * as React from "react";
import { ProjectLink } from "@/components/molecules/ProjectLink";
import { cn } from "@/lib/utils";
import type { RelatedProject } from "@/app/api/ai/modal/route";

export interface RelatedProjectsRowProps {
  projects: RelatedProject[];
  className?: string;
  onLinkClick?: () => void;
}

/**
 * RelatedProjectsRow
 * 
 * Displays related project links in a row below AI answers.
 * Matches the layout pattern of AiConversationRow and AiActionsRow.
 */
export const RelatedProjectsRow: React.FC<RelatedProjectsRowProps> = ({
  projects,
  className,
  onLinkClick,
}) => {
  if (!projects || projects.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-6 md:flex-row md:gap-6 mt-[19px]", className)}>
      {/* Empty spacer to align with body content - matches eyebrow column width */}
      <div className="hidden md:block md:w-[7.25rem] shrink-0" aria-hidden="true" />
      
      {/* Projects container - aligned with body text */}
      <div className="flex flex-wrap gap-3 flex-1 max-w-[24.25rem]">
        {projects.map((project, index) => (
          <ProjectLink
            key={`${project.slug}-${index}`}
            slug={project.slug}
            label={project.label}
            path={project.path}
            reason={project.reason}
            onClick={onLinkClick}
          />
        ))}
      </div>
    </div>
  );
};

RelatedProjectsRow.displayName = "RelatedProjectsRow";

