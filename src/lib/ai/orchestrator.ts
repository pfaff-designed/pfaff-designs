// orchestrator.ts
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { z } from "zod";
import { componentRegistry } from "@/lib/registry/componentRegistry";
import { resolveMediaIds, extractMediaIdsFromYAML } from "./mediaResolver";
import type { MediaResolution } from "./mediaResolver";
import { validateSupabaseURL } from "@/lib/utils/urlValidation";
import yaml from "js-yaml";
import type { PageJSON, Block } from "@/components/utility/Renderer";
import { traceable } from "langsmith/traceable";

// Configure LangSmith tracing for LangChain
// This will automatically trace if LANGSMITH_API_KEY is set
if (process.env.LANGSMITH_API_KEY) {
  process.env.LANGCHAIN_TRACING_V2 = "true";
  process.env.LANGCHAIN_PROJECT = process.env.LANGSMITH_PROJECT || "pr-potable-commitment-61";
  if (process.env.LANGSMITH_API_URL) {
    process.env.LANGCHAIN_ENDPOINT = process.env.LANGSMITH_API_URL;
  }
}

export interface OrchestratorInput {
  yaml: string;
  registrySummary: {
    components: string[];
    categories: string[];
  };
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

const layoutPlanParser = StructuredOutputParser.fromZodSchema(layoutPlanSchema);

const layoutPlanPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    [
      "You are a layout planner for a portfolio website.",
      "Given a list of sections and their roles, choose a ContentSection variant for each section.",
      "You must return JSON that matches the provided JSON schema exactly.",
      "",
      "Rules:",
      "- Use at most 3 different variants per page to keep layouts coherent.",
      "- Avoid using the same variant more than 2 times in a row.",
      "- Prefer:",
      "  • summary/hero → full-width (if hasMedia) or 2-column-image-right",
      "  • context/problem/solution → 2-column-image-right / 2-column-image-left",
      "  • process → timeline or 2-column-split",
      "  • outcome/results → text-with-image",
      "  • media-heavy (mediaCount >= 3) → card-gallery",
      "",
      "IMPORTANT: You only choose variants + which section may use hero media.",
      "Do NOT invent text. Do NOT invent components outside the given variants.",
    ].join("\n"),
  ],
  [
    "user",
    [
      "Here is the page plan (derived from YAML):",
      "```json",
      "{pagePlan}",
      "```",
      "",
      "Return a JSON object matching this schema:",
      "{format_instructions}",
    ].join("\n"),
  ],
]);

const layoutPlannerChain = RunnableSequence.from([
  layoutPlanPrompt,
  new ChatAnthropic({
    model: "claude-3-5-haiku-latest",
    temperature: 0.4,
    maxTokens: 800,
    // LangSmith tracing is automatically enabled via environment variables
  }),
  layoutPlanParser,
]).withConfig({
  // Add run name for better tracking in LangSmith
  runName: "layout-planner",
  tags: ["orchestrator", "layout-planning"],
});

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
    ? yamlData.sections.map((section: any, index: number): PagePlanSection => {
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
      })
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

