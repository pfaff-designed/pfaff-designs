// orchestrator.ts
import { z } from "zod";
import { resolveMediaIds } from "./mediaResolver";
import type { MediaResolution } from "./mediaResolver";
import { validateSupabaseURL } from "@/lib/utils/urlValidation";
import type { PageJSON, Block } from "@/components/utility/Renderer";
import { traceable } from "langsmith/traceable";
import type { QuestionFocus, IntentResult } from "./intentResolver";
import { logToLangSmith, logDiagnostic } from "./langsmithLogger";
import { getHeroFacts } from "@/lib/kb/CaseStudyHeroFacts";
import { HeroCaseStudyBlockSchema, type Block as SchemaBlock } from "@/lib/layout/blockSchema";
import type { CopywriterOutput } from "./copywriterSchemas";

// Configure LangSmith tracing for LangChain
// This will automatically trace if LANGSMITH_API_KEY is set
if (process.env.LANGSMITH_API_KEY) {
  process.env.LANGCHAIN_TRACING_V2 = "true";
  process.env.LANGCHAIN_PROJECT =
    process.env.LANGSMITH_PROJECT || "pr-potable-commitment-61";
  if (process.env.LANGSMITH_API_URL) {
    process.env.LANGCHAIN_ENDPOINT = process.env.LANGSMITH_API_URL;
  }
}

export interface OrchestratorInput {
  copywriterOutput: CopywriterOutput;
  intent: IntentResult;
  registrySummary: {
    components: string[];
    categories: string[];
  };
  questionFocus?: QuestionFocus;
  // Intent-driven layout strategy
  audienceIntent?: "recruiter" | "hiring_manager" | "client" | "general";
  preferredComponents?: string[];
}

// ---- Layout planner schemas ----

const layoutPlanSectionSchema = z.object({
  id: z.string(),
  variant: z.enum([
    "full-width",
    "2-column-image-right",
    "2-column-image-left",
    "2-column-split",
    "card-gallery",
    "project-card-grid",
    "text-with-image",
    "annotated-visual",
    "half-and-half-column",
    "timeline",
  ]),
  useHeroMedia: z.boolean().optional(),
});

const layoutPlanSchema = z.object({
  pageId: z.string(),
  kind: z.string(),
  sections: z.array(layoutPlanSectionSchema),
});

export type LayoutPlan = z.infer<typeof layoutPlanSchema>;
export type LayoutPlanSection = z.infer<typeof layoutPlanSectionSchema>;

// ---- Types for TS-only planning ----

type PagePlanSection = {
  id: string;
  title?: string;
  type: string;
  hasMedia: boolean;
  mediaCount: number;
};

type PagePlan = {
  pageId: string;
  kind: string;
  sections: PagePlanSection[];
};

function buildPagePlanFromYaml(yamlData: any): PagePlan {
  const meta = yamlData?.meta || {};
  const kind = yamlData?.kind || "case_study";

  const sections: PagePlanSection[] = Array.isArray(yamlData?.sections)
    ? yamlData.sections.map(
        (section: any, index: number): PagePlanSection => {
          const type =
            section.type ||
            section.kind ||
            (index === 0 ? "summary" : "generic-section");

          const mediaArray: any[] = Array.isArray(section.media)
            ? section.media
            : [];
          const hasMedia = mediaArray.length > 0;

          return {
            id: section.id || section.slug || `section-${index}`,
            title: section.title,
            type,
            hasMedia,
            mediaCount: mediaArray.length,
          };
        }
      )
    : [];

  const pageId =
    meta.primary_project_slug ||
    meta.slug ||
    yamlData?.slug ||
    "page-" + (meta.id || "unknown");

  return {
    pageId,
    kind,
    sections,
  };
}

/**
 * Synthesize section content from KB data when YAML section is missing
 */
