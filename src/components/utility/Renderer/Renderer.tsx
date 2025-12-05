"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { getComponent, hasComponent, isValidChild, componentRegistry } from "@/lib/registry/componentRegistry";
import { ResponseContext, type ResponseContextValue } from "./ResponseContext";

export interface Block {
  id: string;
  component: string;
  props?: Record<string, any>;
  children?: Block[];
  text?: string; // For simple text content
}

/**
 * Validate props for media components
 * Enforces media-specific rendering rules per specification
 */
const validateMediaProps = (
  componentName: string,
  props: Record<string, any>
): { valid: boolean; error?: string } => {
  // Video component validation
  if (componentName === "Video") {
    // If autoplay is true, muted must be true (spec requirement)
    if (props.autoplay === true && props.muted !== true) {
      return {
        valid: false,
        error: "Video with autoplay must have muted=true for accessibility and browser compatibility.",
      };
    }
    // If autoplay is false and no poster provided, warn (not error, but best practice)
    if (props.autoplay === false && !props.poster && !props.src) {
      // This is a warning, not an error, so we'll log it but allow rendering
      console.warn(
        `Video component "${props.alt || "unnamed"}" should have a poster image when autoplay is false.`
      );
    }
  }

  // MediaGallery validation
  if (componentName === "MediaGallery") {
    if (props.items && Array.isArray(props.items)) {
      // If exactly 2 items, suggest SideBySideMedia instead (spec: 2-item gallery → SideBySideMedia)
      if (props.items.length === 2) {
        console.warn(
          "MediaGallery with exactly 2 items should use SideBySideMedia component instead (per specification)."
        );
      }
    }
  }

  // MediaFigure validation
  if (componentName === "MediaFigure") {
    // If caption exists, MediaFigure is correct (spec: caption → wrap in MediaFigure)
    // This is already handled correctly, just validate structure
    if (props.caption && typeof props.caption !== "string") {
      return {
        valid: false,
        error: "MediaFigure caption must be a string.",
      };
    }
  }

  return { valid: true };
};

/**
 * Validate props for unexpected keys
 * Checks for common issues like typos or invalid prop names
 */
const validatePropsKeys = (
  componentName: string,
  props: Record<string, any>
): { valid: boolean; warnings: string[] } => {
  const warnings: string[] = [];
  const propKeys = Object.keys(props);

  // Common typos or invalid prop names
  const commonIssues: Record<string, string> = {
    src: "ImageContainer uses 'imageSrc', not 'src'",
    image: "Use 'imageSrc' prop instead of 'image'",
    text: "Heading uses 'text' prop, BodyText uses 'body' prop",
  };

  // Check for common issues
  for (const [key, message] of Object.entries(commonIssues)) {
    if (propKeys.includes(key)) {
      // Only warn for ImageContainer with 'src' prop
      if (key === "src" && componentName === "ImageContainer") {
        warnings.push(message);
      }
    }
  }

  // Check for required props based on component type
  if (componentName === "ImageContainer" && !props.imageSrc && !props.alt) {
    warnings.push("ImageContainer should have 'imageSrc' and 'alt' props.");
  }

  if (componentName === "Video" && !props.src && !props.alt) {
    warnings.push("Video should have 'src' and 'alt' props.");
  }

  return { valid: warnings.length === 0, warnings };
};

export interface PageData {
  id: string;
  kind: string;
  blocks: Block[];
}

export interface PageJSON {
  version: string;
  page: PageData;
}

export interface RendererProps {
  data: PageJSON | null;
  className?: string;
  status?: "idle" | "loading" | "success" | "error";
  responseId?: string | number;
  isLatest?: boolean;
}

/**
 * Error block component for rendering errors
 */
const ErrorBlock: React.FC<{ title: string; details?: string }> = ({ title, details }) => (
  <div className="p-6 border border-red-300 bg-red-50 rounded-md">
    <h3 className="text-lg font-semibold text-red-800 mb-2">{title}</h3>
    {details && <p className="text-sm text-red-600">{details}</p>}
  </div>
);

/**
 * Recursively render a single block
 * Enforces validation rules per specification:
 * - Component existence in registry
 * - Alt text requirement for media components
 * - Parent-child relationship validation
 * - Media-specific props validation
 * - Props keys validation
 */
