import * as React from "react";
import { Heading } from "@/components/atoms/Heading";
import { BodyText } from "@/components/atoms/BodyText";

export interface TimelineProps {
  timelineItems?: Array<{
    year?: string;
    title: string;
    description: string;
  }>;
}

export const Timeline: React.FC<TimelineProps> = ({ timelineItems }) => {
  return (
    <div className="relative flex flex-col gap-8">
      {timelineItems?.map((item, index) => (
        <div key={index} className="flex gap-6">
          <div className="flex shrink-0 flex-col items-center">
            {index > 0 && <div className="h-4 w-0.5 bg-[var(--border-subtle)]" />}
            <div className="relative h-3 w-3 rounded-full border-2 border-[var(--text-default)] bg-[var(--bg-default)]" />
            {index < (timelineItems?.length || 0) - 1 && (
              <div className="h-full w-0.5 bg-[var(--border-subtle)]" />
            )}
          </div>
          <div className="flex-1 pb-8">
            {item.year && (
              <div className="mb-2 font-mono text-sm font-medium text-[var(--text-muted)]">
                {item.year}
              </div>
            )}
            <Heading text={item.title} variant="headline" className="mb-2" />
            <BodyText body={item.description} />
          </div>
        </div>
      ))}
    </div>
  );
};