function synthesizeSectionContent(
  sectionId: string,
  yamlData: any,
  variant: string
): { title?: string; body?: string; eyebrow?: string } | null {
  const sections = Array.isArray(yamlData?.sections) ? yamlData.sections : [];
  const summary = yamlData?.summary || {};

  // For "tools" section, synthesize from skills/tech stack
  if (sectionId === "tools" || sectionId.toLowerCase().includes("tool")) {
    const project = sections.find(
      (s: any) => s.type === "solution" || s.type === "process"
    );
    const skills = yamlData?.meta?.focus || [];
    const summary = yamlData?.summary || {};

    return {
      title: "Tools & Technologies",
      body:
        skills.length > 0
          ? `Technologies used: ${skills.join(", ")}. ${
              project?.body || summary?.elevator_pitch || ""
            }`
          : project?.body ||
            summary?.elevator_pitch ||
            "Key technologies and tools used in this project.",
      eyebrow: summary?.one_liner,
    };
  }

  // For other sections, try to find ANY section with content
  const anySection = sections.find((s: any) => s.body && s.body.trim().length > 0);
  if (anySection) {
    return {
      title: anySection.title || anySection.heading || sectionId.charAt(0).toUpperCase() + sectionId.slice(1),
      body: anySection.body || summary?.elevator_pitch || "Content for this section.",
      eyebrow: anySection.eyebrow || summary?.one_liner,
    };
  }

  // Last resort: use summary
  if (summary.elevator_pitch || summary.one_liner) {
    return {
      title: summary.title || sectionId.charAt(0).toUpperCase() + sectionId.slice(1),
      body: summary.elevator_pitch || summary.one_liner || "Content for this section.",
      eyebrow: summary.one_liner,
    };
  }

  return null;
}

