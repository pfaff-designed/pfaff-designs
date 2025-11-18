"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Composer } from "@/components/molecules/Composer";
import { routeQuestion, type CurrentRoute } from "@/lib/ai/router";

export const GlobalComposer: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const handleSubmit = React.useCallback(
    (question: string) => {
      // Determine current route based on pathname
      let currentRoute: CurrentRoute;

      if (pathname === "/") {
        currentRoute = { kind: "home" };
      } else if (pathname.startsWith("/work/")) {
        const slug = pathname.replace("/work/", "").split("?")[0]; // Remove query params
        currentRoute = { kind: "case_study", slug };
      } else if (pathname === "/about") {
        currentRoute = { kind: "about" };
      } else if (pathname === "/contact") {
        currentRoute = { kind: "contact" };
      } else {
        currentRoute = { kind: "other" };
      }

      const intent = routeQuestion(currentRoute, question);

      // 1) Explicit project routing
      if (intent.type === "go_to_case_study") {
        // If we're already on this case study, treat it like an on-page answer:
        // use replace() to update query without resetting scroll
        if (
          currentRoute.kind === "case_study" &&
          intent.slug === currentRoute.slug
        ) {
          const url = `${pathname}?q=${encodeURIComponent(question)}`;
          router.replace(url, { scroll: false });
        } else {
          router.push(
            `/work/${intent.slug}?q=${encodeURIComponent(question)}`
          );
        }
        return;
      }

      // 2) Answer on the current page
      if (intent.type === "answer_on_page") {
        // From home or other non-case-study pages, treat this as
        // "go to the appropriate case study and answer there".
        if (currentRoute.kind === "home" || currentRoute.kind === "other") {
          router.push(
            `/work/${intent.pageSlug}?q=${encodeURIComponent(
              question
            )}&section=${intent.sectionId ?? ""}`
          );
          return;
        }

        // On a case-study page, stay on the same page and just update the query.
        // Use replace() instead of push() to avoid adding to history stack
        // and prevent scroll reset.
        if (currentRoute.kind === "case_study") {
          const url = `${pathname}?q=${encodeURIComponent(question)}${
            intent.sectionId ? `&section=${intent.sectionId}` : ""
          }`;
          router.replace(url, { scroll: false });
          return;
        }
      }

      // 3) About / Background
      if (intent.type === "go_to_about") {
        router.push(`/about?q=${encodeURIComponent(question)}`);
        return;
      }

      // 4) Contact / Logistics / Fallback
      if (intent.type === "go_to_contact") {
        router.push(
          `/contact?message=${encodeURIComponent(intent.originalQuestion)}`
        );
        return;
      }
    },
    [router, pathname]
  );

  // Determine placeholder based on current route
  const placeholder = React.useMemo(() => {
    if (pathname?.startsWith("/work/")) {
      return "Ask about this project, my role, tools, process, or impact...";
    } else if (pathname === "/about") {
      return "Ask about my background or experience...";
    } else if (pathname === "/contact") {
      return "Ask about availability or rates...";
    }
    return "Ask about a project, my background, or contact me...";
  }, [pathname]);

  return (
    <Composer
      placeholder={placeholder}
      onSubmit={handleSubmit}
    />
  );
};
