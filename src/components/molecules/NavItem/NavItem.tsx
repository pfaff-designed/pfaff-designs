import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export interface NavItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}

const NavItem = React.forwardRef<HTMLAnchorElement, NavItemProps>(
  ({ href, active = false, className, children, ...props }, ref) => {
    const isActive = active;

    return (
      <Link
        href={href}
        ref={ref}
        className={cn(
          "text-sm font-medium text-text-default transition-colors pb-1 border-b-2 border-transparent",
          "hover:border-text-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-default focus-visible:ring-offset-2",
          isActive && "border-text-default font-semibold",
          className
        )}
        aria-current={isActive ? "page" : undefined}
        {...props}
      >
        {children}
      </Link>
    );
  }
);

NavItem.displayName = "NavItem";

export { NavItem };