function buildPageJSONFromLayoutPlan(
  layoutPlan: LayoutPlan,
  yamlData: any,
  mediaResolutionMap: Map<string, MediaResolution>,
  runId?: string
): PageJSON {
  const blocks: Block[] = [];

  // --- placeholder config (Supabase-only) ---
  const PLACEHOLDER_IMAGE_SRC =
    process.env.NEXT_PUBLIC_SUPABASE_PLACEHOLDER_IMAGE_URL ?? "";
  const PLACEHOLDER_IMAGE_ALT = "Placeholder case study image";

  // Default fallback placeholder (allowed by urlValidation)
  const DEFAULT_PLACEHOLDER_URL =
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=60";

  // Always returns a valid placeholder (either configured or default)
  const getPlaceholder = (): { url: string; alt: string } => {
    if (PLACEHOLDER_IMAGE_SRC) {
      if (!validateSupabaseURL(PLACEHOLDER_IMAGE_SRC)) {
        logToLangSmith("warn", `Invalid placeholder image URL (not from Supabase): ${PLACEHOLDER_IMAGE_SRC}. Only Supabase URLs are allowed. Falling back to default placeholder.`, { placeholderUrl: PLACEHOLDER_IMAGE_SRC }, runId);
        // Fall through to default
      } else {
        return { url: PLACEHOLDER_IMAGE_SRC, alt: PLACEHOLDER_IMAGE_ALT };
      }
    }

    logToLangSmith("warn", "No Supabase placeholder image configured. Using default placeholder. Set NEXT_PUBLIC_SUPABASE_PLACEHOLDER_IMAGE_URL to use a custom placeholder.", { placeholderUrl: DEFAULT_PLACEHOLDER_URL }, runId);
    return { url: DEFAULT_PLACEHOLDER_URL, alt: PLACEHOLDER_IMAGE_ALT };
  };

  const validateMediaResolution = (
    resolution: MediaResolution | null
  ): MediaResolution | null => {
    if (!resolution) return null;

    if (!validateSupabaseURL(resolution.url)) {
      logToLangSmith("error", `Invalid media URL (not from Supabase): ${resolution.url} for media ID: ${resolution.id}. Only Supabase URLs are allowed. This media will be skipped.`, { mediaId: resolution.id, mediaUrl: resolution.url }, runId);
      return null;
    }

    return resolution;
  };

  // --- 1) Build media queues (hero / inline / gallery / fallback) ---

  const heroMediaId: string | undefined =
    yamlData?.media &&
    typeof yamlData.media === "object" &&
    yamlData.media.hero
      ? yamlData.media.hero.id
      : undefined;

  const heroMediaResolution = heroMediaId
    ? validateMediaResolution(mediaResolutionMap.get(heroMediaId) || null)
    : undefined;

  let heroMediaConsumed = false;

  const inlineMediaIds = new Set<string>();
  const galleryMediaIds = new Set<string>();

  if (yamlData?.media) {
    if (Array.isArray(yamlData.media.inline)) {
      yamlData.media.inline.forEach((entry: any) => {
        if (entry?.id) inlineMediaIds.add(entry.id);
      });
    }
    if (Array.isArray(yamlData.media.gallery)) {
      yamlData.media.gallery.forEach((entry: any) => {
        if (entry?.id) galleryMediaIds.add(entry.id);
      });
    }
  }

  if (Array.isArray(yamlData?.sections)) {
    yamlData.sections.forEach((section: any) => {
      if (Array.isArray(section?.media)) {
        section.media.forEach((entry: any) => {
          if (entry?.id) inlineMediaIds.add(entry.id);
        });
      }
    });
  }

  const inlineMediaQueue: MediaResolution[] = [];
  const galleryMediaQueue: MediaResolution[] = [];
  const usedMediaIds = new Set<string>();

  if (heroMediaId) usedMediaIds.add(heroMediaId);

  inlineMediaIds.forEach((id) => {
    const resolution = validateMediaResolution(
      mediaResolutionMap.get(id) || null
    );
    if (resolution) {
      inlineMediaQueue.push(resolution);
      usedMediaIds.add(id);
    }
  });

  galleryMediaIds.forEach((id) => {
    const resolution = validateMediaResolution(
      mediaResolutionMap.get(id) || null
    );
    if (resolution) {
      galleryMediaQueue.push(resolution);
      usedMediaIds.add(id);
    }
  });

  const fallbackMediaQueue: MediaResolution[] = [];
  mediaResolutionMap.forEach((resolution) => {
    if (!usedMediaIds.has(resolution.id)) {
      const validated = validateMediaResolution(resolution);
      if (validated) {
        fallbackMediaQueue.push(validated);
      }
    }
  });

  logDiagnostic("media-queues", {
    heroMedia: heroMediaResolution ? {
      id: heroMediaResolution.id,
      url: heroMediaResolution.url.substring(0, 100),
      valid: validateSupabaseURL(heroMediaResolution.url),
    } : null,
    inlineQueueSize: inlineMediaQueue.length,
    galleryQueueSize: galleryMediaQueue.length,
    fallbackQueueSize: fallbackMediaQueue.length,
    totalMediaResolved: mediaResolutionMap.size,
    usedMediaIds: Array.from(usedMediaIds),
  }, runId);

  const takeNextMedia = (opts?: { forceHero?: boolean }): MediaResolution | null => {
    // Try hero media first if requested
    if (opts?.forceHero && heroMediaResolution && !heroMediaConsumed) {
      heroMediaConsumed = true;
      if (validateSupabaseURL(heroMediaResolution.url)) {
        logToLangSmith("info", `takeNextMedia: Returning hero media`, { mediaId: heroMediaResolution.id, mediaUrl: heroMediaResolution.url.substring(0, 100) }, runId);
        return heroMediaResolution;
      } else {
        logToLangSmith("error", `Invalid hero media URL (not from Supabase): ${heroMediaResolution.url}. Skipping hero media.`, { mediaId: heroMediaResolution.id, mediaUrl: heroMediaResolution.url }, runId);
      }
    }

    logToLangSmith("info", `takeNextMedia: Queue status:`, {
      inlineQueueLength: inlineMediaQueue.length,
      galleryQueueLength: galleryMediaQueue.length,
      fallbackQueueLength: fallbackMediaQueue.length,
      totalAvailable:
        inlineMediaQueue.length +
        galleryMediaQueue.length +
        fallbackMediaQueue.length,
    }, runId);

    const maxAttempts = 50;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const source =
        inlineMediaQueue.shift() ||
        galleryMediaQueue.shift() ||
        fallbackMediaQueue.shift();

      if (!source) {
        logToLangSmith("warn", `takeNextMedia: No more media available in queues`, { maxAttempts: maxAttempts, attempts: attempts }, runId);
        return null;
      }

      if (validateSupabaseURL(source.url)) {
        logToLangSmith("info", `takeNextMedia: Returning valid media`, { mediaId: source.id, mediaUrl: source.url.substring(0, 100) }, runId);
        return source;
      } else {
        logToLangSmith("error", `Invalid media URL (not from Supabase): ${source.url} for media ID: ${source.id}. Skipping this media.`, { mediaId: source.id, mediaUrl: source.url }, runId);
        attempts++;
      }
    }

    logToLangSmith("warn", `Reached max attempts (${maxAttempts}) while trying to get valid Supabase media. No valid media found.`, { maxAttempts: maxAttempts, attempts: attempts }, runId);
    return null;
  };

  // --- 2) Build blocks from layout plan + YAML, assigning images ---

  for (let index = 0; index < layoutPlan.sections.length; index++) {
    const sectionPlan = layoutPlan.sections[index];
    let yamlSection: any = null;

    if (Array.isArray(yamlData?.sections)) {
      // Strategy 1: Exact ID / slug match
      yamlSection = yamlData.sections.find(
        (s: any) => s.id === sectionPlan.id || s.slug === sectionPlan.id
      );

      // Strategy 2: Type match (e.g., "outcome" vs "outcomes")
      if (!yamlSection) {
        yamlSection = yamlData.sections.find((s: any) => {
          const type = (s.type || "").toLowerCase();
          const planId = (sectionPlan.id || "").toLowerCase();
          if (!type || !planId) return false;
          return (
            type === planId ||
            planId.includes(type) ||
            type.includes(planId) ||
            // Handle plural/singular variations
            (planId === "outcomes" && type === "outcome") ||
            (planId === "outcome" && type === "outcomes")
          );
        });
      }

      // Strategy 3: Sequential matching - match by position in canonical order
      if (!yamlSection && sectionPlan.id !== "hero") {
        // Canonical section order: context, problem, solution, process, outcome, reflections
        const canonicalOrder = ["context", "problem", "solution", "process", "outcome", "reflections"];
        const planIndex = canonicalOrder.indexOf(sectionPlan.id);
        if (planIndex >= 0) {
          // Find sections in the same order, skipping hero
          const nonHeroSections = yamlData.sections.filter(
            (s: any) => s.id !== "hero" && s.type !== "hero"
          );
          if (planIndex < nonHeroSections.length) {
            yamlSection = nonHeroSections[planIndex];
          }
        }
      }

      // Strategy 4: Index-based fallback (last resort)
      if (!yamlSection && sectionPlan.id !== "hero") {
        const sectionIndex = layoutPlan.sections.findIndex(
          (s) => s.id === sectionPlan.id
        );
        // Use the section at the same index in YAML (accounting for hero)
        const nonHeroSections = yamlData.sections.filter(
          (s: any) => s.id !== "hero" && s.type !== "hero"
        );
        const yamlIndex = sectionIndex - 1; // -1 because hero is first in layout plan
        if (yamlIndex >= 0 && yamlIndex < nonHeroSections.length) {
          yamlSection = nonHeroSections[yamlIndex];
        }
      }
    }

    const sectionId = sectionPlan.id || `section-${index}`;

    // Log section matching
    if (sectionPlan.id !== "hero") {
      logDiagnostic("section-matching", {
        sectionPlanId: sectionPlan.id,
        foundYamlSection: !!yamlSection,
        yamlSectionId: yamlSection?.id,
        yamlSectionType: yamlSection?.type,
        availableSections: Array.isArray(yamlData?.sections)
          ? yamlData.sections.map((s: any) => ({ id: s.id, type: s.type }))
          : [],
      }, runId);
    }

    // Extract content with fallbacks
    let title = yamlSection?.title || yamlSection?.heading;
    let body =
      typeof yamlSection?.body === "string"
        ? yamlSection.body
        : Array.isArray(yamlSection?.body)
        ? yamlSection.body.join("\n\n")
        : "";
    let eyebrow =
      yamlSection?.summary ||
      yamlSection?.eyebrow ||
      yamlData?.summary?.one_liner ||
      undefined;

    // Fallback: synthesize when missing
    if (!yamlSection && sectionPlan.id !== "hero") {
      const synthesized = synthesizeSectionContent(
        sectionPlan.id,
        yamlData,
        sectionPlan.variant
      );
      if (synthesized) {
        title = synthesized.title || title;
        body = synthesized.body || body;
        eyebrow = synthesized.eyebrow || eyebrow;
      }
    }

    // Final fallback: if still no content, use a default
    if (!title && !body && sectionPlan.id !== "hero") {
      title = sectionPlan.id.charAt(0).toUpperCase() + sectionPlan.id.slice(1);
      body = `Content for the ${sectionPlan.id} section.`;
    }
    
    // For hero, ensure we have at least something
    if (sectionPlan.id === "hero" && !body) {
      body = yamlData?.summary?.elevator_pitch || 
             yamlData?.summary?.one_liner || 
             "Welcome to this case study.";
    }

    // Log content extraction
    logDiagnostic("content-extraction", {
      sectionId,
      title: title || "(empty)",
      bodyLength: body?.length || 0,
      bodyPreview: body ? body.substring(0, 100) : "(empty)",
      eyebrow: eyebrow || "(none)",
      synthesized: !yamlSection && sectionPlan.id !== "hero",
    }, runId);

    const sectionBlock: Block = {
      id: `${sectionId}-section`,
      component: "Section",
      props: {},
      children: [],
    };

    const containerBlock: Block = {
      id: `${sectionId}-container`,
      component: "Container",
      props: {},
      children: [],
    };

    // Check if this section should be an answer_block
    const isAnswerBlock = yamlSection?.type === "answer_block";

    if (isAnswerBlock) {
      // Generate AnswerBlock instead of ContentSection
      const answerBlockProps: any = {
        eyebrow: eyebrow || yamlSection?.eyebrow,
        heading: title || yamlSection?.heading || yamlSection?.title || "",
        body: body || yamlSection?.body || "",
      };

      // Resolve image from imageId if provided
      if (yamlSection?.imageId) {
        const imageResolution = validateMediaResolution(
          mediaResolutionMap.get(yamlSection.imageId) || null
        );
        if (imageResolution && validateSupabaseURL(imageResolution.url)) {
          answerBlockProps.imageSrc = imageResolution.url;
          answerBlockProps.imageAlt = imageResolution.alt || answerBlockProps.heading || "Answer block image";
        }
      } else {
        // Try to get media from section media array
        const media = takeNextMedia();
        if (media && validateSupabaseURL(media.url)) {
          answerBlockProps.imageSrc = media.url;
          answerBlockProps.imageAlt = media.alt || answerBlockProps.heading || "Answer block image";
        }
      }

      const answerBlock: Block = {
        id: `${sectionId}-answer`,
        component: "AnswerBlock",
        props: answerBlockProps,
        children: [],
      };

      blocks.push(answerBlock);
      continue; // Skip the ContentSection creation for answer_block
    }

    const contentSectionProps: any = {
      variant: sectionPlan.variant,
      headline: title,
      body,
      eyebrow,
    };

    const shouldUseHero =
      (sectionPlan.useHeroMedia === true ||
        (index === 0 && sectionPlan.variant === "full-width")) &&
      !!heroMediaResolution &&
      !heroMediaConsumed;

    // --- Gallery variant ---
    if (sectionPlan.variant === "card-gallery") {
      const galleryItems: { url: string; alt: string }[] = [];

      // Collect gallery media
      while (galleryMediaQueue.length > 0) {
        const m = galleryMediaQueue.shift()!;
        if (validateSupabaseURL(m.url)) {
          galleryItems.push({ url: m.url, alt: m.alt });
        } else {
          logToLangSmith("error", `Invalid gallery media URL (not from Supabase): ${m.url}. Skipping.`, { mediaId: m.id, mediaUrl: m.url }, runId);
        }
      }

      if (galleryItems.length === 0) {
        const media = shouldUseHero
          ? takeNextMedia({ forceHero: true })
          : takeNextMedia();
        if (media && validateSupabaseURL(media.url)) {
          galleryItems.push({ url: media.url, alt: media.alt });
        }
      }

      if (galleryItems.length === 0) {
        const ph = getPlaceholder();
        galleryItems.push(ph);
        logToLangSmith("warn", `No Supabase media found for gallery section "${sectionId}". Using placeholder image.`, { sectionId: sectionId }, runId);
      }

      contentSectionProps.galleryImages = galleryItems;
      if (galleryItems.length > 0) {
        contentSectionProps.imageSrc = galleryItems[0].url;
        contentSectionProps.imageAlt = galleryItems[0].alt;
      }
    } else {
      // --- Regular variants ---
      const media = shouldUseHero
        ? takeNextMedia({ forceHero: true })
        : takeNextMedia();

      if (media && validateSupabaseURL(media.url)) {
        contentSectionProps.imageSrc = media.url;
        contentSectionProps.imageAlt = media.alt;
        logToLangSmith("info", `Assigned media to section "${sectionId}":`, { imageSrc: media.url.substring(0, 100), imageAlt: media.alt, mediaId: media.id }, runId);
      } else {
        const ph = getPlaceholder();
        contentSectionProps.imageSrc = ph.url;
        contentSectionProps.imageAlt = ph.alt;
        logToLangSmith("warn", `No Supabase media found for section "${sectionId}". Using placeholder image.`, { sectionId: sectionId }, runId);
        logToLangSmith("info", `Placeholder assigned:`, { imageSrc: ph.url.substring(0, 100), imageAlt: ph.alt }, runId);
      }
    }

    const variantsRequiringImage = [
      "full-width",
      "2-column-image-right",
      "2-column-image-left",
      "text-with-image",
      "annotated-visual",
    ];
    if (
      variantsRequiringImage.includes(sectionPlan.variant) &&
      !contentSectionProps.imageSrc
    ) {
      const ph = getPlaceholder();
      logToLangSmith("warn", `Variant "${sectionPlan.variant}" requires an image but none was assigned. Using placeholder.`, { sectionId: sectionId, variant: sectionPlan.variant }, runId);
      contentSectionProps.imageSrc = ph.url;
      contentSectionProps.imageAlt = ph.alt;
    }

    // Log final props
    logDiagnostic("section-final-props", {
      sectionId,
      variant: contentSectionProps.variant,
      headline: contentSectionProps.headline || "(empty)",
      bodyLength: contentSectionProps.body?.length || 0,
      hasImageSrc: !!contentSectionProps.imageSrc,
      allProps: Object.keys(contentSectionProps),
    }, runId);

    const contentSectionBlock: Block = {
      id: `${sectionId}-content`,
      component: "ContentSection",
      props: contentSectionProps,
      children: [],
    };

    containerBlock.children!.push(contentSectionBlock);
    sectionBlock.children!.push(containerBlock);
    blocks.push(sectionBlock);
  }

  // Log summary
  logDiagnostic("page-rendering-summary", {
    pageId: layoutPlan.pageId,
    kind: layoutPlan.kind,
    totalSections: layoutPlan.sections.length,
    totalBlocks: blocks.length,
    sectionsWithContent: blocks.filter((block) => {
      const contentBlock = block.children?.[0]?.children?.[0];
      return contentBlock?.props?.headline || contentBlock?.props?.body;
    }).length,
  }, runId);

  const page: PageJSON["page"] = {
    id: layoutPlan.pageId,
    kind: layoutPlan.kind,
    blocks,
  };

  return {
    version: "1",
    page,
  };
}

