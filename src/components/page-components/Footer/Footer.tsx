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
          "w-full bg-[var(--neutral-900)] text-[var(--neutral-50)]",
          "flex flex-col min-h-[40vh]",
          "px-4 md:px-[1.5rem] lg:px-[3rem]",
          "pt-8 md:pt-[3rem] lg:pt-[4rem]",
          "pb-40 md:pb-48 lg:pb-56",
          "overflow-hidden",
          className
        )}
      >
        <div
          className={cn(
            "w-full max-w-7xl mx-auto flex-1",
            "flex flex-col lg:flex-row items-start lg:items-center justify-between",
            "gap-12 md:gap-[6.875rem] lg:gap-0"
          )}
        >
          {/* Left Column */}
          <div className="flex flex-col gap-4 md:gap-[1.5rem] w-full lg:w-auto items-start">
            {/* Large Email */}
            <div className="flex flex-col justify-end min-h-[4rem] md:min-h-[6.875rem]">
              <p
                className={cn(
                  "font-medium text-xl md:text-[2.8125rem] leading-7 md:leading-[3.5rem]",
                  "text-[var(--neutral-50)]",
                  "tracking-[-0.028125rem]",
                  "break-words max-w-full"
                )}
              >
                {email}
              </p>
            </div>

            {/* Bottom Row: Location and Availability */}
            <div className="flex flex-col lg:flex-row items-start lg:justify-between w-full gap-2 lg:gap-0">
              {/* Location */}
              <div className="flex flex-col">
                <BodyText
                  body={location}
                  variant="default"
                  className="text-[var(--neutral-50)] text-sm md:text-base leading-5 md:leading-[1.25rem]"
                />
              </div>

              {/* Availability - Stacked beneath location on mobile/tablet, right-aligned on desktop */}
              <div className="flex flex-col text-left lg:text-right">
                <BodyText
                  body={links[0]?.label || "reachable"}
                  variant="default"
                  className="text-[var(--neutral-50)] text-sm md:text-base leading-5 md:leading-[1.25rem]"
                />
                <BodyText
                  body={links[1]?.label || "m-f / 10-4"}
                  variant="default"
                  className="text-[var(--neutral-50)] text-sm md:text-base leading-5 md:leading-[1.25rem]"
                />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-4 md:gap-[1.5rem] items-start lg:items-end w-full lg:w-auto">
            {/* Large Phone - Left on mobile/tablet, right on desktop */}
            <div className="flex flex-col justify-end min-h-[4rem] md:min-h-[6.875rem] w-full lg:w-auto">
              <p
                className={cn(
                  "font-medium text-xl md:text-[2.8125rem] leading-7 md:leading-[3.5rem]",
                  "text-[var(--neutral-50)]",
                  "tracking-[-0.028125rem]",
                  "text-left lg:text-right",
                  "break-words max-w-full"
                )}
              >
                {phone}
              </p>
            </div>

            {/* Bottom Row: Social Links and CTA - Aligned to match phone number on all breakpoints */}
            <div className="flex flex-wrap gap-3 md:gap-[1.5rem] items-center justify-start lg:justify-end">
              {/* Social Links */}
              {links.slice(2).map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={cn(
                    "flex items-center justify-center",
                    "h-8 md:h-[2rem] pr-3 md:pr-[1rem] py-2 md:py-[0.5rem]",
                    "rounded-[0.375rem]",
                    "text-[var(--neutral-50)] text-sm md:text-base leading-5 md:leading-[1.25rem]",
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
                  className="h-8 md:h-[2rem] px-3 md:px-[1rem] py-2 md:py-[0.5rem] rounded-full text-sm md:text-base leading-5 md:leading-[1.25rem] bg-[color:var(--accent-tertiary)] text-[color:var(--text-default)] hover:opacity-90"
                >
                  {ctaLabel}
                </Button>
              ) : (
                <Link href={ctaHref}>
                  <Button
                    variant="icon"
                    className="h-8 md:h-[2rem] px-3 md:px-[1rem] py-2 md:py-[0.5rem] rounded-full text-sm md:text-base leading-5 md:leading-[1.25rem] bg-[color:var(--accent-tertiary)] text-[color:var(--text-default)] hover:opacity-90"
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
            "flex items-end justify-center",
            "pt-8 md:pt-[3rem] lg:pt-[4rem] mt-auto"
          )}
        >
            <Image
              src="/pfaff-footer-accent.svg"
              alt="Pfaff.design"
              width={1421}
              height={345}
              priority
              className="w-full translate-y-32 md:translate-y-48"
            />
       
        </div>
      </footer>
    );
  }
);

Footer.displayName = "Footer";

export { Footer };

