import * as React from "react";
import { Badge as BaseBadge, type BadgeProps as BaseBadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TagVariant = "primary" | "secondary" | "success" | "error";

export interface TagProps extends Omit<BaseBadgeProps, "variant"> {
  variant?: TagVariant;
}

const variantClassMap: Record<TagVariant, string> = {
  primary: "bg-[#fff8a7] text-[#26291d]",
  secondary: "bg-[#9ec8d2] text-[#26291d]",
  success: "bg-[#6d7f5c] text-[#fdf9f4]",
  error: "bg-[#e75151] text-[#fdf9f4]",
};

const Tag = React.forwardRef<HTMLDivElement, TagProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <BaseBadge
        ref={ref}
        variant="default"
        className={cn(
          "inline-flex h-[22px] items-center justify-center gap-1 rounded-full border-0 px-[9px] py-[3px] font-mono text-xs italic leading-[18px]",
          variantClassMap[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Tag.displayName = "Tag";

export { Tag };