/**
 * Ensure hero section exists in YAML data
 * (You want all case studies / overview pages to start with a hero)
 */
function ensureHeroSection(yamlData: any): any {
  const root = yamlData && typeof yamlData === "object" ? yamlData : {};
  const summary = root.summary || {};
  const media = root.media || {};

  // Try to get hero content from existing sections if summary is empty
  let heroTitle = summary.title;
  let heroBody = summary.elevator_pitch || summary.one_liner;
  
  // If summary is empty, try to get content from first section
  if (!heroTitle || !heroBody) {
    const sections = Array.isArray(root.sections) ? root.sections : [];
    const firstSection = sections.find((s: any) => s.type !== "hero") || sections[0];
    if (firstSection) {
      heroTitle = heroTitle || firstSection.title || firstSection.heading || "Overview";
      heroBody = heroBody || firstSection.body || firstSection.summary || "";
    }
  }

  const heroSection = {
    id: "hero",
    type: "hero",
    title: heroTitle || "Overview",
    body: heroBody || "",
    media: media.hero ? [media.hero] : [],
  };

  const sections = Array.isArray(root.sections) ? root.sections : [];
  const withoutExistingHero = sections.filter(
    (s: any) => s.id !== "hero" && s.type !== "hero"
  );

  return {
    ...root,
    summary: {
      ...summary,
      title: heroTitle || summary.title,
      elevator_pitch: heroBody || summary.elevator_pitch,
      one_liner: heroBody || summary.one_liner,
    },
    sections: [heroSection, ...withoutExistingHero],
  };
}

