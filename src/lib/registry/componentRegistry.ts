import * as React from "react";
import { ContentSection } from "@/components/page-components/ContentSection";
import { Heading } from "@/components/atoms/Heading";
import { BodyText } from "@/components/atoms/BodyText";
import { Eyebrow } from "@/components/atoms/Eyebrow";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/molecules/Card";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { ImageContainer } from "@/components/atoms/ImageContainer";
import { Video } from "@/components/atoms/Video";
import { MediaFigure } from "@/components/molecules/MediaFigure";
import { SideBySideMedia } from "@/components/molecules/SideBySideMedia";
import { MediaGallery } from "@/components/molecules/MediaGallery";

export type ComponentType = React.ComponentType<any>;

export interface RegistryEntry {
  name: string;
  component: ComponentType;
  category: "atom" | "molecule" | "organism" | "layout" | "page-component" | "utility";
  allowedChildren?: string[];
  allowedParents?: string[] | "*";
}

/**
 * Component Registry
 * Maps JSON component names to React components for the renderer
 */
export const componentRegistry: Record<string, RegistryEntry> = {
  // Page Components
  ContentSection: {
    name: "ContentSection",
    component: ContentSection,
    category: "page-component",
    allowedChildren: ["Heading", "BodyText", "Eyebrow", "ImageContainer"],
    allowedParents: "*",
  },

  // Atoms
  Heading: {
    name: "Heading",
    component: Heading,
    category: "atom",
    allowedChildren: [],
    allowedParents: "*",
  },

  BodyText: {
    name: "BodyText",
    component: BodyText,
    category: "atom",
    allowedChildren: [],
    allowedParents: "*",
  },

  Eyebrow: {
    name: "Eyebrow",
    component: Eyebrow,
    category: "atom",
    allowedChildren: [],
    allowedParents: "*",
  },

  ImageContainer: {
    name: "ImageContainer",
    component: ImageContainer,
    category: "atom",
    allowedChildren: [],
    allowedParents: "*",
  },

  Video: {
    name: "Video",
    component: Video,
    category: "atom",
    allowedChildren: [],
    allowedParents: "*",
  },

  // Molecules
  Card: {
    name: "Card",
    component: Card,
    category: "molecule",
    allowedChildren: ["CardHeader", "CardContent", "CardFooter", "CardTitle", "CardDescription"],
    allowedParents: "*",
  },

  CardHeader: {
    name: "CardHeader",
    component: CardHeader,
    category: "molecule",
    allowedChildren: ["CardTitle", "CardDescription"],
    allowedParents: ["Card"],
  },

  CardContent: {
    name: "CardContent",
    component: CardContent,
    category: "molecule",
    allowedChildren: ["Heading", "BodyText", "Eyebrow"],
    allowedParents: ["Card"],
  },

  CardFooter: {
    name: "CardFooter",
    component: CardFooter,
    category: "molecule",
    allowedChildren: [],
    allowedParents: ["Card"],
  },

  CardTitle: {
    name: "CardTitle",
    component: CardTitle,
    category: "molecule",
    allowedChildren: [],
    allowedParents: ["CardHeader"],
  },

  CardDescription: {
    name: "CardDescription",
    component: CardDescription,
    category: "molecule",
    allowedChildren: [],
    allowedParents: ["CardHeader"],
  },

  MediaFigure: {
    name: "MediaFigure",
    component: MediaFigure,
    category: "molecule",
    allowedChildren: [],
    allowedParents: "*",
  },

  SideBySideMedia: {
    name: "SideBySideMedia",
    component: SideBySideMedia,
    category: "molecule",
    allowedChildren: [],
    allowedParents: "*",
  },

  MediaGallery: {
    name: "MediaGallery",
    component: MediaGallery,
    category: "molecule",
    allowedChildren: [],
    allowedParents: "*",
  },

  // Layout Components
  Section: {
    name: "Section",
    component: Section,
    category: "layout",
    allowedChildren: ["Container", "ContentSection", "Heading", "BodyText"],
    allowedParents: "*",
  },

  Container: {
    name: "Container",
    component: Container,
    category: "layout",
    allowedChildren: ["ContentSection", "Heading", "BodyText", "Card"],
    allowedParents: ["Section", "*"],
  },
};

/**
 * Get a component from the registry by name
 */
export const getComponent = (name: string): ComponentType | null => {
  return componentRegistry[name]?.component || null;
};

/**
 * Check if a component exists in the registry
 */
export const hasComponent = (name: string): boolean => {
  return name in componentRegistry;
};

/**
 * Validate parent-child relationship
 */
export const isValidChild = (parentName: string, childName: string): boolean => {
  const parent = componentRegistry[parentName];
  if (!parent) return false;

  // If parent allows all children
  if (parent.allowedChildren === undefined || parent.allowedChildren.includes("*")) {
    return true;
  }

  return parent.allowedChildren.includes(childName);
};

