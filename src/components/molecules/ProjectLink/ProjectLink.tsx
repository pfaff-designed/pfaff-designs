"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ProjectLinkProps {
  slug: string;
  label: string;
  path: string;
  reason?: string;
  className?: string;
  onClick?: () => void;
}

/**
 * ProjectLink
 * 
 * A pill/button-style link to a project case study page.
 * Used in AI answers to provide quick navigation to related projects.
 */
export const ProjectLink = React.forwardRef<HTMLAnchorElement, ProjectLinkProps>(
  ({ slug, label, path, reason, className, onClick }, ref) => {
    const handleClick = React.useCallback(() => {
      if (onClick) {
        onClick();
      }
    }, [onClick]);

    return (
      <Link
        ref={ref}
        href={path}
        onClick={handleClick}
        className={cn(
          "inline-flex items-center gap-2",
          "px-4 py-2",
          "rounded-full",
          "border border-[color:var(--accent-primary)]",
          "bg-transparent",
          "text-sm font-medium",
          "text-[color:var(--accent-primary)]",
          "hover:bg-[color:var(--accent-primary)] hover:text-[color:var(--bg-default)]",
          "transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2",
          className
        )}
        aria-label={reason ? `View ${label} case study: ${reason}` : `View ${label} case study`}
      >
        <span>View {label}</span>
        {reason && (
          <span className="text-xs opacity-75">
            {reason}
          </span>
        )}
      </Link>
    );
  }
);

ProjectLink.displayName = "ProjectLink";

