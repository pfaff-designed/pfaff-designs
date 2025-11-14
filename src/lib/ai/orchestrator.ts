import { anthropic } from "./client";
import { componentRegistry } from "@/lib/registry/componentRegistry";
import { resolveMediaIds, extractMediaIdsFromYAML } from "./mediaResolver";
import type { MediaResolution } from "./mediaResolver";
import yaml from "js-yaml";
import type { PageJSON, Block } from "@/components/utility/Renderer";

export interface OrchestratorInput {
  yaml: string;
  registrySummary: {
    components: string[];
    categories: string[];
  };
}

/**
 * Orchestrator Agent
 * Converts Copywriter YAML into JSON component tree
 * Only decides structure - never invents content
 */
export const generateOrchestratorJSON = async (
  input: OrchestratorInput
): Promise<PageJSON> => {
  console.time("orchestrator-total");

  const { yaml: yamlText } = input;

  try {
    // Parse YAML to understand structure (for media wiring, etc.)
    let yamlData: any;
    try {
      yamlData = yaml.load(yamlText);
    } catch (error) {
      throw new Error(`Invalid YAML: ${error}`);
    }

    // Extract and resolve media IDs from YAML
    const mediaIds = extractMediaIdsFromYAML(yamlText);
    console.log("Extracted media IDs from YAML:", mediaIds);
    const mediaResolutionMap = await resolveMediaIds(mediaIds);
    console.log("Resolved media map size:", mediaResolutionMap.size);
    if (mediaResolutionMap.size > 0) {
      console.log(
        "Media resolutions:",
        Array.from(mediaResolutionMap.entries()).map(([id, res]) => ({
          id,
          url: res.url,
          alt: res.alt,
        }))
      );
    }

    // Convert map to object for easier access in TS (not directly needed by LLM)
    const mediaResolutions: Record<
      string,
      { url: string; alt: string; type: string; caption?: string }
    > = {};
    mediaResolutionMap.forEach((resolution, id) => {
      mediaResolutions[id] = {
        url: resolution.url,
        alt: resolution.alt,
        type: resolution.type,
        caption: resolution.caption ?? undefined,
      };
    });

    const heroMediaId: string | undefined =
      yamlData?.media && typeof yamlData.media === "object" && yamlData.media.hero
        ? yamlData.media.hero.id
        : undefined;
    const heroMediaResolution = heroMediaId
      ? mediaResolutionMap.get(heroMediaId)
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
      const resolution = mediaResolutionMap.get(id);
      if (resolution) {
        inlineMediaQueue.push(resolution);
        usedMediaIds.add(id);
      }
    });

    galleryMediaIds.forEach((id) => {
      const resolution = mediaResolutionMap.get(id);
      if (resolution) {
        galleryMediaQueue.push(resolution);
        usedMediaIds.add(id);
      }
    });

    const fallbackMediaQueue: MediaResolution[] = [];
    mediaResolutionMap.forEach((resolution) => {
      if (!usedMediaIds.has(resolution.id)) {
        fallbackMediaQueue.push(resolution);
      }
    });

    // Get available components from registry
    const availableComponents = Object.keys(componentRegistry).join(", ");

    // Truncate YAML for the prompt to reduce token usage
    const truncatedYaml =
      yamlText.length > 4000
        ? yamlText.slice(0, 4000) + "\n# [truncated]"
        : yamlText;

    // Summarize media for the prompt instead of dumping full map
    const mediaSummary = Array.from(mediaResolutionMap.entries()).map(
      ([id, res]) => ({
        id,
        url: res.url,
        alt: res.alt,
        type: res.type,
      })
    );

    const prompt = `You are an Orchestrator Agent. Your job: convert YAML page data into a JSON component tree.

AVAILABLE COMPONENTS:
${availableComponents}

========== SIMPLE RULES ==========

1. OUTPUT FORMAT (MUST BE VALID JSON):
{
  "version": "1",
  "page": {
    "id": "<from-yaml-meta-primary_project_slug-or-page-kind>",
    "kind": "<from-yaml-kind>",
    "blocks": [ /* blocks below */ ]
  }
}

2. SECTION → LAYOUT MAPPING (THIS IS THE MAIN LOGIC):

For each section in the YAML, create: Section → Container → ContentSection

Choose ContentSection variant based on section function:

- Hero/Summary sections → "full-width" (if has hero image) OR "2-column-image-right"
- Context/Problem/Solution sections → "2-column-image-right" or "2-column-image-left" (if has image)
- Process sections → "timeline" (if sequential) OR "2-column-split"
- Outcome/Results sections → "text-with-image"
- Gallery/Media-heavy sections → "card-gallery"
- Overview/General sections → "text-with-image" or "2-column-image-right"

3. CONTENT MAPPING:

For ContentSection props (IMPORTANT - use these standardized prop names):
- ALL variants use: props.headline (string), props.body (string), props.eyebrow (string, optional), props.imageSrc, props.imageAlt
- "card-gallery": props.galleryImages = [{ url: string, alt: string }] (instead of imageSrc)
- "half-and-half-column": props.leftImageSrc, props.leftImageAlt, props.leftLabel, props.leftContent, props.rightImageSrc, props.rightImageAlt, props.rightLabel, props.rightContent
- "timeline": props.timelineItems = [{ year?: string, title: string, description: string }]

Text content mapping:
- sections[].title → props.headline
- sections[].body → props.body
- summary.one_liner or sections[].summary → props.eyebrow (optional)

4. MEDIA:

- Use MEDIA_RESOLUTIONS to map media IDs to URLs
- Set props.imageSrc and props.imageAlt on ContentSection when media exists
- For galleries, use props.galleryImages array

5. ID NAMING:

Use simple, descriptive IDs based on section function:
- "hero-section", "context-section", "problem-section", "solution-section", "outcome-section"
- NOT "approach-container" or arbitrary names

6. JSON REQUIREMENTS:

- All property names in double quotes: "version", "page", "id", "component", "props", "children"
- No trailing commas
- No comments
- Valid JSON only

========== INPUT DATA ==========

YAML_DATA:
\`\`\`yaml
${truncatedYaml}
\`\`\`

MEDIA_RESOLUTIONS:
${JSON.stringify(mediaSummary, null, 2)}

Output ONLY valid JSON, no markdown fences, no explanation.`;

    console.time("orchestrator-anthropic-call");
    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 1600,
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    console.timeEnd("orchestrator-anthropic-call");

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Anthropic");
    }

    let jsonText = content.text.trim();

    // Extract JSON from response (handle markdown code blocks, just in case)
    const jsonMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const parseJSONWithRepair = (text: string): PageJSON => {
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.warn("Initial JSON parse failed, attempting repairs:", parseError);
        let repaired = text;

        // Repair 1: Fix strings first - escape newlines and handle unterminated strings
        let result = "";
        let inString = false;
        let escapeNext = false;

        for (let i = 0; i < repaired.length; i++) {
          const char = repaired[i];

          if (escapeNext) {
            result += char;
            escapeNext = false;
            continue;
          }

          if (char === "\\") {
            result += char;
            escapeNext = true;
            continue;
          }

          if (char === '"') {
            inString = !inString;
            result += char;
            continue;
          }

          if (inString) {
            if (char === "\n") {
              result += "\\n";
            } else if (char === "\r") {
              result += "\\r";
            } else if (char === "\t") {
              result += "\\t";
            } else {
              result += char;
            }
          } else {
            result += char;
          }
        }

        repaired = result;

        // Repair 2: Fix unquoted property names (only outside strings)
        repaired = repaired.replace(
          /([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g,
          '$1"$2":'
        );

        // Repair 3: Fix missing commas in arrays / objects
        repaired = repaired.replace(/("\s*)(?=")/g, '$1,'); // String followed by string
        repaired = repaired.replace(/("\s*)(?=\{)/g, '$1,'); // String followed by object
        repaired = repaired.replace(/(\}\s*)(?=\{)/g, '$1,'); // Object followed by object
        repaired = repaired.replace(/(\}\s*)(?=")/g, '$1,'); // Object followed by string
        repaired = repaired.replace(/(\]\s*)(?=\[)/g, '$1,'); // Array followed by array
        repaired = repaired.replace(/(\]\s*)(?=\{)/g, '$1,'); // Array followed by object
        repaired = repaired.replace(/(\]\s*)(?=")/g, '$1,'); // Array followed by string
        repaired = repaired.replace(/(\d+\s*)(?=")/g, '$1,'); // Number followed by string
        repaired = repaired.replace(/(\d+\s*)(?=\{)/g, '$1,'); // Number followed by object
        repaired = repaired.replace(/(true\s*)(?=")/g, '$1,'); // true followed by string
        repaired = repaired.replace(/(false\s*)(?=")/g, '$1,'); // false followed by string
        repaired = repaired.replace(/(null\s*)(?=")/g, '$1,'); // null followed by string

        // Repair 4: Remove trailing commas
        repaired = repaired.replace(/,(\s*[}\]])/g, "$1");

        try {
          const parsed = JSON.parse(repaired);
          console.log("JSON successfully parsed after repairs.");
          return parsed;
        } catch (repairError) {
          console.error("JSON repair failed:", repairError);
          const errorPos =
            repairError instanceof Error &&
            repairError.message.match(/position (\d+)/)
              ? parseInt(
                  repairError.message.match(/position (\d+)/)![1],
                  10
                )
              : 0;
          const start = Math.max(0, errorPos - 200);
          const end = Math.min(repaired.length, errorPos + 200);
          console.error(
            "Problem area in repaired text:",
            repaired.substring(start, end)
          );
          throw new Error(
            `Failed to parse JSON even after repairs. Original: ${
              parseError instanceof Error ? parseError.message : String(parseError)
            }. Repair: ${
              repairError instanceof Error ? repairError.message : String(repairError)
            }`
          );
        }
      }
    };

    const result: PageJSON = parseJSONWithRepair(jsonText);

    // Validate structure
    if (!result.version || !result.page || !result.page.blocks) {
      throw new Error("Invalid JSON structure from Orchestrator");
    }

    // ==== Post-processing helpers ====

    const extractTextContent = (child?: Block): string | undefined => {
      if (!child || !child.props) return undefined;
      const { body, text, children } = child.props;
      if (typeof body === "string" && body.trim()) return body.trim();
      if (typeof text === "string" && text.trim()) return text.trim();
      if (typeof children === "string" && children.trim()) return children.trim();
      if (Array.isArray(children)) {
        const joined = children
          .filter((value) => typeof value === "string")
          .join(" ")
          .trim();
        return joined || undefined;
      }
      return undefined;
    };

    const normalizeContentSectionProps = (block: Block): void => {
      if (block.component !== "ContentSection") return;
      block.props = block.props || {};
      const children = block.children || [];
      const consumed = new Set<string>();

      const consumeChild = (child?: Block): string | undefined => {
        if (!child) return undefined;
        const text = extractTextContent(child);
        consumed.add(child.id);
        return text;
      };

      // Extract text from children and populate standardized props
      // All variants now use: headline, body, eyebrow
      
      if (!block.props.headline) {
        const headingChild = children.find(
          (child) => child.component === "Heading"
        );
        const headingText = extractTextContent(headingChild);
        if (headingText) {
          block.props.headline = headingText;
          if (headingChild) consumed.add(headingChild.id);
        }
      }

      if (!block.props.eyebrow) {
        const eyebrowChild = children.find(
          (child) => child.component === "Eyebrow"
        );
        const eyebrowText = extractTextContent(eyebrowChild);
        if (eyebrowText && eyebrowChild) {
          block.props.eyebrow = eyebrowText;
          consumed.add(eyebrowChild.id);
        }
      }

      if (!block.props.body) {
        const bodyChildren = children.filter(
          (child) => child.component === "BodyText"
        );
        if (bodyChildren.length > 0) {
          // Combine all body text children into one body string
          const bodyTexts = bodyChildren
            .map((child) => extractTextContent(child))
            .filter((text): text is string => !!text);
          if (bodyTexts.length > 0) {
            block.props.body = bodyTexts.join(" ");
            bodyChildren.forEach((child) => consumed.add(child.id));
          }
        }
      }

      if (consumed.size > 0) {
        block.children = block.children?.filter(
          (child) => !consumed.has(child.id)
        );
      }
    };

    const assignImageToContentSection = (block: Block): void => {
      if (block.component !== "ContentSection") return;
      block.props = block.props || {};
      // Check for imageSrc (standardized) or imageUrl (legacy)
      if (block.props.imageSrc || block.props.imageUrl) {
        console.log(
          `ContentSection ${block.id} already has image:`,
          block.props.imageSrc || block.props.imageUrl
        );
        // Normalize imageUrl to imageSrc if needed
        if (block.props.imageUrl && !block.props.imageSrc) {
          block.props.imageSrc = block.props.imageUrl;
          delete block.props.imageUrl;
        }
        return;
      }

      if (
        block.props.variant === "full-width" &&
        heroMediaResolution &&
        !heroMediaConsumed
      ) {
        block.props.imageSrc = heroMediaResolution.url;
        block.props.imageAlt = heroMediaResolution.alt;
        heroMediaConsumed = true;
        console.log(
          `Assigned hero media to ContentSection ${block.id}:`,
          heroMediaResolution.url
        );
        return;
      }

      const source =
        inlineMediaQueue.shift() ||
        galleryMediaQueue.shift() ||
        fallbackMediaQueue.shift();

      if (source) {
        block.props.imageSrc = source.url;
        block.props.imageAlt = source.alt;
        console.log(
          `Assigned media to ContentSection ${block.id}:`,
          source.url
        );
      } else {
        // Fallback: placeholder image so ContentSection always has an image for testing
        block.props.imageSrc =
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=60";
        block.props.imageAlt = "Placeholder image";
        console.warn(
          `No media available for ContentSection ${block.id}, using placeholder image`
        );
      }
    };

    const ensureContentSectionVariant = (block: Block): void => {
      if (block.component === "ContentSection") {
        block.props = block.props || {};
        const hasHeroMedia =
          !!block.props.imageSrc ||
          !!block.props.imageUrl ||
          !!block.props.heroMedia ||
          !!block.props.backgroundImage;

        if (!block.props.variant) {
          block.props.variant = hasHeroMedia
            ? "full-width"
            : "2-column-image-right";
        } else if (block.props.variant === "full-width" && !hasHeroMedia) {
          block.props.variant = "2-column-image-right";
        }

        normalizeContentSectionProps(block);
        assignImageToContentSection(block);
      }

      if (block.children) {
        block.children.forEach(ensureContentSectionVariant);
      }
    };

    // Resolve any leftover mediaId props directly on media components
    const resolveMediaInBlock = (block: Block): void => {
      if (block.props) {
        if (block.props.mediaId && typeof block.props.mediaId === "string") {
          const resolution = mediaResolutionMap.get(block.props.mediaId);
          if (resolution) {
            delete block.props.mediaId;
            if (
              block.component === "ImageContainer" ||
              block.component === "MediaFigure"
            ) {
              block.props.imageSrc = resolution.url;
              block.props.alt = resolution.alt;
            } else if (block.component === "Video") {
              block.props.src = resolution.url;
              block.props.alt = resolution.alt;
            }
          }
        }
      }

      if (block.children) {
        block.children.forEach(resolveMediaInBlock);
      }
    };

    // Validate, normalize variants, and resolve media for every block
    const validateBlock = (block: Block): void => {
      if (!componentRegistry[block.component]) {
        throw new Error(
          `Component "${block.component}" not found in registry`
        );
      }

      ensureContentSectionVariant(block);
      resolveMediaInBlock(block);

      if (block.children) {
        block.children.forEach(validateBlock);
      }
    };

    result.page.blocks.forEach(validateBlock);

    // Debug log for ContentSection image props
    const logContentSections = (blocks: Block[]): void => {
      blocks.forEach((block) => {
        if (block.component === "ContentSection") {
          console.log(`ContentSection ${block.id}:`, {
            variant: block.props?.variant,
            headline: block.props?.headline,
            body: block.props?.body,
            eyebrow: block.props?.eyebrow,
            imageSrc: block.props?.imageSrc,
            imageAlt: block.props?.imageAlt,
            hasChildren: (block.children?.length || 0) > 0,
          });
        }
        if (block.children) {
          logContentSections(block.children);
        }
      });
    };
    logContentSections(result.page.blocks);

    console.timeEnd("orchestrator-total");
    return result;
  } catch (error) {
    console.timeEnd("orchestrator-total");
    console.error("Error generating orchestrator JSON:", error);
    throw error;
  }
};