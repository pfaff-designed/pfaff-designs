import * as React from "react";
import { ProjectCardGrid as BaseProjectCardGrid, type ProjectCardGridItem } from "@/components/molecules/ProjectCardGrid";

export interface ProjectCardGridProps {
  projectCards?: [
    ProjectCardGridItem,
    ProjectCardGridItem,
    ProjectCardGridItem
  ];
}

export const ProjectCardGrid: React.FC<ProjectCardGridProps> = ({ projectCards }) => {
  if (!projectCards || projectCards.length !== 3) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "ProjectCardGrid variant requires exactly 3 project cards. Falling back to empty state."
      );
    }
    return null;
  }

  return <BaseProjectCardGrid cards={projectCards} />;
};