// ---- Layout Recipe Types ----

type LayoutRecipeArgs = {
  layoutPlanBase: {
    pageId: string;
    kind: string;
  };
  yamlData: any;
  mediaResolutionMap: Map<string, MediaResolution>;
  questionFocus: QuestionFocus;
};

type LayoutRecipe = (args: LayoutRecipeArgs) => PageJSON;

// ---- Layout Recipes ----

/**
 * Case study overview recipe (canonical full case study)
 */
const caseStudyOverviewRecipe: LayoutRecipe = ({
  layoutPlanBase,
  yamlData,
  mediaResolutionMap,
}) => {
  const yamlWithHero = ensureHeroSection(yamlData);

  const layoutPlan: LayoutPlan = {
    pageId: layoutPlanBase.pageId,
    kind: layoutPlanBase.kind,
    sections: [
      { id: "hero", variant: "full-width", useHeroMedia: true },
      { id: "context", variant: "2-column-image-right" },
      { id: "problem", variant: "2-column-image-left" },
      { id: "solution", variant: "2-column-image-right" },
      { id: "process", variant: "timeline" },
      { id: "outcome", variant: "text-with-image" },
      { id: "reflections", variant: "half-and-half-column" },
    ],
  };

  return buildPageJSONFromLayoutPlan(
    layoutPlan,
    yamlWithHero,
    mediaResolutionMap
  );
};

