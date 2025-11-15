"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Heading } from "@/components/atoms/Heading";
import { BodyText } from "@/components/atoms/BodyText";
import { Button } from "@/components/atoms/Button";

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterProps {
  email?: string;
  location?: string;
  phone?: string;
  links?: FooterLink[];
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  className?: string;
}

const DEFAULT_LINKS: FooterLink[] = [
  { label: "reachable", href: "#" },
  { label: "m-f / 10-4", href: "#" },
  { label: "github", href: "#" },
  { label: "linkedin", href: "#" },
];

const Footer = React.forwardRef<HTMLElement, FooterProps>(
  (
    {
      email = "charles@pfaff.design",
      location = "RVA based",
      phone = "703-909-5197",
      links = DEFAULT_LINKS,
      ctaLabel = "Say hi!",
      ctaHref = "#",
      onCtaClick,
      className,
    },
    ref
  ) => {
    const handleCtaClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (onCtaClick) {
          e.preventDefault();
          onCtaClick();
        }
      },
      [onCtaClick]
    );

    return (
      <footer
        ref={ref}
        className={cn(
          "w-full bg-[var(--color-dark)] text-[var(--color-light)]",
          "flex flex-col",
          "px-[1.5rem] md:px-[2rem] lg:px-[3rem]",
          "py-[3rem] md:py-[4rem]",
          className
        )}
      >
        <div
          className={cn(
            "w-full max-w-7xl mx-auto",
            "flex flex-col lg:flex-row items-start lg:items-center justify-between",
            "gap-[6.875rem] lg:gap-0"
          )}
        >
          {/* Left Column */}
          <div className="flex flex-col gap-[1.5rem] w-full lg:w-auto items-start lg:items-start">
            {/* Large Email */}
            <div className="flex flex-col justify-end h-[6.875rem]">
              <p
                className={cn(
                  "font-medium text-[2.8125rem] leading-[3.5rem]",
                  "text-[var(--color-light)]",
                  "tracking-[-0.028125rem]"
                )}
              >
                {email}
              </p>
            </div>

            {/* Bottom Row: Location and Availability */}
            <div className="flex items-start justify-between w-full">
              {/* Location */}
              <div className="flex flex-col">
                <BodyText
                  body={location}
                  variant="default"
                  className="text-[var(--color-light)] text-[1rem] leading-[1.25rem] h-[1rem]"
                />
              </div>

              {/* Availability - Stacked */}
              <div className="flex flex-col text-right">
                <BodyText
                  body={links[0]?.label || "reachable"}
                  variant="default"
                  className="text-[var(--color-light)] text-[1rem] leading-[1.25rem] h-[1rem]"
                />
                <BodyText
                  body={links[1]?.label || "m-f / 10-4"}
                  variant="default"
                  className="text-[var(--color-light)] text-[1rem] leading-[1.25rem] h-[1rem]"
                />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-[1.5rem] items-end lg:items-end w-full lg:w-auto">
            {/* Large Phone - Right Aligned */}
            <div className="flex flex-col justify-end h-[6.875rem] w-full lg:w-auto">
              <p
                className={cn(
                  "font-medium text-[2.8125rem] leading-[3.5rem]",
                  "text-[var(--color-light)]",
                  "tracking-[-0.028125rem]",
                  "text-right"
                )}
              >
                {phone}
              </p>
            </div>

            {/* Bottom Row: Social Links and CTA */}
            <div className="flex gap-[1.5rem] items-center">
              {/* Social Links */}
              {links.slice(2).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center justify-center",
                    "h-[2rem] px-[1rem] py-[0.5rem]",
                    "rounded-[0.375rem]",
                    "text-[var(--color-light)] text-[1rem] leading-[1.25rem]",
                    "hover:opacity-80 transition-opacity"
                  )}
                >
                  {link.label}
                </Link>
              ))}

              {/* CTA Button */}
              {onCtaClick ? (
                <Button
                  variant="icon"
                  onClick={handleCtaClick}
                  className="h-[2rem] px-[1rem] py-[0.5rem] rounded-full text-[1rem] leading-[1.25rem]"
                >
                  {ctaLabel}
                </Button>
              ) : (
                <Link href={ctaHref}>
                  <Button
                    variant="icon"
                    className="h-[2rem] px-[1rem] py-[0.5rem] rounded-full text-[1rem] leading-[1.25rem]"
                  >
                    {ctaLabel}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section: Logo */}
        <div
          className={cn(
            "w-full max-w-7xl mx-auto",
            "flex items-center justify-center",
            "pt-[3rem] md:pt-[4rem]"
          )}
        >
            <Image
              src="/pfaff-design-footer.png"
              alt="Pfaff.design"
              width={1726}
              height={293}
              priority
              className="w-full translate-y-[4rem]"
            />
       
        </div>
      </footer>
    );
  }
);

Footer.displayName = "Footer";

export { Footer };

