"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Composer } from "@/components/molecules/Composer";
import type { QueryResponse, AISuggestion, PageContext } from "@/lib/ai/queryTypes";
import { getCaseStudyBySlug } from "@/lib/caseStudies/data";
import { useAIAnswer } from "@/components/organisms/ai/AIAnswerContext";
import { useSection } from "@/components/organisms/ai/SectionContext";

export const GlobalComposer: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [suggestions, setSuggestions] = React.useState<AISuggestion[]>([]);
  const { state, setAnswerLayout, setStatus, setLastPrompt, setError, setSectionAnswer } = useAIAnswer();
  const { currentSection } = useSection();

  // Build page context from current route
  const buildPageContext = React.useCallback((): PageContext => {
    const pageId = 
      pathname === "/" ? "home" :
      pathname === "/work" ? "work-index" :
      pathname.startsWith("/work/") ? "case-study" :
      pathname === "/about" ? "about" :
      pathname === "/contact" ? "contact" :
      "home";

    let projectSlug: string | undefined;
    let pageSlug: string | undefined;
    const sections: PageContext["sections"] = [];

    if (pageId === "case-study") {
      const slug = pathname.replace("/work/", "").split("?")[0];
      projectSlug = slug;
      pageSlug = slug;
      
      // Load sections from case study data
      const caseStudy = getCaseStudyBySlug(slug);
      if (caseStudy?.sections) {
        sections.push(
          ...caseStudy.sections.map((s) => ({
            id: s.id,
            eyebrow: s.eyebrow,
            heading: s.heading,
            label: s.heading,
          }))
        );
      }
    }

    const pageContextResult: PageContext = {
      pageId,
      route: pathname || "/",
      projectSlug,
      pageSlug,
      sections: sections.length > 0 ? sections : undefined,
    };

    console.log("[GlobalComposer] Built pageContext", pageContextResult);
    
    return pageContextResult;
  }, [pathname]);

  const handleSubmit = React.useCallback(
    async (question: string, forceGenerate: boolean = false, targetSectionId?: string | null) => {
      setStatus("loading");
      setLastPrompt(question);
      setSuggestions([]);
      setError(null);

      // If there's a current section, ALWAYS generate inline answer (default behavior)
      // On case-study pages, always generate inline even if no section is detected yet
      // Use the first section as fallback if on case-study page
      const pageContext = buildPageContext();
      const sectionIdForAnswer = targetSectionId || 
                                  currentSection?.sectionId || 
                                  (pageContext.pageId === "case-study" && pageContext.sections?.[0]?.id) || 
                                  null;
      const isInlineAnswer = sectionIdForAnswer !== null;

        console.log("[GlobalComposer handleSubmit]", {
          question,
          currentSection: currentSection?.sectionId,
          targetSectionId,
          sectionIdForAnswer,
          isInlineAnswer,
          forceGenerate,
          pageId: pageContext.pageId,
          availableSections: pageContext.sections?.map(s => s.id),
        });

      // If inline answer, set section answer loading state
      if (isInlineAnswer && sectionIdForAnswer) {
        setSectionAnswer(sectionIdForAnswer, {
          status: "loading",
          prompt: question,
          answerId: `${sectionIdForAnswer}-${Date.now()}`,
        });
      }

      try {
        // pageContext already built above
        // Add current section ID to page context for inline answers
        const enhancedPageContext: PageContext = {
          ...pageContext,
          currentSectionId: sectionIdForAnswer || undefined,
        };

        const requestBody = {
          message: question,
          pageContext: enhancedPageContext,
          history: [], // TODO: Add chat history if needed
          forceGenerate: isInlineAnswer || forceGenerate, // Always generate for inline answers (when section exists)
        };

        console.log("[GlobalComposer] Sending request", {
          message: question,
          pageContext: enhancedPageContext,
          forceGenerate: isInlineAnswer || forceGenerate,
        });

        const response = await fetch("/api/ai/query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("[GlobalComposer] API error response:", {
            status: response.status,
            statusText: response.statusText,
            errorData,
            details: errorData.details,
          });
          const errorMessage = errorData.error?.message || errorData.error || response.statusText || "Failed to process query";
          const errorDetails = errorData.details ? `Details: ${JSON.stringify(errorData.details)}` : "";
          setError(`${errorMessage} ${errorDetails}`);
          setStatus("error");
          
          if (isInlineAnswer && sectionIdForAnswer) {
            setSectionAnswer(sectionIdForAnswer, {
              status: "error",
              error: errorMessage,
            });
          }
          throw new Error(`API error: ${response.status} ${errorMessage}`);
        }

        const data: QueryResponse = await response.json();

        console.log("[GlobalComposer API Response]", {
          isInlineAnswer,
          sectionIdForAnswer,
          hasAnswerLayout: !!data.answerLayout,
          suggestions: data.suggestions,
          suggestionsCount: data.suggestions?.length || 0,
        });

        // Store answer based on whether it's inline or global
        if (isInlineAnswer && sectionIdForAnswer && data.answerLayout) {
          // Store as section-specific answer (default behavior when section exists)
          console.log("[GlobalComposer] Storing inline answer for section:", sectionIdForAnswer, {
            sectionId: sectionIdForAnswer,
            hasAnswerLayout: !!data.answerLayout,
            answerLayoutPreview: JSON.stringify(data.answerLayout).substring(0, 200),
          });
          setSectionAnswer(sectionIdForAnswer, {
            answerLayout: data.answerLayout,
            status: "success",
            prompt: question,
            answerId: `${sectionIdForAnswer}-${Date.now()}`,
            updatedAt: new Date().toISOString(),
          });
          setStatus("idle");
        } else if (!isInlineAnswer && data.answerLayout) {
          // Store as global answer (full-page rendering - only when no section)
          console.log("[GlobalComposer] Setting global answerLayout in context");
          setAnswerLayout(data.answerLayout);
        } else {
          // No answer to store
          console.warn("[GlobalComposer] No answer to store", {
            isInlineAnswer,
            sectionIdForAnswer,
            hasAnswerLayout: !!data.answerLayout,
          });
          if (!isInlineAnswer) {
            setAnswerLayout(null);
            setStatus("idle");
          }
        }

        // Store suggestions - these are displayed as buttons (scroll/navigate options)
        setSuggestions(data.suggestions || []);
      } catch (error) {
        console.error("Error handling query:", error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
        setError(errorMessage);
        setStatus("error");
        
        if (isInlineAnswer && sectionIdForAnswer) {
          setSectionAnswer(sectionIdForAnswer, {
            status: "error",
            error: errorMessage,
          });
        }
      }
    },
    [buildPageContext, setAnswerLayout, setStatus, setLastPrompt, setError, setSectionAnswer, currentSection]
  );


  const handleSuggestionClick = React.useCallback((suggestion: AISuggestion) => {
    if (suggestion.type === "navigate") {
      if (!suggestion.targetPageId) return;

      const path =
        suggestion.targetPageId === "work-index" ? "/work" :
        suggestion.targetPageId === "home" ? "/" :
        suggestion.targetPageId === "about" ? "/about" :
        suggestion.targetPageId === "contact" ? "/contact" :
        suggestion.targetPageId === "case-study" && suggestion.targetSlug 
          ? `/work/${suggestion.targetSlug}` :
        null;

      if (path) {
        router.push(path);
      }
    } else if (suggestion.type === "scroll" && suggestion.targetSectionId) {
      const element = document.getElementById(suggestion.targetSectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    // Note: Inline answers are generated automatically when there's a current section
    // No need for a separate "inline" suggestion handler
  }, [router]);

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
    <div className="fixed left-1/2 -translate-x-1/2 z-50 bottom-6">
      <div className="flex flex-col gap-[1rem] w-[24.875rem]">
        {/* Suggestion Buttons */}
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-xs leading-5 text-[var(--text-default)] border border-[rgba(38,41,29,0.2)] rounded-full px-3 py-1.5 bg-[#FDF9F4] hover:border-[rgba(38,41,29,0.4)] hover:bg-[#F5EDE0] transition-colors"
                type="button"
              >
                {suggestion.label}
              </button>
            ))}
          </div>
        )}

        {/* Composer Input */}
        <Composer
          placeholder={placeholder}
          onSubmit={handleSubmit}
          status={state.status === "loading" ? "loading" : "idle"}
          lastPrompt={state.lastPrompt}
          lastUpdatedAt={state.lastUpdatedAt}
        />
      </div>
    </div>
  );
};
