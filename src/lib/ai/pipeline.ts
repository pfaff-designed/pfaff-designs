import type { PageJSON } from "@/components/utility/Renderer";
import { retrieveProjectChunks, buildContextFromChunks } from "@/lib/rag/retrieveProjectChunks";
import { runCopywriter } from "./copywriter";
import type { CopywriterInput } from "./copywriterSchemas";
import { generateOrchestratorJSON } from "./orchestrator";
import type { IntentResult } from "./intentResolver";
import { resolveIntent } from "./intentResolver";
import { componentRegistry } from "@/lib/registry/componentRegistry";
import type { RoutedIntent, PageContext } from "./queryTypes";
import { getHeroFacts } from "@/lib/kb/CaseStudyHeroFacts";
import { getCaseStudyBySlug } from "@/lib/caseStudies/data";
import type { CaseStudyPage } from "@/lib/caseStudies/types";
import type { IntentProfile } from "./intents";
import type { ContentStrategy } from "./contentStrategies";
import type { LayoutStrategy } from "./layoutStrategies";

/**
 * Get case study data by project slug
 */
async function getCaseStudyData(projectSlug: string): Promise<CaseStudyPage | null> {
  return getCaseStudyBySlug(projectSlug) || null;
}

/**
 * Build comprehensive project context from case study data
 * This includes ALL sections, summaries, and metadata for broader question answering
 */
function buildComprehensiveProjectContext(caseStudy: CaseStudyPage): string {
  const parts: string[] = [];
  
  // Project overview
  parts.push(`PROJECT: ${caseStudy.projectName}`);
  if (caseStudy.client) parts.push(`CLIENT: ${caseStudy.client}`);
  if (caseStudy.timeframe) parts.push(`TIMEFRAME: ${caseStudy.timeframe}`);
  if (caseStudy.url) parts.push(`URL: ${caseStudy.url}`);
  
  parts.push("\n---\n");
  
  // Hero summary (high-level overview)
  if (caseStudy.heroSummary) {
    parts.push(`PROJECT SUMMARY:\n${caseStudy.heroSummary}`);
  }
  
  // Role summary (what I did)
  if (caseStudy.roleSummary) {
    parts.push(`\nMY ROLE:\n${caseStudy.roleSummary}`);
  }
  
  // All sections (complete project information)
  if (caseStudy.sections && caseStudy.sections.length > 0) {
    parts.push("\n---\nPROJECT SECTIONS:\n");
    caseStudy.sections.forEach((section: { eyebrow: string; heading: string; body: string }) => {
      parts.push(`\n[${section.eyebrow}] ${section.heading}\n${section.body}`);
    });
  }
  
  return parts.join("\n");
}

/**
 * Run the full RAG → Copywriter → Orchestrator pipeline
 * Optionally accepts intent profile and strategies for intent-driven rendering
 */
