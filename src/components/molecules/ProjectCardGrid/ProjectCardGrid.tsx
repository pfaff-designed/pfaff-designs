import * as React from "react";
import { ProjectCard, type ProjectCardProps } from "../ProjectCard";
import { cn } from "@/lib/utils";

export type ProjectCardGridItem = Omit<ProjectCardProps, "className"> & {
  id: string;
};

export interface ProjectCardGridProps {
  cards: [ProjectCardGridItem, ProjectCardGridItem, ProjectCardGridItem];
  className?: string;
}

/**
 * ProjectCardGrid
 * Renders exactly three project cards in a specific layout:
 * - Desktop: 2-column grid
 *   - Card 1 (dark): top-left
 *   - Card 2 (light): top-right
 *   - Card 3 (dark): spans both columns, bottom row
 * - Mobile: stacks vertically
 */
export const ProjectCardGrid: React.FC<ProjectCardGridProps> = ({
  cards,
  className,
}) => {
  const [card1, card2, card3] = cards;

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8",
        className
      )}
    >
      {/* Card 1: Top-left, dark variant */}
      <div className="md:col-span-1">
        <ProjectCard
          key={card1.id}
          projectName={card1.projectName}
          client={card1.client}
          projectType={card1.projectType}
          variant={card1.variant || "dark"}
          fillColor={card1.fillColor}
          disabled={card1.disabled}
          onClick={card1.onClick}
        />
      </div>

      {/* Card 2: Top-right, light variant */}
      <div className="md:col-span-1">
        <ProjectCard
          key={card2.id}
          projectName={card2.projectName}
          client={card2.client}
          projectType={card2.projectType}
          variant={card2.variant || "light"}
          fillColor={card2.fillColor}
          disabled={card2.disabled}
          onClick={card2.onClick}
        />
      </div>

      {/* Card 3: Bottom row, spans both columns, dark variant */}
      <div className="md:col-span-2">
        <ProjectCard
          key={card3.id}
          projectName={card3.projectName}
          client={card3.client}
          projectType={card3.projectType}
          variant={card3.variant || "dark"}
          fillColor={card3.fillColor}
          disabled={card3.disabled}
          onClick={card3.onClick}
        />
      </div>
    </div>
  );
};

ProjectCardGrid.displayName = "ProjectCardGrid";

