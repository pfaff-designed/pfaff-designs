"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

export interface SectionInfo {
  sectionId: string;
  sectionTitle?: string;
  route: string;
}

export interface SectionContextValue {
  currentSection: SectionInfo | null;
  registerSection: (sectionId: string, sectionTitle?: string, element?: HTMLElement | null) => void;
  unregisterSection: (sectionId: string) => void;
}

const SectionContext = React.createContext<SectionContextValue | undefined>(
  undefined
);

export function SectionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [currentSection, setCurrentSection] = React.useState<SectionInfo | null>(null);
  const [sections, setSections] = React.useState<
    Map<
      string,
      {
        element: HTMLElement;
        title?: string;
      }
    >
  >(new Map());

  // Register/unregister sections
  const registerSection = React.useCallback(
    (sectionId: string, sectionTitle?: string, element?: HTMLElement | null) => {
      if (!element) {
        // If no element provided, try to find it by ID
        const found = document.getElementById(sectionId);
        if (!found) return;
        element = found;
      }

      setSections((prev) => {
        const next = new Map(prev);
        next.set(sectionId, { element, title: sectionTitle });
        return next;
      });
    },
    []
  );

  const unregisterSection = React.useCallback((sectionId: string) => {
    setSections((prev) => {
      const next = new Map(prev);
      next.delete(sectionId);
      return next;
    });
  }, []);

  // IntersectionObserver to track which section is visible
  React.useEffect(() => {
    if (sections.size === 0) {
      setCurrentSection(null);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // Build a map of section visibility
        const visibilityMap = new Map<string, { ratio: number; title?: string }>();
        
        // Process intersection entries
        for (const entry of entries) {
          // Find which section this element belongs to
          for (const [sectionId, data] of sections.entries()) {
            if (data.element === entry.target) {
              if (entry.isIntersecting) {
                const existing = visibilityMap.get(sectionId);
                if (!existing || entry.intersectionRatio > existing.ratio) {
                  visibilityMap.set(sectionId, {
                    ratio: entry.intersectionRatio,
                    title: data.title,
                  });
                }
              }
            }
          }
        }

        // Find the section with the highest visibility ratio
        let mostVisible: {
          sectionId: string;
          ratio: number;
          title?: string;
        } | null = null;

        for (const [sectionId, info] of visibilityMap.entries()) {
          if (!mostVisible || info.ratio > mostVisible.ratio) {
            mostVisible = {
              sectionId,
              ratio: info.ratio,
              title: info.title,
            };
          }
        }

        // Also check sections that weren't in entries but might be visible
        for (const [sectionId, data] of sections.entries()) {
          if (!visibilityMap.has(sectionId)) {
            const rect = data.element.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const elementTop = rect.top;
            const elementBottom = rect.bottom;

            // Consider section visible if it's in the upper-middle part of viewport
            const isInViewport =
              elementTop < viewportHeight * 0.4 && elementBottom > viewportHeight * 0.1;

            if (isInViewport) {
              // Calculate how much is visible in the "active zone"
              const activeZoneTop = viewportHeight * 0.1;
              const activeZoneBottom = viewportHeight * 0.4;
              const visibleTop = Math.max(activeZoneTop, elementTop);
              const visibleBottom = Math.min(activeZoneBottom, elementBottom);
              const visibleHeight = Math.max(0, visibleBottom - visibleTop);
              const activeZoneHeight = activeZoneBottom - activeZoneTop;
              const ratio = activeZoneHeight > 0 ? visibleHeight / activeZoneHeight : 0;

              if (!mostVisible || ratio > mostVisible.ratio) {
                mostVisible = {
                  sectionId,
                  ratio,
                  title: data.title,
                };
              }
            }
          }
        }

        if (mostVisible && mostVisible.ratio > 0) {
          setCurrentSection({
            sectionId: mostVisible.sectionId,
            sectionTitle: mostVisible.title,
            route: pathname || "/",
          });
        } else {
          // If no section is clearly visible, keep current or set to first section
          setCurrentSection((prev) => prev || (sections.size > 0 ? {
            sectionId: Array.from(sections.keys())[0],
            sectionTitle: Array.from(sections.values())[0].title,
            route: pathname || "/",
          } : null));
        }
      },
      {
        root: null,
        rootMargin: "-10% 0px -60% 0px", // Section is "active" when it's in the upper-middle part of viewport
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      }
    );

    // Observe all registered sections
    for (const [, data] of sections.entries()) {
      observer.observe(data.element);
    }

    return () => {
      observer.disconnect();
    };
  }, [sections, pathname]);

  // Reset current section when route changes
  React.useEffect(() => {
    setCurrentSection(null);
    setSections(new Map());
  }, [pathname]);

  const value = React.useMemo<SectionContextValue>(
    () => ({
      currentSection,
      registerSection,
      unregisterSection,
    }),
    [currentSection, registerSection, unregisterSection]
  );

  return (
    <SectionContext.Provider value={value}>{children}</SectionContext.Provider>
  );
}

export function useSection(): SectionContextValue {
  const context = React.useContext(SectionContext);
  if (context === undefined) {
    throw new Error("useSection must be used within a SectionProvider");
  }
  return context;
}

