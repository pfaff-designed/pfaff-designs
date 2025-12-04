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
      eyebrow: "My Story",
      headline: "My Story",
      body: "I grew up teaching myself how to make things. I learned guitar on my own when I was young and spent years playing in a DIY band, which taught me a lot about problem solving and figuring things out with limited tools.<br><br>Later on, I went into marketing, then moved into UX and design, and eventually found my way into engineering because I wanted to build the things I was sketching. Before I ever wrote real code, I was the person who took on digital projects at work — building websites for a real-estate company and project-managing an app for a coffee roaster. Those early projects weren't sophisticated, but they made something click. I wanted to understand how everything fit together: the design, the logic, the decisions, the experience.<br><br>That curiosity led me to pursue an MBA in Experience Design. It gave me a more structured way of thinking about the work — how people move through an interface, how teams collaborate, and how to shape a product so everyone is building toward the same idea.",
      variant: "2-column-image-right",
      imageSrc: getPublicStorageURL(SUPABASE_MEDIA_BUCKET, "profile-pic-8.JPEG"),
      imageAlt: "Design engineer working on AI-powered interfaces",
    },
    {
      eyebrow: "What I Do",
      headline: "What I Do",
      body: "I build front-end systems and interfaces that adapt to context and feel like they've always worked that way.<br><br>My work usually sits where design, engineering, and retrieval-based AI meet. It is the part of the project where small decisions make a big difference and where the system needs enough structure for the AI to behave predictably.<br><br>I've worked with teams at Capital One, Coca-Cola, PMI, and others on projects where the interface carries part of the experience instead of just displaying content.",
      variant: "2-column-image-left",
      imageSrc: getPublicStorageURL(SUPABASE_MEDIA_BUCKET, "what-i-do-2.png"),
      imageAlt: "Collaborative design and engineering process",
    },
    // {
    //   eyebrow: "What Gets My Attention",
    //   headline: "What Gets My Attention",
    //   body: "I like projects where the interface just works and lets people focus on what they came to do. When the interactions feel natural and the visuals add just enough polish without becoming the point, the whole product feels easier to use. That balance of simple, useful, and quietly elegant design is what I try to build.",
    //   variant: "default",
    // },
    {
      eyebrow: "How I Work With AI",
      headline: "How I Work With AI",
      body: "AI only works well when the instructions are clear, so I define the rules and structure before I let it do anything.<br><br>I map out user journeys, write scope documents, and create diagrams that outline the shape of the project. This helps keep the work aligned and avoids unnecessary guesswork.<br><br>From there, I define the tech stack, the architectural patterns, and the rules for how the agents communicate and validate their output. Once the foundation is in place, I use AI for roadmapping, exploration, and breaking down work. I design in Figma, then build in Cursor, often having agents reason through ideas or debug within the constraints I set.<br><br>The goal is to build systems that feel consistent and intentional, even when AI is part of the process.",
      variant: "2-column-image-right",
      imageSrc: getPublicStorageURL(SUPABASE_MEDIA_BUCKET, "ai-workflow-4.png"),
      imageAlt: "Modern development tools and technologies",
      imageObjectFit: "contain",
      imageAspectRatio: "auto",
    },
    // {
    //   eyebrow: "How I Work",
    //   headline: "How I Work",
    //   body: "I'm collaborative and straightforward. My background makes it easy to move between design, engineering, and strategy, I like to keep everyone aligned on what we're building. I value clear communication, shared understanding, and a steady pace. I like digging into the hard parts early and keeping the work focused.",
    //   variant: "default",
    // },
    {
      eyebrow: "",
      headline: "Let's Connect",
      body: "If you think I might be a good fit for your project, feel free to get in touch.",
      variant: "2-column-image-left",
      imageSrc: getPublicStorageURL(SUPABASE_MEDIA_BUCKET, "contact.jpg"),
      imageAlt: "Contact illustration",
      imageObjectFit: "cover",
      imageAspectRatio: "auto",
    },
  ],
};

