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
  isActive?: boolean;
}

const baseClasses =
  "inline-flex items-center min-w-[5.25rem] justify-center gap-2 rounded-full px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base font-medium leading-5 tracking-tight transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-default)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-default)] disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-4";

const variantClassMap: Record<ButtonVariant, string> = {
  primary:
    "border border-transparent bg-[color:var(--accent-primary)] text-[color:var(--bg-default)] hover:opacity-80 hover:-translate-y-[1px] active:translate-y-0",
  secondary:
    "border border-transparent bg-[color:var(--accent-secondary)] text-[color:var(--text-default)] hover:opacity-80 hover:-translate-y-[1px] active:translate-y-0",
  destructive:
    "border border-transparent bg-[color:var(--state-error)] text-[color:var(--bg-default)] hover:opacity-80 hover:-translate-y-[1px] active:translate-y-0",
  continue:
    "border border-transparent bg-[color:var(--state-success)] text-[color:var(--bg-default)] hover:opacity-80 hover:-translate-y-[1px] active:translate-y-0",
  outline:
    "border border-[color:var(--text-default)] bg-background/40 backdrop-blur-md text-[color:var(--text-default)] hover:border-[color:var(--accent-primary)] hover:text-[color:var(--accent-primary)] hover:bg-background/80 hover:backdrop-blur-md hover:-translate-y-[1px] hover:focus-visible:ring-2 hover:focus-visible:ring-[var(--text-default)] hover:focus-visible:ring-offset-2 hover:focus-visible:ring-offset-[var(--bg-default)] active:border-[color:var(--accent-primary)] active:translate-y-0 focus-visible:border-[color:var(--accent-primary)] focus-visible:text-[color:var(--accent-primary)] focus-visible:outline-none data-[active=true]:border-[color:var(--accent-primary)] data-[active=true]:text-[color:var(--accent-primary)] hover:ring-2 hover:ring-primary",
  icon:
    "border border-transparent size-10 gap-0 rounded-full bg-[color:var(--accent-yellow)] p-0 text-[color:var(--text-default)] hover:opacity-80 hover:-translate-y-[1px] active:translate-y-0",
  inline:
    "border-none bg-transparent px-0 py-0 text-[color:var(--accent-primary)] underline-offset-4 hover:underline focus-visible:underline",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", isActive, ...props }, ref) => {
    return (
      <BaseButton
        ref={ref}
        variant="default"
        data-active={isActive}
        className={cn(
          baseClasses,
          variantClassMap[variant],
          isActive && variant === "outline" && "ring-2 ring-primary",
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };

