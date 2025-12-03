import * as React from "react";
import { ProjectCard, type ProjectCardProps } from "../ProjectCard";
import { cn } from "@/lib/utils";

export type ProjectCardGridItem = Omit<ProjectCardProps, "className"> & {
  id: string;
};

export interface ProjectCardGridProps {
  cards: ProjectCardGridItem[];
  className?: string;
}

/**
 * ProjectCardGrid
 * Renders project cards in a responsive grid layout:
 * - Desktop: 2-column grid
 * - Mobile: stacks vertically
 * - First 2 cards: top row (1 column each)
 * - Remaining cards: continue in 2-column grid
 */
export const ProjectCardGrid: React.FC<ProjectCardGridProps> = ({
  cards,
  className,
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8",
        className
      )}
    >
      {cards.map((card, index) => {
        // Every third card (index 2, 5, 8, etc.) spans both columns
        const isFullWidth = (index + 1) % 3 === 0;
        
        return (
          <div 
            key={card.id} 
            className={isFullWidth ? "md:col-span-2" : "md:col-span-1"}
          >
            <ProjectCard
              projectName={card.projectName}
              client={card.client}
              projectType={card.projectType}
              variant={card.variant || (index === 1 ? "light" : "dark")}
              fillColor={card.fillColor}
              disabled={card.disabled}
              onClick={card.onClick}
            />
          </div>
        );
      })}
    </div>
  );
};

ProjectCardGrid.displayName = "ProjectCardGrid";

