"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
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
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [isDrawerMounted, setIsDrawerMounted] = React.useState(false);
    const [isDrawerVisible, setIsDrawerVisible] = React.useState(false);

    // Swipe gesture state
    const [swipeStartX, setSwipeStartX] = React.useState<number | null>(null);
    const [swipeCurrentX, setSwipeCurrentX] = React.useState<number | null>(null);
    const [isSwipingRight, setIsSwipingRight] = React.useState(false);

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

    const openMobileMenu = React.useCallback(() => {
      setIsMobileMenuOpen(true);
      setIsDrawerMounted(true);
      // Trigger slide-in animation after mount
      requestAnimationFrame(() => {
        setIsDrawerVisible(true);
      });
    }, []);

    const closeMobileMenu = React.useCallback(() => {
      setIsMobileMenuOpen(false);
      setIsDrawerVisible(false);
      // Reset swipe state
      setSwipeStartX(null);
      setSwipeCurrentX(null);
      setIsSwipingRight(false);
      // Unmount after animation completes (300ms)
      setTimeout(() => {
        setIsDrawerMounted(false);
      }, 300);
    }, []);

    // Swipe-right-to-close gesture handlers
    const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
      setSwipeStartX(e.touches[0].clientX);
      setIsSwipingRight(true);
    }, []);

    const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
      if (!isSwipingRight || swipeStartX === null) return;

      const currentX = e.touches[0].clientX;
      const deltaX = currentX - swipeStartX;

      // Only track rightward swipes
      if (deltaX > 0) {
        setSwipeCurrentX(currentX);
      }
    }, [isSwipingRight, swipeStartX]);

    const handleTouchEnd = React.useCallback(() => {
      if (!isSwipingRight || swipeStartX === null) {
        setIsSwipingRight(false);
        setSwipeStartX(null);
        setSwipeCurrentX(null);
        return;
      }

      const swipeDistance = swipeCurrentX !== null ? swipeCurrentX - swipeStartX : 0;

      // 100px threshold to trigger close
      if (swipeDistance > 100) {
        closeMobileMenu();
      }

      // Reset swipe state
      setIsSwipingRight(false);
      setSwipeStartX(null);
      setSwipeCurrentX(null);
    }, [isSwipingRight, swipeStartX, swipeCurrentX, closeMobileMenu]);

    // Calculate swipe transform for visual feedback
    const swipeTransform = React.useMemo(() => {
      if (!isSwipingRight || swipeStartX === null || swipeCurrentX === null) {
        return 0;
      }
      const delta = swipeCurrentX - swipeStartX;
      return Math.max(0, delta); // Only allow rightward movement
    }, [isSwipingRight, swipeStartX, swipeCurrentX]);

    return (
      <>
        <header
          ref={ref}
          className={cn(
            "sticky top-0 z-50 w-full bg-[var(--bg-default)]",
            "flex items-center justify-between",
            "px-[1.5rem] md:px-[2rem] lg:px-[3rem]",
            "h-[4.5rem] md:h-[5rem]",
            className
          )}
        >
          {/* Desktop: Navigation Links (hidden on mobile) */}
          <nav
            className="hidden md:flex items-center gap-[1.5rem] md:gap-[2rem]"
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

          {/* Mobile: Left side (logo only, not centered) */}
          <div className="md:hidden flex items-center">
            <Link
              href="/"
              onClick={handleLogoClick}
              className="flex items-center justify-center"
              aria-label="Home - pfaff.design"
            >
              <Image
                src="/pfaff-design-logo.svg"
                alt="pfaff.design"
                width={90}
                height={20}
                priority
                className="h-[1.25rem] w-auto"
              />
            </Link>
          </div>

          {/* Desktop: Center Logo (hidden on mobile) */}
          <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
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

          {/* Desktop: Contact CTA (hidden on mobile) */}
          <div className="hidden md:flex items-center">
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

          {/* Mobile: Hamburger/Close Menu Button */}
          <button
            onClick={isMobileMenuOpen ? closeMobileMenu : openMobileMenu}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            className="md:hidden flex items-center justify-center w-10 h-10 text-[color:var(--text-default)] hover:opacity-80 transition-opacity"
          >
            <div className="relative w-6 h-6">
              {/* Hamburger Icon */}
              <Menu 
                className={cn(
                  "absolute inset-0 h-6 w-6 transition-all duration-300 ease-in-out",
                  isMobileMenuOpen ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"
                )}
                strokeWidth={1.5}
              />
              {/* X Icon */}
              <X 
                className={cn(
                  "absolute inset-0 h-6 w-6 transition-all duration-300 ease-in-out",
                  isMobileMenuOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-75"
                )}
                strokeWidth={1.5}
              />
            </div>
          </button>
        </header>

        {/* Mobile Drawer */}
        {isDrawerMounted && (
          <div
            className="fixed inset-0 z-45 md:hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Drawer Panel */}
            <div
              className={cn(
                "fixed top-0 right-0 h-full w-full",
                "bg-[color:var(--bg-default)]",
                "shadow-[-4px_0_24px_rgba(0,0,0,0.1)]",
                "transition-transform duration-300 ease-out",
                "flex flex-col"
              )}
              style={{
                transform: isSwipingRight 
                  ? `translateX(${swipeTransform}px)`
                  : isDrawerVisible 
                    ? 'translateX(0)' 
                    : 'translateX(100%)',
                paddingTop: 'max(3rem, env(safe-area-inset-top))',
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
              }}
            >
              {/* Navigation Items */}
              <nav className="flex flex-col flex-1 pt-12">
                {/* About & Work Links */}
                {links.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMobileMenu}
                      className={cn(
                        "flex items-center w-full px-6 py-6",
                        "text-2xl font-medium leading-8",
                        "transition-colors duration-200",
                        "hover:opacity-80",
                        isActive
                          ? "text-[color:var(--accent-primary)]"
                          : "text-[color:var(--text-default)]"
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}

                {/* Contact Me Link */}
                <Link
                  href={contactHref}
                  onClick={closeMobileMenu}
                  className={cn(
                    "flex items-center w-full px-6 py-6",
                    "text-2xl font-medium leading-8",
                    "transition-colors duration-200",
                    "hover:opacity-80",
                    pathname === contactHref
                      ? "text-[color:var(--accent-primary)]"
                      : "text-[color:var(--text-default)]"
                  )}
                >
                  {contactLabel}
                </Link>
              </nav>
            </div>
          </div>
        )}
      </>
    );
  }
);

Header.displayName = "Header";

export { Header };