export async function runCopywriterPipeline(
  message: string,
  routedIntent: RoutedIntent,
  pageContext: PageContext,
  intentProfile?: IntentProfile,
  contentStrategy?: ContentStrategy,
  layoutStrategy?: LayoutStrategy
): Promise<PageJSON | null> {
  try {
    // If we explicitly don't want copy, bail out early.
    if (routedIntent.answerMode === "none") {
      return null;
    }

    // 1. Determine retrieval scope based on routedIntent
    let projectId: string | undefined;
    
    if (routedIntent.primaryProjectSlug) {
      projectId = routedIntent.primaryProjectSlug;
    } else if (routedIntent.bestProjectSlug) {
      projectId = routedIntent.bestProjectSlug;
    } else if (
      routedIntent.primaryTopicType === "project" &&
      pageContext.pageId === "case-study" &&
      (pageContext.projectSlug || pageContext.pageSlug)
    ) {
      // On a case-study page asking about that project
      projectId = pageContext.projectSlug || pageContext.pageSlug;
    }
    // If general question or skills/background, leave projectId undefined for global retrieval

    // 2. Retrieve relevant chunks using RAG - increase matchCount for broader context
    const retrievedChunks = await retrieveProjectChunks(message, {
      projectId,
      matchCount: 15, // Increased from 8 to get broader context covering outcomes, team, challenges, etc.
    });
    let context = buildContextFromChunks(retrievedChunks);

    // 3. Add comprehensive project context when on a case-study page
    // This ensures the AI has access to ALL project information, not just semantic chunks
    if (projectId && pageContext.pageId === "case-study") {
      const caseStudyData = await getCaseStudyData(projectId);
      if (caseStudyData) {
        const projectContext = buildComprehensiveProjectContext(caseStudyData);
        context = context 
          ? `${context}\n\n---\n\n## FULL PROJECT CONTEXT\n\n${projectContext}`
          : projectContext;
      }
    }

    // If no context retrieved, use a minimal fallback context instead of returning null
    // User asked a question - we should ALWAYS try to generate an answer
    if (!context || context.trim().length === 0) {
      context = `User question: ${message}\n\nContext: No specific project context found. Please provide a helpful answer based on general knowledge about portfolio work.`;
    }

    // 3. Resolve full intent (for copywriter compatibility)
    const fullIntent = await resolveIntent(message);

    // 4. Build copywriter input
    let projectShortFacts: CopywriterInput["projectShortFacts"] | undefined;
    
    if (projectId) {
      const heroFacts = await getHeroFacts(projectId);
      if (heroFacts) {
        projectShortFacts = {
          client: heroFacts.client,
          projectNameOrUrl: heroFacts.projectNameOrUrl,
          role: heroFacts.role,
          description: heroFacts.description,
          yearOrTimeline: heroFacts.yearOrTimeline,
          team: heroFacts.team,
        };
      }
    }

    // Determine section info for copywriter
    const targetSection = routedIntent.bestSectionId
      ? pageContext.sections?.find(s => s.id === routedIntent.bestSectionId)
      : pageContext.sections?.[0];

    const copywriterInput: CopywriterInput = {
      question: message,
      context,
      projectId: projectId || null,
      sectionTitle: targetSection?.heading || "General",
      sectionBody: "", // Empty for general queries, copywriter will use context instead
      projectShortFacts,
      // Intent-driven content strategy
      intent: intentProfile?.intent,
      contentGoals: contentStrategy?.goals,
      requiredSections: contentStrategy?.requiredSections,
    };

    // 5. Call copywriter
    const copywriterOutput = await runCopywriter(copywriterInput);

    // 6. Call orchestrator to generate PageJSON
    const registrySummary = {
      components: Object.keys(componentRegistry),
      categories: Array.from(
        new Set(
          Object.values(componentRegistry).map((entry) => entry.category)
        )
      ),
    };

    let pageJSON = await generateOrchestratorJSON({
      copywriterOutput,
      intent: fullIntent,
      registrySummary,
      questionFocus: fullIntent.questionFocus,
      // Intent-driven layout strategy
      audienceIntent: intentProfile?.intent,
      preferredComponents: layoutStrategy?.preferredComponents,
    });

    // If orchestrator returned null or empty, create a minimal fallback PageJSON
    // User asked a question - we should ALWAYS return something
    if (!pageJSON || !pageJSON.page || !pageJSON.page.blocks || pageJSON.page.blocks.length === 0) {
      // Create a minimal fallback answer
      pageJSON = {
        version: "1.0",
        page: {
          id: `answer-${Date.now()}`,
          kind: "answer",
          blocks: [
            {
              id: "fallback-answer",
              component: "ContentSection",
              props: {
                eyebrow: "AI · Generated Response",
                headline: "Answer",
                body: "I'm working on generating a detailed answer for your question. Please try rephrasing or asking a more specific question.",
              },
            },
          ],
        },
      };
    }

    return pageJSON;
  } catch (error) {
    
    // Even on error, if answerMode is "full" or "brief", return a fallback answer
    // User asked a question - we should ALWAYS try to provide something
    if (routedIntent.answerMode === "full" || routedIntent.answerMode === "brief") {
      console.warn("[Pipeline] Error occurred but answerMode requires answer, creating error fallback");
      return {
        version: "1.0",
        page: {
          id: `answer-error-${Date.now()}`,
          kind: "answer",
          blocks: [
            {
              id: "error-answer",
              component: "ContentSection",
              props: {
                eyebrow: "AI · Generated Response",
                headline: "Unable to Generate Full Answer",
                body: `I encountered an issue while generating an answer: ${error instanceof Error ? error.message : String(error)}. Please try rephrasing your question or contact support if this persists.`,
              },
            },
          ],
        },
      };
    }
    
    return null;
  }
}

