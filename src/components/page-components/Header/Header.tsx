"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { NavItem } from "@/components/molecules/NavItem";
import { Button } from "@/components/atoms/Button";

export interface HeaderLink {
  label: string;
  href: string;
  active?: boolean;
}

export interface HeaderProps {
  links?: HeaderLink[];
  contactLabel?: string;
  contactHref?: string;
  onContactClick?: () => void;
  className?: string;
}

const DEFAULT_LINKS: HeaderLink[] = [
  { label: "About", href: "/about" },
  { label: "Work", href: "/work" },
];

const Header = React.forwardRef<HTMLElement, HeaderProps>(
  (
    {
      links = DEFAULT_LINKS,
      contactLabel = "Contact me",
      contactHref = "/contact",
      onContactClick,
      className,
    },
    ref
  ) => {
    const handleLogoClick = React.useCallback(
      (e: React.MouseEvent<HTMLAnchorElement>) => {
        // Reset the experience by navigating to home
        // Using window.location.href for a full page reload to reset all state
        e.preventDefault();
        window.location.href = "/";
      },
      []
    );

    const handleContactClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (onContactClick) {
          e.preventDefault();
          onContactClick();
        }
      },
      [onContactClick]
    );

    return (
      <header
        ref={ref}
        className={cn(
          "relative w-full bg-default",
          "flex items-center justify-between",
          "px-[1.5rem] md:px-[2rem] lg:px-[3rem]",
          "h-[4.5rem] md:h-[5rem]",
          className
        )}
      >
        {/* Left: Navigation Links */}
        <nav
          className="flex items-center gap-[1.5rem] md:gap-[2rem]"
          aria-label="Main navigation"
        >
          {links.map((link) => (
            <NavItem
              key={link.href}
              href={link.href}
              active={link.active}
              className="text-[0.875rem] md:text-[1rem]"
            >
              {link.label}
            </NavItem>
          ))}
        </nav>

        {/* Center: Logo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link
            href="/"
            onClick={handleLogoClick}
            className="flex items-center justify-center"
            aria-label="Home - pfaff.design"
          >
            <Image
              src="/pfaff-design-logo.svg"
              alt="pfaff.design"
              width={120}
              height={26}
              priority
              className="h-[1.625rem] md:h-[1.75rem] w-auto"
            />
          </Link>
        </div>

        {/* Right: Contact CTA */}
        <div className="flex items-center">
          {onContactClick ? (
            <Button
              variant="primary"
              onClick={handleContactClick}
              className="text-[0.875rem] md:text-[1rem] px-[1.5rem] py-[0.75rem]"
            >
              {contactLabel}
            </Button>
          ) : (
            <Link href={contactHref}>
              <Button
                variant="primary"
                className="text-[0.875rem] md:text-[1rem] px-[1.5rem] py-[0.75rem]"
              >
                {contactLabel}
              </Button>
            </Link>
          )}
        </div>
      </header>
    );
  }
);

Header.displayName = "Header";

export { Header };

