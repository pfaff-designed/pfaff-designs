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
 * - Desktop: 12-column grid
 * - Mobile: stacks vertically
 * - Card 1: 7 columns (left-aligned)
 * - Card 2: 5 columns (right-aligned, same row as Card 1)
 * - Card 3: 4 columns
 * - Card 4: 8 columns
 * - Pattern repeats for additional cards
 */
export const ProjectCardGrid: React.FC<ProjectCardGridProps> = ({
  cards,
  className,
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-3 w-full",
        className
      )}
    >
      {cards.map((card, index) => {
        // Pattern repeats every 4 cards
        const patternIndex = index % 4;
        
        let spanClass: string;
        let startClass: string = "";
        
        if (patternIndex === 0) {
          // Card 1: 7 columns, left-aligned
          spanClass = "md:col-span-7";
        } else if (patternIndex === 1) {
          // Card 2: 5 columns, right-aligned (starts at column 8)
          spanClass = "md:col-span-5";
          startClass = "md:col-start-8";
        } else if (patternIndex === 2) {
          // Card 3: 4 columns
          spanClass = "md:col-span-4";
        } else {
          // Card 4: 8 columns
          spanClass = "md:col-span-8";
        }
        
        return (
          <div 
            key={card.id} 
            className={cn(spanClass, startClass)}
          >
            <ProjectCard
              projectName={card.projectName}
              client={card.client}
              role={card.role}
              projectType={card.projectType}
              oneLiner={card.oneLiner}
              variant={card.variant || (index === 1 ? "light" : "dark")}
              fillColor={card.fillColor}
              backgroundImage={card.backgroundImage}
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

