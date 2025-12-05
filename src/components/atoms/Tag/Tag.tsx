import * as React from "react";
import { Badge as BaseBadge, type BadgeProps as BaseBadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TagVariant = "primary" | "secondary" | "success" | "error";

export interface TagProps extends Omit<BaseBadgeProps, "variant"> {
  variant?: TagVariant;
}

const variantClassMap: Record<TagVariant, string> = {
  primary: "bg-[color:var(--accent-yellow)] text-[color:var(--text-default)]",
  secondary: "bg-[color:var(--accent-secondary)] text-[color:var(--text-default)]",
  success: "bg-[color:var(--state-success)] text-[color:var(--bg-default)]",
  error: "bg-[color:var(--state-error)] text-[color:var(--bg-default)]",
};

const Tag = React.forwardRef<HTMLDivElement, TagProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <div ref={ref}>
        <BaseBadge
          variant="default"
          className={cn(
            "inline-flex h-[22px] items-center justify-center gap-1 rounded-full border-0 px-[9px] py-[3px] font-mono text-xs italic leading-[18px]",
            variantClassMap[variant],
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Tag.displayName = "Tag";

export { Tag };