/**
 * Case study tools recipe
 */
const caseStudyToolsRecipe: LayoutRecipe = ({
  layoutPlanBase,
  yamlData,
  mediaResolutionMap,
}) => {
  const yamlWithHero = ensureHeroSection(yamlData);

  const layoutPlan: LayoutPlan = {
    pageId: `${layoutPlanBase.pageId}-tools`,
    kind: layoutPlanBase.kind,
    sections: [
      { id: "hero", variant: "full-width", useHeroMedia: true },
      { id: "tools", variant: "2-column-split" },
      { id: "solution", variant: "2-column-image-right" },
      { id: "process", variant: "timeline" },
    ],
  };

  return buildPageJSONFromLayoutPlan(
    layoutPlan,
    yamlWithHero,
    mediaResolutionMap
  );
};

/**
 * Case study process recipe
 */
const caseStudyProcessRecipe: LayoutRecipe = ({
  layoutPlanBase,
  yamlData,
  mediaResolutionMap,
}) => {
  const yamlWithHero = ensureHeroSection(yamlData);

  const layoutPlan: LayoutPlan = {
    pageId: `${layoutPlanBase.pageId}-process`,
    kind: layoutPlanBase.kind,
    sections: [
      { id: "hero", variant: "full-width", useHeroMedia: true },
      { id: "context", variant: "2-column-image-right" },
      { id: "process", variant: "timeline" },
      { id: "outcome", variant: "text-with-image" },
    ],
  };

  return buildPageJSONFromLayoutPlan(
    layoutPlan,
    yamlWithHero,
    mediaResolutionMap
  );
};

/**
 * Case study outcomes recipe
 */
const caseStudyOutcomesRecipe: LayoutRecipe = ({
  layoutPlanBase,
  yamlData,
  mediaResolutionMap,
}) => {
  const yamlWithHero = ensureHeroSection(yamlData);

  const layoutPlan: LayoutPlan = {
    pageId: `${layoutPlanBase.pageId}-outcomes`,
    kind: layoutPlanBase.kind,
    sections: [
      { id: "hero", variant: "full-width", useHeroMedia: true },
      { id: "solution", variant: "2-column-image-left" },
      { id: "outcome", variant: "text-with-image" },
      { id: "reflections", variant: "half-and-half-column" },
    ],
  };

  return buildPageJSONFromLayoutPlan(
    layoutPlan,
    yamlWithHero,
    mediaResolutionMap
  );
};

/**
 * Case study reflections recipe
 */
const caseStudyReflectionsRecipe: LayoutRecipe = ({
  layoutPlanBase,
  yamlData,
  mediaResolutionMap,
}) => {
  const yamlWithHero = ensureHeroSection(yamlData);

  const layoutPlan: LayoutPlan = {
    pageId: `${layoutPlanBase.pageId}-reflections`,
    kind: layoutPlanBase.kind,
    sections: [
      { id: "hero", variant: "full-width", useHeroMedia: true },
      { id: "process", variant: "timeline" },
      { id: "reflections", variant: "half-and-half-column" },
      { id: "outcome", variant: "text-with-image" },
    ],
  };

  return buildPageJSONFromLayoutPlan(
    layoutPlan,
    yamlWithHero,
    mediaResolutionMap
  );
};

// ---- Recipe Selector ----

const layoutRecipes: Record<string, LayoutRecipe> = {
  "case_study:overview": caseStudyOverviewRecipe,
  "case_study:tools": caseStudyToolsRecipe,
  "case_study:process": caseStudyProcessRecipe,
  "case_study:outcomes": caseStudyOutcomesRecipe,
  "case_study:reflections": caseStudyReflectionsRecipe,
  // You can add "overview:*", "skills:*", etc. later
};

function getLayoutRecipe(
  pageKind: string,
  questionFocus: QuestionFocus
): LayoutRecipe {
  const key = `${pageKind}:${questionFocus}`;
  const recipe = layoutRecipes[key];

  if (recipe) {
    return recipe;
  }

  // For now, any missing combo falls back to the full case study layout
  return caseStudyOverviewRecipe;
}

// ---- Main Orchestrator (canonical layout) ----

const generateOrchestratorJSONInternal = async (
  input: OrchestratorInput
): Promise<PageJSON> => {
  console.time("orchestrator-total");
  
  // Get run ID from LangSmith context if available
  const runId = (global as any).__langsmith_run_id || "orchestrator-run";

  const { copywriterOutput, intent, audienceIntent, preferredComponents } = input;

  try {
    // Log intent and layout strategy for debugging
    if (audienceIntent || preferredComponents) {
      logDiagnostic("orchestrator-intent-strategy", {
        audienceIntent: audienceIntent || "none",
        preferredComponents: preferredComponents || [],
        availableComponents: input.registrySummary.components.slice(0, 10), // Log first 10
      }, runId);
    }

    // CopywriterOutput is already validated, so we can use it directly
    const answerBlocks = copywriterOutput.answer_blocks;
    
    if (!Array.isArray(answerBlocks) || answerBlocks.length === 0) {
      logToLangSmith("warn", "No answer_blocks found in CopywriterOutput", { 
        copywriterOutput: JSON.stringify(copywriterOutput, null, 2).substring(0, 1000),
        answerBlocksLength: answerBlocks.length,
      }, runId);
      throw new Error("Copywriter must return at least one answer_block.");
    }

    // TODO: In the future, use preferredComponents to:
    // 1. Filter or reorder answer blocks based on intent
    // 2. Map answer blocks to different component types (e.g., Card for recruiter, ContentSection for hiring_manager)
    // 3. Adjust layout structure based on intent (e.g., grid for recruiter, stack for hiring_manager)
    // For now, we maintain the current deterministic mapping: answer_block → AnswerBlock component

    // Determine projectId from intent (no longer from YAML meta)
    const projectId = intent.topic?.projectSlug || null;

    // Build blocks array (using schema Block type)
    const blocks: SchemaBlock[] = [];

    // Add hero block if projectId exists
    if (projectId) {
      const heroFacts = await getHeroFacts(projectId);
      if (heroFacts) {
        const heroBlock = HeroCaseStudyBlockSchema.parse({
          type: "hero_case_study",
          ...heroFacts,
          imageId: undefined, // Hero images can be added later if needed
        });
        blocks.push(heroBlock);
      } else {
        logToLangSmith("warn", `Hero facts not found for projectId: ${projectId}`, { projectId }, runId);
      }
    }

    // Add answer blocks
    answerBlocks.forEach((answerBlock) => {
      blocks.push(answerBlock);
    });

    // Resolve media IDs for answer blocks
    const mediaIds = new Set<string>();
    answerBlocks.forEach((block) => {
      if (block.imageId) {
        mediaIds.add(block.imageId);
      }
    });

    const mediaResolutionMap = await resolveMediaIds(Array.from(mediaIds));

    // Build PageJSON - map block types to component names
    const pageId = projectId || intent.pageKind || "general";
    const page: PageJSON["page"] = {
      id: pageId,
      kind: intent.pageKind,
      blocks: blocks.map((block, index) => {
        // Map schema block type to Renderer Block format
        if (block.type === "hero_case_study") {
          return {
            id: `hero-${index}`,
            component: "CaseStudyHero",
            props: {
              projectId: block.projectId,
              client: block.client,
              projectNameOrUrl: block.projectNameOrUrl,
              role: block.role,
              description: block.description,
              yearOrTimeline: block.yearOrTimeline,
              team: block.team,
            },
            children: [],
          } as Block;
        } else if (block.type === "answer_block") {
          // Resolve imageId to imageSrc if present
          let imageSrc: string | undefined;
          let imageAlt: string | undefined;
          if (block.imageId) {
            const media = mediaResolutionMap.get(block.imageId);
            if (media && validateSupabaseURL(media.url)) {
              imageSrc = media.url;
              imageAlt = media.alt || block.heading;
            }
          }
          return {
            id: `answer-block-${index}`,
            component: "AnswerBlock",
            props: {
              eyebrow: block.eyebrow,
              heading: block.heading,
              body: block.body,
              imageId: block.imageId,
              imageSrc,
              imageAlt,
            },
            children: [],
          } as Block;
        }
        // Fallback (should not happen)
        return {
          id: `block-${index}`,
          component: "BodyText",
          props: { body: "Unknown block type" },
          children: [],
        } as Block;
      }),
    };

    const result: PageJSON = {
      version: "1",
      page,
    };

    // Note: Blocks are already validated as SchemaBlocks before conversion to Renderer format
    // The Renderer Block format uses 'component' instead of 'type', so we don't validate here
    // Schema validation happens earlier when parsing answer_blocks and hero blocks

    logDiagnostic("orchestrator-result", {
      pageId: result.page.id,
      kind: result.page.kind,
      blocksCount: result.page.blocks.length,
      hasHero: result.page.blocks.some((b: any) => b.component === "CaseStudyHero"),
      answerBlocksCount: result.page.blocks.filter((b: any) => b.component === "AnswerBlock").length,
      audienceIntent: audienceIntent || "none",
      usedPreferredComponents: preferredComponents?.filter(comp => 
        result.page.blocks.some((b: any) => b.component === comp)
      ).length || 0,
    }, runId);

    console.timeEnd("orchestrator-total");
    return result;
  } catch (error) {
    console.timeEnd("orchestrator-total");
    logToLangSmith("error", "Orchestrator error", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, runId);
    throw error;
  }
};

// Export with LangSmith tracing wrapper
export const generateOrchestratorJSON = traceable(
  generateOrchestratorJSONInternal,
  {
    name: "generate-orchestrator-json",
    project_name: "pr-potable-commitment-61",
    tags: ["orchestrator", "agent"],
    metadata: {
      agent: "orchestrator",
    },
    
  }
);