function buildPageJSONFromLayoutPlan(
  layoutPlan: LayoutPlan,
  yamlData: any,
  mediaResolutionMap: Map<string, MediaResolution>
): PageJSON {
  const blocks: Block[] = [];

  // --- placeholder config (Supabase-only) ---
  const PLACEHOLDER_IMAGE_SRC =
    process.env.NEXT_PUBLIC_SUPABASE_PLACEHOLDER_IMAGE_URL ?? "";
  const PLACEHOLDER_IMAGE_ALT = "Placeholder case study image";
  
  // Default fallback placeholder (allowed by urlValidation)
  const DEFAULT_PLACEHOLDER_URL = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=60";

  // Validate placeholder URL is from Supabase if provided, or use default fallback
  // Always returns a valid placeholder (either configured or default)
  const getPlaceholder = (): { url: string; alt: string } => {
    // If a placeholder is configured, validate it
    if (PLACEHOLDER_IMAGE_SRC) {
      if (!validateSupabaseURL(PLACEHOLDER_IMAGE_SRC)) {
        console.error(
          `Invalid placeholder image URL (not from Supabase): ${PLACEHOLDER_IMAGE_SRC}. ` +
          `Only Supabase URLs are allowed. Falling back to default placeholder.`
        );
        // Fall through to use default placeholder
      } else {
        return { url: PLACEHOLDER_IMAGE_SRC, alt: PLACEHOLDER_IMAGE_ALT };
      }
    }
    
    // Use default placeholder if none configured or if configured one is invalid
    console.warn("No Supabase placeholder image configured. Using default placeholder. Set NEXT_PUBLIC_SUPABASE_PLACEHOLDER_IMAGE_URL to use a custom placeholder.");
    return { url: DEFAULT_PLACEHOLDER_URL, alt: PLACEHOLDER_IMAGE_ALT };
  };
  
  // Validate that a media resolution URL is from Supabase
  const validateMediaResolution = (resolution: MediaResolution | null): MediaResolution | null => {
    if (!resolution) return null;
    
    if (!validateSupabaseURL(resolution.url)) {
      console.error(
        `Invalid media URL (not from Supabase): ${resolution.url} for media ID: ${resolution.id}. ` +
        `Only Supabase URLs are allowed. This media will be skipped.`
      );
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
    const resolution = validateMediaResolution(mediaResolutionMap.get(id) || null);
    if (resolution) {
      inlineMediaQueue.push(resolution);
      usedMediaIds.add(id);
    }
  });

  galleryMediaIds.forEach((id) => {
    const resolution = validateMediaResolution(mediaResolutionMap.get(id) || null);
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

  // Log media queue status
  console.log(`Media queues built:`, {
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
  });

  const takeNextMedia = (opts?: { forceHero?: boolean }): MediaResolution | null => {
    // Try hero media first if requested
    if (opts?.forceHero && heroMediaResolution && !heroMediaConsumed) {
      heroMediaConsumed = true;
      // Validate hero media is from Supabase
      if (validateSupabaseURL(heroMediaResolution.url)) {
        console.log(`takeNextMedia: Returning hero media`, {
          mediaId: heroMediaResolution.id,
          url: heroMediaResolution.url.substring(0, 100),
        });
        return heroMediaResolution;
      } else {
        console.error(
          `Invalid hero media URL (not from Supabase): ${heroMediaResolution.url}. Skipping hero media.`
        );
      }
    }

    // Log queue status
    console.log(`takeNextMedia: Queue status:`, {
      inlineQueueLength: inlineMediaQueue.length,
      galleryQueueLength: galleryMediaQueue.length,
      fallbackQueueLength: fallbackMediaQueue.length,
      totalAvailable: inlineMediaQueue.length + galleryMediaQueue.length + fallbackMediaQueue.length,
    });

    // Try to get media from queues, validating each one
    // Limit attempts to prevent infinite loop
    const maxAttempts = 50; // Safety limit
    let attempts = 0;

    while (attempts < maxAttempts) {
      const source =
        inlineMediaQueue.shift() ||
        galleryMediaQueue.shift() ||
        fallbackMediaQueue.shift();

      if (!source) {
        // No more media available
        console.warn(`takeNextMedia: No more media available in queues`);
        return null;
      }

      // Validate the source URL is from Supabase before returning
      if (validateSupabaseURL(source.url)) {
        console.log(`takeNextMedia: Returning valid media`, {
          mediaId: source.id,
          url: source.url.substring(0, 100),
          queue: source === inlineMediaQueue[0] ? 'inline' : source === galleryMediaQueue[0] ? 'gallery' : 'fallback',
        });
        return source;
      } else {
        console.error(
          `Invalid media URL (not from Supabase): ${source.url} for media ID: ${source.id}. Skipping this media.`
        );
        attempts++;
        // Continue to next iteration to try next media item
      }
    }

    // Reached max attempts, return null
    console.warn(
      `Reached max attempts (${maxAttempts}) while trying to get valid Supabase media. No valid media found.`
    );
    return null;
  };

  // --- 2) Build blocks from layout plan + YAML, assigning images ---

  layoutPlan.sections.forEach((sectionPlan, index) => {
    const yamlSection =
      Array.isArray(yamlData?.sections) &&
      yamlData.sections.find(
        (s: any, i: number) =>
          s.id === sectionPlan.id || s.slug === sectionPlan.id || i === index
      );

    const sectionId = sectionPlan.id || `section-${index}`;

    const title = yamlSection?.title || yamlSection?.heading;
    const body =
      typeof yamlSection?.body === "string"
        ? yamlSection.body
        : Array.isArray(yamlSection?.body)
        ? yamlSection.body.join("\n\n")
        : "";
    const eyebrow =
      yamlSection?.summary ||
      yamlSection?.eyebrow ||
      yamlData?.summary?.one_liner ||
      undefined;

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

      // Collect gallery media (validate each one is from Supabase)
      while (galleryMediaQueue.length > 0) {
        const m = galleryMediaQueue.shift()!;
        if (validateSupabaseURL(m.url)) {
          galleryItems.push({ url: m.url, alt: m.alt });
        } else {
          console.error(`Invalid gallery media URL (not from Supabase): ${m.url}. Skipping.`);
        }
      }

      // If no gallery items, try to get media from other queues
      if (galleryItems.length === 0) {
        const media = shouldUseHero
          ? takeNextMedia({ forceHero: true })
          : takeNextMedia();
        if (media && validateSupabaseURL(media.url)) {
          galleryItems.push({ url: media.url, alt: media.alt });
        }
      }

      // Always use placeholder if no media found (getPlaceholder() always returns a valid placeholder)
      if (galleryItems.length === 0) {
        const ph = getPlaceholder();
        galleryItems.push(ph);
        console.warn(
          `No Supabase media found for gallery section "${sectionId}". Using placeholder image.`
        );
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
        console.log(`Assigned media to section "${sectionId}":`, {
          imageSrc: media.url.substring(0, 100),
          imageAlt: media.alt,
          mediaId: media.id,
        });
      } else {
        // Always use placeholder if no media found (getPlaceholder() always returns a valid placeholder)
        const ph = getPlaceholder();
        contentSectionProps.imageSrc = ph.url;
        contentSectionProps.imageAlt = ph.alt;
        console.warn(
          `No Supabase media found for section "${sectionId}". Using placeholder image.`
        );
        console.log(`Placeholder assigned:`, {
          imageSrc: ph.url.substring(0, 100),
          imageAlt: ph.alt,
        });
      }
    }
    
    // Final check: ensure imageSrc is set if variant requires an image
    // (getPlaceholder() always returns a valid placeholder)
    const variantsRequiringImage = ["full-width", "2-column-image-right", "2-column-image-left", "text-with-image", "annotated-visual"];
    if (variantsRequiringImage.includes(sectionPlan.variant) && !contentSectionProps.imageSrc) {
      const ph = getPlaceholder();
      console.warn(`Variant "${sectionPlan.variant}" requires an image but none was assigned. Using placeholder.`);
      contentSectionProps.imageSrc = ph.url;
      contentSectionProps.imageAlt = ph.alt;
    }

    // Log final props before creating block
    console.log(`ContentSection block "${sectionId}" final props:`, {
      variant: contentSectionProps.variant,
      hasImageSrc: !!contentSectionProps.imageSrc,
      imageSrc: contentSectionProps.imageSrc ? contentSectionProps.imageSrc.substring(0, 100) : null,
      imageAlt: contentSectionProps.imageAlt,
      headline: contentSectionProps.headline ? contentSectionProps.headline.substring(0, 50) : null,
      body: contentSectionProps.body ? contentSectionProps.body.substring(0, 50) : null,
      eyebrow: contentSectionProps.eyebrow,
      allProps: Object.keys(contentSectionProps),
    });

    const contentSectionBlock: Block = {
      id: `${sectionId}-content`,
      component: "ContentSection",
      props: contentSectionProps,
      children: [],
    };

    containerBlock.children!.push(contentSectionBlock);
    sectionBlock.children!.push(containerBlock);
    blocks.push(sectionBlock);
  });

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

// ---- Main Orchestrator ----

const generateOrchestratorJSONInternal = async (
  input: OrchestratorInput
): Promise<PageJSON> => {
  console.time("orchestrator-total");

  const { yaml: yamlText } = input;

  try {
    let yamlData: any;
    try {
      yamlData = yaml.load(yamlText);
    } catch (error) {
      throw new Error(`Invalid YAML: ${error}`);
    }

    const mediaIds = extractMediaIdsFromYAML(yamlText);
    const mediaResolutionMap = await resolveMediaIds(mediaIds);

    const pagePlan = buildPagePlanFromYaml(yamlData);

    console.time("orchestrator-layout-plan");
    const layoutPlan = await layoutPlannerChain.invoke({
      pagePlan: JSON.stringify(pagePlan, null, 2),
      format_instructions: layoutPlanParser.getFormatInstructions(),
    });
    console.timeEnd("orchestrator-layout-plan");

    const result = buildPageJSONFromLayoutPlan(
      layoutPlan,
      yamlData,
      mediaResolutionMap
    );

    // Validate components via registry
    const validateBlock = (block: Block): void => {
      if (!componentRegistry[block.component]) {
        throw new Error(
          `Component "${block.component}" not found in registry`
        );
      }
      if (block.children) {
        block.children.forEach(validateBlock);
      }
    };

    result.page.blocks.forEach(validateBlock);

    console.timeEnd("orchestrator-total");
    return result;
  } catch (error) {
    console.timeEnd("orchestrator-total");
    console.error("Error generating orchestrator JSON:", error);
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