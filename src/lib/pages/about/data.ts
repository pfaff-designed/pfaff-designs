import type { AboutPageData } from "./types";
import { SUPABASE_MEDIA_BUCKET } from "@/lib/media/registry";
import { getPublicStorageURL } from "@/lib/supabase/storage";

/**
 * About Page Data
 * Static content for the about page
 */
export const aboutPageData: AboutPageData = {
  sections: [
    {
      eyebrow: "About",
      headline: "AI, by design",
      body: "I'm a front-end engineer and technologist who specializes in building scalable AI products using generative UI. My work sits at the intersection of design, engineering, and applied AI—I help teams translate complex AI capabilities into intuitive, user-focused experiences. I've worked with companies like Capital One, building modular component systems and RAG-driven interfaces that make AI feel natural and accessible.",
      variant: "2-column-image-right",
      imageSrc: getPublicStorageURL(SUPABASE_MEDIA_BUCKET, "about/intro.jpg"),
      imageAlt: "Design engineer working on AI-powered interfaces",
    },
    {
      eyebrow: "How I work",
      headline: "Better together",
      body: "I believe the best products come from close collaboration between design, engineering, and product teams. My workflow starts with understanding user needs and design intent, then translating those into flexible, maintainable code. I focus on building component systems that are both beautiful and extensible, ensuring that design decisions scale across teams and products. Whether working with React, TypeScript, or integrating AI capabilities, I prioritize clarity, consistency, and user experience.",
      variant: "2-column-image-left",
      imageSrc: getPublicStorageURL(SUPABASE_MEDIA_BUCKET, "about/collaboration.jpg"),
      imageAlt: "Collaborative design and engineering process",
    },
    {
      eyebrow: "Skills & Tools",
      headline: "Building with modern tools",
      body: "I work primarily with React, TypeScript, and Next.js to build scalable front-end applications. I'm experienced with design systems, component architecture, and integrating AI capabilities into user interfaces. My toolkit includes modern CSS (Tailwind), state management, API integration, and working with AI models and RAG systems. I'm comfortable working across the full stack when needed, and I prioritize writing clean, maintainable code that scales with teams and products.",
      variant: "text-with-image",
      imageSrc: getPublicStorageURL(SUPABASE_MEDIA_BUCKET, "about/skills.jpg"),
      imageAlt: "Modern development tools and technologies",
    },
  ],
};