const normalizeProps = (name: string, props: Record<string, any> = {}): Record<string, any> => {
  const p = { ...props };

  switch (name) {
    case "Heading":
      if (p.title && !p.text) p.text = p.title;
      if (p.headline && !p.text) p.text = p.headline;
      // Convert children (if string or array with string) to text prop
      if (!p.text && p.children) {
        if (typeof p.children === "string") {
          p.text = p.children;
        } else if (Array.isArray(p.children) && p.children.length > 0 && typeof p.children[0] === "string") {
          p.text = p.children[0];
        } else if (Array.isArray(p.children) && p.children.length > 0) {
          // Try to extract text from first element if it's an object
          const firstChild = p.children[0];
          if (firstChild && typeof firstChild === "object" && firstChild.text) {
            p.text = firstChild.text;
          }
        }
      }
      // Filter out non-DOM props that shouldn't be spread onto the element
      delete p.listItems;
      delete p.children; // Heading uses 'text' prop, not 'children'
      break;

    case "BodyText":
      if (p.copy && !p.body) p.body = p.copy;
      if (p.text && !p.body) p.body = p.text;
      // Convert children (if string or array with string) to body prop
      if (!p.body && p.children) {
        if (typeof p.children === "string") {
          p.body = p.children;
        } else if (Array.isArray(p.children) && p.children.length > 0 && typeof p.children[0] === "string") {
          p.body = p.children[0];
        } else if (Array.isArray(p.children) && p.children.length > 0) {
          // Try to extract text from first element if it's an object
          const firstChild = p.children[0];
          if (firstChild && typeof firstChild === "object" && firstChild.body) {
            p.body = firstChild.body;
          } else if (firstChild && typeof firstChild === "object" && firstChild.text) {
            p.body = firstChild.text;
          }
        }
      }
      // Filter out non-DOM props that shouldn't be spread onto the element
      delete p.listItems;
      delete p.children; // BodyText uses 'body' prop, not 'children'
      break;

    case "ContentSection":
      if (!p.variant) p.variant = "full-width";
      
      // Normalize image props: imageUrl → imageSrc (standardized name)
      if (p.imageUrl && !p.imageSrc) {
        p.imageSrc = p.imageUrl;
      }
      if (p.src && !p.imageSrc) {
        p.imageSrc = p.src;
      }
      
      // Normalize text props: convert old prop names to standardized names
      // title → headline
      if (p.title && !p.headline) {
        p.headline = p.title;
      }
      // description → body
      if (p.description && !p.body) {
        p.body = p.description;
      }
      // subtitle → eyebrow
      if (p.subtitle && !p.eyebrow) {
        p.eyebrow = p.subtitle;
      }
      // quote → body (if body not already set)
      if (p.quote && !p.body) {
        p.body = p.quote;
      }
      
      // Normalize left/right image props for half-and-half-column variant
      if (p.leftImageUrl && !p.leftImageSrc) {
        p.leftImageSrc = p.leftImageUrl;
      }
      if (p.rightImageUrl && !p.rightImageSrc) {
        p.rightImageSrc = p.rightImageUrl;
      }
      
      // Section image props (projectSlug and sectionIndex) are set during block preprocessing
      // No need to add them here as they're already in props
      
      // Clean up old prop names
      delete p.title;
      delete p.description;
      delete p.subtitle;
      delete p.quote;
      delete p.imageUrl;
      delete p.leftImageUrl;
      delete p.rightImageUrl;
      delete p.contentBlocks; // TwoColumnImage now uses headline/body directly
      break;

    case "ImageContainer":
      if (p.src && !p.imageSrc) p.imageSrc = p.src;
      break;

    case "AnswerBlock":
      // Normalize prop names for AnswerBlock
      // heading is already correct, but ensure it exists
      if (p.title && !p.heading) {
        p.heading = p.title;
      }
      // body is already correct
      // eyebrow is already correct
      // imageId should be resolved to imageSrc by orchestrator, but handle fallback
      if (p.imageId && !p.imageSrc) {
        // imageId should have been resolved by orchestrator, but if not, we can't resolve it here
        // Just ensure imageSrc takes precedence
      }
      // Clean up old prop names
      delete p.title;
      break;
  }

  return p;
};


/**
 * Extract project slug from page ID
 * Handles patterns like "project-slug" or "pmi-project-slug"
 * The page ID is typically the project slug directly from the orchestrator
 */
const extractProjectSlug = (pageId: string | undefined, pageKind: string | undefined): string | undefined => {
  if (!pageId || pageKind !== "case_study") {
    return undefined;
  }
  
  // Try to extract slug from page ID
  // Common patterns: "project-slug", "pmi-project-slug", "page-project-slug", etc.
  // Remove common prefixes if present
  let slug = pageId
    .replace(/^pmi-/, "")
    .replace(/^case-study-/, "")
    .replace(/^page-/, "")
    .trim();
  
  return slug || undefined;
};

const renderBlock = (block: Block, parentComponent?: string): React.ReactNode => {
  const { id, component: componentName, props = {}, children = [], text } = block;

  // Check if component exists in registry
  if (!hasComponent(componentName)) {
    console.error(`Component "${componentName}" not found in registry`);
    return (
      <ErrorBlock
        key={id}
        title={`Component Not Found: ${componentName}`}
        details={`The component "${componentName}" is not registered in the component registry.`}
      />
    );
  }

  // Enforce alt text requirement for media components (architecture requirement)
  const mediaComponents = ["ImageContainer", "Video", "MediaFigure"];
  if (mediaComponents.includes(componentName)) {
    if (!props.alt || typeof props.alt !== "string" || props.alt.trim() === "") {
      console.error(`Component "${componentName}" missing required alt text`);
      return (
        <ErrorBlock
          key={id}
          title={`Missing Required Alt Text: ${componentName}`}
          details={`The component "${componentName}" requires an "alt" prop for accessibility.`}
        />
      );
    }
  }

  // Validate parent-child relationship if parent is provided
  if (parentComponent && !isValidChild(parentComponent, componentName)) {
    // Check if parent exists in registry before accessing
    const parentEntry = hasComponent(parentComponent) ? componentRegistry[parentComponent] : undefined;
    const allowedChildren = parentEntry?.allowedChildren || [];
    console.error(
      `Invalid child: "${componentName}" cannot be a child of "${parentComponent}". Allowed children: ${allowedChildren.join(", ") || "none"}`
    );
    // Return ErrorBlock instead of rendering invalid child (stricter validation per spec)
    return (
      <ErrorBlock
        key={id}
        title={`Invalid Child Component: ${componentName}`}
        details={`"${componentName}" cannot be a child of "${parentComponent}". Allowed children: ${allowedChildren.join(", ") || "none"}`}
      />
    );
  }

  // Validate media-specific props
  const mediaValidation = validateMediaProps(componentName, props);
  if (!mediaValidation.valid) {
    console.error(`Media props validation failed for "${componentName}": ${mediaValidation.error}`);
    return (
      <ErrorBlock
        key={id}
        title={`Invalid Media Props: ${componentName}`}
        details={mediaValidation.error}
      />
    );
  }

  // Validate props keys (check for unexpected keys and common issues)
  const propsValidation = validatePropsKeys(componentName, props);
  if (propsValidation.warnings.length > 0) {
    console.warn(`Props validation warnings for "${componentName}":`, propsValidation.warnings.join("; "));
    // Log warnings but continue rendering (non-blocking)
  }

  // Convert block's top-level text property to appropriate prop for components that don't use children
  const propsWithText = { ...props };
  if (text && typeof text === "string") {
    if (componentName === "BodyText" && !propsWithText.body && !propsWithText.text && !propsWithText.copy) {
      propsWithText.body = text;
    } else if (componentName === "Heading" && !propsWithText.text && !propsWithText.title && !propsWithText.headline) {
      propsWithText.text = text;
    }
  }

  // Normalize props based on component expectations
  const normalizedProps = normalizeProps(componentName, propsWithText);

  // Get component from registry
  const Component = getComponent(componentName);
  if (!Component) {
    return (
      <ErrorBlock
        key={id}
        title={`Component Error: ${componentName}`}
        details="Failed to retrieve component from registry."
      />
    );
  }

  // Recursively render children
  const renderedChildren = children.map((child) => renderBlock(child, componentName));

  // Combine text and rendered children
  // Note: BodyText and Heading don't accept children - they use props (body/text)
  const componentsWithoutChildren = ["BodyText", "Heading"];
  const shouldPassChildren = !componentsWithoutChildren.includes(componentName);
  
  const allChildren: React.ReactNode[] = [];
  if (shouldPassChildren && text) {
    allChildren.push(text);
  }
  if (renderedChildren.length > 0) {
    allChildren.push(...renderedChildren);
  }

  // Render component with props and children
  try {
    // Some components accept children, others don't
    if (shouldPassChildren && allChildren.length > 0) {
      return (
        <Component key={id} {...normalizedProps}>
          {allChildren}
        </Component>
      );
    } else {
      return <Component key={id} {...normalizedProps} />;
    }
  } catch (error) {
    console.error(`Error rendering component "${componentName}":`, error);
    return (
      <ErrorBlock
        key={id}
        title={`Rendering Error: ${componentName}`}
        details={error instanceof Error ? error.message : String(error)}
      />
    );
  }
};

/**
 * Renderer Component
 * Converts JSON page structure into React components
 */
export const Renderer: React.FC<RendererProps> = ({ 
  data, 
  className,
  status = "idle",
  responseId,
  isLatest = true,
}) => {
  const contextValue: ResponseContextValue = {
    status,
    responseId: responseId || data?.page?.id,
    isLatest,
  };
  
  if (!data) {
    return (
      <div 
        className={cn("flex items-center justify-center", className)}
        style={{ height: "calc(100dvh - 12rem)" }}
      >
        <div className="p-6 text-left text-text-muted max-w-[25rem]">
          <p>Hey 👋, my name is Charles, I&apos;m a design-minded engineer who builds RAG based front-ends and generative ui experiences. Thanks for visiting!</p>
        </div>
      </div>
    );
  }

  // Validate version
  if (data.version !== "1") {
    console.error("Renderer: Invalid version", data.version);
    return (
      <div className={className}>
        <ErrorBlock
          title="Invalid Version"
          details={`Expected version "1", got "${data.version}"`}
        />
      </div>
    );
  }

  // Validate page structure
  if (!data.page || !data.page.blocks || !Array.isArray(data.page.blocks)) {
    console.error("Renderer: Invalid page structure", { page: data.page, blocks: data.page?.blocks });
    return (
      <div className={className}>
        <ErrorBlock
          title="Invalid Page Structure"
          details="Page data must contain a 'blocks' array."
        />
      </div>
    );
  }

  // Extract project slug for case study pages
  const projectSlug = extractProjectSlug(data.page.id, data.page.kind);
  console.log("[Renderer] Project slug extraction:", {
    pageId: data.page.id,
    pageKind: data.page.kind,
    extractedSlug: projectSlug,
    isCaseStudy: data.page.kind === "case_study",
  });
  
  // Track section index for ContentSection components in case studies
  let sectionIndex = 0;
  
  // Helper to traverse blocks and assign section indices
  const assignSectionIndices = (blocks: Block[], context?: { projectSlug?: string }): Block[] => {
    return blocks.map((block) => {
      const newBlock = { ...block };
      
      // If this is a ContentSection in a case study, assign section index
      if (block.component === "ContentSection" && context?.projectSlug) {
        sectionIndex++;
        newBlock.props = {
          ...block.props,
          projectSlug: context.projectSlug,
          sectionIndex,
        };
        console.log("[Renderer] Assigned section props to ContentSection:", {
          blockId: block.id,
          projectSlug: context.projectSlug,
          sectionIndex,
          existingProps: Object.keys(block.props || {}),
        });
      }
      
      // Recursively process children
      if (block.children && block.children.length > 0) {
        newBlock.children = assignSectionIndices(block.children, context);
      }
      
      return newBlock;
    });
  };
  
  // Assign section indices to ContentSection blocks
  const blocksWithIndices = data.page.kind === "case_study" && projectSlug
    ? assignSectionIndices(data.page.blocks, { projectSlug })
    : data.page.blocks;

  // Render all blocks with timing
  console.time("renderer-render");
  const renderedBlocks = blocksWithIndices.map((block) => renderBlock(block));
  console.timeEnd("renderer-render");

  return (
    <ResponseContext.Provider value={contextValue}>
      <div className={className}>{renderedBlocks}</div>
    </ResponseContext.Provider>
  );
};

Renderer.displayName = "Renderer";

