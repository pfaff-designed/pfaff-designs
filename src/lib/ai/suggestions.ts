import type { RoutedIntent, PageContext, AISuggestion } from "./queryTypes";
import { getCaseStudyBySlug } from "@/lib/caseStudies/data";

/**
 * Build user-friendly suggestions from routed intent
 */
export function buildSuggestionsFromIntent(
  routedIntent: RoutedIntent,
  pageContext: PageContext
): AISuggestion[] {
  const suggestions: AISuggestion[] = [];

  // Navigation suggestions for projects
  if (
    (routedIntent.navigationRelevance === "optional" || 
     routedIntent.navigationRelevance === "strong") &&
    routedIntent.primaryTopicType === "project" &&
    routedIntent.bestProjectSlug
  ) {
    // Only suggest navigation if we're NOT already on that project's page
    const currentProjectSlug = pageContext.projectSlug || pageContext.pageSlug;
    const isOnTargetPage = 
      pageContext.pageId === "case-study" &&
      currentProjectSlug === routedIntent.bestProjectSlug;

    if (!isOnTargetPage) {
      const caseStudy = getCaseStudyBySlug(routedIntent.bestProjectSlug);
      if (caseStudy) {
        suggestions.push({
          type: "navigate",
          targetPageId: "case-study",
          targetSlug: routedIntent.bestProjectSlug,
          label: `Open the ${caseStudy.client} case study`,
          reason: "This question is about a specific project",
        });
      }
    }
  }

  // Work index navigation
  if (
    (routedIntent.navigationRelevance === "optional" || 
     routedIntent.navigationRelevance === "strong") &&
    routedIntent.bestPageId === "work-index" &&
    pageContext.pageId !== "work-index"
  ) {
    suggestions.push({
      type: "navigate",
      targetPageId: "work-index",
      label: "Go to Work page",
      reason: "This question is about your projects and case studies",
    });
  }

  // About page navigation
  if (
    (routedIntent.navigationRelevance === "optional" || 
     routedIntent.navigationRelevance === "strong") &&
    routedIntent.bestPageId === "about" &&
    pageContext.pageId !== "about"
  ) {
    suggestions.push({
      type: "navigate",
      targetPageId: "about",
      label: "Go to About page",
      reason: "This question is about your background or story",
    });
  }

  // Contact page navigation
  if (
    (routedIntent.navigationRelevance === "optional" || 
     routedIntent.navigationRelevance === "strong") &&
    routedIntent.bestPageId === "contact" &&
    pageContext.pageId !== "contact"
  ) {
    suggestions.push({
      type: "navigate",
      targetPageId: "contact",
      label: "Go to Contact page",
      reason: "This question is about contact or availability",
    });
  }

  // Scroll suggestions (only for case-study pages)
  if (
    pageContext.pageId === "case-study" &&
    (routedIntent.scrollRelevance === "optional" || 
     routedIntent.scrollRelevance === "strong") &&
    routedIntent.bestSectionId
  ) {
    // Verify section exists in pageContext
    const sectionExists = pageContext.sections?.some(
      s => s.id === routedIntent.bestSectionId
    );

    if (sectionExists) {
      const section = pageContext.sections?.find(
        s => s.id === routedIntent.bestSectionId
      );
      
      suggestions.push({
        type: "scroll",
        targetSectionId: routedIntent.bestSectionId,
        label: `Scroll to the ${section?.heading || routedIntent.bestSectionId} section`,
        reason: "This section directly answers your question",
      });
    }
  }

  // Inline answers are generated automatically when there's a current section
  // No need to show a suggestion button - just return navigation/scroll suggestions

  return suggestions;
}

