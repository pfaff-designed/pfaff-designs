import * as React from "react";

import {
  Button as BaseButton,
  type ButtonProps as BaseButtonProps,
} from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "destructive"
  | "continue"
  | "outline"
  | "icon"
  | "inline";

export interface ButtonProps extends Omit<BaseButtonProps, "variant"> {
  variant?: ButtonVariant;
}

const baseClasses =
  "inline-flex items-center min-w-[5.25rem] justify-center gap-2 rounded-full border border-transparent px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base font-medium leading-5 tracking-tight transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-default)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-default)] disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-4 hover:opacity-80";

const variantClassMap: Record<ButtonVariant, string> = {
  primary:
    "bg-[color:var(--accent-primary)] text-[color:var(--bg-default)] hover:-translate-y-[1px] active:translate-y-0",
  secondary:
    "bg-[color:var(--accent-secondary)] text-[color:var(--text-default)] hover:-translate-y-[1px] active:translate-y-0",
  destructive:
    "bg-[color:var(--state-error)] text-[color:var(--bg-default)] hover:-translate-y-[1px] active:translate-y-0",
  continue:
    "bg-[color:var(--state-success)] text-[color:var(--bg-default)] hover:-translate-y-[1px] active:translate-y-0",
  outline:
    "bg-transparent text-[color:var(--text-default)] border border-[color:var(--text-default)] hover:-translate-y-[1px] active:translate-y-0",
  icon:
    "size-10 gap-0 rounded-full bg-[color:var(--accent-yellow)] p-0 text-[color:var(--text-default)] hover:-translate-y-[1px] active:translate-y-0",
  inline:
    "border-none bg-transparent px-0 py-0 text-[color:var(--accent-primary)] underline-offset-4 hover:underline focus-visible:underline",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <BaseButton
        ref={ref}
        variant="default"
        className={cn(baseClasses, variantClassMap[variant], className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };

