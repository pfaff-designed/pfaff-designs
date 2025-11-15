import * as React from "react";
import { cn } from "@/lib/utils";
import { getComponent, hasComponent, isValidChild, componentRegistry } from "@/lib/registry/componentRegistry";

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
  }

  return p;
};

const renderBlock = (block: Block, parentComponent?: string): React.ReactNode => {
  const { id, component: componentName, props = {}, children = [], text } = block;
  
  // Debug: Log block rendering
  console.log(`Rendering block: ${componentName} (id: ${id})`, { props, childrenCount: children.length, parentComponent });

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

  // Debug: Log ContentSection props specifically
  if (componentName === "ContentSection") {
    console.log(`ContentSection ${id} props:`, {
      variant: normalizedProps.variant,
      headline: normalizedProps.headline,
      body: normalizedProps.body,
      eyebrow: normalizedProps.eyebrow,
      imageSrc: normalizedProps.imageSrc,
      imageAlt: normalizedProps.imageAlt,
      hasImageSrc: !!normalizedProps.imageSrc,
      imageSrcType: normalizedProps.imageSrc ? typeof normalizedProps.imageSrc : "none",
      imageSrcLength: normalizedProps.imageSrc ? normalizedProps.imageSrc.length : 0,
      // Original props for comparison
      originalProps: {
        headline: props.headline,
        body: props.body,
        eyebrow: props.eyebrow,
        imageSrc: props.imageSrc,
        imageUrl: props.imageUrl,
        title: props.title,
        description: props.description,
      },
      allNormalizedProps: Object.keys(normalizedProps),
    });
  }

  // Debug: Log BodyText and Heading props to see why text isn't rendering
  if (componentName === "BodyText" || componentName === "Heading") {
    console.log(`${componentName} ${id} props:`, {
      originalProps: props,
      normalizedProps: normalizedProps,
      blockText: text,
      hasBody: !!normalizedProps.body,
      hasText: !!normalizedProps.text,
      propsChildren: props.children,
    });
  }

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
export const Renderer: React.FC<RendererProps> = ({ data, className }) => {
  // Debug: Log what we receive
  console.log("Renderer received data:", data);
  if (data) {
    try {
      console.log("Renderer debug content:", JSON.stringify(data, null, 2));
    } catch (error) {
      console.warn("Renderer: Failed to stringify debug content", error);
    }
  }
  
  if (!data) {
    console.log("Renderer: No data provided");
    return (
      <div className={cn("flex items-center justify-center h-screen", className)}>
        <div className="p-6 text-center text-text-muted">
          <p>No content to display. Ask a question to get started.</p>
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

  console.log("Renderer: Rendering blocks", data.page.blocks.length, "blocks");

  // Render all blocks
  const renderedBlocks = data.page.blocks.map((block) => renderBlock(block));
  
  console.log("Renderer: Rendered blocks count", renderedBlocks.length);

  return <div className={className}>{renderedBlocks}</div>;
};

Renderer.displayName = "Renderer";

